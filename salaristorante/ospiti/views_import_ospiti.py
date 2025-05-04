import os, json, re, string
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

        
        try:
            # Lettura grezza del file Excel
            df = pd.read_excel(file_path, engine="openpyxl", header=None)

            # Eliminiamo i NaN poi convertiamo tutto in stringa
            df = df.fillna("").astype(str)
            # Rimuove gli zeri dopo il punto nei numeri che erano interpretati come float
            df = df.applymap(
                lambda x: (
                    re.sub(r'^(\d+)\.0$', r'\1', x) if isinstance(x, str) and re.match(r'^\d+\.0$', x)
                    else x
                )
            )

            # Genera lettere delle colonne A, B, C, ...
            max_col = df.shape[1]
            col_letters = list(string.ascii_uppercase[:max_col])

            # Genera struttura come: {1: {'A': 'valore', 'B': 'valore'...}, 2: {...}, ...}
            data = {}
            for i, row in df.iterrows():
                row_data = {}
                for j, cell in enumerate(row):
                    col_letter = col_letters[j]
                    row_data[col_letter] = cell
                data[i + 1] = row_data  # Excel-style: righe partono da 1

            # # Conversione delle prime righe in JSON pulito
            # preview_data = json.loads(json.dumps(df.head(20).to_dict(orient="records"), default=str))
            
            return JsonResponse({"status": "success", "preview": data})
        
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)})
    
    return render(request, "ospiti/upload_ospiti.html")
