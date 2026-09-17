from decimal import Decimal
from django.db import models
from apps.projects.models import Project, Phase

class BillingProposal(models.Model):
    STATUS_CHOICES = [('DRAFT','Draft'),('SUBMITTED','Submitted'),('APPROVED','Approved'),('REJECTED','Rejected'),('INVOICED','Invoiced')]
    project=models.ForeignKey(Project,on_delete=models.PROTECT,related_name='billing_proposals')
    phase=models.ForeignKey(Phase,on_delete=models.PROTECT,related_name='billing_proposals')
    hours=models.DecimalField(max_digits=10,decimal_places=2)
    rate=models.DecimalField(max_digits=10,decimal_places=2)
    amount=models.DecimalField(max_digits=12,decimal_places=2)
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='DRAFT')
    idempotency_key=models.CharField(max_length=100,unique=True)
    odoo_invoice_id=models.IntegerField(null=True,blank=True,unique=True)
    created_at=models.DateTimeField(auto_now_add=True)

class Invoice(models.Model):
    STATUS_CHOICES=[('DRAFT','Draft'),('ISSUED','Issued'),('SENT','Sent'),('PARTIAL','Partially Paid'),('PAID','Paid'),('VOID','Void')]
    number=models.CharField(max_length=50,unique=True)
    project=models.ForeignKey(Project,on_delete=models.PROTECT,related_name='invoices')
    customer_name=models.CharField(max_length=200)
    invoice_date=models.DateField()
    due_date=models.DateField()
    currency=models.CharField(max_length=3,default='USD')
    subtotal=models.DecimalField(max_digits=14,decimal_places=2,default=0)
    tax_rate=models.DecimalField(max_digits=6,decimal_places=2,default=0)
    tax_amount=models.DecimalField(max_digits=14,decimal_places=2,default=0)
    total=models.DecimalField(max_digits=14,decimal_places=2,default=0)
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='DRAFT')
    notes=models.TextField(blank=True)
    odoo_invoice_id=models.IntegerField(null=True,blank=True,unique=True)
    odoo_sync_state=models.CharField(max_length=20,choices=[('PENDING','Pending'),('SYNCED','Synced'),('ERROR','Error')],default='PENDING')
    odoo_sync_error=models.TextField(blank=True)
    odoo_last_synced_at=models.DateTimeField(null=True,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

class InvoiceLine(models.Model):
    invoice=models.ForeignKey(Invoice,on_delete=models.CASCADE,related_name='lines')
    phase=models.ForeignKey(Phase,on_delete=models.PROTECT,null=True,blank=True)
    description=models.CharField(max_length=500)
    quantity=models.DecimalField(max_digits=10,decimal_places=2)
    unit_price=models.DecimalField(max_digits=12,decimal_places=2)
    amount=models.DecimalField(max_digits=14,decimal_places=2)
    billable_source=models.CharField(max_length=30,default='MANUAL')

class InvoicePayment(models.Model):
    invoice=models.ForeignKey(Invoice,on_delete=models.CASCADE,related_name='payments')
    payment_date=models.DateField()
    amount=models.DecimalField(max_digits=14,decimal_places=2)
    reference=models.CharField(max_length=200,blank=True)
    odoo_payment_id=models.IntegerField(null=True,blank=True,unique=True)
    created_at=models.DateTimeField(auto_now_add=True)


class InvoiceSyncJob(models.Model):
    OP_CHOICES = [('PUSH_INVOICE', 'Push Invoice'), ('PULL_PAYMENT_STATUS', 'Pull Payment Status')]
    STATUS_CHOICES = [('QUEUED', 'Queued'), ('PROCESSING', 'Processing'), ('SUCCEEDED', 'Succeeded'), ('RETRY', 'Retry'), ('FAILED', 'Failed')]
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='sync_jobs')
    operation = models.CharField(max_length=30, choices=OP_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='QUEUED')
    attempts = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=5)
    next_attempt_at = models.DateTimeField(null=True, blank=True)
    idempotency_key = models.CharField(max_length=120, unique=True)
    last_error = models.TextField(blank=True)
    response_payload = models.JSONField(default=dict, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'next_attempt_at']),
            models.Index(fields=['invoice', 'operation']),
        ]
