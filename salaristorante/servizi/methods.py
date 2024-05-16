from .models import Servizio


def prossimoPasto(p):
    if p == Servizio.COLAZIONE:
        return Servizio.PRANZO
    elif p == Servizio.PRANZO:
        return Servizio.CENA
    return Servizio.COLAZIONE
