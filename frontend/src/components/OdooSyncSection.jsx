'use client';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, Stack, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const BADGE = {
  QUEUED: 'default', PROCESSING: 'info', SUCCEEDED: 'success', RETRY: 'warning', FAILED: 'error',
};

export default function OdooSyncSection({ api }) {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setJobs(await api.get('/api/billing/sync-jobs/')); } catch (e) { setError(e.message); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Odoo Sync</Typography>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Card><CardContent>
        {jobs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No sync jobs yet.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell><TableCell>Operation</TableCell><TableCell>Status</TableCell>
                <TableCell>Attempts</TableCell><TableCell>Last error</TableCell><TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>#{j.invoice}</TableCell>
                  <TableCell>{j.operation === 'PUSH_INVOICE' ? 'Push invoice' : 'Pull payment status'}</TableCell>
                  <TableCell><Chip size="small" color={BADGE[j.status] || 'default'} label={j.status} /></TableCell>
                  <TableCell>{j.attempts}</TableCell>
                  <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.last_error || '—'}</TableCell>
                  <TableCell>{new Date(j.updated_at || j.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </Stack>
  );
}
