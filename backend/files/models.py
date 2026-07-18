import uuid
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from clipboard.models import Clipboard


class FileShare(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clipboard = models.ForeignKey(
        Clipboard, on_delete=models.CASCADE, related_name='files', null=True, blank=True
    )
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    original_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    expires_at = models.DateTimeField()
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'File {self.original_name}'

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


@receiver(post_delete, sender=FileShare)
def delete_file_on_record_delete(sender, instance, **kwargs):
    if instance.file:
        try:
            instance.file.delete(save=False)
        except Exception:
            pass
