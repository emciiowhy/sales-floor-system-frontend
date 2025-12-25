import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Plus, TrendingUp, Copy, Check, FileText, Edit2, Save, X, Clock, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { useDarkMode } from '../hooks/useDarkMode';
import StockTicker from '../components/StockTicker';
import { formatPassUpForCopy } from '../utils/formatters';
import Logo from '../components/Logo';
import BreakReminder from '../components/BreakReminder';
import BioBreakTimer from '../components/BioBreakTimer';
import BreakTimer from '../components/BreakTimer';
import LeaderboardSidebar from '../components/LeaderboardSidebar';
import BreakSchedule from '../components/BreakSchedule';

function Dashboard() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();
  const [stats, setStats] = useState({
    hot: 0,
    warm: 0,
    int: 0,
    tihu: 0,
    wsmsnt: 0,
    total: 0,
    targetProgress: {
      productive: 0,
      productiveGoal: 8,
      productivePercent: 0,
      totalGoal: 10,
      totalPercent: 0
    }
  });
  const [recentPassUps, setRecentPassUps] = useState([]);
  const [customScript, setCustomScript] = useState('');
  const [editingScript, setEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState('');
  const [savingScript, setSavingScript] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showBreakSchedule, setShowBreakSchedule] = useState(false);

  const agentId = localStorage.getItem('agentId');
  const agentName = localStorage.getItem('agentName');

  const loadDashboard = useCallback(async () => {
    if (!agentId) {
      toast.error('No agent ID found. Please log in again.');
      navigate('/');
      return;
    }

    try {
      // Check if agent exists first
      let agentData;
      try {
        agentData = await api.getAgent(agentId);
      } catch (agentError) {
        // Check for 404 status or "not found" in error message (case insensitive)
        const isNotFound = agentError.status === 404 || 
                          agentError.message?.toLowerCase().includes('not found') ||
                          agentError.message?.toLowerCase().includes('404');
        
        if (isNotFound) {
          toast.error('Agent not found. Please log in again.');
          localStorage.removeItem('agentId');
          localStorage.removeItem('agentName');
          navigate('/');
          return;
        }
        throw agentError;
      }

      // Load stats and pass-ups in parallel
      const [statsData, passUpsData] = await Promise.allSettled([
        api.getAgentStats(agentId, 'daily'),
        api.getAgentPassUps(agentId, { limit: 5 })
      ]);

      // Handle stats
      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value);
      } else {
        console.warn('Failed to load stats:', statsData.reason);
        setStats({
          hot: 0,
          warm: 0,
          int: 0,
          tihu: 0,
          wsmsnt: 0,
          total: 0,
          targetProgress: {
            productive: 0,
            productiveGoal: 8,
            productivePercent: 0,
            totalGoal: 10,
            totalPercent: 0
          }
        });
      }

      // Handle pass-ups
      if (passUpsData.status === 'fulfilled' && passUpsData.value) {
        setRecentPassUps(passUpsData.value);
      } else {
        console.warn('Failed to load pass-ups:', passUpsData.reason);
        setRecentPassUps([]);
      }

      // Handle agent script
      const script = agentData?.customScript || '';
      setCustomScript(script);
      setEditedScript(script);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      
      // Check if it's a connection error
      if (error.isConnectionError) {
        toast.error('Backend server is not running. Please start the backend server.', {
          duration: 10000,
          description: 'Run: cd backend && npm run dev'
        });
      } else {
        toast.error('Failed to load dashboard: ' + (error.message || 'Unknown error'));
      }
      
      // Always set default stats to prevent null errors
      setStats({
        hot: 0,
        warm: 0,
        int: 0,
        tihu: 0,
        wsmsnt: 0,
        total: 0,
        targetProgress: {
          productive: 0,
          productiveGoal: 8,
          productivePercent: 0,
          totalGoal: 10,
          totalPercent: 0
        }
      });
      setRecentPassUps([]);
    } finally {
      setLoading(false);
    }
  }, [agentId, navigate]);

  useEffect(() => {
    loadDashboard();
    // Refresh every 60 seconds to reduce API calls
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-dark-bg dark:via-slate-900 dark:to-dark-bg pb-20">
      {/* Sticky Header with Glass Effect */}
      <div className="sticky top-0 z-50 glass-effect border-b border-gray-200/50 dark:border-dark-border/50 shadow-lg backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20"></div>
                <Logo className="relative w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent truncate">
                  {agentName}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Vici Sales Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 sm:p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 active:scale-95 min-h-11 min-w-11"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm min-h-11"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <StockTicker />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Break Reminder */}
            <BreakReminder />

            {/* Bio Break Timer */}
            <BioBreakTimer agentId={agentId} />

            {/* Break Timer */}
            <BreakTimer agentId={agentId} />

            {/* Stats Card */}
            <div className="card group">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Today's Performance
                </h2>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
              <StatBadge label="HOT" value={stats.hot || 0} color="bg-hot" />
              <StatBadge label="WARM" value={stats.warm || 0} color="bg-warm" />
              <StatBadge label="INT" value={stats.int || 0} color="bg-int" />
              <StatBadge label="TIHU" value={stats.tihu || 0} color="bg-tihu" />
              <StatBadge label="WSMSNT" value={stats.wsmsnt || 0} color="bg-wsmsnt" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Productive Pass-Ups</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.targetProgress?.productive || 0} / {stats.targetProgress?.productiveGoal || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.targetProgress?.productivePercent || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {(stats.targetProgress?.productiveGoal || 0) - (stats.targetProgress?.productive || 0) > 0 
                  ? `${(stats.targetProgress?.productiveGoal || 0) - (stats.targetProgress?.productive || 0)} more to reach target`
                  : '🎉 Target reached!'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Pass-Ups Today</span>
                <span className="text-2xl font-bold">{stats.total || 0}</span>
              </div>
            </div>
          </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/passup')}
                className="card-hover group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg mb-1">New Pass-Up</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Submit a new lead</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/leaderboard')}
                className="card-hover group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg mb-1">Full Leaderboard</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">View all rankings</p>
                  </div>
                </div>
              </button>
            </div>

        {/* Script Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Sales Script
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {editingScript ? (
                <>
                  <button
                    onClick={handleSaveScript}
                    disabled={savingScript}
                    className="btn-primary flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50 py-2 px-3 sm:py-2.5 sm:px-4 min-h-10"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingScript ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={savingScript}
                    className="btn-secondary flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50 py-2 px-3 sm:py-2.5 sm:px-4 min-h-10"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditScript}
                    className="btn-secondary flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:py-2.5 sm:px-4 min-h-10"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  {customScript && (
                    <button
                      onClick={handleCopyScript}
                      className="btn-secondary flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:py-2.5 sm:px-4 min-h-10"
                    >
                      {scriptCopied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="hidden sm:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="hidden sm:inline">Copy</span>
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
              className="w-full input resize-none font-mono text-sm"
              rows={15}
              disabled={savingScript}
              placeholder="Enter your sales script here..."
            />
          ) : customScript ? (
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-dark-bg dark:to-slate-800 rounded-xl p-6 border border-gray-200 dark:border-dark-border shadow-inner">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 overflow-x-auto leading-relaxed">
                {customScript}
              </pre>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-dark-bg dark:to-slate-800 rounded-xl p-12 border-2 border-dashed border-gray-300 dark:border-dark-border text-center">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 font-medium">No script saved yet</p>
              <button
                onClick={handleEditScript}
                className="btn-primary"
              >
                Add Script
              </button>
            </div>
          )}
        </div>

            {/* Recent Pass-Ups */}
            {recentPassUps.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Recent Pass-Ups
                  </h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  {recentPassUps.map((passUp) => (
                    <div
                      key={passUp.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white dark:from-dark-bg dark:to-slate-800 rounded-xl border border-gray-200 dark:border-dark-border hover:shadow-md hover:scale-[1.01] transition-all duration-200 group"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{passUp.leadName}</span>
                          <DispositionBadge disposition={passUp.disposition} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(passUp.date).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(passUp)}
                        className="p-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedId === passUp.id ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Leaderboard Sidebar */}
            <LeaderboardSidebar period="daily" limit={5} />

            {/* Break Schedule & Targets */}
            <div className="card">
              <button
                onClick={() => setShowBreakSchedule(!showBreakSchedule)}
                className="w-full flex items-center justify-between mb-6 text-left hover:opacity-80 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Break Schedule & Targets
                  </h2>
                </div>
                {showBreakSchedule ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                )}
              </button>

              {showBreakSchedule && (
                <div className="space-y-4">
                  {/* Break Schedule Component */}
                  <BreakSchedule agentId={agentId} />

                  {/* Agent Targets */}
                  <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-md font-bold">Agent Targets</h3>
                    </div>
                    <div className="space-y-4">
                      {/* Daily Targets */}
                      <div>
                        <h3 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">Daily Targets</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <span className="text-sm">HOT, WARM, INT:</span>
                            <span className="text-sm font-semibold">8 total per day</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-dark-bg rounded-lg">
                            <span className="text-sm">Pass Up Total:</span>
                            <span className="text-sm font-semibold">10+ per day</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            (WSMSNT, TIHU, HOT, WARM, INT)
                          </p>
                        </div>
                      </div>

                      {/* Bonus Targets */}
                      <div className="pt-3 border-t border-gray-200 dark:border-dark-border">
                        <h3 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">Bonus Targets (10K Bonus)</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <span className="text-sm">Daily (HOT, WARM, INT):</span>
                            <span className="text-sm font-semibold">8 total</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <span className="text-sm">Weekly:</span>
                            <span className="text-sm font-semibold">40</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <span className="text-sm">Bi-weekly:</span>
                            <span className="text-sm font-semibold">60</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <span className="text-sm">Monthly:</span>
                            <span className="text-sm font-semibold">100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatBadge = memo(function StatBadge({ label, value, color }) {
  return (
    <div className="stat-card text-center group hover:scale-105 transition-transform duration-200">
      <div className={`w-4 h-4 ${color} rounded-full mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow`}></div>
      <div className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</div>
    </div>
  );
});

const DispositionBadge = memo(function DispositionBadge({ disposition }) {
  const colors = useMemo(() => ({
    HOT: 'bg-hot text-white shadow-sm',
    WARM: 'bg-warm text-white shadow-sm',
    INT: 'bg-int text-white shadow-sm',
    TIHU: 'bg-tihu text-white shadow-sm',
    WSMSNT: 'bg-wsmsnt text-white shadow-sm'
  }), []);

  return (
    <span className={`badge ${colors[disposition] || 'bg-gray-500 text-white'} font-semibold`}>
      {disposition}
    </span>
  );
});

export default Dashboard;