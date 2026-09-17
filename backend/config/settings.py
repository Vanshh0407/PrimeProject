import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name):
    value = os.environ.get(name)
    if value is None:
        raise RuntimeError(f'Required environment variable {name} is not set.')
    return value


SECRET_KEY = env('DJANGO_SECRET_KEY')
DEBUG = env('DJANGO_DEBUG').lower() == 'true'
ALLOWED_HOSTS = [h for h in env('DJANGO_ALLOWED_HOSTS').split(',') if h]

PRIMEPROJECTS_SERVICE_TOKEN = env('PRIMEPROJECTS_SERVICE_TOKEN')

INSTALLED_APPS = [
    'django.contrib.auth', 'rest_framework.authtoken', 'django.contrib.contenttypes',
    'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles',
    'rest_framework', 'corsheaders',
    'apps.core', 'apps.projects', 'apps.timesheets', 'apps.billing',
]
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', 'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', 'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [], 'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {'default': dj_database_url.parse(env('DJANGO_DATABASE_URL'))}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', '').lower() == 'true'
CORS_ALLOWED_ORIGINS = [o for o in env('DJANGO_CORS_ALLOWED_ORIGINS').split(',') if o]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.core.authentication.PrimeProjectsTokenAuthentication',
        'apps.core.authentication.ServiceTokenAuthentication',
    ],
}
