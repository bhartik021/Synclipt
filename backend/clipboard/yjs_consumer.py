from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class YjsConsumer(AsyncWebsocketConsumer):
    """
    Binary WebSocket consumer that relays yjs CRDT updates.

    Protocol:
      - Client → Server: raw binary (Uint8Array yjs update)
      - Server → Client: raw binary (same update, echoed to all peers in the group)
    On connect, all previously persisted updates are replayed so late joiners
    converge to the current document state.
    """

    async def connect(self):
        self.code = self.scope['url_route']['kwargs']['code'].upper()
        self.group_name = f'yjs_{self.code}'

        clipboard = await self.get_clipboard()
        if not clipboard:
            await self.close(code=4004)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Replay all stored updates so this client can reconstruct the full doc
        for update_bytes in await self.load_updates():
            await self.send(bytes_data=update_bytes)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, bytes_data=None, text_data=None):
        if not bytes_data:
            return

        # Persist the update
        await self.save_update(bytes_data)

        # Broadcast to all peers (including sender — yjs deduplicates)
        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'yjs_update', 'update': bytes_data.hex()},
        )

    async def yjs_update(self, event):
        """Handler invoked by channel_layer.group_send."""
        await self.send(bytes_data=bytes.fromhex(event['update']))

    # ── DB helpers ──────────────────────────────────────────────────────────

    @database_sync_to_async
    def get_clipboard(self):
        from clipboard.models import Clipboard
        try:
            c = Clipboard.objects.get(code=self.code)
            return None if (c.is_expired or c.is_burned) else {'code': c.code}
        except Clipboard.DoesNotExist:
            return None

    @database_sync_to_async
    def load_updates(self):
        from clipboard.models import YjsUpdate
        return [bytes(u.update) for u in YjsUpdate.objects.filter(clipboard__code=self.code)]

    @database_sync_to_async
    def save_update(self, data: bytes):
        from clipboard.models import Clipboard, YjsUpdate
        try:
            clipboard = Clipboard.objects.get(code=self.code)
            YjsUpdate.objects.create(clipboard=clipboard, update=data)
        except Clipboard.DoesNotExist:
            pass
