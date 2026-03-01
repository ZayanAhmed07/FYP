import { Box, Container, Typography, Card, CardContent, CardMedia, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import {
  serviceBusinessImage,
  serviceEducationImage,
  serviceLegalImage,
} from '../../assets';

const SERVICES = [
  {
    id: 'education',
    title: 'Educational Consultation',
    description: 'Support with admissions, career counseling, study abroad guidance, and academic planning.',
    image: serviceEducationImage,
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🎓',
  },
  {
    id: 'legal',
    title: 'Legal Consultation',
    description: 'Contracts, disputes, intellectual property, compliance, and other legal matters.',
    image: serviceLegalImage,
    gradient: 'from-purple-500 to-pink-500',
    icon: '⚖️',
  },
  {
    id: 'business',
    title: 'Business Consultation',
    description: 'Strategy, operations, marketing, and financial management expertise for growing teams.',
    image: serviceBusinessImage,
    gradient: 'from-orange-500 to-red-500',
    icon: '💼',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const ServicesSection = () => {
  return (
    <Box
      id="services"
      sx={{
        py: { xs: 6, md: 8 },
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #1a1a1a 0%, #0f2729 50%, #1a1a1a 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 50%, #ffffff 100%)',
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 900,
                mb: 2,
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Our Services
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.15rem' },
                lineHeight: 1.8,
                color: 'text.secondary',
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              Expert Raah connects you with trusted consultants in legal, business, and educational fields.
              Choose the support you need and our network will guide you forward.
            </Typography>
          </Box>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Grid container spacing={2} sx={{ alignItems: 'stretch', justifyContent: 'center' }}>
            {SERVICES.map((service, index) => (
              <Grid item xs={12} sm={6} md={4} key={service.id} sx={{ display: 'flex' }}>
                <motion.div variants={cardVariants} style={{ width: '100%', display: 'flex' }}>
                  <Card
                    sx={{
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.7) 0%, rgba(10, 25, 27, 0.85) 100%)'
                          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.9) 100%)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '2px solid rgba(13, 180, 188, 0.15)'
                          : '2px solid rgba(13, 180, 188, 0.12)',
                      boxShadow: '0 15px 45px rgba(13, 180, 188, 0.12)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 25px 60px rgba(13, 180, 188, 0.25)',
                        border: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '2px solid rgba(13, 180, 188, 0.35)'
                            : '2px solid rgba(13, 180, 188, 0.25)',
                      },
                    }}
                  >
                    {/* Image with Overlay */}
                    <Box sx={{ position: 'relative', overflow: 'hidden', height: 140 }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={service.image}
                        alt={service.title}
                        sx={{
                          transition: 'transform 0.6s ease',
                          '&:hover': {
                            transform: 'scale(1.08)',
                          },
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.15) 0%, rgba(45, 90, 95, 0.15) 100%)',
                          opacity: 0,
                          transition: 'opacity 0.4s ease',
                          '&:hover': {
                            opacity: 1,
                          },
                        }}
                      />

                      {/* Floating Icon */}
                      <motion.div
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                        }}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '16px',
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(13, 180, 188, 0.15)'
                                : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 24px rgba(13, 180, 188, 0.2)',
                            fontSize: '2rem',
                          }}
                        >
                          {service.icon}
                        </Box>
                      </motion.div>
                    </Box>

                    <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: (theme) =>
                            theme.palette.mode === 'dark' ? '#c9f3f5' : 'text.primary',
                          fontSize: '1.15rem',
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            color: '#0db4bc',
                          },
                        }}
                      >
                        {service.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.6,
                          fontSize: '0.875rem',
                          mb: 1,
                          flexGrow: 1,
                        }}
                      >
                        {service.description}
                      </Typography>

                      {/* Animated Border */}
                      <Box
                        sx={{
                          height: 3,
                          width: 0,
                          borderRadius: 2,
                          background: 'linear-gradient(90deg, #0db4bc 0%, #2d5a5f 100%)',
                          transition: 'width 0.4s ease',
                          '.MuiCard-root:hover &': {
                            width: '100%',
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ServicesSection;

