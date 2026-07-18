from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/clipboard/', include('clipboard.urls')),
    path('api/files/', include('files.urls')),
]
