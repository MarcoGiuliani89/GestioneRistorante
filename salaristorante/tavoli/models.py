from django.db import models
from django.db.models import IntegerField
from django.db.models.functions import Cast
from servizi.models import Presenza


class Sala(models.Model):
    nome = models.CharField(max_length=30)
    sigla = models.CharField(max_length=2, unique=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Sala Ristorante"
        verbose_name_plural = "Sale Ristorante"
        ordering = ["pk"]


class Tavolo(models.Model):
    codice = models.CharField(max_length=10, unique=True)
    sala = models.ForeignKey(Sala, on_delete=models.CASCADE, related_name="tavoli")
    max_posti = models.PositiveSmallIntegerField(null=True, blank=True)
    utilizzabile = models.BooleanField(default=True)
    note = models.CharField(max_length=250, null=True, blank=True)

    presenze = models.ManyToManyField(Presenza, blank=True, related_name="tavoli")

    def __str__(self):
        return f"{self.sala.sigla} {self.codice}"

    class Meta:
        verbose_name_plural = "Tavoli"
