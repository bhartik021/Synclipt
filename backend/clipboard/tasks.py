from celery import shared_task
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@shared_task
def delete_expired_clipboards():
    from clipboard.models import Clipboard
    channel_layer = get_channel_layer()
    # Include burned clipboards — they were already served; clean them up too
    expired = Clipboard.objects.filter(expires_at__lt=timezone.now())
    count = 0
    for clipboard in expired:
        try:
            async_to_sync(channel_layer.group_send)(
                f'clipboard_{clipboard.code}',
                {'type': 'clipboard_event', 'event': 'clipboard.expired',
                 'data': {'code': clipboard.code}}
            )
        except Exception:
            pass
        clipboard.delete()
        count += 1
    return f'Deleted {count} expired clipboards'


@shared_task
def delete_expired_files():
    from files.models import FileShare
    expired = FileShare.objects.filter(expires_at__lt=timezone.now())
    count = 0
    # Iterate individually so post_delete signal fires and removes physical files
    for file_share in expired:
        file_share.delete()
        count += 1
    return f'Deleted {count} expired files'
