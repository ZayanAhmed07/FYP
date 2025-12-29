/**
 * Mock Socket.IO for Real-time Communication Tests
 */

import { EventEmitter } from 'events';

class MockSocket extends EventEmitter {
  id: string;
  userId?: string;
  rooms: Set<string>;
  connected: boolean;

  constructor(id: string = 'mock-socket-id') {
    super();
    this.id = id;
    this.rooms = new Set();
    this.connected = true;
  }

  join(room: string): void {
    this.rooms.add(room);
  }

  leave(room: string): void {
    this.rooms.delete(room);
  }

  to(room: string) {
    return {
      emit: jest.fn(),
    };
  }

  broadcast = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  disconnect(): void {
    this.connected = false;
    this.emit('disconnect');
  }
}

class MockIO extends EventEmitter {
  sockets: Map<string, MockSocket>;

  constructor() {
    super();
    this.sockets = new Map();
  }

  to(room: string) {
    return {
      emit: jest.fn((event: string, data: any) => {
        // Simulate broadcasting to room
        this.sockets.forEach(socket => {
          if (socket.rooms.has(room)) {
            socket.emit(event, data);
          }
        });
      }),
    };
  }

  emit(event: string, data: any): boolean {
    // Broadcast to all sockets
    this.sockets.forEach(socket => {
      socket.emit(event, data);
    });
    return true;
  }

  addSocket(userId: string): MockSocket {
    const socket = new MockSocket(`socket-${userId}`);
    socket.userId = userId;
    this.sockets.set(socket.id, socket);
    return socket;
  }

  removeSocket(socketId: string): void {
    this.sockets.delete(socketId);
  }

  getSocket(socketId: string): MockSocket | undefined {
    return this.sockets.get(socketId);
  }

  getAllSockets(): MockSocket[] {
    return Array.from(this.sockets.values());
  }

  reset(): void {
    this.sockets.clear();
    this.removeAllListeners();
  }
}

export const mockIO = new MockIO();
export const createMockSocket = (userId?: string): MockSocket => {
  const socket = new MockSocket(userId ? `socket-${userId}` : undefined);
  if (userId) socket.userId = userId;
  return socket;
};

export const resetSocketMocks = (): void => {
  mockIO.reset();
};

export default {
  mockIO,
  createMockSocket,
  MockSocket,
  MockIO,
  resetSocketMocks,
};
