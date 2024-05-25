from rest_framework import serializers
from .models import Ospite


class OspiteInPiediSerializer(serializers.ModelSerializer):
    assegna_tavoli_url = serializers.ReadOnlyField()

    class Meta:
        model = Ospite
        fields = ["id", "nome", "assegna_tavoli_url"]
