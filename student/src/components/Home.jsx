import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
const FEATURES = [
  {
    icon: "⌨️",
    title: "English Typing",
    desc: "Master QWERTY with speed drills, accuracy tracking, and 10 progressive levels.",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.25)",
  },
  {
    icon: "अ",
    title: "Hindi Typing",
    desc: "Practice Devanagari with InScript (Mangal) keyboard layout — live visual guide included.",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
  },
  {
    icon: "📝",
    title: "Typing Exams",
    desc: "Attempt official timed exams. Scoring: 2 pts/word. Pass at >50%. Results published by admin.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
  },
  {
    icon: "📷",
    title: "Camera Proctoring",
    desc: "Exam integrity ensured via webcam monitoring — fair assessment for every student.",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.25)",
  },
  {
    icon: "📊",
    title: "Results & Analytics",
    desc: "Track WPM, accuracy, scores, pass/fail history. Personal bests highlighted.",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.25)",
  },
  {
    icon: "💬",
    title: "Message Admin",
    desc: "Send requests or queries directly to your instructor from your student dashboard.",
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.25)",
  },
];
const STATS = [
  { value: "10+", label: "Typing Levels" },
  { value: "2", label: "Languages" },
  { value: "100%", label: "Live Scoring" },
  { value: "∞", label: "Practice Sessions" },
];
const NAV_LINKS = ["Features", "How It Works", "Instructions", "Login"];
function useTypingEffect(words, speed = 80, pause = 1600) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx];
    let timeout;
    if (!deleting && charIdx < word.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === word.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    }
    setDisplay(word.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return display;
}
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const typedText = useTypingEffect([
    "Speed.",
    "Accuracy.",
    "Confidence.",
    "Excellence.",
  ]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={styles.root}>
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <span style={styles.logoDot}>⚡</span>
            <span style={styles.logoText}>TypingPortal</span>
            <span style={styles.logoVersion}>v1.0</span>
          </div>
          <div style={styles.navLinks}>
            {NAV_LINKS.slice(0, -1).map((l) => (
              <Link key={l} to={`#${l.toLowerCase().replace(" ", "-")}`} style={styles.navLink}>
                {l}
              </Link>
            ))}
            <Link to="/login" style={styles.loginBtn}>
              Login → / Register
            </Link>
          </div>
          <button style={styles.hamburger} onClick={() => setMenuOpen((v) => !v)}>
            <span style={styles.hamBar} />
            <span style={styles.hamBar} />
            <span style={styles.hamBar} />
          </button>
        </div>
        {menuOpen && (
          <div style={styles.mobileMenu}>
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                to={l === "Login" ? "/Login" : `#${l.toLowerCase()}`}
                style={styles.mobileLink}
                onClick={() => setMenuOpen(false)}
              >
                {l}
              </a>
            ))}
          </div>
        )}
      </nav>
      <section ref={heroRef} style={styles.hero}>
        <div style={styles.heroBgImage} />
        <div style={styles.heroOverlay} />
        <div style={styles.floatingKeys} aria-hidden="true">
          {["Q","W","E","R","T","Y","A","S","D","F","क","ख","ग","घ"].map((k, i) => (
            <span key={i} style={{ ...styles.floatingKey, animationDelay: `${i * 0.4}s`, top: `${10 + (i % 5) * 18}%`, left: `${5 + (i % 7) * 13}%` }}>
              {k}
            </span>
          ))}

        </div>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>🎓 Student Typing Portal</div>
          <h1 style={styles.heroTitle}>
            Type with
            <br />
            <span style={styles.heroAccent}>{typedText}</span>
            <span style={styles.cursor}>|</span>
          </h1>
          <p style={styles.heroSub}>
            Practice English & Hindi typing, take proctored exams, track your
            scores — all in one place. Trusted by students preparing for
            government & competitive typing tests.
          </p>
          <div style={styles.heroCtas}>
            <Link to="/login" style={styles.ctaPrimary}>
              ⚡ Get Started Free
            </Link>
            <Link to="#features" style={styles.ctaSecondary}>
              Explore Features ↓
            </Link>
          </div>
          <div style={styles.heroStats}>
            {STATS.map((s) => (
              <div key={s.label} style={styles.heroStat}>
                <span style={styles.heroStatVal}>{s.value}</span>
                <span style={styles.heroStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.heroCard}>
          <div style={styles.heroCardHeader}>
            <span style={styles.dot1} /><span style={styles.dot2} /><span style={styles.dot3} />
            <span style={styles.heroCardTitle}>Live Practice</span>
          </div>
          <div style={styles.heroCardBody}>
            <div style={styles.heroCardText}>
              क ख ग घ ङ च छ ज झ ञ
            </div>
            <div style={styles.heroCardInput}>यहाँ टाइप करें...</div>
            <div style={styles.heroCardMeta}>
              <span style={styles.metaChip}>🔤 Hindi</span>
              <span style={styles.metaChip}>Level 1/10</span>
              <span style={{ ...styles.metaChip, color: "#34d399" }}>● LIVE</span>
            </div>
          </div>
        </div>
      </section>
      <section id="features" style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionLabel}>EVERYTHING YOU NEED</p>
          <h2 style={styles.sectionTitle}>Built for Typing Excellence</h2>
          <p style={styles.sectionSub}>
            From daily practice to official exams — the complete typing platform.
          </p>
          <div style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  ...styles.featureCard,
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                }}
              >
                <div style={{ ...styles.featureIcon, color: f.color }}>{f.icon}</div>
                <h3 style={{ ...styles.featureTitle, color: f.color }}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" style={styles.howSection}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionLabel}>SIMPLE STEPS</p>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.stepsRow}>
            {[
              { n: "01", t: "Login", d: "Create your student account and log in to your personal dashboard." },
              { n: "02", t: "Practice Daily", d: "Choose English or Hindi. Type passages across 10 levels. Beat your best score." },
              { n: "03", t: "Take Exams", d: "Attempt scheduled exams with webcam proctoring. Submit within the timer." },
              { n: "04", t: "View Results", d: "Admin publishes results. Check your WPM, accuracy, and pass/fail status." },
            ].map((s, i) => (
              <div key={s.n} style={styles.step}>
                <div style={styles.stepNum}>{s.n}</div>
                {i < 3 && <div style={styles.stepLine} />}
                <h4 style={styles.stepTitle}>{s.t}</h4>
                <p style={styles.stepDesc}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="instructions" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.instructionBox}>
            <div style={styles.instrLeft}>
              <p style={styles.sectionLabel}>BEFORE YOU START</p>
              <h2 style={{ ...styles.sectionTitle, textAlign: "left", marginBottom: 16 }}>
                Exam Instructions
              </h2>
              <ul style={styles.instrList}>
                {[
                  "Stable internet connection required throughout the exam",
                  "Allow camera access — webcam monitoring is mandatory",
                  "Do not switch tabs or minimize the browser window",
                  "Scoring: 2 points per correctly typed word",
                  "Pass criteria: score > 50% of total possible points",
                  "Results are published by admin after review",
                ].map((item) => (
                  <li key={item} style={styles.instrItem}>
                    <span style={styles.instrCheck}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={styles.instrRight}>
              <div style={styles.instrScoreCard}>
                <div style={styles.instrScoreTitle}>Scoring Formula</div>
                <div style={styles.formula}>
                  <span style={styles.formulaVal}>Score</span>
                  <span style={styles.formulaEq}>=</span>
                  <span style={styles.formulaVal}>Words × 2</span>
                </div>
                <div style={styles.instrPassLine}>Pass if Score &gt; 50% of Total</div>
                <div style={styles.instrExample}>
                  Example: 100-word passage<br />
                  Max = 200 pts → Pass ≥ 100 pts
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section style={styles.ctaBanner}>
        <div style={styles.ctaBannerBg} />
        <div style={styles.ctaBannerContent}>
          <h2 style={styles.ctaBannerTitle}>Ready to start your typing journey?</h2>
          <p style={styles.ctaBannerSub}>
            Practice English and Hindi typing online or download the official Windows application for a faster and smoother experience.
          </p>
          <div style={styles.ctaButtonGroup}>
            <Link to="/login" style={styles.ctaPrimary}>
              Login to Student Panel →
            </Link>

            <a
              href="https://github.com/kuldeepmishraoo7b-cmyk/Typing-Portal/releases/download/v1.0.0/Typing.Student.Setup.1.0.0.exe"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.downloadBtn}
            >
              ⬇ Download for Windows
            </a>
          </div>
        </div>
      </section>
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLogo}>
            <span>⚡</span> TypingPortal
          </div>
          <p style={styles.footerText}>
            v1.0 · Typing Portal · Built for students
          </p>
          <div style={styles.footerLinks}>
            <Link to="/login" style={styles.footerLink}>Login</Link>
            <Link to="#features" style={styles.footerLink}>Features</Link>
            <Link to="#instructions" style={styles.footerLink}>Instructions</Link>
          </div>
        </div>
      </footer>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
          50% { transform: translateY(-18px) rotate(8deg); opacity: 0.22; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
const styles = {
  root: {
    background: "#0a0d1a",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    overflowX: "hidden",
  },
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    transition: "background 0.3s, boxShadow 0.3s",
    padding: "0 0",
  },
  navScrolled: {
    background: "rgba(10,13,26,0.95)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.06)",
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "18px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoDot: { fontSize: 22 },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  logoVersion: {
    fontSize: 10,
    color: "#38bdf8",
    border: "1px solid rgba(56,189,248,0.3)",
    borderRadius: 4,
    padding: "1px 5px",
    marginLeft: 4,
  },
  navLinks: { display: "flex", alignItems: "center", gap: 32 },
  navLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  loginBtn: {
    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
    color: "#fff",
    textDecoration: "none",
    padding: "9px 22px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "0.2px",
    transition: "opacity 0.2s",
  },
  hamburger: {
    display: "none",
    flexDirection: "column",
    gap: 5,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
  },
  hamBar: {
    display: "block",
    width: 22,
    height: 2,
    background: "#e2e8f0",
    borderRadius: 2,
  },
  mobileMenu: {
    background: "rgba(10,13,26,0.97)",
    padding: "16px 32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  mobileLink: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 500,
  },
  hero: {
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    alignItems: "center",
    padding: "120px 32px 80px",
    maxWidth: "100%",
    overflow: "hidden",
  },
  heroBgImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/images/hero-keyboard.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center right",
    opacity: 0.18,
    zIndex: 0,
    background: "radial-gradient(ellipse at 80% 40%, #1e3a5f 0%, #0a0d1a 60%)",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to right, #0a0d1a 40%, rgba(10,13,26,0.6) 70%, rgba(10,13,26,0.3) 100%)",
    zIndex: 1,
  },
  floatingKeys: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
  },
  floatingKey: {
    position: "absolute",
    fontFamily: "'Syne', sans-serif",
    fontSize: 28,
    fontWeight: 800,
    color: "#38bdf8",
    opacity: 0.12,
    animation: "float 4s ease-in-out infinite",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: 560,
    animation: "fadeUp 0.9s ease both",
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(56,189,248,0.12)",
    border: "1px solid rgba(56,189,248,0.3)",
    color: "#38bdf8",
    padding: "6px 14px",
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.5px",
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(44px, 7vw, 72px)",
    fontWeight: 800,
    lineHeight: 1.08,
    color: "#fff",
    marginBottom: 16,
    letterSpacing: "-1px",
  },
  heroAccent: {
    background: "linear-gradient(90deg, #38bdf8, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  cursor: {
    color: "#38bdf8",
    animation: "blink 0.9s step-end infinite",
    WebkitTextFillColor: "#38bdf8",
  },
  heroSub: {
    fontSize: 16,
    color: "#94a3b8",
    lineHeight: 1.7,
    marginBottom: 32,
    maxWidth: 460,
  },
  heroCtas: { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 40 },
  ctaPrimary: {
    background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
    color: "#fff",
    textDecoration: "none",
    padding: "13px 28px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "0.2px",
    display: "inline-block",
    transition: "transform 0.2s, opacity 0.2s",
  },
  ctaSecondary: {
    color: "#94a3b8",
    textDecoration: "none",
    padding: "13px 24px",
    borderRadius: 10,
    fontWeight: 500,
    fontSize: 15,
    border: "1px solid rgba(148,163,184,0.2)",
    display: "inline-block",
    transition: "color 0.2s, border-color 0.2s",
  },
  heroStats: {
    display: "flex",
    gap: 28,
    flexWrap: "wrap",
  },
  heroStat: { display: "flex", flexDirection: "column", gap: 2 },
  heroStatVal: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1,
  },
  heroStatLabel: { fontSize: 11, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" },
  heroCard: {
    position: "absolute",
    right: "8%",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    background: "rgba(15,20,40,0.85)",
    border: "1px solid rgba(56,189,248,0.18)",
    borderRadius: 16,
    overflow: "hidden",
    width: 300,
    backdropFilter: "blur(16px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
    animation: "fadeUp 1.1s 0.2s ease both",
  },
  heroCardHeader: {
    background: "rgba(56,189,248,0.07)",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderBottom: "1px solid rgba(56,189,248,0.1)",
  },
  dot1: { width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" },
  dot2: { width: 10, height: 10, borderRadius: "50%", background: "#facc15", display: "inline-block" },
  dot3: { width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" },
  heroCardTitle: { fontSize: 12, color: "#64748b", marginLeft: 6, fontWeight: 500 },
  heroCardBody: { padding: 18 },
  heroCardText: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 20,
    color: "#e2e8f0",
    letterSpacing: 4,
    marginBottom: 10,
    fontFamily: "'DM Sans', sans-serif",
  },
  heroCardInput: {
    background: "rgba(56,189,248,0.06)",
    border: "1px solid rgba(56,189,248,0.2)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#475569",
    marginBottom: 14,
  },
  heroCardMeta: { display: "flex", gap: 8, flexWrap: "wrap" },
  metaChip: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 100,
    padding: "4px 10px",
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 500,
  },
  section: { padding: "88px 32px" },
  howSection: {
    padding: "88px 32px",
    background: "rgba(255,255,255,0.02)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  sectionInner: { maxWidth: 1100, margin: "0 auto" },
  sectionLabel: {
    fontSize: 11,
    color: "#38bdf8",
    letterSpacing: "2px",
    fontWeight: 700,
    marginBottom: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: 800,
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: "-0.5px",
  },
  sectionSub: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 52,
    maxWidth: 520,
    margin: "0 auto 52px",
    lineHeight: 1.6,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginTop: 48,
  },
  featureCard: {
    borderRadius: 14,
    padding: "28px 24px",
    transition: "transform 0.2s",
  },
  featureIcon: { fontSize: 32, marginBottom: 14, display: "block" },
  featureTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 17,
    marginBottom: 8,
  },
  featureDesc: { fontSize: 14, color: "#64748b", lineHeight: 1.65 },
  stepsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 0,
    marginTop: 48,
    position: "relative",
  },
  step: { padding: "0 24px 0 0", position: "relative" },
  stepNum: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 42,
    fontWeight: 800,
    color: "rgba(56,189,248,0.15)",
    lineHeight: 1,
    marginBottom: 8,
  },
  stepLine: {
    position: "absolute",
    top: 20,
    right: 0,
    width: 1,
    height: 50,
    background: "rgba(56,189,248,0.15)",
  },
  stepTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#e2e8f0",
    marginBottom: 8,
  },
  stepDesc: { fontSize: 13, color: "#64748b", lineHeight: 1.6 },
  instructionBox: {
    display: "flex",
    gap: 48,
    alignItems: "flex-start",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "48px",
  },
  instrLeft: { flex: "1 1 340px" },
  instrRight: { flex: "0 0 260px" },
  instrList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginTop: 8 },
  instrItem: { fontSize: 14, color: "#94a3b8", lineHeight: 1.5, display: "flex", gap: 8 },
  instrCheck: { color: "#34d399", fontWeight: 700, flexShrink: 0 },
  instrScoreCard: {
    background: "linear-gradient(135deg, rgba(56,189,248,0.1), rgba(167,139,250,0.08))",
    border: "1px solid rgba(56,189,248,0.2)",
    borderRadius: 14,
    padding: "28px 24px",
    textAlign: "center",
  },
  instrScoreTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: "#38bdf8",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: 20,
  },
  formula: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  formulaVal: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#e2e8f0",
    background: "rgba(255,255,255,0.05)",
    padding: "6px 12px",
    borderRadius: 6,
  },
  formulaEq: { color: "#64748b", fontSize: 18 },
  instrPassLine: { fontSize: 13, color: "#a78bfa", fontWeight: 600, marginBottom: 12 },
  instrExample: { fontSize: 12, color: "#475569", lineHeight: 1.6 },
  ctaBanner: {
    position: "relative",
    padding: "88px 32px",
    textAlign: "center",
    overflow: "hidden",
  },
  ctaBannerBg: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at center, rgba(56,189,248,0.12) 0%, rgba(10,13,26,0) 70%)",
    zIndex: 0,
  },
  ctaBannerContent: { position: "relative", zIndex: 1 },
  ctaBannerTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 800,
    color: "#fff",
    marginBottom: 12,
    letterSpacing: "-0.5px",
  },
  ctaBannerSub: { fontSize: 15, color: "#64748b", marginBottom: 32, lineHeight: 1.6 },
  ctaButtonGroup: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  downloadBtn: {
    background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    color: "#fff",
    textDecoration: "none",
    padding: "13px 28px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "0.2px",
    display: "inline-block",
    boxShadow: "0 8px 25px rgba(245,158,11,.35)",
    transition: "transform 0.2s, opacity 0.2s",
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    padding: "32px",
  },
  footerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  footerLogo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  footerText: { fontSize: 12, color: "#475569" },
  footerLinks: { display: "flex", gap: 20 },
  footerLink: { fontSize: 13, color: "#64748b", textDecoration: "none" },
};
