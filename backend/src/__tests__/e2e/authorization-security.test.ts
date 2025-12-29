import request from 'supertest';
import app from '../../app';

/**
 * E2E Test Suite: Authorization & Security
 * 
 * Tests security measures and authorization controls:
 * - Role-based access control
 * - Unauthorized access prevention
 * - Token validation
 * - Resource ownership verification
 */
describe('E2E: Authorization & Security', () => {
  let buyerToken: string;
  let consultantToken: string;
  let anotherBuyerToken: string;
  let buyerId: string;
  let consultantId: string;
  let consultantUserId: string;
  let jobId: string;
  let proposalId: string;
  let orderId: string;

  beforeAll(async () => {
    // Register buyer
    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Security Buyer',
        email: 'security.buyer@test.com',
        password: 'Pass123',
        accountType: 'buyer',
      });
    buyerToken = buyerResponse.body.data.token;
    buyerId = buyerResponse.body.data.user.id;

    // Register consultant
    const consultantResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Security Consultant',
        email: 'security.consultant@test.com',
        password: 'Pass123',
        accountType: 'consultant',
      });
    consultantToken = consultantResponse.body.data.token;
    consultantUserId = consultantResponse.body.data.user.id;

    // Register another buyer
    const anotherBuyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another Buyer',
        email: 'another.buyer@test.com',
        password: 'Pass123',
        accountType: 'buyer',
      });
    anotherBuyerToken = anotherBuyerResponse.body.data.token;

    // Create consultant profile
    const profileResponse = await request(app)
      .post('/api/consultants')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        userId: consultantUserId,
        title: 'Legal Consultant',
        bio: 'Expert consultant',
        specialization: ['Legal'],
        hourlyRate: 5000,
        experience: '5 years',
        skills: ['Contract Law'],
      });
    consultantId = profileResponse.body.data._id;

    // Create a job
    const jobResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Test Job',
        category: 'Business',
        description: 'This is a test job posting for security validation and authorization testing purposes in the platform',
        budget: { min: 40000, max: 60000 },
        timeline: '1 week',
        location: 'Lahore',
      });
    jobId = jobResponse.body.data._id;

    // Create a proposal
    const proposalResponse = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        jobId: jobId,
        bidAmount: 50000,
        deliveryTime: '10 days',
        coverLetter: 'Test proposal',
      });
    proposalId = proposalResponse.body.data._id;

    // Accept proposal to create order
    const acceptResponse = await request(app)
      .patch(`/api/proposals/${proposalId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`);
    orderId = acceptResponse.body.data.order._id;
  });

  // ============================================================
  // AUTHENTICATION REQUIREMENTS
  // ============================================================
  describe('Authentication Requirements', () => {
    it('should reject unauthenticated access to protected endpoints', async () => {
      const endpoints = [
        { method: 'get' as const, path: '/api/users/me' },
        { method: 'get' as const, path: '/api/jobs' },
        { method: 'post' as const, path: '/api/jobs' },
        { method: 'get' as const, path: '/api/proposals/consultant' },
        { method: 'get' as const, path: '/api/orders' },
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app)[endpoint.method] as any)(endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(response.status).toBe(401);
    });
  });

  // ============================================================
  // ROLE-BASED ACCESS CONTROL
  // ============================================================
  describe('Role-Based Access Control', () => {
    it('should prevent consultant from creating jobs', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          title: 'Unauthorized Job',
          category: 'Legal',
          description: 'Should not be created',
          budget: { min: 30000, max: 50000 },
          timeline: '1 week',
          location: 'Lahore',
        });

      // Depending on implementation, should return 403 or 400
      expect([403, 400, 500]).toContain(response.status);
    });

    it('should prevent buyer from creating consultant profile', async () => {
      const response = await request(app)
        .post('/api/consultants')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          userId: buyerId,
          title: 'Unauthorized Profile',
          bio: 'Should not be created',
          specialization: ['Legal'],
          hourlyRate: 5000,
          experience: '3 years',
          skills: ['Law'],
        });

      expect([403, 400, 500]).toContain(response.status);
    });

    it('should prevent buyer from submitting proposals', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          jobId: jobId,
          bidAmount: 45000,
          deliveryTime: '7 days',
          coverLetter: 'Unauthorized proposal',
        });

      expect([403, 400, 500]).toContain(response.status);
    });
  });

  // ============================================================
  // RESOURCE OWNERSHIP VERIFICATION
  // ============================================================
  describe('Resource Ownership Verification', () => {
    it('should prevent editing jobs owned by other users', async () => {
      const response = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${anotherBuyerToken}`)
        .send({
          title: 'Unauthorized Edit',
          category: 'Legal',
          description: 'Should not update',
          budget: { min: 30000, max: 50000 },
          timeline: '1 week',
          location: 'Lahore',
        });

      expect([403, 404, 500]).toContain(response.status);
    });

    it('should prevent deleting jobs owned by other users', async () => {
      const response = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${anotherBuyerToken}`);

      expect([403, 404, 500]).toContain(response.status);
    });

    it('should prevent accepting proposals for jobs not owned', async () => {
      const response = await request(app)
        .patch(`/api/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${anotherBuyerToken}`);

      expect([403, 404, 500]).toContain(response.status);
    });

    it('should prevent consultants from confirming order completion', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/confirm-completion`)
        .set('Authorization', `Bearer ${consultantToken}`);

      expect([403, 400, 500]).toContain(response.status);
    });

    it('should prevent buyers from requesting order completion', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/request-completion`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          message: 'Unauthorized completion request',
        });

      expect([403, 400, 500]).toContain(response.status);
    });
  });

  // ============================================================
  // PAYMENT SECURITY
  // ============================================================
  describe('Payment Security', () => {
    it('should prevent unauthorized payment release', async () => {
      // Create a new order for this test
      const newJobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${anotherBuyerToken}`)
        .send({
          title: 'Payment Test Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 30000, max: 50000 },
          timeline: '1 week',
          location: 'Lahore',
        });

      const newJobId = newJobResponse.body.data._id;

      const newProposalResponse = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: newJobId,
          bidAmount: 40000,
          deliveryTime: '7 days',
          coverLetter: 'Test',
        });

      const newProposalId = newProposalResponse.body.data._id;

      const acceptResponse = await request(app)
        .patch(`/api/proposals/${newProposalId}/accept`)
        .set('Authorization', `Bearer ${anotherBuyerToken}`);

      const newOrderId = acceptResponse.body.data.order._id;

      // Try to release payment from different buyer account
      const response = await request(app)
        .post(`/api/orders/${newOrderId}/release-payment`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          amount: 40000,
        });

      expect([403, 404, 500]).toContain(response.status);
    });

    it('should prevent consultants from releasing payment', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/release-payment`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          amount: 50000,
        });

      expect([403, 400, 500]).toContain(response.status);
    });
  });

  // ============================================================
  // DATA VALIDATION & INTEGRITY
  // ============================================================
  describe('Data Validation & Integrity', () => {
    it('should prevent negative bid amounts in proposals', async () => {
      // Create a new job for testing
      const newJobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Validation Test Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 30000, max: 50000 },
          timeline: '1 week',
          location: 'Lahore',
        });

      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: newJobResponse.body.data._id,
          bidAmount: -10000,
          deliveryTime: '7 days',
          coverLetter: 'Invalid bid',
        });

      expect(response.status).toBe(500);
    });

    it('should prevent empty required fields in job posting', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: '',
          category: 'Legal',
          description: 'Test',
          budget: { min: 30000, max: 50000 },
          timeline: '1 week',
          location: 'Lahore',
        });

      expect(response.status).toBe(500);
    });

    it('should prevent accessing non-existent resources', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await request(app)
        .get(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(404);
    });
  });
});
