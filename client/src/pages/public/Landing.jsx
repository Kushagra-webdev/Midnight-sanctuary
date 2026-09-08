import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Moon, Shield, Bot, BookOpen, Users, Heart, Check, Menu, X } from 'lucide-react';

const FEATURES = [
  { icon: Bot, title: 'AI Wellness Guide', desc: 'Real-time streaming conversations powered by Gemini 2.0 Flash. Your personal mindfulness coach, always available.', color: 'text-tertiary bg-tertiary/10' },
  { icon: Shield, title: 'Intelligent Blocker', desc: 'Deep Focus Mode blocks social media, streaming, and distractions with smart quiet hours scheduling.', color: 'text-indigo-400 bg-indigo-400/10' },
  { icon: BookOpen, title: 'Private Journal', desc: 'Write freely with AI-powered insights. Every entry is private, encrypted, and only visible to you.', color: 'text-purple-400 bg-purple-400/10' },
  { icon: Heart, title: 'Focus Timer', desc: 'Log meditation, deep work, and reading sessions. Track your wellness journey with detailed analytics.', color: 'text-red-400 bg-red-400/10' },
  { icon: Users, title: 'Sanctuary Circles', desc: 'Quiet, meaningful communities built around intentional living, not endless scrolling.', color: 'text-orange-400 bg-orange-400/10' },
  { icon: Moon, title: 'Streak & Recovery', desc: 'Gamified consistency tracking. Build your longest streak and watch your recovery score climb.', color: 'text-blue-400 bg-blue-400/10' },
];

const STATS = [
  { val: '12k+', label: 'Active Members' },
  { val: '98%', label: 'Feel More Focused' },
  { val: '4.9★', label: 'User Rating' },
  { val: '2.1M', label: 'Minutes Reclaimed' },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-text-main overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg sm:text-xl font-bold text-white">Midnight Sanctuary</Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6 text-sm text-text-muted">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login" className="text-sm text-text-muted hover:text-white transition-colors">Login</Link>
            <Link to="/login"
              className="px-4 sm:px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:scale-95 transition-transform">
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-surface-bright text-text-muted hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-surface border-t border-white/5 px-4 py-4 space-y-3">
            <Link to="/pricing" className="block text-sm text-text-muted hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link to="/login" className="block text-sm text-text-muted hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link to="/login" className="block w-full py-3 bg-primary text-white rounded-xl text-sm font-medium text-center" onClick={() => setMobileMenuOpen(false)}>
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] sm:w-[900px] h-[400px] sm:h-[700px] bg-primary/15 blur-[80px] sm:blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-tertiary/8 blur-[60px] sm:blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-tertiary mb-6 sm:mb-8 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-tertiary/20 bg-tertiary/5">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Powered by Gemini 2.0 Flash AI
          </span>

          <h1 className="font-heading text-4xl sm:text-6xl md:text-8xl font-bold text-white mb-6 sm:mb-8 leading-[1.05] tracking-tight">
            Reclaim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-tertiary to-primary">Stillness</span>
          </h1>

          <p className="text-base sm:text-xl text-text-muted max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            A digital sanctuary built for those who want to break free from the noise.
            AI-powered coaching, mindful focus tools, and a community that understands.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <Link to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-white rounded-full text-sm sm:text-base font-semibold hover:scale-95 transition-transform shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              Begin Your Journey <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link to="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-surface-bright border border-white/10 text-white rounded-full text-sm sm:text-base font-medium hover:bg-white/5 transition-colors">
              View Plans
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
            {STATS.map(({ val, label }) => (
              <div key={label} className="glass-panel p-3 sm:p-4 text-center">
                <p className="font-heading text-xl sm:text-2xl text-white mb-0.5">{val}</p>
                <p className="text-[10px] sm:text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">
              Everything You Need to Reclaim Focus
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto text-sm sm:text-base">
              Built with intention. Every feature exists to help you live more deliberately.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-panel p-5 sm:p-8 hover:border-white/10 transition-all group">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center mb-4 sm:mb-6`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-heading text-lg sm:text-xl text-white mb-2 sm:mb-3">{title}</h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">Simple, Honest Pricing</h2>
          <p className="text-text-muted mb-8 sm:mb-12 text-sm sm:text-base">Start free. Upgrade when you're ready for the full experience.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {[
              { name: 'The Seeker', price: 'Free', features: ['Basic blocker', 'Dashboard', 'Public circles'], color: 'border-white/5' },
              { name: 'The Disciplined', price: '₹999/mo', features: ['Full AI Guide', 'Unlimited journal', 'Advanced blocker'], color: 'border-tertiary/30 border-t-2 border-t-tertiary', badge: 'Popular' },
              { name: 'The Eternal', price: '₹14,999', features: ['Everything', 'Lifetime access', '1-on-1 call'], color: 'border-yellow-400/20' },
            ].map((p) => (
              <div key={p.name} className={`glass-panel p-5 sm:p-6 text-left relative ${p.color}`}>
                {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase text-tertiary bg-surface px-3 py-1 rounded-full border border-tertiary/30">{p.badge}</span>}
                <h3 className="font-heading text-lg sm:text-xl text-white mb-1">{p.name}</h3>
                <p className="text-tertiary font-heading text-xl sm:text-2xl mb-4">{p.price}</p>
                <ul className="space-y-2">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-text-muted"><Check className="w-3.5 h-3.5 text-tertiary shrink-0" />{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <Link to="/pricing"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-tertiary text-surface rounded-full text-sm sm:text-base font-semibold hover:scale-95 transition-transform shadow-[0_0_20px_rgba(45,212,191,0.3)]">
            See Full Pricing <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center glass-panel p-8 sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-tertiary/10" />
          <div className="relative z-10">
            <Moon className="w-10 h-10 sm:w-14 sm:h-14 text-tertiary mx-auto mb-4 sm:mb-6" />
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">
              Your sanctuary awaits.
            </h2>
            <p className="text-text-muted mb-6 sm:mb-10 text-sm sm:text-base leading-relaxed">
              Join thousands who have chosen depth over distraction. Start free — no credit card required.
            </p>
            <Link to="/login"
              className="inline-flex items-center gap-3 px-6 sm:px-10 py-3.5 sm:py-4 bg-white text-surface rounded-full text-sm sm:text-base font-semibold hover:scale-95 transition-transform">
              Enter the Sanctuary <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-heading text-base sm:text-lg text-white">Midnight Sanctuary</p>
          <p className="text-xs sm:text-sm text-text-muted text-center sm:text-right">
            Built with Gemini AI · Razorpay Payments · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
