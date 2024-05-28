from django.urls import path
from .views import (
    OspiteDetailView,
    OspiteListView,
    OspiteCreateView,
    OspiteUpdateView,
    OspiteDeleteView,
)
from .api import OspitiInPiediServizioAttualeAPI, ArriviPartenzeServizioAttualeAPI

urlpatterns = [
    # VIEWS
    path("", OspiteListView.as_view(), name="ospiti_list"),
    path("crea/", OspiteCreateView.as_view(), name="crea_ospite"),
    path("<int:pk>/aggiorna/", OspiteUpdateView.as_view(), name="aggiorna_ospite"),
    path("<int:pk>/cancella/", OspiteDeleteView.as_view(), name="cancella_ospite"),
    path(
        "<int:pk>/assegna_tavoli/",
        OspiteDetailView.as_view(),
        name="assegna_tavoli",
    ),
    # API
    path(
        "api/ospiti-in-piedi-servizio-attuale/",
        OspitiInPiediServizioAttualeAPI.as_view(),
        name="api_ospiti_in_piedi_servizio_attuale",
    ),
    path(
        "api/arrivi-partenze-servizio-attuale/",
        ArriviPartenzeServizioAttualeAPI.as_view(),
        name="api_arrivi_partenze_servizio_attuale",
    ),
]
