from django.urls import path

from .views import (
    homepage,
    AddMultipleTavoliView,
)


urlpatterns = [
    path("", homepage, name="homepage"),
    path("aggiungi-tavoli/", AddMultipleTavoliView.as_view(), name="aggiungi_tavoli"),
]
