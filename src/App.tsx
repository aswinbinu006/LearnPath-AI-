import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { ToastProvider, useToast } from './contexts/ToastContext.js';
import { AppRoutes } from './routes/AppRoutes.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

const InactivitySessionHandler: React.FC = () => {
  const { warning } = useToast();

  useEffect(() => {
    const handleInactivityLogout = () => {
      warning('You have been logged out due to 1 hour of inactivity for your security.', 'Session Expired');
    };

    window.addEventListener('session-inactivity-logout', handleInactivityLogout);
    return () => window.removeEventListener('session-inactivity-logout', handleInactivityLogout);
  }, [warning]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <InactivitySessionHandler />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
