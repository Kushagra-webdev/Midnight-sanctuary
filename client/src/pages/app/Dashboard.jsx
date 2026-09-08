import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Plus, PenLine, Loader2, Flame, Clock, Target, Sparkles, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format, isToday, parseISO } from 'date-fns';
import { SkeletonCard, SkeletonStats } from '../../components/SkeletonCard';

// Streak Calendar (last 7 weeks = 49 days)
function StreakCalendar({ calendar = [] }) {
  const days = [];
  const today = new Date();
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const str = d.toISOString().split('T')[0];
    days.push({ date: str, active: calendar.includes(str), isToday: i === 0 });
  }
  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-2">Streak Calendar</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, active, isToday: isTd }) => (
          <div key={date} title={format(parseISO(date), 'MMM d')}
            className={`w-full aspect-square rounded-sm transition-colors ${
              isTd ? 'ring-1 ring-tertiary/60' : ''
            } ${active ? 'bg-tertiary' : 'bg-surface-bright/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [affirmation, setAffirmation] = useState('');
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const { data: stats, loading: statsLoading, refetch: refetchStats } = useFetch('/users/dashboard-stats');
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useFetch('/tasks');

  const isPro = user?.planType === 'Pro' || user?.planType === 'Premium';

  useEffect(() => {
    if (!isPro) return;
    setLoadingAffirmation(true);
    api.get('/ai/daily-affirmation')
      .then(({ data }) => setAffirmation(data.affirmation))
      .catch(() => setAffirmation('"The quieter you become, the more you are able to hear." — Rumi'))
      .finally(() => setLoadingAffirmation(false));
  }, [isPro]);

  const todayTasks = tasks?.slice(0, 5) || [];
  const completedCount = todayTasks.filter((t) => t.isCompleted).length;
  const progressPct = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;
  const recentJournals = stats?.journals?.recent || [];
  const streakCalendar = stats?.streak?.calendar || [];

  const toggleTask = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted });
      refetchTasks(); refetchStats();
      if (!task.isCompleted) toast.success('Task completed ✓');
    } catch { toast.error('Could not update task'); }
  };

  const addQuickTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAddingTask(true);
    try {
      await api.post('/tasks', { title: newTask.trim(), priority: 'Medium' });
      setNewTask(''); refetchTasks();
      toast.success('Task added');
    } catch { toast.error('Could not add task'); }
    finally { setAddingTask(false); }
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <p className="text-text-muted text-xs sm:text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="font-heading text-xl sm:text-2xl text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Seeker'}
          </h2>
        </div>
        <button onClick={() => navigate('/app/profile')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 bg-surface-dim shrink-0">
          <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name || 'user')}`}
            alt="Profile" className="w-full h-full object-cover" />
        </button>
      </header>

      {/* Hero Banner */}
      <section className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 border border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className="text-tertiary text-xs font-bold tracking-[0.2em] uppercase mb-4">
            Quote of the Day
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-semibold text-white max-w-3xl leading-tight mb-4 drop-shadow-lg">
            "The quieter you become, the more you are able to hear."
          </h2>
          <span className="text-text-muted text-sm">— Rumi</span>
        </div>
      </section>

      {/* Stats */}
      {statsLoading ? (
        <div className="mb-6"><SkeletonStats count={3} /></div>
      ) : stats && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {[
            { icon: Flame, val: stats.streak.current, label: 'Day Streak', color: 'bg-primary/10 text-primary' },
            { icon: Clock, val: `${stats.focus.totalHours}h`, label: 'Focus Time', color: 'bg-tertiary/10 text-tertiary' },
            { icon: Target, val: `${stats.tasks.completionRate}%`, label: 'Task Rate', color: 'bg-indigo-500/10 text-indigo-400' },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="glass-panel p-3 sm:p-5 flex items-center gap-2 sm:gap-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-lg sm:text-2xl text-white leading-none">{val}</p>
                <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mt-0.5 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-1 glass-panel p-4 sm:p-6 flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-heading text-white mb-0.5">Today's Focus</h3>
              <p className="text-xs sm:text-sm text-text-muted">{completedCount}/{todayTasks.length} tasks</p>
            </div>
            <span className="text-tertiary text-xl sm:text-2xl font-heading font-semibold">{progressPct}%</span>
          </div>
          <div className="w-full h-1 bg-surface-bright rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-tertiary rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
              style={{ width: `${progressPct}%` }} />
          </div>
          <div className="space-y-2 flex-1 min-h-[80px]">
            {tasksLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-11 skeleton rounded-xl" />)}
              </div>
            ) : todayTasks.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No tasks yet. Add one below!</p>
            ) : todayTasks.map((task) => (
              <button key={task._id} onClick={() => toggleTask(task)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-bright/30 border border-white/5 hover:border-white/10 transition-colors text-left">
                <div className="flex items-center gap-2 min-w-0">
                  {task.isCompleted
                    ? <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0" />
                    : <Circle className="w-4 h-4 text-text-muted shrink-0" />}
                  <span className={`text-sm truncate ${task.isCompleted ? 'text-text-muted line-through' : 'text-white'}`}>
                    {task.title}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                  task.priority === 'High' || task.priority === 'Critical' ? 'bg-red-500/10 text-red-400'
                  : task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400'
                  : 'bg-green-500/10 text-green-400'
                }`}>{task.priority}</span>
              </button>
            ))}
          </div>
          <form onSubmit={addQuickTask} className="mt-4 flex gap-2">
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 bg-surface-dim border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20 transition-colors min-w-0" />
            <button type="submit" disabled={addingTask || !newTask.trim()}
              className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white hover:scale-95 transition-transform disabled:opacity-50 shrink-0">
              {addingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* AI + Journal */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
          <div className="glass-panel p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-heading text-white mb-1">Ask the Guide</h3>
            <p className="text-xs sm:text-sm text-text-muted mb-4">Your AI wellness companion.</p>
            <div className="bg-surface-dim/70 p-3 sm:p-4 rounded-xl border border-tertiary/10 mb-4">
              <p className="text-xs sm:text-sm text-text-main italic leading-relaxed">
                "I understand. The digital world is designed to fragment our attention. Let's reclaim it together."
              </p>
              <span className="text-[10px] text-tertiary mt-2 block">— The Stillness Guide · Gemini AI</span>
            </div>
            <Link to="/app/coach"
              className="w-full py-2.5 sm:py-3 bg-surface-bright text-white rounded-full text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-tertiary" /> Open the Guide
            </Link>
          </div>

          {/* Streak Calendar Widget */}
          {stats && (
            <div className="glass-panel p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-heading text-white">Streak</h3>
                <div className="flex items-center gap-1.5 text-sm text-tertiary font-heading">
                  <Flame className="w-4 h-4" />
                  <span>{stats.streak.current} days</span>
                </div>
              </div>
              <StreakCalendar calendar={streakCalendar} />
            </div>
          )}
        </div>

        {/* Reflections + Communities */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
          <div className="glass-panel p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-heading text-white">Reflections</h3>
              <Link to="/app/journal" className="text-xs text-tertiary hover:underline">View All</Link>
            </div>
            {recentJournals.length > 0 ? (
              <div className="bg-surface-bright/30 p-3 sm:p-4 rounded-xl border border-white/5 relative">
                <span className="absolute top-2 right-3 text-2xl font-heading text-white/5">"</span>
                <p className="text-xs sm:text-sm text-text-muted italic leading-relaxed line-clamp-3">
                  {recentJournals[0].content}
                </p>
                <p className="text-[10px] text-text-muted/60 mt-2">
                  {formatDistanceToNow(new Date(recentJournals[0].createdAt), { addSuffix: true })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">No entries yet.</p>
            )}
            <Link to="/app/journal"
              className="w-full mt-4 py-2.5 sm:py-3 bg-surface-bright text-white rounded-full text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <PenLine className="w-4 h-4" /> Write Entry
            </Link>
          </div>

          <div className="glass-panel p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-heading text-white mb-4">Sanctuary Circles</h3>
            <div className="space-y-2 sm:space-y-3">
              {[
                { name: 'Night Walkers', members: '1.2k', color: 'bg-indigo-500/10 text-indigo-400' },
                { name: 'Minimalist Tech', members: '850', color: 'bg-teal-500/10 text-teal-400' },
                { name: 'Deep Reading Hub', members: '2.4k', color: 'bg-purple-500/10 text-purple-400' },
              ].map((c) => (
                <Link key={c.name} to="/app/communities"
                  className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-surface-bright/50 rounded-xl transition-colors border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${c.color} flex items-center justify-center text-sm font-bold shrink-0`}>
                      {c.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">{c.name}</p>
                      <p className="text-[10px] sm:text-xs text-text-muted">{c.members} members</p>
                    </div>
                  </div>
                  <span className="text-text-muted shrink-0">›</span>
                </Link>
              ))}
            </div>
            <Link to="/app/communities"
              className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 border border-dashed border-white/10 rounded-xl text-xs sm:text-sm text-text-muted hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Explore Communities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
