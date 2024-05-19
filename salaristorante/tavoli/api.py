from datetime import timedelta
from django.db.models import Q, Prefetch
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .methods import ordinaTavoli
from .models import Tavolo
from .serializers import AssegnaTavoloSerializer
from ospiti.models import Ospite
from servizi.models import Servizio, Presenza


class TavoliDisponibiliAPI(APIView):
    """
    API che restituisce tutti i tavoli disponibili nel periodo di tempo richiesto.
    """

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


class TavoliAssegnatiAPI(APIView):
    def get(self, request, ospite_id):
        try:
            ospite = Ospite.objects.select_related(
                "servizio_arrivo", "servizio_partenza"
            ).get(pk=ospite_id)
        except Ospite.DoesNotExist:
            return Response(
                {"error": "Ospite non trovato"}, status=status.HTTP_404_NOT_FOUND
            )

        presenze_prefetch = Prefetch(
            "presenze",
            queryset=Presenza.objects.filter(ospite=ospite).select_related("servizio"),
        )
        tavoli = (
            Tavolo.objects.filter(presenze__ospite=ospite)
            .distinct()
            .prefetch_related(presenze_prefetch)
        )

        response_data = []

        for tavolo in tavoli:
            presenze = list(tavolo.presenze.all())
            if not presenze:
                continue

            presenze.sort(key=lambda p: (p.servizio.data, p.servizio.pasto))
            current_period = []

            for presenza in presenze:
                if not current_period:
                    current_period.append(presenza)
                else:
                    last_servizio = current_period[-1].servizio
                    if self.are_contiguous(last_servizio, presenza.servizio, ospite):
                        current_period.append(presenza)
                    else:
                        period_string = self.get_period_string(current_period, ospite)
                        response_data.append(
                            self.build_response(tavolo, period_string, current_period)
                        )
                        current_period = [presenza]

            if current_period:
                period_string = self.get_period_string(current_period, ospite)
                response_data.append(
                    self.build_response(tavolo, period_string, current_period)
                )

        # Ordina la risposta in base alle regole specificate
        response_data.sort(key=self.sort_key)

        return Response(response_data, status=status.HTTP_200_OK)

    def are_contiguous(self, last_servizio, current_servizio, ospite):
        if ospite.trattamento == Ospite.BB:
            return (
                current_servizio.pasto == Servizio.COLAZIONE
                and last_servizio.data == current_servizio.data - timedelta(days=1)
            )
        elif ospite.trattamento in [Ospite.HB, Ospite.HBB]:
            if (
                last_servizio.pasto == Servizio.CENA
                and current_servizio.pasto == Servizio.COLAZIONE
                and last_servizio.data == current_servizio.data - timedelta(days=1)
            ):
                return True
            elif (
                last_servizio.pasto == Servizio.COLAZIONE
                and current_servizio.pasto == Servizio.CENA
                and last_servizio.data == current_servizio.data
            ):
                return True
        elif ospite.trattamento in [Ospite.FB, Ospite.FBB]:
            if (
                last_servizio.pasto == Servizio.CENA
                and current_servizio.pasto == Servizio.COLAZIONE
                and last_servizio.data == current_servizio.data - timedelta(days=1)
            ):
                return True
            elif (
                last_servizio.pasto == Servizio.COLAZIONE
                and current_servizio.pasto == Servizio.PRANZO
                and last_servizio.data == current_servizio.data
            ):
                return True
            elif (
                last_servizio.pasto == Servizio.PRANZO
                and current_servizio.pasto == Servizio.CENA
                and last_servizio.data == current_servizio.data
            ):
                return True
        return False

    def get_period_string(self, period, ospite):
        start_servizio = period[0].servizio
        end_servizio = period[-1].servizio

        if (
            start_servizio == ospite.servizio_arrivo
            and end_servizio == ospite.servizio_partenza
        ):
            return "Intero soggiorno"
        else:
            return f"{start_servizio.str_short} - {end_servizio.str_short}"

    def build_response(self, tavolo, period_string, period):
        start_servizio_str = str(period[0].servizio)
        end_servizio_str = str(period[-1].servizio)
        return {
            "id": tavolo.id,
            "sala_sigla": tavolo.sala.sigla,
            "codice": tavolo.codice,
            "max_posti": tavolo.max_posti,
            "periodo": period_string,
            "start_servizio": start_servizio_str,
            "end_servizio": end_servizio_str,
        }

    def pasto_str_to_num(self, str):
        if str == "Colazione":
            return 1
        elif str == "Pranzo":
            return 2
        elif str == "Cena":
            return 3

    def sort_key(self, item):
        # elimino eventuali " bis" dal codice del tavolo
        codice = item["codice"].split()[0]

        if item["periodo"] == "Intero soggiorno":
            return (0, None, None)

        # Estrai la data e il pasto dal periodo
        period_parts = item["periodo"].split(" - ")
        start_servizio_parts = period_parts[0].split(" ")
        end_servizio_parts = period_parts[-1].split(" ")

        # Prendi la data e il pasto dal periodo di inizio e fine
        start_data = start_servizio_parts[1]
        start_pasto = self.pasto_str_to_num(start_servizio_parts[-1][1:-1])
        end_data = end_servizio_parts[1]
        end_pasto = self.pasto_str_to_num(end_servizio_parts[-1][1:-1])

        return (
            1,
            start_data,
            start_pasto,
            end_data,
            end_pasto,
            codice,
        )
