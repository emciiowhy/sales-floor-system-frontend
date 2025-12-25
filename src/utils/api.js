const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
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