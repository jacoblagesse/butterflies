import React, { useEffect, useState } from 'react';
import { Panel } from './GardenControls';
import { updateGardenInfoFn } from '../firebase';
import { sha256Hex } from '../utils/hash';

import iconMountain from '../assets/garden-icons/garden_icons_mountain.png';
import iconTropical from '../assets/garden-icons/garden_icons_tropical.png';
import iconLake from '../assets/garden-icons/garden_icons_lake.png';
import iconDesert from '../assets/garden-icons/garden_icons_desert.png';
import iconJapanese from '../assets/garden-icons/garden_icons_japanese.png';

const STYLES = [
  { key: 'mountain', label: 'Mountain', icon: iconMountain },
  { key: 'tropical', label: 'Tropical', icon: iconTropical },
  { key: 'lake', label: 'Lake', icon: iconLake },
  { key: 'desert', label: 'Desert', icon: iconDesert },
  { key: 'japanese garden', label: 'Zen', icon: iconJapanese },
];

export default function GardenSettings({ garden, honoree, gardenId, isOwner, onSaved }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(garden?.style || 'mountain');
  const [firstName, setFirstName] = useState(honoree?.first_name || '');
  const [lastName, setLastName] = useState(honoree?.last_name || '');
  const [dates, setDates] = useState(honoree?.dates || '');
  const [obit, setObit] = useState(honoree?.obit || '');
  const [passwordProtected, setPasswordProtected] = useState(!!garden?.passwordHash);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Re-sync the form whenever the panel is (re)opened, so edits made in a
  // prior open (or a save elsewhere) aren't stomped by stale local state.
  useEffect(() => {
    if (!open) return;
    setStyle(garden?.style || 'mountain');
    setFirstName(honoree?.first_name || '');
    setLastName(honoree?.last_name || '');
    setDates(honoree?.dates || '');
    setObit(honoree?.obit || '');
    setPasswordProtected(!!garden?.passwordHash);
    setNewPassword('');
    setError(null);
  }, [open, garden, honoree]);

  if (!isOwner) return null;

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    const hadPassword = !!garden?.passwordHash;
    if (passwordProtected && !hadPassword && !newPassword.trim()) {
      setError('Enter a password to protect this garden.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let passwordHash; // undefined = leave unchanged
      if (!passwordProtected) {
        passwordHash = null; // clear protection
      } else if (newPassword.trim()) {
        passwordHash = await sha256Hex(newPassword.trim());
      }

      await updateGardenInfoFn({
        gardenId,
        style,
        honoree: {
          first_name: firstName,
          last_name: lastName,
          dates,
          obit,
        },
        ...(passwordHash !== undefined && { passwordHash }),
      });
      onSaved?.({
        garden: { ...garden, style, ...(passwordHash !== undefined && { passwordHash }) },
        honoree: { ...honoree, first_name: firstName.trim(), last_name: lastName.trim(), dates: dates.trim(), obit: obit.trim() },
      });
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Something went wrong saving your changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="garden-settings-btn"
        onClick={() => setOpen(true)}
        aria-label="Garden Settings"
        title="Garden Settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <Panel open={open} onClose={() => setOpen(false)} title="Garden Settings">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div className="sub" style={{ marginBottom: 8 }}>Style</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
              {STYLES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`theme-tile ${style === t.key ? 'active' : ''}`}
                  onClick={() => setStyle(t.key)}
                >
                  <img
                    src={t.icon}
                    alt={t.label}
                    style={{ width: 32, height: 32, imageRendering: 'pixelated', display: 'block', margin: '4px auto 0' }}
                  />
                  <div className="theme-label" style={{ fontSize: '0.8rem' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="sub" style={{ marginBottom: 8 }}>Loved one's details</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input
                  className="in"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  className="in"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <input
                className="in"
                placeholder="Dates (e.g., 1950–2024)"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
              />
              <input
                className="in"
                placeholder="Short dedication"
                value={obit}
                onChange={(e) => setObit(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={passwordProtected}
                onChange={(e) => { setPasswordProtected(e.target.checked); setNewPassword(''); }}
              />
              <span className="sub" style={{ margin: 0 }}>Password protect this garden</span>
            </label>
            {passwordProtected && (
              <input
                className="in"
                type="password"
                placeholder={garden?.passwordHash ? 'New password (leave blank to keep current)' : 'Password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ marginTop: 10 }}
              />
            )}
          </div>

          {error && <div style={{ color: '#c44040', fontSize: '0.9rem' }}>{error}</div>}

          <div className="cta-row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Panel>
    </>
  );
}
