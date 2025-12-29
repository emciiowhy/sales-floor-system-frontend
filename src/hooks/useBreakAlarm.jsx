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
      console.warn('No agentId provided to useBreakAlarm');
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
  // Handles overnight shift: 9:30 PM - 6:30 AM (Philippine Time)
  const calculateNextAlarm = useCallback(() => {
    if (!schedule || !schedule.alarmEnabled) {
      setNextAlarm(null);
      return;
    }

    // Get current time (assuming browser is set to Philippine Time)
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const SHIFT_START = 21 * 60 + 30; // 9:30 PM = 1290 minutes
    const SHIFT_END = 6 * 60 + 30; // 6:30 AM = 390 minutes

    const timeToMinutes = (timeString) => {
      if (!timeString) return null;
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const breaks = [
      { type: 'First Break', time: timeToMinutes(schedule.firstBreak) },
      schedule.secondBreak && { type: 'Second Break', time: timeToMinutes(schedule.secondBreak) },
      { type: 'Lunch', time: timeToMinutes(schedule.lunchTime) }
    ].filter(item => item && item.time !== null);

    // Determine if we're in shift hours (9:30 PM - 6:30 AM)
    const isInShiftHours = currentTime >= SHIFT_START || currentTime < SHIFT_END;

    // Find next break
    let nextBreak = null;
    let minDiff = Infinity;

    for (const breakItem of breaks) {
      let targetDate = new Date(now);
      let diff;
      
      if (isInShiftHours) {
        // In shift hours
        if (currentTime < breakItem.time) {
          // Break hasn't happened yet in this shift
          diff = breakItem.time - currentTime;
          targetDate.setHours(Math.floor(breakItem.time / 60));
          targetDate.setMinutes(breakItem.time % 60);
        } else {
          // Break already passed in this shift, next one is tomorrow at same time
          diff = (24 * 60) - currentTime + breakItem.time;
          targetDate.setDate(targetDate.getDate() + 1);
          targetDate.setHours(Math.floor(breakItem.time / 60));
          targetDate.setMinutes(breakItem.time % 60);
        }
      } else {
        // Outside shift hours (6:30 AM - 9:30 PM)
        // Calculate time until next shift start (9:30 PM)
        let hoursUntilShift;
        if (currentTime < SHIFT_START) {
          hoursUntilShift = SHIFT_START - currentTime;
        } else {
          hoursUntilShift = (24 * 60) - currentTime + SHIFT_START;
        }
        // Then add time from shift start to break
        diff = hoursUntilShift + breakItem.time;
        // Set target to next shift's break time (tomorrow at break time)
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(Math.floor(breakItem.time / 60));
        targetDate.setMinutes(breakItem.time % 60);
      }

      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        targetDate.setSeconds(0);
        targetDate.setMilliseconds(0);
        nextBreak = {
          type: breakItem.type,
          time: targetDate,
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
      
      // Play alarm sound with better error handling
      if (audioRef.current) {
        try {
          audioRef.current.volume = Math.min(1, (schedule.alarmVolume || 100) / 100);
          // Force reload the audio source to ensure it plays
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
          
          // Handle promise-based playback
          if (playPromise !== undefined) {
            playPromise
              .catch(error => {
                console.error('Failed to play alarm sound:', error);
                // Fallback: show a more prominent notification if audio fails
                toast.error(`⏰ BREAK ALARM: ${nextAlarm.type}!`, {
                  duration: 10000,
                  description: 'Your break is starting now. Audio may not be available.'
                });
              });
          }
        } catch (error) {
          console.error('Error playing alarm:', error);
          toast.error(`⏰ BREAK ALARM: ${nextAlarm.type}!`, {
            duration: 10000,
            description: 'Your break is starting now.'
          });
        }
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
      // Check every 1 second for faster alarm response
      checkIntervalRef.current = setInterval(checkAlarm, 1000);
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