from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BillingProposal, Invoice, InvoicePayment, InvoiceSyncJob
from .serializers import BillingProposalSerializer, InvoiceSerializer, InvoicePaymentSerializer
class BillingProposalViewSet(viewsets.ModelViewSet):
    queryset=BillingProposal.objects.select_related('project','phase').all().order_by('-created_at'); serializer_class=BillingProposalSerializer
    @action(detail=False,methods=['post'])
    def calculate(self,request):
        hours=Decimal(str(request.data.get('hours','0'))); rate=Decimal(str(request.data.get('rate','0')))
        if hours<0 or rate<0:return Response({'detail':'hours and rate must be non-negative'},400)
        return Response({'hours':str(hours),'rate':str(rate),'amount':str((hours*rate).quantize(Decimal('0.01')))})
    @action(detail=True,methods=['post'])
    def submit(self,request,pk=None):
        obj=self.get_object()
        if obj.status not in ('DRAFT','REJECTED'):return Response({'detail':'Only draft or rejected proposals can be submitted'},400)
        obj.status='SUBMITTED'; obj.save(update_fields=['status']); return Response(self.get_serializer(obj).data)
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset=Invoice.objects.prefetch_related('lines','payments','sync_jobs').select_related('project').all().order_by('-invoice_date','-id'); serializer_class=InvoiceSerializer
    @action(detail=True,methods=['post'])
    def issue(self,request,pk=None):
        invoice=self.get_object()
        if invoice.status!='DRAFT':return Response({'detail':'Only draft invoices can be issued'},400)
        if not invoice.lines.exists() or invoice.total<=0:return Response({'detail':'Invoice must contain lines and have a positive total'},400)
        invoice.status='ISSUED'; invoice.save(update_fields=['status','updated_at']); return Response(self.get_serializer(invoice).data)
    @action(detail=True,methods=['post'])
    def record_payment(self,request,pk=None):
        invoice=self.get_object()
        if invoice.status in ('DRAFT','VOID'):return Response({'detail':'Payments cannot be recorded for this invoice'},400)
        data=request.data.copy(); data['invoice']=invoice.id; s=InvoicePaymentSerializer(data=data); s.is_valid(raise_exception=True)
        with transaction.atomic():
            payment=s.save(); paid=sum((p.amount for p in invoice.payments.all()),Decimal('0')); invoice.status='PAID' if paid>=invoice.total else 'PARTIAL'; invoice.save(update_fields=['status','updated_at'])
        return Response(InvoicePaymentSerializer(payment).data,201)
    @action(detail=True,methods=['post'])
    def void(self,request,pk=None):
        invoice=self.get_object()
        if invoice.status=='PAID':return Response({'detail':'Paid invoices require a credit-note workflow'},400)
        invoice.status='VOID'; invoice.save(update_fields=['status','updated_at']); return Response(self.get_serializer(invoice).data)
    def _queue(self,invoice,operation):
        key=f'{operation}:{invoice.id}'
        job,created=InvoiceSyncJob.objects.get_or_create(idempotency_key=key,defaults={'invoice':invoice,'operation':operation})
        if job.status in ('FAILED','RETRY','SUCCEEDED'):
            job.status='QUEUED'; job.attempts=0; job.last_error=''; job.next_attempt_at=timezone.now(); job.locked_at=None; job.save(update_fields=['status','attempts','last_error','next_attempt_at','locked_at','updated_at'])
        return job
    @action(detail=True,methods=['post'],url_path='sync-to-odoo')
    def sync_to_odoo(self,request,pk=None):
        job=self._queue(self.get_object(),'PUSH_INVOICE'); return Response({'job_id':job.id,'status':job.status},202)
    @action(detail=True,methods=['post'],url_path='refresh-payment-status')
    def refresh_payment_status(self,request,pk=None):
        job=self._queue(self.get_object(),'PULL_PAYMENT_STATUS'); return Response({'job_id':job.id,'status':job.status},202)
class InvoiceSyncJobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset=InvoiceSyncJob.objects.select_related('invoice').all().order_by('-created_at')
    @action(detail=True,methods=['post'])
    def claim(self,request,pk=None):
        with transaction.atomic():
            job=InvoiceSyncJob.objects.select_for_update().get(pk=pk)
            now=timezone.now()
            if job.status not in ('QUEUED','RETRY') or (job.next_attempt_at and job.next_attempt_at>now): return Response({'status':job.status},409)
            job.status='PROCESSING'; job.attempts+=1; job.locked_at=now; job.save(update_fields=['status','attempts','locked_at','updated_at'])
        return Response({'status':job.status,'attempts':job.attempts})
    @action(detail=True,methods=['post'])
    def complete(self,request,pk=None):
        with transaction.atomic():
            job=InvoiceSyncJob.objects.select_for_update().select_related('invoice').get(pk=pk)
            if job.status!='PROCESSING': return Response({'detail':'Job is not processing'},409)
            result=request.data.get('result',{}); job.status='SUCCEEDED'; job.response_payload=result; job.last_error=''; job.next_attempt_at=None; job.save(update_fields=['status','response_payload','last_error','next_attempt_at','updated_at'])
            inv=job.invoice
            if job.operation=='PUSH_INVOICE':
                payload=result.get('invoice',result); inv.odoo_invoice_id=payload.get('id'); inv.odoo_sync_state='SYNCED'; inv.odoo_sync_error=''; inv.odoo_last_synced_at=timezone.now(); inv.save(update_fields=['odoo_invoice_id','odoo_sync_state','odoo_sync_error','odoo_last_synced_at','updated_at'])
            elif job.operation=='PULL_PAYMENT_STATUS':
                p=result.get('payment_status',result); state=p.get('payment_state'); residual=Decimal(str(p.get('amount_residual',inv.total)))
                if state=='paid' or residual<=0: inv.status='PAID'
                elif state in ('partial','in_payment') or residual<inv.total: inv.status='PARTIAL'
                inv.odoo_last_synced_at=timezone.now(); inv.save(update_fields=['status','odoo_last_synced_at','updated_at'])
        return Response({'status':'SUCCEEDED'})
    @action(detail=True,methods=['post'])
    def fail(self,request,pk=None):
        with transaction.atomic():
            job=InvoiceSyncJob.objects.select_for_update().get(pk=pk); job.last_error=str(request.data.get('error','Unknown error')); job.status='RETRY' if job.attempts<job.max_attempts else 'FAILED'; job.next_attempt_at=timezone.now()+timedelta(minutes=min(60,2**max(job.attempts-1,0))) if job.status=='RETRY' else None; job.save(update_fields=['status','last_error','next_attempt_at','updated_at'])
            if job.operation=='PUSH_INVOICE': Invoice.objects.filter(pk=job.invoice_id).update(odoo_sync_state='ERROR',odoo_sync_error=job.last_error)
        return Response({'status':job.status,'last_error':job.last_error})
    @action(detail=False,methods=['post'])
    def retry_failed(self,request):
        count=InvoiceSyncJob.objects.filter(status='FAILED').update(status='QUEUED',attempts=0,last_error='',next_attempt_at=timezone.now()); return Response({'requeued':count})
    def list(self,request,*args,**kwargs):
        qs=self.get_queryset(); status=request.query_params.get('status');
        if status: qs=qs.filter(status__in=[s for s in status.split(',') if s])
        return Response([{'id':j.id,'invoice':j.invoice_id,'operation':j.operation,'status':j.status,'attempts':j.attempts,'last_error':j.last_error,'next_attempt_at':j.next_attempt_at,'created_at':j.created_at,'updated_at':j.updated_at} for j in qs[:200]])
