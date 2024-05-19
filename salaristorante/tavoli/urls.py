from django.urls import path

from .views import (
    homepage,
    AddMultipleTavoliView,
)

from .api import TavoliDisponibiliAPI, TavoliAssegnatiAPI


urlpatterns = [
    # VIEWS
    path("", homepage, name="homepage"),
    path("aggiungi-tavoli/", AddMultipleTavoliView.as_view(), name="aggiungi_tavoli"),
    # API
    path(
        "api/tavoli-disponibili/",
        TavoliDisponibiliAPI.as_view(),
        name="api_tavoli_disponibili",
    ),
    path(
        "api/tavoli-assegnati/<int:ospite_id>/",
        TavoliAssegnatiAPI.as_view(),
        name="api_tavoli_assegnati",
    ),
]
