from rest_framework import serializers
from .models import FileShare


class FileShareSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = FileShare
        fields = ['id', 'original_name', 'file_type', 'size', 'expires_at',
                  'download_count', 'created_at', 'download_url', 'is_expired']

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/files/{obj.id}/download/')
        return f'/api/files/{obj.id}/download/'


class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    expiry_hours = serializers.IntegerField(write_only=True, default=24, min_value=1, max_value=168)
    clipboard_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = FileShare
        fields = ['file', 'expiry_hours', 'clipboard_code']
