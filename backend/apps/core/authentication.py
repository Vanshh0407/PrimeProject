from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication, TokenAuthentication

class ServiceTokenAuthentication(BaseAuthentication):
    """Authenticate trusted internal services using X-Service-Token."""
    keyword = 'X-Service-Token'

    def authenticate(self, request):
        expected = getattr(settings, 'PRIMEPROJECTS_SERVICE_TOKEN', '')
        supplied = request.headers.get(self.keyword)
        if not expected or not supplied or supplied != expected:
            return None
        User = get_user_model()
        user, _ = User.objects.get_or_create(
            username='integration-worker',
            defaults={'is_staff': True, 'is_superuser': False},
        )
        return user, None

class PrimeProjectsTokenAuthentication(TokenAuthentication):
    """Standard DRF token authentication for human/API clients."""
    keyword = 'Token'
