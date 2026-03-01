# Expert Raah - Professional Consultancy Marketplace Platform

A full-stack web application connecting clients with professional consultants across diverse domains including Education, Legal, Business, and more.

## 📋 Project Structure

```
Expert Raah/
├── apps/                           # Application source code
│   ├── backend/                    # Node.js/Express backend
│   │   ├── src/
│   │   │   ├── config/            # Configuration files
│   │   │   ├── controllers/       # Request handlers
│   │   │   ├── middleware/        # Express middleware
│   │   │   ├── models/            # MongoDB schemas
│   │   │   ├── modules/           # Feature modules
│   │   │   ├── routes/            # API routes
│   │   │   ├── services/          # Business logic
│   │   │   ├── socket/            # WebSocket handlers
│   │   │   ├── types/             # TypeScript types
│   │   │   ├── utils/             # Utilities
│   │   │   ├── __tests__/         # Test files
│   │   │   ├── scripts/           # Utility scripts
│   │   │   └── app.ts             # Express app setup
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   └── Dockerfile
│   │
│   └── frontend/                   # React TypeScript frontend
│       ├── src/
│       │   ├── api/               # API client setup
│       │   ├── components/        # React components
│       │   ├── pages/             # Page components
│       │   ├── hooks/             # Custom React hooks
│       │   ├── context/           # React context
│       │   ├── services/          # Frontend services
│       │   ├── styles/            # Global styles
│       │   ├── theme/             # Theme configuration
│       │   ├── types/             # TypeScript types
│       │   ├── utils/             # Utilities
│       │   └── main.tsx           # Entry point
│       ├── public/                # Static assets
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── Dockerfile
│
├── docs/                           # Project documentation
│   ├── assets/                    # Images and diagrams
│   │   ├── hero.jpg
│   │   ├── business.jpg
│   │   ├── education.jpg
│   │   ├── legal.jpg
│   │   └── Landing Page.png
│   ├── TESTING_AND_EVALUATION.txt
│   ├── DATA_DESIGN_DOCUMENT.txt
│   ├── EXTERNAL_APIS_AND_SDKS.txt
│   ├── CHAPTER_7_IMPLEMENTATION.txt
│   ├── TEST_*.md
│   ├── CLASS_DIAGRAM_ALIGNMENT.md
│   └── test-*.txt
│
├── .github/                        # GitHub configuration
│   └── workflows/                 # CI/CD pipelines
│
├── docker-compose.yml             # Docker orchestration
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## 🚀 Features

- **Multi-Role Authentication:** Register as Client/Buyer, Consultant, or Admin
- **Professional Profiles:** Consultants showcase expertise, skills, and rates
- **Job Posting:** Clients post detailed project requirements
- **Smart Bidding:** Consultants submit proposals with pricing and timelines
- **Real-Time Messaging:** Integrated chat system for seamless communication
- **Order Management:** Track project progress with milestones and payments
- **AI-Powered Matching:** Semantic search using AI embeddings (Gemini, Groq, HuggingFace)
- **Secure Payments:** Stripe integration for secure payment processing
- **Verification System:** Document-based consultant verification
- **Analytics Dashboard:** Comprehensive platform and user analytics
- **AI Chatbot:** Intelligent assistant (Rachel) for user guidance

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB 7.x
- **Authentication:** JWT
- **Real-Time:** Socket.io
- **Testing:** Jest 30.2.0, Supertest 7.1.4
- **AI Services:** Google Generative AI, Groq, HuggingFace
- **Payment:** Stripe
- **Logging:** Winston

### Frontend
- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** TanStack Query
- **UI Components:** Material-UI (MUI) v5
- **Styling:** Tailwind CSS, CSS Modules
- **Animations:** Framer Motion
- **HTTP Client:** Axios

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Version Control:** Git/GitHub
- **CI/CD:** GitHub Actions (configured)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB 7.x
- Docker & Docker Compose (optional)

### Backend Setup

```bash
cd apps/backend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd apps/frontend
npm install
npm run dev
```

## 🔧 Available Scripts

### Backend
```bash
npm run dev              # Start development server
npm run build            # Build TypeScript
npm run test             # Run all tests
npm run test:unit        # Run unit tests only
npm run test:functional  # Run functional tests
npm run test:integration # Run integration tests
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run seed:consultants # Seed test consultants
npm run remove:consultants # Remove seeded consultants
```

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

## 🐳 Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 📊 Environment Variables

Create `.env` files in both backend and frontend directories. See `.env.example` files for reference.

### Key Backend Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API secret
- `GOOGLE_GENERATIVE_AI_KEY` - Google AI API key
- `GROQ_API_KEY` - Groq API key
- `HUGGINGFACE_API_KEY` - HuggingFace API key

## 🧪 Testing

### Run All Tests
```bash
cd apps/backend
npm test
```

### Coverage Report
```bash
npm test -- --coverage
```

Current Coverage: ~27% (Target: 40-50%)

## 📚 Documentation

- **Testing & Evaluation:** `docs/TESTING_AND_EVALUATION.txt`
- **Data Design:** `docs/DATA_DESIGN_DOCUMENT.txt`
- **External APIs:** `docs/EXTERNAL_APIS_AND_SDKS.txt`
- **Implementation Details:** `docs/CHAPTER_7_IMPLEMENTATION.txt`
- **Architecture & Diagrams:** `docs/CLASS_DIAGRAM_ALIGNMENT.md`

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Two-factor authentication support
- Secure payment processing with Stripe
- Document verification system
- Rate limiting on API endpoints

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Consultants
- `GET /api/consultants` - Get all consultants
- `GET /api/consultants/:id` - Get consultant by ID
- `POST /api/consultants` - Create consultant profile
- `PUT /api/consultants/:id` - Update profile

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status
- `POST /api/orders/:id/payment` - Process payment

### Messaging
- `GET /api/conversations` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/messages/:conversationId` - Get messages

### Proposals
- `GET /api/proposals` - Get proposals
- `POST /api/proposals` - Submit proposal
- `PUT /api/proposals/:id/accept` - Accept proposal

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Platform analytics
- `POST /api/admin/verify-consultant` - Verify consultant

## 🎯 Project Status

- ✅ Frontend: Complete
- ✅ Backend: Complete
- ✅ Database: Configured
- ✅ Authentication: Implemented
- ✅ Payment Integration: Stripe integrated
- ✅ Real-time Messaging: WebSocket implemented
- ✅ AI Services: Multiple embedding services
- ⏳ Testing Coverage: 27% (Target: 40-50%)
- ⏳ Deployment: Ready for staging

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/YourFeature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/YourFeature`
4. Submit a Pull Request

## 📝 License

This project is licensed under the ISC License - see LICENSE file for details.

## 📧 Support

For support, email [support@expertraah.com](mailto:support@expertraah.com) or open an issue in the repository.

---

**Last Updated:** February 9, 2026
**Current Version:** 1.0.0
**Status:** Production Ready
