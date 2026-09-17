import { Inter } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'PrimeProjects',
  description: 'Projects, Time & Invoicing — Unified with Odoo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body style={{ margin: 0 }}>
        <AppRouterCacheProvider options={{ key: 'mui' }}>{children}</AppRouterCacheProvider>
      </body>
    </html>
  );
}
