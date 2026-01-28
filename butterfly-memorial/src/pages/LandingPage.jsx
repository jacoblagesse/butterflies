import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuthPopup from "../components/AuthPopup";
import "./spirit-butterfly.css";

import LogoUrl from "../assets/logos/logo.svg";
import DaisiesBackground from "../assets/backgrounds/daisies.png";

import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function Landing() {
  const navigate = useNavigate();
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);

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
      }}
    >
      <div className="wrap">
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
              padding: "36px 28px",
              maxWidth: "640px",
              width: "100%",
            }}
          >
            <h2 style={{ marginBottom: "0.75rem", fontSize: "2.4rem", textAlign: "center" }}>
              Butterfly Memorial Garden
            </h2>
            <p className="sub" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              Search for a loved one's garden or create a new one.
            </p>

            {/* Search bar */}
            <div style={{ width: "100%", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{
                    position: "absolute", left: "16px", top: "50%",
                    transform: "translateY(-50%)", color: "var(--muted)",
                    pointerEvents: "none",
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
                    padding: "16px 16px 16px 48px",
                    fontSize: "17px",
                    borderRadius: "16px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Search results dropdown */}
              {searchQuery.trim() && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  zIndex: 50,
                  maxHeight: "280px",
                  overflowY: "auto",
                }}>
                  {searching ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "15px" }}>
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
                          padding: "14px 16px",
                          textDecoration: "none",
                          color: "inherit",
                          borderBottom: "1px solid #f3f4f6",
                          transition: "background 0.15s ease",
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#f9fafb"}
                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "10px",
                          background: getThemeGradient(r.gardenStyle),
                          display: "grid", placeItems: "center", flexShrink: 0,
                        }}>
                          <span style={{ fontSize: "20px" }}>🦋</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "15px" }}>
                            {r.firstName} {r.lastName}
                          </div>
                          {r.dates && (
                            <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
                              {r.dates}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : hasSearched ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "15px" }}>
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
                marginTop: "1.5rem",
                textAlign: "center",
                minWidth: "260px",
                fontSize: "1.15rem",
                padding: "0.9rem 2.5rem",
                borderRadius: "2rem",
              }}
            >
              Create a Garden
            </Link>
          </div>
        </section>

        <section
          className="about"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "min(800px, 100%)",
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              borderRadius: "16px",
              padding: "24px",
              lineHeight: 1.6,
              color: "#2f3a4c",
            }}
          >
            <p style={{ marginTop: 0 }}>
              Welcome to ButterflyTribute.com.
            </p>
            <p>
              Choose from our serene garden scenes, each designed to reflect peace and hold memories of a loved one.
              Together, we'll honor their spirit with heartfelt tributes in a tranquil space.
            </p>
            <p style={{ marginBottom: 0 }}>
              As a gift to those grieving, we offer a free garden memorial and a butterfly. Once the garden is created,
              you can share it with friends and family, who can release their own butterflies as a show of love and support.
              This beautiful garden can be revisited anytime as a place where memories can continue to bloom.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

function getThemeGradient(style) {
  switch (style) {
    case "mountain": return "linear-gradient(135deg, #a8d5ba, #6b8e7a)";
    case "tropical": return "linear-gradient(135deg, #ffd93d, #6bcb77)";
    case "lake": return "linear-gradient(135deg, #74b9ff, #0984e3)";
    default: return "linear-gradient(135deg, #ffe7f3, #e6f5ff)";
  }
}
