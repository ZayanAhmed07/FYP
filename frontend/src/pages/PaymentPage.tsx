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
      case 'card': return 'Debit/Credit Card';
      default: return '';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          mb: 3,
          mx: 3,
          px: 3,
          py: 2,
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/src/assets/logo.png"
            alt="Expert Raah"
            sx={{ width: 40, height: 40, borderRadius: '8px' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            EXPERT RAAH
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={() => navigate('/buyer-dashboard')}
            sx={{ color: '#6b7280', '&:hover': { color: '#667eea' } }}
          >
            Dashboard
          </Button>
          <Button sx={{ color: '#6b7280', '&:hover': { color: '#667eea' } }}>Projects</Button>
          <Button
            sx={{
              color: '#667eea',
              fontWeight: 700,
              borderBottom: '2px solid #667eea',
              borderRadius: 0,
            }}
          >
            Payment
          </Button>
          <Button sx={{ color: '#6b7280', '&:hover': { color: '#667eea' } }}>Orders</Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton sx={{ color: '#667eea' }}>🔔</IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={currentUser?.profileImage || "https://i.pravatar.cc/150?img=10"}
              alt="User"
              sx={{ width: 36, height: 36 }}
            />
            <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {currentUser?.name || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 3 }}>
        {step === 'details' && (
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Payment Details
              </Typography>
              <Chip
                label={`$${amount}`}
                sx={{
                  background: 'white',
                  color: '#667eea',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  height: 40,
                  px: 2,
                }}
              />
            </Box>

            {error && (
              <Box
                sx={{
                  mx: 3,
                  mt: 3,
                  p: 2,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#dc2626',
                }}
              >
                {error}
              </Box>
            )}

            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
                Choose Payment Method:
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Box
                  onClick={() => setPaymentMethod('easypaisa')}
                  sx={{
                    flex: 1,
                    p: 3,
                    border: paymentMethod === 'easypaisa' ? '2px solid #667eea' : '2px solid rgba(0,0,0,0.08)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: paymentMethod === 'easypaisa' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)' : 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#667eea',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                  }}
                >
                  <FaMobileAlt style={{ fontSize: '28px', color: '#667eea', marginBottom: '8px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>EasyPaisa</Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Pay with your EasyPaisa account</Typography>
                </Box>

                <Box
                  onClick={() => setPaymentMethod('jazzcash')}
                  sx={{
                    flex: 1,
                    p: 3,
                    border: paymentMethod === 'jazzcash' ? '2px solid #667eea' : '2px solid rgba(0,0,0,0.08)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: paymentMethod === 'jazzcash' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)' : 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#667eea',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                  }}
                >
                  <FaMobileAlt style={{ fontSize: '28px', color: '#667eea', marginBottom: '8px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>JazzCash</Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Pay with your JazzCash account</Typography>
                </Box>

                <Box
                  onClick={() => setPaymentMethod('card')}
                  sx={{
                    flex: 1,
                    p: 3,
                    border: paymentMethod === 'card' ? '2px solid #667eea' : '2px solid rgba(0,0,0,0.08)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: paymentMethod === 'card' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)' : 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#667eea',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                  }}
                >
                  <FaCreditCard style={{ fontSize: '28px', color: '#667eea', marginBottom: '8px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>Debit/Credit Card</Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>Visa, Mastercard, UnionPay</Typography>
                </Box>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
                Enter Details
              </Typography>

              {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                <TextField
                  fullWidth
                  label="Mobile Number"
                  placeholder="03XX-XXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => handleMobileNumberChange(e.target.value)}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea' },
                    },
                  }}
                />
              )}

              {paymentMethod === 'card' && (
                <>
                  <TextField
                    fullWidth
                    label="Card Number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Card Holder Name"
                    placeholder="John Doe"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' },
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                      label="Expiry Date"
                      placeholder="MM/YYYY"
                      value={expiryDate}
                      onChange={(e) => handleExpiryDateChange(e.target.value)}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' },
                        },
                      }}
                    />
                    <TextField
                      label="CVV"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 4) setCvv(val);
                      }}
                      inputProps={{ maxLength: 4 }}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' },
                        },
                      }}
                    />
                  </Box>
                </>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleContinue}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                  },
                  transition: 'all 0.2s ease',
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
            }}
          >
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                p: 4,
                maxWidth: 500,
                width: '90%',
                outline: 'none',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a', textAlign: 'center' }}>
                Enter OTP
              </Typography>
              <Typography sx={{ color: '#6b7280', mb: 3, textAlign: 'center' }}>
                A 6-digit OTP has been sent to your {paymentMethod === 'card' ? 'registered mobile number' : `${getPaymentMethodDisplay()} account`}.
              </Typography>

              {developmentOtp && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '12px',
                    color: '#92400e',
                    textAlign: 'center',
                  }}
                >
                  <strong>Development OTP:</strong> {developmentOtp}
                </Box>
              )}

              {error && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    color: '#dc2626',
                  }}
                >
                  {error}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 3 }}>
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 } }}
                    disabled={loading}
                    sx={{
                      width: 56,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                  },
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Pay'}
              </Button>
            </Box>
          </Modal>
        )}

        {step === 'success' && (
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              p: 5,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                animation: 'scaleIn 0.5s ease-out',
                '@keyframes scaleIn': {
                  '0%': { transform: 'scale(0)', opacity: 0 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              <svg viewBox="0 0 52 52" style={{ width: '50px', height: '50px' }}>
                <circle
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </Box>
            
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
              Payment Successful!
            </Typography>
            <Typography sx={{ color: '#6b7280', mb: 1, fontSize: '1.1rem' }}>
              Your payment of <strong style={{ color: '#1a1a1a' }}>Rs {amount.toLocaleString()}</strong> has been received and is being held in escrow.
            </Typography>
            <Typography sx={{ color: '#9ca3af', mb: 4, fontSize: '0.95rem' }}>
              The amount will be released to the consultant upon successful completion of the project.
            </Typography>

            <Box
              sx={{
                background: '#f9fafb',
                borderRadius: '16px',
                p: 3,
                mb: 4,
                textAlign: 'left',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ color: '#6b7280' }}>Payment Method:</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>{getPaymentMethodDisplay()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ color: '#6b7280' }}>Amount:</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>Rs {amount.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#6b7280' }}>Status:</Typography>
                <Chip
                  label="Paid"
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    fontWeight: 700,
                  }}
                />
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleDone}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                py: 1.8,
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                },
                transition: 'all 0.2s ease',
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




