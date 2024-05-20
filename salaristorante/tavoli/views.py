from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from django.views.generic.edit import FormView

from .forms import MultipleTavoliForm
from .methods import ordinaTavoli
from .models import Sala, Tavolo


# Create your views here.
def homepage(request):
    sale = Sala.objects.all().prefetch_related("tavoli")

    for sala in sale:
        sala.tavoli_ordinati = ordinaTavoli(sala.tavoli.all())

    context = {"sale": sale}

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
