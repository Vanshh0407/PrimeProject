from rest_framework.routers import DefaultRouter
from .views import TimesheetViewSet
router=DefaultRouter(); router.register('entries',TimesheetViewSet)
urlpatterns=router.urls
