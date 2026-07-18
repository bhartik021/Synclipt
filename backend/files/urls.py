from django.urls import path
from .views import FileUploadView, FileDetailView, FileDownloadView

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('<uuid:file_id>/', FileDetailView.as_view(), name='file-detail'),
    path('<uuid:file_id>/download/', FileDownloadView.as_view(), name='file-download'),
]
