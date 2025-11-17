import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import * as jobController from './job.controller';

const router = Router();

// All job routes require authentication
router.post('/', authenticate, jobController.createJob);
router.get('/', authenticate, jobController.getAllJobs);

// Place buyer route BEFORE the dynamic :id route so it is matched correctly
router.get('/buyer/:buyerId', authenticate, jobController.getJobsByBuyer);

router.get('/:id', authenticate, jobController.getJobById);
router.put('/:id', authenticate, jobController.updateJob);
router.delete('/:id', authenticate, jobController.deleteJob);

export default router;

