import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { useThemeContext } from '../../context/ThemeContext';

interface SummaryItem {
  label: string;
  value: string | number;
  isHighlight?: boolean;
}

interface SummaryCardProps {
  title: string;
  items: SummaryItem[];
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, items }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box
      sx={{
        backgroundColor: isDark ? '#0F172A' : '#F7FAFC',
        border: `1px dashed ${isDark ? '#334155' : '#D8E4F2'}`,
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px',
        transition: 'all 250ms ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.45)'
            : '0 10px 30px rgba(11, 61, 145, 0.12)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: isDark ? '#38BDF8' : '#0D47A1', fontWeight: 700, marginBottom: '14px' }}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: item.isHighlight
                    ? isDark ? '#38BDF8' : '#0D47A1'
                    : isDark ? '#CBD5E1' : '#667085',
                  fontWeight: item.isHighlight ? 700 : 500,
                  fontSize: item.isHighlight ? '0.95rem' : '0.875rem',
                }}
              >
                {item.label}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: item.isHighlight
                    ? isDark ? '#38BDF8' : '#0D47A1'
                    : isDark ? '#FFFFFF' : '#1A2B49',
                  fontWeight: item.isHighlight ? 800 : 600,
                  fontSize: item.isHighlight ? '1.1rem' : '0.9375rem',
                }}
              >
                {item.value}
              </Typography>
            </Box>
            {idx < items.length - 1 && (
              <Divider sx={{ borderColor: isDark ? '#334155' : '#E6ECF5' }} />
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};
