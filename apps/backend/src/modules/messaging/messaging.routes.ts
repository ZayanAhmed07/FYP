import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/authMiddleware';
import { messageValidation } from '../../middleware/validation';
import { uploadLimiter } from '../../middleware/rateLimiter';
import * as messagingController from './messaging.controller';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// All messaging routes require authentication
router.use(authenticate);

// Send a message
router.post('/', ...messageValidation.sendMessage, messagingController.createMessage);

// Upload a file message with rate limiting
router.post('/upload', uploadLimiter, upload.single('file'), messagingController.uploadFileMessage);

// Get all conversations for current user
router.get('/conversations', messagingController.getConversations);

// Get unread count (must be before /:otherUserId to avoid route conflict)
router.get('/unread/count', messagingController.getUnreadMessageCount);

// Get messages with a specific user
router.get('/:otherUserId', ...messageValidation.mongoId('otherUserId'), messagingController.getMessages);

// Mark messages as read
router.patch('/:otherUserId/read', ...messageValidation.mongoId('otherUserId'), messagingController.markMessagesAsRead);

// Delete a message
router.delete('/message/:messageId', ...messageValidation.mongoId('messageId'), messagingController.deleteMessage);

export default router;
