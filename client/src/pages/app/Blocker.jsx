import React, { useState, useEffect } from 'react';
import { Sun, BarChart2, Globe, MonitorPlay, ShoppingCart, Clock, Save, Crown, Loader2, Shield, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Toggle = ({ active, onChange, disabled }) => (
  <button type="button" onClick={onChange} disabled={disabled}
    className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 shrink-0 ${active ? 'bg-tertiary' : 'bg-surface-bright/50 border border-white/10'}`}>
    <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const FILTERS = [
  { key: 'social', icon: Globe, label: 'Social Media', desc: 'Instagram, Twitter, TikTok' },
  { key: 'streaming', icon: MonitorPlay, label: 'Streaming', desc: 'YouTube, Netflix, Prime' },
  { key: 'ecommerce', icon: ShoppingCart, label: 'E-Commerce', desc: 'Amazon, Flipkart, Myntra' },
];

export default function Blocker() {
  const { user, refreshUser } = useAuth();
  const { data: stats } = useFetch('/focus/stats');
  const isPro = user?.planType === 'Pro' || user?.planType === 'Premium';

  const [settings, setSettings] = useState({
    deepFocusEnabled: false,
    blockedCategories: { social: true, streaming: true, ecommerce: false },
    quietHours: { enabled: true, start: '22:00', end: '07:00' },
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (user?.blockerSettings) {
      setSettings({
        deepFocusEnabled: user.blockerSettings.deepFocusEnabled ?? false,
        blockedCategories: {
          social: user.blockerSettings.blockedCategories?.social ?? true,
          streaming: user.blockerSettings.blockedCategories?.streaming ?? true,
          ecommerce: user.blockerSettings.blockedCategories?.ecommerce ?? false,
        },
        quietHours: {
          enabled: user.blockerSettings.quietHours?.enabled ?? true,
          start: user.blockerSettings.quietHours?.start ?? '22:00',
          end: user.blockerSettings.quietHours?.end ?? '07:00',
        },
      });
    }
  }, [user]);

  const update = (path, value) => {
    setSettings(prev => {
      const keys = path.split('.');
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setDirty(true);
  };

  const saveSettings = async () => {
    if (!isPro) { toast.error('Requires Pro plan'); return; }
    setSaving(true);
    try {
      await api.put('/users/blocker-settings', settings);
      await refreshUser();
      setDirty(false);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-white mb-2">Blocker</h1>
          <p className="text-text-muted text-sm">Reclaim your attention. Silence the noise.</p>
        </div>
        {dirty && isPro && (
          <button onClick={saveSettings} disabled={saving}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-primary text-white rounded-full text-sm font-medium hover:scale-[0.98] transition-transform">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        )}
      </div>

      {!isPro && (
        <div className="glass-panel p-4 sm:p-6 border border-tertiary/20 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Crown className="w-7 h-7 text-tertiary shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-white font-medium text-sm sm:text-base">Unlock Advanced Blocker</p>
              <p className="text-xs text-text-muted">Deep Focus & custom schedules require Pro.</p>
            </div>
          </div>
          <Link to="/app/settings"
            className="px-4 py-2 bg-tertiary text-surface text-sm font-medium rounded-full hover:scale-95 transition-transform shrink-0">
            Upgrade
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Deep Focus */}
        <div className="sm:col-span-2 glass-panel p-5 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/5 pointer-events-none hidden sm:block">
            <Sun className="w-56 h-56 translate-x-1/3" strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <span className={`inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full mb-4 ${isPro ? 'bg-tertiary/10 text-tertiary' : 'bg-surface-bright text-text-muted'}`}>
              {isPro ? 'Premium Ritual' : '🔒 Pro Feature'}
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl text-white mb-2">Deep Focus Mode</h2>
            <p className="text-text-muted text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
              Activates high-level blocking across all categories. Notifications deferred until session ends.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <Toggle active={settings.deepFocusEnabled}
              onChange={() => update('deepFocusEnabled', !settings.deepFocusEnabled)} disabled={!isPro} />
            <span className="text-sm font-medium text-white">
              {settings.deepFocusEnabled ? 'Active' : 'Activate Session'}
            </span>
            {settings.deepFocusEnabled && <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />}
          </div>
        </div>

        {/* Stats */}
        <div className="sm:col-span-1 glass-panel p-5 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary mb-3">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1 block">Time Reclaimed</span>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-4xl sm:text-5xl text-tertiary">{stats?.totalHours || '0.0'}</span>
              <span className="text-tertiary/80">hrs</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-muted">Sessions</span>
              <span className="text-white font-medium">{stats?.totalSessions || 0}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-bright rounded-full overflow-hidden">
              <div className="h-full bg-tertiary rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(stats?.successRate || 0, 100)}%` }} />
            </div>
            <p className="text-[10px] text-text-muted mt-1">{stats?.successRate || 0}% success rate</p>
          </div>
        </div>

        {/* Distraction Filter */}
        <div className="sm:col-span-2 glass-panel p-4 sm:p-8">
          <div className="flex items-center gap-2 mb-5 sm:mb-8">
            <Shield className="w-5 h-5 text-text-muted" />
            <h3 className="text-lg sm:text-xl font-heading text-white">Distraction Filter</h3>
          </div>
          <div className="space-y-3">
            {FILTERS.map(({ key, icon: Icon, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-dim border border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-bright flex items-center justify-center text-text-muted shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white">{label}</h4>
                    <p className="text-[10px] sm:text-xs text-text-muted truncate">{desc}</p>
                  </div>
                </div>
                <Toggle active={settings.blockedCategories[key]}
                  onChange={() => update(`blockedCategories.${key}`, !settings.blockedCategories[key])}
                  disabled={!isPro} />
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="sm:col-span-1 glass-panel p-4 sm:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-text-muted" />
            <h3 className="text-lg sm:text-xl font-heading text-white">Quiet Hours</h3>
          </div>
          <div className="bg-surface-dim p-4 rounded-xl border border-white/5 flex-1 mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-white">Nightly Recharge</span>
              <Toggle active={settings.quietHours.enabled}
                onChange={() => update('quietHours.enabled', !settings.quietHours.enabled)} disabled={!isPro} />
            </div>
            <div className="flex items-center gap-2 mb-5">
              <input type="time" value={settings.quietHours.start}
                onChange={(e) => update('quietHours.start', e.target.value)} disabled={!isPro}
                className="flex-1 bg-surface-bright border border-white/10 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-40 min-w-0" />
              <span className="text-text-muted text-xs shrink-0">to</span>
              <input type="time" value={settings.quietHours.end}
                onChange={(e) => update('quietHours.end', e.target.value)} disabled={!isPro}
                className="flex-1 bg-surface-bright border border-white/10 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-40 min-w-0" />
            </div>
            <div className="flex gap-1">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className={`flex-1 h-6 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${i < 5 ? 'bg-tertiary text-surface' : 'bg-surface-bright text-text-muted'}`}>{d}</div>
              ))}
            </div>
          </div>
          {dirty && isPro && (
            <button onClick={saveSettings} disabled={saving}
              className="w-full py-2.5 sm:py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          )}
        </div>

        {/* Quote Banner */}
        <div className="sm:col-span-2 lg:col-span-3 relative h-28 sm:h-36 rounded-2xl overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/60 to-transparent" />
          <div className="absolute inset-0 p-5 sm:p-8 flex items-end">
            <div>
              <h4 className="font-heading text-lg sm:text-2xl text-white mb-1">"Stillness is where creativity begins."</h4>
              <span className="text-tertiary text-xs sm:text-sm flex items-center gap-2">
                <span className="w-4 h-[1px] bg-tertiary block" /> Midnight Sanctuary
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
