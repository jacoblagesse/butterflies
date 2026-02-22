import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuthPopup from "../components/AuthPopup";
import VideoBackground from "../components/VideoBackground";
import FlyingButterfly from "../components/FlyingButterfly";
import { useButterflyPhysics } from "../hooks/useButterflyPhysics";
import { useAuth } from "../contexts/AuthContext";
import "./spirit-butterfly.css";

import { db } from "../firebase";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";

import LogoUrl from "../assets/logos/logo.svg";

const AMBIENT_BUTTERFLIES = [
  { id: "amb-1", gifter: "", message: "", color: "blue" },
  { id: "amb-2", gifter: "", message: "", color: "pink" },
  { id: "amb-3", gifter: "", message: "", color: "purple" },
  { id: "amb-4", gifter: "", message: "", color: "orange" },
];

const BACKGROUNDS = [
  { key: "mountain", label: "Mountain" },
  { key: "tropical", label: "Tropical" },
  { key: "lake", label: "Lake" },
];

export default function Creation() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState("forward");
  const [isAuthOpen, setAuthOpen] = useState(false);

  const [theme, setTheme] = useState({ key: "mountain" });
  const [form, setForm] = useState({ firstName: "", lastName: "", dates: "", message: "", obitUrl: "" });
  const [currentHonoree, setCurrentHonoree] = useState("");

  const prevRef = useRef(null);
  const stageRef = useRef(null);
  const butterflyStates = useButterflyPhysics(AMBIENT_BUTTERFLIES, stageRef);
  useEffect(() => {
    if (step !== 4) return;

    const el = prevRef.current;
    if (!el) return;
    el.innerHTML = "";

    const add = (x, y, dx, delay, dur) => {
      const d = document.createElement("div");
      d.className = "butterfly";
      d.style.setProperty("--x", x + "px");
      d.style.setProperty("--y", y + "px");
      d.style.setProperty("--dx", dx + "px");
      d.style.setProperty("--delay", delay + "ms");
      d.style.setProperty("--dur", dur + "ms");
      d.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 5c1.6 0 2.6.3 3.6 1.3S17 8.4 17 10c-1.3-.3-2.3-.7-3.6-1.9C12.5 7 12 6 12 5Z" fill="#6c62ff"/><path d="M12 5c-1.6 0-2.6.3-3.6 1.3S7 8.4 7 10c1.3-.3 2.3-.7 3.6-1.9C11.5 7 12 6 12 5Z" fill="#6ec3ff"/><circle cx="12" cy="12" r="1" fill="#2f3a4c"/></svg>`;
      el.appendChild(d);
    };
    for (let i = 0; i < 14; i++) {
      add(
        40 + Math.random() * 420,
        160 + Math.random() * 240,
        -70 + Math.random() * 140,
        Math.random() * 2200,
        9000 + Math.random() * 5000
      );
    }
  }, [step]);

  const next = () => {
    setDir("forward");
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => {
    setDir("back");
    setStep((s) => Math.max(1, s - 1));
  };

  // Firebase methods
  const createGarden = async () => {
    if (!user) {
      throw new Error("User must be logged in to create a garden");
    }
    const honoreeRef = doc(db, "honoree", currentHonoree);
    const userRef = doc(db, "users", user.uid);
    const docRef = await addDoc(collection(db, "gardens"), {
      name: "Test Garden",
      user: userRef,
      style: theme.key,
      honoree: honoreeRef,
      created: new Date(),
    });
    console.log("Garden created:", docRef.id);
    return docRef.id;
  };

  const createGardenHandler = async () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    const gardenId = await createGarden();
    console.log(gardenId);

    navigate(`/garden/${gardenId}`);
  };

  const createHonoree = async () => {
    const docRef = await addDoc(collection(db, "honoree"), {
      first_name: form.firstName,
      last_name: form.lastName,
      dates: form.dates,
      obit: form.message,
      obituary_url: form.obitUrl,
      created: new Date(),
    });
    console.log("Garden created:", docRef.id);
    return docRef.id;
  };

  const createHonoreeHandler = async () => {
    const honoreeId = await createHonoree();

    setCurrentHonoree(honoreeId);
    next();
  };

  return (
    <div className="page full-page" style={{ position: "relative", height: "100vh" }}>
      <VideoBackground backgroundKey={theme.key} />

      {/* Ambient butterfly layer */}
      <div
        ref={stageRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
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

      <div
        className="wrap full-wrap"
        style={{
          // Flex column: header, content, footer within viewport
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 2,
        }}
      >
        <AuthPopup isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
        <Header onSignInClick={() => setAuthOpen(true)} />

        <section
          className="hero"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            placeItems: "center",
            padding: "24px",
            // Consume remaining space between header and footer
            flex: 1,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >          <div
            className="hero-card"
            style={{
              width: "min(720px, 100%)",
              // Prevent growth; scroll inside when needed
              maxHeight: "100%",
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 16 }}>
              <span className="eyebrow">Step {step} of 4</span>
            </div>

            <div className="step-viewport" style={{ marginTop: 16 }}>
              {step === 1 && (
                <div className={`step-panel ${dir === "forward" ? "slide-forward" : "slide-back"}`}>
                  <h2 className="h2">Pick a garden</h2>
                  <p className="sub">Choose a style. You can change it later.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {BACKGROUNDS.map((t) => (
                      <button
                        key={t.key}
                        className={`theme-tile ${theme.key === t.key ? "active" : ""}`}
                        onClick={() => setTheme({ key: t.key })}
                      >
                        <div className={`theme-preview theme-${t.key}`} />
                        <div style={{ marginTop: 8, fontWeight: 700 }}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="cta-row" style={{ justifyContent: "flex-end" }}>
                    <button className="btn primary" onClick={next}>
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={`step-panel ${dir === "forward" ? "slide-forward" : "slide-back"}`}>
                  <h2 className="h2">Loved one’s details</h2>
                  <p className="sub">A few basics to personalize the page.</p>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input
                        className="in"
                        placeholder="First name"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      />
                      <input
                        className="in"
                        placeholder="Last name"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                    <input
                      className="in"
                      placeholder="Dates (e.g., 1950–2024)"
                      value={form.dates}
                      onChange={(e) => setForm({ ...form, dates: e.target.value })}
                    />
                    <input
                      className="in"
                      placeholder="Short dedication"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                    <input
                      className="in"
                      placeholder="Obituary URL (optional)"
                      value={form.obitUrl}
                      onChange={(e) => setForm({ ...form, obitUrl: e.target.value })}
                    />
                  </div>
                  <div className="cta-row" style={{ justifyContent: "space-between" }}>
                    <button className="btn ghost" onClick={back}>
                      Back
                    </button>
                    <button className="btn primary" onClick={createHonoreeHandler}>
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/*This is actually step four*/}
              {step === 3 && (
                <div className={`step-panel ${dir === "forward" ? "slide-forward" : "slide-back"}`}>
                  <h2 className="h2">Preview</h2>
                  <div className={`right theme-${theme.key}`} style={{ minHeight: 200 }} aria-hidden="true">
                    <div className="garden">
                      <div className="hill" />
                      <div id="preview-butterflies" ref={prevRef} />
                      <div
                        style={{
                          position: "absolute",
                          top: 16,
                          left: 16,
                          right: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div className="h3" style={{ margin: 0 }}>
                            {form.firstName || "First"} {form.lastName || "Last"}
                          </div>
                          <div className="sub">{form.dates || "—"}</div>
                        </div>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          left: 16,
                          right: 16,
                          bottom: 16,
                          background: "#ffffffcc",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <div className="sub">{form.message || "A few words about your loved one…"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="cta-row" style={{ justifyContent: "space-between" }}>
                    <button className="btn ghost" onClick={back}>
                      Back
                    </button>
                    <button className="btn primary" onClick={createGardenHandler}>
                      Open Garden
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
