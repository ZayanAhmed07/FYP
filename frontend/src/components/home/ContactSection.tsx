import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Box, Container, Typography, Grid, TextField, List, ListItem, ListItemText } from '@mui/material';
import { motion } from 'framer-motion';
import { httpClient } from '../../api/httpClient';
import { useAuth } from '../../hooks/useAuth';
import { AnimatedButton } from '../ui';

const ContactSection = () => {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(() => ({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    message: '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email || !form.message) {
      toast.warning('Please provide a valid email and message.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        message: form.message,
      };

      if (isAuthenticated && user) {
        payload.userId = user.id;
      }

      await httpClient.post('/contacts/submit', payload);
      toast.success('Thanks for reaching out! We will contact you shortly.');
      setForm({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        message: '',
      });
    } catch (error) {
      toast.error('Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="section"
      id="contact"
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.05) 0%, rgba(45, 90, 95, 0.05) 100%)',
      }}
    >
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px',
              }}
            >
              Contact Us
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', maxWidth: '600px', mx: 'auto' }}>
              Connect with Expert Raah for support, inquiries, or collaborations.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={6} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <List sx={{ '& .MuiListItem-root': { px: 0, py: 2 } }}>
                <ListItem>
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight={600}>LinkedIn</Typography>}
                    secondary={
                      <Typography
                        component="a"
                        href="https://www.linkedin.com/"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        https://www.linkedin.com/
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight={600}>Facebook</Typography>}
                    secondary={
                      <Typography
                        component="a"
                        href="https://www.facebook.com/"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        https://www.facebook.com/
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight={600}>Email</Typography>}
                    secondary={
                      <Typography
                        component="a"
                        href="mailto:expertraah@email.com"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        expertraah@email.com
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight={600}>Phone</Typography>}
                    secondary={
                      <Typography
                        component="a"
                        href="tel:+92511234567"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        +92-51-1234567
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight={600}>Address</Typography>}
                    secondary="Khudadad Heights, E-11, Islamabad"
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={form.firstName}
                  onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={form.lastName}
                  onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </Box>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                required
              />
              <AnimatedButton
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  px: 5,
                  py: 2,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  alignSelf: 'flex-start',
                  boxShadow: '0 8px 30px rgba(13, 180, 188, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)',
                    boxShadow: '0 12px 40px rgba(13, 180, 188, 0.45)',
                  },
                }}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </AnimatedButton>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ContactSection;




