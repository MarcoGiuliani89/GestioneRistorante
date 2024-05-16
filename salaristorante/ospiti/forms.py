from django import forms
from .models import Ospite


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
