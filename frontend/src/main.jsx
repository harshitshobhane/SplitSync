import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
    },
    {
      path: '/invite/:token',
      element: <App />, // Will be handled in App.jsx
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
)

function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

// Mount the app to the DOM
const container = document.getElementById('root')
if (!container) {
  throw new Error('Failed to find the root container')
}

// Simple approach: always create a new root to avoid context issues
if (container._reactRootContainer) {
  container._reactRootContainer.unmount()
  delete container._reactRootContainer
}

const root = createRoot(container)
root.render(<Root />)
container._reactRootContainer = root

// Service Worker is auto-registered by VitePWA plugin
// No manual registration needed
