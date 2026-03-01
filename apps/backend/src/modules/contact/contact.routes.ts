import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import {
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
} from './contact.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Public route for contact form submission
router.post(
  '/submit',
  celebrate({
    body: Joi.object({
      firstName: Joi.string().trim().max(50).required(),
      lastName: Joi.string().trim().max(50).required(),
      email: Joi.string().email().required(),
      message: Joi.string().trim().max(2000).required(),
    }),
  }),
  submitContactForm
);

// Protected admin routes
router.use(authenticate); // All routes below require authentication

router.get('/', getAllContacts);
router.get('/stats', getContactStats);
router.get('/:id', getContactById);

router.patch(
  '/:id',
  celebrate({
    body: Joi.object({
      status: Joi.string().valid('pending', 'reviewed', 'responded'),
      adminResponse: Joi.string().trim().max(2000),
    }),
  }),
  updateContact
);

router.delete('/:id', deleteContact);

export default router;