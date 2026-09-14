import React, { useState } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { AppBreadcrumb } from './Breadcrumb';
import { AppSnackbar } from '../common/Snackbar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StudentViewModal } from '../student/StudentViewModal';
import { useThemeContext } from '../../context/ThemeContext';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = useThemeContext();
  const location = useLocation();
  const theme = useTheme();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileDrawer = () => setMobileOpen(false);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDark ? '#0F172A' : '#F5F8FC',
        transition: 'background-color 300ms ease-in-out',
      }}
    >
      <Header onMenuClick={() => setMobileOpen(true)} />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {!isMobile && <Sidebar />}
        <Drawer
          variant="temporary"
          open={isMobile && mobileOpen}
          onClose={closeMobileDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: '240px',
              maxWidth: '80vw',
              boxSizing: 'border-box',
            },
          }}
        >
          <Sidebar onNavigate={closeMobileDrawer} />
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            padding: {
              xs: '16px 12px',
              sm: '20px 24px',
              md: '24px 36px',
            },
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <AppBreadcrumb />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </motion.div>
          <Footer />
        </Box>
      </Box>

      {/* Global Modals & Notifications */}
      <AppSnackbar />
      <ConfirmDialog />
      <StudentViewModal />
    </Box>
  );
};
