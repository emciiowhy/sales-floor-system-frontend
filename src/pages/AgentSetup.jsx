import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../utils/api';
import Logo from '../components/Logo';
import { Trash2, LogIn } from 'lucide-react';

function AgentSetup() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentAgents, setRecentAgents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard immediately
    const agentId = localStorage.getItem('agentId');
    if (agentId) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Load recent agents from localStorage
    const stored = localStorage.getItem('recentAgents');
    if (stored) {
      try {
        setRecentAgents(JSON.parse(stored));
      } catch (e) {
        console.log('Failed to parse recent agents');
      }
    }
  }, [navigate]);

  // Store agent in recent list
  const addToRecentAgents = useCallback((agentName) => {
    setRecentAgents(prev => {
      // Remove duplicates and add to front
      const filtered = prev.filter(a => a.name !== agentName);
      const updated = [{ name: agentName, timestamp: new Date().toISOString() }, ...filtered];
      // Keep only last 5 agents
      const limited = updated.slice(0, 5);
      localStorage.setItem('recentAgents', JSON.stringify(limited));
      return limited;
    });
  }, []);

  // Remove agent from recent list
  const removeFromRecentAgents = useCallback((agentName) => {
    setRecentAgents(prev => {
      const filtered = prev.filter(a => a.name !== agentName);
      localStorage.setItem('recentAgents', JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  // Quick login with recent agent name
  const handleQuickLogin = useCallback(async (agentName) => {
    setLoading(true);
    try {
      const agent = await api.createOrGetAgent(agentName.trim());
      localStorage.setItem('agentId', agent.id);
      localStorage.setItem('agentName', agent.name);
      
      // Add to recent agents
      addToRecentAgents(agent.name);
      
      // Prefetch dashboard data in background
      prefetchDashboardData(agent.id);
      
      toast.success(`Welcome back, ${agent.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Failed to login: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, addToRecentAgents]);

  // Prefetch dashboard data in background
  const prefetchDashboardData = useCallback(async (agentId) => {
    try {
      // Start loading data in background without blocking navigation
      Promise.allSettled([
        api.getAgent(agentId),
        api.getAgentStats(agentId, 'daily'),
        api.getAgentPassUps(agentId, { limit: 5 }),
        api.getTodayBreaks(agentId)
      ]).then(results => {
        // Cache in sessionStorage for faster dashboard load
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const keys = ['agent', 'stats', 'passups', 'breaks'];
            sessionStorage.setItem(`prefetch_${keys[index]}`, JSON.stringify(result.value));
          }
        });
      });
    } catch (error) {
      // Prefetch errors are non-blocking
      console.log('Prefetch error (non-blocking):', error);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const agent = await api.createOrGetAgent(name.trim());
      localStorage.setItem('agentId', agent.id);
      localStorage.setItem('agentName', agent.name);
      
      // Add to recent agents
      addToRecentAgents(agent.name);
      
      // Prefetch dashboard data in background
      prefetchDashboardData(agent.id);
      
      toast.success(`Welcome, ${agent.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Failed to create agent: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="w-20 h-20" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Agent Pass UP Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Enter your name to get started! (ex. Rocky Knox) </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input"
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Setting up...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Lets GO!
              </>
            )}
          </button>
        </form>

        {/* Recent Agents */}
        {recentAgents.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Quick Login
            </p>
            <div className="space-y-2">
              {recentAgents.map((agent, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all group"
                >
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(agent.name)}
                    disabled={loading}
                    className="flex-1 text-left flex items-center gap-2 min-w-0 disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {agent.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromRecentAgents(agent.name)}
                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from recent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Your name will be used to track your performance</p>
        </div>
      </div>
    </div>
  );
}

export default AgentSetup;
