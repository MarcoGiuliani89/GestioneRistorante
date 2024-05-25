from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from servizi.methods import get_selected_servizio
from .models import Ospite
from .serializers import OspiteInPiediSerializer


class OspitiInPiediServizioAttualeAPI(APIView):
    def get(self, request):
        servizio_id = get_selected_servizio(request.user.id)

        # Ottimizza la query utilizzando select_related per le ForeignKey
        ospiti_in_piedi = Ospite.objects.filter(
            presenze__servizio_id=servizio_id, presenze__tavoli__isnull=True
        )

        serialized_ospiti = OspiteInPiediSerializer(ospiti_in_piedi, many=True)

        response = {
            "ospiti_in_piedi": serialized_ospiti.data,
            "servizio_id": servizio_id,
        }

        return Response(response, status=status.HTTP_200_OK)
