from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .methods import ordinaTavoli
from .models import Tavolo
from .serializers import AssegnaTavoloSerializer
from servizi.models import Servizio


class TavoliDisponibiliAPI(APIView):
    def get(self, request):
        servizio_inizio_id = request.query_params.get("servizio_inizio_id")
        servizio_fine_id = request.query_params.get("servizio_fine_id")
        try:
            servizio_inizio = Servizio.objects.get(pk=servizio_inizio_id)
            servizio_fine = Servizio.objects.get(pk=servizio_fine_id)
        except Servizio.DoesNotExist:
            return Response(
                {"error": "Servizio non trovato"}, status=status.HTTP_404_NOT_FOUND
            )

        # Filtriamo i tavoli occupati nel periodo considerato con logica precisa sui pasti del giorno di inizio e fine
        tavoli_occupati = Tavolo.objects.filter(
            Q(presenze__servizio__data__gt=servizio_inizio.data)
            & Q(presenze__servizio__data__lt=servizio_fine.data)
            | Q(
                presenze__servizio__data=servizio_inizio.data,
                presenze__servizio__pasto__gte=servizio_inizio.pasto,
            )
            | Q(
                presenze__servizio__data=servizio_fine.data,
                presenze__servizio__pasto__lte=servizio_fine.pasto,
            )
        ).distinct()

        tavoli_disponibili = Tavolo.objects.filter(utilizzabile=True).exclude(
            id__in=tavoli_occupati
        )
        tavoli_disponibili = ordinaTavoli(tavoli_disponibili)

        serializer = AssegnaTavoloSerializer(tavoli_disponibili, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
