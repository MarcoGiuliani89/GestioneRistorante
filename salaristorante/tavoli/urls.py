from django.urls import path

from .views import (
    homepage,
    AddMultipleTavoliView,
)

from .api import TavoliDisponibiliAPI


urlpatterns = [
    path("", homepage, name="homepage"),
    path("aggiungi-tavoli/", AddMultipleTavoliView.as_view(), name="aggiungi_tavoli"),
    path(
        "api/tavoli-disponibili/",
        TavoliDisponibiliAPI.as_view(),
        name="api_tavoli_disponibili",
    ),
]
