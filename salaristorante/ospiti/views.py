from datetime import datetime
from django.contrib import messages
from django.db.models import Q
from django.urls import reverse_lazy
from django.views.generic import (
    DetailView,
    CreateView,
    UpdateView,
    ListView,
    DeleteView,
)

from servizi.methods import aggiorna_presenze_per_ospite
from salaristorante import settings
from .models import Ospite
from .forms import OspiteForm
from servizi.methods import get_selected_servizio
from servizi.models import Servizio


class OspiteDetailView(DetailView):
    model = Ospite
    template_name = "ospiti/ospite_detail.html"
    context_object_name = "ospite"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        servizio_selezionato_id = get_selected_servizio(self.request.user.id)
        servizio_selezionato = Servizio.objects.get(id=servizio_selezionato_id)
        context["servizio_selezionato"] = servizio_selezionato

        return context


class OspiteCreateView(CreateView):
    model = Ospite
    form_class = OspiteForm
    template_name = "ospiti/ospite_new.html"
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

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["trattamenti"] = Ospite.TRATTAMENTO_CHOICES
        context["tipologie"] = Ospite.TIPOLOGIA_CHOICHES
        return context

    def get_queryset(self):
        qs = super().get_queryset()

        # campi di ricerca
        nome = self.request.GET.get("ospite")
        trattamento = self.request.GET.get("trattamento")
        tipologia = self.request.GET.get("tipologia")
        arrivo_da = self.request.GET.get("data_arrivo_inizio")
        arrivo_a = self.request.GET.get("data_arrivo_fine")
        partenza_da = self.request.GET.get("data_partenza_inizio")
        partenza_a = self.request.GET.get("data_partenza_fine")

        # Costruzione del filtro
        filters = Q()

        if nome:
            filters &= Q(nome__icontains=nome)
        if trattamento:
            filters &= Q(trattamento=trattamento)
        if tipologia:
            filters &= Q(tipologia=tipologia)
        if arrivo_da:
            try:
                arrivo_da_date = datetime.strptime(arrivo_da, "%Y-%m-%d")
                filters &= Q(servizio_arrivo__data__gte=arrivo_da_date)
            except ValueError:
                pass
        if arrivo_a:
            try:
                arrivo_a_date = datetime.strptime(arrivo_a, "%Y-%m-%d")
                filters &= Q(servizio_arrivo__data__lte=arrivo_a_date)
            except ValueError:
                pass
        if partenza_da:
            try:
                partenza_da_date = datetime.strptime(partenza_da, "%Y-%m-%d")
                filters &= Q(servizio_partenza__data__gte=partenza_da_date)
            except ValueError:
                pass
        if partenza_a:
            try:
                partenza_a_date = datetime.strptime(partenza_a, "%Y-%m-%d")
                filters &= Q(servizio_partenza__data__lte=partenza_a_date)
            except ValueError:
                pass

        return qs.filter(filters)


class OspiteDeleteView(DeleteView):
    model = Ospite
    success_url = reverse_lazy("ospiti_list")
