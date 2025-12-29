import request from 'supertest';
import app from '../../app';
import { Job } from '../../models/job.model';
import { User } from '../../modules/user/user.model';
import { createTestUser } from '../utils/auth.helpers';
import {
  assertSuccessResponse,
  assertErrorResponse,
  assertUnauthorized,
  assertValidationError,
  assertHasFields,
  assertValidObjectId,
  assertTimestamps,
  assertRecordExists,
  assertRecordNotExists,
} from '../utils/assertions.helpers';

describe('Unit Testing - Job Posting', () => {
  let buyerToken: string;
  let buyerId: string;
  const testEmails: string[] = [];

  beforeAll(async () => {
    // Create test buyer once for all tests
    const buyer = await createTestUser('buyer');
    buyerToken = buyer.token;
    buyerId = buyer._id;
    testEmails.push(buyer.email);
  });

  afterAll(async () => {
    // Clean up test data
    await Job.deleteMany({ buyerId });
    await User.deleteMany({ email: { $in: testEmails } });
  });

  describe('Job Posting Validation', () => {
    it('should create job with all valid fields and store in database', async () => {
      const jobData = {
        title: 'Legal Consultant Needed',
        category: 'Legal',
        description: 'Need experienced legal consultant to help with contract review and legal compliance matters',
        budget: { min: 40000, max: 60000 },
        timeline: '2 weeks',
        location: 'Lahore',
        skills: ['Contract Law', 'Legal Review'],
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(jobData);

      // Assert response structure
      assertSuccessResponse(response, 201);
      expect(response.body).toHaveProperty('message');
      
      // Assert job data structure
      assertHasFields(response.body.data, [
        '_id',
        'title',
        'category',
        'description',
        'budget',
        'timeline',
        'location',
        'skills',
        'buyerId',
        'status',
      ]);
      
      // Verify field values
      expect(response.body.data.title).toBe(jobData.title);
      expect(response.body.data.category).toBe(jobData.category);
      expect(response.body.data.description).toBe(jobData.description);
      expect(response.body.data.budget).toEqual(jobData.budget);
      expect(response.body.data.timeline).toBe(jobData.timeline);
      expect(response.body.data.location).toBe(jobData.location);
      expect(response.body.data.skills).toEqual(jobData.skills);
      expect(response.body.data.buyerId).toBe(buyerId);
      expect(response.body.data.status).toBe('active');
      
      // Assert valid IDs and timestamps
      assertValidObjectId(response.body.data._id);
      assertTimestamps(response.body.data);
      
      // Verify job was created in database
      const dbJob = await assertRecordExists(Job, { _id: response.body.data._id });
      expect(dbJob.title).toBe(jobData.title);
      expect(dbJob.buyerId.toString()).toBe(buyerId);
    });

    it('should reject job creation with empty title', async () => {
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

      assertErrorResponse(response, 400);
      expect(response.body.message || response.body.error).toMatch(/title/i);
    });

    it('should reject job creation with missing title', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          category: 'Legal',
          description: 'Need help with contract review',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      assertValidationError(response, 'title');
    });

    it('should reject job creation with empty description', async () => {
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

      assertErrorResponse(response, 400);
      expect(response.body.message || response.body.error).toMatch(/description/i);
    });

    it('should reject job creation with empty category', async () => {
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

      assertValidationError(response, 'category');
    });

    it('should reject job creation with empty location', async () => {
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

      assertValidationError(response, 'location');
    });

    it('should reject job creation with invalid budget (min > max)', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Consultant Needed',
          category: 'Legal',
          description: 'Need help',
          budget: { min: 60000, max: 40000 }, // Invalid: min > max
          timeline: '2 weeks',
          location: 'Lahore',
        });

      assertErrorResponse(response, 400);
      expect(response.body.message || response.body.error).toMatch(/budget/i);
    });

    it('should reject job creation without authentication token', async () => {
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

      assertUnauthorized(response);
    });

    it('should reject job creation with invalid authentication token', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', 'Bearer invalid-token-12345')
        .send({
          title: 'Legal Consultant',
          category: 'Legal',
          description: 'Need help',
          budget: { min: 40000, max: 60000 },
          timeline: '2 weeks',
          location: 'Lahore',
        });

      assertUnauthorized(response);
    });
  });

  describe('Job Retrieval', () => {
    let testJobId: string;

    beforeAll(async () => {
      // Create a test job
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Test Job for Retrieval',
          category: 'Technology',
          description: 'Test job description',
          budget: { min: 1000, max: 5000 },
          timeline: '1 month',
          location: 'Remote',
          skills: ['Testing'],
        });
      
      testJobId = response.body.data._id;
    });

    it('should retrieve job by ID with all fields', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJobId}`);

      assertSuccessResponse(response, 200);
      assertHasFields(response.body.data, [
        '_id',
        'title',
        'category',
        'description',
        'budget',
        'timeline',
        'location',
        'buyerId',
      ]);
      
      expect(response.body.data._id).toBe(testJobId);
      expect(response.body.data.title).toBe('Test Job for Retrieval');
    });

    it('should return 404 for non-existent job ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/jobs/${fakeId}`);

      assertErrorResponse(response, 404, /job|not found/i);
    });

    it('should return 400 for invalid job ID format', async () => {
      const response = await request(app)
        .get('/api/jobs/invalid-id-format');

      assertErrorResponse(response, 400);
    });
  });

  describe('Job Listing', () => {
    it('should retrieve all jobs with pagination', async () => {
      const response = await request(app)
        .get('/api/jobs');

      assertSuccessResponse(response, 200);
      expect(response.body.data).toHaveProperty('docs');
      expect(response.body.data).toHaveProperty('totalDocs');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(Array.isArray(response.body.data.docs)).toBe(true);
    });

    it('should filter jobs by category', async () => {
      const response = await request(app)
        .get('/api/jobs?category=Technology');

      assertSuccessResponse(response, 200);
      expect(Array.isArray(response.body.data.docs)).toBe(true);
      
      // All returned jobs should be in Technology category
      response.body.data.docs.forEach((job: any) => {
        expect(job.category).toBe('Technology');
      });
    });
  });
});
