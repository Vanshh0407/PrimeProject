from odoo import api, fields, models

class HrEmployee(models.Model):
    _inherit = 'hr.employee'
    primeprojects_external_id = fields.Char(index=True, copy=False)
    primeprojects_user_id = fields.Many2one('res.users', string='PrimeProjects User')

class ProjectProject(models.Model):
    _inherit = 'project.project'
    primeprojects_external_id = fields.Char(index=True, copy=False)

class ProjectTask(models.Model):
    _inherit = 'project.task'
    primeprojects_external_id = fields.Char(index=True, copy=False)
    primeprojects_phase_id = fields.Integer(string='PrimeProjects Phase ID', index=True)

class AccountAnalyticLine(models.Model):
    _inherit = 'account.analytic.line'
    primeprojects_external_id = fields.Char(index=True, copy=False)
    primeprojects_phase_id = fields.Integer(string='PrimeProjects Phase ID', index=True)
    primeprojects_sync_state = fields.Selection([
        ('pending', 'Pending'), ('synced', 'Synced'), ('error', 'Error')
    ], default='pending', index=True)

    _sql_constraints = [
        ('primeprojects_external_unique', 'unique(primeprojects_external_id)',
         'PrimeProjects external ID must be unique.'),
    ]

class PrimeProjectsSyncLog(models.Model):
    _name = 'primeprojects.sync.log'
    _description = 'PrimeProjects Synchronization Log'
    name = fields.Char(required=True)
    direction = fields.Selection([('inbound','Inbound'),('outbound','Outbound')], required=True)
    model_name = fields.Char(required=True)
    external_id = fields.Char(index=True)
    odoo_id = fields.Integer()
    state = fields.Selection([('success','Success'),('error','Error')], required=True)
    message = fields.Text()


class AccountMove(models.Model):
    _inherit = 'account.move'
    primeprojects_external_id = fields.Char(index=True, copy=False)
    primeprojects_source_invoice_id = fields.Integer(index=True)
    primeprojects_sync_state = fields.Selection([
        ('pending', 'Pending'), ('synced', 'Synced'), ('error', 'Error')
    ], default='pending', index=True)

    _sql_constraints = [
        ('primeprojects_invoice_external_unique',
         'unique(primeprojects_external_id)',
         'PrimeProjects invoice external ID must be unique.')
    ]
