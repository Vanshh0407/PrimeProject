from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [('billing', '0003_invoice_odoo_sync')]
    operations = [
        migrations.CreateModel(
            name='InvoiceSyncJob',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('operation', models.CharField(choices=[('PUSH_INVOICE','Push Invoice'),('PULL_PAYMENT_STATUS','Pull Payment Status')], max_length=30)),
                ('status', models.CharField(choices=[('QUEUED','Queued'),('PROCESSING','Processing'),('SUCCEEDED','Succeeded'),('RETRY','Retry'),('FAILED','Failed')], default='QUEUED', max_length=20)),
                ('attempts', models.PositiveIntegerField(default=0)),
                ('max_attempts', models.PositiveIntegerField(default=5)),
                ('next_attempt_at', models.DateTimeField(blank=True, null=True)),
                ('idempotency_key', models.CharField(max_length=120, unique=True)),
                ('last_error', models.TextField(blank=True)),
                ('response_payload', models.JSONField(blank=True, default=dict)),
                ('locked_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sync_jobs', to='billing.invoice')),
            ],
            options={'indexes': [
                models.Index(fields=['status','next_attempt_at'], name='billing_inv_status_5c4a5d_idx'),
                models.Index(fields=['invoice','operation'], name='billing_inv_invoice_9f4e5e_idx'),
            ]},
        ),
    ]
