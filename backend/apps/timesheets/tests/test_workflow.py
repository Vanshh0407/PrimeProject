from datetime import date
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from apps.projects.models import Project, Phase
from apps.timesheets.models import TimesheetEntry, TimesheetApproval

class TimesheetWorkflowTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('tester', password='pass')
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(name='Project A', customer_name='Customer A')
        self.phase = Phase.objects.create(project=self.project, name='Phase A')

    def test_submit_approve_and_history(self):
        entry = TimesheetEntry.objects.create(
            employee_name='Employee A', project=self.project, phase=self.phase,
            work_date=date.today(), hours='4.00'
        )
        r = self.client.post(f'/api/timesheets/entries/{entry.id}/submit/')
        self.assertEqual(r.status_code, 200)
        r = self.client.post(f'/api/timesheets/entries/{entry.id}/approve/', {'comment':'OK'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['status'], 'APPROVED')
        self.assertEqual(TimesheetApproval.objects.filter(timesheet=entry).count(), 2)

    def test_rejection_requires_reason(self):
        entry = TimesheetEntry.objects.create(
            employee_name='Employee B', project=self.project, phase=self.phase,
            work_date=date.today(), hours='3.00'
        )
        self.client.post(f'/api/timesheets/entries/{entry.id}/submit/')
        r = self.client.post(f'/api/timesheets/entries/{entry.id}/reject/', {})
        self.assertEqual(r.status_code, 400)
