import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '../utils/api';

// Alarm sound URL - you can replace this with your own sound file
const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function useBreakAlarm(agentId) {
  const [schedule, setSchedule] = useState(null);
  const [nextAlarm, setNextAlarm] = useState(null);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(ALARM_SOUND_URL);
    audioRef.current.loop = false;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Load schedule from API
  const loadSchedule = useCallback(async () => {
    if (!agentId) {
      console.error('No agentId provided to useBreakAlarm');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getBreakSchedule(agentId);
      setSchedule(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load break schedule:', error);
      toast.error('Failed to load break schedule');
      setLoading(false);
    }
  }, [agentId]);

  // Update schedule
  const updateSchedule = useCallback(async (updates) => {
    if (!agentId) return;

    try {
      const data = await api.updateBreakSchedule(agentId, updates);
      setSchedule(data);
      return data;
    } catch (error) {
      console.error('Failed to update break schedule:', error);
      throw error;
    }
  }, [agentId]);

  // Calculate next alarm
  const calculateNextAlarm = useCallback(() => {
    if (!schedule || !schedule.alarmEnabled) {
      setNextAlarm(null);
      return;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const timeToMinutes = (timeString) => {
      if (!timeString) return null;
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const breaks = [
      { type: 'First Break', time: timeToMinutes(schedule.firstBreak) },
      schedule.secondBreak && { type: 'Second Break', time: timeToMinutes(schedule.secondBreak) },
      { type: 'Lunch', time: timeToMinutes(schedule.lunchTime) },
      { type: 'End of Shift', time: timeToMinutes(schedule.endOfShift) }
    ].filter(item => item && item.time !== null);

    // Find next break
    let nextBreak = null;
    let minDiff = Infinity;

    for (const breakItem of breaks) {
      const diff = breakItem.time - currentTime;
      
      // Only consider future breaks today
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        const targetTime = new Date();
        targetTime.setHours(Math.floor(breakItem.time / 60));
        targetTime.setMinutes(breakItem.time % 60);
        targetTime.setSeconds(0);
        nextBreak = {
          type: breakItem.type,
          time: targetTime,
          minutesUntil: diff
        };
      }
    }

    setNextAlarm(nextBreak);
  }, [schedule]);

  // Check if alarm should trigger
  const checkAlarm = useCallback(() => {
    if (!nextAlarm || !schedule?.alarmEnabled) return;

    const now = new Date();
    const diff = nextAlarm.time - now;

    // Trigger alarm if within 1 minute (60000 ms) of break time
    if (diff <= 60000 && diff >= 0 && !alarmTriggered) {
      setAlarmTriggered(true);
      
      // Play alarm sound
      if (audioRef.current) {
        audioRef.current.volume = (schedule.alarmVolume || 70) / 100;
        audioRef.current.play().catch(error => {
          console.error('Failed to play alarm sound:', error);
        });
      }

      // Show toast notification
      toast.info(`Time for ${nextAlarm.type}!`, {
        duration: 10000,
        description: 'Your scheduled break is starting now.'
      });

      // Reset alarm triggered after 2 minutes
      setTimeout(() => {
        setAlarmTriggered(false);
        calculateNextAlarm(); // Recalculate next alarm
      }, 120000);
    }
  }, [nextAlarm, schedule, alarmTriggered, calculateNextAlarm]);

  // Load schedule on mount
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Calculate next alarm when schedule changes
  useEffect(() => {
    if (schedule) {
      calculateNextAlarm();
    }
  }, [schedule, calculateNextAlarm]);

  // Check alarm periodically
  useEffect(() => {
    if (schedule?.alarmEnabled && nextAlarm) {
      // Check every 30 seconds
      checkIntervalRef.current = setInterval(checkAlarm, 30000);
      // Also check immediately
      checkAlarm();
      
      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [schedule, nextAlarm, checkAlarm]);

  return {
    schedule,
    nextAlarm,
    alarmTriggered,
    loading,
    loadSchedule,
    updateSchedule
  };
}