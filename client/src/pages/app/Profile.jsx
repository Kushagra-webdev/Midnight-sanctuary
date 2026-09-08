import React, { useState } from 'react';
import { BookOpen, History, Edit2, Check, X, Loader2, Flame, Target, Clock, Camera, Users, UserPlus } from 'lucide-react';
import { SkeletonProfile } from '../../components/SkeletonCard';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '' });

  const { data: stats, loading: statsLoading } = useFetch('/users/dashboard-stats');
  const { data: journals, loading: journalsLoading } = useFetch('/journals');

  const startEdit = () => {
    setForm({ name: user?.name || '', bio: user?.bio || '', avatarUrl: user?.avatarUrl || '' });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const PLAN_INFO = {
    Free: { label: 'The Seeker', color: 'text-text-muted', bg: 'bg-surface-bright border-white/10' },
    Pro: { label: 'The Disciplined', color: 'text-tertiary', bg: 'bg-tertiary/10 border-tertiary/20' },
    Premium: { label: 'The Eternal', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  };
  const plan = PLAN_INFO[user?.planType || 'Free'];

  const STAT_ITEMS = [
    { icon: Flame, val: stats?.streak?.current ?? 0, label: 'Current Streak', color: 'text-primary bg-primary/10' },
    { icon: Clock, val: `${stats?.focus?.totalHours ?? '0.0'}h`, label: 'Focus Time', color: 'text-tertiary bg-tertiary/10' },
    { icon: Target, val: `${stats?.tasks?.completionRate ?? 0}%`, label: 'Task Rate', color: 'text-indigo-400 bg-indigo-400/10' },
  ];

  if (!user) return <SkeletonProfile />;

  return (
    <div className="animate-fade-in pb-10">
      {/* Identity */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 mb-10">
        <div className="relative self-center sm:self-auto">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/10 relative z-10 bg-surface-dim">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name || 'user')}`}
              alt={user?.name} className="w-full h-full object-cover" />
          </div>
          {editing && (
            <div className="absolute bottom-0 right-0 z-20 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-surface">
              <Camera className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 w-full">
          {editing ? (
            <div className="space-y-3 max-w-md">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors" />
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="A short bio..." rows={2}
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors resize-none" />
              <input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                placeholder="Avatar URL (leave blank for generated)"
                className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm hover:scale-[0.98] transition-transform disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-bright text-text-muted hover:text-white rounded-xl text-sm transition-colors">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-white">{user?.name}</h1>
                <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${plan.bg} ${plan.color}`}>
                  {plan.label}
                </span>
                <button onClick={startEdit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-bright text-text-muted hover:text-white rounded-full text-xs transition-colors border border-white/5">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="flex gap-6 mb-3">
                {[
                  { val: stats?.streak?.activeDays ?? 0, label: 'Journey Days' },
                  { val: journals?.length ?? 0, label: 'Reflections' },
                  { val: stats?.streak?.highest ?? 0, label: 'Best Streak' },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <span className="block font-heading text-xl sm:text-2xl text-white">{val}</span>
                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/80 max-w-md leading-relaxed">
                {user?.bio || 'Seeking stillness in the noise. Click Edit to add your story.'}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 sm:mb-10">
          {STAT_ITEMS.map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="glass-panel p-3 sm:p-5 flex items-center gap-2 sm:gap-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-lg sm:text-2xl text-white leading-none">{val}</p>
                <p className="text-[10px] text-text-muted truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Activity Timeline */}
        <div className="lg:col-span-1 glass-panel p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-heading text-white flex items-center gap-2 mb-6 sm:mb-8">
            <History className="w-5 h-5 text-text-muted" /> Recent Activity
          </h3>
          <div className="relative border-l border-white/10 ml-3 space-y-6 pb-2">
            {journals?.slice(0, 4).map((entry, i) => (
              <div key={entry._id} className="relative pl-5 sm:pl-6">
                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-surface ${i % 2 === 0 ? 'bg-tertiary' : 'bg-primary'}`} />
                <p className="text-xs sm:text-sm font-medium text-white mb-0.5 line-clamp-1">Wrote "{entry.title}"</p>
                <p className="text-[10px] sm:text-xs text-text-muted">{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</p>
              </div>
            ))}
            {!journals?.length && <p className="text-sm text-text-muted pl-5">No activity yet.</p>}
          </div>
        </div>

        {/* Journal Grid */}
        <div className="lg:col-span-2 glass-panel p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-heading text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-text-muted" /> Private Journal
            </h3>
            <Link to="/app/journal" className="text-xs sm:text-sm text-tertiary hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {journals?.slice(0, 2).map((entry) => (
              <Link to="/app/journal" key={entry._id}
                className="bg-surface-dim p-4 sm:p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors block">
                <span className="text-[10px] sm:text-xs font-medium text-tertiary mb-2 block">
                  {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                </span>
                <h4 className="font-heading text-base sm:text-lg text-white mb-1 line-clamp-1">{entry.title}</h4>
                <p className="text-xs sm:text-sm text-text-muted line-clamp-2 leading-relaxed">{entry.content}</p>
              </Link>
            ))}
            <Link to="/app/journal"
              className="border-2 border-dashed border-white/10 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-text-muted hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[120px]">
              <BookOpen className="w-5 h-5 mb-2" />
              <span className="text-xs sm:text-sm font-medium">New Entry</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
