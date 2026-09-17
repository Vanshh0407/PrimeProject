'use client';
import { useState } from 'react';
import { Card, CardContent, Stack, TextField, Button, Typography, Alert } from '@mui/material';

export default function BillingCalculatorSection({ api }) {
  const [hours, setHours] = useState('');
  const [rate, setRate] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  const calculate = async () => {
    setError(''); setQuote(null);
    try { setQuote(await api.post('/api/billing/proposals/calculate/', { hours, rate })); }
    catch (e) { setError(e.message); }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Billing Calculator</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Card><CardContent>
        <Stack spacing={2} maxWidth={420}>
          <TextField label="Billable hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
          <TextField label="Hourly rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          <Button variant="contained" onClick={calculate} disabled={!hours || !rate}>Calculate</Button>
          {quote && <Typography variant="h5">Amount: {quote.amount}</Typography>}
        </Stack>
      </CardContent></Card>
    </Stack>
  );
}
