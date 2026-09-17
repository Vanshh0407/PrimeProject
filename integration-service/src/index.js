import express from 'express';
import { OdooClient } from './odooClient.js';
import { upsertTimesheet, upsertInvoice, getInvoicePaymentStatus } from './syncWorker.js';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Required environment variable ${name} is not set.`);
  return value;
}

const app = express();
app.use(express.json());
const port = requiredEnv('PORT');
const odoo = new OdooClient({
  url: requiredEnv('ODOO_URL'),
  database: requiredEnv('ODOO_DB'),
  username: requiredEnv('ODOO_USER'),
  password: requiredEnv('ODOO_PASSWORD')
});

app.get('/health', (_, res) => res.json({status: 'ok', service: 'odoo-integration'}));
app.post('/odoo/authenticate', async (_, res) => {
  try { res.json({uid: await odoo.authenticate()}); }
  catch (e) { res.status(502).json({error: e.message}); }
});
app.post('/odoo/timesheets/sync', async (req, res) => {
  try { const result = await upsertTimesheet(odoo, req.body); res.json(result); }
  catch (e) { res.status(502).json({error: e.message}); }
});
app.post('/odoo/invoices/sync', async (req, res) => {
  try { const result = await upsertInvoice(odoo, req.body); res.json(result); }
  catch (e) { res.status(502).json({error: e.message}); }
});
app.post('/odoo/invoices/payment-status', async (req, res) => {
  try { const result = await getInvoicePaymentStatus(odoo, req.body); res.json(result); }
  catch (e) { res.status(502).json({error: e.message}); }
});
app.post('/odoo/search-read', async (req, res) => {
  try {
    const {model, domain = [], fields = [], limit = 100} = req.body;
    if (!model) return res.status(400).json({error: 'model is required'});
    const ids = await odoo.execute(model, 'search', [domain], {limit});
    const rows = fields.length ? await odoo.execute(model, 'read', [ids], {fields}) : ids;
    res.json({ids, rows});
  } catch (e) { res.status(502).json({error: e.message}); }
});
app.listen(port, () => console.log(`PrimeProjects integration service listening on ${port}`));
