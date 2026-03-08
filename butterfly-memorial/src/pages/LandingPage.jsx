import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import "./spirit-butterfly.css";
import logoSvg from "../assets/logos/butterflyhomepagelogo.svg";
import butterflyBlue from "../assets/butterflies/blue/flying.gif";
import butterflyPink from "../assets/butterflies/pink/flying.gif";
import butterflyPurple from "../assets/butterflies/purple/flying.gif";
import butterflyGreen from "../assets/butterflies/green/flying.gif";
import butterflyOrange from "../assets/butterflies/orange/flying.gif";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const pricingTiers = [
  { q: "1", p: "$1.98", gifs: [butterflyBlue] },
  { q: "3", p: "$4.98", gifs: [butterflyBlue, butterflyPink, butterflyPurple] },
  { q: "10", p: "$9.98", gifs: [butterflyBlue, butterflyPink, butterflyPurple, butterflyGreen, butterflyOrange] },
];

const BUTTERFLY_CONFIG = {
  1: { size: 94, offsets: [{ x: 0, y: 0 }] },
  3: { size: 68, offsets: [{ x: -22, y: 10 }, { x: 0, y: -8 }, { x: 22, y: 10 }] },
  5: { size: 52, offsets: [{ x: 0, y: -18 }, { x: 17, y: -6 }, { x: 11, y: 15 }, { x: -11, y: 15 }, { x: -17, y: -6 }] },
};

const snapSection = {
  height: "100vh",
  scrollSnapAlign: "start",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  zIndex: 1,
  padding: "0 24px",
  boxSizing: "border-box",
  width: "100%",
};

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);

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
    <PageLayout snap>

      {/* ── Hero ── */}
      <section style={{ ...snapSection, height: "calc(100vh - 80px)", gap: "0" }}>
        {/* Grand title */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <img
            src={logoSvg}
            alt="Butterfly Tribute"
            style={{
              width: "clamp(280px, 60vw, 600px)",
              height: "auto",
              display: "block",
              margin: "0 auto 16px",
              filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.7)) drop-shadow(0 4px 32px rgba(18,12,28,0.6))",
            }}
          />
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "rgba(255,255,255,0.82)",
            margin: 0,
            letterSpacing: "0.01em",
            textShadow: "0 1px 4px rgba(0,0,0,0.8), 0 2px 16px rgba(18,12,28,0.6)",
          }}>
            A place to honor those we hold in our hearts
          </p>
        </div>

        {/* Search bar */}
        <div
          className="hero-card"
          style={{
            maxWidth: "600px",
            width: "100%",
            padding: "24px 28px",
            position: "relative",
            zIndex: 10,
            marginBottom: "20px",
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

        {/* Scroll hint */}
        <div style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          opacity: 0.5,
          animation: "bob 2s ease-in-out infinite",
        }}>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.9)", letterSpacing: "0.08em", textTransform: "uppercase" }}>scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={{ ...snapSection, scrollMarginTop: 0 }}>
        <div className="hero-card" style={{
          maxWidth: "620px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 40px",
          textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.6rem, 4vw, 2.1rem)",
            fontWeight: 700,
            marginBottom: "1.2rem",
            color: "var(--ink)",
          }}>
            Welcome to ButterflyTribute.com
          </h2>
          <p style={{
            marginBottom: "1rem",
            color: "var(--muted)",
            fontSize: "0.95rem",
            lineHeight: 1.75,
            maxWidth: "520px",
          }}>
            Choose from our serene garden scenes, each designed to reflect peace and hold memories of a loved one.
            Together, we'll honor their spirit with heartfelt tributes in a tranquil space.
          </p>
          <p style={{
            marginBottom: "2rem",
            color: "var(--muted)",
            fontSize: "0.95rem",
            lineHeight: 1.75,
            maxWidth: "520px",
          }}>
            As a gift to those grieving, we offer a free garden memorial and a butterfly. Once the garden is created,
            you can share it with friends and family, who can release their own butterflies as a show of love and support.
            This beautiful garden can be revisited anytime as a place where memories can continue to bloom.
          </p>
          <Link to="/create" className="btn primary" style={{ minWidth: "200px" }}>
            Create your first Garden
          </Link>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ ...snapSection, gap: "0" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 800,
            marginBottom: "0.5rem",
            color: "#fff",
            textShadow: "0 2px 6px rgba(0,0,0,0.7), 0 4px 24px rgba(18,12,28,0.6)",
          }}>
            Buy butterflies
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.92)",
            fontSize: "1.05rem",
            fontWeight: 600,
            margin: 0,
            textShadow: "0 1px 4px rgba(0,0,0,0.7), 0 2px 12px rgba(18,12,28,0.5)",
          }}>
            Each butterfly carries a personal message to the garden
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          width: "100%",
          maxWidth: "680px",
        }}>
          {pricingTiers.map((t, i) => (
            <div
              key={i}
              className="hero-card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "28px 24px",
                textAlign: "center",
                gap: "8px",
                border: "6px solid #fff",
              }}
            >
              <div style={{ position: "relative", width: "90px", height: "84px", marginBottom: "4px", flexShrink: 0 }}>
                {t.gifs.map((gif, gi) => {
                  const { size, offsets } = BUTTERFLY_CONFIG[t.gifs.length];
                  const { x, y } = offsets[gi];
                  return (
                    <img
                      key={gi}
                      src={gif}
                      alt="butterfly"
                      style={{
                        position: "absolute",
                        width: `${size}px`,
                        height: `${size}px`,
                        objectFit: "contain",
                        top: "50%",
                        left: "50%",
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        zIndex: gi,
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--ink)", textShadow: "0 1px 4px rgba(44,40,54,0.15)" }}>
                {t.q} Butterfl{t.q !== "1" ? "ies" : "y"}
              </div>
              <div style={{ color: "var(--cta)", fontSize: "1.4rem", fontWeight: 800, textShadow: "0 1px 4px rgba(125,107,145,0.2)" }}>
                {t.p}
              </div>
              <button className="btn ghost" style={{
                fontSize: "0.9rem",
                padding: "10px 24px",
                width: "100%",
                border: "4px solid #fff",
              }}>
                Buy
              </button>
            </div>
          ))}
        </div>

        <p style={{
          position: "absolute",
          bottom: "24px",
          color: "rgba(255,255,255,0.45)",
          fontSize: "13px",
          margin: 0,
        }}>
          &copy; {new Date().getFullYear()} Butterfly Memorial
        </p>
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
