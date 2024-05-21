from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .methods import ordinaTavoli
from .models import Tavolo
from .serializers import AssegnaTavoloSerializer
from ospiti.models import Ospite
from servizi.methods import (
    are_contiguous,
    get_selected_servizio,
    get_current_servizio_id,
)
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
    """
    API che restituisce tutti i tavoli assegnati all'ospite specificato.
    """

    def get(self, request, ospite_id):
        try:
            # Tenta di recuperare l'ospite con l'ID fornito
            ospite = Ospite.objects.select_related(
                "servizio_arrivo", "servizio_partenza"
            ).get(pk=ospite_id)
        except Ospite.DoesNotExist:
            # Restituisce un errore se l'ospite non viene trovato
            return Response(
                {"error": "Ospite non trovato"}, status=status.HTTP_404_NOT_FOUND
            )

        # Prepara il prefetch delle presenze per l'ospite specificato
        presenze_prefetch = Prefetch(
            "presenze",
            queryset=Presenza.objects.filter(ospite=ospite).select_related("servizio"),
        )

        # Recupera i tavoli assegnati all'ospite
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

            # Ordina le presenze per data e pasto
            presenze.sort(key=lambda p: (p.servizio.data, p.servizio.pasto))
            current_period = []

            # Il tavolo assegnato in più righe se i servizi non sono contigui
            for presenza in presenze:
                if not current_period:
                    # Se non ho un periodo corrente, lo creo
                    current_period.append(presenza)
                else:
                    last_servizio = current_period[-1].servizio
                    # Verifica se il servizio corrente è contiguo all'ultimo servizio del periodo corrente
                    if are_contiguous(
                        last_servizio, presenza.servizio, ospite.trattamento
                    ):
                        current_period.append(presenza)
                    else:
                        # Crea una stringa di periodo per il gruppo corrente di presenze
                        period_string = self.get_period_string(current_period, ospite)
                        response_data.append(
                            self.build_response(tavolo, period_string, current_period)
                        )
                        current_period = [presenza]

            if current_period:
                # Gestisce l'ultimo gruppo di presenze
                period_string = self.get_period_string(current_period, ospite)
                response_data.append(
                    self.build_response(tavolo, period_string, current_period)
                )

        # Ordina la risposta in base alle regole specificate in sort_key
        response_data.sort(key=self.sort_key)

        return Response(response_data, status=status.HTTP_200_OK)

    def get_period_string(self, period, ospite):
        # Ottiene i servizi di inizio e fine del periodo
        start_servizio = period[0].servizio
        end_servizio = period[-1].servizio

        # Verifica se il periodo copre l'intero soggiorno dell'ospite e componi la stringa che rappresenterà il periodo
        if (
            start_servizio == ospite.servizio_arrivo
            and end_servizio == ospite.servizio_partenza
        ):
            return "Intero soggiorno"
        else:
            return f"{start_servizio.str_short} - {end_servizio.str_short}"

    def build_response(self, tavolo, period_string, period):
        # Costruisce la risposta per ogni tavolo assegnato, includendo gli ID delle presenze dela singola riga
        start_servizio_str = str(period[0].servizio)
        end_servizio_str = str(period[-1].servizio)
        presenza_ids = [presenza.id for presenza in period]
        return {
            "id": tavolo.id,
            "sala_sigla": tavolo.sala.sigla,
            "codice": tavolo.codice,
            "max_posti": tavolo.max_posti,
            "periodo": period_string,
            "start_servizio": start_servizio_str,
            "end_servizio": end_servizio_str,
            "presenza_ids": presenza_ids,
        }

    def pasto_str_to_num(self, str):
        # Converte il nome del pasto in un numero per l'ordinamento
        if str == "Col":
            return 1
        elif str == "Pra":
            return 2
        elif str == "Cen":
            return 3

    def sort_key(self, item):
        # Elimina eventuali " bis" dal codice del tavolo
        codice = item["codice"].split()[0]

        # Disponi in cima i tavoli assegnati per all'intero soggiorno, ordinati per codice
        if item["periodo"] == "Intero soggiorno":
            return (0, int(codice))

        # Definisci i criteri di ordinamento per i rimanenti tavoli

        # Estrai la data e il pasto dal periodo
        period_parts = item["periodo"].split(" - ")
        start_servizio_parts = period_parts[0].split(" ")
        end_servizio_parts = period_parts[-1].split(" ")

        # Prendi la data e il pasto (convertito in numero) dal periodo di inizio e fine
        start_data = start_servizio_parts[1]
        start_pasto = self.pasto_str_to_num(start_servizio_parts[-1][1:-1])
        end_data = end_servizio_parts[1]
        end_pasto = self.pasto_str_to_num(end_servizio_parts[-1][1:-1])

        # Restituisci i criteri di ordinamento
        return (
            1,
            start_data,
            start_pasto,
            end_data,
            end_pasto,
            int(codice),
        )


class PeriodiInPiediOspite(APIView):
    """
    API per ottenere tutti i periodi consecutivi in cui un ospite non è assegnato a nessun tavolo.
    """

    def get(self, request):
        id_ospite = request.query_params.get("id_ospite")
        ospite = get_object_or_404(Ospite, id=id_ospite)
        trattamento = ospite.trattamento

        # Recupera tutte le presenze dell'ospite che non sono assegnate a nessun tavolo
        presenze = (
            Presenza.objects.filter(ospite=ospite)
            .exclude(tavoli__isnull=False)
            .order_by("servizio__data", "servizio__pasto")
        )

        if not presenze:
            return Response({"periodi_non_assegnati": []}, status=status.HTTP_200_OK)

        periodi_non_assegnati = []
        current_periodo = []
        last_presenza = None

        for presenza in presenze:
            if not current_periodo:
                current_periodo.append(presenza)
            else:
                last_servizio = last_presenza.servizio
                current_servizio = presenza.servizio
                if are_contiguous(last_servizio, current_servizio, trattamento):
                    current_periodo.append(presenza)
                else:
                    periodi_non_assegnati.append(current_periodo)
                    current_periodo = [presenza]

            last_presenza = presenza

        if current_periodo:
            periodi_non_assegnati.append(current_periodo)

        # Formatta la risposta
        response_data = []
        for periodo in periodi_non_assegnati:
            servizio_iniziale = periodo[0].servizio
            servizio_finale = periodo[-1].servizio
            if (
                servizio_iniziale == ospite.servizio_arrivo
                and servizio_finale == ospite.servizio_partenza
            ):
                periodo_descrizione = "Intero soggiorno"
            else:
                periodo_descrizione = (
                    f"{servizio_iniziale.str_short} - {servizio_finale.str_short}"
                )
            response_data.append(
                {
                    "servizio_iniziale": servizio_iniziale.pk,
                    "servizio_finale": servizio_finale.pk,
                    "descrizione": periodo_descrizione,
                }
            )

        return Response(
            {"periodi_non_assegnati": response_data}, status=status.HTTP_200_OK
        )


class DatiTavoloServizioAPI(APIView):

    def get(self, request, tavolo_id):
        user_id = request.user.id

        # Recupera il servizio selezionato dalla cache
        servizio_selezionato_id = get_selected_servizio(user_id)

        # Se non c'è un servizio selezionato, utilizza get_current_servizio_id
        if not servizio_selezionato_id:
            servizio_selezionato_id = get_current_servizio_id()

        # Recupera il tavolo
        tavolo = get_object_or_404(Tavolo, id=tavolo_id)

        # Recupera la presenza per il servizio selezionato
        presenza = (
            tavolo.presenze.filter(servizio_id=servizio_selezionato_id)
            .select_related("ospite")
            .first()
        )

        if presenza:
            data = {
                "ospite": presenza.ospite.nome,
                "tipologia": presenza.ospite.get_tipologia_display(),
                "trattamento": presenza.ospite.get_trattamento_display(),
                "adulti": presenza.adulti,
                "bambini": presenza.bambini,
                "infant": presenza.infant,
                "note_servizio": presenza.note,
                "utilizzabile": tavolo.utilizzabile,
                "max_posti": tavolo.max_posti,
                "note_tavolo": tavolo.note,
            }
        else:
            data = {
                "ospite": None,
                "tipologia": None,
                "trattamento": None,
                "adulti": None,
                "bambini": None,
                "infant": None,
                "note_servizio": None,
                "utilizzabile": tavolo.utilizzabile,
                "max_posti": tavolo.max_posti,
                "note_tavolo": tavolo.note,
            }

        return Response(data, status=status.HTTP_200_OK)
