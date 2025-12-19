import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, IconButton, Card, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { FaLinkedinIn, FaFacebookF, FaInstagram, FaTwitter, FaArrowRight } from 'react-icons/fa';
import { heroImage, heroSectionBackground } from '../../assets';
import { useAuth } from '../../hooks/useAuth';

const socialLinks = [
  { href: 'https://www.linkedin.com/', label: 'LinkedIn', Icon: FaLinkedinIn, color: '#0077B5' },
  { href: 'https://www.facebook.com/', label: 'Facebook', Icon: FaFacebookF, color: '#1877F2' },
  { href: 'https://www.instagram.com/', label: 'Instagram', Icon: FaInstagram, color: '#E4405F' },
  { href: 'https://www.x.com/', label: 'X', Icon: FaTwitter, color: '#1DA1F2' },
];

const HeroSection = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (isAuthenticated && user) {
      if (user.roles.includes('admin') || user.accountType === 'admin') {
        navigate('/admin');
      } else if (user.accountType === 'consultant') {
        navigate('/consultant-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } else {
      navigate('/signup');
    }
  };

  return (
    <Box
      id="hero"
      sx={{ 
        position: 'relative',
        minHeight: { xs: 'auto', md: '85vh' },
        overflow: 'hidden',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #0f2729 50%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f7f9 50%, #ffffff 100%)',
      }}
    >
      {/* Animated Background Pattern */}
      <Box
        className="absolute inset-0"
        sx={{
          backgroundImage: `url(${heroSectionBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
        }}
      />

      {/* Gradient Overlay */}
      <Box 
        className="absolute inset-0" 
        sx={{
          background: 'radial-gradient(circle at 30% 50%, rgba(13, 180, 188, 0.08) 0%, transparent 50%)',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 10 }}>
        <Box 
          sx={{
            display: 'flex',
            minHeight: { xs: 'auto', md: '85vh' },
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 4, lg: 6 },
            py: { xs: 4, md: 6, lg: 8 },
          }}
        >
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ flex: 1, maxWidth: '600px' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '3.5rem', sm: '4.5rem', md: '5.5rem', lg: '7rem' },
                    fontWeight: 900,
                    fontFamily: 'heading',
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 4px 20px rgba(13, 180, 188, 0.3)',
                    mb: 2,
                  }}
                >
                  EXPERT
                  <br />
                  RAAH
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: '1.25rem', md: '1.75rem', lg: '2rem' },
                    fontWeight: 600,
                    fontFamily: 'body',
                    color: (theme) => theme.palette.mode === 'dark' ? '#06b6d4' : '#0f766e',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    mb: 3,
                  }}
                >
                  YOUR RAAH TO RELIABLE SOLUTIONS
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: '1rem', md: '1.15rem', lg: '1.25rem' },
                    lineHeight: 1.8,
                    color: 'text.secondary',
                    maxWidth: '600px',
                    mb: 4,
                  }}
                >
                  Connect with Pakistan's top verified consultants in legal, business, and education. 
                  Our transparent bidding system ensures you get expert guidance at competitive rates.
                </Typography>
              </motion.div>
            </Box>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleButtonClick}
                endIcon={<FaArrowRight />}
                sx={{
                  px: 6,
                  py: 2.5,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  fontWeight: 700,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  boxShadow: '0 10px 40px rgba(13, 180, 188, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)',
                    boxShadow: '0 15px 50px rgba(13, 180, 188, 0.5)',
                    transform: 'translateY(-3px) scale(1.02)',
                  },
                }}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Join Us Now'}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
          >
            {/* Floating Animation Container */}
            <motion.div
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ position: 'relative', width: '100%', maxWidth: '650px' }}
            >
              {/* Decorative Glow Orbs */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '-60px',
                  right: '-60px',
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(13, 180, 188, 0.25) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  zIndex: -1,
                  animation: 'pulse 4s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
                    '50%': { opacity: 0.9, transform: 'scale(1.1)' },
                  },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '-60px',
                  left: '-60px',
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(45, 90, 95, 0.25) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  zIndex: -1,
                  animation: 'pulse 4s ease-in-out infinite 2s',
                }}
              />

              {/* Premium Image Card */}
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.6) 0%, rgba(10, 25, 27, 0.8) 100%)'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '2px solid rgba(13, 180, 188, 0.2)'
                      : '2px solid rgba(13, 180, 188, 0.15)',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 25px 60px rgba(13, 180, 188, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : '0 25px 60px rgba(13, 180, 188, 0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
                  p: { xs: 2, md: 2.5 },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'dark'
                        ? '0 35px 80px rgba(13, 180, 188, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)'
                        : '0 35px 80px rgba(13, 180, 188, 0.35), inset 0 1px 0 rgba(255,255,255,1)',
                  },
                }}
              >
                <Box
                  component="img"
                  src={heroImage}
                  alt="Expert consultants collaborating on solutions"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: { xs: '50vh', md: '60vh', lg: '65vh' },
                    objectFit: 'contain',
                    borderRadius: '24px',
                    display: 'block',
                  }}
                />
              </Box>
            </motion.div>
          </motion.div>
        </Box>

        {/* Social Links & Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 2.5, md: 3 },
              mt: { xs: -2, md: -4 },
              pb: { xs: 2, md: 3 },
            }}
          >
            {/* Social Links Card */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, md: 2 },
                px: { xs: 3, md: 4 },
                py: { xs: 2, md: 2.5 },
                borderRadius: '24px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(20, 35, 37, 0.7) 0%, rgba(10, 25, 27, 0.85) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.85) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '1px solid rgba(13, 180, 188, 0.2)'
                    : '1px solid rgba(13, 180, 188, 0.15)',
                boxShadow: '0 12px 40px rgba(13, 180, 188, 0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 50px rgba(13, 180, 188, 0.22)',
                },
              }}
            >
              {socialLinks.map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconButton
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    sx={{
                      width: { xs: 44, md: 50 },
                      height: { xs: 44, md: 50 },
                      borderRadius: '50%',
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(13, 180, 188, 0.12)'
                          : 'rgba(255, 255, 255, 0.9)',
                      color: (theme) =>
                        theme.palette.mode === 'dark' ? '#c9f3f5' : link.color,
                      border: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '1px solid rgba(13, 180, 188, 0.25)'
                          : '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: link.color,
                        color: '#ffffff',
                        boxShadow: `0 8px 20px ${link.color}40`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <link.Icon size={20} />
                  </IconButton>
                </motion.div>
              ))}
              <Box
                sx={{
                  ml: { xs: 1, md: 2 },
                  pl: { xs: 2, md: 2.5 },
                  borderLeft: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '1px solid rgba(13, 180, 188, 0.2)'
                      : '1px solid rgba(13, 180, 188, 0.15)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', md: '0.95rem' },
                  }}
                >
                  Connect with us
                </Typography>
              </Box>
            </Box>

            {/* Stats Card */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                px: { xs: 3, md: 4 },
                py: { xs: 2, md: 2.5 },
                borderRadius: '24px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(20, 35, 37, 0.7) 0%, rgba(10, 25, 27, 0.85) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.85) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '1px solid rgba(13, 180, 188, 0.2)'
                    : '1px solid rgba(13, 180, 188, 0.15)',
                boxShadow: '0 12px 40px rgba(13, 180, 188, 0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 50px rgba(13, 180, 188, 0.22)',
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(13, 180, 188, 0.2) 0%, rgba(13, 180, 188, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(13, 180, 188, 0.15) 0%, rgba(13, 180, 188, 0.08) 100%)',
                  boxShadow: 'inset 0 2px 8px rgba(13, 180, 188, 0.15)',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  10k+
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? '#c9f3f5' : 'text.primary',
                    mb: 0.25,
                  }}
                >
                  Satisfied Users
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.85rem',
                  }}
                >
                  from Pakistan
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default HeroSection;
