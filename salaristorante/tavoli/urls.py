from django.urls import path

from .views import (
    homepage,
    AddMultipleTavoliView,
    EliminaPresenzeTavoloPeriodo,
    AssegnaPresenzeTavoli,
)

from .api import TavoliDisponibiliAPI, TavoliAssegnatiAPI


urlpatterns = [
    # VIEWS
    path("", homepage, name="homepage"),
    path("aggiungi-tavoli/", AddMultipleTavoliView.as_view(), name="aggiungi_tavoli"),
    path(
        "elimina-presenze-tavolo-periodo/",
        EliminaPresenzeTavoloPeriodo.as_view(),
        name="elimina_presenze_tavolo_periodo",
    ),
    path(
        "assegna-presenze-tavoli/",
        AssegnaPresenzeTavoli.as_view(),
        name="assegna_presenze_tavoli",
    ),
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
