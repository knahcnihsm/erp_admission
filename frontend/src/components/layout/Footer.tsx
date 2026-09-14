import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { useThemeContext } from '../../context/ThemeContext';

export const Footer: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        borderTop: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
        padding: '12px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: 'auto',
        transition: 'all 200ms ease-in-out',
      }}
    >
      {/* Left: Policy Links */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0px', flexWrap: 'wrap' }}>
        <Link
          underline="hover"
          href="#"
          sx={{
            color: isDark ? '#94A3B8' : '#64748B',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          PRIVACY POLICY
        </Link>
        <Typography variant="body2" sx={{ color: isDark ? '#334155' : '#CBD5E1', fontSize: '13px', mx: '10px' }}>
          |
        </Typography>
        <Link
          underline="hover"
          href="#"
          sx={{
            color: isDark ? '#94A3B8' : '#64748B',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          TERMS OF SERVICE
        </Link>
        <Typography variant="body2" sx={{ color: isDark ? '#334155' : '#CBD5E1', fontSize: '13px', mx: '10px' }}>
          |
        </Typography>
        <Link
          underline="hover"
          href="#"
          sx={{
            color: isDark ? '#94A3B8' : '#64748B',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          SUPPORT
        </Link>
      </Box>

      {/* Right: Copyright */}
      <Typography
        variant="body2"
        sx={{
          color: isDark ? '#94A3B8' : '#64748B',
          fontSize: '12px',
          fontWeight: 400,
          textAlign: 'right',
          letterSpacing: '0.01em',
        }}
      >
        © 2024 RAJIVGANDHI COLLEGE OF ENGINEERING &amp; TECHNOLOGY. ALL RIGHTS RESERVED.
      </Typography>
    </Box>
  );
};
