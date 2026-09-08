import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, Play, Square, CheckCircle2, Loader2, Moon, Sun, Wind, Brain, Timer, BarChart3, TrendingUp } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { SkeletonStats } from '../../components/SkeletonCard';

const SESSION_TYPES = ['Deep Work', 'Meditation', 'Reading', 'Digital Detox'];
const RITUALS = [
  { title: '4-7-8 Breathing', icon: Wind, color: 'text-teal-400', bg: 'bg-teal-400/10', desc: 'Inhale 4s · Hold 7s · Exhale 8s — activates parasympathetic system.', duration: '5 min' },
  { title: 'Body Scan', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-400/10', desc: 'Progressive relaxation from crown to feet. Releases stored tension.', duration: '10 min' },
  { title: 'Morning Light', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: '10 minutes of natural light anchors your circadian rhythm.', duration: '10 min' },
  { title: 'Sleep Wind-Down', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10', desc: 'No screens 1hr before bed. Dim lights, cool room.', duration: '60 min' },
];

const SESSION_COLORS = {
  'Deep Work': '#6366F1',
  'Meditation': '#2DD4BF',
  'Reading': '#8B5CF6',
  'Digital Detox': '#F59E0B',
};

// Timer persistence key
const TIMER_KEY = 'ms_focus_timer';

function loadTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    const { startedAt, sessionType } = JSON.parse(raw);
    return { startedAt, sessionType };
  } catch { return null; }
}

function FocusHistoryChart({ sessions }) {
  // Group by day (last 14 days)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'MMM d'), minutes: 0 };
  });

  sessions.forEach(s => {
    const day = format(new Date(s.createdAt), 'yyyy-MM-dd');
    const slot = days.find(d => d.date === day);
    if (slot) slot.minutes += s.duration;
  });

  const max = Math.max(...days.map(d => d.minutes), 1);

  return (
    <div className="glass-panel p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-4 h-4 text-tertiary" />
        <h3 className="font-heading text-lg text-white">Focus History (14 days)</h3>
      </div>
      <div className="flex items-end gap-1.5 h-28">
        {days.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full">
              <div
                className="w-full rounded-t-sm bg-primary/20 hover:bg-primary/40 transition-colors cursor-default"
                style={{ height: `${Math.max(4, (d.minutes / max) * 96)}px` }}
                title={`${d.label}: ${d.minutes}min`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-text-muted">{days[0].label}</span>
        <span className="text-[10px] text-text-muted">Today</span>
      </div>
      {/* Session type breakdown */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(SESSION_COLORS).map(([type, color]) => {
          const total = sessions.filter(s => s.sessionType === type).reduce((a, s) => a + s.duration, 0);
          if (total === 0) return null;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-text-muted">{type}: {total}min</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Health() {
  const { data: sessions, loading, refetch } = useFetch('/focus');
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useFetch('/focus/stats');

  // Persisted timer state
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const [sessionType, setSessionType] = useState('Meditation');
  const [logging, setLogging] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Restore timer from localStorage on mount
  useEffect(() => {
    const saved = loadTimerState();
    if (saved) {
      const elapsedSecs = Math.floor((Date.now() - saved.startedAt) / 1000);
      setElapsed(elapsedSecs);
      setSessionType(saved.sessionType);
      setActive(true);
      startTimeRef.current = saved.startedAt;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - saved.startedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, []);

  const startTimer = () => {
    const now = Date.now();
    startTimeRef.current = now;
    localStorage.setItem(TIMER_KEY, JSON.stringify({ startedAt: now, sessionType }));
    setActive(true);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000));
    }, 1000);
  };

  const stopTimer = async () => {
    clearInterval(intervalRef.current);
    localStorage.removeItem(TIMER_KEY);
    setActive(false);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    setLogging(true);
    try {
      await api.post('/focus', { duration: minutes, sessionType, wasSuccessful: true });
      refetch(); refetchStats();
      toast.success(`${sessionType} — ${minutes} min logged ✓`);
    } catch { toast.error('Could not log session'); }
    finally { setLogging(false); setElapsed(0); }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const circumference = 2 * Math.PI * 52;
  const dashOffset = active ? circumference - ((elapsed % 3600) / 3600) * circumference : circumference;

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-white mb-2">Wellness</h1>
        <p className="text-text-muted text-sm">Your nervous system is the foundation of your focus.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Timer */}
        <div className="sm:col-span-1 glass-panel p-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Focus Timer</span>
            {active && (
              <span className="flex items-center gap-1 text-[10px] text-tertiary animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />LIVE
              </span>
            )}
          </div>
          <div className="relative w-36 h-36 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="52" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-white/5" />
              <circle cx="64" cy="64" r="52" stroke="currentColor" strokeWidth="5" fill="transparent"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                className="text-tertiary transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {active ? (
                <><span className="font-heading text-3xl text-white tabular-nums">{fmt(elapsed)}</span>
                  <span className="text-[10px] text-tertiary mt-1">{sessionType}</span></>
              ) : (
                <><Heart className="w-7 h-7 text-tertiary mb-1" />
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Ready</span></>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center mb-6">
            {SESSION_TYPES.map((t) => (
              <button key={t} onClick={() => setSessionType(t)} disabled={active}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${sessionType === t ? 'bg-tertiary text-surface' : 'bg-surface-dim border border-white/10 text-text-muted hover:text-white disabled:cursor-not-allowed'}`}>
                {t}
              </button>
            ))}
          </div>

          {active ? (
            <button onClick={stopTimer} disabled={logging}
              className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2">
              {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              End & Log Session
            </button>
          ) : (
            <button onClick={startTimer}
              className="w-full py-3 bg-tertiary text-surface rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              <Play className="w-4 h-4" /> Begin Session
            </button>
          )}

          {active && (
            <p className="text-[10px] text-text-muted mt-3">Timer persists across page refreshes</p>
          )}
        </div>

        {/* Stats */}
        <div className="sm:col-span-1 lg:col-span-2 space-y-4">
          {statsLoading ? (
            <SkeletonStats count={3} />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Hours', value: stats?.totalHours || '0.0', unit: 'hrs', color: 'text-tertiary' },
                { label: 'Sessions', value: stats?.totalSessions || 0, unit: '', color: 'text-primary' },
                { label: 'Success Rate', value: stats?.successRate || 0, unit: '%', color: 'text-teal-400' },
              ].map((s) => (
                <div key={s.label} className="glass-panel p-4 text-center">
                  <p className={`font-heading text-2xl sm:text-3xl ${s.color} mb-0.5`}>{s.value}{s.unit}</p>
                  <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent sessions list */}
          <div className="glass-panel p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-heading text-white mb-4">Recent Sessions</h3>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}
              </div>
            ) : !sessions || sessions.length === 0 ? (
              <p className="text-center text-text-muted py-6 text-sm">No sessions yet. Begin your first!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                {sessions.slice(0, 10).map((s) => (
                  <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-surface-dim border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.wasSuccessful ? 'bg-tertiary/10 text-tertiary' : 'bg-red-500/10 text-red-400'}`}>
                        {s.wasSuccessful ? <CheckCircle2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.sessionType}</p>
                        <p className="text-[10px] text-text-muted">{format(new Date(s.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Timer className="w-3 h-3 text-text-muted" />
                      <span className="text-sm text-white font-medium">{s.duration}m</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Focus History Chart */}
        {sessions && sessions.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <FocusHistoryChart sessions={sessions} />
          </div>
        )}

        {/* Rituals */}
        <div className="sm:col-span-2 lg:col-span-3">
          <h3 className="text-lg sm:text-xl font-heading text-white mb-4">Wellness Rituals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {RITUALS.map((r) => (
              <div key={r.title} className="glass-panel p-4 sm:p-6 flex flex-col gap-3 hover:border-white/10 transition-colors">
                <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center ${r.color}`}>
                  <r.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-heading text-base sm:text-lg text-white mb-1">{r.title}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{r.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">{r.duration}</span>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
