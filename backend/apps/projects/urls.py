from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, PhaseViewSet
router=DefaultRouter(); router.register('projects',ProjectViewSet); router.register('phases',PhaseViewSet)
urlpatterns=router.urls
