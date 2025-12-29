import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { errors } from 'celebrate';
import rateLimit from 'express-rate-limit';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import './modules/auth/passport'; // Initialize Passport strategies
import { env } from './config/env';

const app = express();

// Cookie parser for HttpOnly cookies
app.use(cookieParser());

// Security: Helmet with strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
}));

// Security: Restrict CORS to specific origins
const allowedOrigins = [
  env.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(null, false); // Changed from throwing error to just blocking
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  }),
);

// Security: Global rate limiting
// Note: Rate limiting disabled for development
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(globalLimiter);

// Stripe webhook route needs raw body for signature verification
// Must be registered BEFORE express.json() middleware
app.use('/api/orders/payment/stripe/webhook', express.raw({ type: 'application/json' }));

// Increase body parser limits to allow image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware for Passport OAuth
app.use(session({
  secret: env.jwtSecret!,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Don't use default 'connect.sid'
  cookie: {
    secure: env.nodeEnv === 'production', // Only HTTPS in production
    httpOnly: true, // Prevent XSS access to cookies
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: undefined, // Let browser determine
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message: string) => process.stdout.write(message),
    },
  }),
);

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', routes);

app.use(errors());
app.use(notFoundHandler);
app.use(errorHandler);

export default app;


