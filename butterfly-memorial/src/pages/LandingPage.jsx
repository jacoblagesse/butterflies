import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import "./spirit-butterfly.css";
import logoSvg from "../assets/logos/butterflyhomepagelogo.svg";
import whiteButterfly from "../assets/butterflies/white/flying.gif";
import aboutFlowers from "../assets/backgrounds/about_flowers.png";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const SECTIONS = ["hero", "about"];

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const debounceRef = useRef(null);

  // Track which section is in view
  useEffect(() => {
    const observers = SECTIONS.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.5 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  // Search logic
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

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const nextIdx = SECTIONS.indexOf(activeSection) + 1;
  const nextSection = nextIdx < SECTIONS.length ? SECTIONS[nextIdx] : null;
  const showBackToTop = activeSection !== "hero";
  const showLearnMore = nextSection !== null;

  return (
    <PageLayout snap>
      {/* ── Fixed nav buttons — portaled to body to escape stacking contexts ── */}
      {createPortal(
        <>
          {showBackToTop && (
            <button
              type="button"
              onClick={() => scrollTo("hero")}
              className="landing-nav-btn landing-nav-btn--top"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span className="landing-nav-btn-label">Back to Top</span>
            </button>
          )}
          {showLearnMore && (
            <button
              type="button"
              onClick={() => scrollTo(nextSection)}
              className="landing-nav-btn landing-nav-btn--bottom"
            >
              <span className="landing-nav-btn-label">Learn More</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </>,
        document.body
      )}

      {/* ── Hero ── */}
      <section id="hero" className="landing-section landing-hero">
        <div className="landing-hero-header">
          <img src={logoSvg} alt="Butterfly Tribute" className="landing-hero-logo" />
          <p className="landing-hero-tagline">
            Honor a loved one by releasing a butterfly in a virtual garden
          </p>
        </div>

        <div className="landing-hero-main">
          <div className="hero-card landing-search-card">
            <div className="landing-search-wrap">
              <svg
                className="landing-search-icon"
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="in landing-search-input"
                type="text"
                placeholder="Search for an existing Tribute Garden by name of loved one"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery.trim() && (
              <div className="landing-search-results">
                {searching ? (
                  <div className="landing-search-empty">Searching...</div>
                ) : results.length > 0 ? (
                  results.map((r) => (
                    <Link
                      key={r.gardenId}
                      to={`/garden/${r.gardenId}`}
                      className="landing-search-result"
                    >
                      <div
                        className="landing-search-result-icon"
                        style={{ background: getThemeGradient(r.gardenStyle) }}
                      >
                        <span>🦋</span>
                      </div>
                      <div>
                        <div className="landing-search-result-name">
                          {r.firstName} {r.lastName}
                        </div>
                        {r.dates && (
                          <div className="landing-search-result-dates">{r.dates}</div>
                        )}
                      </div>
                    </Link>
                  ))
                ) : hasSearched ? (
                  <div className="landing-search-empty">
                    No gardens found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <Link className="btn primary landing-cta" to="/create">
            Create a Garden
          </Link>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="landing-section">
        <div className="hero-card landing-about-card">
          <h2 className="landing-about-title">Welcome to ButterflyTribute.com</h2>
          <p className="landing-about-text" style={{ marginBottom: 0 }}>
            Choose from our serene garden scenes, each designed to reflect peace and hold memories of a loved one.
            Together, we'll honor their spirit with heartfelt tributes in a tranquil space.{" "}
            <Link to="/garden/roFm02RISiK356RDTG7q" className="landing-example-link">See an example garden here.</Link>
          </p>
          <img src={aboutFlowers} alt="" aria-hidden="true" className="landing-about-divider" />
          <p className="landing-about-text">
            <strong>As a gift to those honoring a loved one, we offer a free garden memorial and a white butterfly.</strong>{" "}
            Share the garden with friends and family, who can release their own colorful butterflies
            as a show of love and support.
            This beautiful garden can be revisited anytime as a place where memories can continue to bloom.
          </p>
          <Link to="/create" className="btn primary" style={{ minWidth: "170px", padding: "10px 22px", fontSize: "0.95rem" }}>
            Create your first Garden
          </Link>

        </div>
      </section>

    </PageLayout>
  );
}

function getThemeGradient(style) {
  switch (style) {
    case "mountain": return "linear-gradient(135deg, #b8d5c4, #7a9e8a)";
    case "tropical": return "linear-gradient(135deg, #f0d98c, #8ecb9a)";
    case "lake": return "linear-gradient(135deg, #95c4e8, #5a9ac7)";
    case "desert": return "linear-gradient(135deg, #e8c87a, #c4956a)";
    case "japanese garden": return "linear-gradient(135deg, #d4a5b0, #8fb89a)";
    default: return "linear-gradient(135deg, rgba(212,169,199,0.3), rgba(155,142,196,0.2))";
  }
}
