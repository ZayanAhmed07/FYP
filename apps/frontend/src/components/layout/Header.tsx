import { Link, NavLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Box, Container } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';
import DarkModeToggle from '../ui/DarkModeToggle';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isHome = location.pathname === '/';

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(18,35,37,0.85) 0%, rgba(13,180,188,0.08) 60%, rgba(18,35,37,0.85) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(13,180,188,0.06) 60%, rgba(255,255,255,0.85) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(13, 180, 188, 0.15)' : 'rgba(13, 180, 188, 0.12)',
        boxShadow: '0 10px 30px rgba(13, 180, 188, 0.12)',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 72, py: 0 }}>
          {/* Brand Logo */}
          <Box 
            component={Link} 
            to="/" 
            sx={{
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              fontWeight: 900,
              fontFamily: 'heading',
              background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              letterSpacing: '-0.5px',
              '&:hover': {
                transform: 'translateY(-2px)',
                filter: 'brightness(1.1)',
              },
            }}
          >
            Expert Raah
          </Box>

          {/* Navigation */}
          <Box component="nav" sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
            {isHome ? (
              <>
                <Box
                  component="a"
                  href="#home"
                  sx={{
                    position: 'relative',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9f3f5' : 'text.primary',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: -6,
                      width: '0%',
                      height: 2,
                      background: 'linear-gradient(90deg, #0db4bc, #2d5a5f)',
                      transition: 'width 0.25s ease',
                    },
                    '&:hover::after': {
                      width: '100%',
                    },
                  }}
                >
                  Home
                </Box>
                <Box
                  component="a"
                  href="#services"
                  sx={{
                    position: 'relative',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9f3f5' : 'text.primary',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: -6,
                      width: '0%',
                      height: 2,
                      background: 'linear-gradient(90deg, #0db4bc, #2d5a5f)',
                      transition: 'width 0.25s ease',
                    },
                    '&:hover::after': {
                      width: '100%',
                    },
                  }}
                >
                  Services
                </Box>
                <Box
                  component="a"
                  href="#about"
                  sx={{
                    position: 'relative',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9f3f5' : 'text.primary',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: -6,
                      width: '0%',
                      height: 2,
                      background: 'linear-gradient(90deg, #0db4bc, #2d5a5f)',
                      transition: 'width 0.25s ease',
                    },
                    '&:hover::after': {
                      width: '100%',
                    },
                  }}
                >
                  About Us
                </Box>
                <Box
                  component="a"
                  href="#contact"
                  sx={{
                    position: 'relative',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9f3f5' : 'text.primary',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: -6,
                      width: '0%',
                      height: 2,
                      background: 'linear-gradient(90deg, #0db4bc, #2d5a5f)',
                      transition: 'width 0.25s ease',
                    },
                    '&:hover::after': {
                      width: '100%',
                    },
                  }}
                >
                  Contact Us
                </Box>
              </>
            ) : (
              <>
                <Box
                  component={NavLink}
                  to="/"
                  end
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    '&.active': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  }}
                >
                  Home
                </Box>
                <Box
                  component={NavLink}
                  to="/dashboard"
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    '&.active': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  }}
                >
                  Dashboard
                </Box>
                {isAuthenticated && <NotificationDropdown />}
                <Box
                  component={NavLink}
                  to="/login"
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    '&.active': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  }}
                >
                  Login
                </Box>
              </>
            )}
            <DarkModeToggle />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
