from django.contrib import messages
from django.shortcuts import render
from django.views.generic.edit import FormView

from .forms import MultipleTavoliForm
from .models import Sala, Tavolo


# Create your views here.
def homepage(request):
    sale = Sala.objects.all()
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

        for c in range(num):
            t, created = Tavolo.objects.get_or_create(
                codice=str(min_cod + c),
                defaults={"sala": sala, "max_posti": default_posti},
            )
            if not created:
                messages.error(
                    self.request,
                    f"Il tavolo {t.codice} esiste già, creazione tavoli interrotta.",
                )
                return super().form_valid(form)
        messages.success(self.request, "Tavoli creati correttamente")
        return super().form_valid(form)
