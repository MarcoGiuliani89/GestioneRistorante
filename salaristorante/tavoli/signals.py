from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.conf import settings

from .models import Tavolo
from servizi.models import Presenza, Servizio


@receiver(m2m_changed, sender=Tavolo.presenze.through)
def prevent_duplicate_presence(
    sender, instance, action, reverse, model, pk_set, **kwargs
):
    """
    Prima di aggiungere delle presenze ad un Tavolo, verifica se il tavolo ha già presenze assegnate negli stessi servizi.
    Utilizzo una variabile globale per disabilitare il segnale durante l'import dei dati da un dump di DB.
    """
    if getattr(settings, 'IMPORTING_DATA', False):
        return # se IMPORTING_DATA è True, durante l'importazione di un dump disabilita il signals (non fare nulla)
    
    if action == "pre_add" and model == Presenza:
        if instance.utilizzabile is False:
            raise ValidationError(
                "Il tavolo non è più utilizzabile. (Probabilmente è stato contrassegnato non utilizzabile da un altro dispositivo.)"
            )

        presenze_da_aggiungere = Presenza.objects.filter(pk__in=pk_set)

        # Recupera i servizi che si stanno cercando di aggiungere e i loro ID
        servizi_da_aggiungere_ids = list(
            presenze_da_aggiungere.values_list("servizio_id", flat=True)
        )
        # controlla che le presenze che sto aggiungendo non abbiano il servizio in comune
        if len(set(servizi_da_aggiungere_ids)) < len(servizi_da_aggiungere_ids):
            raise ValidationError(
                "Non puoi aggiungere due o più presenze per lo stesso servizio."
            )

        # Recupera le presenze in conflitto
        presenze_in_conflitto = instance.presenze.filter(
            servizio_id__in=servizi_da_aggiungere_ids
        ).select_related("servizio")

        # Recupera i servizi duplicati
        servizi_duplicati = [p.servizio.str_short for p in presenze_in_conflitto]

        if servizi_duplicati:
            # Costruisci il messaggio di errore includendo i servizi duplicati
            servizi_duplicati_str = ", ".join(servizi_duplicati)
            raise ValidationError(
                f"Il tavolo ha già una presenza associata ai seguenti servizi: {servizi_duplicati_str}. (Probabilmente è stato appena assegtnato ad un cliente da un altro dispositivo.)"
            )
