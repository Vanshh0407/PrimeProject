{
    'name': 'PrimeProjects PSA', 'version': '17.0.1.0.0',
    'category': 'Services/Project', 'summary': 'PrimeProjects PSA extensions and Odoo mappings',
    'depends': ['base', 'hr', 'project', 'hr_timesheet', 'analytic', 'account'],
    'data': ['security/ir.model.access.csv', 'views/primeprojects_views.xml', 'data/ir_cron.xml'],
    'license': 'LGPL-3',
    'installable': True, 'application': False,
}
