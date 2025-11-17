import request from 'supertest';
import app from '../../app';

describe('Functional Testing - Proposal Management', () => {
  let buyerToken: string;
  let consultantToken: string;
  let jobId: string;
  let buyerId: string;

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
    buyerId = buyerResponse.body.data.user.id;

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
    await request(app)
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

  it('should view available jobs in Projects tab', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    // Jobs API returns paginated data: { jobs, pagination }
    expect(response.body.data.jobs).toBeDefined();
    expect(Array.isArray(response.body.data.jobs)).toBe(true);
    expect(response.body.data.jobs.length).toBeGreaterThan(0);
  });

  it('should view job details', async () => {
    const response = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Legal Consultant Needed');
    expect(response.body.data.description).toBe('Need help with contracts');
  });

  it('should submit proposal for a job', async () => {
    const response = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        jobId: jobId,
        bidAmount: 50000,
        deliveryTime: '10 days',
        coverLetter: 'I have 5 years of experience in contract law and can help you with your legal needs.',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.bidAmount).toBe(50000);
    expect(response.body.data.status).toBe('pending');
  });

  it('should view submitted proposals', async () => {
    // Submit a proposal
    const proposalResponse = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        jobId: jobId,
        bidAmount: 50000,
        deliveryTime: '10 days',
        coverLetter: 'I can help you.',
      });

    const proposalId = proposalResponse.body.data._id;

    // Get proposal details
    const getResponse = await request(app)
      .get(`/api/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.bidAmount).toBe(50000);
    expect(getResponse.body.data.status).toBe('pending');
  });

  it('should filter jobs by category', async () => {
    // Create another job with different category
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Business Consultant',
        category: 'Business',
        description: 'Business help needed',
        budget: { min: 50000, max: 70000 },
        timeline: '3 weeks',
        location: 'Islamabad',
      });

    // Get all jobs
    const allJobsResponse = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(allJobsResponse.status).toBe(200);
    expect(allJobsResponse.body.data.jobs).toBeDefined();
    expect(Array.isArray(allJobsResponse.body.data.jobs)).toBe(true);
    expect(allJobsResponse.body.data.jobs.length).toBeGreaterThanOrEqual(2);

    // Filter by Legal category
    const legalJobs = allJobsResponse.body.data.jobs.filter((job: any) => job.category === 'Legal');
    expect(legalJobs.length).toBeGreaterThanOrEqual(1);
  });
});

