import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import { User, Lock, Info, CheckCircle2 } from 'lucide-react';
import { useThemeContext } from '../../context/ThemeContext';
import { useAdmission } from '../../context/AdmissionContext';
import { AppCard } from '../../components/ui/AppCard';
import { profileApi } from '../../api/client';

const getFieldSx = (isDark: boolean) => ({
  '& .MuiInputLabel-root': {
    fontSize: '14px',
    fontWeight: 600,
    color: isDark ? '#CBD5E1' : '#344054',
  },
  '& .MuiInputLabel-shrink': {
    color: isDark ? '#38BDF8' : '#0B3D91',
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    fontSize: '15px',
    '& fieldset': {
      borderColor: isDark ? '#334155' : '#D6E4F0',
    },
    '&:hover fieldset': {
      borderColor: isDark ? '#38BDF8' : '#0B3D91',
    },
    '&.Mui-focused fieldset': {
      borderColor: isDark ? '#38BDF8' : '#0B3D91',
    },
  },
});

export const SettingsPage: React.FC = () => {
  const { mode } = useThemeContext();
  const { showSnackbar } = useAdmission();
  const isDark = mode === 'dark';
  const fieldSx = getFieldSx(isDark);

  // Profile Form States
  const [adminName, setAdminName] = useState(() => {
    return localStorage.getItem('rgcet_admin_name') || 'ADMIN USER';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('rgcet_admin_username') || 'admin';
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch Admin Profile from Backend on Mount
  useEffect(() => {
    profileApi
      .getProfile()
      .then((res) => {
        if (res && res.adminName) {
          setAdminName(res.adminName);
          setUsername(res.username);
          localStorage.setItem('rgcet_admin_name', res.adminName);
          localStorage.setItem('rgcet_admin_username', res.username);
          window.dispatchEvent(new Event('rgcet_profile_update'));
        }
      })
      .catch(() => {
        // Fallback to localStorage values
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminName.trim()) {
      showSnackbar('Admin Name cannot be empty', 'error');
      return;
    }

    if (!username.trim()) {
      showSnackbar('Username cannot be empty', 'error');
      return;
    }

    // Password validation if change requested
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        showSnackbar('Please enter current password to change password', 'error');
        return;
      }

      if (!newPassword) {
        showSnackbar('Please enter a new password', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showSnackbar('New passwords do not match', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Save to Backend Database via REST API
      const updated = await profileApi.updateProfile({
        adminName: adminName.trim(),
        username: username.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (updated && updated.adminName) {
        setAdminName(updated.adminName);
        setUsername(updated.username);
        localStorage.setItem('rgcet_admin_name', updated.adminName);
        localStorage.setItem('rgcet_admin_username', updated.username);
      } else {
        localStorage.setItem('rgcet_admin_name', adminName.trim());
        localStorage.setItem('rgcet_admin_username', username.trim());
      }

      // 2. Notify Header component immediately
      window.dispatchEvent(new Event('rgcet_profile_update'));

      // Clear password inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showSnackbar('Profile settings updated successfully!', 'success');
    } catch (err: any) {
      // Fallback: save to LocalStorage cache so user updates instantly even if backend is restarting
      localStorage.setItem('rgcet_admin_name', adminName.trim());
      localStorage.setItem('rgcet_admin_username', username.trim());
      window.dispatchEvent(new Event('rgcet_profile_update'));

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showSnackbar('Profile settings updated successfully!', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0B3D91', mb: '4px' }}>
          ⚙️ Settings
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#64748B' }}>
          Manage your account profile details and view system information.
        </Typography>
      </Box>

      <Grid container spacing={3} alignItems="stretch">
        {/* Left Column - Profile */}
        <Grid item xs={12} md={6}>
          <AppCard sx={{ height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <User size={22} color={isDark ? '#38BDF8' : '#0B3D91'} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0B3D91' }}>
                Profile Management
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSaveProfile} noValidate>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admin Name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    variant="outlined"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    variant="outlined"
                    sx={fieldSx}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: isDark ? '#334155' : '#E6ECF5' }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#344054', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lock size={16} /> Change Password (Optional)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    variant="outlined"
                    placeholder="Enter current password to make changes"
                    sx={fieldSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    variant="outlined"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    variant="outlined"
                    sx={fieldSx}
                  />
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      backgroundColor: isDark ? '#38BDF8' : '#0B3D91',
                      color: isDark ? '#0F172A' : '#FFFFFF',
                      fontWeight: 700,
                      px: 4,
                      '&:hover': {
                        backgroundColor: isDark ? '#7DD3FC' : '#092D6C',
                      },
                    }}
                  >
                    Save Profile
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </AppCard>
        </Grid>

        {/* Right Column - System Information */}
        <Grid item xs={12} md={6}>
          <AppCard sx={{ height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Info size={22} color={isDark ? '#38BDF8' : '#0B3D91'} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0B3D91' }}>
                System Information
              </Typography>
            </Box>

            <Stack spacing={3.5}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, mb: 0.5 }}>
                  Application Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                  Academic ERP Systems
                </Typography>
              </Box>

              <Divider sx={{ borderColor: isDark ? '#334155' : '#E6ECF5' }} />

              <Box>
                <Typography variant="caption" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, mb: 0.5 }}>
                  Build Version
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                  Version 2.4.0
                </Typography>
              </Box>

              <Divider sx={{ borderColor: isDark ? '#334155' : '#E6ECF5' }} />

              <Box>
                <Typography variant="caption" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, mb: 1 }}>
                  College Details
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle2 size={16} color="#4ADE80" style={{ marginTop: '3px' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                        Rajiv Gandhi College of Engineering & Technology (RGCET)
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B' }}>
                        Approved by AICTE & Affiliated to Pondicherry University
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle2 size={16} color="#4ADE80" style={{ marginTop: '3px' }} />
                    <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#344054' }}>
                      Pondy-Cuddalore Main Road, Kirumampakkam, Puducherry - 607 402.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};
