import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Badge, Avatar, Menu, MenuItem, Typography, Button } from '@mui/material';
import { FaEnvelope, FaUserCircle, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  activeTab: string;
  onTabChange: (tab: 'dashboard' | 'projects' | 'orders' | 'stats' | 'proposals') => void;
  currentUser: any;
  unreadMessageCount: number;
  onLogout: () => void;
}

const DashboardHeader = ({
  activeTab,
  onTabChange,
  currentUser,
  unreadMessageCount,
  onLogout,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'projects' as const, label: 'Browse Jobs' },
    { id: 'proposals' as const, label: 'My Proposals' },
    { id: 'orders' as const, label: 'My Orders' },
    { id: 'stats' as const, label: 'Statistics' },
  ];

  return (
    <Box
      component={motion.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backdropFilter: 'blur(20px) saturate(180%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '2px solid rgba(13, 180, 188, 0.15)',
        boxShadow: '0 8px 32px rgba(13, 180, 188, 0.15)',
        borderRadius: 0,
      }}
    >
      <Box
        sx={{
          maxWidth: '1400px',
          margin: '0 auto',
          px: { xs: 2, md: 4 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        {/* Logo */}
        <Typography
          variant="h5"
          component={motion.div}
          whileHover={{ scale: 1.05 }}
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0db4bc 0%, #47afbf 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer',
            letterSpacing: '-0.5px',
          }}
          onClick={() => onTabChange('dashboard')}
        >
          EXPERT RAAH
        </Typography>

        {/* Navigation Tabs */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            gap: 1,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              component={motion.button}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              sx={{
                position: 'relative',
                px: 3,
                py: 1,
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                color: activeTab === tab.id ? '#fff' : '#2d5a5f',
                background:
                  activeTab === tab.id
                    ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                    : 'transparent',
                border: activeTab === tab.id ? 'none' : '1px solid rgba(13, 180, 188, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background:
                    activeTab === tab.id
                      ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                      : 'rgba(13, 180, 188, 0.1)',
                  borderColor: 'rgba(13, 180, 188, 0.3)',
                },
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Messages */}
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              navigate('/messages', {
                state: currentUser
                  ? {
                      user: {
                        _id: currentUser.id,
                        name: currentUser.name,
                        profileImage: currentUser.profileImage,
                        accountType: currentUser.accountType,
                      },
                    }
                  : undefined,
              })
            }
            sx={{
              color: '#0db4bc',
              backgroundColor: 'rgba(13, 180, 188, 0.1)',
              border: '1px solid rgba(13, 180, 188, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(13, 180, 188, 0.2)',
                boxShadow: '0 0 20px rgba(13, 180, 188, 0.4)',
              },
            }}
          >
            <Badge
              badgeContent={unreadMessageCount}
              sx={{
                '& .MuiBadge-badge': {
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                },
              }}
            >
              <FaEnvelope size={18} />
            </Badge>
          </IconButton>

          {/* Profile */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.05 }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: '12px',
              cursor: 'pointer',
              background: 'rgba(13, 180, 188, 0.1)',
              border: '1px solid rgba(13, 180, 188, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(13, 180, 188, 0.15)',
                borderColor: 'rgba(13, 180, 188, 0.3)',
                boxShadow: '0 4px 16px rgba(13, 180, 188, 0.2)',
              },
            }}
          >
            <Avatar
              src={currentUser?.profileImage}
              sx={{
                width: 32,
                height: 32,
                border: '2px solid #0db4bc',
                boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)',
              }}
            >
              <FaUserCircle size={20} />
            </Avatar>
            <Typography
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#2d5a5f',
              }}
            >
              {currentUser?.name || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(13, 180, 188, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            navigate('/settings');
            setAnchorEl(null);
          }}
          sx={{
            gap: 2,
            py: 1.5,
            color: '#2d5a5f',
            '&:hover': {
              background: 'rgba(13, 180, 188, 0.1)',
            },
          }}
        >
          <FaCog /> Settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate('/profile');
            setAnchorEl(null);
          }}
          sx={{
            gap: 2,
            py: 1.5,
            color: '#2d5a5f',
            '&:hover': {
              background: 'rgba(13, 180, 188, 0.1)',
            },
          }}
        >
          <FaUser /> Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            onLogout();
            setAnchorEl(null);
          }}
          sx={{
            gap: 2,
            py: 1.5,
            color: '#ef4444',
            '&:hover': {
              background: 'rgba(239, 68, 68, 0.1)',
            },
          }}
        >
          <FaSignOutAlt /> Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardHeader;
