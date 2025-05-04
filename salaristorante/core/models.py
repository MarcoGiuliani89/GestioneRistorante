from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass

    class Meta:
        verbose_name = "Utente"
        verbose_name_plural = "Utenti"


class ExcelOspitiMapping(models.Model):
    mapping = models.JSONField()
    data_aggiornamento = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Mappatura Excel Upload Ospiti"
        verbose_name_plural = "Mappatura Excel Upload Ospiti"