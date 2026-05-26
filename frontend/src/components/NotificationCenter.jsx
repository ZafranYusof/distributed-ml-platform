import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell, CheckCircle, AlertTriangle, Mail, Rocket,
  XCircle, Link, Pin
} from 'lucide-react';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'training_complete': return CheckCircle;
      case 'drift_detected': return AlertTriangle;
      case 'invite_received': return Mail;
      case 'deploy_success': return Rocket;
      case 'deploy_fail': return XCircle;
      case 'system': return Bell;
      case 'webhook': return Link;
      default: return Pin;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'training_complete': return 'text-green-400';
      case 'drift_detected': return 'text-yellow-400';
      case 'invite_received': return 'text-blue-400';
      case 'deploy_success': return 'text-green-400';
      case 'deploy_fail': return 'text-red-400';
      case 'system': return 'text-purple-400';
      case 'webhook': return 'text-cyan-400';
      default: return 'text-purple-300/60';
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-purple-300/50 hover:text-white transition-colors rounded-lg hover:bg-purple-500/15"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800/40 border border-dark-600 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-purple-500/20">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-purple-400 hover:text-primary-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-purple-300/50 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map(notif => {
                const IconComponent = getIcon(notif.type);
                const iconColor = getIconColor(notif.type);
                return (
                  <div
                    key={notif._id}
                    onClick={() => !notif.read && markAsRead(notif._id)}
                    className={`flex items-start gap-3 p-3 border-b border-purple-500/20/50 cursor-pointer hover:bg-purple-500/15/50 transition-colors ${
                      !notif.read ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-purple-200/70'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-purple-300/40 mt-0.5">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
