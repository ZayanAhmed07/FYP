import { Box, CircularProgress, Typography } from '@mui/material';

export const Loader = () => {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 2,
      }}
    >
      <CircularProgress 
        size={50} 
        thickness={4}
        sx={{
          color: 'primary.main',
        }}
      />
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'text.secondary',
          fontWeight: 500,
        }}
      >
        Loading...
      </Typography>
    </Box>
  );
};


