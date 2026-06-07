/**
 * Global Socket Initializer
 * Connects socket ONCE at app level instead of per component
 * Prevents duplicate connections from multiple useSocket calls
 */

import { useEffect } from 'react';
import { socketService } from '../../services/socket.service';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

export const SocketInitializer = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      const token = authService.getToken() ?? undefined;
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }
  }, [user?.id, isLoading]);

  return null;
};
