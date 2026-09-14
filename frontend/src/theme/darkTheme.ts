import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38BDF8',
      dark: '#0284C7',
      light: '#7DD3FC',
      contrastText: '#0F172A',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CBD5E1',
    },
    divider: '#334155',
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    h1: { fontWeight: 700, fontSize: '32px', color: '#FFFFFF' },
    h2: { fontWeight: 700, fontSize: '30px', color: '#FFFFFF' },
    h3: { fontWeight: 700, fontSize: '24px', color: '#FFFFFF' },
    h4: { fontWeight: 600, fontSize: '20px', color: '#FFFFFF' },
    h5: { fontWeight: 600, fontSize: '18px', color: '#FFFFFF' },
    h6: { fontWeight: 600, fontSize: '16px', color: '#FFFFFF' },
    body1: { fontWeight: 500, fontSize: '17px', color: '#FFFFFF' },
    body2: { fontWeight: 500, fontSize: '15px', color: '#CBD5E1' },
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
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#121212',
          color: '#FFFFFF',
          '& fieldset': {
            borderColor: '#334155',
          },
          '&:hover fieldset': {
            borderColor: '#38BDF8',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#38BDF8',
          },
          '&.Mui-disabled': {
            backgroundColor: '#1E293B',
            '& fieldset': {
              borderColor: '#334155',
            },
          },
        },
        input: {
          color: '#FFFFFF',
          '&::placeholder': { color: '#94A3B8' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#CBD5E1',
          '&.Mui-focused': {
            color: '#38BDF8',
          },
          '&.MuiInputLabel-shrink': {
            color: '#F8FAFC',
          },
          '&.Mui-disabled': {
            color: '#94A3B8',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#CBD5E1',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#334155',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38BDF8',
            '&:hover': {
              backgroundColor: '#334155',
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F172A',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#263346 !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#334155',
          color: '#FFFFFF',
        },
        head: {
          color: '#38BDF8',
          fontWeight: 700,
          backgroundColor: '#0F172A',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#CBD5E1',
          '&.Mui-checked': {
            color: '#38BDF8',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        track: {
          backgroundColor: '#334155',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#334155',
        },
        bar: {
          backgroundColor: '#38BDF8',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: 16,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#334155',
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: '#CBD5E1',
          '&.Mui-checked': {
            color: '#38BDF8',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          color: '#FFFFFF',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
          backgroundImage: 'none',
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: '#CBD5E1',
        },
      },
    },
  },
});
