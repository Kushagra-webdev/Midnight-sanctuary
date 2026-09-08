import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let result;
      if (isLogin) {
        result = await login(form.email, form.password);
      } else {
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        result = await register(form.name, form.email, form.password);
      }
      if (result.success) navigate('/app');
      else setError(result.message);
    } catch (e) {
      setError(e.response?.data?.message || 'An error occurred.');
    } finally { setLoading(false); }
  };

  const toggle = () => { setIsLogin(!isLogin); setError(''); setForm({ name: '', email: '', password: '' }); };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden p-4 sm:p-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[500px] sm:h-[600px] bg-primary/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-tertiary/5 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />

      <Link to="/" className="absolute top-4 sm:top-8 left-4 sm:left-8 z-20">
        <h1 className="font-heading text-base sm:text-xl font-bold text-white tracking-wide">Midnight Sanctuary</h1>
      </Link>

      <div className="w-full max-w-sm sm:max-w-md glass-panel p-6 sm:p-10 relative z-10 animate-fade-in">
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-bright flex items-center justify-center border border-white/5 mx-auto mb-4 sm:mb-6">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-tertiary" />
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-2">
            {isLogin ? 'Enter the Sanctuary' : 'Begin Your Journey'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted">
            {isLogin ? 'Welcome back. Find your stillness.' : 'Commit to clarity.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {!isLogin && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-text-muted group-focus-within:text-tertiary transition-colors" />
              </div>
              <input type="text" name="name" required={!isLogin} value={form.name} onChange={handleChange}
                className="w-full bg-surface-dim border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-tertiary/50 transition-colors"
                placeholder="Your Name" />
            </div>
          )}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-text-muted group-focus-within:text-tertiary transition-colors" />
            </div>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full bg-surface-dim border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-tertiary/50 transition-colors"
              placeholder="Email address" />
          </div>
          <div className="relative group w-full">
            {/* Left Icon (Lock) */}
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none z-10">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-text-muted group-focus-within:text-tertiary transition-colors" />
            </div>

            {/* Input Field */}
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full bg-surface-dim border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-11 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-tertiary/50 transition-colors"
              placeholder={isLogin ? 'Password' : 'Password (min 6 chars)'}
            />

            {/* Right Icon Button (Eye) */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-white transition-colors focus:outline-none z-10"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Forgot password link */}
          {isLogin && (
            <div className="text-right -mt-2">
              <Link to="/reset-password"
                className="text-xs text-text-muted hover:text-tertiary transition-colors">
                Forgot password?
              </Link>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 mt-2 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-70">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <>{isLogin ? 'Log In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-text-muted">
            {isLogin ? "Don't have an account?" : 'Already a member?'}{' '}
            <button onClick={toggle} className="text-tertiary hover:text-white font-medium transition-colors">
              {isLogin ? 'Join the Sanctuary' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
