'use client';
import { useState } from 'react';
import { Box, Paper, Stack, TextField, Button, Typography, Alert, Grid } from '@mui/material';
import Login3DPanel from './Login3DPanel';
import { BRAND_GRADIENT } from '../theme';

export default function LoginScreen({ apiUrl, demoUsername, demoPassword, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (u = username, p = password) => {
    setError('');
    setLoading(true);
    try {
      const r = await fetch(`${apiUrl}/api/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.non_field_errors?.[0] || data.detail || 'Invalid username or password.');
      localStorage.setItem('primeprojects_token', data.token);
      onLogin(data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    submit(demoUsername, demoPassword);
  };

  const canSubmit = username.trim().length > 0 && password.length > 0 && !loading;

  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      <Grid item xs={12} md={7} sx={{ order: { xs: 1, md: 0 } }}>
        <Login3DPanel />
      </Grid>

      <Grid
        item
        xs={12}
        md={5}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          px: 3,
          py: { xs: 4, md: 0 },
        }}
      >
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 380, p: { xs: 3, sm: 4 } }}>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              PrimeProjects
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Projects, Time &amp; Invoicing — Unified with Odoo
            </Typography>
          </Stack>

          <Stack spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit(); }}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            <TextField
              label="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            <Button
              type="submit"
              size="large"
              disabled={!canSubmit}
              sx={{
                color: 'white',
                background: BRAND_GRADIENT,
                '&:hover': { background: BRAND_GRADIENT, filter: 'brightness(1.06)' },
                '&.Mui-disabled': { background: 'rgba(26,86,219,0.25)', color: 'rgba(255,255,255,0.6)' },
              }}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </Button>

            {demoUsername && demoPassword && (
              <Button variant="outlined" size="large" onClick={demoLogin} disabled={loading}>
                Demo Login
              </Button>
            )}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
