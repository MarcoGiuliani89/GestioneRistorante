from django.db import models


class Servizio(models.Model):
    COLAZIONE = 1
    PRANZO = 2
    CENA = 3
    PASTO_CHOICES = [
        (COLAZIONE, "Colazione"),
        (PRANZO, "Pranzo"),
        (CENA, "Cena"),
    ]

    data = models.DateField()
    pasto = models.PositiveSmallIntegerField(choices=PASTO_CHOICES)

    @property
    def formatted_data(self):
        giorni_settimana = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
        mesi = [
            "Gen",
            "Feb",
            "Mar",
            "Apr",
            "Mag",
            "Giu",
            "Lug",
            "Ago",
            "Set",
            "Ott",
            "Nov",
            "Dic",
        ]
        giorno_settimana = giorni_settimana[self.data.weekday()]
        mese = mesi[self.data.month - 1]
        anno = self.data.strftime("%y")
        return f"{giorno_settimana} {self.data.day} {mese} {anno}"

    def __str__(self):
        return f"{self.formatted_data} - {self.get_pasto_display()}"

    class Meta:
        verbose_name_plural = "Servizi"
        ordering = ["data", "pasto"]


class Presenza(models.Model):
    ospite = models.ForeignKey(
        "ospiti.Ospite", on_delete=models.CASCADE, related_name="presenze"
    )
    servizio = models.ForeignKey(
        Servizio, on_delete=models.RESTRICT, related_name="presenze"
    )
    adulti = models.PositiveSmallIntegerField()
    bambini = models.PositiveSmallIntegerField()
    infant = models.PositiveSmallIntegerField()

    def __str__(self):
        return f"{self.servizio} {self.ospite}"

    def save(self, *args, **kwargs):
        self.adulti = self.adulti or self.ospite.default_adulti
        self.bambini = self.bambini or self.ospite.default_bambini
        self.infant = self.infant or self.ospite.default_infant
        super().save(*args, **kwargs)

    @property
    def tot(self):
        return self.adulti + self.bambini + self.infant

    class Meta:
        verbose_name_plural = "Presenze"
        constraints = [
            models.UniqueConstraint(
                fields=["ospite", "servizio"], name="unique_ospite_servizio"
            )
        ]

        ordering = ["servizio", "ospite"]
