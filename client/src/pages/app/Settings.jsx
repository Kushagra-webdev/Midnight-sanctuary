import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Check, Loader2, User, Lock, Shield, ArrowRight, IndianRupee, Zap, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSearchParams, Link } from 'react-router-dom';

const PLANS = [
  {
    id: 'Free', name: 'The Seeker', price: 0, icon: '○', color: 'text-text-muted',
    features: ['Standard Blocker Tools', 'Manual Quiet Mode', '3 Journal Entries/month', 'Basic Dashboard'],
  },
  {
    id: 'Pro', name: 'The Disciplined', price: 999, interval: 'mo', icon: '◆', color: 'text-tertiary', highlighted: true,
    features: ['Full AI Guide (Gemini 2.0)', 'Unlimited Journaling', 'Community Hub', 'Advanced Blocker', 'Daily AI Affirmations', 'Journal AI Insights'],
  },
  {
    id: 'Premium', name: 'The Eternal', price: 14999, interval: 'once', icon: '✦', color: 'text-yellow-400',
    features: ['Everything in Pro', 'Lifetime Access', 'Early Beta Access', 'Private Servers', '1-on-1 Wellness Call'],
  },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('subscription');
  const [upgrading, setUpgrading] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const status = searchParams.get('payment');
    const plan = searchParams.get('plan');
    if (status === 'success' && plan) { toast.success(`🎉 Welcome to ${plan}!`); refreshUser(); }
    else if (status === 'cancelled') toast('Payment cancelled.');
  }, [searchParams, refreshUser]);

  const handleRazorpay = useCallback(async (planId) => {
    setUpgrading(planId);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('SDK load failed');
      const { data: order } = await api.post('/payments/create-order', { planType: planId });
      const opts = {
        key: order.keyId, amount: order.amount, currency: order.currency,
        name: 'Midnight Sanctuary', description: order.planName, order_id: order.orderId,
        prefill: { name: order.userName, email: order.userEmail },
        theme: { color: '#6366F1' },
        modal: { ondismiss: () => { setUpgrading(''); toast('Payment closed.'); } },
        handler: async (r) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: r.razorpay_order_id,
              razorpay_payment_id: r.razorpay_payment_id,
              razorpay_signature: r.razorpay_signature,
              planType: planId,
            });
            await refreshUser();
            toast.success(`🎉 Upgraded to ${planId}!`);
          } catch { toast.error('Verification failed. Contact support.'); }
          finally { setUpgrading(''); }
        },
      };
      const rzp = new window.Razorpay(opts);
      rzp.on('payment.failed', (r) => { toast.error(`Payment failed: ${r.error.description}`); setUpgrading(''); });
      rzp.open();
    } catch {
      try {
        await api.post('/payments/demo-upgrade', { planType: planId });
        await refreshUser();
        toast.success(`🎉 Upgraded to ${planId}! (Demo)`);
      } catch (e) { toast.error(e.response?.data?.message || 'Upgrade failed'); }
      finally { setUpgrading(''); }
    }
  }, [refreshUser]);

  const handleUpgrade = async (planId) => {
    if (planId === user?.planType) return;
    if (planId === 'Free') {
      setUpgrading('Free');
      try { await api.post('/payments/demo-upgrade', { planType: 'Free' }); await refreshUser(); toast.success('Downgraded to Free'); }
      catch { toast.error('Failed'); } finally { setUpgrading(''); }
      return;
    }
    await handleRazorpay(planId);
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPass !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPass.length < 8) { toast.error('Min 8 characters'); return; }
    setSavingPw(true);
    try { await api.put('/users/profile', { password: pwForm.newPass }); setPwForm({ current: '', newPass: '', confirm: '' }); toast.success('Password updated'); }
    catch { toast.error('Update failed'); } finally { setSavingPw(false); }
  };

  const TABS = [
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl text-white mb-2">Settings</h1>
        <p className="text-text-muted text-sm">Manage your account and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-dim rounded-2xl w-full sm:w-fit border border-white/5 mb-8 sm:mb-10 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === id ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{label}
          </button>
        ))}
      </div>

      {/* Subscription */}
      {tab === 'subscription' && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
            <div className="glass-panel px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3">
              <Crown className="w-4 h-4 text-tertiary" />
              <span className="text-xs sm:text-sm text-white">
                Plan: <span className="font-medium text-tertiary">{PLANS.find(p => p.id === user?.planType)?.name}</span>
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-text-muted bg-surface-dim px-3 py-2 rounded-xl border border-white/5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-tertiary" /> Razorpay · INR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {PLANS.map((plan) => {
              const isCurrent = user?.planType === plan.id;
              return (
                <div key={plan.id} className={`glass-panel p-5 sm:p-6 flex flex-col relative ${plan.highlighted ? 'border-t-2 border-t-tertiary' : ''} ${isCurrent ? 'ring-1 ring-primary/40' : ''}`}>
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-tertiary bg-surface px-3 py-1 rounded-full border border-tertiary/30 whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-3 text-[9px] font-bold tracking-widest uppercase text-primary bg-surface px-3 py-1 rounded-full border border-primary/30">
                      Active
                    </span>
                  )}
                  <div className={`text-xl sm:text-2xl mb-2 ${plan.color}`}>{plan.icon}</div>
                  <h3 className="font-heading text-lg sm:text-xl text-white mb-1">{plan.name}</h3>
                  <div className="mb-4 sm:mb-6 flex items-baseline gap-0.5">
                    {plan.price === 0 ? <span className="font-heading text-2xl sm:text-3xl text-white">Free</span> : (
                      <><IndianRupee className="w-4 h-4 text-white/60 self-start mt-1" />
                        <span className={`font-heading text-2xl sm:text-3xl ${plan.highlighted ? 'text-tertiary' : 'text-white'}`}>{plan.price.toLocaleString('en-IN')}</span>
                        {plan.interval && <span className="text-xs text-text-muted ml-1">/{plan.interval}</span>}
                      </>
                    )}
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-text-main">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tertiary shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleUpgrade(plan.id)} disabled={isCurrent || upgrading === plan.id}
                    className={`w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      isCurrent ? 'bg-surface-bright text-text-muted cursor-default'
                      : plan.highlighted ? 'bg-tertiary text-surface hover:scale-[0.98] shadow-[0_0_15px_rgba(45,212,191,0.3)]'
                      : plan.id === 'Premium' ? 'bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20'
                      : 'bg-surface-bright border border-white/10 text-white hover:bg-white/10'}`}>
                    {upgrading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isCurrent ? <><Check className="w-4 h-4" /> Current</>
                      : plan.price === 0 ? 'Downgrade'
                      : <><ArrowRight className="w-4 h-4" /> Upgrade</>}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 glass-panel p-4 sm:p-5 flex items-start gap-3 sm:gap-4 border border-white/5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-white mb-1">Secure payments via Razorpay</p>
              <p className="text-[10px] sm:text-xs text-text-muted leading-relaxed">
                Supports UPI, cards, netbanking & wallets. Without Razorpay keys, demo mode upgrades instantly.
                <br /><span className="text-tertiary">Test card: 4111 1111 1111 1111 · Any future date · Any CVV</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account */}
      {tab === 'account' && (
        <div className="max-w-lg glass-panel p-5 sm:p-8">
          <h3 className="font-heading text-xl sm:text-2xl text-white mb-5 sm:mb-6">Account Details</h3>
          <div className="space-y-4">
            {[{ label: 'Name', value: user?.name }, { label: 'Email', value: user?.email },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' },
              { label: 'Current Plan', value: PLANS.find(p => p.id === user?.planType)?.name || '—' }
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="text-[10px] uppercase tracking-widest text-text-muted font-bold block mb-1.5">{label}</label>
                <p className="text-white text-sm bg-surface-dim px-4 py-2.5 rounded-xl border border-white/5">{value}</p>
              </div>
            ))}
            <Link to="/app/profile"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform mt-2">
              <User className="w-4 h-4" /> Edit Full Profile
            </Link>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="max-w-lg glass-panel p-5 sm:p-8">
          <h3 className="font-heading text-xl sm:text-2xl text-white mb-5 sm:mb-6">Change Password</h3>
          <form onSubmit={handlePwSubmit} className="space-y-4">
            {[{ key: 'current', label: 'Current Password' }, { key: 'newPass', label: 'New Password' }, { key: 'confirm', label: 'Confirm New Password' }].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] uppercase tracking-widest text-text-muted font-bold block mb-1.5">{label}</label>
                <input type="password" value={pwForm[key]} onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                  className="w-full bg-surface-dim border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="••••••••" />
              </div>
            ))}
            <button type="submit" disabled={savingPw}
              className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} Update Password
            </button>
          </form>
        </div>
      )}

      {/* Appearance */}
      {tab === 'appearance' && (
        <div className="max-w-lg space-y-4">
          <div className="glass-panel p-5 sm:p-8">
            <h3 className="font-heading text-xl sm:text-2xl text-white mb-6">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-text-muted font-bold block mb-3">Color Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-surface-dim hover:border-white/15'}`}>
                    <div className="w-full h-12 rounded-lg bg-surface border border-white/10 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-white">Dark</span>
                    {theme === 'dark' && <span className="text-[9px] text-primary">Active</span>}
                  </button>
                  <button onClick={() => theme !== 'light' && toggleTheme()}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-surface-dim hover:border-white/15'}`}>
                    <div className="w-full h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-yellow-500" />
                    </div>
                    <span className="text-xs font-medium text-white">Light</span>
                    {theme === 'light' && <span className="text-[9px] text-primary">Active</span>}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-text-muted">
                Theme preference is saved automatically and persists across sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
