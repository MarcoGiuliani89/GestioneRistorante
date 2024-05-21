from django.urls import path
from .views import (
    InizializzaServiziView,
    ServizioPrecedente,
    ServizioAttuale,
    ServizioSuccessivo,
    SelezionaServizioManuale,
)
from .api import ServiziPresenzeOspiteAPI

urlpatterns = [
    # VIEWS
    path(
        "inizializza-servizi/",
        InizializzaServiziView.as_view(),
        name="inizializza_servizi",
    ),
    path(
        "servizio-precedente/", ServizioPrecedente.as_view(), name="servizio_precedente"
    ),
    path("servizio-attuale/", ServizioAttuale.as_view(), name="servizio_attuale"),
    path(
        "servizio-successivo/", ServizioSuccessivo.as_view(), name="servizio_successivo"
    ),
    path(
        "seleziona-servizio-manuale/",
        SelezionaServizioManuale.as_view(),
        name="seleziona_servizio_manuale",
    ),
    # API
    path(
        "api/servizi-presenze/<int:pk>/",
        ServiziPresenzeOspiteAPI.as_view(),
        name="api_servizi_presenze_ospite",
    ),
]
