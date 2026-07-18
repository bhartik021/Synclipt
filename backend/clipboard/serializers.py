from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Clipboard


class ClipboardCreateSerializer(serializers.ModelSerializer):
    raw_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    expiry_hours = serializers.IntegerField(write_only=True, default=24, min_value=1, max_value=720)

    class Meta:
        model = Clipboard
        fields = ['id', 'code', 'delete_token', 'content', 'raw_password', 'expiry_hours',
                  'burn_after_read', 'is_encrypted', 'is_searchable', 'expires_at', 'created_at']
        read_only_fields = ['id', 'code', 'delete_token', 'expires_at', 'created_at']

    def create(self, validated_data):
        raw_password = validated_data.pop('raw_password', None)
        expiry_hours = validated_data.pop('expiry_hours', 24)
        validated_data['expires_at'] = timezone.now() + timedelta(hours=expiry_hours)
        clipboard = Clipboard(**validated_data)
        if raw_password:
            clipboard.set_password(raw_password)
        clipboard.save()
        return clipboard


class ClipboardPublicSerializer(serializers.ModelSerializer):
    has_password = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    files = serializers.SerializerMethodField()

    class Meta:
        model = Clipboard
        fields = ['id', 'code', 'content', 'has_password', 'burn_after_read',
                  'is_burned', 'is_encrypted', 'is_searchable', 'expires_at',
                  'view_count', 'created_at', 'updated_at', 'is_expired', 'files']

    def get_files(self, obj):
        from files.serializers import FileShareSerializer
        return FileShareSerializer(obj.files.all(), many=True).data


class ClipboardUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clipboard
        fields = ['content']


class ClipboardSearchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clipboard
        fields = ['code', 'content', 'created_at', 'expires_at', 'is_encrypted']


class PasswordVerifySerializer(serializers.Serializer):
    password = serializers.CharField(required=True)
