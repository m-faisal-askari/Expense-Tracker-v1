import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';

// Global error handler for all TanStack Query mutations
let globalShowError = null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
    mutations: {
      onError: (error) => {
        if (globalShowError) {
          globalShowError(error.message || 'Operation failed');
        }
      }
    }
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      if (globalShowError) {
        globalShowError(error.message || 'Action could not be completed');
      }
    }
  })
});

function ToastBridge({ children }) {
  const { showError } = useToast();
  React.useEffect(() => {
    globalShowError = showError;
    return () => {
      globalShowError = null;
    };
  }, [showError]);

  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <ToastProvider>
              <ToastBridge>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </ToastBridge>
            </ToastProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
