from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('billing', '0002_invoice_models')]
    operations = [
        migrations.AddField(model_name='invoice', name='odoo_sync_state',
            field=models.CharField(choices=[('PENDING','Pending'),('SYNCED','Synced'),('ERROR','Error')],
                                  default='PENDING', max_length=20)),
        migrations.AddField(model_name='invoice', name='odoo_sync_error',
            field=models.TextField(blank=True)),
        migrations.AddField(model_name='invoice', name='odoo_last_synced_at',
            field=models.DateTimeField(blank=True, null=True)),
    ]
