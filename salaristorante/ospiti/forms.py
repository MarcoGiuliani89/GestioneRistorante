from django import forms
from .models import Ospite
from tavoli.models import Tavolo
from servizi.models import Presenza


class OspiteForm(forms.ModelForm):
    class Meta:
        model = Ospite
        fields = [
            "nome",
            "tipologia",
            "trattamento",
            "servizio_arrivo",
            "servizio_partenza",
            "default_adulti",
            "default_bambini",
            "default_infant",
            "rooms",
            "note",
        ]
        labels = {
            "nome": "Nome ospite / Nome gruppo",
            "tipologia": "Tipologia",
            "servizio_arrivo": "Arrivo",
            "servizio_partenza": "Partenza",
            "default_adulti": "Numero predefinito di adulti",
            "default_bambini": "Numero predefinito di bambini",
            "default_infant": "Numero predefinito di infanti",
            "rooms": "Camere assegnate",
            "note": "Note ospite",
            "trattamento": "Trattamento",
        }
        help_texts = {
            "rooms": "Se più di una, separare con la virgola",
        }

    def clean(self):
        cleaned_data = super().clean()
        servizio_arrivo = cleaned_data.get("servizio_arrivo")
        servizio_partenza = cleaned_data.get("servizio_partenza")

        if servizio_arrivo.data > servizio_partenza.data:
            self.add_error(
                "servizio_arrivo",
                "Il servizio di arrivo deve essere precedente al servizio di partenza.",
            )
        elif (
            servizio_arrivo.data == servizio_partenza.data
            and servizio_arrivo.pasto > servizio_partenza.pasto
        ):
            self.add_error(
                "servizio_arrivo",
                "Il servizio di arrivo deve essere precedente al servizio di partenza.",
            )

        return cleaned_data
