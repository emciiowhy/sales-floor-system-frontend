import { useState } from 'react';
import { Clock, Bell, BellOff, Settings, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useBreakAlarm } from '../hooks/useBreakAlarm';

function BreakSchedule({ agentId }) {
  const { schedule, nextAlarm, alarmTriggered, updateSchedule } = useBreakAlarm(agentId);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstBreak: '10:00',
    secondBreak: '14:00',
    lunchTime: '12:30',
    endOfShift: '17:00',
    alarmEnabled: true,
    alarmVolume: 70
  });

  if (!schedule) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const handleEdit = () => {
    setFormData({
      firstBreak: schedule.firstBreak,
      secondBreak: schedule.secondBreak || '',
      lunchTime: schedule.lunchTime,
      endOfShift: schedule.endOfShift,
      alarmEnabled: schedule.alarmEnabled,
      alarmVolume: schedule.alarmVolume
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateSchedule(formData);
      setEditing(false);
      toast.success('Break schedule updated!');
    } catch (error) {
      toast.error('Failed to update schedule: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const toggleAlarm = async () => {
    try {
      await updateSchedule({ alarmEnabled: !schedule.alarmEnabled });
      toast.success(`Alarm ${!schedule.alarmEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update alarm settings');
    }
  };

  const formatTimeUntil = (targetTime) => {
    if (!targetTime) return 'No upcoming alarms';
    
    const now = new Date();
    const diff = targetTime - now;
    
    if (diff < 0) return 'Time passed';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Break Schedule
          </h2>
          {alarmTriggered && (
            <span className="animate-pulse text-red-600 dark:text-red-400 text-xl">🔔</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAlarm}
            className={`p-2 rounded-lg transition-colors ${
              schedule.alarmEnabled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={schedule.alarmEnabled ? 'Disable alarm' : 'Enable alarm'}
          >
            {schedule.alarmEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
          {!editing ? (
            <button
              onClick={handleEdit}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Break</label>
              <input
                type="time"
                value={formData.firstBreak}
                onChange={(e) => setFormData({ ...formData, firstBreak: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Second Break</label>
              <input
                type="time"
                value={formData.secondBreak}
                onChange={(e) => setFormData({ ...formData, secondBreak: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lunch Time</label>
              <input
                type="time"
                value={formData.lunchTime}
                onChange={(e) => setFormData({ ...formData, lunchTime: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End of Shift</label>
              <input
                type="time"
                value={formData.endOfShift}
                onChange={(e) => setFormData({ ...formData, endOfShift: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Alarm Volume: {formData.alarmVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.alarmVolume}
              onChange={(e) => setFormData({ ...formData, alarmVolume: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ScheduleItem label="First Break" time={schedule.firstBreak} />
            {schedule.secondBreak && (
              <ScheduleItem label="Second Break" time={schedule.secondBreak} />
            )}
            <ScheduleItem label="Lunch" time={schedule.lunchTime} />
            <ScheduleItem label="End of Shift" time={schedule.endOfShift} />
          </div>
          
          {nextAlarm && schedule.alarmEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Next Alarm:</span>
                <div className="text-right">
                  <div className="font-semibold">{nextAlarm.type}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {nextAlarm.time.toLocaleTimeString()} ({formatTimeUntil(nextAlarm.time)})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleItem({ label, time }) {
  return (
    <div className="stat-card p-4 group hover:scale-[1.02] transition-transform">
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">{time}</div>
    </div>
  );
}

export default BreakSchedule;

