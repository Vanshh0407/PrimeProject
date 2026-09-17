from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(name='Project', fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ('name', models.CharField(max_length=200)),
            ('customer_name', models.CharField(max_length=200)),
            ('odoo_id', models.IntegerField(blank=True, null=True, unique=True)),
            ('created_at', models.DateTimeField(auto_now_add=True)),
        ]),
        migrations.CreateModel(name='Phase', fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ('name', models.CharField(max_length=200)),
            ('budget_hours', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ('billing_rate', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ('is_billable', models.BooleanField(default=True)),
            ('odoo_id', models.IntegerField(blank=True, null=True, unique=True)),
            ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='phases', to='projects.project')),
        ]),
    ]
