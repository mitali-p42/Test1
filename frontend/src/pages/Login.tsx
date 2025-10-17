// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LoginForm from '../components/LoginForm';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login, register, token } = useAuth();

  // ✅ redirect only when token changes, not during render
  useEffect(() => {
    if (token) nav('/');
  }, [token, nav]);

  async function onSubmit(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      // no need to nav('/') here — the effect above will run when token is set
    } catch (err: any) {
      // Try to normalize the backend/Nest error shape
      let msg = 'Something went wrong';
      try {
        // If your api helper throws a Response-like object:
        if (err?.json) {
          const data = await err.json();
          msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
        } else if (err?.response?.json) {
          const data = await err.response.json();
          msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
        } else if (typeof err?.message === 'string') {
          msg = err.message;
        }
      } catch {
        /* ignore secondary parse errors */
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div>
        <LoginForm
          mode={mode}
          onSubmit={onSubmit}
          error={error ?? undefined}
          loading={loading}
        />
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button onClick={() => setMode('register')}>Create an account</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')}>Login</button>
            </>
          )}
        </p>
      </div>
    </div>
  );

}
