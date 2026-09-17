from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [('projects','0001_initial')]
    operations = [migrations.CreateModel(name='TimesheetEntry', fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('employee_name', models.CharField(max_length=200)),
        ('work_date', models.DateField()),
        ('hours', models.DecimalField(decimal_places=2, max_digits=6)),
        ('description', models.TextField(blank=True)),
        ('billable', models.BooleanField(default=True)),
        ('status', models.CharField(choices=[('DRAFT','Draft'),('SUBMITTED','Submitted'),('APPROVED','Approved'),('REJECTED','Rejected')], default='DRAFT', max_length=20)),
        ('odoo_id', models.IntegerField(blank=True, null=True, unique=True)),
        ('created_at', models.DateTimeField(auto_now_add=True)),
        ('phase', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='projects.phase')),
        ('project', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='projects.project')),
    ])]
