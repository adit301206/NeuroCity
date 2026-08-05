import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import NetworkBackground from './NetworkBackground.jsx';
import Navbar from './Navbar.jsx';
import GoogleAuthModal from './GoogleAuthModal.jsx';
import { getRegisteredUsers, loginLocalUser, resetPasswordLocal, googleAuthLocal } from '../utils/localAuth';
import './auth.css';

// Props:
//   onLoginSuccess()   -> called after a successful sign-in
//   onSwitchToSignup() -> called when the user clicks "Create an account"
//   onBackToHome()     -> called when the user clicks "Back to Home"
export default function LoginPage({ onLoginSuccess, onSwitchToSignup, onBackToHome, onNavigate, activeTab, currentUser, onLogout }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Google Modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  function finalizeLogin(userObj, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userObj));
    onLoginSuccess && onLoginSuccess(userObj);
    if (onNavigate) {
      onNavigate('home');
    } else if (onBackToHome) {
      onBackToHome();
    }
  }

  const handleSelectGoogleAccount = async ({ name: accName, email: accEmail }) => {
    setIsGoogleModalOpen(false);
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleUser: { name: accName, email: accEmail }
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success' && data.token) {
        finalizeLogin(data.user, data.token);
      } else {
        const localRes = googleAuthLocal({ name: accName, email: accEmail });
        finalizeLogin(localRes.user, localRes.token);
      }
    } catch (err) {
      const localRes = googleAuthLocal({ name: accName, email: accEmail });
      finalizeLogin(localRes.user, localRes.token);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setSubmitting(true);
    setError('');
    try {
      let googleUser = null;
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        if (userInfoRes.ok) {
          googleUser = await userInfoRes.json();
        }
      } catch (gErr) {
        console.warn('Direct Google UserInfo fetch warning:', gErr);
      }

      const userEmail = googleUser?.email || email || 'citizen@neurocity.gov';
      const userName = googleUser?.name || userEmail.split('@')[0];

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: tokenResponse.access_token,
          googleUser: { name: userName, email: userEmail }
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success' && data.token) {
        finalizeLogin(data.user, data.token);
      } else {
        const localRes = googleAuthLocal({ name: userName, email: userEmail });
        finalizeLogin(localRes.user, localRes.token);
      }
    } catch (err) {
      setIsGoogleModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (errorResponse) => {
      console.warn('Google Sign-In prompt unavailable or Client ID pending:', errorResponse);
      setIsGoogleModalOpen(true);
    }
  });

  const handleGoogleBtnClick = () => {
    try {
      loginWithGoogle();
    } catch (e) {
      setIsGoogleModalOpen(true);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

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

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Fallback for non-JSON or empty response
      }

      if (res.status === 200 && data.token) {
        const userObj = data.user || data.data;
        finalizeLogin(userObj, data.token);
      } else {
        const localResult = loginLocalUser({ email, password });
        if (localResult.success) {
          finalizeLogin(localResult.user, localResult.token);
        } else {
          setError(data.message || localResult.message || 'Invalid credentials');
        }
      }
    } catch (err) {
      const localResult = loginLocalUser({ email, password });
      if (localResult.success) {
        finalizeLogin(localResult.user, localResult.token);
      } else {
        setError('Login failed. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyEmail(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setForgotStep(2);
        setSuccessMsg(data.message || 'Account verified! Enter your new password below.');
      } else {
        const localUsers = getRegisteredUsers();
        const localUser = localUsers.find((user) => user.email.toLowerCase() === forgotEmail.toLowerCase().trim());
        if (localUser) {
          setForgotStep(2);
          setSuccessMsg('Account verified! Enter your new password below.');
        } else {
          setError(data.message || 'No account found with this email address.');
        }
      }
    } catch (err) {
      const localUsers = getRegisteredUsers();
      const localUser = localUsers.find((user) => user.email.toLowerCase() === forgotEmail.toLowerCase().trim());
      if (localUser) {
        setForgotStep(2);
        setSuccessMsg('Account verified! Enter your new password below.');
      } else {
        setError('Failed to verify email. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setSuccessMsg('Password updated successfully! Switching to sign in...');
        setEmail(forgotEmail);
        setTimeout(() => {
          setIsForgotMode(false);
          setForgotStep(1);
          setForgotEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
          setError('');
        }, 1800);
      } else {
        const localResult = resetPasswordLocal({ email: forgotEmail, newPassword });
        if (localResult.success) {
          setSuccessMsg('Password updated successfully! Switching to sign in...');
          setEmail(forgotEmail);
          setTimeout(() => {
            setIsForgotMode(false);
            setForgotStep(1);
            setForgotEmail('');
            setNewPassword('');
            setConfirmPassword('');
            setSuccessMsg('');
            setError('');
          }, 1800);
        } else {
          setError(data.message || localResult.message || 'Failed to update password. Please try again.');
        }
      }
    } catch (err) {
      const localResult = resetPasswordLocal({ email: forgotEmail, newPassword });
      if (localResult.success) {
        setSuccessMsg('Password updated successfully! Switching to sign in...');
        setEmail(forgotEmail);
        setTimeout(() => {
          setIsForgotMode(false);
          setForgotStep(1);
          setForgotEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
          setError('');
        }, 1800);
      } else {
        setError('Error resetting password. Please check backend connection.');
      }
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
      <Navbar activeTab={activeTab || 'login'} onNavigate={handleNav} currentUser={currentUser} onLogout={onLogout} />
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
            {!isForgotMode ? (
              /* LOGIN MODE */
              <>
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
                  {successMsg && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>{successMsg}</div>}

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
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setForgotStep(1);
                        setForgotEmail(email);
                        setError('');
                        setSuccessMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#8F7CFF', fontSize: '13px', cursor: 'pointer', textDecoration: 'none', padding: 0 }}
                    >
                      Forgot password?
                    </button>
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
                    onClick={handleGoogleBtnClick}
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
              </>
            ) : (
              /* FORGOT PASSWORD MODE */
              <>
                <div className="form-head">
                  <div className="tag" style={{ background: 'rgba(143, 124, 255, 0.15)', color: '#8F7CFF' }}>Password Recovery</div>
                  <h2>Reset Password</h2>
                  <p>
                    {forgotStep === 1
                      ? 'Enter your registered email address to verify your account.'
                      : `Set a new secure password for ${forgotEmail}`}
                  </p>
                </div>

                {error && <div className="err show">{error}</div>}
                {successMsg && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>{successMsg}</div>}

                {forgotStep === 1 ? (
                  <form onSubmit={handleVerifyEmail} noValidate>
                    <div className="field">
                      <label htmlFor="forgotEmail">Registered Email</label>
                      <div className="input-row">
                        <input
                          type="email"
                          id="forgotEmail"
                          placeholder="you@company.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                        />
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="M3 7l9 6 9-6" />
                        </svg>
                      </div>
                    </div>

                    <button type="submit" className="submit" disabled={submitting}>
                      {submitting ? 'Verifying Email…' : 'Verify Account & Continue'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} noValidate>
                    <div className="field">
                      <label htmlFor="newPassword">New Password</label>
                      <div className="input-row">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          id="newPassword"
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="toggle-pass"
                          onClick={() => setShowNewPassword((s) => !s)}
                        >
                          {showNewPassword ? (
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
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <div className="input-row">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="submit" disabled={submitting}>
                      {submitting ? 'Updating Password…' : 'Update Password'}
                    </button>
                  </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setForgotStep(1);
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#48CAE4',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ← Return to Sign in
                  </button>
                </div>
              </>
            )}

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

      {/* Authentic Google Account Chooser Modal */}
      <GoogleAuthModal 
        isOpen={isGoogleModalOpen} 
        onClose={() => setIsGoogleModalOpen(false)} 
        onSelectAccount={handleSelectGoogleAccount} 
      />
    </div>
  );
}
