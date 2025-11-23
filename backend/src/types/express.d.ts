import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      roles: string[];
    };
  }
}

declare module 'express-session' {
  interface SessionData {
    passport?: any;
  }
}




