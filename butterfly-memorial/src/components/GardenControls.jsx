
import React, { useState } from 'react';
import { addDoc, collection, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function GardenControls({ butterflies, onAdd, gardenId }) {
  const [open, setOpen] = useState(null); // 'list' | 'buy' | null
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [qty, setQty] = useState('1');

  const createButterfly = async () => {
    const gardenRef = doc(db, 'gardens', gardenId);

    const docRef = await addDoc(collection(db, 'butterflies'), {
      gifter: name,
      message: msg,
      garden: gardenRef,
      gardenId: gardenId,
      created: new Date(),
    });
    console.log('Butterfly created:', docRef.id);
    return docRef.id;
  };

  const release = async () => {
    const butterflyId = await createButterfly();

    setOpen(null);
    setName('');
    setMsg('');
    setQty('1');
  };

  return (
    <>
      <div className="garden-controls" style={{ zIndex: 21 }}>
        <button className="btn ghost" onClick={() => setOpen('list')}>
          Butterflies ({butterflies.length})
        </button>
        <button className="btn primary" onClick={() => setOpen('buy')}>
          Buy & release
        </button>
      </div>

      <Panel open={open === 'list'} onClose={() => setOpen(null)} title="Butterflies in this garden">
        {butterflies.length === 0 && <div className="sub">No butterflies yet. Be the first to leave a message.</div>}
        {butterflies.map((b) => (
          <div
            key={b.id}
            className="card"
            style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <div
              className="badge"
              style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center' }}
            >
              🦋
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{b.from}</div>
              <div className="sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {b.message}
              </div>
            </div>
          </div>
        ))}
      </Panel>

      <Panel open={open === 'buy'} onClose={() => setOpen(null)} title="Buy & release butterflies">
        <div style={{ display: 'grid', gap: 12 }}>
          <input className="in" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="in" placeholder="Short message" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="cta-row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn primary" onClick={release}>
              Release
            </button>
          </div>
        </div>
      </Panel>
    </>
  );
}

function Panel({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="panel-root">
      <button aria-label="Close" className="panel-backdrop" onClick={onClose} />
      <div className="hero-card panel-sheet">
        <div className="panel-head">
          <h3 className="h3" style={{ margin: 0 }}>
            {title}
          </h3>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}