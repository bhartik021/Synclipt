from django.contrib import admin
from .models import Clipboard


@admin.register(Clipboard)
class ClipboardAdmin(admin.ModelAdmin):
    list_display = ['code', 'burn_after_read', 'is_burned', 'view_count', 'expires_at', 'created_at']
    list_filter = ['burn_after_read', 'is_burned']
    search_fields = ['code']
    readonly_fields = ['id', 'code', 'view_count', 'created_at', 'updated_at']
