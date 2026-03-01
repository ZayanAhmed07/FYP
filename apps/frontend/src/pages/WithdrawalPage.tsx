import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { FaArrowLeft } from 'react-icons/fa';
import { httpClient } from '../api/httpClient';

interface WithdrawalMethod {
  _id?: string;
  type: 'easypaisa' | 'jazzcash' | 'stripe';
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  swiftCode?: string;
  email?: string;
  walletAddress?: string;
  isDefault?: boolean;
  addedAt?: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  withdrawalMethod: WithdrawalMethod;
  platformFee?: number;
  actualAmountPaid?: number;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  completedAt?: string;
  transactionId?: string;
}

interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  withdrawalMethods: WithdrawalMethod[];
  canWithdraw: boolean;
}

const WithdrawalPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'balance' | 'withdraw' | 'history' | 'methods'>('balance');
  const [walletData, setWalletData] = useState<WalletBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Withdrawal request dialog
  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    methodId: '',
  });

  // Add method dialog
  const [openMethodDialog, setOpenMethodDialog] = useState(false);
  const [methodForm, setMethodForm] = useState<WithdrawalMethod>({
    type: 'easypaisa',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    swiftCode: '',
    email: '',
    walletAddress: '',
  });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/withdrawals/wallet/balance');
      if (response.data?.success) {
        setWalletData(response.data.data);
      }
      loadWithdrawalHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawalHistory = async () => {
    try {
      const response = await httpClient.get('/withdrawals/history');
      if (response.data?.success) {
        setWithdrawals(response.data.data.withdrawals);
      }
    } catch (err) {
      console.error('Failed to load withdrawal history:', err);
    }
  };

  const handleCreateWithdrawal = async () => {
    try {
      if (!withdrawalForm.amount || !withdrawalForm.methodId) {
        setError('Please fill in all required fields');
        return;
      }

      const amount = parseFloat(withdrawalForm.amount);
      if (amount < 2000) {
        setError('Minimum withdrawal amount is PKR 2,000');
        return;
      }

      if (!walletData || amount > walletData.availableBalance) {
        setError('Insufficient available balance');
        return;
      }

      // Find selected method
      const selectedMethod = walletData.withdrawalMethods.find(m => m._id === withdrawalForm.methodId);
      if (!selectedMethod) {
        setError('Please select a valid withdrawal method');
        return;
      }

      const response = await httpClient.post('/withdrawals/request', {
        amount,
        withdrawalMethod: selectedMethod,
      });

      if (response.data?.success) {
        setSuccess('Withdrawal request submitted successfully!');
        setOpenWithdrawalDialog(false);
        setWithdrawalForm({ amount: '', methodId: '' });
        loadWalletData();
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create withdrawal');
    }
  };

  const handleAddMethod = async () => {
    try {
      if (!methodForm.type) {
        setError('Please select a withdrawal method type');
        return;
      }

      // Validate required fields based on type
      if (methodForm.type === 'easypaisa' || methodForm.type === 'jazzcash') {
        if (!methodForm.accountHolderName || !methodForm.accountNumber) {
          setError('Please add the account holder name and mobile number.');
          return;
        }
      } else if (methodForm.type === 'stripe') {
        if (!methodForm.email) {
          setError('Please enter your Stripe email');
          return;
        }
      }

      const response = await httpClient.post('/withdrawals/methods/save', {
        withdrawalMethod: methodForm,
        setAsDefault: !walletData?.withdrawalMethods.length,
      });

      if (response.data?.success) {
        setSuccess('Withdrawal method added successfully!');
        setOpenMethodDialog(false);
        setMethodForm({
          type: 'easypaisa',
          accountHolderName: '',
          accountNumber: '',
          bankName: '',
          swiftCode: '',
          email: '',
          walletAddress: '',
        });
        loadWalletData();
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add withdrawal method');
    }
  };

  const handleDeleteMethod = async (methodId?: string) => {
    if (!methodId) return;
    
    try {
      const response = await httpClient.delete(`/withdrawals/methods/${methodId}`);
      if (response.data?.success) {
        setSuccess('Withdrawal method deleted successfully!');
        loadWalletData();
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete withdrawal method');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      pending: 'warning',
      approved: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'error',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      easypaisa: 'Easypaisa',
      jazzcash: 'JazzCash',
      stripe: 'Stripe',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1f2937' }}>
              Withdrawal Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
              Manage your earnings and withdraw your funds
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/consultant-dashboard')}
            startIcon={<FaArrowLeft />}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#0db4bc',
              color: '#0db4bc',
              '&:hover': {
                borderColor: '#0a9faa',
                backgroundColor: 'rgba(13, 180, 188, 0.05)',
              },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Balance Cards */}
        {walletData && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Available Balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#0db4bc', my: 1 }}>
                  PKR {walletData.availableBalance.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Ready to withdraw
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff9800', my: 1 }}>
                  PKR {walletData.pendingBalance.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  From ongoing projects
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Earnings
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#4caf50', my: 1 }}>
                  PKR {walletData.totalEarnings.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Lifetime earnings
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Withdrawn
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2196f3', my: 1 }}>
                  PKR {walletData.totalWithdrawn.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Successfully withdrawn
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
          {['balance', 'withdraw', 'history', 'methods'].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              sx={{
                pb: 2,
                borderBottom: activeTab === tab ? '3px solid #0db4bc' : 'none',
                color: activeTab === tab ? '#0db4bc' : '#6b7280',
                textTransform: 'capitalize',
                fontWeight: activeTab === tab ? 600 : 500,
              }}
            >
              {tab}
            </Button>
          ))}
        </Box>

        {/* Tab Content */}
        {activeTab === 'balance' && walletData && (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Balance Overview
              </Typography>
              <Paper sx={{ p: 3, bgcolor: '#f0f4f8', borderLeft: '4px solid #0db4bc' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Available for Withdrawal
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0db4bc' }}>
                      PKR {walletData.availableBalance.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Minimum Withdrawal Amount
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      PKR 2,000
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Processing Timeline:</strong>
                </Typography>
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Request Submitted
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Your request is received and queued for review
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Admin Review
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Our team reviews your request (1 business day)
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Processing
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Your withdrawal is being processed (2-3 business days)
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Completed
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Funds transferred to your account (1-2 business days)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1, borderLeft: '4px solid #ff9800' }}>
                <Typography variant="body2">
                  <strong>Note:</strong> A 2% platform fee will be deducted from your withdrawal amount. Fees help us maintain secure and reliable payment processing.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {activeTab === 'withdraw' && walletData && (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Request Withdrawal
              </Typography>

              {!walletData.canWithdraw && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  You need at least PKR 2,000 in your available balance to make a withdrawal.
                </Alert>
              )}

              <Paper sx={{ p: 3, bgcolor: '#f0f4f8' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Withdrawal Amount (PKR)"
                  placeholder="e.g., 5000"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  sx={{ mb: 3 }}
                  inputProps={{ min: 2000, step: 100 }}
                  helperText={`Available: PKR ${walletData.availableBalance.toLocaleString()} | Minimum: PKR 2,000`}
                />

                {withdrawalForm.amount && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Withdrawal Amount
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          PKR {parseFloat(withdrawalForm.amount || '0').toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Platform Fee (2%)
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          PKR {Math.round((parseFloat(withdrawalForm.amount || '0') * 2) / 100).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          You'll Receive
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0db4bc' }}>
                          PKR {Math.round((parseFloat(withdrawalForm.amount || '0') * 0.98)).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Processing Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          3-5 business days
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Withdrawal Method</InputLabel>
                  <Select
                    value={withdrawalForm.methodId}
                    label="Select Withdrawal Method"
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, methodId: e.target.value })}
                  >
                    {walletData.withdrawalMethods.map((method) => (
                      <MenuItem key={method._id} value={method._id}>
                        {getMethodLabel(method.type)} {method.isDefault ? '(Default)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#0db4bc', '&:hover': { bgcolor: '#0a8b91' } }}
                    onClick={() => setOpenWithdrawalDialog(true)}
                    disabled={!withdrawalForm.amount || !withdrawalForm.methodId}
                  >
                    Request Withdrawal
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveTab('methods')}
                  >
                    Add Withdrawal Method
                  </Button>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card sx={{ borderRadius: 2, overflowX: 'auto' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Withdrawal History
              </Typography>

              {withdrawals.length === 0 ? (
                <Alert severity="info">No withdrawal requests yet</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#f0f4f8' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Requested</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Completed</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>You Received</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal._id} hover>
                          <TableCell>
                            PKR {withdrawal.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getMethodLabel(withdrawal.withdrawalMethod.type)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              color={getStatusColor(withdrawal.status)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {withdrawal.completedAt
                              ? new Date(withdrawal.completedAt).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0db4bc' }}>
                            PKR {(withdrawal.actualAmountPaid || withdrawal.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'methods' && walletData && (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Withdrawal Methods
                </Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#0db4bc', '&:hover': { bgcolor: '#0a8b91' } }}
                  onClick={() => setOpenMethodDialog(true)}
                >
                  Add Method
                </Button>
              </Box>

              {walletData.withdrawalMethods.length === 0 ? (
                <Alert severity="info">
                  No withdrawal methods added. Add one to start withdrawing your earnings.
                </Alert>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {walletData.withdrawalMethods.map((method) => (
                    <Paper key={method._id} sx={{ p: 2, borderLeft: method.isDefault ? '4px solid #0db4bc' : '4px solid #ddd' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {getMethodLabel(method.type)}
                          </Typography>
                          {method.isDefault && (
                            <Chip label="Default" size="small" color="primary" variant="outlined" sx={{ mt: 1 }} />
                          )}
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMethod(method._id)}
                        >
                          Delete
                        </Button>
                      </Box>
                      
                      {(method.type === 'easypaisa' || method.type === 'jazzcash') && (
                        <>
                          <Typography variant="caption" display="block" color="textSecondary">
                            Account Holder: {method.accountHolderName}
                          </Typography>
                          <Typography variant="caption" display="block" color="textSecondary">
                            Mobile/Account: {method.accountNumber}
                          </Typography>
                        </>
                      )}
                      
                      {method.type === 'stripe' && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          Email: {method.email}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={openWithdrawalDialog} onClose={() => setOpenWithdrawalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Withdrawal Request</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Withdrawal Details:
            </Typography>
            <Paper sx={{ p: 2, mt: 1, bgcolor: '#f0f4f8' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Amount: <strong>PKR {parseFloat(withdrawalForm.amount || '0').toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Fee (2%): <strong>PKR {Math.round((parseFloat(withdrawalForm.amount || '0') * 2) / 100).toLocaleString()}</strong>
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ color: '#0db4bc' }}>
                You'll Receive: <strong>PKR {Math.round((parseFloat(withdrawalForm.amount || '0') * 0.98)).toLocaleString()}</strong>
              </Typography>
            </Paper>
            <Alert severity="info" sx={{ mt: 2 }}>
              This withdrawal will be processed within 3-5 business days. You'll receive email updates at each stage.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWithdrawalDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#0db4bc', '&:hover': { bgcolor: '#0a8b91' } }}
            onClick={handleCreateWithdrawal}
          >
            Confirm & Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Method Dialog */}
      <Dialog open={openMethodDialog} onClose={() => setOpenMethodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Add Withdrawal Method</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Withdrawal Method Type</InputLabel>
              <Select
                value={methodForm.type}
                label="Withdrawal Method Type"
                onChange={(e) => setMethodForm({ ...methodForm, type: e.target.value as any })}
              >
                <MenuItem value="easypaisa">Easypaisa</MenuItem>
                <MenuItem value="jazzcash">JazzCash</MenuItem>
                <MenuItem value="stripe">Stripe</MenuItem>
              </Select>
            </FormControl>

            {(methodForm.type === 'easypaisa' || methodForm.type === 'jazzcash') && (
              <>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={methodForm.accountHolderName}
                  onChange={(e) => setMethodForm({ ...methodForm, accountHolderName: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Mobile Number"
                  type="tel"
                  value={methodForm.accountNumber}
                  onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                  sx={{ mb: 2 }}
                  helperText="Enter the mobile number linked to your account"
                />
              </>
            )}

            {methodForm.type === 'stripe' && (
              <TextField
                fullWidth
                type="email"
                label="Stripe Email"
                value={methodForm.email}
                onChange={(e) => setMethodForm({ ...methodForm, email: e.target.value })}
                sx={{ mb: 2 }}
              />
            )}

            <Alert severity="info">
              Your payment details are encrypted and securely stored. We never share your financial information.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMethodDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#0db4bc', '&:hover': { bgcolor: '#0a8b91' } }}
            onClick={handleAddMethod}
          >
            Save Method
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WithdrawalPage;
