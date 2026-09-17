'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, LinearProgress, Stack, Skeleton, Button,
  List, ListItem, ListItemText, Divider, Avatar,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const STATUS_COLORS = { DRAFT: '#94a3b8', SUBMITTED: '#f59e0b', APPROVED: '#22c55e', REJECTED: '#ef4444' };
const SYNC_BADGE = {
  QUEUED: { color: 'default', label: 'Queued' },
  PROCESSING: { color: 'info', label: 'Processing' },
  SUCCEEDED: { color: 'success', label: 'Succeeded' },
  RETRY: { color: 'warning', label: 'Retry' },
  FAILED: { color: 'error', label: 'Failed' },
};

// Revenue trend uses illustrative data — no historical invoicing endpoint exists yet.
const REVENUE_TREND = [
  { month: 'Apr', invoiced: 18200, paid: 15100 },
  { month: 'May', invoiced: 21300, paid: 19800 },
  { month: 'Jun', invoiced: 19750, paid: 17200 },
  { month: 'Jul', invoiced: 24500, paid: 21000 },
  { month: 'Aug', invoiced: 27100, paid: 23950 },
  { month: 'Sep', invoiced: 22800, paid: 18400 },
];

function KpiCard({ label, value, sub, chip }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          {chip}
        </Stack>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }) {
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );
}

export default function Dashboard({ api }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [phases, setPhases] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [syncJobs, setSyncJobs] = useState([]);
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [projectsRes, phasesRes, timesheetsRes, pendingRes, invoicesRes, syncRes] = await Promise.all([
        api.get('/api/projects/projects/'),
        api.get('/api/projects/phases/'),
        api.get('/api/timesheets/entries/'),
        api.get('/api/timesheets/entries/pending_approvals/'),
        api.get('/api/billing/invoices/'),
        api.get('/api/billing/sync-jobs/'),
      ]);
      setProjects(projectsRes || []);
      setPhases(phasesRes || []);
      setTimesheets(timesheetsRes || []);
      setPendingApprovals(pendingRes || []);
      setInvoices(invoicesRes || []);
      setSyncJobs(syncRes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => {
    const outstanding = invoices
      .filter((i) => ['ISSUED', 'SENT', 'PARTIAL'].includes(i.status))
      .reduce((sum, i) => sum + Number(i.balance_due || 0), 0);
    const hasFailed = syncJobs.some((j) => j.status === 'FAILED');
    const hasRetry = syncJobs.some((j) => j.status === 'RETRY');
    const syncState = hasFailed ? { label: 'Attention needed', color: 'error' } : hasRetry ? { label: 'Retrying', color: 'warning' } : { label: 'Healthy', color: 'success' };
    return {
      activeProjects: projects.length,
      pendingApprovals: pendingApprovals.length,
      outstanding,
      syncState,
    };
  }, [projects, pendingApprovals, invoices, syncJobs]);

  const timesheetStatusData = useMemo(() => {
    const counts = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0 };
    timesheets.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status] += 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [timesheets]);

  const phaseProgress = useMemo(() => {
    const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
    return phases.slice(0, 6).map((phase) => {
      const loggedHours = timesheets
        .filter((t) => t.phase === phase.id && t.status === 'APPROVED')
        .reduce((sum, t) => sum + Number(t.hours || 0), 0);
      const budget = Number(phase.budget_hours || 0);
      const pct = budget > 0 ? Math.min(100, Math.round((loggedHours / budget) * 100)) : 0;
      return {
        id: phase.id,
        name: phase.name,
        projectName: projectById[phase.project]?.name || 'Unknown project',
        pct,
        loggedHours,
        budget,
      };
    });
  }, [phases, projects, timesheets]);

  const act = async (id, action, extra) => {
    setActioningId(id);
    try {
      await api.post(`/api/timesheets/entries/${id}/${action}/`, extra);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActioningId(null);
    }
  };

  const reject = (id) => {
    const reason = typeof window !== 'undefined' ? window.prompt('Rejection reason:') : '';
    if (!reason) return;
    act(id, 'reject', { reason });
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={110} /></Grid>
        ))}
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={320} /></Grid>
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={320} /></Grid>
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={280} /></Grid>
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={280} /></Grid>
      </Grid>
    );
  }

  return (
    <Stack spacing={3}>
      {error && <Typography color="error" variant="body2">{error}</Typography>}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Active Projects" value={kpis.activeProjects} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Pending Approvals" value={kpis.pendingApprovals} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Outstanding Invoices" value={`$${kpis.outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Odoo Sync Status"
            value={kpis.syncState.label}
            chip={<Chip size="small" color={kpis.syncState.color} label={kpis.syncState.color === 'success' ? 'Live' : 'Check'} />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Timesheet Status">
            {timesheets.length === 0 ? <EmptyState text="No timesheet entries yet." /> : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={timesheetStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {timesheetStatusData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Revenue — Invoiced vs. Paid">
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REVENUE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="invoiced" stroke="#1a56db" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="paid" stroke="#7c3aed" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Project Phase Progress">
            {phaseProgress.length === 0 ? <EmptyState text="No project phases yet." /> : (
              <Stack spacing={2}>
                {phaseProgress.map((p) => (
                  <Box key={p.id}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{p.projectName} · {p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.loggedHours}h / {p.budget}h</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={p.pct} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Odoo Sync Activity">
            {syncJobs.length === 0 ? <EmptyState text="No sync activity yet." /> : (
              <List dense>
                {syncJobs.slice(0, 6).map((j, idx) => {
                  const badge = SYNC_BADGE[j.status] || { color: 'default', label: j.status };
                  return (
                    <Box key={j.id}>
                      <ListItem disableGutters secondaryAction={<Chip size="small" color={badge.color} label={badge.label} />}>
                        <ListItemText
                          primary={`Invoice #${j.invoice} · ${j.operation === 'PUSH_INVOICE' ? 'Push' : 'Pull payment'}`}
                          secondary={new Date(j.updated_at || j.created_at).toLocaleString()}
                        />
                      </ListItem>
                      {idx < Math.min(syncJobs.length, 6) - 1 && <Divider component="li" />}
                    </Box>
                  );
                })}
              </List>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Approval Inbox">
            {pendingApprovals.length === 0 ? <EmptyState text="No pending approvals — you're all caught up." /> : (
              <List dense>
                {pendingApprovals.map((t, idx) => (
                  <Box key={t.id}>
                    <ListItem
                      disableGutters
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <Button size="small" startIcon={<CheckIcon fontSize="small" />} disabled={actioningId === t.id} onClick={() => act(t.id, 'approve')}>
                            Approve
                          </Button>
                          <Button size="small" color="error" startIcon={<CloseIcon fontSize="small" />} disabled={actioningId === t.id} onClick={() => reject(t.id)}>
                            Reject
                          </Button>
                        </Stack>
                      }
                    >
                      <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: 13 }}>{(t.employee_name || '?').slice(0, 2).toUpperCase()}</Avatar>
                      <ListItemText
                        primary={`${t.employee_name} · ${t.hours}h on ${t.work_date}`}
                        secondary={t.description || 'No description provided'}
                      />
                    </ListItem>
                    {idx < pendingApprovals.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
