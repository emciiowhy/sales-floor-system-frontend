import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

function LeaderboardSidebar({ period = 'daily', limit = 5 }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentAgentId = localStorage.getItem('agentId');

  useEffect(() => {
    loadLeaderboard();
    // Refresh every 60 seconds to reduce API calls
    const interval = setInterval(loadLeaderboard, 60000);
    return () => clearInterval(interval);
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard(period);
      setLeaderboard(data.slice(0, limit));
    } catch (error) {
      if (!error.isConnectionError) {
        console.error('Failed to load leaderboard:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return <span className="text-sm font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold">Leaderboard</h2>
        </div>
        <div className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold">Leaderboard</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Leaderboard
          </h2>
        </div>
        <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">{period}</span>
      </div>
      
      <div className="space-y-3">
        {leaderboard.map((agent) => (
          <div
            key={agent.agentId}
            className={`p-4 rounded-xl transition-all duration-200 ${
              agent.agentId === currentAgentId
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-md'
                : 'bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-dark-border hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getRankIcon(agent.rank)}
                </div>
                <div>
                  <span className="font-semibold text-sm block">
                    {agent.agentName}
                  </span>
                  {agent.agentId === currentAgentId && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">You</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="badge bg-hot/10 text-hot border-hot/20 text-xs">
                  {agent.hot}
                </span>
                <span className="badge bg-warm/10 text-warm border-warm/20 text-xs">
                  {agent.warm}
                </span>
                <span className="badge bg-int/10 text-int border-int/20 text-xs">
                  {agent.int}
                </span>
              </div>
              <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                {agent.productive}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeaderboardSidebar;

