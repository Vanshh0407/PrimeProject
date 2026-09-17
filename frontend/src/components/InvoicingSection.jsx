'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Alert, MenuItem, Chip,
} from '@mui/material';

export default function InvoicingSection({ api }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    number: 'INV-1001', project: '', customer_name: '', invoice_date: new Date().toISOString().slice(0, 10),
    due_date: '', currency: 'USD', tax_rate: '0', description: 'Professional services', quantity: '1', unit_price: '0', notes: '',
  });

  const load = useCallback(async () => {
    try {
      const [p, i] = await Promise.all([api.get('/api/projects/projects/'), api.get('/api/billing/invoices/')]);
      setProjects(p); setInvoices(i);
    } catch (e) { setError(e.message); }
  }, [api]);

  useEffect(() => { load(); }, [load]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const createInvoice = async () => {
    setError('');
    try {
      await api.post('/api/billing/invoices/', {
        ...form, project: Number(form.project), tax_rate: Number(form.tax_rate),
        lines: [{ description: form.description, quantity: Number(form.quantity), unit_price: Number(form.unit_price), billable_source: 'MANUAL' }],
      });
      load();
    } catch (e) { setError(e.message); }
  };

  const action = async (id, path) => {
    try { await api.post(`/api/billing/invoices/${id}/${path}/`); load(); } catch (e) { setError(e.message); }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Invoicing</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Card><CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>New invoice</Typography>
        <Stack spacing={2} maxWidth={650}>
          <TextField label="Invoice number" value={form.number} onChange={(e) => set('number', e.target.value)} />
          <TextField select label="Project" value={form.project} onChange={(e) => {
            const p = projects.find((x) => x.id === Number(e.target.value));
            set('project', e.target.value); set('customer_name', p?.customer_name || '');
          }}>
            {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name} — {p.customer_name}</MenuItem>)}
          </TextField>
          <TextField label="Customer" value={form.customer_name} InputProps={{ readOnly: true }} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField type="date" label="Invoice date" InputLabelProps={{ shrink: true }} value={form.invoice_date} onChange={(e) => set('invoice_date', e.target.value)} />
            <TextField type="date" label="Due date" InputLabelProps={{ shrink: true }} value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
            <TextField type="number" label="Quantity" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
            <TextField type="number" label="Unit price" value={form.unit_price} onChange={(e) => set('unit_price', e.target.value)} />
          </Stack>
          <TextField type="number" label="Tax rate %" value={form.tax_rate} onChange={(e) => set('tax_rate', e.target.value)} />
          <TextField multiline label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          <Button variant="contained" onClick={createInvoice} disabled={!form.project || !form.due_date || Number(form.unit_price) < 0}>
            Create invoice
          </Button>
        </Stack>
      </CardContent></Card>

      <Card><CardContent>
        <Table>
          <TableHead>
            <TableRow><TableCell>Number</TableCell><TableCell>Customer</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.number}</TableCell>
                <TableCell>{i.customer_name}</TableCell>
                <TableCell>{i.currency} {i.total}</TableCell>
                <TableCell><Chip size="small" label={i.status} /></TableCell>
                <TableCell>
                  {i.status === 'DRAFT' && <Button size="small" onClick={() => action(i.id, 'issue')}>Issue</Button>}
                  <Button size="small" onClick={() => action(i.id, 'sync-to-odoo')}>Create Odoo Draft</Button>
                  <Button size="small" onClick={() => action(i.id, 'refresh-payment-status')}>Refresh Payment</Button>
                  {!['VOID', 'PAID'].includes(i.status) && <Button size="small" color="error" onClick={() => action(i.id, 'void')}>Void</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </Stack>
  );
}
