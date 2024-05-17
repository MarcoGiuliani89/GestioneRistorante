from django.contrib import messages
from django.shortcuts import render
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
