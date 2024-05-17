from django.contrib import messages
from django.urls import reverse_lazy
from django.views.generic import CreateView, UpdateView, ListView, DeleteView

from servizi.methods import aggiorna_presenze_per_ospite
from salaristorante import settings
from .models import Ospite
from .forms import OspiteForm


class OspiteCreateView(CreateView):
    model = Ospite
    form_class = OspiteForm
    template_name = "ospiti/ospite_form.html"
    success_url = reverse_lazy("crea_ospite")

    def form_valid(self, form):
        response = super().form_valid(form)
        aggiorna_presenze_per_ospite(
            self.object,
            form.cleaned_data["servizio_arrivo"],
            form.cleaned_data["servizio_partenza"],
        )
        messages.success(self.request, f"Ospite creato con successo!")
        return response


class OspiteUpdateView(UpdateView):
    model = Ospite
    form_class = OspiteForm
    template_name = "ospiti/ospite_form.html"
    success_url = reverse_lazy("ospiti_list")

    def form_valid(self, form):
        response = super().form_valid(form)
        aggiorna_presenze_per_ospite(
            self.object,
            form.cleaned_data["servizio_arrivo"],
            form.cleaned_data["servizio_partenza"],
        )
        messages.success(self.request, f"Ospite aggiornato con successo!")
        return response


class OspiteListView(ListView):
    model = Ospite
    template_name = "ospiti/ospite_list.html"
    context_object_name = "ospiti"
    paginate_by = settings.PAGINATION_NUM


class OspiteDeleteView(DeleteView):
    model = Ospite
    success_url = reverse_lazy("ospiti_list")
