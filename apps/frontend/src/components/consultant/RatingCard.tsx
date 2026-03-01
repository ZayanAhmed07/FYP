import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { FaStar, FaStarHalfAlt, FaRegStar, FaCheckCircle, FaComments } from 'react-icons/fa';

interface RatingCardProps {
  consultantProfile: any;
}

const RatingCard = ({ consultantProfile }: RatingCardProps) => {
  const rating = consultantProfile?.averageRating || consultantProfile?.rating || 0;
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} size={24} color="#f59e0b" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} size={24} color="#f59e0b" />);
      } else {
        stars.push(<FaRegStar key={i} size={24} color="#d1d5db" />);
      }
    }
    return stars;
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -4 }}
      className="glass-card"
      sx={{
        p: 2.5,
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: 'rgba(13, 180, 188, 0.3)',
          boxShadow: '0 12px 40px rgba(13, 180, 188, 0.25)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #0db4bc 0%, #47afbf 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2,
          fontSize: '1rem',
        }}
      >
        Rating & Reviews
      </Typography>

      {/* Rating Display */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          p: 2,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}
      >
        <Box sx={{ textAlign: 'center', minWidth: '60px' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937',
              lineHeight: 1,
              fontSize: '2.5rem',
            }}
          >
            {rating.toFixed(1)}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              mt: 0.5,
            }}
          >
            out of 5
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, justifyContent: 'center' }}>{renderStars(rating)}</Box>
          <LinearProgress
            variant="determinate"
            value={(rating / 5) * 100}
            sx={{
              height: 6,
              borderRadius: 4,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#374151' : '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: 4,
              },
            }}
          />
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
        <Box
          component={motion.div}
          whileHover={{ x: 4 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: '10px',
            background: 'rgba(13, 180, 188, 0.1)',
            border: '1px solid rgba(13, 180, 188, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                color: '#fff',
              }}
            >
              <FaComments size={14} />
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#374151', fontWeight: 500 }}>
              Total Reviews
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937' }}>
            {consultantProfile?.totalReviews || 0}
          </Typography>
        </Box>

        <Box
          component={motion.div}
          whileHover={{ x: 4 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
              }}
            >
              <FaCheckCircle size={14} />
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#374151', fontWeight: 500 }}>
              Completed Projects
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937' }}>
            {consultantProfile?.totalProjects || 0}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RatingCard;
