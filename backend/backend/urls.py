from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # This line is crucial. It tells Django that any URL starting with "api/"
    # should be handled by the urls.py file inside our "core" app.
    path('api/', include('core.urls')),
]