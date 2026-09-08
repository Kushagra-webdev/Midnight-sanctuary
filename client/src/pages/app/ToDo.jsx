import React, { useState, useMemo } from 'react';
import { Check, Circle, Sun, Plus, ChevronDown, Trash2, Loader2, Flag, Sparkles, Calendar, X, Bot } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { SkeletonList } from '../../components/SkeletonCard';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_STYLES = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 border-green-500/20',
};

// Simple inline calendar for due date picking
function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  const select = (d) => {
    if (!d) return;
    const date = new Date(year, month, d);
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;
    onChange(date.toISOString().split('T')[0]);
    onClose();
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-surface-dim border border-white/10 rounded-xl p-3 shadow-2xl w-56 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-text-muted hover:text-white p-1">‹</button>
        <span className="text-xs font-medium text-white">{monthNames[month]} {year}</span>
        <button onClick={nextMonth} className="text-text-muted hover:text-white p-1">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map(d => <div key={d} className="text-[9px] text-text-muted text-center py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const date = new Date(year, month, d);
          const isPastDay = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const sel = value && new Date(value).toDateString() === date.toDateString();
          return (
            <button key={i} onClick={() => select(d)} disabled={isPastDay}
              className={`text-[10px] rounded-md py-1 transition-colors ${
                sel ? 'bg-primary text-white' :
                isPastDay ? 'text-text-muted/30 cursor-not-allowed' :
                'text-text-main hover:bg-surface-bright'
              }`}>
              {d}
            </button>
          );
        })}
      </div>
      {value && (
        <button onClick={() => { onChange(''); onClose(); }} className="w-full mt-2 text-[10px] text-red-400 hover:text-red-300 transition-colors">
          Clear date
        </button>
      )}
    </div>
  );
}

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isToday(d)) return { label: 'Today', color: 'text-yellow-400' };
  if (isTomorrow(d)) return { label: 'Tomorrow', color: 'text-blue-400' };
  if (isPast(d)) return { label: `Overdue (${format(d, 'MMM d')})`, color: 'text-red-400' };
  return { label: format(d, 'MMM d'), color: 'text-text-muted' };
}

export default function ToDo() {
  const { user } = useAuth();
  const { data: tasks, loading, refetch } = useFetch('/tasks');
  const [form, setForm] = useState({ title: '', priority: 'Medium', dueDate: '' });
  const [showCalendar, setShowCalendar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const isPro = user?.planType === 'Pro' || user?.planType === 'Premium';

  const completedCount = tasks?.filter((t) => t.isCompleted).length || 0;
  const totalCount = tasks?.length || 0;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filtered = useMemo(() => {
    let list = tasks || [];
    if (filter === 'active') list = list.filter(t => !t.isCompleted);
    else if (filter === 'done') list = list.filter(t => t.isCompleted);
    else if (filter === 'overdue') list = list.filter(t => !t.isCompleted && t.dueDate && isPast(new Date(t.dueDate)));
    return list;
  }, [tasks, filter]);

  // Group tasks by due date for calendar view
  const tasksByDate = useMemo(() => {
    if (viewMode !== 'calendar') return {};
    const groups = {};
    (tasks || []).forEach(t => {
      if (!t.dueDate) return;
      const key = t.dueDate.split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [tasks, viewMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        title: form.title.trim(),
        priority: form.priority,
        dueDate: form.dueDate || undefined,
      });
      setForm({ title: '', priority: 'Medium', dueDate: '' });
      refetch();
      toast.success('Intention seeded ✓');
    } catch { toast.error('Could not add task'); }
    finally { setSubmitting(false); }
  };

  const toggleTask = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted });
      refetch();
      if (!task.isCompleted) toast.success('Fulfilled ✓');
    } catch { toast.error('Update failed'); }
  };

  const deleteTask = async (id) => {
    setDeletingId(id);
    try { await api.delete(`/tasks/${id}`); refetch(); toast.success('Removed'); }
    catch { toast.error('Delete failed'); }
    finally { setDeletingId(null); }
  };

  const fetchAISuggestions = async () => {
    if (!isPro) return toast.error('AI suggestions require Pro plan');
    setAiLoading(true);
    setShowAI(true);
    try {
      const { data } = await api.post('/tasks/ai-suggest');
      setAiSuggestions(data.suggestions);
    } catch { toast.error('AI unavailable'); setShowAI(false); }
    finally { setAiLoading(false); }
  };

  const addAISuggestion = async (s) => {
    try {
      await api.post('/tasks', { title: s.title, priority: s.priority || 'Medium', aiSuggested: true, description: s.description });
      refetch();
      setAiSuggestions(prev => prev.filter(x => x.title !== s.title));
      toast.success('Task added from AI suggestion ✓');
    } catch { toast.error('Could not add task'); }
  };

  // Next 7 days for calendar view
  const next7Days = useMemo(() => {
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-white mb-2">Intentional Day</h1>
          <p className="text-text-muted text-sm">{completedCount} of {totalCount} intentions honored today.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-surface-dim rounded-xl border border-white/5">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>List</button>
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Calendar
            </button>
          </div>
          {/* AI suggest */}
          <button onClick={fetchAISuggestions} disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-medium hover:bg-primary/15 transition-colors disabled:opacity-50">
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Suggest
            {!isPro && <span className="ml-1 text-[9px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded">Pro</span>}
          </button>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAI && (
        <div className="glass-panel p-4 mb-6 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">AI-Suggested Tasks</span>
              <span className="text-[10px] text-text-muted">Based on your journal entries</span>
            </div>
            <button onClick={() => setShowAI(false)} className="text-text-muted hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {aiLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-xl" />)}
            </div>
          ) : aiSuggestions.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">All suggestions have been added!</p>
          ) : (
            <div className="space-y-2">
              {aiSuggestions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-dim border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.title}</p>
                    {s.description && <p className="text-xs text-text-muted truncate">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.Medium}`}>{s.priority}</span>
                    <button onClick={() => addAISuggestion(s)}
                      className="px-3 py-1 bg-primary/15 text-primary border border-primary/20 rounded-lg text-xs hover:bg-primary/25 transition-colors">
                      <Plus className="w-3 h-3 inline" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="glass-panel p-4 sm:p-6 mb-6">
          <h3 className="font-heading text-lg text-white mb-4">Next 7 Days</h3>
          <div className="grid grid-cols-7 gap-2">
            {next7Days.map(dateStr => {
              const date = new Date(dateStr);
              const dayTasks = tasksByDate[dateStr] || [];
              const isTd = isToday(date);
              return (
                <div key={dateStr} className={`rounded-xl p-2 border transition-colors ${isTd ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-surface-dim'}`}>
                  <p className={`text-[10px] font-bold mb-1 ${isTd ? 'text-primary' : 'text-text-muted'}`}>
                    {format(date, 'EEE')}
                  </p>
                  <p className={`text-sm font-heading mb-2 ${isTd ? 'text-white' : 'text-text-main'}`}>
                    {format(date, 'd')}
                  </p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t._id} className={`text-[9px] px-1 py-0.5 rounded truncate ${t.isCompleted ? 'line-through text-text-muted' : 'text-white bg-primary/10'}`}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && <div className="text-[9px] text-text-muted">+{dayTasks.length - 2} more</div>}
                    {dayTasks.length === 0 && <div className="text-[9px] text-text-muted/40">—</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-muted mt-3">Only tasks with due dates appear here. Add a due date when creating tasks.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top task highlight */}
          {filtered.filter(t => !t.isCompleted)[0] && (
            <div className="glass-panel p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 text-white/5 pointer-events-none">
                <Sun className="w-40 h-40" strokeWidth={1} />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-tertiary mb-2 block">Priority of the Day</span>
              <h2 className="font-heading text-xl sm:text-2xl text-white mb-4 leading-snug max-w-lg">
                {filtered.filter(t => !t.isCompleted)[0].title}
              </h2>
              {filtered.filter(t => !t.isCompleted)[0].dueDate && (() => {
                const due = formatDueDate(filtered.filter(t => !t.isCompleted)[0].dueDate);
                return <p className={`text-xs mb-3 ${due.color}`}><Calendar className="w-3 h-3 inline mr-1" />{due.label}</p>;
              })()}
              <button onClick={() => toggleTask(filtered.filter(t => !t.isCompleted)[0])}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:scale-[0.98] transition-transform shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Check className="w-4 h-4" /> Mark as Fulfilled
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 bg-surface-dim rounded-2xl w-fit border border-white/5">
            {['all', 'active', 'done', 'overdue'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Task rows */}
          {loading ? (
            <SkeletonList count={4} />
          ) : filtered.length === 0 ? (
            <p className="text-center text-text-muted py-10 text-sm">
              {filter === 'done' ? 'No completed tasks yet.' : filter === 'overdue' ? 'No overdue tasks! 🎉' : 'All clear! Add an intention.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((task) => {
                const due = task.dueDate ? formatDueDate(task.dueDate) : null;
                return (
                  <div key={task._id} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-surface-dim border border-white/5 hover:border-white/10 transition-colors group">
                    <button onClick={() => toggleTask(task)} className="shrink-0">
                      {task.isCompleted
                        ? <div className="w-5 h-5 rounded flex items-center justify-center bg-tertiary text-surface"><Check className="w-3 h-3" strokeWidth={3} /></div>
                        : <Circle className="w-5 h-5 text-text-muted hover:text-tertiary transition-colors" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block ${task.isCompleted ? 'text-text-muted line-through' : 'text-white'}`}>
                        {task.title}
                        {task.aiSuggested && <span className="ml-1.5 text-[9px] bg-primary/10 text-primary border border-primary/20 px-1 rounded">AI</span>}
                      </span>
                      {due && !task.isCompleted && (
                        <span className={`text-[10px] ${due.color} flex items-center gap-0.5 mt-0.5`}>
                          <Calendar className="w-2.5 h-2.5" />{due.label}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 hidden sm:block ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </span>
                    <button onClick={() => deleteTask(task._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400 shrink-0">
                      {deletingId === task._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar widgets */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Progress Ring */}
          <div className="glass-panel p-5 sm:p-6 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-4 block w-full text-left">Daily Rhythm</span>
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="52" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <circle cx="64" cy="64" r="52" stroke="currentColor" strokeWidth="6" fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
                  strokeLinecap="round" className="text-tertiary transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-2xl sm:text-3xl text-white">{pct}%</span>
                <span className="text-[9px] uppercase tracking-widest text-text-muted">Done</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-text-muted">{completedCount}/{totalCount} completed</p>
          </div>

          {/* Add Task Form */}
          <div className="glass-panel p-4 sm:p-6">
            <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-3 block">New Intention</span>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What will you honor?"
                className="w-full bg-surface-dim border border-white/5 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20 transition-colors" />
              <div className="relative">
                <select value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-surface-dim border border-white/5 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white appearance-none focus:outline-none focus:border-white/20 cursor-pointer">
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>

              {/* Due date picker */}
              <div className="relative">
                <button type="button" onClick={() => setShowCalendar(s => !s)}
                  className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-surface-dim border border-white/5 rounded-xl text-sm text-left hover:border-white/10 transition-colors">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                  <span className={form.dueDate ? 'text-white' : 'text-text-muted/60'}>
                    {form.dueDate ? format(parseISO(form.dueDate), 'MMM d, yyyy') : 'Set due date (optional)'}
                  </span>
                  {form.dueDate && (
                    <button type="button" onClick={e => { e.stopPropagation(); setForm({...form, dueDate: ''}); }}
                      className="ml-auto text-text-muted hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>
                {showCalendar && (
                  <CalendarPicker
                    value={form.dueDate}
                    onChange={d => setForm({...form, dueDate: d})}
                    onClose={() => setShowCalendar(false)}
                  />
                )}
              </div>

              <button type="submit" disabled={submitting || !form.title.trim()}
                className="w-full py-2.5 sm:py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Manifest
              </button>
            </form>
          </div>

          {/* Stats summary */}
          <div className="glass-panel p-4 sm:p-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-text-muted">Total tasks</span>
              <span className="text-sm font-medium text-white">{totalCount}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-text-muted">Completed</span>
              <span className="text-sm font-medium text-tertiary">{completedCount}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-text-muted">Pending</span>
              <span className="text-sm font-medium text-white">{totalCount - completedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">With due date</span>
              <span className="text-sm font-medium text-white">{(tasks || []).filter(t => t.dueDate).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
