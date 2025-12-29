import request from 'supertest';
import app from '../../app';

describe('Integration Testing - Job Posting to Proposal Submission Flow', () => {
  let buyerToken: string;
  let consultantToken: string;
  let buyerId: string;
  let consultantUserId: string;

  beforeEach(async () => {
    // Register buyer
    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Buyer',
        email: 'buyer@integration.com',
        password: '123456',
        accountType: 'buyer',
      });
    buyerToken = buyerResponse.body.data.token;
    buyerId = buyerResponse.body.data.user.id;

    // Register consultant
    const consultantResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Consultant',
        email: 'consultant@integration.com',
        password: '123456',
        accountType: 'consultant',
      });
    consultantToken = consultantResponse.body.data.token;
    consultantUserId = consultantResponse.body.data.user.id;

    // Create consultant profile
    await request(app)
      .post('/api/consultants')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        userId: consultantUserId,
        title: 'Legal Expert',
        bio: 'Expert in legal matters',
        specialization: ['Legal'],
        hourlyRate: 6000,
        experience: '7 years',
        skills: ['Contract Law', 'Corporate Law'],
      });
  });

  it('should complete full job posting to proposal submission flow', async () => {
    // Step 1: Buyer posts a job
    const jobResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Legal Consultant for Contract Review',
        category: 'Legal',
        description: 'Need expert legal consultant to review business contracts and provide comprehensive legal advice',
        budget: { min: 70000, max: 90000 },
        timeline: '2 weeks',
        location: 'Islamabad',
        skills: ['Contract Law', 'Legal Review'],
      });

    expect(jobResponse.status).toBe(201);
    const jobId = jobResponse.body.data._id;

    // Step 2: Job appears in consultant's Projects tab
    const jobsListResponse = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(jobsListResponse.status).toBe(200);
    expect(jobsListResponse.body.data.jobs).toBeDefined();
    const postedJob = jobsListResponse.body.data.jobs.find((job: any) => job._id === jobId);
    expect(postedJob).toBeDefined();
    expect(postedJob.title).toBe('Legal Consultant for Contract Review');

    // Step 3: Consultant views job details
    const jobDetailsResponse = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(jobDetailsResponse.status).toBe(200);
    expect(jobDetailsResponse.body.data.description).toBe('Need expert to review business contracts');

    // Step 4: Consultant submits proposal
    const proposalResponse = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        jobId: jobId,
        bidAmount: 75000,
        deliveryTime: '14 days',
        coverLetter: 'I have 7 years of experience in contract law and have reviewed over 100 business contracts. I can provide thorough review and recommendations.',
      });

    expect(proposalResponse.status).toBe(201);
    expect(proposalResponse.body.data.bidAmount).toBe(75000);
    const proposalId = proposalResponse.body.data._id;

    // Step 5: Proposal appears in buyer's Proposals tab
    const buyerProposalsResponse = await request(app)
      .get(`/api/proposals/buyer/${buyerId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(buyerProposalsResponse.status).toBe(200);
    const submittedProposal = buyerProposalsResponse.body.data.find((p: any) => p._id === proposalId);
    expect(submittedProposal).toBeDefined();
    expect(submittedProposal.bidAmount).toBe(75000);

    // Step 6: Buyer views proposal details
    const proposalDetailsResponse = await request(app)
      .get(`/api/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(proposalDetailsResponse.status).toBe(200);
    expect(proposalDetailsResponse.body.data.coverLetter).toContain('7 years of experience');
  });
});

