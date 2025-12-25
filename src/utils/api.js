// Get API URL from environment variable
// In Vercel, set VITE_API_URL to your Render backend URL (e.g., https://your-backend.onrender.com)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Validate API URL in production
if (import.meta.env.PROD && !API_URL) {
  console.error('❌ VITE_API_URL environment variable is not set in Vercel!');
  console.error('Please set VITE_API_URL in Vercel project settings to your Render backend URL.');
}

// Simple cache implementation with expiration
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

function getCacheKey(endpoint, options) {
  return `${endpoint}:${JSON.stringify(options || {})}`;
}

function getCachedResponse(endpoint, options) {
  const key = getCacheKey(endpoint, options);
  const cached = requestCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  if (cached) {
    requestCache.delete(key);
  }
  
  return null;
}

function setCachedResponse(endpoint, options, data) {
  const key = getCacheKey(endpoint, options);
  requestCache.set(key, { data, timestamp: Date.now() });
}

async function fetchAPI(endpoint, options = {}) {
  const fullUrl = `${API_URL}${endpoint}`;
  
  // Only cache GET requests
  if (!options.method || options.method === 'GET') {
    const cached = getCachedResponse(endpoint, options);
    if (cached) {
      console.log(`✅ Using cached response for ${endpoint}`);
      return cached;
    }
  }
  
  try {
    const response = await fetch(fullUrl, {
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

    const data = await response.json();
    
    // Cache GET requests
    if (!options.method || options.method === 'GET') {
      setCachedResponse(endpoint, options, data);
    }
    
    return data;
  } catch (error) {
    // Handle network errors (connection refused, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const connectionError = new Error('Backend server is not running. Please start the backend server.');
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
