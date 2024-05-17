from django.contrib import admin
from .models import Servizio, Presenza


@admin.register(Servizio)
class ServizioAdmin(admin.ModelAdmin):
    list_display = [
        "data",
        "pasto",
        "pk",
    ]
    ordering = ["data", "pasto"]
    list_filter = [
        "pasto",
    ]


@admin.register(Presenza)
class PresenzaAdmin(admin.ModelAdmin):
    list_display = [
        "servizio",
        "ospite",
        "adulti",
        "bambini",
        "infant",
        "tot",
        "pk",
    ]
    list_filter = [
        "ospite",
    ]
