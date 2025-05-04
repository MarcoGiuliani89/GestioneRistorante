from django.urls import path

from .api import excel_mapping_view

urlpatterns = [
    # VIEWS
    
    # API
    path(
        "api/excel-mapping/",
        excel_mapping_view,
        name="api_excel_mapping",
    ),
]