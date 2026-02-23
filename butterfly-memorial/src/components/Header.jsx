import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LogoUrl from '../assets/logos/logo.svg';
import './Header.css';

function UserIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserDropdown({ onSignInClick, variant = 'default' }) {
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <div style={{ width: 40, height: 40 }} />;
  }

  const isMinimal = variant === 'minimal';

  return (
    <div className={`user-dropdown ${isMinimal ? 'user-dropdown-minimal' : ''}`} ref={dropdownRef}>
      <button
        className="user-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={`user-icon-wrapper ${isAuthenticated ? 'authenticated' : ''}`}>
          <UserIcon size={20} />
        </div>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          {isAuthenticated ? (
            <>
              <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">
                  <UserIcon size={24} />
                </div>
                <div className="user-dropdown-info">
                  <span className="user-dropdown-email">{user?.email}</span>
                </div>
              </div>
              <div className="user-dropdown-divider" />
              <Link to="/profile" className="user-dropdown-item" onClick={() => setIsOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                My Gardens
              </Link>
              <button className="user-dropdown-item" onClick={() => { signOut(); setIsOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <div className="user-dropdown-header">
                <span className="user-dropdown-guest">Welcome, Guest</span>
              </div>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item" onClick={() => { onSignInClick?.(); setIsOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function handleSmoothScroll(e, id) {
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function Header({ onSignInClick, variant = 'default' }) {
  if (variant === 'minimal') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" className="brand">
          <img src={LogoUrl} alt="Butterfly Memorial logo" className="logo" />
        </Link>
        <UserDropdown onSignInClick={onSignInClick} variant="minimal" />
      </div>
    );
  }

  return (
    <header style={{ justifyContent: 'flex-end' }}>
      <nav>
        <a href="/#about" onClick={(e) => handleSmoothScroll(e, 'about')} style={{ color: 'rgba(255,255,255,0.8)' }}>About</a>
        <a href="/#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} style={{ color: 'rgba(255,255,255,0.8)' }}>Pricing</a>
        <UserDropdown onSignInClick={onSignInClick} />
      </nav>
    </header>
  );
}
