import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

function AgentDetail() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentDetails();
  }, [agentId]);

  const loadAgentDetails = async () => {
    try {
      const [agentData, statsData] = await Promise.all([
        api.getAgent(agentId),
        api.getAgentStats(agentId, 'daily')
      ]);
      setAgent(agentData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load agent details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Agent not found</p>
          <button onClick={() => navigate('/leaderboard')} className="btn-primary">
            Back to Leaderboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Leaderboard</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">Agent ID: {agent.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          <div className="card text-center">
            <div className="w-4 h-4 bg-hot rounded-full mx-auto mb-2"></div>
            <div className="text-3xl font-bold text-hot">{stats?.hot || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">HOT</div>
          </div>
          <div className="card text-center">
            <div className="w-4 h-4 bg-warm rounded-full mx-auto mb-2"></div>
            <div className="text-3xl font-bold text-warm">{stats?.warm || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">WARM</div>
          </div>
          <div className="card text-center">
            <div className="w-4 h-4 bg-int rounded-full mx-auto mb-2"></div>
            <div className="text-3xl font-bold text-int">{stats?.int || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">INT</div>
          </div>
          <div className="card text-center">
            <div className="w-4 h-4 bg-tihu rounded-full mx-auto mb-2"></div>
            <div className="text-3xl font-bold text-tihu">{stats?.tihu || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">TIHU</div>
          </div>
          <div className="card text-center">
            <div className="w-4 h-4 bg-wsmsnt rounded-full mx-auto mb-2"></div>
            <div className="text-3xl font-bold text-wsmsnt">{stats?.wsmsnt || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">WSMSNT</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold">Performance</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Productive Leads</span>
                  <span className="font-bold">{stats?.targetProgress?.productive || 0}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(stats?.targetProgress?.productivePercent || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Calls</span>
                  <span className="font-bold">{stats?.total || 0} / {stats?.targetProgress?.totalGoal || 10}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((stats?.total || 0) / (stats?.targetProgress?.totalGoal || 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold">Today's Summary</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Pass-Ups:</span>
                <span className="font-bold">{stats?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Productive:</span>
                <span className="font-bold">{stats?.targetProgress?.productive || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                <span className="font-bold">{Math.round(stats?.targetProgress?.productivePercent || 0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentDetail;