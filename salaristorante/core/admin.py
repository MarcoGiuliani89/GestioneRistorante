from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

class CustomUserAdmin(UserAdmin):
    # fieldsets = UserAdmin.fieldsets + (
    #     ('Additional info', {'fields': ('my_field', )}),
    # )
    list_display = ('username',
                    'email',
                    'is_staff',
                    'is_superuser',
                    'last_login'
                    )
    list_filter = ( 'is_staff',
                    'is_superuser',
                    'is_active',
                    ) 

admin.site.register(User, CustomUserAdmin)