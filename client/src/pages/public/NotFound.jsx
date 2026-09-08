import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 text-center">
      {/* Animated moon */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 border border-primary/20 flex items-center justify-center animate-pulse">
          <Moon className="w-16 h-16 text-primary" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-dim border border-white/10 flex items-center justify-center">
          <span className="text-sm font-bold text-text-muted">?</span>
        </div>
      </div>

      <h1 className="font-heading text-6xl sm:text-8xl font-bold text-white mb-4">404</h1>
      <p className="font-heading text-xl sm:text-2xl text-text-muted mb-2">Lost in the stillness</p>
      <p className="text-text-muted text-sm max-w-sm mb-10">
        This page has drifted beyond the sanctuary. Perhaps it was never meant to be found.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 border border-white/10 text-text-muted hover:text-white hover:border-white/20 rounded-full text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-sm font-medium hover:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          <Home className="w-4 h-4" />
          Return Home
        </button>
      </div>

      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animation: `pulse ${2 + Math.random() * 2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
