from django import forms
from .models import Servizio


class InizializzaServiziForm(forms.Form):
    """
    Form per inizializzare i servizi della stagione, date le date di apertura e chiusura della stagione e la tipologia del primo e ultimo servizio.
    """

    primo_giorno = forms.DateField(
        label="Giorno di apertura stagione",
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    primo_pasto_apertura = forms.ChoiceField(
        choices=Servizio.PASTO_CHOICES,
        label="Tipologia pasto del primo servizio",
        initial=Servizio.CENA,
    )
    ultimo_giorno = forms.DateField(
        label="Giorno di chiusura stagione",
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    ultimo_pasto_chiusura = forms.ChoiceField(
        choices=Servizio.PASTO_CHOICES,
        label="Tipologia pasto dell'ultimo servizio",
        initial=Servizio.COLAZIONE,
    )
