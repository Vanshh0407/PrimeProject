'use client';
import { useRef, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';

const CARDS = [
  { label: 'Project', sub: 'Acme Website Revamp', x: 8, y: 18, z: 90, rot: -10, w: 220, accent: '#60a5fa' },
  { label: 'Timesheet', sub: '7.5h logged today', x: 40, y: 52, z: 140, rot: 6, w: 200, accent: '#a78bfa' },
  { label: 'Invoice', sub: 'INV-1042 · $4,800', x: 12, y: 68, z: 40, rot: -4, w: 210, accent: '#34d399' },
];

export default function Login3DPanel() {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -8, ry: px * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => setTilt({ rx: 0, ry: 0 }), []);

  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: { xs: 220, md: '100vh' },
        overflow: 'hidden',
        background: 'radial-gradient(120% 120% at 20% 10%, #1e3a8a 0%, #0f1229 55%, #0b0f19 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1400px',
      }}
    >
      {/* ambient glow blobs */}
      <Box sx={{
        position: 'absolute', top: '-10%', left: '-10%', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.35), transparent 70%)', filter: 'blur(10px)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-15%', right: '-10%', width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)', filter: 'blur(10px)',
      }} />

      {/* wordmark */}
      <Box sx={{ position: 'absolute', top: { xs: 20, md: 40 }, left: { xs: 20, md: 48 }, zIndex: 5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.2,
            background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          PrimeProjects
        </Typography>
      </Box>

      {/* 3D scene */}
      <Box
        sx={{
          position: 'relative',
          width: { xs: '100%', md: 480 },
          height: { xs: 180, md: 420 },
          transformStyle: 'preserve-3d',
          transform: `rotateX(${18 + tilt.rx}deg) rotateY(${-16 + tilt.ry}deg)`,
          transition: 'transform 0.25s ease-out',
        }}
      >
        {CARDS.map((c, i) => (
          <Box
            key={c.label}
            sx={{
              position: 'absolute',
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: c.w,
              transform: `translateZ(${c.z}px) rotate(${c.rot}deg)`,
              transformStyle: 'preserve-3d',
              animation: `primeFloat${i} 6s ease-in-out infinite`,
              p: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(10px)',
              boxShadow: `0 20px 40px rgba(15,23,42,0.45), 0 0 0 1px rgba(255,255,255,0.05)`,
              '@keyframes primeFloat0': {
                '0%,100%': { transform: `translateZ(${c.z}px) translateY(0px) rotate(${c.rot}deg)` },
                '50%': { transform: `translateZ(${c.z}px) translateY(-10px) rotate(${c.rot}deg)` },
              },
              '@keyframes primeFloat1': {
                '0%,100%': { transform: `translateZ(${c.z}px) translateY(0px) rotate(${c.rot}deg)` },
                '50%': { transform: `translateZ(${c.z}px) translateY(-16px) rotate(${c.rot}deg)` },
              },
              '@keyframes primeFloat2': {
                '0%,100%': { transform: `translateZ(${c.z}px) translateY(0px) rotate(${c.rot}deg)` },
                '50%': { transform: `translateZ(${c.z}px) translateY(-8px) rotate(${c.rot}deg)` },
              },
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: c.accent, mb: 1, boxShadow: `0 0 12px ${c.accent}` }} />
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              {c.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {c.sub}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ position: 'absolute', bottom: { xs: 16, md: 40 }, left: { xs: 20, md: 48 }, right: 24, zIndex: 5, display: { xs: 'none', md: 'block' } }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 380 }}>
          Projects, Time &amp; Invoicing — unified with Odoo. One workspace for your whole delivery team.
        </Typography>
      </Box>
    </Box>
  );
}
