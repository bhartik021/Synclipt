from django.urls import re_path
from .consumers import ClipboardConsumer
from .yjs_consumer import YjsConsumer

websocket_urlpatterns = [
    re_path(r'ws/clipboard/(?P<code>[A-Fa-f0-9]{6})/$', ClipboardConsumer.as_asgi()),
    re_path(r'ws/yjs/(?P<code>[A-Fa-f0-9]{6})/$', YjsConsumer.as_asgi()),
]
