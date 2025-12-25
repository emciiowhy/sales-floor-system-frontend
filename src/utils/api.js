// Get API URL from environment variable
// In Vercel, set VITE_API_URL to your Render backend URL (e.g., https://your-backend.onrender.com)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Validate API URL in production
if (import.meta.env.PROD && !API_URL) {
  console.error('❌ VITE_API_URL environment variable is not set in Vercel!');
  console.error('Please set VITE_API_URL in Vercel project settings to your Render backend URL.');
}

async function fetchAPI(endpoint, options = {}) {
  // #region agent log
  const fullUrl = `${API_URL}${endpoint}`;
  fetch('http://127.0.0.1:7242/ingest/50295095-33be-4fbf-84c4-816f69fcce29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:11',message:'fetchAPI entry',data:{endpoint,fullUrl,apiUrl:API_URL,method:options.method||'GET'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50295095-33be-4fbf-84c4-816f69fcce29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:14',message:'Before fetch',data:{fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50295095-33be-4fbf-84c4-816f69fcce29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:25',message:'After fetch',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = error.error || 'Request failed';
      const apiError = new Error(errorMessage);
      apiError.status = response.status;
      apiError.statusText = response.statusText;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50295095-33be-4fbf-84c4-816f69fcce29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:33',message:'Response not OK',data:{status:response.status,errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw apiError;
    }

    return response.json();
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50295095-33be-4fbf-84c4-816f69fcce29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:37',message:'fetchAPI catch',data:{errorName:error.name,errorMessage:error.message,isConnectionError:error.isConnectionError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Handle network errors (connection refused, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const connectionError = new Error('Backend server is not running. Please start the backend server on port 3001.');
      connectionError.isConnectionError = true;
      connectionError.originalError = error;
      throw connectionError;
    }
    throw error;
  }
}

export const api = {
  // Agents
  createOrGetAgent: (name) => 
    fetchAPI('/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getAgent: (id) => fetchAPI(`/api/agents/${id}`),

  updateAgent: (id, data) =>
    fetchAPI(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Pass-ups
  createPassUp: (data) =>
    fetchAPI('/api/passups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAgentPassUps: (agentId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/api/passups/agent/${agentId}${query ? `?${query}` : ''}`);
  },

  getAgentStats: (agentId, period = 'daily') =>
    fetchAPI(`/api/passups/agent/${agentId}/stats?period=${period}`),

  // Leaderboard
  getLeaderboard: (period = 'daily') =>
    fetchAPI(`/api/leaderboard?period=${period}`),

  // Stock
  getStockQuote: (symbol = 'QTZM') =>
    fetchAPI(`/api/stock/quote?symbol=${symbol}`),

  // Breaks
  startBreak: (agentId, type) =>
    fetchAPI('/api/breaks', {
      method: 'POST',
      body: JSON.stringify({ agentId, type }),
    }),

  endBreak: (breakId) =>
    fetchAPI(`/api/breaks/${breakId}`, {
      method: 'PATCH',
    }),

  getTodayBreaks: (agentId) =>
    fetchAPI(`/api/breaks/agent/${agentId}/today`),

  // Break Schedules
  getBreakSchedule: (agentId) =>
    fetchAPI(`/api/break-schedules/agent/${agentId}`),

  updateBreakSchedule: (agentId, data) =>
    fetchAPI(`/api/break-schedules/agent/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};