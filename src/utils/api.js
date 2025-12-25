// Get API URL from environment variable
// In Vercel, set VITE_API_URL to your Render backend URL (e.g., https://your-backend.onrender.com)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Validate API URL in production
if (import.meta.env.PROD && !API_URL) {
  console.error('❌ VITE_API_URL environment variable is not set in Vercel!');
  console.error('Please set VITE_API_URL in Vercel project settings to your Render backend URL.');
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = error.error || 'Request failed';
      const apiError = new Error(errorMessage);
      apiError.status = response.status;
      apiError.statusText = response.statusText;
      throw apiError;
    }

    return response.json();
  } catch (error) {
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