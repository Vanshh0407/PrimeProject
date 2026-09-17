from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import BillingProposal, Invoice, InvoiceLine, InvoicePayment
class BillingProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model=BillingProposal; fields='__all__'; read_only_fields=['amount']
    def validate(self, d):
        if d.get('hours',0)<0 or d.get('rate',0)<0: raise serializers.ValidationError('Hours and rate must be non-negative.')
        return d
    def create(self,d): d['amount']=(d['hours']*d['rate']).quantize(Decimal('0.01')); return super().create(d)
class InvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model=InvoiceLine; fields=['id','phase','description','quantity','unit_price','amount','billable_source']; read_only_fields=['id','amount']
    def validate(self,d):
        if d['quantity']<=0 or d['unit_price']<0: raise serializers.ValidationError('Quantity must be positive and unit price non-negative.')
        return d
class InvoicePaymentSerializer(serializers.ModelSerializer):
    class Meta: model=InvoicePayment; fields='__all__'; read_only_fields=['id','invoice']
class InvoiceSerializer(serializers.ModelSerializer):
    lines=InvoiceLineSerializer(many=True)
    payments=InvoicePaymentSerializer(many=True,read_only=True)
    balance_due=serializers.SerializerMethodField()
    class Meta:
        model=Invoice; fields='__all__'; read_only_fields=['subtotal','tax_amount','total','odoo_sync_state','odoo_sync_error','odoo_last_synced_at','created_at','updated_at']
    def get_balance_due(self,obj):
        paid=sum((p.amount for p in obj.payments.all()),Decimal('0'))
        return str(max(Decimal('0'),obj.total-paid).quantize(Decimal('0.01')))
    def _recalculate(self,invoice):
        subtotal=sum((l.amount for l in invoice.lines.all()),Decimal('0')).quantize(Decimal('0.01'))
        invoice.subtotal=subtotal; invoice.tax_amount=(subtotal*(invoice.tax_rate or 0)/Decimal('100')).quantize(Decimal('0.01')); invoice.total=invoice.subtotal+invoice.tax_amount; invoice.save(update_fields=['subtotal','tax_amount','total','updated_at'])
    @transaction.atomic
    def create(self,d):
        lines=d.pop('lines',[]); invoice=Invoice.objects.create(**d)
        for line in lines: InvoiceLine.objects.create(invoice=invoice,amount=(line['quantity']*line['unit_price']).quantize(Decimal('0.01')),**line)
        self._recalculate(invoice); return invoice
    @transaction.atomic
    def update(self,instance,d):
        if instance.status!='DRAFT': raise serializers.ValidationError('Only draft invoices can be edited.')
        lines=d.pop('lines',None)
        instance=super().update(instance,d)
        if lines is not None:
            instance.lines.all().delete()
            for line in lines: InvoiceLine.objects.create(invoice=instance,amount=(line['quantity']*line['unit_price']).quantize(Decimal('0.01')),**line)
        self._recalculate(instance); return instance
