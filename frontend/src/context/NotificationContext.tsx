import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({ message: '', type: 'info', show: false });

  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    message: '',
    show: false,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    onCancel: () => void = () => {}
  ) => {
    setConfirmDialog({
      message,
      show: true,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, show: false }));
      },
      onCancel: () => {
        onCancel();
        setConfirmDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm }}>
      {children}

      {/* Notification Toast */}
      {notification.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            padding: '16px 24px',
            borderRadius: '8px',
            backgroundColor:
              notification.type === 'success'
                ? '#10b981'
                : notification.type === 'error'
                ? '#ef4444'
                : '#3b82f6',
            color: 'white',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            animation: 'slideInRight 0.3s ease',
            minWidth: '300px',
            maxWidth: '500px',
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => confirmDialog.onCancel()}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              animation: 'slideUp 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '16px',
                marginTop: 0,
              }}
            >
              Confirm Action
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: '#555',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={confirmDialog.onCancel}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#e9ecef',
                  color: '#495057',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#014751',
                  color: 'white',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </NotificationContext.Provider>
  );
};
