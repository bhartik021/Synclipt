import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ClipboardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.code = self.scope['url_route']['kwargs']['code'].upper()
        self.group_name = f'clipboard_{self.code}'

        clipboard = await self.get_clipboard()
        if not clipboard:
            await self.close(code=4004)
            return

        # Store whether this clipboard requires a password so receive() can guard updates
        self.clipboard_has_password = clipboard['has_password']

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection.established',
            'code': self.code,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

        elif msg_type == 'clipboard.update':
            # Reject WS writes on password-protected clipboards (no session available in WS scope)
            if getattr(self, 'clipboard_has_password', False):
                return
            content = data.get('content', '')
            updated = await self.update_clipboard_content(content)
            if updated:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'clipboard_event',
                        'event': 'clipboard.updated',
                        'data': {'code': self.code, 'content': content},
                    }
                )

    async def clipboard_event(self, event):
        await self.send(text_data=json.dumps({
            'type': event['event'],
            'data': event['data'],
        }))

    @database_sync_to_async
    def get_clipboard(self):
        from clipboard.models import Clipboard
        try:
            c = Clipboard.objects.get(code=self.code)
            if c.is_expired or c.is_burned:
                return None
            # Return a plain dict so password field is safely read in async context
            return {'has_password': c.has_password}
        except Clipboard.DoesNotExist:
            return None

    @database_sync_to_async
    def update_clipboard_content(self, content):
        from clipboard.models import Clipboard
        try:
            c = Clipboard.objects.get(code=self.code)
            if not c.is_expired and not c.is_burned:
                c.content = content
                c.save(update_fields=['content', 'updated_at'])
                return True
        except Clipboard.DoesNotExist:
            pass
        return False
