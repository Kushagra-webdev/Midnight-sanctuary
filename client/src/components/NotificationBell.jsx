import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Info, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import api from '../services/api';

const TYPE_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  ai: Sparkles,
};

const TYPE_COLORS = {
  info: 'text-blue-400',
  success: 'text-tertiary',
  warning: 'text-yellow-400',
  ai: 'text-primary',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/notifications');
      setNotifications(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async () => {
    try {
      await api.put('/users/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open && unread > 0) {
      setTimeout(handleMarkRead, 2000);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-surface-dim border border-white/5 flex items-center justify-center text-text-muted hover:text-white hover:border-white/10 transition-all"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 glass-panel shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="font-heading text-sm text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkRead} className="text-[10px] text-text-muted hover:text-white transition-colors flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full skeleton shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 skeleton rounded w-3/4" />
                      <div className="h-2 skeleton rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                <p className="text-text-muted text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const Icon = TYPE_ICONS[n.type] || Info;
                const color = TYPE_COLORS[n.type] || 'text-text-muted';
                return (
                  <div key={i}
                    className={`flex gap-3 p-3 border-b border-white/5 last:border-0 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${n.read ? 'text-text-muted/40' : color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${n.read ? 'text-text-muted' : 'text-white'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-text-muted mt-1">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
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
