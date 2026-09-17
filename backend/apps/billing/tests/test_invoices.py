from datetime import date, timedelta
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from apps.projects.models import Project, Phase
from apps.billing.models import Invoice, InvoiceLine, InvoiceSyncJob

class InvoiceWorkflowTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('finance', password='pass')
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(name='Project B', customer_name='Customer B')
        self.phase = Phase.objects.create(project=self.project, name='Phase B')
        self.invoice = Invoice.objects.create(
            number='INV-TEST-001', project=self.project, customer_name='Customer',
            invoice_date=date.today(), due_date=date.today()+timedelta(days=30), tax_rate='10',
            subtotal='200', tax_amount='20', total='220'
        )
        InvoiceLine.objects.create(invoice=self.invoice, phase=self.phase,
                                   description='Work', quantity='2', unit_price='100', amount='200')

    def test_issue_requires_positive_lines(self):
        r = self.client.post(f'/api/billing/invoices/{self.invoice.id}/issue/')
        self.assertEqual(r.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'ISSUED')

    def test_sync_job_claim_is_idempotently_locked(self):
        job = InvoiceSyncJob.objects.create(invoice=self.invoice, operation='PUSH_INVOICE', idempotency_key='test-job')
        r = self.client.post(f'/api/billing/sync-jobs/{job.id}/claim/')
        self.assertEqual(r.status_code, 200)
        r = self.client.post(f'/api/billing/sync-jobs/{job.id}/claim/')
        self.assertEqual(r.status_code, 409)
