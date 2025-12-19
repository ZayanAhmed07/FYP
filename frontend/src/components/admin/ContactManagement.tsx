import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  TextField,
  Modal,
  IconButton,
  CircularProgress,
  Grid
} from '@mui/material';
import { FaTimes, FaEnvelope, FaCheckCircle, FaEye } from 'react-icons/fa';
import { httpClient } from '../../api/httpClient';

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  status: 'pending' | 'reviewed' | 'responded';
  adminResponse?: string;
  adminResponseDate?: string;
  reviewedBy?: {
    firstName: string;
    lastName: string;
  };
  submissionDate: string;
}

interface ContactStats {
  total: number;
  pending: number;
  reviewed: number;
  responded: number;
}

const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [filter]);

  const fetchContacts = async () => {
    try {
      const response = await httpClient.get(`/admin/contacts?status=${filter}`);
      setContacts(response.data.data.contacts);
    } catch (error) {
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await httpClient.get('/admin/contacts/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleStatusUpdate = async (contactId: string, status: string, adminResponse?: string) => {
    try {
      await httpClient.patch(`/admin/contacts/${contactId}`, {
        status,
        adminResponse: adminResponse || undefined,
      });
      toast.success('Contact updated successfully');
      fetchContacts();
      fetchStats();
      setSelectedContact(null);
      setResponse('');
    } catch (error) {
      toast.error('Failed to update contact');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'reviewed': return '#2196f3';
      case 'responded': return '#22c55e';
      default: return '#ff9800';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress sx={{ color: '#0db4bc' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 2 }}>
          Contact Management
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filter by Status"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(13, 180, 188, 0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0db4bc' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0db4bc' }
            }}
          >
            <MenuItem value="">All Contacts</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="reviewed">Reviewed</MenuItem>
            <MenuItem value="responded">Responded</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                p: 3,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0db4bc', mb: 1 }}>
                {stats.total}
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '14px' }}>Total Contacts</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                background: 'rgba(255, 152, 0, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                p: 3,
                boxShadow: '0 4px 16px rgba(255, 152, 0, 0.2)',
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                {stats.pending}
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '14px' }}>Pending</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                background: 'rgba(33, 150, 243, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                p: 3,
                boxShadow: '0 4px 16px rgba(33, 150, 243, 0.2)',
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3', mb: 1 }}>
                {stats.reviewed}
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '14px' }}>Reviewed</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                background: 'rgba(34, 197, 94, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                p: 3,
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.2)',
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e', mb: 1 }}>
                {stats.responded}
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '14px' }}>Responded</Typography>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Contacts List */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
          Contact Submissions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {contacts.length === 0 ? (
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FaEnvelope style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
              <Typography sx={{ color: '#666' }}>No contact submissions found</Typography>
            </Box>
          ) : (
            contacts.map((contact) => (
              <Box
                key={contact._id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                      {contact.firstName} {contact.lastName}
                    </Typography>
                    <Typography sx={{ color: '#0db4bc', fontSize: '14px', mb: 0.5 }}>
                      {contact.email}
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '13px' }}>
                      {new Date(contact.submissionDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  <Chip
                    label={contact.status.toUpperCase()}
                    sx={{
                      backgroundColor: getStatusColor(contact.status),
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2, p: 2, background: 'rgba(13, 180, 188, 0.05)', borderRadius: 2 }}>
                  <Typography sx={{ color: '#333', lineHeight: 1.6 }}>{contact.message}</Typography>
                </Box>

                {contact.adminResponse && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      background: 'rgba(34, 197, 94, 0.1)',
                      borderRadius: 2,
                      borderLeft: '4px solid #22c55e'
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, color: '#22c55e', mb: 1, fontSize: '14px' }}>
                      Admin Response:
                    </Typography>
                    <Typography sx={{ color: '#333', fontSize: '14px' }}>{contact.adminResponse}</Typography>
                    {contact.adminResponseDate && (
                      <Typography sx={{ color: '#999', fontSize: '12px', mt: 1 }}>
                        Sent on: {new Date(contact.adminResponseDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {contact.status === 'pending' && (
                    <Button
                      onClick={() => handleStatusUpdate(contact._id, 'reviewed')}
                      startIcon={<FaCheckCircle />}
                      sx={{
                        background: '#2196f3',
                        color: '#fff',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        '&:hover': {
                          background: '#1976d2',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                        }
                      }}
                    >
                      Mark as Reviewed
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedContact(contact)}
                    startIcon={<FaEnvelope />}
                    sx={{
                      background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                      color: '#fff',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2d5a5f 0%, #0db4bc 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)'
                      }
                    }}
                  >
                    Respond
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Response Modal */}
      <Modal
        open={selectedContact !== null}
        onClose={() => {
          setSelectedContact(null);
          setResponse('');
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            p: 4
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              Respond to {selectedContact?.firstName} {selectedContact?.lastName}
            </Typography>
            <IconButton
              onClick={() => {
                setSelectedContact(null);
                setResponse('');
              }}
              sx={{ color: '#666' }}
            >
              <FaTimes />
            </IconButton>
          </Box>

          <Box
            sx={{
              mb: 3,
              p: 2,
              background: 'rgba(13, 180, 188, 0.05)',
              borderRadius: 2,
              borderLeft: '4px solid #0db4bc'
            }}
          >
            <Typography sx={{ fontWeight: 600, color: '#0db4bc', mb: 1, fontSize: '14px' }}>
              Original Message:
            </Typography>
            <Typography sx={{ color: '#333', lineHeight: 1.6 }}>{selectedContact?.message}</Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Your Response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your response here..."
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(13, 180, 188, 0.3)' },
                '&:hover fieldset': { borderColor: '#0db4bc' },
                '&.Mui-focused fieldset': { borderColor: '#0db4bc' }
              }
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setSelectedContact(null);
                setResponse('');
              }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                border: '2px solid #0db4bc',
                color: '#0db4bc',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(13, 180, 188, 0.05)',
                  borderColor: '#2d5a5f'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleStatusUpdate(selectedContact!._id, 'responded', response)}
              disabled={!response.trim()}
              startIcon={<FaEnvelope />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                color: '#fff',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #2d5a5f 0%, #0db4bc 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)'
                },
                '&:disabled': {
                  background: '#ccc',
                  color: '#999'
                }
              }}
            >
              Send Response
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default ContactManagement;