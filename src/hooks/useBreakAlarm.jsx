import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '../utils/api';

// Generate buzzer tone using Web Audio API
function playBuzzerTone(volume = 0.7, duration = 1000) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Buzzer-like frequency pattern
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.error('Error playing buzzer tone:', error);
    // Fallback: Use browser notification sound
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Break Reminder', {
        body: 'Time for your break!',
        icon: '/vite.svg'
      });
    }
  }
}

export function useBreakAlarm(agentId) {
  const [schedule, setSchedule] = useState(null);
  const [nextAlarm, setNextAlarm] = useState(null);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const checkIntervalRef = useRef(null);
  const lastAlarmRef = useRef({});

  // Load schedule
  useEffect(() => {
    if (!agentId) return;

    const loadSchedule = async () => {
      try {
        const data = await api.getBreakSchedule(agentId);
        setSchedule(data);
      } catch (error) {
        console.error('Failed to load break schedule:', error);
        // Don't show error toast for 404 - schedule will be created on first access
        if (error.message && !error.message.includes('404')) {
          console.warn('Break schedule not found, will be created on first update');
        }
      }
    };

    loadSchedule();
  }, [agentId]);

  // Calculate next alarm time
  useEffect(() => {
    if (!schedule || !schedule.alarmEnabled) {
      setNextAlarm(null);
      return;
    }

    const calculateNextAlarm = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return new Date(today.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000);
      };

      const alarms = [
        { time: parseTime(schedule.firstBreak), type: 'First Break', key: 'firstBreak' },
        schedule.secondBreak ? { time: parseTime(schedule.secondBreak), type: 'Second Break', key: 'secondBreak' } : null,
        { time: parseTime(schedule.lunchTime), type: 'Lunch Time', key: 'lunchTime' },
        { time: parseTime(schedule.endOfShift), type: 'End of Shift', key: 'endOfShift' }
      ].filter(Boolean);

      // Find next alarm that hasn't passed today
      const next = alarms
        .map(alarm => ({
          ...alarm,
          time: alarm.time < now ? new Date(alarm.time.getTime() + 24 * 60 * 60 * 1000) : alarm.time
        }))
        .sort((a, b) => a.time - b.time)[0];

      setNextAlarm(next);
    };

    calculateNextAlarm();
    const interval = setInterval(calculateNextAlarm, 60000); // Recalculate every minute
    return () => clearInterval(interval);
  }, [schedule]);

  // Check for alarm time
  useEffect(() => {
    if (!nextAlarm || !schedule || !schedule.alarmEnabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    const checkAlarm = () => {
      const now = new Date();
      const alarmTime = nextAlarm.time;
      const timeDiff = alarmTime - now;

      // Trigger alarm 1 minute before and at the exact time
      if (timeDiff <= 60000 && timeDiff >= -60000) {
        const alarmKey = `${nextAlarm.key}-${alarmTime.toDateString()}`;
        
        // Only trigger once per alarm
        if (!lastAlarmRef.current[alarmKey]) {
          lastAlarmRef.current[alarmKey] = true;
          
          const volume = schedule.alarmVolume / 100;
          
          // Play buzzer tone
          playBuzzerTone(volume, 2000);
          
          // Show notification
          toast.info(`🔔 ${nextAlarm.type}!`, {
            description: `Time: ${nextAlarm.time.toLocaleTimeString()}`,
            duration: 5000,
          });

          // Browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${nextAlarm.type}`, {
              body: `It's time for your ${nextAlarm.type.toLowerCase()}!`,
              icon: '/vite.svg',
              tag: alarmKey
            });
          }

          setAlarmTriggered(true);
          setTimeout(() => setAlarmTriggered(false), 5000);
        }
      }
    };

    // Check every 10 seconds
    checkIntervalRef.current = setInterval(checkAlarm, 10000);
    checkAlarm(); // Check immediately

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [nextAlarm, schedule]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    schedule,
    nextAlarm,
    alarmTriggered,
    updateSchedule: async (updates) => {
      try {
        const updated = await api.updateBreakSchedule(agentId, updates);
        setSchedule(updated);
        return updated;
      } catch (error) {
        console.error('Failed to update break schedule:', error);
        throw error;
      }
    }
  };
}

