import { useState, useEffect, useMemo, useCallback, memo, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Plus, TrendingUp, Copy, Check, FileText, Edit2, Save, X, Clock, Target, ChevronDown, ChevronUp, Search, Download, ArrowUp, Trash2 } from 'lucide-react';
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
import SkeletonLoader from '../components/SkeletonLoader';
import Chat from '../components/Chat';

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
  const [selectedDisposition, setSelectedDisposition] = useState(null);
  const [dispositionPassUps, setDispositionPassUps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [editingPassUp, setEditingPassUp] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingPassUp, setSavingPassUp] = useState(false);
  const scrollRef = useRef(null);

  const agentId = localStorage.getItem('agentId');
  const agentName = localStorage.getItem('agentName');

  const loadDashboard = useCallback(async () => {
    if (!agentId) {
      toast.error('No agent ID found. Please log in again.');
      navigate('/');
      return;
    }

    try {
      // Try to load cached data first for instant display
      const cachedStats = sessionStorage.getItem('prefetch_stats');
      const cachedPassups = sessionStorage.getItem('prefetch_passups');
      const cachedAgent = sessionStorage.getItem('prefetch_agent');

      if (cachedStats) {
        try {
          setStats(JSON.parse(cachedStats));
        } catch (e) {
          console.log('Failed to parse cached stats');
        }
      }
      if (cachedPassups) {
        try {
          setRecentPassUps(JSON.parse(cachedPassups));
        } catch (e) {
          console.log('Failed to parse cached passups');
        }
      }
      if (cachedAgent) {
        try {
          const agent = JSON.parse(cachedAgent);
          setCustomScript(agent.customScript || '');
          setEditedScript(agent.customScript || '');
        } catch (e) {
          console.log('Failed to parse cached agent');
        }
      }

      // Check if agent exists
      let agentData;
      try {
        agentData = await api.getAgent(agentId);
      } catch (agentError) {
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
        sessionStorage.setItem('prefetch_stats', JSON.stringify(statsData.value));
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
        sessionStorage.setItem('prefetch_passups', JSON.stringify(passUpsData.value));
      } else {
        console.warn('Failed to load pass-ups:', passUpsData.reason);
        setRecentPassUps([]);
      }

      // Handle agent script
      const script = agentData?.customScript || '';
      setCustomScript(script);
      setEditedScript(script);
      sessionStorage.setItem('prefetch_agent', JSON.stringify(agentData));
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

  const handleDeletePassUp = async (passUp) => {
    if (!window.confirm(`Are you sure you want to delete the pass-up for ${passUp.leadName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deletePassUp(passUp.id, agentId);
      setDispositionPassUps(prev => prev.filter(p => p.id !== passUp.id));
      toast.success('Pass-up deleted successfully!');
      
      // Refresh stats after deletion
      try {
        const updatedStats = await api.getAgentStats(agentId, 'daily');
        setStats(updatedStats);
        sessionStorage.setItem('prefetch_stats', JSON.stringify(updatedStats));
      } catch (statsError) {
        console.error('Failed to refresh stats:', statsError);
      }
    } catch (error) {
      toast.error('Failed to delete pass-up: ' + error.message);
    }
  };

  const handleEditPassUp = (passUp) => {
    setEditingPassUp(passUp.id);
    setEditFormData({
      ticker: passUp.ticker || '',
      leadName: passUp.leadName || '',
      interestedIn: passUp.interestedIn || '',
      agreedToSMS: passUp.agreedToSMS || false,
      disposition: passUp.disposition || '',
      notes: passUp.notes || '',
      tickerPrice: passUp.tickerPrice || ''
    });
  };

  const handleSavePassUp = async () => {
    if (!editFormData.leadName.trim()) {
      toast.error('Lead name is required');
      return;
    }

    if (!editFormData.disposition) {
      toast.error('Disposition is required');
      return;
    }

    setSavingPassUp(true);
    try {
      const updatedPassUp = await api.updatePassUp(editingPassUp, editFormData, agentId);
      setDispositionPassUps(prev =>
        prev.map(p => p.id === editingPassUp ? updatedPassUp : p)
      );
      setEditingPassUp(null);
      setEditFormData({});
      toast.success('Pass-up updated successfully!');
      
      // Refresh stats after update
      try {
        const updatedStats = await api.getAgentStats(agentId, 'daily');
        setStats(updatedStats);
        sessionStorage.setItem('prefetch_stats', JSON.stringify(updatedStats));
      } catch (statsError) {
        console.error('Failed to refresh stats:', statsError);
      }
    } catch (error) {
      toast.error('Failed to update pass-up: ' + error.message);
    } finally {
      setSavingPassUp(false);
    }
  };

  const handleCancelEditPassUp = () => {
    setEditingPassUp(null);
    setEditFormData({});
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

  const handleViewDisposition = async (disposition) => {
    try {
      const data = await api.getAgentPassUps(agentId, { limit: 100 });
      // Filter pass-ups by exact disposition match
      const filtered = data.filter(p => p.disposition === disposition);
      setDispositionPassUps(filtered);
      setSelectedDisposition(disposition);
    } catch (error) {
      toast.error(`Failed to load ${disposition} pass-ups: ` + error.message);
    }
  };

  // Filter and sort pass-ups
  const filteredAndSortedPassUps = useMemo(() => {
    let filtered = dispositionPassUps.filter(p => 
      !searchQuery || 
      p.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phoneNumber?.includes(searchQuery)
    );

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''));
    }

    return filtered;
  }, [dispositionPassUps, searchQuery, sortBy]);

  // Export as CSV
  const handleExportCSV = () => {
    if (filteredAndSortedPassUps.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Name', 'Disposition', 'Phone', 'Notes', 'Time'];
    const rows = filteredAndSortedPassUps.map(p => [
      p.customerName || 'N/A',
      p.disposition,
      p.phoneNumber || 'N/A',
      p.notes || 'N/A',
      new Date(p.createdAt).toLocaleString()
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDisposition}_leads_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Exported successfully!');
  };

  // Scroll to top button handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && selectedDisposition) {
        handleCloseDispositionModal();
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Focus search input
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDisposition]);

  const getMotivationalQuote = (disposition) => {
    const quotes = {
      HOT: {
        emoji: '🔥',
        title: 'No Hot Leads Yet',
        message: 'Time to turn up the heat! Make those calls and close some hot prospects today!',
        subtitle: '💪 You got this!'
      },
      WARM: {
        emoji: '☀️',
        title: 'No Warm Leads Yet',
        message: 'Keep the momentum going! Every warm lead is a potential sale waiting to happen.',
        subtitle: '🚀 Push forward!'
      },
      INT: {
        emoji: '💭',
        title: 'No Interested Leads Yet',
        message: 'Interest is just a step away! Keep qualifying and educating your prospects.',
        subtitle: '📞 Stay focused!'
      },
      TIHU: {
        emoji: '🎯',
        title: 'No TIHU Leads Yet',
        message: 'Think about what makes a great lead! Time to make those connections count.',
        subtitle: '✨ Excellence awaits!'
      },
      WSMSNT: {
        emoji: '⏰',
        title: 'No WSMSNT Leads Yet',
        message: 'Will Sell More Specifically Next Time - keep learning and improving!',
        subtitle: '📈 Growth is coming!'
      }
    };
    return quotes[disposition] || quotes.HOT;
  };

  const handleCloseDispositionModal = () => {
    setSelectedDisposition(null);
    setDispositionPassUps([]);
  };

  if (loading) {
    return <SkeletonLoader />;
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
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-800 dark:via-blue-700 dark:to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome back, {agentName.split(' ')[0]}!</h1>
            <p className="text-blue-100 text-base sm:text-lg max-w-2xl">
              You're doing amazing! Keep up the momentum and hit your targets today. 
            </p>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Pass-Ups Card */}
            <div className="card group bg-white dark:bg-slate-900 hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Pass-Ups</p>
                  <p className="text-4xl font-bold mt-1 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {stats.total || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{stats.targetProgress?.productive || 0}</span> productive leads
                </p>
              </div>
            </div>

            {/* Productive Progress Card */}
            <div className="card group bg-white dark:bg-slate-900 hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Progress</p>
                  <p className="text-4xl font-bold mt-1 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                    {Math.round(stats.targetProgress?.productivePercent || 0)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.targetProgress?.productivePercent || 0, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {(stats.targetProgress?.productiveGoal || 0) - (stats.targetProgress?.productive || 0) > 0 
                    ? `${(stats.targetProgress?.productiveGoal || 0) - (stats.targetProgress?.productive || 0)} more to goal`
                    : '✓ Goal reached!'}
                </p>
              </div>
            </div>

            {/* LeaderBoard Quick Access */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="card group bg-gradient-to-br from-yellow-400 to-orange-500 hover:shadow-xl transition-all text-white cursor-pointer border-0"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-orange-100">Full Leaderboard</p>
                  <p className="text-3xl font-bold mt-1">View All</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-4 border-t border-orange-300/30">
                <p className="text-xs text-orange-100">
                  See how you rank
                </p>
              </div>
            </button>
          </div>

          {/* Disposition Breakdown Row */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Disposition Breakdown
              </span>
              <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full max-w-xs"></div>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <StatBadge label="HOT" value={stats.hot || 0} color="bg-hot" onClick={() => handleViewDisposition('HOT')} />
              <StatBadge label="WARM" value={stats.warm || 0} color="bg-warm" onClick={() => handleViewDisposition('WARM')} />
              <StatBadge label="INT" value={stats.int || 0} color="bg-int" onClick={() => handleViewDisposition('INT')} />
              <StatBadge label="TIHU" value={stats.tihu || 0} color="bg-tihu" onClick={() => handleViewDisposition('TIHU')} />
              <StatBadge label="WSMSNT" value={stats.wsmsnt || 0} color="bg-wsmsnt" onClick={() => handleViewDisposition('WSMSNT')} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Pass-Ups and Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* New Pass-Up Action */}
              <button
                onClick={() => navigate('/passup')}
                className="card-hover group relative overflow-hidden w-full text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg mb-1">New Pass-Up</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Submit a fresh lead</p>
                  </div>
                  <ChevronUp className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Sales Script Section */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
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
                    rows={10}
                    disabled={savingScript}
                    placeholder="Enter your sales script here..."
                  />
                ) : customScript ? (
                  <div className="bg-gradient-to-br from-gray-50 to-white dark:from-dark-bg dark:to-slate-800 rounded-xl p-6 border border-gray-200 dark:border-dark-border shadow-inner max-h-64 overflow-y-auto">
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
            </div>

            {/* Right Column - Breaks and Chat */}
            <div className="space-y-6">
              {/* Break Schedule Card */}
              <div className="card p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-700 dark:to-indigo-800 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Break Schedule
                  </h3>
                </div>
                <div className="p-6">
                  <BreakSchedule />
                </div>
              </div>
            </div>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
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

          {/* Break Timers Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BioBreakTimer agentId={agentId} />
            <BreakTimer agentId={agentId} />
          </div>

          {/* Team Chat */}
          <div className="h-96">
            <Chat agentId={agentId} agentName={agentName} />
          </div>

          {/* Disclaimer */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-800 dark:to-red-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-red-500/50 dark:border-red-700/50">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">⚠️</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  EXCLUSIVE TO VICI DIAL IDEX - CONFIDENTIAL
                </h3>
                <p className="text-red-100 font-semibold mb-3 text-sm sm:text-base">
                  DO NOT SHARE THIS WEBSITE. This platform is exclusive to VICI Dial IDEX work-from-home agents only.
                </p>
                <p className="text-red-50 font-bold text-sm sm:text-base">
                  ⛔ FAILURE TO COMPLY WILL RESULT IN PUNISHMENT!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disposition Modal - Enhanced */}
      {selectedDisposition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header with Stats */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-slate-800 dark:to-slate-900 px-6 py-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-5 h-5 ${
                    selectedDisposition === 'HOT' ? 'bg-hot' :
                    selectedDisposition === 'WARM' ? 'bg-warm' :
                    selectedDisposition === 'INT' ? 'bg-int' :
                    selectedDisposition === 'TIHU' ? 'bg-tihu' :
                    'bg-wsmsnt'
                  } rounded-lg shadow-lg`}></div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedDisposition} Pass-Ups Today</h3>
                    <p className="text-sm text-gray-300">View all {dispositionPassUps.length} lead{dispositionPassUps.length !== 1 ? 's' : ''} for this disposition</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDispositionModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              
              {/* Quick Stats */}
              {dispositionPassUps.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{dispositionPassUps.length}</p>
                    <p className="text-xs text-gray-300">Total Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{dispositionPassUps.filter(p => p.notes).length}</p>
                    <p className="text-xs text-gray-300">With Notes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{new Date().toLocaleTimeString().split(' ')[1]}</p>
                    <p className="text-xs text-gray-300">Current Time</p>
                  </div>
                </div>
              )}
            </div>

            {/* Search and Sort Controls */}
            {dispositionPassUps.length > 0 && (
              <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-b border-gray-200 dark:border-slate-700 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sort and Export Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">By Name (A-Z)</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors shadow-sm hover:shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-auto">
                    Showing {filteredAndSortedPassUps.length} of {dispositionPassUps.length} leads
                  </p>
                </div>
              </div>
            )}
            <div className="overflow-y-auto flex-1 p-6">
              {dispositionPassUps.length > 0 ? (
                filteredAndSortedPassUps.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAndSortedPassUps.map((passUp, index) => (
                      <div
                        key={passUp.id}
                        className="flex items-stretch justify-between p-5 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 group animate-in fade-in slide-in-from-bottom-4"
                      >
                        {/* Left Section - Lead Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            {/* Index Badge */}
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            
                            {/* Disposition Badge */}
                            <DispositionBadge disposition={passUp.disposition} />
                            
                            {/* Time */}
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-auto">
                              ⏰ {new Date(passUp.createdAt).toLocaleTimeString()}
                            </span>
                          </div>

                          {/* Customer Name / Lead Title */}
                          <div className="mb-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {passUp.customerName ? (
                                <span>👤 {passUp.customerName}</span>
                              ) : (
                                <span className="text-gray-400 italic">📞 Phone Lead</span>
                              )}
                            </p>
                          </div>

                          {/* Notes/Comments */}
                          {passUp.notes ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-2 border-blue-500">
                              💬 {passUp.notes}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">📝 No notes added</p>
                          )}

                          {/* Additional Info Row */}
                          <div className="flex gap-3 mt-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                            {passUp.phoneNumber && (
                              <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">📱 {passUp.phoneNumber}</span>
                            )}
                            {passUp.leadSource && (
                              <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">🔗 {passUp.leadSource}</span>
                            )}
                            {passUp.callDuration && (
                              <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">⏱️ {passUp.callDuration}</span>
                            )}
                          </div>
                        </div>

                        {/* Right Section - Action Buttons */}
                        <div className="ml-4 flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleCopy(passUp)}
                            className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-all duration-200 group-hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                            title="Copy to clipboard"
                          >
                            {copiedId === passUp.id ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditPassUp(passUp)}
                            className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 transition-all duration-200 group-hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                            title="Edit pass-up"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePassUp(passUp)}
                            className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-all duration-200 group-hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                            title="Delete pass-up"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Results Found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search or sort filters</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  {/* Motivational Quote Display */}
                  <div className="text-7xl mb-6 animate-bounce">{getMotivationalQuote(selectedDisposition).emoji}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {getMotivationalQuote(selectedDisposition).title}
                  </h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 max-w-sm">
                    {getMotivationalQuote(selectedDisposition).message}
                  </p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {getMotivationalQuote(selectedDisposition).subtitle}
                  </p>
                  
                  {/* Call to Action */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      📞 Make calls now to start adding {selectedDisposition} leads!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click the copy button to copy lead details to clipboard
              </p>
              <button
                onClick={handleCloseDispositionModal}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-md hover:shadow-lg active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pass-Up Modal */}
      {editingPassUp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="w-5 h-5" />
                <h2 className="text-xl font-bold">Edit Pass-Up</h2>
              </div>
              <button
                onClick={handleCancelEditPassUp}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Lead Name */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Lead Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.leadName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, leadName: e.target.value })}
                  className="input"
                  placeholder="Enter lead name"
                />
              </div>

              {/* Ticker */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Ticker
                </label>
                <input
                  type="text"
                  value={editFormData.ticker || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, ticker: e.target.value.toUpperCase() })}
                  className="input"
                  maxLength={10}
                  placeholder="e.g. QTZM"
                />
              </div>

              {/* Interested In */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Interested In
                </label>
                <input
                  type="text"
                  value={editFormData.interestedIn || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, interestedIn: e.target.value })}
                  className="input"
                  placeholder="e.g. CNN"
                />
              </div>

              {/* Disposition */}
              <div>
                <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Disposition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: 'HOT', color: 'bg-hot' },
                    { value: 'WARM', color: 'bg-warm' },
                    { value: 'INT', color: 'bg-int' },
                    { value: 'TIHU', color: 'bg-tihu' },
                    { value: 'WSMSNT', color: 'bg-wsmsnt' }
                  ].map(({ value, color }) => (
                    <button
                      key={value}
                      onClick={() => setEditFormData({ ...editFormData, disposition: value })}
                      className={`py-2 px-2 rounded font-semibold text-white text-xs transition-all ${
                        editFormData.disposition === value
                          ? `${color} ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800 scale-105`
                          : `${color} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agreed to SMS */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editAgreedToSMS"
                  checked={editFormData.agreedToSMS || false}
                  onChange={(e) => setEditFormData({ ...editFormData, agreedToSMS: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="editAgreedToSMS" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Agreed to SMS
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="input resize-none text-sm"
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-6 py-4 flex gap-3">
              <button
                onClick={handleCancelEditPassUp}
                className="flex-1 btn-secondary py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassUp}
                disabled={savingPassUp}
                className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingPassUp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 z-40 animate-in fade-in slide-in-from-bottom-4"
          title="Scroll to top (Press End key)"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

const StatBadge = memo(function StatBadge({ label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="stat-card text-center group hover:scale-105 transition-transform duration-200 cursor-pointer active:scale-95"
    >
      <div className={`w-4 h-4 ${color} rounded-full mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow`}></div>
      <div className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</div>
    </button>
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