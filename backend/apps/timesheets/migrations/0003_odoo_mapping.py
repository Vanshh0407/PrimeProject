from django.db import migrations, models
class Migration(migrations.Migration):
    dependencies=[('timesheets','0002_timesheet_workflow')]
    operations=[
      migrations.AddField(model_name='timesheetentry',name='odoo_employee_id',field=models.IntegerField(blank=True,null=True)),
      migrations.AddField(model_name='timesheetentry',name='odoo_project_id',field=models.IntegerField(blank=True,null=True)),
      migrations.AddField(model_name='timesheetentry',name='odoo_task_id',field=models.IntegerField(blank=True,null=True)),
      migrations.AddField(model_name='timesheetentry',name='sync_status',field=models.CharField(choices=[('PENDING','Pending'),('SYNCED','Synced'),('ERROR','Error')],default='PENDING',max_length=20)),
      migrations.AddField(model_name='timesheetentry',name='sync_error',field=models.TextField(blank=True)),
    ]
