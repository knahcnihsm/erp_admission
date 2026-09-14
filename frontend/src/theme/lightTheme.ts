import { createTheme } from '@mui/material/styles';
import { colors } from './colors';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      dark: colors.primary.dark,
      light: colors.primary.royal,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.primary.sky,
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    divider: colors.border.default,
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    h1: { fontWeight: 700, fontSize: '32px', color: colors.text.primary },
    h2: { fontWeight: 700, fontSize: '30px', color: colors.text.primary },
    h3: { fontWeight: 700, fontSize: '24px', color: colors.text.primary },
    h4: { fontWeight: 600, fontSize: '20px', color: colors.text.primary },
    h5: { fontWeight: 600, fontSize: '18px', color: colors.text.primary },
    h6: { fontWeight: 600, fontSize: '16px', color: colors.text.primary },
    body1: { fontWeight: 500, fontSize: '17px', color: colors.text.primary },
    body2: { fontWeight: 500, fontSize: '15px', color: colors.text.secondary },
    button: { fontWeight: 600, fontSize: '17px', textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          fontSize: '17px',
          boxShadow: 'none',
          transition: 'all 200ms ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(11, 61, 145, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 8px 30px rgba(11, 61, 145, 0.06)',
          border: `1px solid ${colors.border.default}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '& fieldset': {
            borderColor: colors.border.default,
          },
          '&:hover fieldset': {
            borderColor: colors.primary.sky,
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.primary.main,
          },
        },
      },
    },
  },
});
