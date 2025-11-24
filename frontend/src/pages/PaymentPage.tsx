import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCreditCard, FaMobileAlt } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './PaymentPage.module.css';

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
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/src/assets/logo.png" alt="Expert Raah" className={styles.logoImage} />
        </div>

        <nav className={styles.nav}>
          <button className={styles.navItem} onClick={() => navigate('/buyer-dashboard')}>Dashboard</button>
          <button className={styles.navItem}>Projects</button>
          <button className={styles.navItemActive}>Payment</button>
          <button className={styles.navItem}>Orders</button>
        </nav>

        <div className={styles.headerActions}>
          <button className={styles.notificationButton}>🔔</button>
          <div className={styles.userProfile}>
            <img 
              src={currentUser?.profileImage || "https://i.pravatar.cc/150?img=10"} 
              alt="User" 
              className={styles.userAvatar} 
            />
            <span className={styles.userName}>{currentUser?.name || 'User'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {step === 'details' && (
          <div className={styles.paymentCard}>
            <div className={styles.paymentHeader}>
              <h2 className={styles.paymentTitle}>Payment Details</h2>
              <div className={styles.amount}>${amount}</div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.paymentBody}>
              <h3 className={styles.sectionTitle}>Choose Payment Method:</h3>
              
              <div className={styles.paymentMethods}>
                <button
                  className={`${styles.methodButton} ${paymentMethod === 'easypaisa' ? styles.methodButtonActive : ''}`}
                  onClick={() => setPaymentMethod('easypaisa')}
                >
                  <FaMobileAlt className={styles.methodIcon} />
                  <div className={styles.methodLabel}>EasyPaisa</div>
                  <div className={styles.methodSubtext}>Pay with your EasyPaisa account</div>
                </button>

                <button
                  className={`${styles.methodButton} ${paymentMethod === 'jazzcash' ? styles.methodButtonActive : ''}`}
                  onClick={() => setPaymentMethod('jazzcash')}
                >
                  <FaMobileAlt className={styles.methodIcon} />
                  <div className={styles.methodLabel}>JazzCash</div>
                  <div className={styles.methodSubtext}>Pay with your JazzCash account</div>
                </button>

                <button
                  className={`${styles.methodButton} ${paymentMethod === 'card' ? styles.methodButtonActive : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <FaCreditCard className={styles.methodIcon} />
                  <div className={styles.methodLabel}>Debit/Credit Card</div>
                  <div className={styles.methodSubtext}>Visa, Mastercard, UnionPay</div>
                </button>
              </div>

              <h3 className={styles.sectionTitle}>Enter Details</h3>

              {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Mobile Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="03XX-XXXXXXX"
                    value={mobileNumber}
                    onChange={(e) => handleMobileNumberChange(e.target.value)}
                  />
                </div>
              )}

              {paymentMethod === 'card' && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Card Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Card Holder Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Enter name as on card"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.inputLabel}>Expiry Date</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => handleExpiryDateChange(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.inputLabel}>CVV</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 4) setCvv(val);
                        }}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                className={styles.continueButton} 
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <>
            <div className={styles.overlay} onClick={() => !loading && setStep('details')}></div>
            <div className={styles.otpModal}>
              <h2 className={styles.otpTitle}>Enter OTP</h2>
              <p className={styles.otpSubtext}>
                A 6-digit OTP has been sent to your {paymentMethod === 'card' ? 'registered mobile number' : `${getPaymentMethodDisplay()} account`}.
              </p>

              {developmentOtp && (
                <div className={styles.devOtpInfo}>
                  <strong>Development OTP:</strong> {developmentOtp}
                </div>
              )}

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.otpInputs}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    className={styles.otpInput}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    maxLength={1}
                    disabled={loading}
                  />
                ))}
              </div>

              <button 
                className={styles.verifyButton} 
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Pay'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className={styles.successCard}>
            <div className={styles.successContent}>
              <div className={styles.checkmark}>
                <svg className={styles.checkmarkIcon} viewBox="0 0 52 52">
                  <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              
              <h2 className={styles.successTitle}>Payment Successful!</h2>
              <p className={styles.successMessage}>
                Your payment of <strong>Rs {amount.toLocaleString()}</strong> has been received and is being held in escrow.
              </p>
              <p className={styles.successSubmessage}>
                The amount will be released to the consultant upon successful completion of the project.
              </p>

              <div className={styles.paymentSummary}>
                <div className={styles.summaryRow}>
                  <span>Payment Method:</span>
                  <span>{getPaymentMethodDisplay()}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Amount:</span>
                  <span>Rs {amount.toLocaleString()}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Status:</span>
                  <span className={styles.statusPaid}>Paid</span>
                </div>
              </div>

              <button className={styles.doneButton} onClick={handleDone}>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;



