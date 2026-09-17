import { setTimeout as sleep } from 'node:timers/promises';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Required environment variable ${name} is not set.`);
  return value;
}

const API = requiredEnv('PRIMEPROJECTS_API_URL');
const INTEGRATION = requiredEnv('INTEGRATION_PUBLIC_URL');
const POLL_MS = Number(requiredEnv('QUEUE_POLL_MS'));
const SERVICE_TOKEN = requiredEnv('PRIMEPROJECTS_SERVICE_TOKEN');
const authHeaders = {'x-service-token': SERVICE_TOKEN};
// DEFAULT_ODOO_PARTNER_ID is intentionally optional: a development-only fallback
// for when an invoice has no real customer-to-Odoo-partner mapping yet.
const DEFAULT_ODOO_PARTNER_ID = process.env.DEFAULT_ODOO_PARTNER_ID;

async function json(url, options = {}) {
  const response = await fetch(url, {headers: {'content-type': 'application/json', ...authHeaders, ...(options.headers || {})}, ...options});
  const text = await response.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = {raw: text}; }
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  return data;
}

// The claim endpoint returns 409 when a job simply isn't eligible yet (already
// claimed by another worker, or its next_attempt_at hasn't arrived). That is a
// normal "skip for now" signal, not a failure — it must not burn a retry attempt.
async function claimJob(jobId) {
  const response = await fetch(`${API}/api/billing/sync-jobs/${jobId}/claim/`, {
    method: 'POST', headers: {'content-type': 'application/json', ...authHeaders},
  });
  const text = await response.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = {raw: text}; }
  if (!response.ok && response.status !== 409) throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  return data;
}

async function runJob(job) {
  const invoice = await json(`${API}/api/billing/invoices/${job.invoice}/`);
  if (job.operation === 'PUSH_INVOICE') {
    // Resolve the Odoo partner mapping in the deployment-specific integration layer.
    // For now, require odoo_partner_id to be supplied on the invoice payload or environment mapping.
    const payload = {
      ...invoice,
      odoo_partner_id: invoice.odoo_partner_id || (DEFAULT_ODOO_PARTNER_ID ? Number(DEFAULT_ODOO_PARTNER_ID) : undefined)
    };
    if (!payload.odoo_partner_id) throw new Error('Missing odoo_partner_id mapping');
    return json(`${INTEGRATION}/odoo/invoices/sync`, {method: 'POST', body: JSON.stringify(payload)});
  }
  if (job.operation === 'PULL_PAYMENT_STATUS') {
    if (!invoice.odoo_invoice_id) throw new Error('Invoice has no Odoo invoice ID');
    return json(`${INTEGRATION}/odoo/invoices/payment-status`, {
      method: 'POST', body: JSON.stringify({odoo_invoice_id: invoice.odoo_invoice_id})
    });
  }
}

async function loop() {
  console.log('Invoice queue worker started');
  while (true) {
    try {
      const jobs = await json(`${API}/api/billing/sync-jobs/?status=QUEUED,RETRY`);
      for (const job of jobs) {
        try {
          const claim = await claimJob(job.id);
          if (claim.status !== 'PROCESSING') continue;
          const result = await runJob(job);
          await json(`${API}/api/billing/sync-jobs/${job.id}/complete/`, {method:'POST', body: JSON.stringify({result})});
        } catch (error) {
          await json(`${API}/api/billing/sync-jobs/${job.id}/fail/`, {method:'POST', body: JSON.stringify({error: error.message})}).catch(()=>{});
        }
      }
    } catch (error) { console.error('Queue polling error:', error.message); }
    await sleep(POLL_MS);
  }
}
loop();
