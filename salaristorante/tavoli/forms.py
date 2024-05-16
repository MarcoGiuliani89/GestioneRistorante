from django import forms
from .models import Sala


class MultipleTavoliForm(forms.Form):
    min_cod = forms.IntegerField(
        min_value=1,
        label="Codice del primo tavolo da creare",
        help_text="I tavoli verranno crati con codice crescente a partire da questo numero",
    )
    num = forms.IntegerField(
        min_value=1, max_value=50, label="Quantità di tavoli da creare"
    )
    sala = forms.ModelChoiceField(queryset=Sala.objects.all())
    posti = forms.IntegerField(
        min_value=1,
        required=False,
        help_text="Posti per tavolo, verrà applicato ad ogni tavolo. Puoi lasciare il campo vuoto e modificare i posti di ogni tavolo singolarmente in seguito",
    )
