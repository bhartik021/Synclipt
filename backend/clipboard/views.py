import hashlib
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from django.db.models import F, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Clipboard, ClipboardViewEvent
from .serializers import (
    ClipboardCreateSerializer, ClipboardPublicSerializer,
    ClipboardUpdateSerializer, PasswordVerifySerializer,
    ClipboardSearchResultSerializer,
)
from utils.messages import (
    CLIPBOARD_NOT_FOUND, CLIPBOARD_EXPIRED, CLIPBOARD_BURNED,
    CLIPBOARD_PASSWORD_REQUIRED, CLIPBOARD_WRONG_PASSWORD, CLIPBOARD_PASSWORD_OK,
    CLIPBOARD_DELETED,
)

logger = logging.getLogger('clipboard')


class CreateThrottle(AnonRateThrottle):
    rate = '10/min'

class UpdateThrottle(AnonRateThrottle):
    rate = '20/min'

class DeleteThrottle(AnonRateThrottle):
    rate = '10/min'

class VerifyPasswordThrottle(AnonRateThrottle):
    rate = '5/min'


class ClipboardCreateView(APIView):
    throttle_classes = [CreateThrottle]

    def post(self, request):
        serializer = ClipboardCreateSerializer(data=request.data)
        if serializer.is_valid():
            clipboard = serializer.save()
            logger.info('Clipboard created: code=%s burn=%s expiry=%s',
                        clipboard.code, clipboard.burn_after_read, clipboard.expires_at)
            return Response(ClipboardPublicSerializer(clipboard).data, status=status.HTTP_201_CREATED)
        logger.warning('Clipboard create failed: %s', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClipboardDetailView(APIView):
    def get_throttles(self):
        if self.request.method == 'PUT':
            return [UpdateThrottle()]
        if self.request.method == 'DELETE':
            return [DeleteThrottle()]
        return super().get_throttles()

    def _get_clipboard(self, code):
        try:
            return Clipboard.objects.get(code=code.upper())
        except Clipboard.DoesNotExist:
            return None

    def _check_auth(self, request, clipboard, code):
        """Return a 403 Response if the clipboard is password-protected and not unlocked."""
        if clipboard.has_password:
            session_key = f'clipboard_auth_{code.upper()}'
            if not request.session.get(session_key):
                return Response(
                    {'error': CLIPBOARD_PASSWORD_REQUIRED, 'has_password': True},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return None

    def get(self, request, code):
        clipboard = self._get_clipboard(code)
        if not clipboard:
            return Response({'error': CLIPBOARD_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

        if clipboard.is_expired:
            logger.info('Clipboard accessed but expired: code=%s', code)
            return Response({'error': CLIPBOARD_EXPIRED}, status=status.HTTP_410_GONE)

        if clipboard.is_burned:
            logger.info('Clipboard accessed but already burned: code=%s', code)
            return Response({'error': CLIPBOARD_BURNED}, status=status.HTTP_410_GONE)

        auth_error = self._check_auth(request, clipboard, code)
        if auth_error:
            logger.debug('Clipboard requires password: code=%s', code)
            return auth_error

        # Atomic increment to avoid lost-update under concurrent requests
        Clipboard.objects.filter(pk=clipboard.pk).update(view_count=F('view_count') + 1)
        clipboard.refresh_from_db(fields=['view_count'])
        logger.debug('Clipboard viewed: code=%s views=%s', code, clipboard.view_count)

        # Record view event for analytics (hash IP for privacy)
        raw_ip = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR', '')
        )
        ClipboardViewEvent.objects.create(
            clipboard=clipboard,
            ip_hash=hashlib.sha256(raw_ip.encode()).hexdigest()[:16] if raw_ip else '',
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:300],
        )

        # Burn on the first read (view_count is now 1); content is served this time,
        # the next request will hit the is_burned guard above.
        if clipboard.burn_after_read and clipboard.view_count >= 1:
            clipboard.is_burned = True
            clipboard.save(update_fields=['is_burned'])
            logger.info('Clipboard burned after read: code=%s', code)
            self._broadcast(code, 'clipboard.deleted', {'code': code, 'reason': 'burned'})

        return Response(ClipboardPublicSerializer(clipboard).data)

    def put(self, request, code):
        clipboard = self._get_clipboard(code)
        if not clipboard:
            return Response({'error': CLIPBOARD_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

        if clipboard.is_expired:
            return Response({'error': CLIPBOARD_EXPIRED}, status=status.HTTP_410_GONE)

        auth_error = self._check_auth(request, clipboard, code)
        if auth_error:
            return auth_error

        serializer = ClipboardUpdateSerializer(clipboard, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = ClipboardPublicSerializer(clipboard).data
            self._broadcast(code, 'clipboard.updated', data)
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, code):
        clipboard = self._get_clipboard(code)
        if not clipboard:
            return Response({'error': CLIPBOARD_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

        token = request.headers.get('X-Delete-Token', '').strip()
        if not token or str(clipboard.delete_token) != token:
            return Response({'error': 'Not authorised to delete this clipboard.'}, status=status.HTTP_403_FORBIDDEN)

        clipboard.delete()
        logger.info('Clipboard deleted: code=%s', code)
        self._broadcast(code, 'clipboard.deleted', {'code': code})
        return Response({'message': CLIPBOARD_DELETED}, status=status.HTTP_200_OK)

    def _broadcast(self, code, event_type, data):
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'clipboard_{code.upper()}',
                {'type': 'clipboard_event', 'event': event_type, 'data': data},
            )
        except Exception:
            logger.warning('WebSocket broadcast failed: event=%s code=%s', event_type, code)


class VerifyPasswordView(APIView):
    throttle_classes = [VerifyPasswordThrottle]

    def post(self, request, code):
        try:
            clipboard = Clipboard.objects.get(code=code.upper())
        except Clipboard.DoesNotExist:
            return Response({'error': CLIPBOARD_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

        serializer = PasswordVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if clipboard.check_password(serializer.validated_data['password']):
            request.session[f'clipboard_auth_{code.upper()}'] = True
            logger.info('Password verified for clipboard: code=%s', code)
            return Response({'message': CLIPBOARD_PASSWORD_OK})

        logger.warning('Failed password attempt for clipboard: code=%s', code)
        return Response({'error': CLIPBOARD_WRONG_PASSWORD}, status=status.HTTP_401_UNAUTHORIZED)


class ClipboardSearchView(APIView):
    """GET /api/clipboard/search/?q=... — searches opt-in public clipboards by content or code."""

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'results': []})

        qs = (
            Clipboard.objects
            .filter(is_searchable=True, is_burned=False)
            .filter(expires_at__gt=timezone.now())
            .filter(Q(content__icontains=q) | Q(code__icontains=q.upper()))
            .order_by('-created_at')[:20]
        )
        return Response({'results': ClipboardSearchResultSerializer(qs, many=True).data})


class ClipboardAnalyticsView(APIView):
    """GET /api/clipboard/<code>/analytics/ — daily view counts for a clipboard."""

    def get(self, request, code):
        try:
            clipboard = Clipboard.objects.get(code=code.upper())
        except Clipboard.DoesNotExist:
            return Response({'error': CLIPBOARD_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

        auth_error = self._check_auth(request, clipboard, code)
        if auth_error:
            return auth_error

        daily = (
            ClipboardViewEvent.objects
            .filter(clipboard=clipboard)
            .annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(views=Count('id'))
            .order_by('date')
        )

        return Response({
            'code': clipboard.code,
            'total_views': clipboard.view_count,
            'daily': [{'date': str(row['date']), 'views': row['views']} for row in daily],
        })

    def _check_auth(self, request, clipboard, code):
        if clipboard.has_password:
            session_key = f'clipboard_auth_{code.upper()}'
            if not request.session.get(session_key):
                return Response(
                    {'error': CLIPBOARD_PASSWORD_REQUIRED, 'has_password': True},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return None
