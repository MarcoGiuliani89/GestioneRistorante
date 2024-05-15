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

    def __str__(self):
        return f"{self.data} {self.get_pasto_display()}"


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
        return f"{self.servizio} {self.ospite} {self.tavolo}"

    def save(self, *args, **kwargs):
        if not self.adulti:
            self.adulti = self.ospite.default_adulti
        if not self.bambini:
            self.bambini = self.ospite.default_bambini
        if not self.infant:
            self.infant = self.ospite.default_infant
        super().save(*args, **kwargs)

    @property
    def tot(self):
        return self.adulti + self.bambini + self.infant

    class Meta:
        verbose_name_plural = "Presenze"
