from django.urls import path

from .views import (
    homepage,
    AddMultipleTavoliView,
    EliminaPresenzeTavoloPeriodo,
    AssegnaPresenzeTavoli,
    togliPresenzeOspite,
)

from .api import (
    TavoliDisponibiliAPI,
    TavoliAssegnatiAPI,
    PeriodiInPiediOspite,
    DatiTavoloServizioAPI,
    ToggleTavoloUtilizzabileAPI,
    EditMaxPostiTavoloAPI,
    EditNoteTavoloAPI,
)


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
        "togli-presenze-ospite/<int:id_ospite>/",
        togliPresenzeOspite,
        name="togli_presenze_ospite",
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
    path(
        "api/periodi-in-piedi-ospite/",
        PeriodiInPiediOspite.as_view(),
        name="api_periodi_in_piedi_ospite",
    ),
    path(
        "api/dati-tavolo-servizio/<int:tavolo_id>/",
        DatiTavoloServizioAPI.as_view(),
        name="api_dati_tavolo_servizio",
    ),
    path(
        "api/toggle-tavolo-utilizzabile/<int:tavolo_id>/",
        ToggleTavoloUtilizzabileAPI.as_view(),
        name="api_toggle_tavolo_utilizzabile",
    ),
    path(
        "api/edit-max-posti-tavolo/",
        EditMaxPostiTavoloAPI.as_view(),
        name="api_edit_max_posti_tavolo",
    ),
    path(
        "api/edit-note-tavolo/",
        EditNoteTavoloAPI.as_view(),
        name="api_edit_note_tavolo",
    ),
]
