import React from "react";
import keyboard from "../assets/keyboard.webp";

/* ─── inline styles as constants to keep JSX clean ─── */
const PAGE = {
  minHeight: "100vh",
  background: "#0a0e1a",
  fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  color: "#e8eaf0",
  padding: "0 0 60px 0",
  position: "relative",
  overflow: "hidden",
};

/* decorative background grid lines */
const BG_GRID = {
  position: "fixed",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px)," +
    "linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  pointerEvents: "none",
  zIndex: 0,
};

const BG_GLOW_1 = {
  position: "fixed",
  top: "-120px",
  left: "-120px",
  width: "500px",
  height: "500px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)",
  pointerEvents: "none",
  zIndex: 0,
};

const BG_GLOW_2 = {
  position: "fixed",
  bottom: "-100px",
  right: "-100px",
  width: "450px",
  height: "450px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
  pointerEvents: "none",
  zIndex: 0,
};

const CONTENT = {
  position: "relative",
  zIndex: 1,
  maxWidth: "860px",
  margin: "0 auto",
  padding: "0 20px",
};

/* ── HERO HEADER ── */
const HERO = {
  padding: "48px 0 0",
  textAlign: "center",
  marginBottom: "8px",
};

const HERO_BADGE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(34,211,238,0.08)",
  border: "1px solid rgba(34,211,238,0.25)",
  borderRadius: "999px",
  padding: "6px 16px",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#22d3ee",
  marginBottom: "20px",
};

const HERO_TITLE = {
  fontSize: "clamp(28px, 5vw, 46px)",
  fontWeight: 800,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  margin: "0 0 14px",
  background: "linear-gradient(135deg, #e0f2fe 0%, #22d3ee 50%, #818cf8 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const HERO_SUB = {
  fontSize: "15px",
  color: "#94a3b8",
  maxWidth: "480px",
  margin: "0 auto 36px",
  lineHeight: 1.6,
};

/* ── KEYBOARD SECTION ── */
const KB_CARD = {
  position: "relative",
  borderRadius: "20px",
  overflow: "hidden",
  border: "1px solid rgba(34,211,238,0.18)",
  background: "linear-gradient(160deg, #0f172a 0%, #0c1628 100%)",
  marginBottom: "36px",
  boxShadow: "0 0 60px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.5)",
};

const KB_HEADER = {
  padding: "20px 24px 16px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const KB_TITLE = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#94a3b8",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const KB_DOTS = {
  display: "flex",
  gap: "6px",
  marginRight: "auto",
};

const DOT = (color) => ({
  width: 10, height: 10, borderRadius: "50%", background: color,
});

const KB_IMG_WRAP = {
  padding: "24px 32px 28px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "16px",
};

const KB_IMG = {
  width: "100%",
  maxWidth: "680px",
  borderRadius: "12px",
  display: "block",
  filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.6))",
};

const KB_HINT = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(34,211,238,0.08)",
  border: "1px solid rgba(34,211,238,0.2)",
  borderRadius: "999px",
  padding: "6px 16px",
  fontSize: "12px",
  color: "#7dd3fc",
};

/* ── WARNING BANNER ── */
const WARN = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  background: "rgba(251,191,36,0.07)",
  border: "1px solid rgba(251,191,36,0.28)",
  borderRadius: "14px",
  padding: "16px 20px",
  marginBottom: "28px",
  fontSize: "13.5px",
  color: "#fde68a",
  lineHeight: 1.55,
};

/* ── RULES GRID ── */
const GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const CARD = (accent) => ({
  background: "linear-gradient(145deg, #0f172a, #111827)",
  border: `1px solid ${accent}30`,
  borderRadius: "16px",
  padding: "22px",
  position: "relative",
  overflow: "hidden",
  transition: "transform 0.2s, box-shadow 0.2s",
});

const CARD_ACCENT_LINE = (accent) => ({
  position: "absolute",
  top: 0, left: 0, right: 0,
  height: "2px",
  background: `linear-gradient(90deg, ${accent}, transparent)`,
  borderRadius: "16px 16px 0 0",
});

const CARD_ICON_WRAP = (accent) => ({
  width: 40, height: 40,
  borderRadius: "10px",
  background: `${accent}18`,
  border: `1px solid ${accent}40`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "14px",
  fontSize: "18px",
});

const CARD_TITLE = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#e2e8f0",
  marginBottom: "12px",
  letterSpacing: "0.01em",
};

const ITEM = (accent) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: 1.55,
  marginBottom: "8px",
});

const BULLET = (accent) => ({
  width: 6, height: 6,
  borderRadius: "50%",
  background: accent,
  marginTop: "6px",
  flexShrink: 0,
  boxShadow: `0 0 6px ${accent}`,
});

/* ── SECTION LABEL ── */
const SEC_LABEL = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#475569",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const SEC_LINE = {
  flex: 1,
  height: "1px",
  background: "rgba(255,255,255,0.06)",
};

/* ── DATA ── */
const RULES = [
  {
    icon: "⌨️",
    title: "General rules",
    accent: "#22d3ee",
    items: [
      "Keep both hands on the keyboard at all times",
      "Do not look at the keyboard while typing",
      "Use proper finger placement as shown above",
    ],
  },
  {
    icon: "🚫",
    title: "Restrictions",
    accent: "#f87171",
    items: [
      "Copy-paste is not allowed",
      "Drag & drop is disabled",
      "Do not switch tabs during the exam",
      "Camera checking is enabled",
      "Multi-face detection is enabled",
    ],
  },
  {
    icon: "⏱️",
    title: "Exam rules",
    accent: "#fbbf24",
    items: [
      "Each exam has a fixed time limit",
      "Exam auto-submits when time ends",
      "You can attempt the exam only once",
    ],
  },
  {
    icon: "🎯",
    title: "Tips for success",
    accent: "#34d399",
    items: [
      "Focus on accuracy first, speed follows",
      "Maintain a steady consistent rhythm",
      "Use all fingers — avoid two-finger typing",
    ],
  },
];

/* ── COMPONENT ── */
export default function Instructions() {
  return (
    <div style={PAGE}>
      {/* Background layers */}
      <div style={BG_GRID} />
      <div style={BG_GLOW_1} />
      <div style={BG_GLOW_2} />

      <div style={CONTENT}>

        {/* Hero */}
        <div style={HERO}>
          <div style={HERO_BADGE}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Exam Instructions
          </div>
          <h1 style={HERO_TITLE}>Typing Exam Guidelines</h1>
          <p style={HERO_SUB}>
            Follow these rules carefully to ensure a smooth, fair exam experience.
            Violations may result in disqualification.
          </p>
        </div>

        {/* Keyboard image card */}
        <div style={SEC_LABEL}>
          <span>Finger Placement</span>
          <div style={SEC_LINE} />
        </div>

        <div style={KB_CARD}>
          {/* macOS-style top bar */}
          <div style={KB_HEADER}>
            <div style={KB_DOTS}>
              <div style={DOT("#ef4444")} />
              <div style={DOT("#fbbf24")} />
              <div style={DOT("#22c55e")} />
            </div>
            <span style={KB_TITLE}>⌨️ &nbsp; Finger Placement Guide</span>
          </div>

          <div style={KB_IMG_WRAP}>
            <img
              src={keyboard}
              alt="Keyboard finger placement — both hands on home row"
              style={KB_IMG}
            />
            <div style={KB_HINT}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M12 8v4m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              Green keys show the <strong style={{ color: "#22d3ee", fontWeight: 600 }}>&nbsp;home row&nbsp;</strong> — A S D F &nbsp;|&nbsp; J K L ; — your fingers rest here by default
            </div>
          </div>
        </div>

        {/* Warning */}
        <div style={WARN}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
          </svg>
          <span>
            <strong style={{ color: "#fde68a" }}>Important: </strong>
            Violation of any rule below — including tab switching, copy-paste, or improper camera usage —
            may result in automatic disqualification of your exam attempt. There are no retakes.
          </span>
        </div>

        {/* Rules grid */}
        <div style={SEC_LABEL}>
          <span>Rules &amp; Guidelines</span>
          <div style={SEC_LINE} />
        </div>

        <div style={GRID}>
          {RULES.map(({ icon, title, accent, items }) => (
            <div key={title} style={CARD(accent)}>
              <div style={CARD_ACCENT_LINE(accent)} />
              <div style={CARD_ICON_WRAP(accent)}>{icon}</div>
              <div style={CARD_TITLE}>{title}</div>
              {items.map((item) => (
                <div key={item} style={ITEM(accent)}>
                  <span style={BULLET(accent)} />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: "40px", fontSize: "12px", color: "#334155" }}>
          Read all instructions thoroughly before beginning · Good luck!
        </div>

      </div>
    </div>
  );
}
