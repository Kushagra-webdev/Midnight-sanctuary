import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, User, Bot, Users, CheckSquare, Heart,
  ShieldBan, Settings, LogOut, BookOpen, X, Sun, Moon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import NotificationBell from '../NotificationBell';

const cn = (...inputs) => twMerge(clsx(inputs));

const navItems = [
  { name: 'Home', path: '/app', icon: Home, end: true },
  { name: 'Profile', path: '/app/profile', icon: User },
  { name: 'AI Guide', path: '/app/coach', icon: Bot },
  { name: 'Journal', path: '/app/journal', icon: BookOpen },
  { name: 'To-Do', path: '/app/todo', icon: CheckSquare },
  { name: 'Health', path: '/app/health', icon: Heart },
  { name: 'Blocker', path: '/app/blocker', icon: ShieldBan },
  { name: 'Communities', path: '/app/communities', icon: Users },
];

const PLAN_BADGES = {
  Free: null,
  Pro: { label: 'Pro', color: 'text-tertiary border-tertiary/30 bg-tertiary/10' },
  Premium: { label: 'Eternal', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
};

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const badge = user ? PLAN_BADGES[user.planType] : null;

  const handleLogout = async () => {
    await logout();
    toast.success('See you in the stillness.');
    navigate('/');
  };

  const handleNav = () => { if (onClose) onClose(); };

  return (
    <aside className="w-64 h-screen flex flex-col justify-between p-5 glass-sidebar">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-8 pl-1">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white font-heading">Midnight Sanctuary</h1>
            <p className="text-xs text-text-muted mt-0.5">Find your stillness</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-white hover:bg-surface-bright transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Notification bell */}
            <NotificationBell />
            {/* Mobile close */}
            {onClose && (
              <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-white hover:bg-surface-bright transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={handleNav}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-white border border-primary/20'
                  : 'text-text-muted hover:text-white hover:bg-surface-bright/60'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="space-y-1 pt-4 border-t border-white/5">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-surface-bright shrink-0">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name || 'user')}`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              {badge ? (
                <span className={cn('text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-full border', badge.color)}>
                  {badge.label}
                </span>
              ) : (
                <span className="text-xs text-text-muted">Free Plan</span>
              )}
            </div>
          </div>
        )}

        <NavLink
          to="/app/settings"
          onClick={handleNav}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            isActive ? 'bg-primary/15 text-white border border-primary/20' : 'text-text-muted hover:text-white hover:bg-surface-bright/60'
          )}
        >
          <Settings className="w-4 h-4" strokeWidth={2} />
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-surface-bright/60 transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
