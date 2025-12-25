import { useState, useEffect, useCallback, useMemo } from 'react';
import { Timer, Play, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { useBreakAlarm } from '../hooks/useBreakAlarm';

function BreakTimer({ agentId }) {
  const { schedule } = useBreakAlarm(agentId);
  const [activeBreak, setActiveBreak] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextBreak, setNextBreak] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get break duration in minutes based on break type
  const getBreakDuration = useCallback((type) => {
    if (type === 'LUNCH') return 30;
    return 15; // FIRST and SECOND breaks are 15 minutes
  }, []);

  const parseTime = useCallback((timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);

  const calculateNextBreak = useCallback(() => {
    if (!schedule || !schedule.firstBreak || !schedule.lunchTime || !schedule.endOfShift) {
      setNextBreak(null);
      setTimeUntilNext(null);
      return;
    }

    // Get current time in minutes from midnight
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes;

    // Break times in minutes from midnight
    const firstBreakTime = parseTime(schedule.firstBreak); // 1:00 AM = 60
    const secondBreakTime = schedule.secondBreak ? parseTime(schedule.secondBreak) : null; // 3:00 AM = 180
    const lunchTime = parseTime(schedule.lunchTime); // 5:00 AM = 300
    const shiftEnd = parseTime(schedule.endOfShift); // 6:30 AM = 390
    const shiftStart = 21 * 60 + 30; // 9:30 PM = 1290

    const breaksInOrder = [
      { type: 'FIRST', time: firstBreakTime },
      ...(secondBreakTime ? [{ type: 'SECOND', time: secondBreakTime }] : []),
      { type: 'LUNCH', time: lunchTime }
    ];

    let nextBreakTime = null;
    let nextBreakType = null;

    // Case 1: Between 9:30 PM and midnight (>=1290 and <1440)
    if (currentTime >= shiftStart) {
      // All breaks are after midnight today
      // Time = (1440 - currentTime) + breakTime
      let minDiff = Infinity;
      for (const brk of breaksInOrder) {
        const diff = (1440 - currentTime) + brk.time;
        if (diff < minDiff) {
          minDiff = diff;
          nextBreakTime = minDiff;
          nextBreakType = brk.type;
        }
      }
    }
    // Case 2: Between midnight and 6:30 AM (<390)
    else if (currentTime < shiftEnd) {
      // Check which breaks haven't passed yet today
      let found = false;
      for (const brk of breaksInOrder) {
        if (currentTime < brk.time) {
          nextBreakTime = brk.time - currentTime;
          nextBreakType = brk.type;
          found = true;
          break;
        }
      }
      // If all breaks today have passed, next is tomorrow at 1:00 AM
      if (!found) {
        nextBreakTime = (1440 - currentTime) + firstBreakTime;
        nextBreakType = 'FIRST';
      }
    }
    // Case 3: Between 6:30 AM and 9:30 PM (outside shift)
    else {
      // Next break is at 1:00 AM, but we need to wait until shift starts
      // From current time to 1:00 AM tomorrow = time to midnight + 1 hour
      nextBreakTime = (1440 - currentTime) + firstBreakTime;
      nextBreakType = 'FIRST';
    }

    if (nextBreakTime !== null && nextBreakType) {
      setNextBreak({ type: nextBreakType });
      setTimeUntilNext(nextBreakTime);
    } else {
      setNextBreak(null);
      setTimeUntilNext(null);
    }
  }, [schedule, parseTime]);

  useEffect(() => {
    loadActiveBreak();
    // Reduce API calls - check every 5 seconds instead of 1 second
    const interval = setInterval(loadActiveBreak, 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  // Update break elapsed time every second when break is active
  useEffect(() => {
    if (activeBreak && breakStartTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - breakStartTime) / 1000);
        setBreakElapsed(elapsedSeconds);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setBreakElapsed(0);
    }
  }, [activeBreak, breakStartTime]);

  // Set break start time when break becomes active
  useEffect(() => {
    if (activeBreak && !breakStartTime) {
      setBreakStartTime(Date.now());
    } else if (!activeBreak) {
      setBreakStartTime(null);
      setBreakElapsed(0);
    }
  }, [activeBreak, breakStartTime]);

  useEffect(() => {
    // Update current time every second for PC time sync
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    if (!activeBreak && schedule && schedule.firstBreak) {
      calculateNextBreak();
    }
    
    return () => clearInterval(interval);
  }, [activeBreak, schedule, calculateNextBreak]);

  useEffect(() => {
    if (!activeBreak && schedule && schedule.firstBreak) {
      // Update countdown every 30 seconds instead of every second
      calculateNextBreak();
      const interval = setInterval(calculateNextBreak, 30000);
      return () => clearInterval(interval);
    }
  }, [activeBreak, schedule, calculateNextBreak]);

  const loadActiveBreak = async () => {
    try {
      const data = await api.getTodayBreaks(agentId);
      // Find active break (no endTime and type is FIRST, SECOND, or LUNCH)
      const active = data.breaks?.find(
        b => !b.endTime && ['FIRST', 'SECOND', 'LUNCH'].includes(b.type)
      );
      // Only update state if it changed to prevent unnecessary re-renders
      setActiveBreak(prev => {
        if (prev?.id === active?.id) return prev;
        return active || null;
      });
      setLoading(false);
    } catch (error) {
      if (!error.isConnectionError) {
        console.error('Failed to load breaks:', error);
      }
      setLoading(false);
    }
  };

  const formatTimeUntil = (minutes) => {
    if (minutes < 0) return 'Now';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getBreakLabel = (type) => {
    const labels = {
      FIRST: 'First Break',
      SECOND: 'Second Break',
      LUNCH: 'Lunch Break'
    };
    return labels[type] || type;
  };

  const handleStartBreak = async (type) => {
    try {
      await api.startBreak(agentId, type);
      toast.success(`${getBreakLabel(type)} started`);
      await loadActiveBreak();
    } catch (error) {
      toast.error('Failed to start break: ' + error.message);
    }
  };

  const handleEndBreak = async () => {
    if (!activeBreak) return;

    try {
      await api.endBreak(activeBreak.id);
      toast.success('Break ended');
      await loadActiveBreak();
    } catch (error) {
      toast.error('Failed to end break: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-bold">Break Timer</h2>
      </div>

      {activeBreak ? (
        <div className="space-y-4">
          {/* Active Break Countdown Timer */}
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {getBreakLabel(activeBreak.type)} - Countdown
            </div>
            <div className="text-5xl sm:text-6xl font-bold text-blue-700 dark:text-blue-300 mb-2 font-mono">
              {(() => {
                const totalSeconds = getBreakDuration(activeBreak.type) * 60;
                const remainingSeconds = Math.max(0, totalSeconds - breakElapsed);
                const mins = Math.floor(remainingSeconds / 60);
                const secs = remainingSeconds % 60;
                return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              })()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Time remaining
            </div>
          </div>

          <button
            onClick={handleEndBreak}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 sm:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
          >
            <Square className="w-5 h-5" />
            <span>End Break</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {nextBreak ? (
            <>
              {/* Next Break Countdown */}
              <div className="text-center p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Next: {getBreakLabel(nextBreak.type)}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {formatTimeUntil(timeUntilNext)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  at {
                    nextBreak.type === 'FIRST' ? schedule.firstBreak :
                    nextBreak.type === 'SECOND' ? schedule.secondBreak :
                    schedule.lunchTime
                  }
                </div>
              </div>

              {/* Quick Start Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {schedule.firstBreak && (
                  <button
                    onClick={() => handleStartBreak('FIRST')}
                    className="px-2 py-2.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium hover:scale-105 active:scale-95"
                  >
                    1st
                  </button>
                )}
                {schedule.secondBreak && (
                  <button
                    onClick={() => handleStartBreak('SECOND')}
                    className="px-2 py-2.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium hover:scale-105 active:scale-95"
                  >
                    2nd
                  </button>
                )}
                {schedule.lunchTime && (
                  <button
                    onClick={() => handleStartBreak('LUNCH')}
                    className="px-2 py-2.5 text-xs sm:text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-medium hover:scale-105 active:scale-95"
                  >
                    Lunch
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              No scheduled breaks available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BreakTimer;

