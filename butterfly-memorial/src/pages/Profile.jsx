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

            // Fetch honoree name if reference exists
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

        // Sort by creation date, newest first
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

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="page" style={{
        backgroundImage: `url(${FlowersBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div className="wrap">
          <Header onSignInClick={() => setAuthOpen(true)} />
          <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
            <div className="hero-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prompt sign in if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="page" style={{
        backgroundImage: `url(${FlowersBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div className="wrap">
          <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
          <Header onSignInClick={() => setAuthOpen(true)} />
          <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
            <div className="hero-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '500px' }}>
              <h2 style={{ marginBottom: '16px' }}>Sign in to view your gardens</h2>
              <p className="sub" style={{ marginBottom: '24px' }}>
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
    <div className="page" style={{
      backgroundImage: `url(${FlowersBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className="wrap">
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} />

        <section style={{ flex: 1, paddingTop: '24px' }}>
          <div className="hero-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0 }}>My Gardens</h2>
                <p className="sub" style={{ margin: '8px 0 0' }}>{user?.email}</p>
              </div>
              <Link to="/create" className="btn primary">
                Create Garden
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                Loading your gardens...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
                {error}
              </div>
            ) : gardens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p className="sub" style={{ marginBottom: '16px' }}>You haven't created any gardens yet.</p>
                <Link to="/create" className="btn ghost">
                  Create Your First Garden
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {gardens.map((garden) => (
                  <Link
                    key={garden.id}
                    to={`/garden/${garden.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: '#fff',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: getThemeGradient(garden.style),
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '24px' }}>🦋</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '16px' }}>
                        {garden.honoreeName}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '2px' }}>
                        {garden.style ? capitalizeFirst(garden.style) : 'Garden'} · Created {formatDate(garden.created)}
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)', flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#394150' }}>
          © {new Date().getFullYear()} Butterfly Memorial
        </footer>
      </div>
    </div>
  );
}

function getThemeGradient(style) {
  switch (style) {
    case 'mountain':
      return 'linear-gradient(135deg, #a8d5ba, #6b8e7a)';
    case 'tropical':
      return 'linear-gradient(135deg, #ffd93d, #6bcb77)';
    case 'lake':
      return 'linear-gradient(135deg, #74b9ff, #0984e3)';
    default:
      return 'linear-gradient(135deg, #ffe7f3, #e6f5ff)';
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
