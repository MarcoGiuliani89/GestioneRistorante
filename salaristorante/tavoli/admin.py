from django.contrib import admin
from .models import Sala, Tavolo
from .methods import ordinaTavoli


class TavoloAdmin(admin.ModelAdmin):
    model = Tavolo

    def get_queryset(self, request):
        qs = ordinaTavoli(super().get_queryset(request))
        return qs


admin.site.register(Sala)
admin.site.register(Tavolo, TavoloAdmin)
