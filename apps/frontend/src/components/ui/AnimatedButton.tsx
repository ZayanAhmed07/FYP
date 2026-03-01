import React from 'react';
import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { motion } from 'framer-motion';

interface AnimatedButtonProps extends ButtonProps {
  hoverScale?: number;
  tapScale?: number;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  hoverScale = 1.05,
  tapScale = 0.95,
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{ display: 'inline-block' }}
    >
      <Button {...props}>{children}</Button>
    </motion.div>
  );
};

export default AnimatedButton;
