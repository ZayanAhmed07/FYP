import { createTheme } from '@mui/material/styles';

// Design tokens / CSS variables
export const designTokens = {
  colors: {
    primary: {
      main: '#0db4bc',
      light: '#47afbf',
      dark: '#0a8e94',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2d5a5f',
      light: '#87a7af',
      dark: '#234548',
      contrastText: '#ffffff',
    },
    accent: {
      main: '#f59e0b',
      light: '#ffb745',
      dark: '#d97706',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
      dark: '#1a1d20',
    },
    text: {
      primary: '#212529',
      secondary: '#5a6c7d',
      disabled: '#a6b5c5',
    },
  },
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      heading: '"Cinzel Decorative", serif',
      body: '"Reddit Sans", system-ui, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    neumorphic: '20px 20px 60px #d1d1d1, -20px -20px 60px #ffffff',
    premium: '0 20px 60px rgba(0, 0, 0, 0.15)',
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    timing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.colors.primary.main,
      light: designTokens.colors.primary.light,
      dark: designTokens.colors.primary.dark,
      contrastText: designTokens.colors.primary.contrastText,
    },
    secondary: {
      main: designTokens.colors.secondary.main,
      light: designTokens.colors.secondary.light,
      dark: designTokens.colors.secondary.dark,
      contrastText: designTokens.colors.secondary.contrastText,
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212529',
      secondary: '#5a6c7d',
      disabled: '#a6b5c5',
    },
    divider: '#e0e6ed',
  },
  typography: {
    fontFamily: designTokens.typography.fontFamily.primary,
    h1: {
      fontFamily: designTokens.typography.fontFamily.heading,
      fontSize: designTokens.typography.fontSize['5xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: designTokens.typography.fontFamily.heading,
      fontSize: designTokens.typography.fontSize['4xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: designTokens.typography.fontFamily.body,
      fontSize: designTokens.typography.fontSize['3xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: designTokens.typography.fontFamily.body,
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: designTokens.typography.fontFamily.body,
      fontSize: designTokens.typography.fontSize.xl,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: designTokens.typography.fontFamily.body,
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: 1.5,
    },
    body1: {
      fontFamily: designTokens.typography.fontFamily.body,
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.regular,
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: designTokens.typography.fontFamily.body,
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.regular,
      lineHeight: 1.5,
    },
    button: {
      fontFamily: designTokens.typography.fontFamily.body,
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.semibold,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: designTokens.borderRadius.md,
  },
  shadows: [
    'none',
    designTokens.shadows.sm,
    designTokens.shadows.md,
    designTokens.shadows.md,
    designTokens.shadows.lg,
    designTokens.shadows.lg,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
    designTokens.shadows.premium,
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          padding: '10px 24px',
          fontSize: designTokens.typography.fontSize.base,
          fontWeight: designTokens.typography.fontWeight.semibold,
          textTransform: 'none',
          transition: `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.smooth}`,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: designTokens.shadows.md,
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: designTokens.shadows.lg,
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.xl,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.smooth}`,
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.lg,
            transition: `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.smooth}`,
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: designTokens.colors.primary.main,
              },
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: designTokens.shadows.xl,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.full,
          fontWeight: designTokens.typography.fontWeight.medium,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.xl,
        },
        elevation1: {
          boxShadow: designTokens.shadows.sm,
        },
        elevation2: {
          boxShadow: designTokens.shadows.md,
        },
        elevation3: {
          boxShadow: designTokens.shadows.lg,
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#47afbf',
      light: '#75c3cf',
      dark: '#0ca1a8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#87a7af',
      light: '#a5bdc3',
      dark: '#2d5a5f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#1a1d20',
      paper: '#212529',
    },
    text: {
      primary: '#f5f7fa',
      secondary: '#a6b5c5',
      disabled: '#5a6c7d',
    },
    divider: '#343a40',
  },
  typography: lightTheme.typography,
  shape: lightTheme.shape,
  shadows: lightTheme.shadows,
  components: {
    ...lightTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(33, 37, 41, 0.9)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.xl,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.smooth}`,
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },
  },
});

export default { lightTheme, darkTheme, designTokens };
