/**
 * Order Module Tests
 * Testing order creation, status transitions, and payment flows
 */

import request from 'supertest';
import app from '../../app';
import { Order } from '../../models/order.model';
import { Job } from '../../models/job.model';
import { Proposal } from '../../models/proposal.model';
import { User } from '../../modules/user/user.model';
import { createTestUser, createCompleteConsultant } from '../utils/auth.helpers';
import { createTestJob, createTestProposal } from '../utils/data-factory.helpers';
import {
  assertSuccessResponse,
  assertErrorResponse,
  assertValidationError,
  assertUnauthorized,
  assertNotFound,
  assertHasFields,
  assertValidObjectId,
  assertTimestamps,
  assertRecordExists,
} from '../utils/assertions.helpers';

describe('Order Module Tests', () => {
  let buyer: any;
  let consultant: any;
  let jobId: string;
  let proposalId: string;
  const testEmails: string[] = [];

  beforeAll(async () => {
    // Create buyer
    buyer = await createTestUser('buyer');
    testEmails.push(buyer.email);

    // Create consultant with profile
    consultant = await createCompleteConsultant();
    testEmails.push(consultant.user.email);

    // Create job
    const job = await createTestJob(buyer._id, buyer.token, {
      title: 'Order Test Job',
      category: 'Technology',
      description: 'Testing order creation flow',
    });
    jobId = job._id;

    // Create proposal
    const proposal = await createTestProposal(
      jobId,
      consultant.consultant._id,
      consultant.user._id,
      consultant.user.token,
      { bidAmount: 5000 }
    );
    proposalId = proposal._id;
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await Proposal.deleteMany({});
    await Job.deleteMany({});
    await User.deleteMany({ email: { $in: testEmails } });
  });

  describe('Order Creation', () => {
    it('should create order when proposal is accepted', async () => {
      const response = await request(app)
        .patch(`/api/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${buyer.token}`);

      assertSuccessResponse(response, 200);
      
      // Verify order data structure
      expect(response.body.data).toHaveProperty('order');
      const order = response.body.data.order;
      
      assertHasFields(order, [
        '_id',
        'jobId',
        'buyerId',
        'consultantId',
        'proposalId',
        'totalAmount',
        'status',
        'amountPaid',
        'amountPending',
      ]);

      assertValidObjectId(order._id);
      expect(order.totalAmount).toBe(5000);
      expect(order.status).toBe('in_progress');
      expect(order.amountPaid).toBe(0);
      expect(order.amountPending).toBe(5000);
      assertTimestamps(order);

      // Verify in database
      const dbOrder = await assertRecordExists(Order, { _id: order._id });
      expect(dbOrder.buyerId.toString()).toBe(buyer._id);
      expect(dbOrder.consultantId.toString()).toBe(consultant.consultant._id);
    });

    it('should reject order creation without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          jobId,
          consultantId: consultant.consultant._id,
          amount: 5000,
        });

      assertUnauthorized(response);
    });
  });

  describe('Order Retrieval', () => {
    let orderId: string;

    beforeAll(async () => {
      // Create an order for testing
      const order = await Order.create({
        jobId,
        buyerId: buyer._id,
        consultantId: consultant.consultant._id,
        proposalId,
        totalAmount: 3000,
        status: 'in_progress',
        amountPaid: 0,
        amountPending: 3000,
        startDate: new Date(),
        progress: 0,
        milestones: [],
      });
      orderId = order._id.toString();
    });

    it('should get order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyer.token}`);

      assertSuccessResponse(response, 200);
      assertHasFields(response.body.data, ['_id', 'totalAmount', 'status']);
      expect(response.body.data._id).toBe(orderId);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${buyer.token}`);

      assertNotFound(response, 'order');
    });

    it('should get buyer orders', async () => {
      const response = await request(app)
        .get('/api/orders/buyer/my-orders')
        .set('Authorization', `Bearer ${buyer.token}`);

      assertSuccessResponse(response, 200);
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should get consultant orders', async () => {
      const response = await request(app)
        .get('/api/orders/consultant/my-orders')
        .set('Authorization', `Bearer ${consultant.user.token}`);

      assertSuccessResponse(response, 200);
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });
  });

  describe('Order Status Transitions', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await Order.create({
        jobId,
        buyerId: buyer._id,
        consultantId: consultant.consultant._id,
        proposalId,
        totalAmount: 4000,
        status: 'in_progress',
        amountPaid: 0,
        amountPending: 4000,
        startDate: new Date(),
        progress: 0,
        milestones: [],
      });
      orderId = order._id.toString();
    });

    it('should request completion from consultant side', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/request-completion`)
        .set('Authorization', `Bearer ${consultant.user.token}`)
        .send({ message: 'Work completed as per requirements' });

      assertSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('pending_completion');
      expect(response.body.data.completionRequestedBy).toBe('consultant');
    });

    it('should confirm completion from buyer side', async () => {
      // First, consultant requests completion
      await request(app)
        .patch(`/api/orders/${orderId}/request-completion`)
        .set('Authorization', `Bearer ${consultant.user.token}`)
        .send({ message: 'Work completed' });

      // Then buyer confirms
      const response = await request(app)
        .patch(`/api/orders/${orderId}/confirm-completion`)
        .set('Authorization', `Bearer ${buyer.token}`);

      assertSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completionDate).toBeDefined();
    });

    it('should update order progress', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/progress`)
        .set('Authorization', `Bearer ${consultant.user.token}`)
        .send({ progress: 50 });

      assertSuccessResponse(response, 200);
      expect(response.body.data.progress).toBe(50);
    });
  });

  describe('Order Payment', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await Order.create({
        jobId,
        buyerId: buyer._id,
        consultantId: consultant.consultant._id,
        proposalId,
        totalAmount: 6000,
        status: 'completed',
        amountPaid: 0,
        amountPending: 6000,
        startDate: new Date(),
        completionDate: new Date(),
        progress: 100,
        milestones: [],
      });
      orderId = order._id.toString();
    });

    it('should release payment after order completion', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/release-payment`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ amount: 6000 });

      assertSuccessResponse(response, 200);
      expect(response.body.data.amountPaid).toBe(6000);
      expect(response.body.data.amountPending).toBe(0);
    });

    it('should reject payment release for incomplete order', async () => {
      // Create incomplete order
      const incompleteOrder = await Order.create({
        jobId,
        buyerId: buyer._id,
        consultantId: consultant.consultant._id,
        proposalId,
        totalAmount: 2000,
        status: 'in_progress',
        amountPaid: 0,
        amountPending: 2000,
        startDate: new Date(),
        progress: 30,
        milestones: [],
      });

      const response = await request(app)
        .post(`/api/orders/${incompleteOrder._id}/release-payment`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ amount: 2000 });

      assertErrorResponse(response, 400);
    });

    it('should reject payment amount exceeding pending amount', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/release-payment`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ amount: 10000 }); // More than pending

      assertErrorResponse(response, 400);
    });
  });

  describe('Order Cancellation', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await Order.create({
        jobId,
        buyerId: buyer._id,
        consultantId: consultant.consultant._id,
        proposalId,
        totalAmount: 3000,
        status: 'in_progress',
        amountPaid: 0,
        amountPending: 3000,
        startDate: new Date(),
        progress: 10,
        milestones: [],
      });
      orderId = order._id.toString();
    });

    it('should cancel order by buyer', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ reason: 'Requirements changed' });

      assertSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should reject cancellation of completed order', async () => {
      // Update order to completed
      await Order.findByIdAndUpdate(orderId, { 
        status: 'completed',
        completionDate: new Date()
      });

      const response = await request(app)
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ reason: 'Testing' });

      assertErrorResponse(response, 400);
    });
  });

  describe('Order Validation', () => {
    it('should reject order with invalid jobId', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({
          jobId: 'invalid-id',
          consultantId: consultant.consultant._id,
          amount: 5000,
        });

      assertErrorResponse(response, 400);
    });

    it('should reject order with negative amount', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({
          jobId,
          consultantId: consultant.consultant._id,
          amount: -1000,
        });

      assertValidationError(response);
    });
  });
});
