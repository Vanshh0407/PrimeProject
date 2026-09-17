export function buildTimesheetValues(entry) {
  return {
    name: entry.description || `PrimeProjects timesheet ${entry.id}`,
    date: entry.work_date,
    unit_amount: Number(entry.hours),
    employee_id: Number(entry.odoo_employee_id),
    project_id: Number(entry.odoo_project_id),
    task_id: entry.odoo_task_id ? Number(entry.odoo_task_id) : false,
    primeprojects_external_id: `timesheet:${entry.id}`,
    primeprojects_phase_id: Number(entry.phase_id),
    primeprojects_sync_state: 'pending'
  };
}

export async function upsertTimesheet(odoo, entry) {
  const externalId = `timesheet:${entry.id}`;
  const ids = await odoo.execute('account.analytic.line', 'search', [[['primeprojects_external_id', '=', externalId]]], {limit: 1});
  const values = buildTimesheetValues(entry);
  if (ids.length) {
    await odoo.execute('account.analytic.line', 'write', [ids, values]);
    return {id: ids[0], action: 'updated', externalId};
  }
  const id = await odoo.execute('account.analytic.line', 'create', [values]);
  return {id, action: 'created', externalId};
}


/**
 * Creates or updates an Odoo customer invoice (account.move).
 * Expected payload:
 * {
 *   id, number, invoice_date, due_date, currency, odoo_partner_id,
 *   odoo_journal_id?, notes?, lines: [{description, quantity, unit_price,
 *   odoo_product_id?, odoo_account_id?}]
 * }
 *
 * The PrimeProjects custom module adds x/primeprojects mapping fields.
 * Financial posting is deliberately separate: this function creates a draft.
 */
export async function upsertInvoice(odoo, invoice) {
  if (!invoice?.id || !invoice?.odoo_partner_id) {
    throw new Error('id and odoo_partner_id are required');
  }
  const externalId = `invoice:${invoice.id}`;
  const domain = [['primeprojects_external_id', '=', externalId]];
  const existing = await odoo.execute('account.move', 'search', [domain], {limit: 1});

  const lineVals = (invoice.lines || []).map(line => {
    const vals = {
      name: line.description || 'Professional services',
      quantity: Number(line.quantity || 1),
      price_unit: Number(line.unit_price || 0),
    };
    if (line.odoo_product_id) vals.product_id = Number(line.odoo_product_id);
    if (line.odoo_account_id) vals.account_id = Number(line.odoo_account_id);
    return [0, 0, vals];
  });

  const vals = {
    move_type: 'out_invoice',
    partner_id: Number(invoice.odoo_partner_id),
    invoice_date: invoice.invoice_date,
    invoice_date_due: invoice.due_date,
    ref: invoice.number,
    narration: invoice.notes || '',
    invoice_line_ids: lineVals,
    primeprojects_external_id: externalId,
  };
  if (invoice.odoo_journal_id) vals.journal_id = Number(invoice.odoo_journal_id);

  let id;
  if (existing.length) {
    id = existing[0];
    await odoo.execute('account.move', 'write', [[id], vals]);
  } else {
    id = await odoo.execute('account.move', 'create', [vals]);
  }
  const rows = await odoo.execute('account.move', 'read', [[id]], {
    fields: ['id', 'name', 'state', 'payment_state', 'amount_total', 'amount_residual',
             'primeprojects_external_id']
  });
  return {id, created: !existing.length, invoice: rows[0]};
}


export async function getInvoicePaymentStatus(odoo, invoice) {
  if (!invoice?.odoo_invoice_id) throw new Error('odoo_invoice_id is required');
  const rows = await odoo.execute('account.move', 'read', [[Number(invoice.odoo_invoice_id)]], {
    fields: ['id', 'state', 'payment_state', 'amount_total', 'amount_residual', 'name']
  });
  if (!rows.length) throw new Error('Odoo invoice not found');
  return rows[0];
}
