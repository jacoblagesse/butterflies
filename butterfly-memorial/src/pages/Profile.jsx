import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AuthPopup from '../components/AuthPopup';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import './spirit-butterfly.css';
import FlowersBackground from '../assets/backgrounds/background__homepage.png';

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGardens() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const gardensQuery = query(
          collection(db, 'gardens'),
          where('user', '==', userRef)
        );
        const snapshot = await getDocs(gardensQuery);

        const gardensList = await Promise.all(
          snapshot.docs.map(async (gardenDoc) => {
            const gardenData = gardenDoc.data();
            let honoreeName = 'Unknown';

            if (gardenData.honoree) {
              try {
                const honoreeSnap = await getDocs(
                  query(collection(db, 'honoree'), where('__name__', '==', gardenData.honoree.id))
                );
                if (!honoreeSnap.empty) {
                  const honoreeData = honoreeSnap.docs[0].data();
                  honoreeName = `${honoreeData.first_name || ''} ${honoreeData.last_name || ''}`.trim() || 'Unknown';
                }
              } catch (e) {
                console.error('Error fetching honoree:', e);
              }
            }

            return {
              id: gardenDoc.id,
              ...gardenData,
              honoreeName,
              created: gardenData.created?.toDate?.() || new Date(),
            };
          })
        );

        gardensList.sort((a, b) => b.created - a.created);
        setGardens(gardensList);
      } catch (err) {
        console.error('Error fetching gardens:', err);
        setError('Failed to load gardens');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchGardens();
    }
  }, [user, authLoading]);

  const bgStyle = {
    backgroundImage: `url(${FlowersBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  if (authLoading) {
    return (
      <div className="page" style={bgStyle}>
        <div className="wrap">
          <Header onSignInClick={() => setAuthOpen(true)} />
          <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
            <div className="hero-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--muted)' }}>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page" style={bgStyle}>
        <div className="wrap">
          <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
          <Header onSignInClick={() => setAuthOpen(true)} />
          <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
            <div className="hero-card" style={{ textAlign: 'center', padding: '44px 36px', maxWidth: '460px' }}>
              <h2 style={{ marginBottom: '12px', fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)' }}>
                Sign in to view your gardens
              </h2>
              <p className="sub" style={{ marginBottom: '24px', fontSize: '0.95rem' }}>
                Create an account or sign in to see all the gardens you've created.
              </p>
              <button className="btn primary" onClick={() => setAuthOpen(true)}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={bgStyle}>
      <div className="wrap">
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} />

        <section style={{ flex: 1, paddingTop: '24px' }}>
          <div className="hero-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3.5vw, 1.7rem)' }}>My Gardens</h2>
                <p className="sub" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{user?.email}</p>
              </div>
              <Link to="/create" className="btn primary" style={{ fontSize: '0.9rem', padding: '10px 20px' }}>
                Create Garden
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                Loading your gardens...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#b44848' }}>
                {error}
              </div>
            ) : gardens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px' }}>
                <p className="sub" style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
                  You haven't created any gardens yet.
                </p>
                <Link to="/create" className="btn ghost">
                  Create Your First Garden
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {gardens.map((garden) => (
                  <Link
                    key={garden.id}
                    to={`/garden/${garden.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      background: 'var(--card-solid)',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px var(--ring)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: getThemeGradient(garden.style),
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '20px' }}>🦋</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>
                        {garden.honoreeName}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                        {garden.style ? capitalizeFirst(garden.style) : 'Garden'} · {formatDate(garden.created)}
                      </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)', flexShrink: 0, opacity: 0.5 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="page-footer">
          &copy; {new Date().getFullYear()} Butterfly Memorial
        </footer>
      </div>
    </div>
  );
}

function getThemeGradient(style) {
  switch (style) {
    case 'mountain':
      return 'linear-gradient(135deg, #b8d5c4, #7a9e8a)';
    case 'tropical':
      return 'linear-gradient(135deg, #f0d98c, #8ecb9a)';
    case 'lake':
      return 'linear-gradient(135deg, #95c4e8, #5a9ac7)';
    default:
      return 'linear-gradient(135deg, rgba(212,169,199,0.3), rgba(155,142,196,0.2))';
  }
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString();
}
