import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationProvider>
          <AuthProvider>
            <App />
            <ToastContainer position="top-right" newestOnTop pauseOnFocusLoss={false} />
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);


