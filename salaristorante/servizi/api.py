from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ospiti.models import Ospite
from .models import Presenza


class ServiziPresenzeOspiteAPI(APIView):
    def get(self, request, pk):
        # Recupera l'ospite specificato
        ospite = get_object_or_404(Ospite, id=pk)

        # Recupera le presenze dell'ospite
        presenze = Presenza.objects.filter(ospite=ospite).select_related("servizio")

        # Costruisci la response data con gli id e la rappresentazione in stringa dei servizi
        response_data = [
            {
                "servizio_id": presenza.servizio.id,
                "servizio_text": str(presenza.servizio),
            }
            for presenza in presenze
        ]

        return Response(response_data, status=status.HTTP_200_OK)
