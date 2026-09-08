import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Target, Book, Heart, Bell, Check, ChevronRight, Sparkles } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STEPS = [
  {
    id: 0,
    icon: Moon,
    title: 'Welcome to your Sanctuary',
    subtitle: 'A mindful space to reclaim your focus and peace.',
    content: null,
  },
  {
    id: 1,
    icon: Target,
    title: 'What brings you here?',
    subtitle: 'Select all that apply.',
    options: [
      { id: 'focus', label: 'Improve focus & deep work' },
      { id: 'detox', label: 'Digital detox & screen time' },
      { id: 'anxiety', label: 'Reduce anxiety & stress' },
      { id: 'journal', label: 'Build a journaling habit' },
      { id: 'sleep', label: 'Better sleep hygiene' },
      { id: 'productivity', label: 'Increase productivity' },
    ],
    multi: true,
  },
  {
    id: 2,
    icon: Heart,
    title: 'How long are your ideal sessions?',
    subtitle: "We'll personalize timer presets for you.",
    options: [
      { id: '15', label: '15 minutes — Short sprints' },
      { id: '25', label: '25 minutes — Pomodoro style' },
      { id: '45', label: '45 minutes — Deep work' },
      { id: '60', label: '60+ minutes — Flow state' },
    ],
    multi: false,
  },
  {
    id: 3,
    icon: Bell,
    title: 'Notification preference',
    subtitle: 'We respect your focus time.',
    options: [
      { id: 'gentle', label: 'Gentle nudges only' },
      { id: 'daily', label: 'Daily check-in reminders' },
      { id: 'none', label: 'No notifications — pure silence' },
    ],
    multi: false,
  },
  {
    id: 4,
    icon: Sparkles,
    title: 'Your sanctuary awaits',
    subtitle: 'Everything is set. Begin your journey.',
    content: null,
  },
];

export default function OnboardingFlow() {
  const { user, refreshUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (user && user.onboardingCompleted === false) {
      // Small delay so app renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  if (!visible) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const toggleOption = (stepId, optionId, multi) => {
    setSelections(prev => {
      const current = prev[stepId] || [];
      if (multi) {
        return {
          ...prev,
          [stepId]: current.includes(optionId)
            ? current.filter(x => x !== optionId)
            : [...current, optionId],
        };
      } else {
        return { ...prev, [stepId]: [optionId] };
      }
    });
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.post('/users/onboarding/complete', {
        goals: selections[1] || [],
        sessionPreference: selections[2]?.[0] || '25',
        notificationPreference: selections[3]?.[0] || 'gentle',
      });
      setVisible(false);
      refreshUser();
      toast.success('Sanctuary configured. Welcome home. 🌙');
    } catch {
      // Don't block user if this fails
      setVisible(false);
    } finally {
      setCompleting(false);
    }
  };

  const canContinue = () => {
    if (!currentStep.options) return true;
    const sel = selections[currentStep.id] || [];
    return currentStep.multi ? sel.length > 0 : sel.length === 1;
  };

  const pct = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel p-8 animate-fade-in">
        {/* Progress bar */}
        <div className="w-full h-1 bg-surface-bright rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <currentStep.icon className="w-5 h-5" />
          </div>
          <span className="text-xs text-text-muted">{step + 1} / {STEPS.length}</span>
        </div>

        <h2 className="font-heading text-2xl text-white mb-2">{currentStep.title}</h2>
        <p className="text-text-muted text-sm mb-6">{currentStep.subtitle}</p>

        {/* Options */}
        {currentStep.options && (
          <div className="space-y-2 mb-8">
            {currentStep.options.map(opt => {
              const sel = selections[currentStep.id] || [];
              const isSelected = sel.includes(opt.id);
              return (
                <button key={opt.id}
                  onClick={() => toggleOption(currentStep.id, opt.id, currentStep.multi)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left
                    ${isSelected
                      ? 'bg-primary/15 border-primary/40 text-white'
                      : 'bg-surface-dim border-white/5 text-text-muted hover:border-white/15 hover:text-white'
                    }`}>
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Welcome/Done screens */}
        {!currentStep.options && step === 0 && (
          <div className="py-4 mb-8">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Focus Timer', icon: '⏱️' },
                { label: 'AI Guide', icon: '🤖' },
                { label: 'Journal', icon: '📖' },
                { label: 'Communities', icon: '🌙' },
                { label: 'To-Do', icon: '✅' },
                { label: 'Wellness', icon: '💚' },
              ].map(f => (
                <div key={f.label} className="bg-surface-dim border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-xl mb-1">{f.icon}</p>
                  <p className="text-[10px] text-text-muted">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!currentStep.options && step === STEPS.length - 1 && (
          <div className="py-4 mb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-tertiary/10 border border-tertiary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-tertiary" />
            </div>
            <p className="text-text-muted text-sm">Your preferences have been saved. The sanctuary is ready for you.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-3 border border-white/10 text-text-muted hover:text-white rounded-xl text-sm transition-colors">
              Back
            </button>
          )}
          {isLast ? (
            <button onClick={handleComplete} disabled={completing}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50">
              {completing ? 'Entering...' : '🌙 Enter the Sanctuary'}
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)} disabled={!canContinue()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <button onClick={() => { setVisible(false); handleComplete(); }}
          className="w-full mt-3 text-xs text-text-muted hover:text-white transition-colors text-center">
          Skip setup
        </button>
      </div>
    </div>
  );
}
