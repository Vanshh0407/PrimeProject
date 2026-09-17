'use client';
import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { getTheme } from '../theme';
import { createApiClient } from '../lib/api';
import LoginScreen from '../components/LoginScreen';
import AppShell from '../components/AppShell';
import Dashboard from '../components/Dashboard';
import ProjectsSection from '../components/ProjectsSection';
import TimesheetsSection from '../components/TimesheetsSection';
import InvoicingSection from '../components/InvoicingSection';
import BillingCalculatorSection from '../components/BillingCalculatorSection';
import OdooSyncSection from '../components/OdooSyncSection';

const API = process.env.NEXT_PUBLIC_API_URL;
if (!API && typeof window !== 'undefined') console.error('NEXT_PUBLIC_API_URL is not set.');

const DEMO_USERNAME = process.env.NEXT_PUBLIC_DEMO_USERNAME;
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

export default function Home() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => getTheme(prefersDark ? 'dark' : 'light'), [prefersDark]);

  const [token, setToken] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [active, setActive] = useState('dashboard');

  useEffect(() => {
    setToken(localStorage.getItem('primeprojects_token'));
    setCheckedAuth(true);
  }, []);

  const logout = () => { localStorage.removeItem('primeprojects_token'); setToken(null); };

  const api = useMemo(() => (token ? createApiClient(API, token, logout) : null), [token]);

  const usernameFromToken = 'PrimeProjects User';

  let body = null;
  if (!checkedAuth) {
    body = null;
  } else if (!token) {
    body = <LoginScreen apiUrl={API} demoUsername={DEMO_USERNAME} demoPassword={DEMO_PASSWORD} onLogin={setToken} />;
  } else {
    const sections = {
      dashboard: <Dashboard api={api} />,
      projects: <ProjectsSection api={api} />,
      timesheets: <TimesheetsSection api={api} />,
      invoicing: <InvoicingSection api={api} />,
      'billing-calculator': <BillingCalculatorSection api={api} />,
      'odoo-sync': <OdooSyncSection api={api} />,
    };
    body = (
      <AppShell active={active} onNavigate={setActive} username={usernameFromToken} onLogout={logout}>
        {sections[active]}
      </AppShell>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {body}
    </ThemeProvider>
  );
}
