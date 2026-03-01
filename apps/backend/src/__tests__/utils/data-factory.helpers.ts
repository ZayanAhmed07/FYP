/**
 * Test Utilities - Data Factory Helpers
 * Create test data for jobs, proposals, orders, etc.
 */

import request from 'supertest';
import app from '../../app';
import { Job } from '../../modules/job/job.model';
import { Proposal } from '../../modules/proposal/proposal.model';
import { Order } from '../../modules/order/order.model';
import mongoose from 'mongoose';

/**
 * Create a test job
 */
export const createTestJob = async (
  buyerUserId: string,
  token: string,
  customData?: Partial<any>
): Promise<any> => {
  const jobData = {
    title: customData?.title || 'Test Job - Software Development',
    description: customData?.description || 'We need an experienced developer for a project',
    category: customData?.category || 'Technology',
    budget: customData?.budget || { min: 1000, max: 5000 },
    timeline: customData?.timeline || '2-3 months',
    location: customData?.location || 'Remote',
    skills: customData?.skills || ['JavaScript', 'React', 'Node.js'],
    ...customData,
  };

  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${token}`)
    .send(jobData);

  if (response.status !== 201) {
    throw new Error(`Failed to create test job: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Create a test proposal
 */
export const createTestProposal = async (
  jobId: string,
  consultantId: string,
  consultantUserId: string,
  token: string,
  customData?: Partial<any>
): Promise<any> => {
  const proposalData = {
    jobId,
    consultantId,
    consultantUserId,
    bidAmount: customData?.bidAmount || 2500,
    coverLetter: customData?.coverLetter || 'I am interested in this position and have relevant experience.',
    deliveryTime: customData?.deliveryTime || '2 months',
    ...customData,
  };

  const response = await request(app)
    .post('/api/proposals')
    .set('Authorization', `Bearer ${token}`)
    .send(proposalData);

  if (response.status !== 201) {
    throw new Error(`Failed to create test proposal: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Create a test order
 */
export const createTestOrder = async (
  buyerId: string,
  consultantId: string,
  jobId: string,
  token: string,
  customData?: Partial<any>
): Promise<any> => {
  const orderData = {
    buyerId,
    consultantId,
    jobId,
    amount: customData?.amount || 2500,
    description: customData?.description || 'Order for software development services',
    deliveryDate: customData?.deliveryDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    status: customData?.status || 'pending',
    ...customData,
  };

  const response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(orderData);

  if (response.status !== 201) {
    throw new Error(`Failed to create test order: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Create a test conversation
 */
export const createTestConversation = async (
  participant1Id: string,
  participant2Id: string,
  token: string
): Promise<any> => {
  const response = await request(app)
    .post('/api/conversations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      participantIds: [participant1Id, participant2Id],
    });

  if (response.status !== 201) {
    throw new Error(`Failed to create test conversation: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Send a test message
 */
export const sendTestMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  token: string
): Promise<any> => {
  const response = await request(app)
    .post(`/api/conversations/${conversationId}/messages`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      senderId,
      content,
    });

  if (response.status !== 201) {
    throw new Error(`Failed to send test message: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Create a test review
 */
export const createTestReview = async (
  orderId: string,
  reviewerId: string,
  revieweeId: string,
  token: string,
  customData?: Partial<any>
): Promise<any> => {
  const reviewData = {
    orderId,
    reviewerId,
    revieweeId,
    rating: customData?.rating || 5,
    comment: customData?.comment || 'Excellent work, highly recommended!',
    ...customData,
  };

  const response = await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${token}`)
    .send(reviewData);

  if (response.status !== 201) {
    throw new Error(`Failed to create test review: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Create multiple test jobs
 */
export const createTestJobs = async (
  count: number,
  buyerUserId: string,
  token: string
): Promise<any[]> => {
  const jobs: any[] = [];
  for (let i = 0; i < count; i++) {
    const job = await createTestJob(buyerUserId, token, {
      title: `Test Job ${i + 1}`,
    });
    jobs.push(job);
  }
  return jobs;
};

/**
 * Accept a proposal (create order from proposal)
 */
export const acceptProposal = async (
  proposalId: string,
  token: string
): Promise<any> => {
  const response = await request(app)
    .patch(`/api/proposals/${proposalId}/accept`)
    .set('Authorization', `Bearer ${token}`);

  if (response.status !== 200) {
    throw new Error(`Failed to accept proposal: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Generate a random MongoDB ObjectId
 */
export const generateObjectId = (): string => {
  return new mongoose.Types.ObjectId().toString();
};

/**
 * Clean up test data
 */
export const cleanupTestData = async (): Promise<void> => {
  await Job.deleteMany({ title: /^Test Job/ });
  await Proposal.deleteMany({ coverLetter: /test/i });
  await Order.deleteMany({ description: /test/i });
};

export default {
  createTestJob,
  createTestProposal,
  createTestOrder,
  createTestConversation,
  sendTestMessage,
  createTestReview,
  createTestJobs,
  acceptProposal,
  generateObjectId,
  cleanupTestData,
};
