from django.db import migrations


class Migration(migrations.Migration):
    """Placeholder retained for migration-history compatibility.

    An earlier increment's 0002 added fields/models that were superseded by
    0003_odoo_mapping and 0004_approval_history. This no-op keeps the
    dependency chain (0001 -> 0002 -> 0003 -> 0004) intact without
    re-introducing the superseded schema.
    """

    dependencies = [('timesheets', '0001_initial')]
    operations = []
