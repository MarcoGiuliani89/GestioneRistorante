from django.apps import apps
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ExcelOspitiMapping

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def excel_mapping_view(request):
    """
    GET: restituisce la mappa predefinita di colonne excel per upload ospiti
    POST: aggiorna la mappa predefinita
    """
    if request.method == "GET":
        mapping = ExcelOspitiMapping.objects.first()
        return Response(mapping.mapping if mapping else {})

    if request.method == "POST":
        data = request.data.get("mapping")
        if not isinstance(data, dict):
            return Response({"error": "Formato mapping non valido"}, status=400)

        Ospite = apps.get_model("ospiti", "Ospite")
        valid_fields = [f.name for f in Ospite._meta.get_fields() if f.concrete and not f.auto_created]

        used_fields = set()

        for col, campo in data.items():
            if campo == "":
                continue  # campo non usato, lo saltiamo

            if campo not in valid_fields:
                return Response(
                    {"error": f"Campo '{campo}' non valido per la colonna '{col}'"},
                    status=400
                )

            if campo in used_fields:
                return Response(
                    {"error": f"Il campo '{campo}' è stato assegnato a più colonne"},
                    status=400
                )
            used_fields.add(campo)

        mapping_obj, _ = ExcelOspitiMapping.objects.update_or_create(
            defaults={"mapping": data}
        )
        return Response({"success": True})
