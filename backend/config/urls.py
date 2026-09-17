from django.urls import path, include
from django.http import JsonResponse

def health(request):
    return JsonResponse({'status': 'ok', 'service': 'primeprojects-api'})

urlpatterns = [
    path('health/', health),
    path('api/auth/', include('apps.core.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/timesheets/', include('apps.timesheets.urls')),
    path('api/billing/', include('apps.billing.urls')),
]
