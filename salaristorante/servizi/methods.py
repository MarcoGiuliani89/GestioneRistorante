from .models import Servizio, Presenza
from ospiti.models import Ospite


def prossimoPasto(p):
    if p == Servizio.COLAZIONE:
        return Servizio.PRANZO
    elif p == Servizio.PRANZO:
        return Servizio.CENA
    return Servizio.COLAZIONE


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
