import logging
import mimetypes
from django.http import Http404, HttpResponseRedirect
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.db.models import F
from .models import FileShare
from .serializers import FileShareSerializer
from utils.messages import (
    FILE_NOT_PROVIDED, FILE_TOO_LARGE, FILE_TYPE_NOT_ALLOWED,
    FILE_EXPIRED, FILE_DELETED,
)

logger = logging.getLogger('files')

ALLOWED_TYPES = getattr(settings, 'ALLOWED_FILE_TYPES', [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
])
MAX_SIZE = getattr(settings, 'MAX_UPLOAD_SIZE', 52428800)


class FileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'error': FILE_NOT_PROVIDED}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded.size > MAX_SIZE:
            msg = FILE_TOO_LARGE.format(max_mb=MAX_SIZE // 1048576)
            logger.warning('File upload rejected — too large: size=%s', uploaded.size)
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        content_type = uploaded.content_type or mimetypes.guess_type(uploaded.name)[0] or 'application/octet-stream'
        if content_type not in ALLOWED_TYPES:
            msg = FILE_TYPE_NOT_ALLOWED.format(content_type=content_type)
            logger.warning('File upload rejected — disallowed type: %s', content_type)
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        try:
            expiry_hours = int(request.data.get('expiry_hours', 24))
        except (ValueError, TypeError):
            expiry_hours = 24
        clipboard_code = request.data.get('clipboard_code', '').upper()

        clipboard = None
        if clipboard_code:
            from clipboard.models import Clipboard
            try:
                clipboard = Clipboard.objects.get(code=clipboard_code)
            except Clipboard.DoesNotExist:
                pass

        file_share = FileShare.objects.create(
            clipboard=clipboard,
            file=uploaded,
            original_name=uploaded.name,
            file_type=content_type,
            size=uploaded.size,
            expires_at=timezone.now() + timedelta(hours=expiry_hours),
        )
        logger.info('File uploaded: id=%s name=%s size=%s', file_share.id, uploaded.name, uploaded.size)
        return Response(
            FileShareSerializer(file_share, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class FileDetailView(APIView):

    def get(self, request, file_id):
        try:
            f = FileShare.objects.get(id=file_id)
        except FileShare.DoesNotExist:
            raise Http404

        if f.is_expired:
            return Response({'error': FILE_EXPIRED}, status=status.HTTP_410_GONE)

        return Response(FileShareSerializer(f, context={'request': request}).data)

    def delete(self, request, file_id):
        try:
            f = FileShare.objects.get(id=file_id)
        except FileShare.DoesNotExist:
            raise Http404

        # post_delete signal on FileShare handles physical file removal
        f.delete()
        logger.info('File deleted: id=%s', file_id)
        return Response({'message': FILE_DELETED}, status=status.HTTP_200_OK)


class FileDownloadView(APIView):

    def get(self, request, file_id):
        try:
            f = FileShare.objects.get(id=file_id)
        except FileShare.DoesNotExist:
            raise Http404

        if f.is_expired:
            return Response({'error': FILE_EXPIRED}, status=status.HTTP_410_GONE)

        FileShare.objects.filter(pk=f.pk).update(download_count=F('download_count') + 1)
        f.refresh_from_db(fields=['download_count'])
        logger.info('File downloaded: id=%s name=%s downloads=%s', f.id, f.original_name, f.download_count)
        return HttpResponseRedirect(f.file.url)
