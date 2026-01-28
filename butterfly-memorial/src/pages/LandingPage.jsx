import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuthPopup from "../components/AuthPopup";
import FlyingButterfly from "../components/FlyingButterfly";
import { useButterflyPhysics } from "../hooks/useButterflyPhysics";
import "./spirit-butterfly.css";

import LogoUrl from "../assets/logos/logo.svg";
import DaisiesBackground from "../assets/backgrounds/daisies.png";

import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const AMBIENT_BUTTERFLIES = [
  { id: "amb-1", gifter: "", message: "", color: "blue" },
  { id: "amb-2", gifter: "", message: "", color: "pink" },
  { id: "amb-3", gifter: "", message: "", color: "purple" },
  { id: "amb-4", gifter: "", message: "", color: "orange" },
  { id: "amb-5", gifter: "", message: "", color: "green" },
  { id: "amb-6", gifter: "", message: "", color: "yellow" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);
  const stageRef = useRef(null);

  const butterflyStates = useButterflyPhysics(AMBIENT_BUTTERFLIES, stageRef);

  // Client-side search against honorees
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setHasSearched(true);
      try {
        // Fetch all honorees and gardens, then filter client-side
        const [honoreesSnap, gardensSnap] = await Promise.all([
          getDocs(collection(db, "honoree")),
          getDocs(collection(db, "gardens")),
        ]);

        const honorees = {};
        honoreesSnap.docs.forEach((doc) => {
          honorees[doc.id] = { id: doc.id, ...doc.data() };
        });

        const q = searchQuery.toLowerCase().trim();
        const matched = [];

        gardensSnap.docs.forEach((gardenDoc) => {
          const garden = gardenDoc.data();
          const honoreeRef = garden.honoree;
          if (!honoreeRef) return;

          const honoree = honorees[honoreeRef.id];
          if (!honoree) return;

          const fullName = `${honoree.first_name || ""} ${honoree.last_name || ""}`.toLowerCase();
          if (fullName.includes(q)) {
            matched.push({
              gardenId: gardenDoc.id,
              gardenStyle: garden.style,
              firstName: honoree.first_name || "",
              lastName: honoree.last_name || "",
              dates: honoree.dates || "",
            });
          }
        });

        setResults(matched);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  return (
    <div
      className="page"
      style={{
        backgroundImage: `url(${DaisiesBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      {/* Ambient butterfly layer — behind all content */}
      <div
        ref={stageRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {butterflyStates.map((s) => (
          <FlyingButterfly
            key={s.id}
            x={s.x}
            y={s.y}
            size={s.size}
            direction={s.direction}
            imageIndex={s.imageIndex}
            label=""
            isLanded={s.isLanded}
            color={s.color || null}
          />
        ))}
      </div>

      <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} />

        <section
          className="hero"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "420px",
          }}
        >
          <div
            className="hero-card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "44px 36px",
              maxWidth: "580px",
              width: "100%",
            }}
          >
            <h2
              style={{
                marginBottom: "0.5rem",
                fontSize: "clamp(1.6rem, 4.5vw, 2.2rem)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Butterfly Memorial Garden
            </h2>
            <p className="sub" style={{ textAlign: "center", marginBottom: "1.75rem", maxWidth: "440px" }}>
              Search for a loved one's garden or create a new one.
            </p>

            {/* Search bar */}
            <div style={{ width: "100%", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  style={{
                    position: "absolute", left: "16px", top: "50%",
                    transform: "translateY(-50%)", color: "var(--muted)",
                    pointerEvents: "none", opacity: 0.6,
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="in"
                  type="text"
                  placeholder="Search by name of loved one..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 46px",
                    fontSize: "15px",
                    borderRadius: "var(--r-sm)",
                    boxShadow: "0 2px 10px var(--ring)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Search results dropdown */}
              {searchQuery.trim() && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  background: "var(--card-solid)",
                  borderRadius: "var(--r-sm)",
                  boxShadow: "0 8px 32px rgba(44,40,54,0.12)",
                  overflow: "hidden",
                  zIndex: 50,
                  maxHeight: "260px",
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                }}>
                  {searching ? (
                    <div style={{ padding: "18px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
                      Searching...
                    </div>
                  ) : results.length > 0 ? (
                    results.map((r) => (
                      <Link
                        key={r.gardenId}
                        to={`/garden/${r.gardenId}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "inherit",
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "rgba(155,142,196,0.06)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "10px",
                          background: getThemeGradient(r.gardenStyle),
                          display: "grid", placeItems: "center", flexShrink: 0,
                        }}>
                          <span style={{ fontSize: "18px" }}>🦋</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>
                            {r.firstName} {r.lastName}
                          </div>
                          {r.dates && (
                            <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "1px" }}>
                              {r.dates}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : hasSearched ? (
                    <div style={{ padding: "18px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
                      No gardens found for "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Create garden button */}
            <Link
              className="btn primary"
              to="/create"
              style={{
                marginTop: "1.25rem",
                textAlign: "center",
                minWidth: "220px",
                fontSize: "0.95rem",
                padding: "13px 32px",
              }}
            >
              Create a Garden
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "20px 0",
          }}
        >
          <div
            className="hero-card"
            style={{
              width: "min(680px, 100%)",
              padding: "28px 32px",
              lineHeight: 1.7,
              color: "var(--ink)",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 12px", color: "var(--ink)", fontSize: "0.95rem" }}>
              Welcome to ButterflyTribute.com.
            </p>
            <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: "0.95rem" }}>
              Choose from our serene garden scenes, each designed to reflect peace and hold memories of a loved one.
              Together, we'll honor their spirit with heartfelt tributes in a tranquil space.
            </p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
              As a gift to those grieving, we offer a free garden memorial and a butterfly. Once the garden is created,
              you can share it with friends and family, who can release their own butterflies as a show of love and support.
              This beautiful garden can be revisited anytime as a place where memories can continue to bloom.
            </p>
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
    case "mountain": return "linear-gradient(135deg, #b8d5c4, #7a9e8a)";
    case "tropical": return "linear-gradient(135deg, #f0d98c, #8ecb9a)";
    case "lake": return "linear-gradient(135deg, #95c4e8, #5a9ac7)";
    default: return "linear-gradient(135deg, rgba(212,169,199,0.3), rgba(155,142,196,0.2))";
  }
}
