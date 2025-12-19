import React from 'react';
import { Card } from '@mui/material';
import type { CardProps } from '@mui/material';
import { motion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';

interface NeumorphicCardProps extends Omit<CardProps, 'component'> {
  inset?: boolean;
  hover?: boolean;
  animate?: boolean;
  motionProps?: MotionProps;
}

const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  inset = false,
  hover = true,
  animate = false,
  motionProps,
  sx,
  ...props
}) => {
  const { mode } = useThemeMode();

  const lightShadow = inset
    ? 'inset 12px 12px 24px #d1d9e0, inset -12px -12px 24px #ffffff'
    : '12px 12px 24px #d1d9e0, -12px -12px 24px #ffffff';

  const darkShadow = inset
    ? 'inset 12px 12px 24px #0d0f10, inset -12px -12px 24px #272b2f'
    : '12px 12px 24px #0d0f10, -12px -12px 24px #272b2f';

  const cardStyles = {
    backgroundColor: mode === 'light' ? '#e5edf5' : '#1a1d20',
    boxShadow: mode === 'light' ? lightShadow : darkShadow,
    borderRadius: '20px',
    border: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(hover && !inset && {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: mode === 'light'
          ? '16px 16px 32px #d1d9e0, -16px -16px 32px #ffffff'
          : '16px 16px 32px #0d0f10, -16px -16px 32px #272b2f',
      },
    }),
    ...sx,
  };

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
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

export default NeumorphicCard;
