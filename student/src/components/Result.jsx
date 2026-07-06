import React, { useState, useEffect } from "react";
import axios from "axios";
const API = "http://localhost:5000";
// ── Scoring helpers (match AdminExamResults) ───────────────────────────────
const getTotalPossible = (r) => {
  if (r.total_possible_points && r.total_possible_points > 0) return r.total_possible_points;
  if (r.total_words && r.total_words > 0) return r.total_words * 2;
  if (r.typed_pct && r.typed_words) {
    const total = Math.round((r.typed_words * 100) / r.typed_pct);
    if (total > 0) return total * 2;
  }
  return null;
};
const getTotalWords = (r) => {
  if (r.total_words && r.total_words > 0) return r.total_words;
  if (r.total_possible_points && r.total_possible_points > 0) return Math.round(r.total_possible_points / 2);
  return null;
};
const getPercent = (r) => {
  const total = getTotalPossible(r);
  if (!total) return null;
  return Math.round(((r.points || 0) / total) * 100);
};
const isPass = (r) => {
  const pct = getPercent(r);
  if (pct === null) return false;
  return pct >= 50;
};
const fmt = (dt) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};
const fmtDate = (dt) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
export default function StudentResults() {
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const student = (() => {
    try { return JSON.parse(localStorage.getItem("studentData")); }
    catch { return null; }
  })();
  const fetchResults = () => {
    if (!student) { setLoading(false); return; }
    setLoading(true);
    axios
      .get(`${API}/api/student-results/${student.id}`)
      .then((res) => {
        // Filter out not_attempted
        const filtered = res.data.filter(r => r.status !== "not_attempted");
        setResults(filtered);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchResults(); }, []);
  // ── Stats ──────────────────────────────────────────────────────────────────
  const total   = results.length;
  const passed  = results.filter(r => isPass(r)).length;
  const failed  = total - passed;
  const avgWpm  = total ? (results.reduce((a, b) => a + (b.wpm || 0), 0) / total).toFixed(1) : "0.0";
  const avgAcc  = total ? (results.reduce((a, b) => a + (b.accuracy || 0), 0) / total).toFixed(1) : "0.0";
  const bestWpm = total ? Math.max(...results.map(r => r.wpm || 0)) : 0;
  if (!student) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#050810", color: "#94a3b8", fontFamily: "system-ui" }}>
        ⚠️ Not logged in. Please log in to see your results.
      </div>
    );
  }
  return (
    <div style={styles.page}>
      {/* ── Background grid ── */}
      <div style={styles.gridBg} />
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>TYPING EXAMINATION PORTAL</div>
          <h1 style={styles.title}>My Results</h1>
          <div style={styles.subtitle}>
            <span style={styles.studentBadge}>
              <span style={styles.avatarDot} />
              {student.username || student.name}
            </span>
            <span style={styles.examCount}>{total} exam{total !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={fetchResults} title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>
      {/* ── Formula bar ── */}
      <div style={styles.formulaBar}>
        <span style={styles.formulaItem}><span style={styles.fLabel}>FORMULA</span> SSC / Railway / CPCT Standard</span>
        <span style={styles.formulaDivider}>|</span>
        <span style={styles.formulaItem}><span style={styles.fLabel}>WPM</span> Gross − (Errors ÷ min)</span>
        <span style={styles.formulaDivider}>|</span>
        <span style={styles.formulaItem}><span style={styles.fLabel}>PASS</span> Score ≥ 50%</span>
        <span style={styles.formulaDivider}>|</span>
        <span style={styles.formulaItem}><span style={styles.fLabel}>POINTS</span> Typed Words × 2</span>
      </div>
      {/* ── Stats grid ── */}
      <div style={styles.statsGrid}>
        {[
          { value: total,        label: "Total Exams",  color: "#60a5fa", icon: "📋" },
          { value: passed,       label: "Passed",        color: "#34d399", icon: "✅" },
          { value: failed,       label: "Failed",        color: "#f87171", icon: "❌" },
          { value: `${avgWpm}`,  label: "Avg Net WPM",  color: "#a78bfa", icon: "⌨️" },
          { value: `${avgAcc}%`, label: "Avg Accuracy", color: "#fbbf24", icon: "🎯" },
          { value: bestWpm,      label: "Best WPM",     color: "#2dd4bf", icon: "🏆" },
        ].map(({ value, label, color, icon }) => (
          <div key={label} style={styles.statCard(color)}>
            <div style={styles.statIcon}>{icon}</div>
            <div style={{ ...styles.statValue, color }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>
      {/* ── Results ── */}
      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.spinner} />
          <p style={{ color: "#475569", fontSize: 13, marginTop: 16 }}>Loading your results…</p>
        </div>
      ) : results.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>No results published yet.</p>
          <p style={{ color: "#334155", fontSize: 12, marginTop: 6 }}>Your results will appear here once the admin publishes them.</p>
        </div>
      ) : (
        <div style={styles.resultsList}>
          {results.map((r, index) => {
            const pct      = getPercent(r);
            const pass     = isPass(r);
            const totalPts = getTotalPossible(r);
            const totalW   = getTotalWords(r);
            const isOpen   = expanded === r.id;
            const auto     = r.status === "auto-submitted";
            const grossWpm = r.gross_wpm;
            const keystrokes = r.total_characters;
            return (
              <div key={r.id} style={styles.card(pass, isOpen)}>
                {/* ── Card header (always visible) ── */}
                <div style={styles.cardHeader} onClick={() => setExpanded(isOpen ? null : r.id)}>
                  {/* Left: rank + name */}
                  <div style={styles.cardLeft}>
                    <div style={styles.rank(pass)}>
                      {pass ? "✓" : index + 1}
                    </div>
                    <div>
                      <div style={styles.cardLang}>
                        {r.language === "Hindi" || r.language === "HI" ? "🇮🇳 Hindi" : `🌐 ${r.language || "English"}`}
                        {auto && <span style={styles.autoBadge}>Auto</span>}
                      </div>
                      <div style={styles.cardDate}>{fmt(r.submitted_at)}</div>
                    </div>
                  </div>
                  {/* Middle: key metrics */}
                  <div style={styles.cardMetrics}>
                    <div style={styles.metric}>
                      <div style={{ ...styles.metricVal, color: "#a78bfa" }}>{r.wpm || 0}</div>
                      <div style={styles.metricLbl}>NET WPM</div>
                    </div>
                    <div style={styles.metricDiv} />
                    <div style={styles.metric}>
                      <div style={{ ...styles.metricVal, color: accClr(r.accuracy || 0) }}>{r.accuracy || 0}%</div>
                      <div style={styles.metricLbl}>ACCURACY</div>
                    </div>
                    <div style={styles.metricDiv} />
                    <div style={styles.metric}>
                      <div style={{ ...styles.metricVal, color: "#60a5fa" }}>
                        {r.points || 0}
                        <span style={{ fontSize: 10, color: "#475569", fontWeight: 400 }}>
                          {totalPts ? `/${totalPts}` : ""}
                        </span>
                      </div>
                      <div style={styles.metricLbl}>POINTS</div>
                    </div>
                  </div>
                  {/* Right: pass/fail badge + chevron */}
                  <div style={styles.cardRight}>
                    {pct !== null ? (
                      <div style={styles.resultBadge(pass)}>
                        <div style={styles.resultPct(pass)}>{pct}%</div>
                        <div style={styles.resultVerdict(pass)}>{pass ? "PASS" : "FAIL"}</div>
                      </div>
                    ) : (
                      <div style={styles.noRefBadge}>N/A</div>
                    )}
                    <div style={{ ...styles.chevron, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▾
                    </div>
                  </div>
                </div>
                {/* ── Expanded detail ── */}
                {isOpen && (
                  <div style={styles.cardDetail}>
                    <div style={styles.detailGrid}>
                      {[
                        { label: "Typed Words",   value: `${r.typed_words || 0} / ${totalW ?? "—"} words` },
                        { label: "Keystrokes",    value: (keystrokes != null && keystrokes !== "") ? keystrokes : "—" },
                        { label: "Net WPM",       value: `${r.wpm || 0} wpm` },
                        { label: "Gross WPM",     value: (grossWpm != null && grossWpm !== "") ? `${grossWpm} wpm` : "—" },
                        { label: "Accuracy",      value: `${r.accuracy || 0}%` },
                        { label: "Errors",        value: `${r.errors || 0} chars` },
                        { label: "Points Earned", value: `${r.points || 0} / ${totalPts ?? "—"}` },
                        { label: "Score",         value: pct !== null ? `${pct}%` : "—" },
                        { label: "Result",        value: pct === null ? "—" : pass ? "✅ Pass" : "❌ Fail", highlight: pass ? "#34d399" : "#f87171" },
                        { label: "Tab Warnings",  value: `${r.warnings || 0} / 3` },
                        { label: "Eye Warnings",  value: `${r.eye_warnings || 0} / 3` },
                        { label: "Status",        value: r.status || "completed" },
                        { label: "Exam Date",     value: r.exam_date ? fmtDate(r.exam_date) : "—" },
                        { label: "Submitted",     value: fmt(r.submitted_at) },
                      ].map(({ label, value, highlight }) => (
                        <div key={label} style={styles.detailRow}>
                          <span style={styles.detailKey}>{label}</span>
                          <span style={{ ...styles.detailVal, color: highlight || "#cbd5e1" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Accuracy bar */}
                    <div style={styles.accuracyBarWrap}>
                      <div style={styles.accuracyBarLabel}>
                        <span style={{ color: "#64748b", fontSize: 10, letterSpacing: 1 }}>ACCURACY</span>
                        <span style={{ color: accClr(r.accuracy || 0), fontWeight: 700, fontSize: 12 }}>{r.accuracy || 0}%</span>
                      </div>
                      <div style={styles.accuracyBarTrack}>
                        <div style={{ ...styles.accuracyBarFill, width: `${r.accuracy || 0}%`, background: accClr(r.accuracy || 0) }} />
                      </div>
                    </div>
                    {/* Score bar */}
                    {pct !== null && (
                      <div style={styles.accuracyBarWrap}>
                        <div style={styles.accuracyBarLabel}>
                          <span style={{ color: "#64748b", fontSize: 10, letterSpacing: 1 }}>SCORE</span>
                          <span style={{ color: pass ? "#34d399" : "#f87171", fontWeight: 700, fontSize: 12 }}>{pct}% — {pass ? "PASS" : "FAIL"}</span>
                        </div>
                        <div style={styles.accuracyBarTrack}>
                          <div style={{ ...styles.accuracyBarFill, width: `${Math.min(pct, 100)}%`, background: pass ? "#34d399" : "#f87171" }} />
                          {/* 50% pass line */}
                          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#475569" }} />
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 2, textAlign: "right" }}>Pass line at 50%</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p style={styles.foot}>
        {total > 0 && `${total} result${total !== 1 ? "s" : ""} · ${passed} passed · ${failed} failed`}
      </p>
    </div>
  );
}
// ── Accuracy colour helper ─────────────────────────────────────────────────
function accClr(acc) {
  if (acc >= 90) return "#34d399";
  if (acc >= 80) return "#4ade80";
  if (acc >= 60) return "#fbbf24";
  return "#f87171";
}
// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  page: {
    padding: "24px 20px 48px",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    fontSize: 13,
    color: "#e2e8f0",
    background: "#050810",
    minHeight: "100vh",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  gridBg: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
  },
  header: {
    position: "relative", zIndex: 1,
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 20, gap: 12,
  },
  eyebrow: {
    fontSize: 10, letterSpacing: 3, color: "#4f5b6e",
    textTransform: "uppercase", marginBottom: 4,
  },
  title: {
    margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -1,
    background: "linear-gradient(135deg, #e2e8f0 30%, #60a5fa 70%, #a78bfa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    lineHeight: 1.1,
  },
  subtitle: {
    display: "flex", alignItems: "center", gap: 10, marginTop: 8,
  },
  studentBadge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 20, padding: "4px 12px", color: "#818cf8",
    fontSize: 12, fontWeight: 600,
  },
  avatarDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#34d399", boxShadow: "0 0 6px #34d399",
    display: "inline-block",
  },
  examCount: { color: "#4f5b6e", fontSize: 12 },
  refreshBtn: {
    background: "rgba(255,255,255,0.04)", border: "1px solid #1e293b",
    borderRadius: 8, padding: "9px 12px", color: "#64748b",
    cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
    display: "flex", alignItems: "center",
  },
  formulaBar: {
    position: "relative", zIndex: 1,
    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
    background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b",
    borderRadius: 8, padding: "8px 14px", marginBottom: 20,
    fontSize: 10, color: "#475569",
  },
  formulaItem: { display: "inline-flex", alignItems: "center", gap: 5 },
  fLabel: {
    background: "rgba(99,102,241,0.15)", color: "#818cf8",
    borderRadius: 3, padding: "1px 5px", fontSize: 9,
    fontWeight: 700, letterSpacing: 0.5,
  },
  formulaDivider: { color: "#1e293b", fontSize: 14 },
  statsGrid: {
    position: "relative", zIndex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 10, marginBottom: 20,
  },
  statCard: (color) => ({
    background: "rgba(15,23,42,0.9)",
    border: `1px solid ${color}25`,
    borderRadius: 12, padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: 4,
    position: "relative", overflow: "hidden",
  }),
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 },
  resultsList: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 },
  card: (pass, isOpen) => ({
    background: "rgba(15,23,42,0.9)",
    border: `1px solid ${isOpen ? (pass ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)") : "#1e293b"}`,
    borderRadius: 14, overflow: "hidden",
    transition: "border-color 0.2s",
  }),
  cardHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 12,
    padding: "14px 16px", cursor: "pointer",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  rank: (pass) => ({
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: pass ? 16 : 13, fontWeight: 800,
    background: pass ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.08)",
    color: pass ? "#34d399" : "#f87171",
    border: `1px solid ${pass ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.2)"}`,
  }),
  cardLang: {
    fontWeight: 700, fontSize: 13, color: "#e2e8f0",
    display: "flex", alignItems: "center", gap: 6,
  },
  autoBadge: {
    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
    background: "rgba(248,113,113,0.12)", color: "#f87171",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: 4, padding: "1px 5px",
  },
  cardDate: { fontSize: 10, color: "#475569", marginTop: 2 },
  cardMetrics: {
    display: "flex", alignItems: "center", gap: 0, flex: 1,
    justifyContent: "center",
  },
  metric: { textAlign: "center", padding: "0 14px" },
  metricVal: { fontSize: 16, fontWeight: 800, lineHeight: 1 },
  metricLbl: { fontSize: 9, color: "#475569", letterSpacing: 0.8, marginTop: 3, textTransform: "uppercase" },
  metricDiv: { width: 1, height: 28, background: "#1e293b", flexShrink: 0 },
  cardRight: { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  resultBadge: (pass) => ({
    textAlign: "center", minWidth: 52,
    background: pass ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
    border: `1px solid ${pass ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
    borderRadius: 10, padding: "6px 10px",
  }),
  resultPct: (pass) => ({ fontSize: 15, fontWeight: 800, color: pass ? "#34d399" : "#f87171", lineHeight: 1 }),
  resultVerdict: (pass) => ({ fontSize: 9, fontWeight: 700, color: pass ? "#34d399" : "#f87171", letterSpacing: 1, marginTop: 2 }),
  noRefBadge: {
    fontSize: 11, color: "#fbbf24", fontWeight: 700,
    background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
    borderRadius: 10, padding: "6px 10px",
  },
  chevron: { color: "#475569", fontSize: 16, transition: "transform 0.2s", lineHeight: 1 },
  cardDetail: {
    borderTop: "1px solid #1e293b",
    padding: "16px",
    background: "rgba(8,15,30,0.5)",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 0,
    marginBottom: 16,
  },
  detailRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 8px", borderBottom: "1px solid #0f172a",
  },
  detailKey: { color: "#475569", fontSize: 11 },
  detailVal: { color: "#cbd5e1", fontSize: 11, fontWeight: 700 },
  accuracyBarWrap: { marginBottom: 10 },
  accuracyBarLabel: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 5,
  },
  accuracyBarTrack: {
    height: 6, background: "rgba(255,255,255,0.05)",
    borderRadius: 4, overflow: "hidden", position: "relative",
  },
  accuracyBarFill: {
    height: "100%", borderRadius: 4,
    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
  },
  emptyState: {
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "64px 16px", textAlign: "center",
    background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b",
    borderRadius: 14,
  },
  spinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "3px solid #1e293b", borderTopColor: "#6366f1",
    animation: "spin 0.8s linear infinite",
  },
  foot: {
    position: "relative", zIndex: 1,
    fontSize: 11, color: "#334155", marginTop: 16, textAlign: "center",
  },
};
