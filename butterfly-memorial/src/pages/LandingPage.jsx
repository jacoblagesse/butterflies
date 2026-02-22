import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import "./spirit-butterfly.css";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Landing() {
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
    <PageLayout centered>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          width: "100%",
        }}
      >
        {/* Search bar - floating */}
        <div
          className="hero-card"
          style={{
            maxWidth: "600px",
            width: "100%",
            padding: "24px 28px",
            position: "relative",
            zIndex: 10,
          }}
        >
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
                padding: "16px 18px 16px 48px",
                fontSize: "16px",
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
              left: "28px",
              right: "28px",
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

        {/* Create garden button - floating */}
        <Link
          className="btn primary"
          to="/create"
          style={{
            textAlign: "center",
            minWidth: "240px",
            fontSize: "1rem",
            padding: "15px 36px",
            zIndex: 1,
            position: "relative",
          }}
        >
          Create a Garden
        </Link>
      </section>
    </PageLayout>
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
