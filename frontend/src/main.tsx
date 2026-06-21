import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@/styles/global.scss';
import { AppRouter } from './router/AppRouter';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Fail fast in production if the API URL is not configured.
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  throw new Error(
    'VITE_API_URL is not set. Build the frontend with VITE_API_URL pointing to the backend API (e.g. https://your-api.example.com/api).'
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{ duration: 3500 }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
