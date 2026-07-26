import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// Global Fetch Interceptor to bypass Localtunnel landing page for all API calls
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const newInit = { ...init };
  const headers = new Headers(newInit.headers || {});
  headers.set('bypass-tunnel-reminder', 'true');
  newInit.headers = headers;
  return originalFetch(input, newInit);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
