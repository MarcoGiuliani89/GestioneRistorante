from django.db import models
from servizi.models import Servizio


class Ospite(models.Model):
    PRIVATI = 1
    GRUPPO = 2
    ESTERNI = 3

    TIPOLOGIA_CHOICHES = [
        (PRIVATI, "Privati"),
        (GRUPPO, "Gruppo"),
        (ESTERNI, "Esterni"),
    ]

    BB = "BB"
    HB = "HB"
    FB = "FB"
    HBB = "HBB"
    FBB = "FBB"

    TRATTAMENTO_CHOICES = [
        (BB, "Bed and Breakfast"),
        (HB, "Half Board"),
        (FB, "Full Board"),
        (HBB, "Half Board & Beverage"),
        (FBB, "Full Board and Beverage"),
    ]

    nome = models.CharField(max_length=100)
    tipologia = models.PositiveSmallIntegerField(
        choices=TIPOLOGIA_CHOICHES, default=PRIVATI
    )
    servizio_arrivo = models.ForeignKey(
        Servizio, on_delete=models.RESTRICT, related_name="arrivo"
    )
    servizio_partenza = models.ForeignKey(
        Servizio, on_delete=models.RESTRICT, related_name="partenza"
    )
    default_adulti = models.PositiveSmallIntegerField(default=2, blank=True, null=True)
    default_bambini = models.PositiveSmallIntegerField(default=0, blank=True, null=True)
    default_infant = models.PositiveSmallIntegerField(default=0, blank=True, null=True)
    rooms = models.CharField(max_length=250, blank=True, null=True)
    note = models.CharField(max_length=250, blank=True, null=True)
    trattamento = models.CharField(
        max_length=4, choices=TRATTAMENTO_CHOICES, default=HB
    )

    def __str__(self):
        return f"{self.nome}"

    class Meta:
        verbose_name = "Gruppo di ospiti"
        verbose_name_plural = "Gruppi di ospiti"
        ordering = ["servizio_arrivo", "servizio_partenza", "nome"]
