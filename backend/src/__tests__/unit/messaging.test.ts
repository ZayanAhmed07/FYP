/**
 * Messaging Module Tests
 * Testing conversations, messages, and real-time communication
 */

import request from 'supertest';
import app from '../../app';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';
import { User } from '../../modules/user/user.model';
import { createTestUser } from '../utils/auth.helpers';
import {
  assertSuccessResponse,
  assertErrorResponse,
  assertUnauthorized,
  assertNotFound,
  assertHasFields,
  assertValidObjectId,
  assertTimestamps,
  assertRecordExists,
} from '../utils/assertions.helpers';

describe('Messaging Module Tests', () => {
  let user1: any;
  let user2: any;
  let user3: any;
  const testEmails: string[] = [];

  beforeAll(async () => {
    user1 = await createTestUser('buyer', { name: 'User One' });
    user2 = await createTestUser('consultant', { name: 'User Two' });
    user3 = await createTestUser('buyer', { name: 'User Three' });
    testEmails.push(user1.email, user2.email, user3.email);
  });

  afterAll(async () => {
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await User.deleteMany({ email: { $in: testEmails } });
  });

  describe('Conversation Creation', () => {
    it('should create conversation between two users', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user2._id],
        });

      assertSuccessResponse(response, 201);
      assertHasFields(response.body.data, ['_id', 'participants', 'lastMessage']);
      
      expect(Array.isArray(response.body.data.participants)).toBe(true);
      expect(response.body.data.participants).toContain(user1._id);
      expect(response.body.data.participants).toContain(user2._id);
      assertValidObjectId(response.body.data._id);
      assertTimestamps(response.body.data);

      // Verify in database
      await assertRecordExists(Conversation, { _id: response.body.data._id });
    });

    it('should reject conversation creation without authentication', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          participantIds: [user1._id, user2._id],
        });

      assertUnauthorized(response);
    });

    it('should reject conversation with single participant', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id],
        });

      assertErrorResponse(response, 400);
    });

    it('should reject conversation with invalid participant IDs', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, 'invalid-id'],
        });

      assertErrorResponse(response, 400);
    });

    it('should return existing conversation if already exists', async () => {
      // Create first conversation
      const response1 = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user3._id],
        });

      const conversationId1 = response1.body.data._id;

      // Try to create same conversation
      const response2 = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user3._id],
        });

      // Should return existing conversation
      expect(response2.body.data._id).toBe(conversationId1);
    });
  });

  describe('Conversation Retrieval', () => {
    let conversationId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user2._id],
        });
      conversationId = response.body.data._id;
    });

    it('should get all conversations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`);

      assertSuccessResponse(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify each conversation has required fields
      response.body.data.forEach((conv: any) => {
        assertHasFields(conv, ['_id', 'participants']);
      });
    });

    it('should get conversation by ID', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertSuccessResponse(response, 200);
      expect(response.body.data._id).toBe(conversationId);
      assertHasFields(response.body.data, ['_id', 'participants']);
    });

    it('should return 404 for non-existent conversation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertNotFound(response);
    });

    it('should reject access to conversation user is not part of', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${user3.token}`);

      assertErrorResponse(response, 403);
    });
  });

  describe('Message Operations', () => {
    let conversationId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user2._id],
        });
      conversationId = response.body.data._id;
    });

    it('should send message in conversation', async () => {
      const messageContent = 'Hello, this is a test message!';
      
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: messageContent,
          senderId: user1._id,
        });

      assertSuccessResponse(response, 201);
      assertHasFields(response.body.data, [
        '_id',
        'conversationId',
        'sender',
        'content',
        'read',
      ]);
      
      expect(response.body.data.content).toBe(messageContent);
      expect(response.body.data.read).toBe(false);
      assertValidObjectId(response.body.data._id);
      assertTimestamps(response.body.data);

      // Verify in database
      await assertRecordExists(Message, { _id: response.body.data._id });
    });

    it('should reject empty message', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: '',
          senderId: user1._id,
        });

      assertErrorResponse(response, 400);
    });

    it('should reject message without authentication', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          content: 'Test message',
          senderId: user1._id,
        });

      assertUnauthorized(response);
    });

    it('should get messages in conversation', async () => {
      // Send a few messages first
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: 'Message 1',
          senderId: user1._id,
        });

      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({
          content: 'Message 2',
          senderId: user2._id,
        });

      const response = await request(app)
        .get(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertSuccessResponse(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify message structure
      response.body.data.forEach((msg: any) => {
        assertHasFields(msg, ['_id', 'content', 'sender']);
      });
    });

    it('should support message pagination', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}/messages?page=1&limit=2`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertSuccessResponse(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Message Read Status', () => {
    let conversationId: string;
    let messageId: string;

    beforeAll(async () => {
      // Create conversation
      const convResponse = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user2._id],
        });
      conversationId = convResponse.body.data._id;

      // Send message
      const msgResponse = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: 'Test message for read status',
          senderId: user1._id,
        });
      messageId = msgResponse.body.data._id;
    });

    it('should mark message as read', async () => {
      const response = await request(app)
        .patch(`/api/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${user2.token}`);

      assertSuccessResponse(response, 200);
      expect(response.body.data.read).toBe(true);
    });

    it('should get unread message count', async () => {
      // Send unread messages
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: 'Unread message 1',
          senderId: user1._id,
        });

      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: 'Unread message 2',
          senderId: user1._id,
        });

      const response = await request(app)
        .get(`/api/conversations/${conversationId}/unread-count`)
        .set('Authorization', `Bearer ${user2.token}`);

      assertSuccessResponse(response, 200);
      expect(response.body.data.unreadCount).toBeGreaterThanOrEqual(2);
    });

    it('should mark all conversation messages as read', async () => {
      const response = await request(app)
        .patch(`/api/conversations/${conversationId}/mark-read`)
        .set('Authorization', `Bearer ${user2.token}`);

      assertSuccessResponse(response, 200);

      // Verify unread count is now 0
      const countResponse = await request(app)
        .get(`/api/conversations/${conversationId}/unread-count`)
        .set('Authorization', `Bearer ${user2.token}`);

      expect(countResponse.body.data.unreadCount).toBe(0);
    });
  });

  describe('Message Search and Filtering', () => {
    let conversationId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user2._id],
        });
      conversationId = response.body.data._id;

      // Send searchable messages
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: 'Important project update',
          senderId: user1._id,
        });

      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          content: 'Meeting scheduled for tomorrow',
          senderId: user1._id,
        });
    });

    it('should search messages by keyword', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}/messages?search=project`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertSuccessResponse(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify search results contain the keyword
      const hasKeyword = response.body.data.some((msg: any) => 
        msg.content.toLowerCase().includes('project')
      );
      expect(hasKeyword).toBe(true);
    });

    it('should filter messages by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .get(`/api/conversations/${conversationId}/messages?from=${yesterday.toISOString()}`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertSuccessResponse(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Conversation Deletion', () => {
    let conversationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          participantIds: [user1._id, user2._id],
        });
      conversationId = response.body.data._id;
    });

    it('should delete conversation', async () => {
      const response = await request(app)
        .delete(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertSuccessResponse(response, 200);

      // Verify conversation is deleted
      const getResponse = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      assertNotFound(getResponse);
    });

    it('should reject deletion by non-participant', async () => {
      const response = await request(app)
        .delete(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${user3.token}`);

      assertErrorResponse(response, 403);
    });
  });
});
