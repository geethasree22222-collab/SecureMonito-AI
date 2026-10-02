import React, { useState } from 'react';
import { Shield, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { login, register } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        onSuccess(res.user);
      } else {
        const res = await register(name, email, password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoPrefill = () => {
    setEmail('user@example.com');
    setPassword('password123');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-white">
            SecureMonitor<span className="text-cyan-400"> AI</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {mode === 'login' ? 'Sign in to access device telemetry & alerts' : 'Create an account to register devices'}
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('connection') && (
              <button
                type="button"
                onClick={() => onSuccess({ userId: 'user-001', name: 'Alex Vance', email: 'user@example.com', role: 'USER' })}
                className="mt-2 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer block"
              >
                Or enter in Interactive Demo Mode →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex Vance"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center space-x-2 rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-xs font-semibold text-white shadow-md hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Authenticate' : 'Create Account'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMessage(null);
            }}
            className="hover:text-cyan-300 transition-colors"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Existing user? Sign In'}
          </button>

          <button
            onClick={handleDemoPrefill}
            className="text-[11px] text-cyan-400 hover:underline"
          >
            Fill Demo Credentials
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 text-center text-[10px] text-slate-400">
          Token-based Bearer auth with HttpOnly cookie session rotation.
        </div>
      </div>
    </div>
  );
};
