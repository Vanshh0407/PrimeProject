'use client';
import { useState } from 'react';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, AppBar, Toolbar,
  InputBase, IconButton, Badge, Avatar, Menu, MenuItem, Divider,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { BRAND_GRADIENT } from '../theme';

const SIDEBAR_WIDTH = 240;

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { key: 'projects', label: 'Projects', icon: FolderOutlinedIcon },
  { key: 'timesheets', label: 'Timesheets', icon: AccessTimeOutlinedIcon },
  { key: 'invoicing', label: 'Invoicing', icon: ReceiptLongOutlinedIcon },
  { key: 'billing-calculator', label: 'Billing Calculator', icon: CalculateOutlinedIcon },
  { key: 'odoo-sync', label: 'Odoo Sync', icon: SyncOutlinedIcon },
];

export default function AppShell({ active, onNavigate, username, onLogout, children }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const initials = (username || '?').slice(0, 2).toUpperCase();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background: BRAND_GRADIENT,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            PrimeProjects
          </Typography>
        </Box>
        <List sx={{ px: 1.5 }}>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const selected = active === key;
            return (
              <ListItemButton
                key={key}
                selected={selected}
                onClick={() => onNavigate(key)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(96,165,250,0.12)' : 'rgba(26,86,219,0.08)'),
                    color: 'primary.main',
                  },
                  '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 700 : 500 }}>
                  {label}
                </ListItemText>
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{ bgcolor: 'background.paper', borderBottom: (t) => `1px solid ${t.palette.divider}` }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, maxWidth: 420,
                bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)'),
                borderRadius: 3, px: 1.5, py: 0.75,
              }}
            >
              <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <InputBase placeholder="Search projects, invoices…" fullWidth sx={{ fontSize: 14 }} />
            </Box>
            <IconButton>
              <Badge color="error" variant="dot">
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
            <Avatar
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ width: 34, height: 34, fontSize: 14, cursor: 'pointer', background: BRAND_GRADIENT }}
            >
              {initials}
            </Avatar>
            <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
              <MenuItem disabled sx={{ opacity: 1 }}>
                <Typography variant="body2" fontWeight={600}>{username}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setMenuAnchor(null); onLogout(); }}>Log out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
