import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Sparkles, Loader2, IndianRupee, Zap, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PLANS = [
  { id: 'Free', name: 'The Seeker', tagline: 'Begin the journey.', price: { monthly: 0, annual: 0 }, icon: '○',
    features: ['Standard Blocker Tools', 'Manual Quiet Mode', '3 Journal Entries/month', 'Basic Dashboard'] },
  { id: 'Pro', name: 'The Disciplined', tagline: 'For those committed to mastery.', price: { monthly: 999, annual: 749 }, icon: '◆', highlighted: true,
    features: ['Full AI Guide (Gemini 2.0)', 'Unlimited Journaling + AI Insights', 'Community Hub', 'Advanced Site Blocker', 'Daily AI Affirmations', 'Focus Timer & Stats'] },
  { id: 'Premium', name: 'The Eternal', tagline: 'One payment. A lifetime of stillness.', price: { monthly: 14999, annual: 14999 }, icon: '✦', lifetime: true,
    features: ['Everything in The Disciplined', 'Lifetime access — pay once', 'Early access to features', 'Private community servers', '1-on-1 Wellness Call'] },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Pricing() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleRazorpay = useCallback(async (planId) => {
    setLoading(planId);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('SDK load failed');
      const { data: order } = await api.post('/payments/create-order', { planType: planId });
      const opts = {
        key: order.keyId, amount: order.amount, currency: order.currency,
        name: 'Midnight Sanctuary', description: order.planName, order_id: order.orderId,
        prefill: { name: order.userName, email: order.userEmail },
        theme: { color: '#6366F1' },
        modal: { ondismiss: () => { setLoading(''); toast('Payment closed.'); } },
        handler: async (r) => {
          try {
            await api.post('/payments/verify', { razorpay_order_id: r.razorpay_order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature, planType: planId });
            await refreshUser();
            toast.success(`🎉 Welcome to ${planId}!`);
            navigate('/app/settings?payment=success&plan=' + planId);
          } catch { toast.error('Verification failed.'); } finally { setLoading(''); }
        },
      };
      const rzp = new window.Razorpay(opts);
      rzp.on('payment.failed', (r) => { toast.error(`Failed: ${r.error.description}`); setLoading(''); });
      rzp.open();
    } catch {
      try {
        await api.post('/payments/demo-upgrade', { planType: planId });
        await refreshUser();
        toast.success(`🎉 Upgraded to ${planId}! (Demo)`);
        navigate('/app/settings?payment=success&plan=' + planId);
      } catch (e) { toast.error(e.response?.data?.message || 'Error'); } finally { setLoading(''); }
    }
  }, [navigate, refreshUser]);

  const handleChoose = async (planId) => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (planId === user.planType) { navigate('/app/settings'); return; }
    if (planId === 'Free') {
      setLoading(planId);
      try { await api.post('/payments/demo-upgrade', { planType: 'Free' }); await refreshUser(); navigate('/app'); }
      catch { toast.error('Error'); } finally { setLoading(''); }
      return;
    }
    await handleRazorpay(planId);
  };

  return (
    <div className="min-h-screen bg-surface text-text-main">
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg sm:text-xl font-bold text-white">Midnight Sanctuary</Link>
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <Link to="/app" className="px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:scale-95 transition-transform">Dashboard</Link>
            ) : (
              <><Link to="/login" className="text-sm text-text-muted hover:text-white">Login</Link>
              <Link to="/login" className="px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:scale-95 transition-transform">Get Started</Link></>
            )}
          </div>
          <button className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-surface-bright text-text-muted" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="sm:hidden bg-surface border-t border-white/5 px-4 py-4 space-y-3">
            <Link to={user ? '/app' : '/login'} className="block w-full py-3 bg-primary text-white rounded-xl text-sm font-medium text-center" onClick={() => setMobileMenu(false)}>
              {user ? 'Dashboard' : 'Get Started'}
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-28 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-tertiary mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-tertiary/20 bg-tertiary/5">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Razorpay · UPI · Cards · Netbanking
            </span>
            <h1 className="font-heading text-4xl sm:text-6xl font-bold text-white mb-4 sm:mb-6">Choose Your Path</h1>
            <p className="text-text-muted max-w-xl mx-auto mb-8 sm:mb-10 text-sm sm:text-base">Upgrade to unlock Gemini AI and all premium features.</p>
            <div className="inline-flex items-center gap-1 p-1 bg-surface-dim rounded-2xl border border-white/5">
              {['monthly', 'annual'].map((b) => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${billing === b ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                  {b === 'monthly' ? 'Monthly' : 'Annual'}
                  {b === 'annual' && <span className="ml-1.5 text-tertiary text-[10px] font-bold">–25%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20">
            {PLANS.map((plan) => {
              const price = plan.lifetime ? plan.price.monthly : plan.price[billing];
              const isCurrent = user?.planType === plan.id;
              return (
                <div key={plan.id} className={`glass-panel p-5 sm:p-8 flex flex-col relative ${plan.highlighted ? 'border-t-2 border-t-tertiary sm:shadow-[0_0_30px_rgba(45,212,191,0.08)]' : ''} ${isCurrent ? 'ring-1 ring-primary/40' : ''}`}>
                  {plan.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-tertiary bg-surface px-3 py-1 rounded-full border border-tertiary/30 whitespace-nowrap">Most Popular</span>}
                  <div className={`text-2xl sm:text-3xl mb-3 ${plan.highlighted ? 'text-tertiary' : plan.lifetime ? 'text-yellow-400' : 'text-text-muted'}`}>{plan.icon}</div>
                  <h3 className="font-heading text-xl sm:text-2xl text-white mb-1">{plan.name}</h3>
                  <p className="text-xs sm:text-sm text-text-muted mb-4 sm:mb-6">{plan.tagline}</p>
                  <div className="mb-6 sm:mb-8">
                    {price === 0 ? <span className="font-heading text-4xl sm:text-5xl text-white">Free</span> : (
                      <div className="flex items-baseline gap-0.5">
                        <IndianRupee className="w-4 h-4 text-white/60 self-start mt-1.5 sm:mt-2" />
                        <span className={`font-heading text-3xl sm:text-5xl ${plan.highlighted ? 'text-tertiary' : 'text-white'}`}>{price.toLocaleString('en-IN')}</span>
                        <span className="text-text-muted text-xs sm:text-sm ml-1">{plan.lifetime ? 'once' : `/${billing === 'annual' ? 'mo·ann.' : 'mo'}`}</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-text-main">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tertiary shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleChoose(plan.id)} disabled={isCurrent || loading === plan.id}
                    className={`w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      isCurrent ? 'bg-surface-bright text-text-muted cursor-default border border-white/10'
                      : plan.highlighted ? 'bg-tertiary text-surface hover:scale-[0.98] shadow-[0_0_15px_rgba(45,212,191,0.3)]'
                      : plan.lifetime ? 'bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20 hover:scale-[0.98]'
                      : 'bg-surface-bright border border-white/10 text-white hover:bg-white/10 hover:scale-[0.98]'}`}>
                    {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isCurrent ? <><Check className="w-4 h-4" /> Current Plan</>
                      : price === 0 ? 'Start Free'
                      : <><Zap className="w-4 h-4" /> Pay with Razorpay</>}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl text-white text-center mb-6 sm:mb-10">Common Questions</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { q: 'Is the AI Guide real?', a: 'Yes — powered by Google Gemini 2.0 Flash with a custom wellness system prompt. Streams responses in real time.' },
                { q: 'How do Razorpay payments work?', a: 'Clicking Upgrade opens a Razorpay modal supporting UPI, cards, and netbanking. Without real keys, demo mode upgrades instantly.' },
                { q: 'What is demo mode?', a: 'If Razorpay keys aren\'t configured, clicking Upgrade upgrades your plan in the database immediately — perfect for testing locally.' },
                { q: 'Is my journal private?', a: 'All journal entries are stored privately and never shared. They are never used for AI training.' },
              ].map(({ q, a }) => (
                <div key={q} className="glass-panel p-4 sm:p-6">
                  <h4 className="font-medium text-white mb-1.5 sm:mb-2 text-sm sm:text-base">{q}</h4>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
