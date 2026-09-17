from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [('projects','0001_initial')]
    operations = [migrations.CreateModel(name='BillingProposal', fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('hours', models.DecimalField(decimal_places=2, max_digits=10)),
        ('rate', models.DecimalField(decimal_places=2, max_digits=10)),
        ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
        ('status', models.CharField(default='DRAFT', max_length=20)),
        ('idempotency_key', models.CharField(max_length=100, unique=True)),
        ('odoo_invoice_id', models.IntegerField(blank=True, null=True, unique=True)),
        ('created_at', models.DateTimeField(auto_now_add=True)),
        ('phase', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='projects.phase')),
        ('project', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='projects.project')),
    ])]
