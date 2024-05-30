from django.http import HttpResponseRedirect
from django.urls import reverse


class BloccoAccessoMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user.is_authenticated and not request.path == reverse("login"):
            return HttpResponseRedirect(reverse("login"))
        return self.get_response(request)
