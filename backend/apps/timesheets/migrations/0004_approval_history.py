from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
class Migration(migrations.Migration):
    dependencies=[('timesheets','0003_odoo_mapping'),migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations=[
        migrations.AddField(model_name='timesheetentry',name='rejection_reason',field=models.TextField(blank=True,default='')),
        migrations.AddField(model_name='timesheetentry',name='updated_at',field=models.DateTimeField(auto_now=True,null=True)),
        migrations.CreateModel(name='TimesheetApproval',fields=[('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),('action',models.CharField(choices=[('SUBMIT','Submit'),('APPROVE','Approve'),('REJECT','Reject'),('RESUBMIT','Resubmit')],max_length=20)),('comment',models.TextField(blank=True)),('previous_status',models.CharField(max_length=20)),('new_status',models.CharField(max_length=20)),('performed_at',models.DateTimeField(auto_now_add=True)),('performed_by',models.ForeignKey(blank=True,null=True,on_delete=django.db.models.deletion.PROTECT,to=settings.AUTH_USER_MODEL)),('timesheet',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name='approval_history',to='timesheets.timesheetentry'))]),
    ]
