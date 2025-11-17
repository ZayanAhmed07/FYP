import mongoose from 'mongoose';

import { env } from './env';
import logger from './logger';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};


