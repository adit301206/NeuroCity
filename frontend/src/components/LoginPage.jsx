import { useState } from 'react';
import NetworkBackground from './NetworkBackground.jsx';
import Navbar from './Navbar.jsx';
import './auth.css';

// Props:
//   onLoginSuccess()   -> called after a successful sign-in
//   onSwitchToSignup() -> called when the user clicks "Create an account"
//   onBackToHome()     -> called when the user clicks "Back to Home"
export default function LoginPage({ onLoginSuccess, onSwitchToSignup, onBackToHome, onNavigate, activeTab }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.includes('@') || password.length < 1) {
      setError('Please check your email and password and try again.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        onLoginSuccess && onLoginSuccess(data.data);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    console.log('Redirecting to Google OAuth...');
    window.location.href = '/api/auth/google';
  }

  const handleNav = onNavigate || ((tab) => {
    if (tab === 'signup') {
      onSwitchToSignup && onSwitchToSignup();
    } else if (tab === 'login') {
      // already here
    } else {
      onBackToHome && onBackToHome();
    }
  });

  return (
    <div className="nuro-auth">
      <Navbar activeTab={activeTab || 'login'} onNavigate={handleNav} />
      <NetworkBackground />

      <div className="stage">
        {/* LEFT */}
        <div className="left">
          <div className="brand">
            <svg className="brand-mark" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="16" stroke="#6E5BFF" strokeWidth="1.4" />
              <circle cx="17" cy="8" r="2.2" fill="#8F7CFF" />
              <circle cx="9" cy="21" r="2.2" fill="#6E5BFF" />
              <circle cx="25" cy="21" r="2.2" fill="#6E5BFF" />
              <line x1="17" y1="8" x2="9" y2="21" stroke="#4B5266" strokeWidth="1" />
              <line x1="17" y1="8" x2="25" y2="21" stroke="#4B5266" strokeWidth="1" />
              <line x1="9" y1="21" x2="25" y2="21" stroke="#4B5266" strokeWidth="1" />
            </svg>
            <div className="brand-name">NeuroCity</div>
          </div>

          <div className="left-copy">
            <div className="eyebrow"><span className="dot"></span> network status — nominal</div>
            <h1>Every node in your city,<br />one signal at a time.</h1>
            <p>Sign in to route, monitor, and orchestrate the workflows connecting your team's nodes — live, mapped, and always in sync.</p>
          </div>

          <div className="stat-row">
            <div><span className="n">12,480</span><span className="l">active nodes</span></div>
            <div><span className="n">99.98%</span><span className="l">uptime</span></div>
            <div><span className="n">42ms</span><span className="l">avg latency</span></div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div className="form-wrap">
            <div className="form-head">
              <div className="tag">Access console</div>
              <h2>Sign in to Nurocity</h2>
              <p>New here?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToSignup && onSwitchToSignup(); }}>
                  Create an account
                </a>
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {error && <div className="err show">{error}</div>}

              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-row">
                  <input
                    type="email"
                    id="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-row">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    aria-label="Show password"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M2 2l20 20M9.9 9.9a3 3 0 004.2 4.2M6.5 6.7C4 8.3 2 12 2 12s4 7 10 7c1.7 0 3.2-.4 4.5-1.1M14 5.1A11 11 0 0122 12s-1 1.8-2.7 3.4" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="row-between">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Keep me signed in
                </label>
                <a href="#">Forgot password?</a>
              </div>

              <button type="submit" className="submit" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
                {!submitting && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              <div className="auth-divider">OR</div>

              <button
                type="button"
                className="google-btn"
                onClick={handleGoogleSignIn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button>
            </form>

            <div className="foot-note">
              By continuing you agree to Nurocity's <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
            </div>

            {/* Back to Home બટન */}
            {onBackToHome && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={onBackToHome}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(72, 202, 228, 0.4)',
                    color: '#48CAE4',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    width: '100%'
                  }}
                >
                  ← Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}