from django.urls import path
from .views import InizializzaServiziView

urlpatterns = [
    path(
        "inizializza-servizi/",
        InizializzaServiziView.as_view(),
        name="inizializza_servizi",
    ),
]
