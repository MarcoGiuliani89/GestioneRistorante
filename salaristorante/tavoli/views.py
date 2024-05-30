from django.contrib import messages
from django.core.exceptions import ValidationError
from django.db.models import Prefetch
from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from django.views.generic.edit import FormView

from .forms import MultipleTavoliForm
from .methods import ordinaTavoli
from .models import Sala, Tavolo
from ospiti.models import Ospite
from servizi.methods import (
    get_current_servizio_id,
    get_selected_servizio,
    set_selected_servizio,
)
from servizi.models import Servizio, Presenza


def homepage(request):
    # Recupera tutte le sale con i tavoli prefetchati
    sale = Sala.objects.all().prefetch_related("tavoli")

    # Ordina i tavoli per ciascuna sala
    for sala in sale:
        sala.tavoli_ordinati = ordinaTavoli(sala.tavoli.all())

    servizio_selezionato_id = get_selected_servizio(request.user.id)

    if not servizio_selezionato_id:
        # Se l'utente non ha scelto un servizio specifico ottieni l'id di quello attuale e salvalo nella cache
        servizio_selezionato_id = get_current_servizio_id()
        set_selected_servizio(request.user.id, servizio_selezionato_id)

    # Recupera il servizio scelto in base all'id, oppure l'ultimo disponibile
    servizio_selezionato = (
        Servizio.objects.filter(id=servizio_selezionato_id).first()
        or Servizio.objects.order_by("data", "pasto").last()
    )

    # Prepara il contesto per il template
    context = {
        "sale": sale,
        "servizio_selezionato": servizio_selezionato,
    }

    # Renderizza la pagina homepage con il contesto
    return render(request, "tavoli/homepage.html", context)


class AddMultipleTavoliView(FormView):
    form_class = MultipleTavoliForm
    template_name = "tavoli/add_multiple_tavoli.html"
    success_url = "/"

    def form_valid(self, form):
        min_cod = form.cleaned_data["min_cod"]
        num = form.cleaned_data["num"]
        sala = form.cleaned_data["sala"]
        default_posti = form.cleaned_data["posti"]
        errors = []

        # Pre-fetch dei tavoli esistenti per ridurre le query nel loop
        tavoli_esistenti = set(
            Tavolo.objects.filter(
                codice__in=[str(min_cod + c) for c in range(num)]
            ).values_list("codice", flat=True)
        )

        for c in range(num):
            codice = str(min_cod + c)
            if codice in tavoli_esistenti:
                errors.append(f"il tavolo {codice} esiste già.")
            else:
                Tavolo.objects.create(codice=codice, sala=sala, max_posti=default_posti)

        if errors:
            for e in errors:
                messages.error(self.request, e)
        else:
            messages.success(self.request, f"{num} tavoli creati correttamente!")

        return super().form_valid(form)


class EliminaPresenzeTavoloPeriodo(View):
    """
    Elimina un set di presenze assegnate ad un tavolo in un determinato periodo
    """

    def post(self, request):
        try:
            # Recupera i parametri dalla richiesta POST
            id_tavolo = request.POST.get("id_tavolo")
            id_ospite = request.POST.get("id_ospite")
            presenza_ids_str = request.POST.get("presenza_ids")
            periodo = request.POST.get(
                "periodo", None
            )  # rendi opzionale il parametro "periodo"

            # Crea la lista di ID di presenze da rimuovere
            presenza_ids = [int(p) for p in presenza_ids_str.strip().split(",")]

            tavolo = Tavolo.objects.select_for_update().get(id=id_tavolo)

            # Rimuovi le presenze corrispondenti agli ID forniti
            tavolo.presenze.remove(*presenza_ids)

            # Crea il messaggio di successo
            success_message = (
                f"Le presenze sono state rimosse dal tavolo {tavolo.codice}"
            )
            if periodo:
                success_message += f" nel periodo: {periodo}"

            # Aggiungi il messaggio di successo
            messages.success(request, success_message)

        except Tavolo.DoesNotExist:
            messages.error(request, "Il tavolo specificato non esiste.")
        except Exception as e:
            messages.error(
                request, "Si è verificato un errore durante l'operazione: " + str(e)
            )

        # Reindirizza alla pagina assegna_tavoli dell'ospite corrispondente
        return redirect("assegna_tavoli", pk=id_ospite)


class AssegnaPresenzeTavoli(View):
    """
    Assegna un set di presenze dell'ospite ai tavoli specificati nel periodo definito dai servizi di inizio e fine.
    """

    def post(self, request):
        # Recupera i parametri dalla richiesta POST
        ospite_id = request.POST.get("ospite_id")
        tavoli_ids_str = request.POST.get("tavoli_selezionati_ids")
        servizio_inizio_id = request.POST.get("servizio_inizio_id")
        servizio_fine_id = request.POST.get("servizio_fine_id")

        # Crea la lista di ID di tavoli da assegnare
        tavoli_ids_str = tavoli_ids_str.replace("[", "").replace("]", "")
        tavoli_ids = [int(t) for t in tavoli_ids_str.strip().split(",")]

        # Recupera l'ospite
        ospite = get_object_or_404(Ospite, id=ospite_id)

        # Recupera i tavoli
        tavoli = Tavolo.objects.filter(id__in=tavoli_ids)

        # Recupera i servizi di inizio e di fine
        servizio_inizio = get_object_or_404(Servizio, id=servizio_inizio_id)
        servizio_fine = get_object_or_404(Servizio, id=servizio_fine_id)

        # Filtra le presenze dell'ospite per includere solo quelle i cui servizi rientrano nel periodo specificato
        presenze_da_assegnare = (
            Presenza.objects.filter(
                ospite=ospite,
                servizio__data__range=(servizio_inizio.data, servizio_fine.data),
            )
            .exclude(
                servizio__data=servizio_inizio.data,
                servizio__pasto__lt=servizio_inizio.pasto,
            )
            .exclude(
                servizio__data=servizio_fine.data,
                servizio__pasto__gt=servizio_fine.pasto,
            )
        )

        # Assegna le presenze filtrate ai tavoli specificati
        try:
            for tavolo in tavoli:
                tavolo.presenze.add(*presenze_da_assegnare)
        except ValidationError as e:
            error_msg = "Errore nell'assegnare il tavolo: " + str(e).replace(
                "['", ""
            ).replace("']", "")
            messages.error(request, error_msg)
            return redirect("assegna_tavoli", pk=ospite_id)

        # Crea il messaggio di successo
        success_message = f'Le presenze di "{ospite}" nel periodo scelto sono state assegnate ai tavoli {", ".join([tavolo.codice for tavolo in tavoli])}.'
        messages.success(request, success_message)

        # Reindirizza alla pagina assegna_tavoli dell'ospite corrispondente
        return redirect("assegna_tavoli", pk=ospite_id)


def togliPresenzeOspite(request, id_ospite):
    """
    Togli tutte le presenze di un ospite da tutti i tavoli.
    """
    try:
        # Recupera l'ospite corrispondente all'ID fornito
        ospite = get_object_or_404(Ospite, id=id_ospite)

        # Recupera tutte le presenze dell'ospite
        presenze_ospite = ospite.presenze.all()

        if presenze_ospite.exists():
            # Prefetch tutte le presenze dell'ospite nei tavoli
            tavoli = Tavolo.objects.prefetch_related(
                Prefetch("presenze", queryset=presenze_ospite)
            )

            # Rimuove le presenze dell'ospite da tutti i tavoli
            for tavolo in tavoli:
                tavolo.presenze.remove(*presenze_ospite)

        # Crea il messaggio di successo
        messages.success(
            request,
            f"Tutte le presenze di {ospite} sono state rimosse da tutti i tavoli.",
        )

        # Reindirizza alla pagina assegna_tavoli dell'ospite corrispondente
        return redirect("assegna_tavoli", pk=id_ospite)

    except Exception as e:
        # Se si verifica un'eccezione, ritorna una risposta con errore
        messages.error(request, f"Errore: {str(e)}")
        return redirect("assegna_tavoli", pk=id_ospite)


def eliminaTavoliDopoServizio(request, id_ospite, id_servizio):
    """
    Elimina tutti i tavoli assegnati ad un ospite dopo il servizio selezionato
    """
    try:
        # Recupera l'ospite corrispondente all'ID fornito
        ospite = get_object_or_404(Ospite, id=id_ospite)
        servizio_selezionato = get_object_or_404(Servizio, id=id_servizio)

        # Recupera tutti i tavoli assegnati all'ospite
        presenze_ospite = ospite.presenze.filter(
            servizio__data__gt=servizio_selezionato.data
        ) | ospite.presenze.filter(
            servizio__data=servizio_selezionato.data,
            servizio__pasto__gte=servizio_selezionato.pasto,
        )

        if presenze_ospite.exists():
            tavoli = Tavolo.objects.filter(presenze__in=presenze_ospite).distinct()
            # Rimuove le presenze dell'ospite da tutti i tavoli
            for tavolo in tavoli:
                tavolo.presenze.remove(*presenze_ospite)

        # Crea il messaggio di successo
        messages.success(
            request,
            f"Tutte le presenze di {ospite} successive al servizio selezionato sono state rimosse dai tavoli.",
        )

    except Exception as e:
        # Se si verifica un'eccezione, ritorna una risposta con errore
        messages.error(request, f"Errore: {str(e)}")
        return redirect("assegna_tavoli", pk=id_ospite)

    # Reindirizza alla pagina assegna_tavoli dell'ospite corrispondente
    return redirect("assegna_tavoli", pk=id_ospite)
