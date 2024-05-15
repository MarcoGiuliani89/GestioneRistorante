from django.shortcuts import render
from .models import Sala


# Create your views here.
def homepage(request):
    sale = Sala.objects.all()
    context = {"sale": sale}

    return render(request, "tavoli/homepage.html", context)
