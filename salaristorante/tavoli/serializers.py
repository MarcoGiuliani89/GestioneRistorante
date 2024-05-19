from rest_framework import serializers
from .models import Tavolo
from servizi.models import Presenza


class AssegnaTavoloSerializer(serializers.ModelSerializer):
    sala_sigla = serializers.CharField(source="sala.sigla")
    sala_nome = serializers.CharField(source="sala.nome")

    class Meta:
        model = Tavolo
        fields = [
            "id",
            "codice",
            "max_posti",
            "sala",
            "sala_sigla",
            "sala_nome",
        ]
