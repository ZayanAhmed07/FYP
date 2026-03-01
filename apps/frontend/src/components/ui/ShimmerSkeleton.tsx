import React from 'react';
import { Skeleton, type SxProps, type Theme } from '@mui/material';
import type { SkeletonProps } from '@mui/material';
import { useThemeMode } from '../../context/ThemeContext';

interface ShimmerSkeletonProps extends SkeletonProps {
  shimmer?: boolean;
}

const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  shimmer = true,
  sx,
  ...props
}) => {
  const { mode } = useThemeMode();

  const shimmerStyles: SxProps<Theme> = shimmer
    ? {
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          transform: 'translateX(-100%)',
          background:
            mode === 'light'
              ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          animation: 'shimmer 2s infinite',
        },
        '@keyframes shimmer': {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      }
    : {};

  return (
    <Skeleton
      animation={shimmer ? false : 'wave'}
      sx={[
        shimmerStyles,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
};

export default ShimmerSkeleton;
