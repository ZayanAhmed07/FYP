import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import { jobValidation } from '../../middleware/validation';
import * as jobController from './job.controller';

const router = Router();

// All job routes require authentication
router.post('/', authenticate, ...jobValidation.createJob, jobController.createJob);
router.get('/', authenticate, jobController.getAllJobs);

// Place buyer route BEFORE the dynamic :id route so it is matched correctly
router.get('/buyer/:buyerId', authenticate, ...jobValidation.mongoId('buyerId'), jobController.getJobsByBuyer);

router.get('/:id', authenticate, ...jobValidation.mongoId('id'), jobController.getJobById);
router.put('/:id', authenticate, ...jobValidation.mongoId('id'), ...jobValidation.updateJob, jobController.updateJob);
router.delete('/:id', authenticate, ...jobValidation.mongoId('id'), jobController.deleteJob);

export default router;

