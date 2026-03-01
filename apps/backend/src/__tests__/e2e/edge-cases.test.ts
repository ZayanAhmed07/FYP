import request from 'supertest';
import app from '../../app';

/**
 * E2E Test Suite: Edge Cases & Error Handling
 * 
 * Tests system behavior under unusual conditions:
 * - Concurrent operations
 * - Data limits
 * - Invalid inputs
 * - State conflicts
 */
describe('E2E: Edge Cases & Error Handling', () => {
  let buyerToken: string;
  let consultantToken: string;
  let consultant2Token: string;
  let buyerId: string;
  let consultantId: string;
  let consultant2Id: string;
  let consultantUserId: string;
  let consultant2UserId: string;

  beforeAll(async () => {
    // Register accounts
    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Edge Case Buyer',
        email: 'edgecase.buyer@test.com',
        password: 'Pass123',
        accountType: 'buyer',
      });
    buyerToken = buyerResponse.body.data.token;
    buyerId = buyerResponse.body.data.user.id;

    const consultantResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Edge Case Consultant 1',
        email: 'edgecase.consultant1@test.com',
        password: 'Pass123',
        accountType: 'consultant',
      });
    consultantToken = consultantResponse.body.data.token;
    consultantUserId = consultantResponse.body.data.user.id;

    const consultant2Response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Edge Case Consultant 2',
        email: 'edgecase.consultant2@test.com',
        password: 'Pass123',
        accountType: 'consultant',
      });
    consultant2Token = consultant2Response.body.data.token;
    consultant2UserId = consultant2Response.body.data.user.id;

    // Create consultant profiles
    const profile1Response = await request(app)
      .post('/api/consultants')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        userId: consultantUserId,
        title: 'Consultant 1',
        bio: 'Test',
        specialization: ['Legal'],
        hourlyRate: 5000,
        experience: '5 years',
        skills: ['Law'],
      });
    consultantId = profile1Response.body.data._id;

    const profile2Response = await request(app)
      .post('/api/consultants')
      .set('Authorization', `Bearer ${consultant2Token}`)
      .send({
        userId: consultant2UserId,
        title: 'Consultant 2',
        bio: 'Test',
        specialization: ['Business'],
        hourlyRate: 6000,
        experience: '6 years',
        skills: ['Strategy'],
      });
    consultant2Id = profile2Response.body.data._id;
  });

  // ============================================================
  // DUPLICATE PREVENTION
  // ============================================================
  describe('Duplicate Prevention', () => {
    it('should prevent duplicate email registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'edgecase.buyer@test.com', // Same as existing
          password: 'Pass123',
          accountType: 'buyer',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate consultant profile creation', async () => {
      const response = await request(app)
        .post('/api/consultants')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          userId: consultantUserId,
          title: 'Another Profile',
          bio: 'Should not be created',
          specialization: ['Legal'],
          hourlyRate: 7000,
          experience: '7 years',
          skills: ['Law'],
        });

      expect([400, 500]).toContain(response.status);
    });

    it('should prevent duplicate proposals for same job', async () => {
      // Create a job
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Duplicate Test Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });
      const jobId = jobResponse.body.data._id;

      // Submit first proposal
      await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 50000,
          deliveryTime: '10 days',
          coverLetter: 'First proposal',
        });

      // Try to submit duplicate
      const duplicateResponse = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 55000,
          deliveryTime: '12 days',
          coverLetter: 'Second proposal',
        });

      expect(duplicateResponse.status).toBe(500);
    });
  });

  // ============================================================
  // CONCURRENT OPERATIONS
  // ============================================================
  describe('Concurrent Operations', () => {
    it('should handle multiple proposals for same job from different consultants', async () => {
      // Create a job
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Concurrent Proposals Job',
          category: 'Legal',
          description: 'Test concurrent proposals',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });
      const jobId = jobResponse.body.data._id;

      // Submit proposals from both consultants simultaneously
      const [proposal1, proposal2] = await Promise.all([
        request(app)
          .post('/api/proposals')
          .set('Authorization', `Bearer ${consultantToken}`)
          .send({
            jobId: jobId,
            bidAmount: 50000,
            deliveryTime: '10 days',
            coverLetter: 'Proposal from consultant 1',
          }),
        request(app)
          .post('/api/proposals')
          .set('Authorization', `Bearer ${consultant2Token}`)
          .send({
            jobId: jobId,
            bidAmount: 55000,
            deliveryTime: '12 days',
            coverLetter: 'Proposal from consultant 2',
          }),
      ]);

      expect(proposal1.status).toBe(201);
      expect(proposal2.status).toBe(201);

      // Verify both proposals exist
      const proposalsResponse = await request(app)
        .get(`/api/proposals/job/${jobId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(proposalsResponse.body.data.length).toBe(2);
    });

    it('should prevent accepting multiple proposals for same job', async () => {
      // Create a job
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Multiple Accept Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });
      const jobId = jobResponse.body.data._id;

      // Submit two proposals
      const proposal1Response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 50000,
          deliveryTime: '10 days',
          coverLetter: 'Proposal 1',
        });

      const proposal2Response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultant2Token}`)
        .send({
          jobId: jobId,
          bidAmount: 55000,
          deliveryTime: '12 days',
          coverLetter: 'Proposal 2',
        });

      const proposal1Id = proposal1Response.body.data._id;
      const proposal2Id = proposal2Response.body.data._id;

      // Accept first proposal
      const accept1Response = await request(app)
        .patch(`/api/proposals/${proposal1Id}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(accept1Response.status).toBe(200);

      // Try to accept second proposal (should fail)
      const accept2Response = await request(app)
        .patch(`/api/proposals/${proposal2Id}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([400, 500]).toContain(accept2Response.status);
    });
  });

  // ============================================================
  // STATE CONFLICTS
  // ============================================================
  describe('State Conflicts', () => {
    it('should prevent modifying completed orders', async () => {
      // Create and complete an order
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Completed Order Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });
      const jobId = jobResponse.body.data._id;

      const proposalResponse = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 50000,
          deliveryTime: '10 days',
          coverLetter: 'Test',
        });
      const proposalId = proposalResponse.body.data._id;

      const acceptResponse = await request(app)
        .patch(`/api/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);
      const orderId = acceptResponse.body.data.order._id;

      // Complete the order
      await request(app)
        .patch(`/api/orders/${orderId}/request-completion`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({ message: 'Done' });

      await request(app)
        .patch(`/api/orders/${orderId}/confirm-completion`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Try to request completion again (should fail)
      const response = await request(app)
        .patch(`/api/orders/${orderId}/request-completion`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({ message: 'Trying again' });

      expect([400, 500]).toContain(response.status);
    });

    it('should prevent accepting already accepted proposals', async () => {
      // Create job and proposal
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Double Accept Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });
      const jobId = jobResponse.body.data._id;

      const proposalResponse = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 50000,
          deliveryTime: '10 days',
          coverLetter: 'Test',
        });
      const proposalId = proposalResponse.body.data._id;

      // Accept once
      await request(app)
        .patch(`/api/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Try to accept again
      const response = await request(app)
        .patch(`/api/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([400, 500]).toContain(response.status);
    });

    it('should prevent deleting jobs with accepted proposals', async () => {
      // Create job, proposal, and accept
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Delete Prevention Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });
      const jobId = jobResponse.body.data._id;

      const proposalResponse = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 50000,
          deliveryTime: '10 days',
          coverLetter: 'Test',
        });
      const proposalId = proposalResponse.body.data._id;

      await request(app)
        .patch(`/api/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Try to delete job
      const response = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([400, 403, 500]).toContain(response.status);
    });
  });

  // ============================================================
  // DATA LIMITS & EDGE VALUES
  // ============================================================
  describe('Data Limits & Edge Values', () => {
    it('should handle very long text inputs', async () => {
      const longDescription = 'A'.repeat(10000); // 10K characters

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Long Description Job',
          category: 'Legal',
          description: longDescription,
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      // Should either succeed or fail gracefully
      expect([201, 400, 500]).toContain(response.status);
    });

    it('should handle zero budget values', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Zero Budget Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 0, max: 0 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      // Should reject invalid budget
      expect([400, 500]).toContain(response.status);
    });

    it('should handle inverted budget range', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Inverted Budget Job',
          category: 'Legal',
          description: 'Test',
          budget: { min: 60000, max: 40000 }, // min > max
          timeline: '2 weeks',
          location: 'Lahore',
        });

      // Should reject invalid budget range
      expect([400, 500]).toContain(response.status);
    });

    it('should handle special characters in text fields', async () => {
      const specialChars = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: specialChars,
          category: 'Legal',
          description: 'Test with special chars',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      if (response.status === 201) {
        // Verify data is sanitized
        expect(response.body.data.title).not.toContain('<script>');
      }
    });
  });

  // ============================================================
  // PAGINATION & LARGE DATA SETS
  // ============================================================
  describe('Pagination & Large Data Sets', () => {
    it('should handle pagination for jobs list', async () => {
      // Create multiple jobs
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            title: `Pagination Test Job ${i}`,
            category: 'Legal',
            description: `Test job ${i}`,
            budget: { min: 40000, max: 60000 },
            timeline: '2 weeks',
            location: 'Lahore',
          });
      }

      // Get paginated results
      const response = await request(app)
        .get('/api/jobs?page=1&limit=3')
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.jobs).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should handle empty result sets gracefully', async () => {
      // Register a new consultant with no proposals
      const newConsultantResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Empty Consultant',
          email: 'empty.consultant@test.com',
          password: 'Pass123',
          accountType: 'consultant',
        });
      const newConsultantToken = newConsultantResponse.body.data.token;

      const response = await request(app)
        .get('/api/proposals/consultant')
        .set('Authorization', `Bearer ${newConsultantToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });
});
