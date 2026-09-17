from rest_framework.routers import DefaultRouter
from .views import BillingProposalViewSet, InvoiceViewSet, InvoiceSyncJobViewSet
router = DefaultRouter()
router.register('proposals', BillingProposalViewSet)
router.register('invoices', InvoiceViewSet)
router.register('sync-jobs', InvoiceSyncJobViewSet, basename='invoice-sync-job')
urlpatterns = router.urls
