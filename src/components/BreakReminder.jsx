import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';

function BreakReminder() {
  const [nextBreak, setNextBreak] = useState(null);
  const [timeUntil, setTimeUntil] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkBreaks = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      // Break times in minutes from midnight
      const breaks = [
        { name: '1st Break', time: 60 }, // 1:00 AM
        { name: '2nd Break', time: 180 }, // 3:00 AM
        { name: 'Lunch Break', time: 300 }, // 5:00 AM
        { name: 'End of Shift', time: 390 } // 6:30 AM
      ];

      // Determine if we're in the night shift (9:30 PM to 6:30 AM)
      const isInNightShift = (currentHour >= 21 && currentMinute >= 30) || (currentHour < 6) || (currentHour === 6 && currentMinute < 30);

      if (!isInNightShift) {
        setNextBreak(null);
        return;
      }

      // Find next break
      let upcoming = null;
      let minutesUntil = null;

      for (const breakItem of breaks) {
        let timeUntilBreak;
        
        if (currentHour >= 21 && currentMinute >= 30) {
          // After 9:30 PM, breaks are in the next day
          // Time until break = (24*60 - currentTime) + breakTime
          timeUntilBreak = (24 * 60 - currentTimeMinutes) + breakItem.time;
        } else {
          // After midnight but before 6:30 AM, breaks are today
          timeUntilBreak = breakItem.time - currentTimeMinutes;
        }

        if (timeUntilBreak > 0 && timeUntilBreak <= 15) {
          upcoming = breakItem;
          minutesUntil = Math.floor(timeUntilBreak);
          break;
        }
      }

      if (upcoming) {
        setNextBreak(upcoming);
        setTimeUntil(minutesUntil);
      } else {
        setNextBreak(null);
      }
    };

    checkBreaks();
    const interval = setInterval(checkBreaks, 30000); // Check every 30 seconds for better accuracy

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (nextBreak && timeUntil !== null && timeUntil <= 5 && timeUntil > 0 && !dismissed) {
      const message = timeUntil === 0 
        ? `⏰ ${nextBreak.name} is starting now!`
        : `⏰ ${nextBreak.name} starts in ${timeUntil} minute${timeUntil !== 1 ? 's' : ''}!`;
      
      toast.info(message, {
        duration: 10000,
      });
    }
  }, [nextBreak, timeUntil, dismissed]);

  if (!nextBreak || dismissed) return null;

  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">
              {nextBreak.name} Reminder
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Starts in {formatTime(timeUntil)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </button>
      </div>
    </div>
  );
}

export default BreakReminder;

