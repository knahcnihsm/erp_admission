import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'motion/react';
import { useThemeContext } from '../../context/ThemeContext';

export const FullPageLoader: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const ringColor = isDark ? '#38BDF8' : '#0B3D91';
  const accent = '#E6892E';

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeInOut' } }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0F172A' : '#F5F8FC',
      }}
    >
      {/* Animated pulsing rings around the logo */}
      <Box sx={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${ringColor}`,
            }}
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{
              duration: 1.8,
              ease: 'easeOut',
              repeat: Infinity,
              delay: i * 0.9,
            }}
          />
        ))}

        {/* Orbiting circles removed on request — uncomment to restore
        <motion.div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
        >
          <motion.span
            style={{
              position: 'absolute',
              top: -6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
        </motion.div>
        */}

        {/* College logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ perspective: 700 }}
        >
          <motion.img
            src="/images/college-logo.png"
            alt="Rajiv Gandhi College Logo"
            animate={{ rotateY: 360 }}
            transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }}
            style={{
              width: 110,
              height: 110,
              objectFit: 'contain',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              willChange: 'transform',
              boxShadow: isDark
                ? '0 8px 30px rgba(0, 0, 0, 0.5)'
                : '0 8px 30px rgba(11, 61, 145, 0.18)',
            }}
          />
        </motion.div>
      </Box>

      {/* Loading label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
        style={{ marginTop: 24 }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: isDark ? '#38BDF8' : '#0B3D91',
          }}
        >
          Loading…
        </Typography>
      </motion.div>

      {/* Progress bar */}
      <Box sx={{ width: 220, height: 4, borderRadius: 4, overflow: 'hidden', marginTop: 22, backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }}>
        <motion.div
          style={{
            height: '100%',
            borderRadius: 4,
            background: `linear-gradient(90deg, ${ringColor}, ${accent})`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: ['10%', '35%', '60%', '85%', '100%'] }}
          transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
        />
      </Box>
    </motion.div>
  );
};
