import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { foundersImage, polygonBackground } from '../../assets';
import { useAuth } from '../../hooks/useAuth';
import { AnimatedButton } from '../ui';

const AboutSection = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user type
      if (user.roles.includes('admin') || user.accountType === 'admin') {
        navigate('/admin');
      } else if (user.accountType === 'consultant') {
        navigate('/consultant-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <Box
      component="section"
      id="about"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 4,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-1px',
                }}
              >
                About Us
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.9, fontSize: '1.1rem' }}>
                Expert Raah is revolutionizing consultancy in Pakistan by connecting clients with verified legal, business,
                and educational experts through a secure, user-friendly platform. Our unique bidding system empowers both
                clients and consultants with transparency, trust, and innovation at every step.
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.8 }}>
                Founded by Daim Ali (CEO) and Zayan Ahmed (Co-Founder), Expert Raah exists to transform the way consultancy
                works. We are building a reliable pathway to expertise, creating meaningful opportunities, and delivering
                consistent value to the communities we serve.
              </Typography>
              <AnimatedButton
                variant="contained"
                size="large"
                onClick={handleButtonClick}
                sx={{
                  px: 5,
                  py: 2,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  boxShadow: '0 8px 30px rgba(13, 180, 188, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)',
                    boxShadow: '0 12px 40px rgba(13, 180, 188, 0.45)',
                  },
                }}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Join Us Now'}
              </AnimatedButton>
            </motion.div>
          </Box>
          <Box sx={{ flex: 1 }}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Box
                  component="img"
                  src={polygonBackground}
                  alt=""
                  sx={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    opacity: 0.15,
                    zIndex: 0,
                    animation: 'spin 20s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <Box
                  component="img"
                  src={foundersImage}
                  alt="Expert Raah founders"
                  sx={{
                    width: '100%',
                    maxWidth: 550,
                    height: 'auto',
                    borderRadius: 5,
                    boxShadow: '0 25px 80px rgba(13, 180, 188, 0.25)',
                    position: 'relative',
                    zIndex: 1,
                    border: '3px solid',
                    borderColor: 'rgba(13, 180, 188, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 30px 100px rgba(13, 180, 188, 0.35)',
                    },
                  }}
                />
              </Box>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutSection;

