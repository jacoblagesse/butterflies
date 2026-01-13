import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./spirit-butterfly.css"; // shared stylesheet

import LogoUrl from "../assets/logos/logo.svg";
import DaisiesBackground from "../assets/backgrounds/daisies.png";

export default function Landing() {
  useEffect(() => {
    const container = document.getElementById("butterflies");
    if (!container) return;
    container.innerHTML = "";
    const make = (x, y, dx, delay, dur) => {
      const el = document.createElement("div");
      el.className = "butterfly";
      el.style.setProperty("--x", x + "px");
      el.style.setProperty("--y", y + "px");
      el.style.setProperty("--dx", dx + "px");
      el.style.setProperty("--delay", delay + "ms");
      el.style.setProperty("--dur", dur + "ms");
      el.innerHTML = `
        <svg width="44" height="44" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5c1.6 0 2.6.3 3.6 1.3S17 8.4 17 10c-1.3-.3-2.3-.7-3.6-1.9C12.5 7 12 6 12 5Z" fill="#6c62ff"/>
          <path d="M12 5c-1.6 0-2.6.3-3.6 1.3S7 8.4 7 10c1.3-.3 2.3-.7 3.6-1.9C11.5 7 12 6 12 5Z" fill="#6ec3ff"/>
          <circle cx="12" cy="12" r="1" fill="#2f3a4c"/>
        </svg>`;
      container.appendChild(el);
    };
    for (let i = 0; i < 16; i++) {
      make(
        Math.random() * 520 + 40,
        Math.random() * 340 + 180,
        Math.random() * 180 - 90,
        Math.random() * 2400,
        9000 + Math.random() * 6000
      );
    }
  }, []);

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
        <header>
          <Link className="brand" to="/">
            <img src={LogoUrl} alt="Butterfly Memorial logo" className="logo" />
          </Link>
          <nav>
          </nav>
        </header>

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
              minHeight: "340px",
              padding: "0",
              maxWidth: "640px",
              width: "100%",
            }}
          >
            <h2 style={{ marginBottom: "2.5rem", fontSize: "2.4rem", textAlign: "center" }}>
              Butterfly Memorial Garden
            </h2>
            <div style={{ display: "flex", justifyContent: "center", width: "100%", flexDirection: "column", alignItems: "center" }}>
              <Link
                className="btn primary"
                to="/create"
                style={{
                  textAlign: "center",
                  minWidth: "260px",
                  fontSize: "1.25rem",
                  padding: "1rem 2.5rem",
                  borderRadius: "2rem",
                }}
              >
                Create a Garden!
              </Link>
              <button
                type="button"
                style={{
                  marginTop: "1rem",
                  textAlign: "center",
                  minWidth: "260px",
                  fontSize: "1.1rem",
                  padding: "0.85rem 2rem",
                  borderRadius: "2rem",
                  backgroundColor: "#ffffff",
                  border: "2px solid #2e7d32",
                  color: "#2e7d32",
                  cursor: "default",
                }}
              >
                Visit a Garden
              </button>
            </div>
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
              Together, we’ll honor their spirit with heartfelt tributes in a tranquil space.
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
