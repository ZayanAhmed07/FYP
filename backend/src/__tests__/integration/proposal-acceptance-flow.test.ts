import request from 'supertest';
import app from '../../app';

describe('Integration Testing - Proposal Acceptance to Order Flow', () => {
  let buyerToken: string;
  let consultantToken: string;
  let jobId: string;
  let proposalId: string;

  beforeEach(async () => {
    // Register buyer
    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Order Buyer',
        email: 'orderbuyer@test.com',
        password: '123456',
        accountType: 'buyer',
      });
    buyerToken = buyerResponse.body.data.token;

    // Register consultant
    const consultantResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Order Consultant',
        email: 'orderconsultant@test.com',
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
        title: 'Business Consultant',
        bio: 'Expert business consultant',
        specialization: ['Business'],
        hourlyRate: 5500,
        experience: '6 years',
        skills: ['Business Strategy'],
      });

    // Create job
    const jobResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Business Strategy Consultant',
        category: 'Business',
        description: 'Need business strategy help',
        budget: { min: 60000, max: 80000 },
        timeline: '3 weeks',
        location: 'Karachi',
      });
    jobId = jobResponse.body.data._id;

    // Submit proposal
    const proposalResponse = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        jobId: jobId,
        bidAmount: 70000,
        deliveryTime: '20 days',
        coverLetter: 'I can help with your business strategy.',
      });
    proposalId = proposalResponse.body.data._id;
  });

  it('should complete proposal acceptance to order creation flow', async () => {
    // Step 1: Buyer accepts proposal
    const acceptResponse = await request(app)
      .patch(`/api/proposals/${proposalId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data.proposal.status).toBe('accepted');
    expect(acceptResponse.body.data.order).toBeDefined();
    
    const orderId = acceptResponse.body.data.order._id;

    // Step 2: Verify proposal status changed to accepted
    const proposalResponse = await request(app)
      .get(`/api/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(proposalResponse.status).toBe(200);
    expect(proposalResponse.body.data.status).toBe('accepted');

    // Step 3: Order appears in buyer's Orders tab
    const buyerOrdersResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(buyerOrdersResponse.status).toBe(200);
    expect(buyerOrdersResponse.body.data.orders).toBeDefined();
    expect(Array.isArray(buyerOrdersResponse.body.data.orders)).toBe(true);
    const buyerOrder = buyerOrdersResponse.body.data.orders.find((o: any) => o._id === orderId);
    expect(buyerOrder).toBeDefined();
    expect(buyerOrder.totalAmount).toBe(70000);

    // Step 4: Order appears in consultant's Orders tab
    const consultantOrdersResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(consultantOrdersResponse.status).toBe(200);
    expect(consultantOrdersResponse.body.data.orders).toBeDefined();
    expect(Array.isArray(consultantOrdersResponse.body.data.orders)).toBe(true);
    const consultantOrder = consultantOrdersResponse.body.data.orders.find((o: any) => o._id === orderId);
    expect(consultantOrder).toBeDefined();
    expect(consultantOrder.status).toBe('in_progress');

    // Step 5: Verify order details
    const orderDetailsResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(orderDetailsResponse.status).toBe(200);
    expect(orderDetailsResponse.body.data.totalAmount).toBe(70000);
    expect(orderDetailsResponse.body.data.amountPending).toBe(70000);
  });

  it('should reject proposal and not create order', async () => {
    // Reject proposal
    const rejectResponse = await request(app)
      .patch(`/api/proposals/${proposalId}/reject`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.data.status).toBe('rejected');

    // Verify no order was created
    const ordersResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(ordersResponse.status).toBe(200);
    expect(ordersResponse.body.data.orders).toBeDefined();
    expect(Array.isArray(ordersResponse.body.data.orders)).toBe(true);
    expect(ordersResponse.body.data.orders.length).toBe(0);
  });
});

