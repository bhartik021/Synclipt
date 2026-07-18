from django.contrib import admin
from .models import FileShare


@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    list_display = ['original_name', 'file_type', 'size', 'download_count', 'expires_at', 'created_at']
    list_filter = ['file_type']
    search_fields = ['original_name']
    readonly_fields = ['id', 'created_at']
