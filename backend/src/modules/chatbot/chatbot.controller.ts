import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import groqService from '../../services/groq.service';
import intakeAssistant from '../../services/intakeAssistant.service';
import { IntakeStep, IntakeDomain } from '../../types/intake.types';

/**
 * Process intake assistant message with strict guardrails
 */
export const processMessage = catchAsync(async (req: Request, res: Response) => {
  const { message, currentStep, domain, intakeState } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Valid message is required',
    });
  }

  // Rate limit check: max 500 characters
  if (message.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Message too long. Please keep it under 500 characters.',
    });
  }

  const step = (currentStep as IntakeStep) || 'greeting';
  const currentDomain = domain as IntakeDomain | undefined;

  // Step 1: Classify intent
  const intentResult = await intakeAssistant.classifyIntent(message, step);

  // Step 2: Extract entities
  const entities = await intakeAssistant.extractEntities(message, step);

  // Step 3: Generate controlled response
  const response = await intakeAssistant.generateResponse(
    message,
    step,
    currentDomain,
    intentResult
  );

  // Step 4: Validate step completion if needed
  let validation = { isValid: true };
  if (intakeState) {
    validation = intakeAssistant.validateStep(step, intakeState);
  }

  res.status(200).json({
    success: true,
    data: {
      response,
      intent: intentResult.intent,
      entities,
      requiresRedirect: intentResult.requiresRedirect,
      validation,
    },
  });
});

/**
 * Detect domain from initial message (intake assistant)
 */
export const detectCategory = catchAsync(async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required',
    });
  }

  // Extract entities including domain
  const entities = await intakeAssistant.extractEntities(message, 'domain_classification');

  res.status(200).json({
    success: true,
    data: {
      category: entities.domain || null,
      entities,
    },
  });
});

/**
 * Extract skills from description
 */
export const extractSkills = catchAsync(async (req: Request, res: Response) => {
  const { description, category } = req.body;

  if (!description || !category) {
    return res.status(400).json({
      success: false,
      error: 'Description and category are required',
    });
  }

  const skills = await groqService.extractSkills(description, category);

  res.status(200).json({
    success: true,
    data: {
      skills,
    },
  });
});

/**
 * Extract all job details from conversation (intake state)
 */
export const extractJobDetails = catchAsync(async (req: Request, res: Response) => {
  const { conversationHistory, userMessage } = req.body;

  if (!conversationHistory && !userMessage) {
    return res.status(400).json({
      success: false,
      error: 'Conversation history or user message is required',
    });
  }

  // If single message provided, extract entities
  if (userMessage) {
    const entities = await intakeAssistant.extractEntities(userMessage, 'problem_summary');
    return res.status(200).json({
      success: true,
      data: entities,
    });
  }

  // Legacy support: extract from full conversation
  const context =
    typeof conversationHistory === 'string'
      ? conversationHistory
      : conversationHistory.map((msg: any) => `${msg.sender}: ${msg.text}`).join('\n');

  const jobDetails = await groqService.extractJobDetails(context);

  res.status(200).json({
    success: true,
    data: jobDetails,
  });
});

/**
 * Enhance job posting with AI-generated professional title and description
 */
export const enhanceJobPosting = catchAsync(async (req: Request, res: Response) => {
  const { description, category, skills } = req.body;

  if (!description || !category) {
    return res.status(400).json({
      success: false,
      error: 'Description and category are required',
    });
  }

  const enhanced = await groqService.enhanceJobPosting(
    description,
    category,
    skills || []
  );

  res.status(200).json({
    success: true,
    data: enhanced,
  });
});
