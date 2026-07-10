'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Please log in instead.');
      } else {
        setError('Account created! You can now log in.');
      }
    }

    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'opacity 0.2s',
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#111',
        border: '1px solid #1a1a1a',
        borderRadius: '20px',
        padding: '40px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 8px',
          textAlign: 'center'
        }}>
          Beatcatch
        </h1>
        <p style={{ color: '#555', textAlign: 'center', margin: '0 0 32px', fontSize: '14px' }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: '#0a0a0a',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '24px'
        }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: mode === m ? 'linear-gradient(135deg, #a855f7, #06b6d4)' : 'transparent',
                color: mode === m ? '#fff' : '#555',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />

          {error && (
            <p style={{
              color: error.includes('created') ? '#10ac84' : '#ef4444',
              fontSize: '13px',
              margin: '4px 0 0'
            }}>
              {error}
            </p>
          )}

          <button onClick={handleSubmit} disabled={loading} style={buttonStyle}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </div>
      </div>
    </main>
  );
}