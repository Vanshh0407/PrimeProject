from rest_framework import serializers
from .models import TimesheetEntry, TimesheetApproval
class TimesheetApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model=TimesheetApproval; fields='__all__'
class TimesheetSerializer(serializers.ModelSerializer):
    approval_history=TimesheetApprovalSerializer(many=True,read_only=True)
    class Meta:
        model=TimesheetEntry; fields='__all__'; read_only_fields=['sync_status','sync_error','odoo_id','created_at','updated_at','approval_history']
    def validate(self, attrs):
        instance=self.instance or TimesheetEntry()
        for k,v in attrs.items(): setattr(instance,k,v)
        instance.full_clean(exclude=['odoo_id'])
        return attrs
