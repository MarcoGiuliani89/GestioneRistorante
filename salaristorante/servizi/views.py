from datetime import timedelta
from django.contrib import messages
from django.shortcuts import redirect
from django.views import View
from django.views.generic.edit import FormView
from django.views.generic.list import ListView

from .forms import InizializzaServiziForm
from .exceptions import NoServizioFoundException
from .methods import (
    recupera_servizio,
    get_current_servizio_id,
    set_selected_servizio,
    precedentePasto,
    prossimoPasto,
)
from .models import Servizio, Presenza


class InizializzaServiziView(FormView):
    form_class = InizializzaServiziForm
    template_name = "servizi/inizializza_servizi.html"
    success_url = "/"

    def form_valid(self, form):
        # Creo il primo e l'ultimo servizio con i dati recuperati dalla form
        servizio, created = Servizio.objects.get_or_create(
            data=form.cleaned_data["primo_giorno"],
            pasto=int(form.cleaned_data["primo_pasto_apertura"]),
        )
        ultimo_servizio, created = Servizio.objects.get_or_create(
            data=form.cleaned_data["ultimo_giorno"],
            pasto=int(form.cleaned_data["ultimo_pasto_chiusura"]),
        )

        # Creo i servizi compresi tra il primo e l'ultimo tramite un ciclo.
        # Dopo aver creato una cena, aumento la data di un giorno
        while servizio != ultimo_servizio:
            if servizio.pasto == Servizio.CENA:
                servizio, created = Servizio.objects.get_or_create(
                    data=servizio.data + timedelta(days=1),
                    pasto=prossimoPasto(servizio.pasto),
                )
            else:
                servizio, created = Servizio.objects.get_or_create(
                    data=servizio.data, pasto=prossimoPasto(servizio.pasto)
                )
        return super().form_valid(form)


class ServizioPrecedente(View):
    def get(self, request):

        try:
            servizio_selezionato = recupera_servizio(request)

        except NoServizioFoundException:
            messages.error(
                request, "Non esistono servizi, inizializzali prima di cominciare"
            )
            return redirect("inizializza_servizi")

        pasto_precedente = precedentePasto(servizio_selezionato.pasto)

        if pasto_precedente == Servizio.CENA:
            nuova_data = servizio_selezionato.data - timedelta(days=1)
        else:
            nuova_data = servizio_selezionato.data

        # Ottieni l'ID del servizio precedente
        servizio_precedente = Servizio.objects.filter(
            data=nuova_data, pasto=pasto_precedente
        ).first()

        if not servizio_precedente:
            # Se non c'è un servizio precedente, reindirizza alla homepage
            messages.warning(
                request,
                "Il servizio precedente (${nuova_data}, pasto {pasto_successivo}) non è disponibile",
            )
            return redirect("homepage")

        # Imposta il nuovo servizio selezionato in cache
        set_selected_servizio(request.user.id, servizio_precedente.id)

        return redirect("homepage")


class ServizioSuccessivo(View):
    def get(self, request):

        try:
            servizio_selezionato = recupera_servizio(request)

        except NoServizioFoundException:
            messages.error(
                request, "Non esistono servizi, inizializzali prima di cominciare"
            )
            return redirect("inizializza_servizi")

        pasto_successivo = prossimoPasto(servizio_selezionato.pasto)

        if pasto_successivo == Servizio.COLAZIONE:
            nuova_data = servizio_selezionato.data + timedelta(days=1)
        else:
            nuova_data = servizio_selezionato.data

        # Ottieni l'ID del servizio successivo
        servizio_successivo = Servizio.objects.filter(
            data=nuova_data, pasto=pasto_successivo
        ).first()

        if not servizio_successivo:
            # Se non c'è un servizio successivo, reindirizza alla homepage
            messages.warning(
                request,
                f"Il servizio successivo (${nuova_data}, pasto {pasto_successivo}) non è disponibile",
            )
            return redirect("homepage")

        # Imposta il nuovo servizio selezionato in cache
        set_selected_servizio(request.user.id, servizio_successivo.id)

        return redirect("homepage")


class ServizioAttuale(View):
    def get(self, request):
        try:
            current_servizio_id = get_current_servizio_id()
        except NoServizioFoundException:
            servizio_alternativo = recupera_servizio(request)
            if servizio_alternativo:
                set_selected_servizio(request.user.id, servizio_alternativo.id)
                messages.warning(
                    request,
                    f"Non esiste un servizio corrispondente alla data odierna, vado a {servizio_alternativo.data} pasto{servizio_alternativo.pasto}",
                )
                return redirect("homepage")
            else:
                messages.error(
                    request, "Non esistono servizi, inizializzali prima di cominciare"
                )
                return redirect("inizializza_servizi")

        set_selected_servizio(request.user.id, current_servizio_id)
        return redirect("homepage")


class SelezionaServizioManuale(View):
    def post(self, request):
        # Recupera i dati inviati dal form
        data = request.POST.get("data")
        pasto = request.POST.get("pasto")

        # Cerca il servizio corrispondente alla data e al pasto selezionati
        servizio = Servizio.objects.filter(data=data, pasto=pasto).first()

        if servizio:
            # Se il servizio esiste, lo imposti come servizio selezionato in cache
            set_selected_servizio(request.user.id, servizio.id)
        else:
            # Se non esiste un servizio esatto, cerca il servizio più vicino alla data selezionata
            servizio_prossimo = (
                Servizio.objects.filter(data__gte=data)
                .order_by("data", "pasto")
                .first()
            )
            if servizio_prossimo:
                # Se viene trovato un servizio prossimo, lo imposti come servizio selezionato in cache
                set_selected_servizio(request.user.id, servizio_prossimo.id)
                messages.warning(
                    request,
                    "Non è stato trovato un servizio corrispondente. È stato selezionato il primo servizio successivo alla data richiesta.",
                )
            else:
                servizio_precedente = (
                    Servizio.objects.filter(data__lte=data)
                    .order_by("-data", "-pasto")
                    .first()
                )
                if servizio_precedente:
                    # Se viene trovato un servizio precedente, lo imposti come servizio selezionato in cache
                    set_selected_servizio(request.user.id, servizio_precedente.id)
                    messages.warning(
                        request,
                        "Non è stato trovato un servizio corrispondente. È stato selezionato l'ultimo servizio precedente alla data richiesta.",
                    )
                else:
                    # Se non viene trovato alcun servizio, visualizza un messaggio di errore e reindirizza alla pagina che inizializza i servizi
                    messages.error(
                        request,
                        "Non è stato trovato nessun servizio disponibile. Inizializza i servizi!",
                    )
                    return redirect("inizializza_servizi")

        # Reindirizza alla homepage
        return redirect("homepage")


class PresenzeOspiteListView(ListView):
    model = Presenza
    template_name = "servizi/presenze_ospite_list.html"
    context_object_name = "presenze"

    def get_queryset(self, **kwargs):
        return (
            Presenza.objects.filter(ospite=self.kwargs["ospite_id"])
            .select_related("servizio")
            .prefetch_related("tavoli")
        )
