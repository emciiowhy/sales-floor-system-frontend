import { useState, useEffect } from 'react';
import { Timer, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

function BioBreakTimer({ agentId }) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [breakId, setBreakId] = useState(null);

  const TOTAL_BIO_MINUTES = 15;

  useEffect(() => {
    loadBioBreakData();
  }, [agentId]);

  const loadBioBreakData = async () => {
    try {
      const data = await api.getTodayBreaks(agentId);
      setTotalUsed(data.bioBreakPool?.used || 0);
    } catch (error) {
      console.error('Failed to load bio break data:', error);
      // Silently fail for connection errors to avoid spam
      if (!error.isConnectionError) {
        // Only log non-connection errors
      }
    }
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);
        setElapsed(elapsedMinutes);

        // Warn at 12 minutes (3 minutes remaining)
        if (elapsedMinutes >= 12 && elapsedMinutes < 13) {
          toast.warning('⚠️ Bio break: 3 minutes remaining in your 15-minute pool!');
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const handleStart = async () => {
    try {
      const breakRecord = await api.startBreak(agentId, 'BIO');
      setBreakId(breakRecord.id);
      setStartTime(Date.now());
      setIsRunning(true);
      toast.success('Bio break timer started');
    } catch (error) {
      toast.error('Failed to start bio break: ' + error.message);
    }
  };

  const handleStop = async () => {
    if (!breakId) return;

    try {
      await api.endBreak(breakId);
      const minutesUsed = Math.floor((Date.now() - startTime) / 1000 / 60);
      await loadBioBreakData();
      
      setIsRunning(false);
      setStartTime(null);
      setElapsed(0);
      setBreakId(null);
      
      toast.success(`Bio break ended. Used ${minutesUsed} minute${minutesUsed !== 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to end bio break: ' + error.message);
    }
  };

  const remaining = TOTAL_BIO_MINUTES - totalUsed - elapsed;
  const percentageUsed = ((totalUsed + elapsed) / TOTAL_BIO_MINUTES) * 100;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-lg font-bold">Bio Break Timer</h2>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Pool Usage</span>
            <span className="text-gray-600 dark:text-gray-400">
              {totalUsed + elapsed} / {TOTAL_BIO_MINUTES} minutes
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${
                percentageUsed >= 100
                  ? 'bg-red-600'
                  : percentageUsed >= 80
                  ? 'bg-yellow-500'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {remaining > 0 ? `${remaining} minutes remaining` : 'No time remaining'}
          </p>
        </div>

        {/* Timer Display */}
        {isRunning && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
              {String(elapsed % 60).padStart(2, '0')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current break</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={remaining <= 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>Start Bio Break</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>End Bio Break</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          15 minutes total per shift, not per break
        </p>
      </div>
    </div>
  );
}

export default BioBreakTimer;

