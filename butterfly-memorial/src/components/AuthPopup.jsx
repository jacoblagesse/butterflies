import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } from '../firebase';
import './AuthPopup.css';

import FlowersBackground from '../assets/backgrounds/background__homepage.png';
import LogoUrl from '../assets/logos/logo.svg';

const AuthPopup = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
  };

  const handleClose = () => {
    resetForm();
    setMode('signin');
    onClose();
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email, password);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed';
      case 'auth/cancelled-popup-request':
        return '';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="auth-popup-backdrop" onClick={handleClose}>
      <div 
        className="auth-popup-container"
        style={{
          backgroundImage: `url(${FlowersBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-popup-content">
          <button className="auth-popup-close" onClick={handleClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="auth-popup-header">
            <div className="auth-logo">
              <img src={LogoUrl} alt="Butterfly Memorial" style={{ width: '100%', height: 'auto' }} />
            </div>
            <h2 className="auth-title">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'signin' && 'Sign in to manage your butterfly gardens'}
              {mode === 'signup' && 'Join Spirit Butterfly today'}
              {mode === 'forgot' && 'Enter your email to reset your password'}
            </p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          {mode !== 'forgot' && (
            <button 
              className="auth-google-btn" 
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {mode !== 'forgot' && (
            <div className="auth-divider">
              <span>or</span>
            </div>
          )}

          <form onSubmit={mode === 'signin' ? handleEmailSignIn : mode === 'signup' ? handleEmailSignUp : handlePasswordReset}>
            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                className="in"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  className="in"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  className="in"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            {mode === 'signin' && (
              <>
                <p>
                  Don't have an account?{' '}
                  <button className="auth-link" onClick={() => switchMode('signup')}>
                    Sign up
                  </button>
                </p>
                <p>
                  <button className="auth-link" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button className="auth-link" onClick={() => switchMode('signin')}>
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button className="auth-link" onClick={() => switchMode('signin')}>
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;