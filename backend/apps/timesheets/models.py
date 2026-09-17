from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from apps.projects.models import Project, Phase

class TimesheetEntry(models.Model):
    STATUS_CHOICES=[('DRAFT','Draft'),('SUBMITTED','Submitted'),('APPROVED','Approved'),('REJECTED','Rejected')]
    employee_name=models.CharField(max_length=200)
    project=models.ForeignKey(Project,on_delete=models.PROTECT)
    phase=models.ForeignKey(Phase,on_delete=models.PROTECT)
    work_date=models.DateField()
    hours=models.DecimalField(max_digits=6,decimal_places=2)
    description=models.TextField(blank=True)
    billable=models.BooleanField(default=True)
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='DRAFT')
    rejection_reason=models.TextField(blank=True)
    odoo_id=models.IntegerField(null=True,blank=True,unique=True)
    odoo_employee_id=models.IntegerField(null=True,blank=True)
    odoo_project_id=models.IntegerField(null=True,blank=True)
    odoo_task_id=models.IntegerField(null=True,blank=True)
    sync_status=models.CharField(max_length=20,choices=[('PENDING','Pending'),('SYNCED','Synced'),('ERROR','Error')],default='PENDING')
    sync_error=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    def clean(self):
        if self.hours <= 0 or self.hours > 24:
            raise ValidationError({'hours':'Hours must be greater than 0 and no more than 24.'})
        if self.phase.project_id != self.project_id:
            raise ValidationError({'phase':'Phase does not belong to the selected project.'})
        if self.status in ('SUBMITTED','APPROVED'):
            duplicate=TimesheetEntry.objects.filter(employee_name=self.employee_name,work_date=self.work_date,project=self.project).exclude(pk=self.pk).exclude(status='REJECTED').exists()
            if duplicate:
                raise ValidationError('A timesheet for this employee, date and project already exists.')

class TimesheetApproval(models.Model):
    timesheet=models.ForeignKey(TimesheetEntry,on_delete=models.CASCADE,related_name='approval_history')
    action=models.CharField(max_length=20,choices=[('SUBMIT','Submit'),('APPROVE','Approve'),('REJECT','Reject'),('RESUBMIT','Resubmit')])
    performed_by=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,blank=True,on_delete=models.PROTECT)
    comment=models.TextField(blank=True)
    previous_status=models.CharField(max_length=20)
    new_status=models.CharField(max_length=20)
    performed_at=models.DateTimeField(auto_now_add=True)
