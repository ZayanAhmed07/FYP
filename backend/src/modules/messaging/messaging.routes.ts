import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import * as messagingController from './messaging.controller';

const router = Router();

// All messaging routes require authentication
router.use(authenticate);

// Send a message
router.post('/', messagingController.createMessage);

// Get all conversations for current user
router.get('/conversations', messagingController.getConversations);

// Get unread count (must be before /:otherUserId to avoid route conflict)
router.get('/unread/count', messagingController.getUnreadMessageCount);

// Get messages with a specific user
router.get('/:otherUserId', messagingController.getMessages);

// Mark messages as read
router.patch('/:otherUserId/read', messagingController.markMessagesAsRead);

// Delete a message
router.delete('/message/:messageId', messagingController.deleteMessage);

export default router;
