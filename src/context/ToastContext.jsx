import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => {
      const withoutDuplicate = prev.filter(toast => toast.message !== message);
      const withoutStalePassErrors = message.includes('Digital pass generated')
        ? withoutDuplicate.filter(toast => toast.message !== 'Pass not sent: undefined')
        : withoutDuplicate;
      return [...withoutStalePassErrors, { id, message, type }];
    });
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const icons = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ fontSize: '1.2rem' }}>{icons[t.type]}</span>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
