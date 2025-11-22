import request from 'supertest';
import app from '../../app';

describe('Functional Testing - Job Management', () => {
  let buyerToken: string;
  let buyerId: string;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Buyer',
        email: 'buyer@test.com',
        password: '123456',
        accountType: 'buyer',
      });

    buyerToken = response.body.data.token;
    buyerId = response.body.data.user.id;
  });

  it('should create new job posting', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Business Consultant Needed',
        category: 'Business',
        description: 'Need help with business strategy',
        budget: { min: 70000, max: 90000 },
        timeline: '3 weeks',
        location: 'Lahore',
        skills: ['Business Strategy', 'Market Analysis'],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Business Consultant Needed');
    expect(response.body.data.category).toBe('Business');
  });

  it('should view job details from My Jobs', async () => {
    // Create a job
    const createResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Legal Consultant',
        category: 'Legal',
        description: 'Legal advice needed',
        budget: { min: 50000, max: 70000 },
        timeline: '2 weeks',
        location: 'Islamabad',
      });

    const jobId = createResponse.body.data._id;

    // Get job details
    const getResponse = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.title).toBe('Legal Consultant');
    expect(getResponse.body.data.description).toBe('Legal advice needed');
  });

  it('should edit existing job', async () => {
    // Create a job
    const createResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Education Consultant',
        category: 'Education',
        description: 'Need educational guidance',
        budget: { min: 30000, max: 50000 },
        timeline: '1 week',
        location: 'Karachi',
      });

    const jobId = createResponse.body.data._id;

    // Update the job
    const updateResponse = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Education Consultant',
        category: 'Education',
        description: 'Need educational guidance',
        budget: { min: 40000, max: 60000 },
        timeline: '2 weeks',
        location: 'Karachi',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.budget.min).toBe(40000);
    expect(updateResponse.body.data.budget.max).toBe(60000);
  });

  it('should delete job posting', async () => {
    // Create a job
    const createResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Temporary Job',
        category: 'Business',
        description: 'Temporary job',
        budget: { min: 20000, max: 30000 },
        timeline: '1 week',
        location: 'Rawalpindi',
      });

    const jobId = createResponse.body.data._id;

    // Delete the job
    const deleteResponse = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    // Verify job is deleted
    const getResponse = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(getResponse.status).toBe(404);
  });

  it('should view jobs by buyer', async () => {
    // Create multiple jobs
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Job 1',
        category: 'Legal',
        description: 'First job',
        budget: { min: 30000, max: 50000 },
        timeline: '1 week',
        location: 'Lahore',
      });

    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Job 2',
        category: 'Business',
        description: 'Second job',
        budget: { min: 40000, max: 60000 },
        timeline: '2 weeks',
        location: 'Islamabad',
      });

    // Get all jobs by buyer
    const response = await request(app)
      .get(`/api/jobs/buyer/${buyerId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });
});



