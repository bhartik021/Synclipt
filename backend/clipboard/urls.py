from django.urls import path
from .views import (
    ClipboardCreateView, ClipboardDetailView, VerifyPasswordView,
    ClipboardSearchView, ClipboardAnalyticsView,
)

urlpatterns = [
    path('', ClipboardCreateView.as_view(), name='clipboard-create'),
    path('search/', ClipboardSearchView.as_view(), name='clipboard-search'),
    path('<str:code>/', ClipboardDetailView.as_view(), name='clipboard-detail'),
    path('<str:code>/verify-password/', VerifyPasswordView.as_view(), name='clipboard-verify-password'),
    path('<str:code>/analytics/', ClipboardAnalyticsView.as_view(), name='clipboard-analytics'),
]
