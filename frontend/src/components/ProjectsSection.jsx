'use client';
import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Alert, Chip, Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default function ProjectsSection({ api }) {
  const [projects, setProjects] = useState([]);
  const [phases, setPhases] = useState([]);
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [phaseForm, setPhaseForm] = useState({ name: '', budget_hours: '', billing_rate: '' });

  const load = useCallback(async () => {
    try {
      const [p, ph] = await Promise.all([api.get('/api/projects/projects/'), api.get('/api/projects/phases/')]);
      setProjects(p); setPhases(ph);
    } catch (e) { setError(e.message); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const addProject = async () => {
    setError('');
    try {
      await api.post('/api/projects/projects/', { name, customer_name: customer });
      setName(''); setCustomer(''); load();
    } catch (e) { setError(e.message); }
  };

  const addPhase = async (projectId) => {
    setError('');
    try {
      await api.post('/api/projects/phases/', {
        project: projectId,
        name: phaseForm.name,
        budget_hours: Number(phaseForm.budget_hours || 0),
        billing_rate: Number(phaseForm.billing_rate || 0),
      });
      setPhaseForm({ name: '', budget_hours: '', billing_rate: '' });
      load();
    } catch (e) { setError(e.message); }
  };

  const toggle = (id) => { setExpanded(expanded === id ? null : id); setPhaseForm({ name: '', budget_hours: '', billing_rate: '' }); };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Projects</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Card><CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Project name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Customer" value={customer} onChange={(e) => setCustomer(e.target.value)} fullWidth />
          <Button variant="contained" onClick={addProject} disabled={!name || !customer}>Create</Button>
        </Stack>
      </CardContent></Card>

      <Card><CardContent>
        <Table>
          <TableHead>
            <TableRow><TableCell>ID</TableCell><TableCell>Project</TableCell><TableCell>Customer</TableCell><TableCell>Phases</TableCell><TableCell /></TableRow>
          </TableHead>
          <TableBody>
            {projects.map((p) => {
              const projectPhases = phases.filter((ph) => ph.project === p.id);
              const isOpen = expanded === p.id;
              return (
                <Fragment key={p.id}>
                  <TableRow>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.customer_name}</TableCell>
                    <TableCell>{projectPhases.length}</TableCell>
                    <TableCell>
                      <Button size="small" endIcon={isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => toggle(p.id)}>
                        Phases
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0, borderBottom: isOpen ? undefined : 'none' }}>
                      <Collapse in={isOpen} unmountOnExit>
                        <Stack spacing={2} sx={{ py: 2 }}>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {projectPhases.length === 0
                              ? <Typography variant="body2" color="text.secondary">No phases yet — add one below.</Typography>
                              : projectPhases.map((ph) => (
                                <Chip key={ph.id} label={`${ph.name} · ${ph.budget_hours}h @ ${ph.billing_rate}/h`} />
                              ))}
                          </Stack>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField size="small" label="Phase name" value={phaseForm.name} onChange={(e) => setPhaseForm((f) => ({ ...f, name: e.target.value }))} />
                            <TextField size="small" type="number" label="Budget hours" value={phaseForm.budget_hours} onChange={(e) => setPhaseForm((f) => ({ ...f, budget_hours: e.target.value }))} />
                            <TextField size="small" type="number" label="Billing rate" value={phaseForm.billing_rate} onChange={(e) => setPhaseForm((f) => ({ ...f, billing_rate: e.target.value }))} />
                            <Button size="small" variant="contained" onClick={() => addPhase(p.id)} disabled={!phaseForm.name}>Add phase</Button>
                          </Stack>
                        </Stack>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </Stack>
  );
}
