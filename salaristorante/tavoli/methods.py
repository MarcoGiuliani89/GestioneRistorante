from django.db.models.functions import Cast
from django.db.models import IntegerField


def ordinaTavoli(queryset):
    """
    Ordina i tavoli per sala e codice considerando il numero come intero e i tavoli #bis.
    """
    qr = queryset.annotate(num=Cast("codice", IntegerField())).order_by(
        "sala", "num", "pk"
    )
    return qr
