import uuid
import secrets
from django.db import models, IntegrityError
from django.utils import timezone
from django.contrib.auth.hashers import make_password


class Clipboard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=6, unique=True, db_index=True)
    delete_token = models.UUIDField(default=uuid.uuid4, editable=False)
    content = models.TextField(blank=True, default='')
    password = models.CharField(max_length=128, blank=True, null=True)
    expires_at = models.DateTimeField()
    burn_after_read = models.BooleanField(default=False)
    is_burned = models.BooleanField(default=False)
    is_encrypted = models.BooleanField(default=False)
    is_searchable = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Clipboard {self.code}'

    def save(self, *args, **kwargs):
        if not self.code:
            # Retry on IntegrityError to avoid TOCTOU race with concurrent creates
            for _ in range(10):
                self.code = secrets.token_hex(3).upper()
                try:
                    super().save(*args, **kwargs)
                    return
                except IntegrityError:
                    self.code = ''
            raise IntegrityError('Could not generate a unique clipboard code after 10 attempts')
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def has_password(self):
        return bool(self.password)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password)


class ClipboardViewEvent(models.Model):
    clipboard = models.ForeignKey(Clipboard, on_delete=models.CASCADE, related_name='view_events')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_hash = models.CharField(max_length=64, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'View of {self.clipboard.code} at {self.timestamp}'


class YjsUpdate(models.Model):
    clipboard = models.ForeignKey(Clipboard, on_delete=models.CASCADE, related_name='yjs_updates')
    update = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
