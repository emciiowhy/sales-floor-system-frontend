import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
];

function Leaderboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('daily');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentAgentId = localStorage.getItem('agentId');

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard(period);
      setLeaderboard(data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 min-h-11 px-2"
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Leaderboard</h1>
          </div>

          {/* Period Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors whitespace-nowrap min-h-11 ${
                  period === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No activity yet for this period</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-border">
                    <th className="text-left py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">Agent</th>
                    <th className="text-center py-3 px-4 font-semibold">HOT</th>
                    <th className="text-center py-3 px-4 font-semibold">WARM</th>
                    <th className="text-center py-3 px-4 font-semibold">INT</th>
                    <th className="text-center py-3 px-4 font-semibold">Productive</th>
                    <th className="text-center py-3 px-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((agent) => (
                    <tr
                      key={agent.agentId}
                      className={`border-b border-gray-100 dark:border-dark-border transition-colors ${
                        agent.agentId === currentAgentId
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(agent.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">
                          {agent.agentName}
                          {agent.agentId === currentAgentId && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-1 bg-hot/10 text-hot rounded-full font-semibold">
                          {agent.hot}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-1 bg-warm/10 text-warm rounded-full font-semibold">
                          {agent.warm}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-1 bg-int/10 text-int rounded-full font-semibold">
                          {agent.int}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-lg">
                        {agent.productive}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-400">
                        {agent.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
              {leaderboard.map((agent) => (
                <div
                  key={agent.agentId}
                  className={`p-4 rounded-lg border ${
                    agent.agentId === currentAgentId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-dark-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getRankIcon(agent.rank)}
                      <div>
                        <div className="font-semibold">{agent.agentName}</div>
                        {agent.agentId === currentAgentId && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">(You)</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{agent.productive}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Productive</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-hot/10 rounded">
                      <div className="text-lg font-bold text-hot">{agent.hot}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">HOT</div>
                    </div>
                    <div className="text-center p-2 bg-warm/10 rounded">
                      <div className="text-lg font-bold text-warm">{agent.warm}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">WARM</div>
                    </div>
                    <div className="text-center p-2 bg-int/10 rounded">
                      <div className="text-lg font-bold text-int">{agent.int}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">INT</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;