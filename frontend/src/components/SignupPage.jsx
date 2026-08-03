import { useState } from 'react';
import NetworkBackground from './NetworkBackground.jsx';
import './auth.css';

// Props:
//   onSignupSuccess()  -> called after a successful signup
//   onSwitchToLogin()  -> called when the user clicks "Sign in"
//   onBackToHome()     -> called when the user clicks "Back to Home"
export default function SignupPage({ onSignupSuccess, onSwitchToLogin, onBackToHome }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email.includes('@') || password.length < 6 || password !== confirm || !terms) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      onSignupSuccess && onSignupSuccess({ name, email });
    }, 1400);
  }

  return (
    <div className="nuro-auth">
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
            <div className="brand-name">Nurocity</div>
          </div>

          <div className="left-copy">
            <div className="eyebrow"><span className="dot"></span> network status — nominal</div>
            <h1>Join the grid.<br />Start mapping your city.</h1>
            <p>Create an account to route, monitor, and orchestrate the workflows connecting your team's nodes — live, mapped, and always in sync.</p>
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
              <h2>Create your account</h2>
              <p>Already signed up?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin && onSwitchToLogin(); }}>
                  Sign in
                </a>
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {error && <div className="err show">Please fill every field correctly and make sure passwords match.</div>}

              <div className="field">
                <label htmlFor="name">Full name</label>
                <div className="input-row">
                  <input
                    type="text"
                    id="name"
                    placeholder="Your name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M4.5 20c1.6-3.6 4.6-5.5 7.5-5.5s5.9 1.9 7.5 5.5" />
                  </svg>
                </div>
              </div>

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
                    autoComplete="new-password"
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

              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <div className="input-row">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirm"
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    aria-label="Show password"
                    onClick={() => setShowConfirm((s) => !s)}
                  >
                    {showConfirm ? (
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

              <label className="remember" style={{ marginTop: '-4px' }}>
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                I agree to the Terms and Privacy Policy
              </label>

              <button type="submit" className="submit" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
                {!submitting && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                )}
              </button>

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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}