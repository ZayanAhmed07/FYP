import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';

/**
 * End-to-End Test Suite for Expert Raah Platform
 * 
 * This comprehensive test suite covers the complete user journey from registration to project completion.
 * It tests the entire workflow for both buyers and consultants, including:
 * 
 * 1. User Registration & Authentication
 * 2. Profile Creation & Management
 * 3. Job Posting & Browsing
 * 4. Proposal Submission & Management
 * 5. Proposal Acceptance & Order Creation
 * 6. Order Management & Completion
 * 7. Payment Release
 * 8. Messaging System
 * 9. Review & Rating System
 */
describe('E2E: Complete Platform Workflow', () => {
  let buyerToken: string;
  let consultantToken: string;
  let buyerId: string;
  let consultantId: string;
  let consultantUserId: string;
  let jobId: string;
  let proposalId: string;
  let orderId: string;
  let conversationId: string;

  // Use unique emails to avoid conflicts with other tests
  const timestamp = Date.now();
  const buyerEmail = `john.buyer.${timestamp}@expertrah.com`;
  const consultantEmail = `sarah.consultant.${timestamp}@expertrah.com`;

  // Setup once before all tests - this is a sequential workflow
  beforeAll(async () => {
    // Clear database before starting the workflow
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  });

  // Override global afterEach to prevent database cleanup between tests
  // This suite requires data to persist across tests as it's a sequential workflow
  afterEach(async () => {
    // Do nothing - allow data to persist for workflow testing
  });

  // ============================================================
  // 1. USER REGISTRATION & AUTHENTICATION
  // ============================================================
  describe('1. User Registration & Authentication', () => {
    it('should register a buyer account', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Buyer',
          email: buyerEmail,
          password: 'SecurePass123',
          accountType: 'buyer',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.accountType).toBe('buyer');
      expect(response.body.data.token).toBeDefined();

      buyerToken = response.body.data.token;
      buyerId = response.body.data.user.id;
    });

    it('should register a consultant account', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Consultant',
          email: consultantEmail,
          password: 'SecurePass123',
          accountType: 'consultant',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.accountType).toBe('consultant');
      expect(response.body.data.token).toBeDefined();

      consultantToken = response.body.data.token;
      consultantUserId = response.body.data.user.id;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: buyerEmail,
          password: 'SecurePass123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.accountType).toBe('buyer');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: buyerEmail,
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should get authenticated user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('John Buyer');
      expect(response.body.data.email).toBe(buyerEmail);
    });
  });

  // ============================================================
  // 2. CONSULTANT PROFILE CREATION
  // ============================================================
  describe('2. Consultant Profile Creation & Management', () => {
    it('should create consultant profile', async () => {
      const response = await request(app)
        .post('/api/consultants')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          userId: consultantUserId,
          title: 'Senior Legal Consultant',
          bio: 'Experienced legal consultant with expertise in corporate law, contract negotiation, and legal compliance. Over 8 years of experience helping businesses navigate complex legal matters.',
          specialization: ['Legal', 'Business'],
          hourlyRate: 8000,
          experience: '8 years',
          skills: ['Contract Law', 'Corporate Law', 'Legal Compliance', 'Negotiation'],
          education: [
            {
              degree: 'LLB',
              institution: 'Lahore University of Management Sciences',
              year: 2015,
            },
          ],
          certifications: ['Bar Association Certified', 'Corporate Law Specialist'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Senior Legal Consultant');
      expect(response.body.data.hourlyRate).toBe(8000);

      consultantId = response.body.data._id;
    });

    it('should get consultant profile', async () => {
      const response = await request(app)
        .get(`/api/consultants/${consultantId}`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Senior Legal Consultant');
      expect(response.body.data.specialization).toContain('Legal');
    });

    it('should update consultant profile', async () => {
      const response = await request(app)
        .put(`/api/consultants/${consultantId}`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          userId: consultantUserId,
          title: 'Senior Legal & Business Consultant',
          bio: 'Updated bio with more experience',
          specialization: ['Legal', 'Business'],
          hourlyRate: 9000,
          experience: '8 years',
          skills: ['Contract Law', 'Corporate Law', 'Legal Compliance', 'Negotiation', 'Business Strategy'],
          education: [
            {
              degree: 'LLB',
              institution: 'Lahore University of Management Sciences',
              year: 2015,
            },
          ],
          certifications: ['Bar Association Certified', 'Corporate Law Specialist'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.hourlyRate).toBe(9000);
      expect(response.body.data.skills).toContain('Business Strategy');
    });
  });

  // ============================================================
  // 3. JOB POSTING & BROWSING
  // ============================================================
  describe('3. Job Posting & Browsing', () => {
    it('should create a job posting', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Legal Consultant for Contract Review',
          category: 'Legal',
          description: 'Need an experienced legal consultant to review and provide recommendations on several business contracts. The project involves analyzing contracts with vendors, clients, and partners to ensure compliance and protect our interests.',
          budget: { min: 80000, max: 120000 },
          timeline: '2 weeks',
          location: 'Lahore, Pakistan',
          skills: ['Contract Law', 'Legal Review', 'Corporate Law'],
          attachments: [],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Legal Consultant for Contract Review');
      expect(response.body.data.category).toBe('Legal');
      expect(response.body.data.status).toBe('open');

      jobId = response.body.data._id;
    });

    it('should get all available jobs (consultant view)', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.jobs).toBeDefined();
      expect(Array.isArray(response.body.data.jobs)).toBe(true);
      expect(response.body.data.jobs.length).toBeGreaterThan(0);

      const postedJob = response.body.data.jobs.find((job: any) => job._id === jobId);
      expect(postedJob).toBeDefined();
      expect(postedJob.title).toBe('Legal Consultant for Contract Review');
    });

    it('should get job details', async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.description).toContain('business contracts');
      expect(response.body.data.budget.min).toBe(80000);
      expect(response.body.data.budget.max).toBe(120000);
    });

    it('should get jobs posted by specific buyer', async () => {
      const response = await request(app)
        .get(`/api/jobs/buyer/${buyerId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update a job posting', async () => {
      const response = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Legal Consultant for Contract Review',
          category: 'Legal',
          subCategory: 'Contract Law',
          description: 'Need an experienced legal consultant to review and provide recommendations on several business contracts. Updated: Now includes international contracts.',
          budget: { min: 90000, max: 130000 },
          timeline: '2 weeks',
          location: 'Lahore, Pakistan',
          skills: ['Contract Law', 'Legal Review', 'Corporate Law', 'International Law'],
          attachments: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.budget.min).toBe(90000);
      expect(response.body.data.skills).toContain('International Law');
    });
  });

  // ============================================================
  // 4. PROPOSAL SUBMISSION & MANAGEMENT
  // ============================================================
  describe('4. Proposal Submission & Management', () => {
    it('should submit a proposal for the job', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 100000,
          deliveryTime: '14 days',
          coverLetter: 'Dear John Buyer,\n\nI am a Senior Legal Consultant with 8 years of experience in contract law and corporate legal matters. I have successfully reviewed over 200 business contracts and helped numerous clients protect their interests.\n\nFor your project, I will:\n- Thoroughly review all contracts\n- Identify potential risks and liabilities\n- Provide detailed recommendations\n- Ensure compliance with local and international laws\n\nI am confident I can deliver exceptional value for your contract review needs within the specified timeline.\n\nBest regards,\nSarah Consultant',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bidAmount).toBe(100000);
      expect(response.body.data.status).toBe('pending');

      proposalId = response.body.data._id;
    });

    it('should get consultant proposals', async () => {
      const response = await request(app)
        .get('/api/proposals/consultant')
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      const submittedProposal = response.body.data.find((p: any) => p._id === proposalId);
      expect(submittedProposal).toBeDefined();
      expect(submittedProposal.status).toBe('pending');
    });

    it('should get proposals for a specific job (buyer view)', async () => {
      const response = await request(app)
        .get(`/api/proposals/job/${jobId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const proposal = response.body.data[0];
      expect(proposal.bidAmount).toBe(100000);
      expect(proposal.coverLetter).toContain('Dear John Buyer');
    });

    it('should get proposal details', async () => {
      const response = await request(app)
        .get(`/api/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.bidAmount).toBe(100000);
      expect(response.body.data.deliveryTime).toBe('14 days');
    });

    it('should prevent duplicate proposals for same job', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 95000,
          deliveryTime: '12 days',
          coverLetter: 'Another proposal',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // 5. PROPOSAL ACCEPTANCE & ORDER CREATION
  // ============================================================
  describe('5. Proposal Acceptance & Order Creation', () => {
    it('should accept a proposal and create an order', async () => {
      const response = await request(app)
        .patch(`/api/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.proposal.status).toBe('accepted');
      expect(response.body.data.order).toBeDefined();

      orderId = response.body.data.order._id;
      expect(response.body.data.order.totalAmount).toBe(100000);
      expect(response.body.data.order.status).toBe('in_progress');
    });

    it('should verify proposal status changed to accepted', async () => {
      const response = await request(app)
        .get(`/api/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('accepted');
    });

    it('should verify job status changed to in_progress', async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('in_progress');
    });
  });

  // ============================================================
  // 6. ORDER MANAGEMENT
  // ============================================================
  describe('6. Order Management & Tracking', () => {
    it('should get order in buyer orders list', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orders).toBeDefined();
      expect(Array.isArray(response.body.data.orders)).toBe(true);

      const order = response.body.data.orders.find((o: any) => o._id === orderId);
      expect(order).toBeDefined();
      expect(order.totalAmount).toBe(100000);
      expect(order.status).toBe('in_progress');
    });

    it('should get order in consultant orders list', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orders).toBeDefined();
      expect(Array.isArray(response.body.data.orders)).toBe(true);

      const order = response.body.data.orders.find((o: any) => o._id === orderId);
      expect(order).toBeDefined();
      expect(order.totalAmount).toBe(100000);
    });

    it('should get order details', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalAmount).toBe(100000);
      expect(response.body.data.amountPaid).toBe(0);
      expect(response.body.data.amountPending).toBe(100000);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should request completion from consultant side', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/request-completion`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          message: 'I have completed the contract review. All contracts have been thoroughly analyzed and recommendations have been provided in the attached documents.',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('pending_completion');
    });

    it('should verify order status changed to pending_completion', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('pending_completion');
    });

    it('should confirm completion from buyer side', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/confirm-completion`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('completed');
    });
  });

  // ============================================================
  // 7. PAYMENT RELEASE
  // ============================================================
  describe('7. Payment Release System', () => {
    it('should release payment after order completion', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/release-payment`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          amount: 100000,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.amountPaid).toBe(100000);
      expect(response.body.data.amountPending).toBe(0);
    });

    it('should verify payment reflected in order', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.amountPaid).toBe(100000);
      expect(response.body.data.amountPending).toBe(0);
    });

    it('should get consultant earnings summary', async () => {
      const response = await request(app)
        .get(`/api/consultants/${consultantId}/earnings`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalEarnings).toBeGreaterThanOrEqual(100000);
    });
  });

  // ============================================================
  // 8. MESSAGING SYSTEM
  // ============================================================
  describe('8. Real-time Messaging System', () => {
    it('should create a conversation between buyer and consultant', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          participants: [buyerId, consultantUserId],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.participants).toContain(buyerId);
      expect(response.body.data.participants).toContain(consultantUserId);

      conversationId = response.body.data._id;
    });

    it('should send a message in the conversation', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          conversationId: conversationId,
          content: 'Hi Sarah, thank you for the excellent work on the contract review!',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toBe('Hi Sarah, thank you for the excellent work on the contract review!');
      expect(response.body.data.sender).toBe(buyerId);
    });

    it('should get conversation messages', async () => {
      const response = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reply to the conversation', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          conversationId: conversationId,
          content: 'Thank you John! It was a pleasure working with you. Feel free to reach out for any future legal needs.',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.sender).toBe(consultantUserId);
    });

    it('should get user conversations list', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      const conversation = response.body.data.find((c: any) => c._id === conversationId);
      expect(conversation).toBeDefined();
    });
  });

  // ============================================================
  // 9. REVIEW & RATING SYSTEM
  // ============================================================
  describe('9. Review & Rating System', () => {
    it('should submit a review for the consultant', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          consultantId: consultantId,
          orderId: orderId,
          rating: 5,
          comment: 'Outstanding work! Sarah provided thorough and professional contract review. Highly recommend her services.',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.comment).toContain('Outstanding work');
    });

    it('should get consultant reviews', async () => {
      const response = await request(app)
        .get(`/api/reviews/consultant/${consultantId}`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update consultant rating', async () => {
      const response = await request(app)
        .get(`/api/consultants/${consultantId}`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.averageRating).toBeGreaterThan(0);
      expect(response.body.data.totalReviews).toBeGreaterThan(0);
    });

    it('should prevent duplicate reviews for same order', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          consultantId: consultantId,
          orderId: orderId,
          rating: 4,
          comment: 'Another review',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // 10. STATISTICS & ANALYTICS
  // ============================================================
  describe('10. Dashboard Statistics', () => {
    it('should get consultant proposal statistics', async () => {
      const response = await request(app)
        .get(`/api/proposals/consultant`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get buyer job statistics', async () => {
      const response = await request(app)
        .get(`/api/jobs/buyer/${buyerId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get consultant earnings stats', async () => {
      const response = await request(app)
        .get(`/api/consultants/${consultantId}/stats`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });
});
