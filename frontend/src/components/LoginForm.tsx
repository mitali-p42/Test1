// src/components/LoginForm.tsx
import React from 'react';
import '../styles/auth.css';

type Props = {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string;
  loading?: boolean;
};

export default function LoginForm({ mode, onSubmit, error, loading }: Props) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(email, password);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1 style={{ margin: 0 }}>{mode === 'login' ? 'Login' : 'Create account'}</h1>

      <div className="auth-row">
        <label htmlFor="email" className="auth-label">Email</label>
        <input
          id="email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-row">
        <label htmlFor="password" className="auth-label">Password</label>
        <input
          id="password"
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
      </button>
    </form>
  );
}
