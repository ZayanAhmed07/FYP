import React from 'react';
import { Card } from '@mui/material';
import type { CardProps } from '@mui/material';
import { motion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

interface GlassCardProps extends Omit<CardProps, 'component'> {
  intensity?: 'light' | 'medium' | 'strong';
  hover?: boolean;
  animate?: boolean;
  motionProps?: MotionProps;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  hover = true,
  animate = false,
  motionProps,
  sx,
  ...props
}) => {
  const { mode } = useThemeMode();

  const intensityValues = {
    light: {
      backdropFilter: 'blur(8px)',
      backgroundColor:
        mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 37, 41, 0.7)',
      border: mode === 'light' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
    },
    medium: {
      backdropFilter: 'blur(16px)',
      backgroundColor:
        mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(33, 37, 41, 0.8)',
      border: mode === 'light' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
    },
    strong: {
      backdropFilter: 'blur(24px)',
      backgroundColor:
        mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(33, 37, 41, 0.9)',
      border: mode === 'light' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
    },
  };

  const glassStyles = intensityValues[intensity];

  const cardStyles = {
    ...glassStyles,
    boxShadow: mode === 'light' 
      ? '0 8px 32px 0 rgba(31, 38, 135, 0.15)' 
      : '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
    borderRadius: '20px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(hover && {
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: mode === 'light'
          ? '0 12px 40px 0 rgba(31, 38, 135, 0.25)'
          : '0 12px 40px 0 rgba(0, 0, 0, 0.7)',
        border: mode === 'light' 
          ? `1px solid rgba(255, 255, 255, 0.5)` 
          : `1px solid rgba(255, 255, 255, 0.3)`,
      },
    }),
    ...sx,
  };

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        {...motionProps}
      >
        <Card sx={cardStyles} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }

  return (
    <Card sx={cardStyles} {...props}>
      {children}
    </Card>
  );
};

export default GlassCard;
