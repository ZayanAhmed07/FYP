import request from 'supertest';
import app from '../../app';

describe('Integration Testing - Profile Update Integration', () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Profile User',
        email: 'profile@test.com',
        password: '123456',
        accountType: 'buyer',
      });

    userToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  it('should update profile and reflect changes across platform', async () => {
    // Step 1: Update user name
    const updateResponse = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Updated Profile Name',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe('Updated Profile Name');

    // Step 2: Verify name updated in profile
    const profileResponse = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.name).toBe('Updated Profile Name');

    // Step 3: Create a job and verify updated name is associated
    const jobResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Job',
        category: 'Legal',
        description: 'Looking for an experienced legal consultant to review contracts and provide legal advice for business operations',
        budget: { min: 30000, max: 50000 },
        timeline: '1 week',
        location: 'Lahore',
      });

    expect(jobResponse.status).toBe(201);

    // Get job and verify buyer info
    const jobDetailsResponse = await request(app)
      .get(`/api/jobs/${jobResponse.body.data._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(jobDetailsResponse.status).toBe(200);
    expect(jobDetailsResponse.body.data.buyerId.name).toBe('Updated Profile Name');
  });

  it('should update consultant profile and reflect in proposals', async () => {
    // Register as consultant
    const consultantResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Consultant User',
        email: 'consultant@profile.com',
        password: '123456',
        accountType: 'consultant',
      });

    const consultantToken = consultantResponse.body.data.token;
    const consultantUserId = consultantResponse.body.data.user.id;

    // Create consultant profile
    const profileResponse = await request(app)
      .post('/api/consultants')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        userId: consultantUserId,
        title: 'Legal Consultant',
        bio: 'Original bio',
        specialization: ['Legal'],
        hourlyRate: 5000,
        experience: '5 years',
        skills: ['Contract Law'],
      });

    const consultantId = profileResponse.body.data._id;

    // Update consultant profile (use PUT instead of PATCH)
    const updateResponse = await request(app)
      .put(`/api/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        userId: consultantUserId,
        title: 'Senior Legal Consultant',
        bio: 'Updated bio with more experience',
        specialization: ['Legal'],
        hourlyRate: 7000,
        experience: '5 years',
        skills: ['Contract Law'],
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.title).toBe('Senior Legal Consultant');
    expect(updateResponse.body.data.hourlyRate).toBe(7000);

    // Verify updated profile
    const getProfileResponse = await request(app)
      .get(`/api/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(getProfileResponse.status).toBe(200);
    expect(getProfileResponse.body.data.title).toBe('Senior Legal Consultant');
    expect(getProfileResponse.body.data.bio).toBe('Updated bio with more experience');
  });
});

