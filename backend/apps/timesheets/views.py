from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TimesheetEntry, TimesheetApproval
from .serializers import TimesheetSerializer
class TimesheetViewSet(viewsets.ModelViewSet):
    queryset=TimesheetEntry.objects.prefetch_related('approval_history').select_related('project','phase').all().order_by('-work_date','-id')
    serializer_class=TimesheetSerializer
    def _transition(self,obj,new_status,action_name,comment=''):
        allowed={'DRAFT':['SUBMITTED'],'REJECTED':['SUBMITTED'],'SUBMITTED':['APPROVED','REJECTED'],'APPROVED':[]}
        if new_status not in allowed.get(obj.status,[]):
            return Response({'detail':f'Cannot transition from {obj.status} to {new_status}'},status=400)
        old=obj.status
        obj.status=new_status
        if new_status!='REJECTED': obj.rejection_reason=''
        obj.full_clean(exclude=['odoo_id']); obj.save()
        TimesheetApproval.objects.create(timesheet=obj,action=action_name,performed_by=self.request.user if self.request.user.is_authenticated else None,comment=comment,previous_status=old,new_status=new_status)
        return Response(self.get_serializer(obj).data)
    @action(detail=True,methods=['post'])
    def submit(self,request,pk=None): return self._transition(self.get_object(),'SUBMITTED','SUBMIT')
    @action(detail=True,methods=['post'])
    def approve(self,request,pk=None): return self._transition(self.get_object(),'APPROVED','APPROVE',request.data.get('comment',''))
    @action(detail=True,methods=['post'])
    def reject(self,request,pk=None):
        reason=request.data.get('reason','').strip()
        if not reason: return Response({'detail':'Rejection reason is required'},status=400)
        obj=self.get_object(); obj.rejection_reason=reason
        response=self._transition(obj,'REJECTED','REJECT',reason)
        return response
    @action(detail=True,methods=['post'])
    def resubmit(self,request,pk=None): return self._transition(self.get_object(),'SUBMITTED','RESUBMIT')
    @action(detail=False,methods=['get'])
    def pending_approvals(self,request):
        qs=self.get_queryset().filter(status='SUBMITTED')
        return Response(self.get_serializer(qs,many=True).data)
    @action(detail=True,methods=['post'])
    def mark_sync_result(self,request,pk=None):
        obj=self.get_object(); ok=bool(request.data.get('ok'))
        obj.sync_status='SYNCED' if ok else 'ERROR'
        obj.sync_error='' if ok else request.data.get('error','Unknown sync error')
        if request.data.get('odoo_id'): obj.odoo_id=request.data['odoo_id']
        obj.save(update_fields=['sync_status','sync_error','odoo_id','updated_at'])
        return Response(self.get_serializer(obj).data)
