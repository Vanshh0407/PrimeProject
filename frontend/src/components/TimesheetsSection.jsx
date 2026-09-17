'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Alert, MenuItem, Chip,
} from '@mui/material';

const STATUS_COLOR = { DRAFT: 'default', SUBMITTED: 'warning', APPROVED: 'success', REJECTED: 'error' };

export default function TimesheetsSection({ api }) {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [phases, setPhases] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ employee_name: '', project: '', phase: '', work_date: new Date().toISOString().slice(0, 10), hours: '', description: '' });

  const load = useCallback(async () => {
    try {
      const [e, p, ph] = await Promise.all([
        api.get('/api/timesheets/entries/'),
        api.get('/api/projects/projects/'),
        api.get('/api/projects/phases/'),
      ]);
      setEntries(e); setProjects(p); setPhases(ph);
    } catch (e) { setError(e.message); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const phasesForProject = phases.filter((ph) => ph.project === Number(form.project));

  const createEntry = async () => {
    setError('');
    try {
      await api.post('/api/timesheets/entries/', { ...form, project: Number(form.project), phase: Number(form.phase), hours: Number(form.hours) });
      setForm((f) => ({ ...f, hours: '', description: '' }));
      load();
    } catch (e) { setError(e.message); }
  };

  const act = async (id, action, extra) => {
    try { await api.post(`/api/timesheets/entries/${id}/${action}/`, extra); load(); } catch (e) { setError(e.message); }
  };

  const reject = (id) => {
    const reason = typeof window !== 'undefined' ? window.prompt('Rejection reason:') : '';
    if (!reason) return;
    act(id, 'reject', { reason });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Timesheets</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Card><CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>New entry</Typography>
        <Stack spacing={2} maxWidth={480}>
          <TextField label="Employee" value={form.employee_name} onChange={(e) => set('employee_name', e.target.value)} />
          <TextField select label="Project" value={form.project} onChange={(e) => { set('project', e.target.value); set('phase', ''); }}>
            {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField select label="Phase" value={form.phase} onChange={(e) => set('phase', e.target.value)} disabled={!form.project}>
            {phasesForProject.map((ph) => <MenuItem key={ph.id} value={ph.id}>{ph.name}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField type="date" label="Work date" InputLabelProps={{ shrink: true }} value={form.work_date} onChange={(e) => set('work_date', e.target.value)} />
            <TextField type="number" label="Hours" value={form.hours} onChange={(e) => set('hours', e.target.value)} />
          </Stack>
          <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} multiline />
          <Button variant="contained" onClick={createEntry} disabled={!form.employee_name || !form.project || !form.phase || !form.hours}>
            Save draft
          </Button>
        </Stack>
      </CardContent></Card>

      <Card><CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell><TableCell>Date</TableCell><TableCell>Hours</TableCell>
              <TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.employee_name}</TableCell>
                <TableCell>{t.work_date}</TableCell>
                <TableCell>{t.hours}</TableCell>
                <TableCell><Chip size="small" color={STATUS_COLOR[t.status]} label={t.status} /></TableCell>
                <TableCell>
                  {t.status === 'DRAFT' && <Button size="small" onClick={() => act(t.id, 'submit')}>Submit</Button>}
                  {t.status === 'SUBMITTED' && <>
                    <Button size="small" onClick={() => act(t.id, 'approve')}>Approve</Button>
                    <Button size="small" color="error" onClick={() => reject(t.id)}>Reject</Button>
                  </>}
                  {t.status === 'REJECTED' && <Button size="small" onClick={() => act(t.id, 'resubmit')}>Resubmit</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </Stack>
  );
}
