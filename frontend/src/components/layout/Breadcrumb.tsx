import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { ChevronRight, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../context/ThemeContext';
import { useAdmission } from '../../context/AdmissionContext';

export const AppBreadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { requestNavigation } = useAdmission();

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Dashboard', path: '/' }];
    if (path.startsWith('/admission')) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Add New Admission', path: '/admission' },
      ];
    }
    if (path.startsWith('/EditStudent')) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Edit Student Details', path: '/EditStudent' },
      ];
    }
    if (path.startsWith('/archive')) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Archived Students', path: '/archive' },
      ];
    }
    if (path.startsWith('/export')) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Export Reports', path: '/export' },
      ];
    }
    return [{ label: 'Dashboard', path: '/' }];
  };

  const crumbs = getBreadcrumbs();

  return (
    <Box sx={{ paddingBottom: '12px', marginTop: '4px' }}>
      <Breadcrumbs separator={<ChevronRight size={14} color={isDark ? '#8B949E' : '#98A2B3'} style={{ margin: '0 10px' }} />}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', color: isDark ? '#8B949E' : '#667085', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => requestNavigation(() => navigate('/'))}
        >
          <Home size={14} style={{ marginRight: '6px' }} /> ERP Portal
        </Link>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return isLast ? (
            <Typography key={crumb.path} sx={{ color: isDark ? '#38BDF8' : '#0D47A1', fontWeight: 500, fontSize: '14px' }}>
              {crumb.label}
            </Typography>
          ) : (
            <Link
              key={crumb.path}
              underline="hover"
              sx={{ color: isDark ? '#8B949E' : '#667085', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => requestNavigation(() => navigate(crumb.path))}
            >
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};
