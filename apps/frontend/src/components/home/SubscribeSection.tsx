import { type FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { Box, Container, Typography, TextField, Grid, List, ListItem, IconButton } from '@mui/material';
import { LinkedIn, Facebook, Instagram, Twitter, Email, Phone, LocationOn, ArrowForward } from '@mui/icons-material';

const SubscribeSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      toast.info('Please enter your email.');
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Replace with newsletter subscription endpoint.
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('You are now subscribed!');
      setEmail('');
    } catch (error) {
      toast.error('Subscription failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        pt: 8,
        pb: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Subscribe Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 4,
            mb: 6,
            pb: 6,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Subscribe!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              To our Newsletter
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              gap: 1,
              width: { xs: '100%', md: 'auto' },
              minWidth: { md: 400 },
            }}
          >
            <TextField
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              size="medium"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            <IconButton
              type="submit"
              disabled={isSubmitting}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 3,
                px: 3,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {isSubmitting ? '...' : <ArrowForward />}
            </IconButton>
          </Box>
        </Box>

        {/* Footer Columns */}
        <Grid container spacing={4}>
          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Links
            </Typography>
            <List sx={{ p: 0 }}>
              {[
                { label: 'Home', href: '#hero' },
                { label: 'Services', href: '#services' },
                { label: 'About Us', href: '#about' },
                { label: 'Contact Us', href: '#contact' },
              ].map((link) => (
                <ListItem key={link.label} sx={{ px: 0, py: 0.5 }}>
                  <Typography
                    component="a"
                    href={link.href}
                    sx={{
                      color: 'text.secondary',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {link.label}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Follow Us */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Follow Us
            </Typography>
            <List sx={{ p: 0 }}>
              {[
                { Icon: LinkedIn, label: 'LinkedIn', href: 'https://www.linkedin.com/' },
                { Icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/' },
                { Icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/' },
                { Icon: Twitter, label: 'X (Twitter)', href: 'https://www.x.com/' },
              ].map(({ Icon, label, href }) => (
                <ListItem key={label} sx={{ px: 0, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'text.secondary',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {href}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Contact Us */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Contact Us
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: 0, py: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Email sx={{ fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
                <Typography
                  component="a"
                  href="mailto:expertraah@email.com"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  expertraah@email.com
                </Typography>
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Phone sx={{ fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
                <Typography
                  component="a"
                  href="tel:+925134567"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  +92-51-34567
                </Typography>
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn sx={{ fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.95rem',
                  }}
                >
                  Khudadad Heights, E-11, Islamabad
                </Typography>
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SubscribeSection;


