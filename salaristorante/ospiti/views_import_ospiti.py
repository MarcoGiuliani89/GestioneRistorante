import os
import json
import pandas as pd
from django.conf import settings
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.shortcuts import render

def upload_ospiti(request):
    if request.method == "POST" and request.FILES.get("file"):
        file = request.FILES["file"]
        
        # Salvataggio temporaneo del file
        file_path = os.path.join(settings.MEDIA_ROOT, "presenze.xlsx")
        with default_storage.open(file_path, "wb+") as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # Lettura del file Excel
        try:
            df = pd.read_excel(file_path, engine="openpyxl")

            # Convertiamo tutto a stringa ed eliminiamo i NaN
            df = df.astype(str).fillna("")

            # Conversione delle prime righe in JSON pulito
            preview_data = json.loads(json.dumps(df.head(20).to_dict(orient="records"), default=str))
            
            return JsonResponse({"status": "success", "preview": preview_data})
        
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)})
    
    return render(request, "ospiti/upload_ospiti.html")
