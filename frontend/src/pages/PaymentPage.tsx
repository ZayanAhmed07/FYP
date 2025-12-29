import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCreditCard, FaMobileAlt } from 'react-icons/fa';
import { Box, Typography, TextField, Button, IconButton, Avatar, Chip, Modal } from '@mui/material';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';

type PaymentMethod = 'easypaisa' | 'jazzcash' | 'card';
type PaymentStep = 'details' | 'otp' | 'success';

interface LocationState {
  amount: number;
  proposalId: string;
  orderId: string;
  jobTitle?: string;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const amount = state?.amount || 0;
  const proposalId = state?.proposalId;
  const orderId = state?.orderId;
  
  const [step, setStep] = useState<PaymentStep>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('easypaisa');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Payment Details
  const [mobileNumber, setMobileNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState('');
  
  // Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    if (!proposalId || !amount || !orderId) {
      alert('Invalid payment information');
      navigate('/buyer-dashboard');
    }
  }, [navigate, proposalId, amount]);

  const formatMobileNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}${cleaned.slice(7)}`;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleMobileNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 15) {
      setMobileNumber(formatMobileNumber(cleaned));
    }
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 19) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  const handleExpiryDateChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setExpiryDate(formatExpiryDate(cleaned));
    }
  };

  const handleStripePayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await httpClient.post('/orders/payment/stripe/checkout-session', {
        orderId,
        proposalId,
        amount
      });

      if (response.data?.success && response.data.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.data.url;
      } else {
        setError('Failed to create payment session');
      }
    } catch (err: any) {
      console.error('Stripe payment failed', err);
      setError(err.response?.data?.message || 'Failed to initialize Stripe payment. Please try again.');
      setLoading(false);
    }
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === 'card') {
      const cleanedCard = cardNumber.replace(/\s/g, '');
      if (!cleanedCard || cleanedCard.length < 13) {
        setError('Please enter a valid card number');
        return false;
      }
      if (!cardHolderName || cardHolderName.trim().length < 3) {
        setError('Please enter card holder name');
        return false;
      }
      if (!expiryDate || expiryDate.length < 4) {
        setError('Please enter expiry date');
        return false;
      }
      if (!cvv || cvv.length < 3) {
        setError('Please enter CVV');
        return false;
      }
    } else {
      // EasyPaisa or JazzCash
      const cleanedMobile = mobileNumber.replace(/\D/g, '');
      if (!cleanedMobile || cleanedMobile.length < 10) {
        setError('Please enter a valid mobile number');
        return false;
      }
    }
    return true;
  };

  const handleContinue = async () => {
    setError('');
    
    if (!validatePaymentDetails()) {
      return;
    }

    setLoading(true);
    try {
      const paymentDetails: any = {};
      
      if (paymentMethod === 'card') {
        paymentDetails.cardNumber = cardNumber.replace(/\s/g, '');
        paymentDetails.cardHolderName = cardHolderName;
        paymentDetails.expiryDate = expiryDate;
        paymentDetails.cvv = cvv;
      } else {
        paymentDetails.mobileNumber = mobileNumber.replace(/\D/g, '');
      }

      const response = await httpClient.post('/orders/payment/process', {
        orderId,
        proposalId,
        amount,
        paymentMethod,
        paymentDetails
      });

      if (response.data?.success) {
        setPaymentSessionId(response.data.data.paymentSessionId);
        setDevelopmentOtp(response.data.data.developmentOtp || '');
        setStep('otp');
        
        if (response.data.data.developmentOtp) {
          const otpArray = response.data.data.developmentOtp.split('');
          setOtp(otpArray);
        }
      }
    } catch (err: any) {
      console.error('Payment processing failed', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await httpClient.post('/orders/payment/verify', {
        paymentSessionId,
        otp: otpString
      });

      if (response.data?.success) {
        setStep('success');
      }
    } catch (err: any) {
      console.error('OTP verification failed', err);
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    navigate('/buyer-dashboard', { state: { tab: 'orders' } });
  };

  const getPaymentMethodDisplay = () => {
    switch (paymentMethod) {
      case 'easypaisa': return 'EasyPaisa';
      case 'jazzcash': return 'JazzCash';
      case 'card': return 'Debit/Credit Card (Local & International)';
      default: return '';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #f0f9ff 100%)',
        py: 5,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          mb: 4,
          mx: 'auto',
          maxWidth: 1200,
          px: 4,
          py: 2.5,
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(13, 180, 188, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid rgba(13, 180, 188, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/src/assets/logo.png"
            alt="Expert Raah"
            sx={{ width: 42, height: 42, borderRadius: '10px' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            EXPERT RAAH
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => navigate('/buyer-dashboard')}
            sx={{ 
              color: '#64748b', 
              fontWeight: 500,
              px: 2.5,
              py: 1,
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '0.9375rem',
              '&:hover': { 
                color: '#0db4bc',
                background: 'rgba(13, 180, 188, 0.04)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Dashboard
          </Button>
          <Button 
            sx={{ 
              color: '#64748b', 
              fontWeight: 500,
              px: 2.5,
              py: 1,
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '0.9375rem',
              '&:hover': { 
                color: '#0db4bc',
                background: 'rgba(13, 180, 188, 0.04)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Projects
          </Button>
          <Button
            sx={{
              color: '#0db4bc',
              fontWeight: 600,
              px: 2.5,
              py: 1,
              background: 'rgba(13, 180, 188, 0.08)',
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '0.9375rem',
              border: '1px solid rgba(13, 180, 188, 0.2)',
              '&:hover': { 
                background: 'rgba(13, 180, 188, 0.12)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Payment
          </Button>
          <Button 
            sx={{ 
              color: '#64748b', 
              fontWeight: 500,
              px: 2.5,
              py: 1,
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '0.9375rem',
              '&:hover': { 
                color: '#0db4bc',
                background: 'rgba(13, 180, 188, 0.04)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Orders
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <IconButton 
            sx={{ 
              color: '#64748b',
              '&:hover': { 
                color: '#0db4bc',
                background: 'rgba(13, 180, 188, 0.04)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            🔔
          </IconButton>
          <Box 
            onClick={() => navigate('/profile')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              cursor: 'pointer',
              px: 2,
              py: 1,
              borderRadius: '10px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'rgba(13, 180, 188, 0.04)',
              },
            }}
          >
            <Avatar
              src={currentUser?.profileImage || "https://i.pravatar.cc/150?img=10"}
              alt="User"
              sx={{ 
                width: 38, 
                height: 38,
                border: '2px solid rgba(13, 180, 188, 0.15)',
              }}
            />
            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>
              {currentUser?.name || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3 }}>
        {step === 'details' && (
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(13, 180, 188, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              border: '1px solid rgba(13, 180, 188, 0.08)',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                color: 'white',
                px: 4,
                py: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.02em' }}>
                  Payment Details
                </Typography>
                <Typography sx={{ opacity: 0.9, fontSize: '0.9375rem', fontWeight: 400 }}>
                  Secure payment processing
                </Typography>
              </Box>
              <Chip
                label={`Rs ${amount?.toLocaleString()}`}
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#0db4bc',
                  fontWeight: 700,
                  fontSize: '1.375rem',
                  height: 48,
                  px: 3,
                  borderRadius: '12px',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </Box>

            {error && (
              <Box
                sx={{
                  mx: 4,
                  mt: 4,
                  p: 3,
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '12px',
                  color: '#dc2626',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                }}
              >
                {error}
              </Box>
            )}

            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0f172a', fontSize: '1.125rem' }}>
                Choose Payment Method
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2.5, mb: 5 }}>
                <Box
                  onClick={() => setPaymentMethod('easypaisa')}
                  sx={{
                    flex: 1,
                    p: 3.5,
                    border: paymentMethod === 'easypaisa' ? '2px solid #0db4bc' : '2px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: paymentMethod === 'easypaisa' ? 'rgba(13, 180, 188, 0.04)' : 'white',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#0db4bc',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(13, 180, 188, 0.15)',
                    },
                  }}
                >
                  <FaMobileAlt style={{ fontSize: '32px', color: '#0db4bc', marginBottom: '12px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem', color: '#0f172a' }}>
                    EasyPaisa
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Pay with your EasyPaisa account
                  </Typography>
                </Box>

                <Box
                  onClick={() => setPaymentMethod('jazzcash')}
                  sx={{
                    flex: 1,
                    p: 3.5,
                    border: paymentMethod === 'jazzcash' ? '2px solid #0db4bc' : '2px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: paymentMethod === 'jazzcash' ? 'rgba(13, 180, 188, 0.04)' : 'white',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#0db4bc',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(13, 180, 188, 0.15)',
                    },
                  }}
                >
                  <FaMobileAlt style={{ fontSize: '32px', color: '#0db4bc', marginBottom: '12px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem', color: '#0f172a' }}>
                    JazzCash
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Pay with your JazzCash account
                  </Typography>
                </Box>

                <Box
                  onClick={handleStripePayment}
                  sx={{
                    flex: 1,
                    p: 3.5,
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: 'white',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#0db4bc',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(13, 180, 188, 0.15)',
                    },
                  }}
                >
                  <FaCreditCard style={{ fontSize: '32px', color: '#0db4bc', marginBottom: '12px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem', color: '#0f172a' }}>
                    Debit/Credit Card
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Pay with Stripe
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0f172a', fontSize: '1.125rem' }}>
                Enter Payment Details
              </Typography>

              {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                <TextField
                  fullWidth
                  label="Mobile Number"
                  placeholder="03XX-XXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => handleMobileNumberChange(e.target.value)}
                  sx={{
                    mb: 4,
                    '& .MuiInputLabel-root': {
                      color: '#64748b',
                      fontWeight: 500,
                      fontSize: '0.9375rem',
                      '&.Mui-focused': {
                        color: '#0db4bc',
                      },
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      fontSize: '0.9375rem',
                      '& fieldset': { 
                        borderColor: '#e2e8f0',
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': { 
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#0db4bc',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      py: 2,
                    },
                  }}
                />
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleContinue}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  py: 2.25,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(13, 180, 188, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #087f85 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(13, 180, 188, 0.35)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </Box>
          </Box>
        )}

        {step === 'otp' && (
          <Modal
            open={step === 'otp'}
            onClose={() => !loading && setStep('details')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}
          >
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(13, 180, 188, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
                p: 5,
                maxWidth: 540,
                width: '100%',
                outline: 'none',
                border: '1px solid rgba(13, 180, 188, 0.08)',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a', textAlign: 'center', letterSpacing: '-0.02em' }}>
                Verify Payment
              </Typography>
              <Typography sx={{ color: '#64748b', mb: 4, textAlign: 'center', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                A 6-digit OTP has been sent to your {paymentMethod === 'card' ? 'registered mobile number' : `${getPaymentMethodDisplay()} account`}.
              </Typography>

              {developmentOtp && (
                <Box
                  sx={{
                    mb: 3,
                    p: 3,
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1.5px solid #fbbf24',
                    borderRadius: '12px',
                    color: '#78350f',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5 }}>
                    Development Mode
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0.1em' }}>
                    {developmentOtp}
                  </Typography>
                </Box>
              )}

              {error && (
                <Box
                  sx={{
                    mb: 3,
                    p: 3,
                    background: '#fef2f2',
                    border: '1.5px solid #fca5a5',
                    borderRadius: '12px',
                    color: '#dc2626',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                  }}
                >
                  {error}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, padding: '16px 0' } }}
                    disabled={loading}
                    sx={{
                      width: 64,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: digit ? 'rgba(13, 180, 188, 0.04)' : 'white',
                        '& fieldset': { 
                          borderColor: digit ? '#0db4bc' : '#e2e8f0',
                          borderWidth: '2px',
                        },
                        '&:hover fieldset': { 
                          borderColor: '#0db4bc',
                        },
                        '&.Mui-focused fieldset': { 
                          borderColor: '#0db4bc',
                          borderWidth: '2.5px',
                        },
                      },
                    }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyOtp}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  py: 2.25,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(13, 180, 188, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #087f85 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(13, 180, 188, 0.35)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Complete Payment'}
              </Button>
            </Box>
          </Modal>
        )}

        {step === 'success' && (
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(13, 180, 188, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
              p: 6,
              textAlign: 'center',
              border: '1px solid rgba(13, 180, 188, 0.08)',
            }}
          >
            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 4,
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                animation: 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                '@keyframes scaleIn': {
                  '0%': { transform: 'scale(0)', opacity: 0 },
                  '50%': { transform: 'scale(1.1)', opacity: 1 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              <svg viewBox="0 0 52 52" style={{ width: '56px', height: '56px' }}>
                <circle
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                />
                <path
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </Box>
            
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#0f172a', letterSpacing: '-0.03em', fontSize: '2.25rem' }}>
              Payment Successful!
            </Typography>
            <Typography sx={{ color: '#64748b', mb: 1.5, fontSize: '1.0625rem', lineHeight: 1.6, fontWeight: 500 }}>
              Your payment of <strong style={{ color: '#0f172a', fontWeight: 700 }}>Rs {amount.toLocaleString()}</strong> has been received.
            </Typography>
            <Typography sx={{ color: '#94a3b8', mb: 5, fontSize: '0.9375rem', lineHeight: 1.6 }}>
              Funds are held in escrow and will be released upon project completion.
            </Typography>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '16px',
                p: 4,
                mb: 4,
                textAlign: 'left',
                border: '1px solid #e2e8f0',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 2.5, borderBottom: '1px solid #e2e8f0' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>
                  Payment Method
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
                  {getPaymentMethodDisplay()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 2.5, borderBottom: '1px solid #e2e8f0' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>
                  Amount Paid
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.125rem' }}>
                  Rs {amount.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>
                  Status
                </Typography>
                <Chip
                  label="Paid"
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    height: 28,
                    px: 1.5,
                    borderRadius: '8px',
                  }}
                />
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleDone}
              sx={{
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                color: 'white',
                py: 2.25,
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(13, 180, 188, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0a8b91 0%, #087f85 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(13, 180, 188, 0.35)',
                },
                '&:active': {
                  transform: 'translateY(0px)',
                },
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Go to Dashboard
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PaymentPage;




