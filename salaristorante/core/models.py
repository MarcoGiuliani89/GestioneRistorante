from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass

    class Meta:
        verbose_name = "Utente"
        verbose_name_plural = "Utenti"