from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ospiti.models import Ospite
from .models import Presenza, Servizio


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


class BaseEditPresenzaFieldAPI(APIView):
    """
    Classe base per modificare adulti, bambini e infant di una Presenza
    """

    field_name = None
    default_field_name = None

    def post(self, request):
        presenza_id = request.data.get("presenza_id")
        field_value = request.data.get(self.field_name)

        presenza = get_object_or_404(
            Presenza.objects.select_related("ospite"), id=presenza_id
        )

        try:
            if field_value == "":
                # se il campo è vuoto, imposto il valore di default dell'ospite
                field_value = getattr(presenza.ospite, self.default_field_name)
            else:
                field_value = int(field_value)
                if field_value < 0:
                    raise ValueError(
                        f"Il numero di {self.field_name} deve essere positivo o zero."
                    )
        except (ValueError, TypeError):
            return Response(
                {
                    "error": f"{self.field_name} deve essere un numero intero positivo o una stringa vuota."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        setattr(presenza, self.field_name, field_value)
        presenza.save()

        data = {"presenza_id": presenza_id, self.field_name: field_value}

        return Response(data, status=status.HTTP_200_OK)


class EditAdultiPresenza(BaseEditPresenzaFieldAPI):
    field_name = "adulti"
    default_field_name = "default_adulti"


class EditBambiniPresenza(BaseEditPresenzaFieldAPI):
    field_name = "bambini"
    default_field_name = "default_bambini"


class EditInfantPresenza(BaseEditPresenzaFieldAPI):
    field_name = "infant"
    default_field_name = "default_infant"


class EditNotePresenza(APIView):
    def post(self, request):
        presenza_id = request.data.get("presenza_id")
        note = request.data.get("note")

        presenza = get_object_or_404(Presenza, id=presenza_id)
        presenza.note = note
        presenza.save()

        data = {"presenza_id": presenza_id, "note": note}

        return Response(data, status=status.HTTP_200_OK)


class TotalePresenzePerServizioAPI(APIView):
    def get(self, request, servizio_id):
        servizio = get_object_or_404(Servizio, id=servizio_id)

        presenze_totali = Presenza.objects.filter(servizio=servizio).aggregate(
            totale_adulti=Sum("adulti"),
            totale_bambini=Sum("bambini"),
            totale_infant=Sum("infant"),
        )

        totale_adulti = presenze_totali["totale_adulti"] or 0
        totale_bambini = presenze_totali["totale_bambini"] or 0
        totale_infant = presenze_totali["totale_infant"] or 0
        totale_presenze = totale_adulti + totale_bambini + totale_infant

        response_data = {
            "servizio_id": servizio.id,
            "totale_adulti": totale_adulti,
            "totale_bambini": totale_bambini,
            "totale_infant": totale_infant,
            "totale_presenze": totale_presenze,
        }

        return Response(response_data, status=status.HTTP_200_OK)
