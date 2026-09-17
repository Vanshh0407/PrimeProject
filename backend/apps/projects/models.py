from django.db import models
class Project(models.Model):
    name=models.CharField(max_length=200); customer_name=models.CharField(max_length=200)
    odoo_id=models.IntegerField(null=True, blank=True, unique=True)
    created_at=models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name
class Phase(models.Model):
    project=models.ForeignKey(Project,on_delete=models.CASCADE,related_name='phases')
    name=models.CharField(max_length=200); budget_hours=models.DecimalField(max_digits=10,decimal_places=2,default=0)
    billing_rate=models.DecimalField(max_digits=10,decimal_places=2,default=0); is_billable=models.BooleanField(default=True)
    odoo_id=models.IntegerField(null=True,blank=True,unique=True)
    def __str__(self): return f'{self.project.name} / {self.name}'
