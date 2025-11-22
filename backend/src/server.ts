import { createServer } from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import logger from './config/logger';
import { initializeSocket } from './socket/socket';

const startServer = async () => {
  await connectDatabase();

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = initializeSocket(httpServer);
  
  // Make io accessible to routes if needed
  (app as any).io = io;

  httpServer.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
    logger.info(`Socket.IO enabled and ready for real-time communication`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});




