import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  AccessTime,
  ArrowBack,
  AttachMoney,
  CheckCircle,
  Close,
  DarkMode,
  FilterList,
  HourglassEmpty,
  Search,
  ShowChart,
  Visibility,
  WbSunny,
  WorkOutline,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { authService } from '../services/authService';
import { proposalService, type Proposal } from '../services/proposalService';
import { httpClient } from '../api/httpClient';
import { useThemeMode } from '../context/ThemeContext';

type ProposalFilter = 'all' | 'pending' | 'accepted' | 'rejected';
type SortBy = 'newest' | 'oldest' | 'bid-amount' | 'status';
type DateFilter = 'all-time' | 'last-30' | 'last-7';

const ITEMS_PER_PAGE = 10;

const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 700;
    const steps = 30;
    const increment = value / steps;
    let currentStep = 0;

    const interval = window.setInterval(() => {
      currentStep += 1;
      if (currentStep >= steps) {
        setDisplayValue(value);
        window.clearInterval(interval);
      } else {
        setDisplayValue(Math.round(increment * currentStep));
      }
    }, duration / steps);

    return () => window.clearInterval(interval);
  }, [value]);

  return (
    <>
      {displayValue}
      {suffix}
    </>
  );
};

const ConsultantProposalsPage = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery('(max-width:899px)');

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProposalFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all-time');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const userId = user.id || (user as any)._id;
    if (userId) {
      fetchConsultantProfile(userId);
    } else {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortBy, categoryFilter, dateFilter]);

  const fetchConsultantProfile = async (userId: string) => {
    try {
      const response = await httpClient.get(`/consultants/user/${userId}`);
      const consultant = response.data?.data;
      if (consultant?._id) {
        await fetchProposals(consultant._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch consultant profile', error);
      setLoading(false);
    }
  };

  const fetchProposals = async (consultantId: string) => {
    try {
      setLoading(true);
      const data = await proposalService.getProposalsByConsultant(consultantId);
      setProposals(data || []);
    } catch (error) {
      console.error('Failed to fetch proposals', error);
      setToast({ open: true, message: 'Failed to load proposals', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = proposals.length;
    const pending = proposals.filter((proposal) => proposal.status === 'pending').length;
    const accepted = proposals.filter((proposal) => proposal.status === 'accepted').length;
    const rejected = proposals.filter((proposal) => proposal.status === 'rejected').length;
    const acceptanceRate = total > 0 ? Number(((accepted / total) * 100).toFixed(1)) : 0;

    const averageBid = total > 0
      ? Math.round(proposals.reduce((sum, proposal) => sum + (proposal.bidAmount || 0), 0) / total)
      : 0;

    const acceptedByCategory = proposals
      .filter((proposal) => proposal.status === 'accepted')
      .reduce<Record<string, number>>((accumulator, proposal) => {
        const categoryName = proposal.jobId?.category || 'General';
        accumulator[categoryName] = (accumulator[categoryName] || 0) + 1;
        return accumulator;
      }, {});

    const mostSuccessfulCategory =
      Object.entries(acceptedByCategory).sort((left, right) => right[1] - left[1])[0]?.[0] || 'N/A';

    const acceptedHours = proposals
      .filter((proposal) => proposal.status === 'accepted')
      .map((proposal) => new Date(proposal.createdAt).getHours());

    const bestHour = acceptedHours.length
      ? Math.round(acceptedHours.reduce((sum, hour) => sum + hour, 0) / acceptedHours.length)
      : null;

    const bestSubmitTime = bestHour === null ? 'N/A' : `${bestHour}:00 - ${bestHour + 1}:00`;

    return {
      total,
      pending,
      accepted,
      rejected,
      acceptanceRate,
      averageBid,
      mostSuccessfulCategory,
      bestSubmitTime,
    };
  }, [proposals]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(proposals.map((proposal) => proposal.jobId?.category || 'General')))],
    [proposals],
  );

  const filteredProposals = useMemo(() => {
    let result = proposals.filter((proposal) => {
      if (filter !== 'all' && proposal.status !== filter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = proposal.jobId?.title?.toLowerCase() || '';
        const category = proposal.jobId?.category?.toLowerCase() || '';
        const letter = proposal.coverLetter?.toLowerCase() || '';
        if (!title.includes(query) && !category.includes(query) && !letter.includes(query)) return false;
      }

      if (categoryFilter !== 'all' && (proposal.jobId?.category || 'General') !== categoryFilter) return false;

      if (dateFilter !== 'all-time') {
        const proposalDate = new Date(proposal.createdAt).getTime();
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        if (dateFilter === 'last-7' && now - proposalDate > sevenDays) return false;
        if (dateFilter === 'last-30' && now - proposalDate > thirtyDays) return false;
      }

      return true;
    });

    result = [...result].sort((left, right) => {
      if (sortBy === 'oldest') return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      if (sortBy === 'bid-amount') return (right.bidAmount || 0) - (left.bidAmount || 0);
      if (sortBy === 'status') return left.status.localeCompare(right.status);
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return result;
  }, [proposals, filter, searchQuery, sortBy, categoryFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / ITEMS_PER_PAGE));
  const paginatedProposals = filteredProposals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filterTabs = [
    { value: 'all' as ProposalFilter, label: 'All', count: stats.total },
    { value: 'pending' as ProposalFilter, label: 'Pending', count: stats.pending },
    { value: 'accepted' as ProposalFilter, label: 'Accepted', count: stats.accepted },
    { value: 'rejected' as ProposalFilter, label: 'Rejected', count: stats.rejected },
  ];

  const statCards = [
    { label: 'Total', value: stats.total, color: '#00BCD4', icon: <WorkOutline sx={{ fontSize: 30 }} />, extra: '' },
    { label: 'Pending', value: stats.pending, color: '#F59E0B', icon: <HourglassEmpty sx={{ fontSize: 30 }} />, extra: '' },
    { label: 'Accepted', value: stats.accepted, color: '#22C55E', icon: <CheckCircle sx={{ fontSize: 30 }} />, extra: '' },
    { label: 'Rejected', value: stats.rejected, color: '#EF4444', icon: <Close sx={{ fontSize: 30 }} />, extra: '' },
    {
      label: 'Acceptance Rate',
      value: stats.acceptanceRate,
      color: '#8B5CF6',
      icon: <ShowChart sx={{ fontSize: 30 }} />,
      extra: '+5% this month',
    },
  ];

  const formatDate = (dateValue: string) =>
    new Date(dateValue).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const statusStyles = (status: string) => {
    if (status === 'accepted') return { bg: 'rgba(34,197,94,0.14)', text: '#22C55E' };
    if (status === 'rejected') return { bg: 'rgba(239,68,68,0.14)', text: '#EF4444' };
    if (status === 'pending') return { bg: 'rgba(245,158,11,0.14)', text: '#F59E0B' };
    return { bg: 'rgba(107,114,128,0.14)', text: '#6B7280' };
  };

  const handleWithdrawClick = () => {
    setToast({ open: true, message: 'Withdraw flow can be connected next.', severity: 'info' });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #071922 0%, #0d2733 45%, #0f202b 100%)'
          : 'linear-gradient(135deg, #F7FAFC 0%, #EEF8FC 50%, #F7FAFC 100%)',
        py: 4,
        transition: 'all 0.3s ease',
      }}
    >
      <Container maxWidth="xl">
        <Box component={motion.div} initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 4, p: { xs: 2, md: 3 }, borderRadius: '18px', background: isDark ? 'linear-gradient(90deg, rgba(0,188,212,0.14), rgba(139,92,246,0.08))' : 'linear-gradient(90deg, rgba(0,188,212,0.10), rgba(125,211,252,0.16))', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,188,212,0.18)'}`, boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.25)' : '0 10px 28px rgba(15,23,42,0.08)' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 2 }}>
            <Button onClick={() => navigate('/consultant-dashboard')} startIcon={<ArrowBack />} sx={{ minHeight: 44, textTransform: 'none', borderRadius: '999px', border: '2px solid #00BCD4', color: '#00BCD4', background: isDark ? 'rgba(0,188,212,0.08)' : '#fff', px: 2.2, fontWeight: 700, '&:hover': { background: 'rgba(0,188,212,0.14)' } }}>Back to Dashboard</Button>
            <Typography sx={{ textAlign: 'center', color: '#00BCD4', fontSize: { xs: '1.8rem', md: '2rem' }, fontWeight: 800, letterSpacing: '-0.02em' }}>My Proposals</Typography>
            <IconButton onClick={toggleTheme} sx={{ width: 44, height: 44, border: '2px solid #00BCD4', color: '#00BCD4', background: isDark ? 'rgba(0,188,212,0.08)' : '#fff', '&:hover': { background: 'rgba(0,188,212,0.14)' } }}>{isDark ? <WbSunny /> : <DarkMode />}</IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 3, mb: 4 }}>
          {statCards.map((card, idx) => (
            <Box key={card.label} component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} whileHover={{ scale: 1.03, y: -4 }} sx={{ minHeight: 140, borderRadius: '16px', borderTop: `4px solid ${card.color}`, background: isDark ? 'linear-gradient(180deg, rgba(18,45,57,0.95), rgba(11,31,41,0.95))' : 'linear-gradient(180deg, #ffffff, #fbfeff)', boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.28)' : '0 10px 24px rgba(15,23,42,0.08)', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Box sx={{ width: 58, height: 58, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `${card.color}22`, color: card.color }}>{card.icon}</Box>
              <Typography sx={{ fontSize: '2.25rem', fontWeight: 800, color: card.color, lineHeight: 1 }}><AnimatedNumber value={card.value} suffix={card.label === 'Acceptance Rate' ? '%' : ''} /></Typography>
              <Typography sx={{ fontSize: '0.875rem', color: isDark ? '#b5c9d1' : '#64748b', fontWeight: 600 }}>{card.label}</Typography>
              {card.extra && <Typography sx={{ fontSize: '0.72rem', color: card.color, fontWeight: 700 }}>{card.extra}</Typography>}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 4, overflowX: { xs: 'auto', md: 'visible' }, pb: { xs: 1, md: 0 } }}>
          {filterTabs.map((tab) => {
            const active = filter === tab.value;
            return (
              <Box key={tab.value} sx={{ position: 'relative' }}>
                {active && <Box component={motion.div} layoutId="filter-indicator" transition={{ type: 'spring', stiffness: 450, damping: 32 }} sx={{ position: 'absolute', inset: 0, borderRadius: '999px', background: '#00BCD4', zIndex: 0 }} />}
                <Button onClick={() => setFilter(tab.value)} component={motion.button} whileTap={{ scale: 0.97 }} sx={{ position: 'relative', zIndex: 1, minHeight: 44, textTransform: 'none', borderRadius: '999px', px: 3, py: 1.2, whiteSpace: 'nowrap', fontWeight: 700, gap: 1, color: active ? '#fff' : isDark ? '#d7e6eb' : '#334155', border: `2px solid ${active ? '#00BCD4' : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(100,116,139,0.30)'}`, background: active ? 'transparent' : isDark ? 'rgba(14,41,52,0.9)' : 'transparent', '&:hover': { background: active ? 'transparent' : 'rgba(0,188,212,0.10)', borderColor: '#00BCD4' } }}>
                  {tab.label}
                  <Box sx={{ minWidth: 24, height: 24, px: 0.8, borderRadius: '999px', display: 'grid', placeItems: 'center', fontSize: '0.78rem', fontWeight: 800, color: active ? '#00BCD4' : '#fff', background: active ? '#fff' : '#00BCD4' }}>{tab.count}</Box>
                </Button>
              </Box>
            );
          })}
        </Box>

        {!loading && proposals.length > 0 && (
          <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
            <TextField value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search proposals..." InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#00BCD4' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { minHeight: 44, borderRadius: '12px', background: isDark ? 'rgba(14,41,52,0.9)' : '#fff' } }} />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select value={sortBy} onChange={(e: SelectChangeEvent<SortBy>) => setSortBy(e.target.value as SortBy)} sx={{ minHeight: 44, borderRadius: '12px', background: isDark ? 'rgba(14,41,52,0.9)' : '#fff' }}>
                <MenuItem value="newest">Sort by: Newest</MenuItem>
                <MenuItem value="oldest">Sort by: Oldest</MenuItem>
                <MenuItem value="bid-amount">Sort by: Bid Amount</MenuItem>
                <MenuItem value="status">Sort by: Status</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {!loading && proposals.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
            <Chip icon={<FilterList />} label="Quick Filters" sx={{ fontWeight: 700 }} />
            {categories.slice(0, 5).map((categoryName) => (
              <Chip key={categoryName} label={categoryName === 'all' ? 'All Categories' : categoryName} onClick={() => setCategoryFilter(categoryName)} color={categoryFilter === categoryName ? 'primary' : 'default'} sx={{ minHeight: 34, borderRadius: '999px', border: categoryFilter === categoryName ? '1px solid #00BCD4' : undefined }} />
            ))}
            <Chip label="Last 30 days" onClick={() => setDateFilter(dateFilter === 'last-30' ? 'all-time' : 'last-30')} color={dateFilter === 'last-30' ? 'primary' : 'default'} sx={{ borderRadius: '999px' }} />
            <Chip label="Last 7 days" onClick={() => setDateFilter(dateFilter === 'last-7' ? 'all-time' : 'last-7')} color={dateFilter === 'last-7' ? 'primary' : 'default'} sx={{ borderRadius: '999px' }} />
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 3 }}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Box key={index} sx={{ borderRadius: '16px', p: 2, background: isDark ? 'rgba(14,41,52,0.9)' : '#fff' }}>
                <Skeleton variant="rounded" height={24} sx={{ mb: 1 }} />
                <Skeleton variant="rounded" height={18} width="60%" sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={36} />
              </Box>
            ))}
          </Box>
        ) : filteredProposals.length === 0 ? (
          <Box sx={{ borderRadius: '20px', py: 10, px: 3, textAlign: 'center', background: isDark ? 'linear-gradient(135deg, rgba(14,41,52,0.95), rgba(8,27,35,0.95))' : 'linear-gradient(135deg, #fff, #f0fbff)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,188,212,0.18)'}`, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(0,188,212,0.08), transparent 60%)', pointerEvents: 'none' }} />
            <Box component={motion.div} animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} sx={{ mb: 2, position: 'relative' }}>
              <Box sx={{ width: 120, height: 120, borderRadius: '50%', mx: 'auto', display: 'grid', placeItems: 'center', background: 'rgba(0,188,212,0.15)' }}><WorkOutline sx={{ fontSize: 60, color: '#00BCD4' }} /></Box>
            </Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: isDark ? '#ecf6f9' : '#0f172a', mb: 1 }}>No proposals yet</Typography>
            <Typography sx={{ fontSize: '1rem', color: isDark ? '#b8cad1' : '#64748b', mb: 3 }}>Start submitting proposals to jobs that match your expertise</Typography>
            <Button onClick={() => navigate('/consultant-dashboard')} startIcon={<Search />} sx={{ minHeight: 48, textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 4, background: '#00BCD4', color: '#fff', '&:hover': { background: '#00a8bf' } }}>Browse Jobs</Button>
            {isMobile && <Box sx={{ position: 'fixed', left: 16, right: 16, bottom: 12, zIndex: 20 }}><Button fullWidth onClick={() => navigate('/consultant-dashboard')} startIcon={<Search />} sx={{ minHeight: 48, borderRadius: '12px', textTransform: 'none', fontWeight: 800, background: '#00BCD4', color: '#fff', boxShadow: '0 10px 24px rgba(0,188,212,0.35)', '&:hover': { background: '#00a8bf' } }}>Browse Jobs</Button></Box>}
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 3 }}>
              <AnimatePresence>
                {paginatedProposals.map((proposal, index) => {
                  const tone = statusStyles(proposal.status);
                  const coverLetterPreview = proposal.coverLetter.length > 100 ? `${proposal.coverLetter.slice(0, 100)}... Read more...` : proposal.coverLetter;
                  return (
                    <Box key={proposal._id} component={motion.div} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }} sx={{ borderRadius: '16px', p: { xs: 2, md: 2.4 }, background: isDark ? 'linear-gradient(180deg, rgba(18,45,57,0.96), rgba(11,31,41,0.96))' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(100,116,139,0.16)'}`, boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.30)' : '0 10px 24px rgba(15,23,42,0.08)', transition: 'all 0.3s ease', '&:hover': { boxShadow: `0 14px 32px ${tone.text}35` } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1.2, mb: 1.4 }}>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a', flex: 1 }}>{proposal.jobId?.title || 'Job Title Unavailable'}</Typography>
                        <Chip icon={proposal.status === 'accepted' ? <CheckCircle /> : proposal.status === 'rejected' ? <Close /> : <HourglassEmpty />} label={proposal.status} sx={{ textTransform: 'capitalize', fontWeight: 700, background: tone.bg, color: tone.text }} />
                      </Box>
                      <Chip label={proposal.jobId?.category || 'General'} sx={{ mb: 1.5, background: 'rgba(0,188,212,0.16)', color: '#00BCD4', fontWeight: 700 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}><Avatar sx={{ width: 34, height: 34, background: 'rgba(0,188,212,0.22)', color: '#00BCD4', fontWeight: 700 }}>{(proposal.jobId?.title || 'J').charAt(0).toUpperCase()}</Avatar><Typography sx={{ fontSize: '0.86rem', color: isDark ? '#b8cad1' : '#64748b', fontWeight: 600 }}>Client Project</Typography></Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 1, mb: 1.5 }}>
                        <Box sx={{ borderRadius: '10px', p: 1.2, background: 'rgba(0,188,212,0.12)' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AttachMoney sx={{ fontSize: 17, color: '#00BCD4' }} /><Typography sx={{ fontSize: '0.72rem', color: isDark ? '#b7cad1' : '#64748b' }}>Bid Amount</Typography></Box><Typography sx={{ mt: 0.4, fontWeight: 800, color: '#00BCD4' }}>Rs {proposal.bidAmount?.toLocaleString()}</Typography></Box>
                        <Box sx={{ borderRadius: '10px', p: 1.2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTime sx={{ fontSize: 17, color: '#8B5CF6' }} /><Typography sx={{ fontSize: '0.72rem', color: isDark ? '#b7cad1' : '#64748b' }}>Delivery</Typography></Box><Typography sx={{ mt: 0.4, fontWeight: 700, color: isDark ? '#ecf6f9' : '#0f172a' }}>{proposal.deliveryTime}</Typography></Box>
                      </Box>
                      <Typography sx={{ fontSize: '0.87rem', lineHeight: 1.5, color: isDark ? '#b7cad1' : '#475569', mb: 1.2 }}>{coverLetterPreview}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: isDark ? '#9fb6bf' : '#64748b', mb: 1.5 }}>Timeline: {formatDate(proposal.createdAt)}</Typography>
                      <Box sx={{ height: 1, background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(100,116,139,0.20)', mb: 1.3 }} />
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button onClick={() => navigate('/consultant-dashboard')} startIcon={<Visibility />} sx={{ minHeight: 44, flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '10px', border: '2px solid #00BCD4', color: '#00BCD4', '&:hover': { background: 'rgba(0,188,212,0.12)' } }}>View Details</Button>
                        {proposal.status === 'pending' && <Button onClick={handleWithdrawClick} sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700, color: '#EF4444', '&:hover': { background: 'rgba(239,68,68,0.10)' } }}>Withdraw</Button>}
                      </Box>
                    </Box>
                  );
                })}
              </AnimatePresence>
            </Box>

            {filteredProposals.length > ITEMS_PER_PAGE && <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}><Pagination count={totalPages} page={currentPage} onChange={(_, value) => setCurrentPage(value)} color="primary" sx={{ '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: '10px', minWidth: 40, minHeight: 40 } }} /></Box>}

            <Box sx={{ mt: 4, borderRadius: '16px', p: 2.5, background: isDark ? 'rgba(14,41,52,0.95)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(100,116,139,0.16)'}`, boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.26)' : '0 10px 24px rgba(15,23,42,0.08)' }}>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#00BCD4', mb: 2 }}>Success Insights</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4,1fr)' }, gap: 2 }}>
                <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Average Bid Amount</Typography><Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a' }}>Rs {stats.averageBid.toLocaleString()}</Typography></Box>
                <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Most Successful Category</Typography><Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a' }}>{stats.mostSuccessfulCategory}</Typography></Box>
                <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Best Time to Submit</Typography><Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a' }}>{stats.bestSubmitTime}</Typography></Box>
                <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Win Rate Trend</Typography><Box sx={{ display: 'flex', alignItems: 'end', gap: 0.4, height: 28, mt: 0.8 }}>{[18, 22, 16, 27, 25, 31, 29].map((heightValue, barIndex) => <Box key={`spark-${barIndex}`} sx={{ width: 6, borderRadius: '3px', height: `${heightValue}px`, background: barIndex > 4 ? '#22C55E' : '#00BCD4' }} />)}</Box></Box>
              </Box>
            </Box>
          </>
        )}
      </Container>

      <Snackbar open={toast.open} autoHideDuration={2500} onClose={() => setToast((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ConsultantProposalsPage;
