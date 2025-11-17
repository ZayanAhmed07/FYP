import request from 'supertest';
import app from '../../app';

describe('Unit Testing - Proposal Submission', () => {
  let buyerToken: string;
  let consultantToken: string;
  let jobId: string;
  let consultantId: string;

  beforeEach(async () => {
    // Register buyer
    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Buyer',
        email: 'buyer@test.com',
        password: '123456',
        accountType: 'buyer',
      });
    buyerToken = buyerResponse.body.data.token;

    // Register consultant
    const consultantResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Consultant',
        email: 'consultant@test.com',
        password: '123456',
        accountType: 'consultant',
      });
    consultantToken = consultantResponse.body.data.token;

    // Create consultant profile
    const consultantProfileResponse = await request(app)
      .post('/api/consultants')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        userId: consultantResponse.body.data.user.id,
        title: 'Legal Consultant',
        bio: 'Experienced legal consultant',
        specialization: ['Legal'],
        hourlyRate: 5000,
        experience: '5 years',
        skills: ['Contract Law'],
      });
    consultantId = consultantProfileResponse.body.data._id;

    // Create a job
    const jobResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Legal Consultant Needed',
        category: 'Legal',
        description: 'Need help with contracts',
        budget: { min: 40000, max: 60000 },
        timeline: '2 weeks',
        location: 'Lahore',
      });
    jobId = jobResponse.body.data._id;
  });

  describe('Proposal Validation', () => {
    it('should submit proposal with all valid fields', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 45000,
          deliveryTime: '7 days',
          coverLetter: 'I am experienced in legal consulting and can help you.',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bidAmount).toBe(45000);
    });

    it('should reject proposal with empty bid amount', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          deliveryTime: '7 days',
          coverLetter: 'I am experienced.',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject proposal with negative bid amount', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: -5000,
          deliveryTime: '7 days',
          coverLetter: 'I am experienced.',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject proposal with empty delivery time', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 45000,
          coverLetter: 'I am experienced.',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject proposal with empty cover letter', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 45000,
          deliveryTime: '7 days',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate proposal for same job', async () => {
      // Submit first proposal
      await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 45000,
          deliveryTime: '7 days',
          coverLetter: 'First proposal',
        });

      // Try to submit duplicate
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({
          jobId: jobId,
          bidAmount: 50000,
          deliveryTime: '10 days',
          coverLetter: 'Second proposal',
        });

      expect(response.status).toBe(500); // MongoDB duplicate key error
      expect(response.body.success).toBe(false);
    });
  });
});

