import React, { useState } from 'react';
import { PenLine, Lock, Plus, Trash2, Loader2, Sparkles, BookOpen, ArrowLeft, Search, Download, X, Tag } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { SkeletonGrid } from '../../components/SkeletonCard';

const MOOD_COLORS = ['', 'bg-red-500','bg-red-400','bg-orange-500','bg-orange-400','bg-yellow-500','bg-yellow-400','bg-green-400','bg-green-500','bg-teal-400','bg-tertiary'];
const MOOD_LABELS = ['','Very Low','Low','Low-Avg','Below Avg','Neutral','Okay','Good','Great','Excellent','Peak'];

export default function Journal() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('q', search);
  if (activeTag) queryParams.set('tag', activeTag);
  const queryStr = queryParams.toString();

  const { data: journals, loading, refetch } = useFetch(`/journals${queryStr ? '?' + queryStr : ''}`);

  const [mode, setMode] = useState('grid'); // 'grid' | 'write' | 'read'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', moodScore: 7, tags: '' });
  const [submitting, setSubmitting] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const isPro = user?.planType === 'Pro' || user?.planType === 'Premium';

  // Collect all unique tags from journals
  const allTags = [...new Set((journals || []).flatMap(j => j.tags || []))].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/journals', {
        title: form.title || 'Untitled Entry',
        content: form.content,
        moodScore: form.moodScore,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setForm({ title: '', content: '', moodScore: 7, tags: '' });
      setAiInsight('');
      setMode('grid');
      refetch();
      toast.success('Entry saved to your sanctuary');
    } catch { toast.error('Could not save entry'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await api.delete(`/journals/${id}`);
      if (selected?._id === id) { setSelected(null); setMode('grid'); }
      refetch();
      toast.success('Entry removed');
    } catch { toast.error('Delete failed'); }
    finally { setDeletingId(null); }
  };

  const getAIInsight = async () => {
    if (!isPro || !form.content.trim()) return;
    setLoadingInsight(true);
    try {
      const { data } = await api.post('/ai/journal-insight', { content: form.content, moodScore: form.moodScore });
      setAiInsight(data.insight);
    } catch { toast.error('AI insight unavailable'); }
    finally { setLoadingInsight(false); }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await api.get(`/journals/export?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `midnight-sanctuary-journal.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Journal exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  if (mode === 'write') return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setMode('grid'); setAiInsight(''); }}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-heading text-2xl sm:text-3xl text-white">New Reflection</h1>
      </div>
      <div className="glass-panel p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Give this entry a title..."
            className="w-full bg-surface-dim border border-white/5 rounded-xl px-4 py-3 text-white text-lg sm:text-xl font-heading placeholder-text-muted/60 focus:outline-none focus:border-white/20 transition-colors" />
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="What's on your mind today? This space is yours alone..."
            rows={8}
            className="w-full bg-surface-dim border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20 transition-colors resize-none leading-relaxed" />

          {/* Mood */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold tracking-widest uppercase text-text-muted">Mood</label>
              <span className="text-sm font-medium text-white">{form.moodScore}/10 · {MOOD_LABELS[form.moodScore]}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setForm({ ...form, moodScore: n })}
                  className={`flex-1 h-2 sm:h-2.5 rounded-full transition-all ${n <= form.moodScore ? MOOD_COLORS[form.moodScore] : 'bg-surface-bright'}`} />
              ))}
            </div>
          </div>

          <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags: gratitude, clarity, struggle (comma separated)"
            className="w-full bg-surface-dim border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20 transition-colors" />

          {/* AI Insight — Pro */}
          {isPro && (
            <div className="border-t border-white/5 pt-4">
              <button type="button" onClick={getAIInsight} disabled={!form.content.trim() || loadingInsight}
                className="flex items-center gap-2 text-sm text-tertiary hover:text-white transition-colors disabled:opacity-50">
                {loadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingInsight ? 'Guide is reflecting...' : 'Get AI Insight from the Guide'}
              </button>
              {aiInsight && (
                <div className="mt-4 p-4 sm:p-5 rounded-xl border border-tertiary/20 bg-tertiary/5">
                  <p className="text-sm text-text-main leading-relaxed italic">{aiInsight}</p>
                  <span className="text-[10px] text-tertiary mt-2 block uppercase tracking-widest">— The Stillness Guide</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit" disabled={submitting || !form.content.trim()}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Save & Lock Entry
            </button>
            <button type="button" onClick={() => { setMode('grid'); setAiInsight(''); }}
              className="px-6 py-3 border border-white/10 text-text-muted hover:text-white rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (mode === 'read' && selected) return (
    <div className="animate-fade-in pb-10">
      <button onClick={() => { setSelected(null); setMode('grid'); }}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to journal
      </button>
      <div className="glass-panel p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs text-tertiary mb-1">{format(new Date(selected.createdAt), 'MMMM d, yyyy · h:mm a')}</p>
            <h2 className="font-heading text-2xl sm:text-3xl text-white">{selected.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {selected.moodScore && <div className={`w-3 h-3 rounded-full ${MOOD_COLORS[selected.moodScore]}`} />}
            <span className="text-sm text-text-muted">{selected.moodScore}/10 · {MOOD_LABELS[selected.moodScore]}</span>
            <Lock className="w-4 h-4 text-text-muted ml-2" />
          </div>
        </div>
        <p className="text-text-main leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap mb-6">{selected.content}</p>
        {selected.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {selected.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-surface-dim border border-white/5 text-xs text-text-muted">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Grid view
  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-white mb-2">Private Journal</h1>
          <p className="text-text-muted text-sm">{journals?.length || 0} entries · All private & encrypted</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export */}
          <div className="relative group">
            <button disabled={exporting}
              className="flex items-center gap-2 px-3 py-2.5 border border-white/10 text-text-muted hover:text-white rounded-full text-sm transition-colors disabled:opacity-50">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 top-11 hidden group-hover:block bg-surface-dim border border-white/10 rounded-xl overflow-hidden z-10 min-w-[120px]">
              <button onClick={() => handleExport('json')}
                className="w-full px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-surface-bright text-left transition-colors">
                JSON
              </button>
              <button onClick={() => handleExport('csv')}
                className="w-full px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-surface-bright text-left transition-colors">
                CSV
              </button>
            </div>
          </div>
          <button onClick={() => setMode('write')}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-primary text-white rounded-full text-sm font-medium hover:scale-[0.98] transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <PenLine className="w-4 h-4" /> New Entry
          </button>
        </div>
      </div>

      {/* Search + Tag Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="w-full bg-surface-dim border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/15" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <Tag className="w-3.5 h-3.5 text-text-muted shrink-0" />
            {allTags.slice(0, 5).map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${activeTag === tag ? 'bg-primary/15 border-primary/30 text-white' : 'border-white/10 text-text-muted hover:text-white'}`}>
                #{tag}
              </button>
            ))}
            {activeTag && (
              <button onClick={() => setActiveTag('')} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : journals?.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <p className="text-text-muted text-sm">
            {search || activeTag ? 'No entries match your search.' : 'Your journal is empty. Begin your first reflection.'}
          </p>
          {!search && !activeTag && (
            <button onClick={() => setMode('write')} className="mt-4 px-5 py-2.5 bg-primary text-white rounded-full text-sm hover:scale-[0.98] transition-transform">
              Write now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {journals.map((entry) => (
            <article key={entry._id} onClick={() => { setSelected(entry); setMode('read'); }}
              className="bg-surface-dim p-4 sm:p-5 rounded-xl border border-white/5 group cursor-pointer hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-tertiary">{format(new Date(entry.createdAt), 'MMM d, yyyy')}</span>
                <div className="flex items-center gap-2">
                  {entry.moodScore && <div className={`w-2 h-2 rounded-full ${MOOD_COLORS[entry.moodScore]}`} />}
                  <button onClick={(e) => handleDelete(entry._id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400">
                    {deletingId === entry._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                  <Lock className="w-3 h-3 text-text-muted/40" />
                </div>
              </div>
              <h4 className="font-heading text-base sm:text-lg text-white mb-2 line-clamp-1">{entry.title}</h4>
              <p className="text-xs sm:text-sm text-text-muted line-clamp-3 leading-relaxed">{entry.content}</p>
              {entry.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-3">
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-bright text-text-muted">#{tag}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
          <button onClick={() => setMode('write')}
            className="bg-transparent border-2 border-dashed border-white/10 rounded-xl p-5 flex flex-col items-center justify-center text-text-muted hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[140px] sm:min-h-[180px]">
            <Plus className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">New Entry</span>
          </button>
        </div>
      )}
    </div>
  );
}
