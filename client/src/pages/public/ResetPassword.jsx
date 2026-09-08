import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Moon, Lock, Mail, Eye, EyeOff, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [mode, setMode] = useState(token ? 'reset' : 'forgot'); // 'forgot' | 'reset' | 'sent' | 'done'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setMode('sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setMode('done');
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      {/* Stars bg */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute w-px h-px rounded-full bg-white/30"
            style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, opacity: Math.random()*0.5+0.1 }} />
        ))}
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Moon className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading text-2xl text-white">Midnight Sanctuary</h1>
        </div>

        <div className="glass-panel p-8">
          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <>
              <h2 className="font-heading text-xl text-white mb-2">Forgot your password?</h2>
              <p className="text-text-muted text-sm mb-6">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full bg-surface-dim border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20"
                    required />
                </div>
                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Reset Link
                </button>
              </form>
            </>
          )}

          {/* EMAIL SENT */}
          {mode === 'sent' && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-tertiary mx-auto mb-4" />
              <h2 className="font-heading text-xl text-white mb-2">Check your inbox</h2>
              <p className="text-text-muted text-sm mb-6">
                If an account with <strong className="text-white">{email}</strong> exists, a reset link has been sent. Check your spam folder too.
              </p>
              <p className="text-xs text-text-muted">In development mode, check the server console for the Ethereal preview URL.</p>
            </div>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <>
              <h2 className="font-heading text-xl text-white mb-2">Create new password</h2>
              <p className="text-text-muted text-sm mb-6">Choose a strong password for your sanctuary.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="w-full bg-surface-dim border border-white/5 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20"
                    required />
                  <button type="button" onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type={showPwd ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-surface-dim border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20"
                    required />
                </div>
                {password && confirm && password !== confirm && (
                  <p className="text-xs text-red-400">Passwords don't match</p>
                )}
                <button type="submit" disabled={loading || !password || !confirm}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Reset Password
                </button>
              </form>
            </>
          )}

          {/* DONE */}
          {mode === 'done' && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-tertiary mx-auto mb-4" />
              <h2 className="font-heading text-xl text-white mb-2">Password updated!</h2>
              <p className="text-text-muted text-sm mb-6">Your password has been reset. Return to the sanctuary.</p>
              <button onClick={() => navigate('/login')}
                className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform">
                Go to Login
              </button>
            </div>
          )}
        </div>

        <button onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors mx-auto mt-6">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>
      </div>
    </div>
  );
}
