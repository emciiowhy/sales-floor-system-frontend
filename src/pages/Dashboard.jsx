import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Plus, TrendingUp, Copy, Check, FileText, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { useDarkMode } from '../hooks/useDarkMode';
import StockTicker from '../components/StockTicker';
import { formatPassUpForCopy } from '../utils/formatters';
import Logo from '../components/Logo';

function Dashboard() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();
  const [stats, setStats] = useState(null);
  const [recentPassUps, setRecentPassUps] = useState([]);
  const [customScript, setCustomScript] = useState('');
  const [editingScript, setEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState('');
  const [savingScript, setSavingScript] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [scriptCopied, setScriptCopied] = useState(false);

  const agentId = localStorage.getItem('agentId');
  const agentName = localStorage.getItem('agentName');

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, passUpsData, agentData] = await Promise.all([
        api.getAgentStats(agentId, 'daily'),
        api.getAgentPassUps(agentId, { limit: 5 }),
        api.getAgent(agentId)
      ]);
      setStats(statsData);
      setRecentPassUps(passUpsData);
      const script = agentData.customScript || '';
      setCustomScript(script);
      setEditedScript(script);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agentId');
    localStorage.removeItem('agentName');
    navigate('/');
  };

  const handleCopy = async (passUp) => {
    const text = formatPassUpForCopy(passUp);
    await navigator.clipboard.writeText(text);
    setCopiedId(passUp.id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyScript = async () => {
    if (customScript) {
      await navigator.clipboard.writeText(customScript);
      setScriptCopied(true);
      toast.success('Script copied to clipboard!');
      setTimeout(() => setScriptCopied(false), 2000);
    }
  };

  const handleEditScript = () => {
    setEditingScript(true);
    setEditedScript(customScript);
  };

  const handleCancelEdit = () => {
    setEditingScript(false);
    setEditedScript(customScript);
  };

  const handleSaveScript = async () => {
    setSavingScript(true);
    try {
      await api.updateAgent(agentId, { customScript: editedScript.trim() });
      setCustomScript(editedScript.trim());
      setEditingScript(false);
      toast.success('Script saved successfully!');
    } catch (error) {
      toast.error('Failed to save script: ' + error.message);
    } finally {
      setSavingScript(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold">{agentName}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vici Sales Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          </div>

          <StockTicker />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Card */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Today's Performance</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <StatBadge label="HOT" value={stats.hot} color="bg-hot" />
            <StatBadge label="WARM" value={stats.warm} color="bg-warm" />
            <StatBadge label="INT" value={stats.int} color="bg-int" />
            <StatBadge label="TIHU" value={stats.tihu} color="bg-tihu" />
            <StatBadge label="WSMSNT" value={stats.wsmsnt} color="bg-wsmsnt" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Productive Pass-Ups</span>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.targetProgress.productive} / {stats.targetProgress.productiveGoal}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.targetProgress.productivePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {stats.targetProgress.productiveGoal - stats.targetProgress.productive > 0 
                ? `${stats.targetProgress.productiveGoal - stats.targetProgress.productive} more to reach target`
                : '🎉 Target reached!'}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Pass-Ups Today</span>
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/passup')}
            className="card hover:shadow-md transition-shadow cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">New Pass-Up</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submit a new lead</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="card hover:shadow-md transition-shadow cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold">Leaderboard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View rankings</p>
              </div>
            </div>
          </button>
        </div>

        {/* Script Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold">Sales Script</h2>
            </div>
            <div className="flex items-center gap-2">
              {editingScript ? (
                <>
                  <button
                    onClick={handleSaveScript}
                    disabled={savingScript}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingScript ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={savingScript}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditScript}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  {customScript && (
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {scriptCopied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          {editingScript ? (
            <textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              className="w-full input resize-none font-mono text-xs"
              rows={20}
              disabled={savingScript}
              placeholder="Enter your sales script here..."
            />
          ) : customScript ? (
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                {customScript}
              </pre>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 border border-gray-200 dark:border-dark-border text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No script saved yet</p>
              <button
                onClick={handleEditScript}
                className="btn-primary text-sm"
              >
                Add Script
              </button>
            </div>
          )}
        </div>

        {/* Recent Pass-Ups */}
        {recentPassUps.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Recent Pass-Ups</h2>
            <div className="space-y-2">
              {recentPassUps.map((passUp) => (
                <div
                  key={passUp.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{passUp.leadName}</span>
                      <DispositionBadge disposition={passUp.disposition} />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(passUp.date).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(passUp)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copiedId === passUp.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
      <div className={`w-3 h-3 ${color} rounded-full mx-auto mb-1`}></div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}

function DispositionBadge({ disposition }) {
  const colors = {
    HOT: 'bg-hot text-white',
    WARM: 'bg-warm text-white',
    INT: 'bg-int text-white',
    TIHU: 'bg-tihu text-white',
    WSMSNT: 'bg-wsmsnt text-white'
  };

  return (
    <span className={`text-xs px-2 py-1 rounded font-medium ${colors[disposition]}`}>
      {disposition}
    </span>
  );
}

export default Dashboard;