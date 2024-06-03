from datetime import datetime, timedelta
from itertools import groupby
from django.conf import settings
from django.core.cache import cache

from .exceptions import NoServizioFoundException, NoServizioAttualeException
from .models import Servizio, Presenza
from ospiti.models import Ospite


def recupera_servizio(request):
    """
    Recupera il servizio selezionato dall'utente, oppure il servizio attuale.
    Se non esistono restituisce l'ultimo disponibile.
    Se non esistono servizi, restituisce un'eccezione personalizzata.
    """
    # Recupera il servizio selezionato
    servizio_selezionato_id = get_selected_servizio(request.user.id)

    if servizio_selezionato_id:
        # Se esiste un servizio_id selezionato, recupera il servizio
        try:
            servizio = Servizio.objects.get(id=servizio_selezionato_id)
        except Servizio.DoesNotExist:
            servizio = None
    else:
        # Se non esiste un id selezionato, prova a recuperare il servizio corrente
        try:
            servizio_selezionato_id = get_current_servizio_id()
            servizio = Servizio.objects.get(id=servizio_selezionato_id)
        except NoServizioAttualeException:
            # Se non c'è un servizio corrente, prendi l'ultimo disponibile
            servizio = Servizio.objects.order_by("data", "pasto").last()

    if servizio is None:
        # Se non esiste alcun servizio, lancia un'eccezione personalizzata
        raise NoServizioFoundException("Nessun servizio trovato")

    # Imposta il servizio selezionato per l'utente
    set_selected_servizio(request.user.id, servizio.id)
    return servizio


def set_selected_servizio(user_id, servizio_id):
    cache_key = f"servizio_selezionato_{user_id}"
    cache.set(
        cache_key, servizio_id, timeout=86400
    )  # Imposta un timeout di 24 ore (86400 secondi)


def get_selected_servizio(user_id):
    cache_key = f"servizio_selezionato_{user_id}"
    servizio_id = cache.get(cache_key)
    if not servizio_id:
        return None
    return servizio_id


def get_current_servizio_id():
    # Ottieni l'id del servizio corrente in base a data e ora attuali
    now = datetime.now()
    current_time = now.time()
    today = now.date()

    if COLAZIONE_START <= current_time < PRANZO_START:
        selected_pasto = Servizio.COLAZIONE
        selected_data = today
    elif PRANZO_START <= current_time < CENA_START:
        selected_pasto = Servizio.PRANZO
        selected_data = today
    else:
        # CENA, con data di oggi, oppure di ieri se siamo tra mezzanote e COLAZIONE_START
        selected_pasto = Servizio.CENA
        selected_data = (
            today if current_time >= CENA_START else today - timedelta(days=1)
        )

    servizio = Servizio.objects.filter(data=selected_data, pasto=selected_pasto).first()
    if not servizio:
        raise NoServizioAttualeException("Nessun servizio corrente")
    return servizio.id


def prossimoPasto(p):
    return (p + 1) if p < 3 else 1


def precedentePasto(p):
    return (p - 1) if p > 1 else 3


# Precalcolo degli orari di inizio dei pasti all'avvio del server (in questo modo evito di doverli ricarlcolare ogni volta che chiamo il metodo get_current_servizio_id)
COLAZIONE_START = datetime.strptime(
    settings.ORARI_SERVIZIO_INIZIO["COLAZIONE"], "%H:%M"
).time()
PRANZO_START = datetime.strptime(
    settings.ORARI_SERVIZIO_INIZIO["PRANZO"], "%H:%M"
).time()
CENA_START = datetime.strptime(settings.ORARI_SERVIZIO_INIZIO["CENA"], "%H:%M").time()


def aggiorna_presenze_per_ospite(ospite, nuovo_arrivo, nuova_partenza):

    # ELIMINA eventuali presenze fuori dall'intervallo di arrivo e partenza

    # innanzi tutto elimino eventuali presenze nei giorni precedenti l'arrivo
    Presenza.objects.filter(
        ospite=ospite, servizio__data__lt=nuovo_arrivo.data
    ).delete()

    # rimuovo eventuali presenze nei giorni successivi alla partenza
    Presenza.objects.filter(
        ospite=ospite, servizio__data__gt=nuova_partenza.data
    ).delete()

    # definisco i pasti inclusi in ogni trattamento
    pasti_inclusi = {
        Ospite.BB: [Servizio.COLAZIONE],
        Ospite.HB: [Servizio.COLAZIONE, Servizio.CENA],
        Ospite.HBB: [Servizio.COLAZIONE, Servizio.CENA],
        Ospite.FB: [Servizio.COLAZIONE, Servizio.PRANZO, Servizio.CENA],
        Ospite.FBB: [Servizio.COLAZIONE, Servizio.PRANZO, Servizio.CENA],
    }
    pasti_per_trattamento = pasti_inclusi.get(ospite.trattamento, [])

    # ELIMINA eventuali presenze non incluse nel trattamento dell'ospite
    Presenza.objects.filter(ospite=ospite).exclude(
        servizio__pasto__in=pasti_per_trattamento
    ).delete()

    # ora rimuovo eventuali presenze nei giorni dell'arrivo e della partenza con pasto precedente a quello di arrivo o successivo a quello di partenza

    Presenza.objects.filter(
        ospite=ospite,
        servizio__data=nuovo_arrivo.data,
        servizio__pasto__lt=nuovo_arrivo.pasto,
    ).delete()

    Presenza.objects.filter(
        ospite=ospite,
        servizio__data=nuova_partenza.data,
        servizio__pasto__gt=nuova_partenza.pasto,
    ).delete()

    # AGGIUNGI eventuali presenze mancanti nell'intervallo di arrivo e partenza; tramite "continue" salto i pasti del giorno di arrivo e partenza, precedenti o successivi al pasto di arrivo e partenza (ad esempio: se un ospite arriva a cena, nel giorno di arrivo evito di creare le presenze a colazione e pranzo)

    servizi = Servizio.objects.filter(
        data__gte=nuovo_arrivo.data, data__lte=nuova_partenza.data
    ).order_by("data", "pasto")

    for servizio in servizi:
        if nuovo_arrivo.data == servizio.data and servizio.pasto < nuovo_arrivo.pasto:
            continue

        if (
            nuova_partenza.data == servizio.data
            and servizio.pasto > nuova_partenza.pasto
        ):
            continue

        if servizio.pasto not in pasti_per_trattamento:
            continue

        Presenza.objects.get_or_create(
            ospite=ospite,
            servizio=servizio,
            defaults={
                "adulti": ospite.default_adulti,
                "bambini": ospite.default_bambini,
                "infant": ospite.default_infant,
            },
        )


def are_contiguous(last_servizio, current_servizio, trattamento):
    # Verifica se 2 servizi sono contigui in base al trattamento dell'ospite
    if trattamento == Ospite.BB:
        return (
            current_servizio.pasto == Servizio.COLAZIONE
            and last_servizio.data == current_servizio.data - timedelta(days=1)
        )
    elif trattamento in [Ospite.HB, Ospite.HBB]:
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
    elif trattamento in [Ospite.FB, Ospite.FBB]:
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


def get_aggregated_presences(presenze):
    # Presenze ordinate per ospite e data del servizio
    presenze_ordinate = presenze.order_by("ospite", "servizio__data", "servizio__pasto")

    # Funzione per raggruppare per ospite
    def key_func(p):
        return p.ospite

    # Risultato finale
    risultati = []

    for ospite, gruppi in groupby(presenze_ordinate, key=key_func):
        gruppi = list(gruppi)
        start = gruppi[0]
        current = start
        trattamento = ospite.trattamento
        for presenza in gruppi[1:]:
            # Check if current presence is contiguous to previous
            if are_contiguous(current.servizio, presenza.servizio, trattamento):
                current = presenza
            else:
                risultati.append((start, current, ospite))
                start = presenza
                current = start
        risultati.append((start, current, ospite))

    return risultati
