from django.contrib import admin
from .models import Servizio


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
