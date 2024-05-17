from django import forms
from .models import Servizio


class InizializzaServiziForm(forms.Form):
    """
    Form per inizializzare i servizi della stagione, date le date di apertura e chiusura della stagione e la tipologia del primo e ultimo servizio.
    """

    primo_giorno = forms.DateField(
        label="Primo giorno del periodo",
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    primo_pasto_apertura = forms.ChoiceField(
        choices=Servizio.PASTO_CHOICES,
        label="Tipologia pasto del primo servizio",
        initial=Servizio.CENA,
    )
    ultimo_giorno = forms.DateField(
        label="Ultimo giorno del periodo",
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    ultimo_pasto_chiusura = forms.ChoiceField(
        choices=Servizio.PASTO_CHOICES,
        label="Tipologia pasto dell'ultimo servizio",
        initial=Servizio.COLAZIONE,
    )

    def clean(self):
        cleaned_data = super().clean()
        primo_giorno = cleaned_data.get("primo_giorno")
        ultimo_giorno = cleaned_data.get("ultimo_giorno")

        if primo_giorno > ultimo_giorno:
            self.add_error(
                "primo_giorno",
                "La data di apertura deve precedere la data di chiusura del periodo.",
            )

        return cleaned_data
