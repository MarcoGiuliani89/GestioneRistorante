from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from servizi.models import Servizio
from .models import Ospite
from .serializers import OspiteInPiediSerializer


class OspitiInPiediServizioAPI(APIView):
    def get(self, request, servizio_id):
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


class ArriviPartenzeServizioAPI(APIView):
    def get(self, request, servizio_id):
        try:
            servizio = Servizio.objects.get(id=servizio_id)
        except Servizio.DoesNotExist:
            return Response(
                {"error": "Servizio non trovato"}, status=status.HTTP_404_NOT_FOUND
            )

        data = servizio.data

        ospiti_arrivi = Ospite.objects.filter(servizio_arrivo__data=data)
        ospiti_partenze = Ospite.objects.filter(servizio_partenza__data=data)

        arrivi = []
        for ospite in ospiti_arrivi:
            prima_presenza = ospite.presenze.filter(servizio__data=data).first()
            if prima_presenza:
                tavoli = [str(tavolo) for tavolo in prima_presenza.tavoli.all()]
                arrivi.append(
                    {
                        "id": ospite.id,
                        "nome": ospite.nome,
                        "tavoli": list(tavoli),
                        "adulti": prima_presenza.adulti,
                        "bambini": prima_presenza.bambini,
                        "infant": prima_presenza.infant,
                        "trattamento": ospite.trattamento,
                        "pasto_arrivo": ospite.servizio_arrivo.get_pasto_display(),
                    }
                )

        partenze = []
        for ospite in ospiti_partenze:
            ultima_presenza = ospite.presenze.filter(servizio__data=data).last()
            if ultima_presenza:
                tavoli = [str(tavolo) for tavolo in ultima_presenza.tavoli.all()]
                partenze.append(
                    {
                        "id": ospite.id,
                        "nome": ospite.nome,
                        "tavoli": list(tavoli),
                        "adulti": ultima_presenza.adulti,
                        "bambini": ultima_presenza.bambini,
                        "infant": ultima_presenza.infant,
                        "trattamento": ospite.trattamento,
                        "pasto_partenza": ospite.servizio_partenza.get_pasto_display(),
                    }
                )

        response = {
            "arrivi": arrivi,
            "partenze": partenze,
            "servizio_id": servizio_id,
        }

        return Response(response, status=status.HTTP_200_OK)
