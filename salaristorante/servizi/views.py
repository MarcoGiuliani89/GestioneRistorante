from datetime import timedelta
from django.views.generic.edit import FormView

from .forms import InizializzaServiziForm
from .methods import prossimoPasto
from .models import Servizio


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
