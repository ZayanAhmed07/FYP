import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

const DarkModeToggle: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`} arrow>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          width: 44,
          height: 44,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            transform: 'scale(1.1)',
          },
        }}
      >
        <motion.div
          initial={{ rotate: 0, scale: 0 }}
          animate={{ rotate: 360, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
          key={mode}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mode === 'dark' ? (
            <Brightness4 sx={{ fontSize: 24 }} />
          ) : (
            <Brightness7 sx={{ fontSize: 24, color: '#ffb745' }} />
          )}
        </motion.div>
      </IconButton>
    </Tooltip>
  );
};

export default DarkModeToggle;
