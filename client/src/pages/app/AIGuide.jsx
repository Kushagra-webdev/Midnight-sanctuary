import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, Loader2, RotateCcw, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SUGGESTIONS = [
  'Help me focus right now',
  'Guide me through a breathing exercise',
  'I need a digital detox plan',
  'I feel anxious — help me calm down',
  'What should I do before sleep tonight?',
  "Help me journal today's feelings",
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} w-full`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
        isUser ? 'bg-primary/20 border border-primary/30' : 'bg-surface border border-tertiary/30'
      }`}>
        {isUser ? <UserIcon className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-tertiary" />}
      </div>
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary/20 border border-primary/20 text-white rounded-tr-sm ml-auto'
            : 'bg-surface-bright/30 border border-white/5 text-text-main rounded-tl-sm'
        }`}>
          {message.content}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-text-muted mt-2 px-1">
          {isUser ? 'You' : 'The Guide'} · {message.time}
        </span>
      </div>
    </div>
  );
}

export default function AIGuide() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const isPro = user?.planType === 'Pro' || user?.planType === 'Premium';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTime = () =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    if (!isPro) {
      toast.error('AI Guide requires a Pro or Premium plan.');
      return;
    }

    const userMsg = { role: 'user', content: trimmed, time: getTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Add empty assistant placeholder for streaming
    const assistantMsg = { role: 'assistant', content: '', time: getTime() };
    setMessages([...newMessages, assistantMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userName: user?.name,
        }),
      });

      if (!response.ok) throw new Error('AI service unavailable');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch { /* partial JSON */ }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('The Guide is resting. Try again shortly.');
        setMessages((prev) => {
          // Remove empty assistant message if stream failed before any content
          const last = prev[prev.length - 1];
          return last?.role === 'assistant' && !last.content ? prev.slice(0, -1) : prev;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleClear = () => {
    setMessages([]);
    toast.success('Conversation cleared.');
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)] pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-tertiary/20 blur-xl rounded-full scale-150" />
            <div className="w-12 h-12 rounded-full bg-surface-dim border border-tertiary/20 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
              <Sparkles className="w-5 h-5 text-tertiary" />
            </div>
          </div>
          <div>
            <h1 className="font-heading text-2xl text-white">The Stillness Guide</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="text-xs text-text-muted">
                {isPro ? 'Powered by Gemini 2.0 Flash · Streaming' : 'Requires Pro Plan'}
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-surface-bright"
          >
            <RotateCcw className="w-3 h-3" /> New conversation
          </button>
        )}
      </div>

      {/* Pro Gate */}
      {!isPro && (
        <div className="glass-panel p-8 text-center mb-6 border border-tertiary/20">
          <Crown className="w-10 h-10 text-tertiary mx-auto mb-4" />
          <h3 className="font-heading text-2xl text-white mb-2">Unlock the Stillness Guide</h3>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            The AI Guide is powered by Google Gemini 2.0 Flash and is available on Pro and Premium plans. Upgrade to access real-time streaming conversations with your personal wellness companion.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-tertiary text-surface text-sm font-medium rounded-full hover:scale-95 transition-transform shadow-[0_0_15px_rgba(45,212,191,0.3)]"
          >
            Upgrade to Pro — ₹999/mo
          </Link>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 mb-4 min-h-0">
        {messages.length === 0 && isPro && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Sparkles className="w-10 h-10 text-tertiary/30 mb-4" />
            <p className="text-text-muted text-sm mb-8 max-w-sm">
              Your companion for digital intentionality and mental clarity. Ask anything.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10 bg-surface-dim hover:bg-white/5 text-sm text-text-muted hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface border border-tertiary/30 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-tertiary animate-spin" />
            </div>
            <div className="glass-panel px-5 py-4 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-tertiary/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="relative flex items-center bg-surface-dim border border-white/10 rounded-2xl p-2 focus-within:border-white/20 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isPro ? 'Share your thoughts with the Guide...' : 'Upgrade to Pro to chat'}
            disabled={!isPro || isStreaming}
            className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-text-muted/60 focus:outline-none disabled:opacity-50"
          />
          {isStreaming ? (
            <button type="button" onClick={handleStop}
              className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors shrink-0">
              <span className="w-3 h-3 bg-red-400 rounded-sm" />
            </button>
          ) : (
            <button type="submit" disabled={!isPro || !input.trim()}
              className="w-10 h-10 rounded-xl bg-tertiary text-surface flex items-center justify-center hover:scale-95 transition-transform shrink-0 disabled:opacity-40 disabled:hover:scale-100 shadow-[0_0_10px_rgba(45,212,191,0.2)]">
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
