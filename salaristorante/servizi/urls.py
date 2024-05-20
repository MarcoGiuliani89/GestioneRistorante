from django.urls import path
from .views import InizializzaServiziView
from .api import ServiziPresenzeOspiteAPI

urlpatterns = [
    # VIEWS
    path(
        "inizializza-servizi/",
        InizializzaServiziView.as_view(),
        name="inizializza_servizi",
    ),
    # API
    path(
        "api/servizi-presenze/<int:pk>/",
        ServiziPresenzeOspiteAPI.as_view(),
        name="api_servizi_presenze_ospite",
    ),
]
