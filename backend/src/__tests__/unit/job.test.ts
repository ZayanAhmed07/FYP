import request from 'supertest';
import app from '../../app';

describe('Unit Testing - Job Posting', () => {
  let buyerToken: string;
  let buyerId: string;

  beforeEach(async () => {
    // Register and login as buyer
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Buyer',
        email: 'buyer@test.com',
        password: '123456',
        accountType: 'buyer',
      });

    buyerToken = registerResponse.body.data.token;
    buyerId = registerResponse.body.data.user.id;
  });

  describe('Job Posting Validation', () => {
    it('should create job with all valid fields', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Legal Consultant Needed',
          category: 'Legal',
          description: 'Need help with contract review',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
          skills: ['Contract Law', 'Legal Review'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Legal Consultant Needed');
    });

    it('should reject job with empty title', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: '',
          category: 'Legal',
          description: 'Need help with contract review',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject job with empty description', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Legal Consultant',
          category: 'Legal',
          description: '',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject job with empty category', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Consultant Needed',
          description: 'Need help',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject job with empty location', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Consultant Needed',
          category: 'Legal',
          description: 'Need help',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
        });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Legal Consultant',
          category: 'Legal',
          description: 'Need help',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      expect(response.status).toBe(401);
    });
  });
});

