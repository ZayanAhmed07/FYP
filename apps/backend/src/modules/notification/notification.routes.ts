import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from './notification.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', getUserNotifications);

router.patch(
  '/:id/read',
  celebrate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  }),
  markNotificationAsRead
);

router.patch('/read-all', markAllNotificationsAsRead);

router.delete(
  '/:id',
  celebrate({
    params: Joi.object({
      id: Joi.string().required(),
    }),
  }),
  deleteNotification
);

export default router;