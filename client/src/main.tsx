import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// Global Fetch Interceptor to bypass Localtunnel landing page and handle HTML redirects gracefully
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const newInit = { ...init };
  const headers = new Headers(newInit.headers || {});
  headers.set('bypass-tunnel-reminder', 'true');
  newInit.headers = headers;

  try {
    const response = await originalFetch(input, newInit);
    const url = typeof input === 'string' 
      ? input 
      : (input instanceof URL ? input.toString() : (input as any).url || '');

    if (url.includes('/api/')) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const errorJson = JSON.stringify({
          error: 'API Configuration Error: The server returned HTML instead of JSON. This usually means your VITE_API_BASE_URL environment variable is pointing to your frontend URL instead of the backend server. Please verify your environment variables on Netlify/Vercel and trigger a new build.'
        });
        return new Response(errorJson, {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return response;
  } catch (err) {
    const errorJson = JSON.stringify({
      error: 'Network Error: Unable to connect to the backend server. Please verify that your API server is online and active.'
    });
    return new Response(errorJson, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
