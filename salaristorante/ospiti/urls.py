from django.urls import path
from .views import (
    OspiteDetailView,
    OspiteListView,
    OspiteCreateView,
    OspiteUpdateView,
    OspiteDeleteView,
)

urlpatterns = [
    path("", OspiteListView.as_view(), name="ospiti_list"),
    path("crea/", OspiteCreateView.as_view(), name="crea_ospite"),
    path("<int:pk>/aggiorna/", OspiteUpdateView.as_view(), name="aggiorna_ospite"),
    path("<int:pk>/cancella/", OspiteDeleteView.as_view(), name="cancella_ospite"),
    path(
        "<int:pk>/assegna_tavoli/",
        OspiteDetailView.as_view(),
        name="assegna_tavoli",
    ),
]
