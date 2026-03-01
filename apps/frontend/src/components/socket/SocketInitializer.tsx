/**
 * Global Socket Initializer
 * Connects socket ONCE at app level instead of per component
 * Prevents duplicate connections from multiple useSocket calls
 */

import { useEffect, useRef } from 'react';
import { socketService } from '../../services/socket.service';
import { authService } from '../../services/authService';

export const SocketInitializer = () => {
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initRef.current) {
      console.log('[SocketInitializer] Already initialized, skipping...');
      return;
    }

    const token = authService.getToken();
    if (!token) {
      console.log('[SocketInitializer] No token, skipping socket initialization');
      return;
    }

    console.log('[SocketInitializer] Initializing global socket connection...');
    socketService.connect(token);
    initRef.current = true;

    // Cleanup on app unmount (unlikely but good practice)
    return () => {
      console.log('[SocketInitializer] App unmounting, disconnecting socket...');
      socketService.disconnect();
      initRef.current = false;
    };
  }, []); // Empty deps - initialize only once

  // This component renders nothing
  return null;
};
