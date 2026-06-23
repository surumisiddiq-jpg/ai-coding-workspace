'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Form field mapping for OAuth2 login payloads
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Invalid email or password match credentials');
        const data = await res.json();
        localStorage.setItem('token', data.access_token); // Secure token commitment
      } else {
        // Structured JSON payload mapping for signup creation streams
        const res = await fetch('http://localhost:8000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Registration failed');
        }
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
      }

      // Redirect to dashboard upon successful token acquisition
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-extrabold text-center mb-1 tracking-tight text-blue-500">
          DevSpace AI
        </h1>
        <p className="text-slate-400 text-center text-xs mb-6">
          {isLogin ? 'Sign in to access your coding workspaces' : 'Create an account to start coding'}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="dev@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-sm hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-blue-400 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </main>
  );
}
