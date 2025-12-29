import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

/**
 * Validation middleware to check for validation errors
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new ApiError(400, `Validation failed: ${errorMessages}`);
  }
  next();
};

/**
 * Common validation rules
 */
export const commonValidations = {
  email: body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
    .isLength({ max: 255 })
    .withMessage('Email too long'),

  password: body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),

  mongoId: (field: string) => [
    param(field)
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage(`Invalid ${field} format`),
    validate,
  ],

  optionalMongoId: (field: string) =>
    param(field)
      .optional()
      .custom((value) => !value || mongoose.Types.ObjectId.isValid(value))
      .withMessage(`Invalid ${field} format`),

  positiveNumber: (field: string) =>
    body(field)
      .isInt({ min: 1 })
      .withMessage(`${field} must be a positive number`),

  sanitizeString: (field: string, maxLength: number = 5000) =>
    body(field)
      .trim()
      .escape()
      .isLength({ min: 1, max: maxLength })
      .withMessage(`${field} must be between 1 and ${maxLength} characters`),

  enumValue: (values: string[], field: string) => [
    param(field)
      .isIn(values)
      .withMessage(`${field} must be one of: ${values.join(', ')}`),
    validate,
  ],
};

/**
 * Auth validation rules
 */
export const authValidation = {
  login: [
    commonValidations.email,
    body('password').trim().notEmpty().withMessage('Password is required'),
    validate,
  ],

  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    commonValidations.email,
    commonValidations.password,
    body('accountType')
      .isIn(['buyer', 'consultant'])
      .withMessage('Account type must be buyer or consultant'),
    validate,
  ],

  forgotPassword: [commonValidations.email, validate],

  resetPassword: [
    body('token').trim().notEmpty().withMessage('Token is required'),
    commonValidations.password,
    validate,
  ],
};

/**
 * Job validation
 */
export const jobValidation = {
  createJob: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Job title must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 50, max: 10000 })
      .withMessage('Job description must be between 50 and 10000 characters'),
    body('budget.min')
      .isInt({ min: 0 })
      .withMessage('Minimum budget must be at least 0 PKR'),
    body('budget.max')
      .isInt({ min: 0 })
      .withMessage('Maximum budget must be at least 0 PKR')
      .custom((value, { req }) => {
        if (value < req.body.budget.min) {
          throw new Error('Maximum budget must be greater than or equal to minimum budget');
        }
        return true;
      }),
    body('timeline')
      .notEmpty()
      .withMessage('Timeline is required'),
    body('location')
      .notEmpty()
      .withMessage('Location is required'),
    body('category')
      .notEmpty()
      .withMessage('Category is required'),
    validate,
  ],

  updateJob: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Job title must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 50, max: 10000 })
      .withMessage('Job description must be between 50 and 10000 characters'),
    body('budget.min')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum budget must be at least 0 PKR'),
    body('budget.max')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Maximum budget must be at least 0 PKR'),
    validate,
  ],

  mongoId: (field: string) => [
    param(field)
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage(`Invalid ${field} format`),
    validate,
  ],
};

/**
 * Proposal validation
 */
export const proposalValidation = {
  createProposal: [
    body('jobId')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid job ID'),
    body('coverLetter')
      .trim()
      .isLength({ min: 100, max: 5000 })
      .withMessage('Cover letter must be between 100 and 5000 characters'),
    body('proposedAmount')
      .isInt({ min: 1000 })
      .withMessage('Proposed amount must be at least 1000 PKR'),
    body('estimatedDelivery')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Estimated delivery is required'),
    validate,
  ],

  updateProposal: [
    body('coverLetter')
      .optional()
      .trim()
      .isLength({ min: 100, max: 5000 })
      .withMessage('Cover letter must be between 100 and 5000 characters'),
    body('proposedAmount')
      .optional()
      .isInt({ min: 1000 })
      .withMessage('Proposed amount must be at least 1000 PKR'),
    validate,
  ],

  mongoId: (field: string) => [
    param(field)
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage(`Invalid ${field} format`),
    validate,
  ],
};

/**
 * Message validation
 */
export const messageValidation = {
  sendMessage: [
    body('receiverId')
      .trim()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid receiver ID'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
    validate,
  ],

  mongoId: (field: string) => [
    param(field)
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage(`Invalid ${field} format`),
    validate,
  ],
};

/**
 * Review validation
 */
export const reviewValidation = {
  create: [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Comment must be between 10 and 2000 characters'),
    validate,
  ],
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};
