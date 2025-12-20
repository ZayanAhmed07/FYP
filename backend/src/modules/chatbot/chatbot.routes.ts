import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as chatbotController from './chatbot.controller';

// Strict rate limiting for chatbot (prevent abuse)
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute per IP
  message: {
    success: false,
    error: 'Too many messages. Please wait a moment before continuing.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// POST /api/chatbot/message - Process user message (RATE LIMITED)
router.post('/message', chatbotLimiter, chatbotController.processMessage);

// POST /api/chatbot/detect-category - Detect job category
router.post('/detect-category', chatbotLimiter, chatbotController.detectCategory);

// POST /api/chatbot/extract-skills - Extract skills from description
router.post('/extract-skills', chatbotLimiter, chatbotController.extractSkills);

// POST /api/chatbot/extract-details - Extract all job details
router.post('/extract-details', chatbotLimiter, chatbotController.extractJobDetails);

// POST /api/chatbot/enhance-job - Enhance job posting with AI
router.post('/enhance-job', chatbotLimiter, chatbotController.enhanceJobPosting);

export default router;
