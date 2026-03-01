import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from './Header';

const MainLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: isHome ? 0 : 4,
          pb: 6,
        }}
      >
        {isHome ? (
          <Outlet />
        ) : (
          <Container maxWidth="xl" sx={{ flex: 1 }}>
            <Outlet />
          </Container>
        )}
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Box component="p" sx={{ color: 'text.secondary', fontSize: '0.875rem', m: 0 }}>
          &copy; {new Date().getFullYear()} Expert Raah. All rights reserved.
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;


