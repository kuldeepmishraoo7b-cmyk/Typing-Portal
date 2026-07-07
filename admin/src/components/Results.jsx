import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
const API = API_BASE_URL;

const getTotalPossible = (r) => {
  if (r.total_possible_points && r.total_possible_points > 0) return r.total_possible_points;
  if (r.total_words && r.total_words > 0) return r.total_words * 2;
  if (r.typed_pct && r.typed_pct > 0 && r.typed_words && r.typed_words > 0) {
    const total = Math.round((r.typed_words * 100) / r.typed_pct);
    if (total > 0) return total * 2;
  }
  if (r.paragraph_word_count && r.paragraph_word_count > 0) return r.paragraph_word_count * 2;
  return null;
};

const getTotalWords = (r) => {
  if (r.total_words && r.total_words > 0) return r.total_words;
  if (r.total_possible_points && r.total_possible_points > 0) return Math.round(r.total_possible_points / 2);
  return null;
};

const getScorePct = (r) => {
  const total = getTotalPossible(r);
  if (!total || total === 0) return null;
  return Math.round(((r.points || 0) / total) * 100);
};

const isPass = (r) => {
  const pct = getScorePct(r);
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

const normLang = (lang) => {
  if (!lang) return "other";
  const l = lang.trim().toLowerCase();
  if (l === "english" || l === "en") return "english";
  if (l === "hindi" || l === "hi" || l === "हिंदी") return "hindi";
  return l;
};

const isHindi = (lang) => normLang(lang) === "hindi";

const Pill = ({ published }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: published ? "rgba(34,197,94,0.12)" : "rgba(251,146,60,0.12)",
    color: published ? "#22c55e" : "#fb923c",
    border: `1px solid ${published ? "rgba(34,197,94,0.3)" : "rgba(251,146,60,0.3)"}`,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
    {published ? "Sent" : "Pending"}
  </span>
);

const ScoreBadge = ({ r }) => {
  const pct  = getScorePct(r);
  const pass = isPass(r);
  if (pct === null)
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: "rgba(251,191,36,0.12)", color: "#fbbf24",
        border: "1px solid rgba(251,191,36,0.3)",
      }}>⚠ No Ref</span>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: pass ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
        color: pass ? "#22c55e" : "#ef4444",
        border: `1px solid ${pass ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
      }}>
        {pct}% · {pass ? "✓ Pass" : "✗ Fail"}
      </span>
    </div>
  );
};

const WpmBadge = ({ wpm, grossWpm }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{wpm || 0}</span>
    {grossWpm > 0 && grossWpm !== wpm && (
      <span style={{ fontSize: 10, color: "#64748b" }}>gross: {grossWpm}</span>
    )}
  </div>
);

const MiniBar = ({ value, max, color }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 52, height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>{value}%</span>
    </div>
  );
};

export default function AdminExamResults() {
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLang,   setFilterLang]   = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [sortKey,      setSortKey]      = useState("submitted");
  const [sortDir,      setSortDir]      = useState("desc");
  const [hovered,      setHovered]      = useState(null);
  const [modal,        setModal]        = useState(null);
  const [publishing,   setPublishing]   = useState({});
  const [deleting,     setDeleting]     = useState({});
  const [clearingAll,  setClearingAll]  = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/exam-results`);
      setResults(res.data.filter(r => r.status !== "not_attempted"));
    } catch { }
    finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const passed = results.filter(r => isPass(r)).length;
    const withScore = results.filter(r => getScorePct(r) !== null);
    const avgScore = withScore.length
      ? Math.round(withScore.reduce((s, r) => s + getScorePct(r), 0) / withScore.length) : 0;
    return {
      total:     results.length,
      pending:   results.filter(r => !r.is_published).length,
      sent:      results.filter(r =>  r.is_published).length,
      passed,
      failed:    results.length - passed,
      avgWpm:    results.length ? Math.round(results.reduce((s, r) => s + (r.wpm || 0), 0) / results.length) : 0,
      avgAcc:    results.length ? (results.reduce((s, r) => s + (r.accuracy || 0), 0) / results.length).toFixed(1) : "0.0",
      avgScore,
      auto:      results.filter(r => r.status === "auto-submitted").length,
      brokenRef: results.filter(r => getScorePct(r) === null).length,
    };
  }, [results]);

  const rows = useMemo(() => {
    let arr = [...results];
    const q = search.trim().toLowerCase();
    if (q) arr = arr.filter(r =>
      (r.username || r.student_name || "").toLowerCase().includes(q) ||
      (r.language || "").toLowerCase().includes(q)
    );
    if (filterStatus === "sent")    arr = arr.filter(r =>  r.is_published);
    if (filterStatus === "pending") arr = arr.filter(r => !r.is_published);
    if (filterStatus === "auto")    arr = arr.filter(r =>  r.status === "auto-submitted");

    if (filterLang !== "all")
      arr = arr.filter(r => normLang(r.language) === filterLang);

    if (filterResult === "pass") arr = arr.filter(r =>  isPass(r));
    if (filterResult === "fail") arr = arr.filter(r => !isPass(r));

    const keyFn = {
      student:   r => (r.username || r.student_name || "").toLowerCase(),
      wpm:       r => r.wpm      || 0,
      accuracy:  r => r.accuracy || 0,
      points:    r => r.points   || 0,
      submitted: r => r.submitted_at ? new Date(r.submitted_at).getTime() : 0,
    }[sortKey];

    if (keyFn) arr.sort((a, b) => {
      const va = keyFn(a), vb = keyFn(b);
      if (typeof va === "string")
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [results, search, filterStatus, filterLang, filterResult, sortKey, sortDir]);

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };
  const si = (k) => sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  const publish = async (id) => {
    setPublishing(p => ({ ...p, [id]: true }));
    try {
      await axios.put(`${API}/api/publish-result/${id}`);
      setResults(p => p.map(r => r.id === id ? { ...r, is_published: 1 } : r));
    } catch { alert("Failed to publish."); }
    finally { setPublishing(p => ({ ...p, [id]: false })); }
  };

  const revoke = async (id) => {
    if (!window.confirm("Revoke this result?")) return;
    try {
      await axios.put(`${API}/api/revoke-result/${id}`);
      setResults(p => p.map(r => r.id === id ? { ...r, is_published: 0 } : r));
      setModal(prev => prev && prev.id === id ? { ...prev, is_published: 0 } : prev);
    } catch { alert("Failed to revoke."); }
  };

  const deleteResult = async (id) => {
    if (!window.confirm("Delete this result permanently?")) return;
    setDeleting(p => ({ ...p, [id]: true }));
    try {
      await axios.delete(`${API}/api/delete-result/${id}`);
      setResults(p => p.filter(r => r.id !== id));
      if (modal?.id === id) setModal(null);
    } catch { alert("Failed to delete result."); }
    finally { setDeleting(p => ({ ...p, [id]: false })); }
  };

  const clearAll = async () => {
    if (!window.confirm(`⚠️ Clear ALL ${results.length} exam result(s)?\n\nThis is permanent and cannot be undone.`)) return;
    setClearingAll(true);
    try {
      await Promise.all(results.map(r => axios.delete(`${API}/api/delete-result/${r.id}`)));
      setResults([]);
      setModal(null);
      alert("✅ All results cleared.");
    } catch { alert("Failed to clear all results."); }
    finally { setClearingAll(false); }
  };

  const publishAll = async () => {
    const pending = rows.filter(r => !r.is_published);
    if (!pending.length) { alert("No pending results."); return; }
    if (!window.confirm(`Publish ${pending.length} result(s)?`)) return;
    for (const r of pending) await publish(r.id);
    alert(`✅ ${pending.length} result(s) published!`);
  };

  const exportCSV = () => {
    const h = ["Student","Language","Typed Words","Total Words","Keystrokes","Net WPM","Gross WPM",
               "Accuracy%","Errors","Points","Total Possible","Score %","Result",
               "Tab Warnings","Eye Warnings","Wrong Person","Status","Published","Submitted At"];
    const body = rows.map(r => {
      const pct   = getScorePct(r);
      const pass  = isPass(r);
      const total = getTotalPossible(r);
      const totalW = getTotalWords(r);
      return [
        r.username || r.student_name, r.language,
        r.typed_words || 0, totalW ?? "—",
        r.total_characters != null ? r.total_characters : "—",
        r.wpm, r.gross_wpm != null ? r.gross_wpm : "—", r.accuracy,
        r.errors || 0, r.points,
        total ?? "—",
        pct !== null ? `${pct}%` : "No Ref",
        pct === null ? "No Ref" : (pass ? "Pass" : "Fail"),
        r.warnings || 0, r.eye_warnings || 0,
        r.wrong_person ? "Yes" : "No",
        r.status || "completed",
        r.is_published ? "Yes" : "No", r.submitted_at,
      ];
    });
    const csv = [h, ...body].map(row => row.map(v => `"${v ?? ""}"`).join(",")).join("\n");
    const a   = document.createElement("a");
    a.href    = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `results-${Date.now()}.csv`;
    a.click();
  };

  const C = {
    bg: "#060b14", surface: "#0d1420", card: "#111827",
    border: "#1e2d42", border2: "#243044", text: "#e2e8f0",
    muted: "#64748b", blue: "#3b82f6", green: "#22c55e",
    red: "#ef4444", amber: "#f59e0b", purple: "#a78bfa", teal: "#2dd4bf",
  };

  const S = {
    page: { padding: "20px 16px 40px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: 13, color: C.text, background: C.bg, minHeight: "100vh", boxSizing: "border-box" },
    hdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 },
    titleBlock: { display: "flex", flexDirection: "column", gap: 3 },
    title: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: -0.5, background: "linear-gradient(90deg,#60a5fa,#a78bfa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    sub: { margin: 0, fontSize: 12, color: C.muted },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: 14 },
    statCard: (accent) => ({ background: C.card, border: `1px solid ${C.border}`, borderTop: `2px solid ${accent}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }),
    statNum: (c) => ({ fontSize: 22, fontWeight: 800, color: c, lineHeight: 1.1 }),
    statLbl: { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 },
    infoBar: { background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 11, color: "#93c5fd", marginBottom: 10, lineHeight: 1.7 },
    warnBar: { background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "8px 14px", fontSize: 11, color: "#fcd34d", marginBottom: 10, lineHeight: 1.7 },
    controls: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" },
    search: { flex: "1 1 160px", minWidth: 0, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 7, padding: "7px 11px", color: C.text, fontSize: 12, outline: "none" },
    sel: { background: C.card, border: `1px solid ${C.border2}`, borderRadius: 7, padding: "7px 9px", color: C.text, fontSize: 12, outline: "none", cursor: "pointer", flexShrink: 0 },
    btn: (bg) => ({ background: bg, border: "none", borderRadius: 7, padding: "7px 13px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }),
    refreshBtn: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 11px", color: C.muted, fontSize: 12, cursor: "pointer", flexShrink: 0 },
    tableWrap: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th: { padding: "10px 12px", textAlign: "left", background: C.surface, color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.7, borderBottom: `1px solid ${C.border}`, fontWeight: 700, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" },
    thNs: { padding: "10px 12px", textAlign: "left", background: C.surface, color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.7, borderBottom: `1px solid ${C.border}`, fontWeight: 700, whiteSpace: "nowrap" },
    td: { padding: "10px 12px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle", whiteSpace: "nowrap" },
    sendBtn:   { background: "#15803d", border: "none", borderRadius: 6, padding: "4px 11px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" },
    revokeBtn: { background: "transparent", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 6, padding: "4px 10px", color: C.red, fontSize: 11, cursor: "pointer" },
    detailBtn: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", color: C.muted, fontSize: 11, cursor: "pointer" },
    deleteBtn: { background: "transparent", border: "1px solid rgba(185,28,28,0.4)", borderRadius: 6, padding: "4px 8px", color: "#ef4444", fontSize: 11, cursor: "pointer" },
    empty: { textAlign: "center", padding: "40px 16px", color: C.muted },
    foot:  { fontSize: 11, color: C.muted, marginTop: 8 },
    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(2px)" },
    mbox: { background: "#0f1923", border: `1px solid ${C.border2}`, borderRadius: 16, padding: 24, width: 440, maxWidth: "92vw", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" },
    mHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    mTitle: { fontSize: 16, fontWeight: 800, color: C.text },
    mRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` },
    mKey: { color: C.muted, fontSize: 12 },
    mVal: { color: C.text, fontSize: 12, fontWeight: 700, textAlign: "right" },
    mClose: { marginTop: 16, width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text, cursor: "pointer", fontSize: 13 },
    scoreRing: (pct, pass) => ({ width: 72, height: 72, borderRadius: "50%", background: `conic-gradient(${pass ? "#22c55e" : "#ef4444"} ${pct * 3.6}deg, #1e2d42 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }),
    scoreInner: { width: 56, height: 56, borderRadius: "50%", background: "#0f1923", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  };

  return (
    <div style={S.page}>

      <div style={S.hdr}>
        <div style={S.titleBlock}>
          <h2 style={S.title}>Exam Results</h2>
          <p style={S.sub}>Admin Panel · {stats.total} submissions · Indian Govt Typing Standard</p>
        </div>
        <button style={S.refreshBtn} onClick={load}>↻ Refresh</button>
      </div>

      <div style={S.statsGrid}>
        {[
          { v: stats.total,          l: "Total",       c: C.blue   },
          { v: stats.pending,        l: "Pending",     c: C.amber  },
          { v: stats.sent,           l: "Published",   c: C.green  },
          { v: stats.passed,         l: "Passed",      c: C.teal   },
          { v: stats.failed,         l: "Failed",      c: C.red    },
          { v: `${stats.avgScore}%`, l: "Avg Score",   c: C.purple },
          { v: stats.avgWpm,         l: "Avg Net WPM", c: C.blue   },
          { v: `${stats.avgAcc}%`,   l: "Avg Acc",     c: C.teal   },
          { v: stats.auto,           l: "Auto-Sub",    c: C.red    },
        ].map(({ v, l, c }) => (
          <div key={l} style={S.statCard(c)}>
            <span style={S.statNum(c)}>{v}</span>
            <span style={S.statLbl}>{l}</span>
          </div>
        ))}
      </div>

      <div style={S.infoBar}>
        <strong style={{ color: "#60a5fa" }}>Indian Govt Typing Formula (SSC / Railway / CPCT):</strong>
        &nbsp; Gross WPM = (Keystrokes ÷ 5) ÷ minutes &nbsp;|&nbsp;
        Net WPM = Gross WPM − (errors ÷ minutes) &nbsp;|&nbsp;
        Accuracy = correct chars ÷ typed chars × 100 &nbsp;|&nbsp;
        Points = typed words × 2 &nbsp;|&nbsp;
        Pass = Score ≥ 50%
      </div>

      {stats.brokenRef > 0 && (
        <div style={S.warnBar}>
          ⚠ <strong>{stats.brokenRef} result(s)</strong> show "No Ref" — total_words not saved in older records.
          All new submissions will include this field automatically.
        </div>
      )}

      <div style={S.controls}>
        <input style={S.search} placeholder="🔍 Search student or language…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={S.sel} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Published</option>
          <option value="auto">Auto-Submitted</option>
        </select>

        <select style={S.sel} value={filterLang} onChange={e => setFilterLang(e.target.value)}>
          <option value="all">All Languages</option>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
        </select>

        <select style={S.sel} value={filterResult} onChange={e => setFilterResult(e.target.value)}>
          <option value="all">All Results</option>
          <option value="pass">Pass Only</option>
          <option value="fail">Fail Only</option>
        </select>
        <button style={S.btn("#1d4ed8")} onClick={publishAll}>⚡ Publish All</button>
        <button style={S.btn("#065f46")} onClick={exportCSV}>↓ Download</button>
        <button style={{ ...S.btn("#7f1d1d"), opacity: clearingAll || results.length === 0 ? 0.5 : 1 }} onClick={clearAll} disabled={clearingAll || results.length === 0}>
          {clearingAll ? "Clearing…" : "🗑 Clear All"}
        </button>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.empty}><div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>Loading results…</div>
        ) : rows.length === 0 ? (
          <div style={S.empty}><div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>No results found.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}  onClick={() => toggleSort("student")}>Student{si("student")}</th>
                <th style={S.thNs}>Language</th>
                <th style={S.th}  onClick={() => toggleSort("wpm")}>Net WPM{si("wpm")}</th>
                <th style={S.th}  onClick={() => toggleSort("accuracy")}>Accuracy{si("accuracy")}</th>
                <th style={S.th}  onClick={() => toggleSort("points")}>Points{si("points")}</th>
                <th style={S.thNs}>Score / Result</th>
                <th style={S.thNs}>Status</th>
                <th style={S.thNs}>Published</th>
                <th style={S.th}  onClick={() => toggleSort("submitted")}>Submitted{si("submitted")}</th>
                <th style={S.thNs}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const auto     = r.status === "auto-submitted";
                const total    = getTotalPossible(r);
                const pct      = getScorePct(r);
                const pass     = isPass(r);
                const bg       = hovered === r.id ? "#141e2e" : i % 2 === 0 ? "transparent" : "rgba(13,20,32,0.5)";
                const name     = r.username || r.student_name || "—";
                const accColor = (r.accuracy || 0) >= 80 ? C.green : (r.accuracy || 0) >= 60 ? C.amber : C.red;

                return (
                  <tr key={r.id} style={{ background: bg, transition: "background 0.15s" }} onMouseEnter={() => setHovered(r.id)} onMouseLeave={() => setHovered(null)}>
                    <td style={S.td}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <span style={{ fontWeight: 700, cursor: "pointer", color: "#93c5fd", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }} onClick={() => setModal(r)}>{name}</span>
                        <span style={{ fontSize: 10, color: C.muted }}>#{r.exam_id || r.id}</span>
                      </div>
                    </td>
                    <td style={S.td}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>
                        {isHindi(r.language) ? "🇮🇳 Hindi" : r.language || "—"}
                      </span>
                    </td>
                    <td style={S.td}><WpmBadge wpm={r.wpm} grossWpm={r.gross_wpm} /></td>
                    <td style={S.td}><MiniBar value={r.accuracy || 0} max={100} color={accColor} /></td>
                    <td style={{ ...S.td, fontWeight: 600 }}>
                      <span style={{ color: C.text }}>{r.points || 0}</span>
                      {total
                        ? <span style={{ color: C.muted, fontSize: 10, fontWeight: 400 }}> / {total}</span>
                        : <span style={{ color: C.amber, fontSize: 10 }} title="total_words not saved"> / ⚠</span>
                      }
                    </td>
                    <td style={S.td}><ScoreBadge r={r} /></td>
                    <td style={S.td}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: auto ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: auto ? C.red : C.green, border: `1px solid ${auto ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}` }}>
                        {auto ? "Auto" : "Done"}
                      </span>
                    </td>
                    <td style={S.td}><Pill published={r.is_published} /></td>
                    <td style={{ ...S.td, color: C.muted, fontSize: 11 }}>{fmt(r.submitted_at)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {!r.is_published ? (
                          <button style={{ ...S.sendBtn, opacity: publishing[r.id] ? 0.6 : 1 }} onClick={() => publish(r.id)} disabled={!!publishing[r.id]}>
                            {publishing[r.id] ? "…" : "Send"}
                          </button>
                        ) : (
                          <button style={S.revokeBtn} onClick={() => revoke(r.id)}>Revoke</button>
                        )}
                        <button style={S.detailBtn} onClick={() => setModal(r)} title="Details">🔍</button>
                        <button style={{ ...S.deleteBtn, opacity: deleting[r.id] ? 0.5 : 1 }} onClick={() => deleteResult(r.id)} disabled={!!deleting[r.id]} title="Delete">
                          {deleting[r.id] ? "…" : "🗑"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p style={S.foot}>Showing {rows.length} of {results.length} results</p>

      {modal && (() => {
        const pass    = isPass(modal);
        const pct     = getScorePct(modal);
        const total   = getTotalPossible(modal);
        const safePct = pct ?? 0;

        const showNum  = (val) => (val != null && val !== "") ? String(val) : "—";
        const showWpm  = (val) => (val != null && val !== "") ? `${val} wpm` : "—";
        const showChars= (val) => (val != null && val !== "") ? String(val) : "—";

        return (
          <div style={S.backdrop} onClick={() => setModal(null)}>
            <div style={S.mbox} onClick={e => e.stopPropagation()}>

              <div style={S.mHdr}>
                <div>
                  <div style={S.mTitle}>{modal.username || modal.student_name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Exam #{modal.exam_id} · {modal.language || "—"}</div>
                </div>
                {pct !== null ? (
                  <div style={S.scoreRing(safePct, pass)}>
                    <div style={S.scoreInner}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: pass ? C.green : C.red }}>{pct}%</span>
                      <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>{pass ? "Pass" : "Fail"}</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: C.amber, fontSize: 12, fontWeight: 700 }}>⚠ No Ref</span>
                )}
              </div>

              <div style={{ background: pct === null ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.06)", border: `1px solid ${pct === null ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.2)"}`, borderRadius: 7, padding: "7px 11px", fontSize: 11, color: pct === null ? "#fcd34d" : "#93c5fd", marginBottom: 14 }}>
                {pct === null
                  ? "⚠️ total_words not saved — update to new Exam.jsx to fix future submissions."
                  : "SSC/Railway Formula: Gross WPM = (Keystrokes÷5)÷min · Net WPM = Gross−(Errors÷min) · Pass ≥ 50%"
                }
              </div>

              {[
                ["Typed Words",        `${modal.typed_words || 0} / ${getTotalWords(modal) ?? "—"} words`],
                ["Keystrokes",         showChars(modal.total_characters)],
                ["Net WPM",            showWpm(modal.wpm)],
                ["Gross WPM",          showWpm(modal.gross_wpm)],
                ["Accuracy",           `${modal.accuracy || 0}%`],
                ["Errors",             `${modal.errors || 0} chars`],
                ["Points Earned",      showNum(modal.points)],
                ["Total Possible Pts", total ? `${total} (${Math.round(total/2)} words × 2)` : "⚠ Not saved"],
                ["Score %",            pct !== null ? `${pct}%` : "⚠ No Ref"],
                ["Result",             pct === null ? "⚠ No Ref" : pass ? "✅ Pass" : "❌ Fail"],
                ["Tab Warnings",       `${modal.warnings || 0} / 3`],
                ["Eye Warnings",       `${modal.eye_warnings || 0} / 3`],
                ["Suspicious Events",  showNum(modal.suspicious_events)],
                ["Wrong Person",       modal.wrong_person ? "⚠️ Yes" : "✅ No"],
                ["Multi Face",         modal.multi_face   ? "⚠️ Yes" : "✅ No"],
                ["Status",             modal.status || "completed"],
                ["Published",          modal.is_published ? "✅ Yes" : "⏳ Pending"],
                ["Submitted",          fmt(modal.submitted_at)],
                ["Exam Date",          modal.exam_date ? new Date(modal.exam_date).toLocaleDateString("en-IN") : "—"],
                ["Integrity",          modal.integrity_note || "—"],
              ].map(([k, v]) => (
                <div key={k} style={S.mRow}>
                  <span style={S.mKey}>{k}</span>
                  <span style={{
                    ...S.mVal,
                    color:
                      k === "Result"               ? (pct === null ? C.amber : pass ? C.green : C.red)
                      : k === "Score %"            && pct === null ? C.amber
                      : k === "Total Possible Pts" && !total       ? C.amber
                      : k === "Wrong Person"       && modal.wrong_person ? C.red
                      : k === "Multi Face"         && modal.multi_face   ? C.amber
                      : k === "Integrity"          && modal.integrity_note?.includes("🚨") ? C.red
                      : k === "Integrity"          && modal.integrity_note?.includes("⚠️") ? C.amber
                      : C.text,
                    maxWidth: 220, wordBreak: "break-word", whiteSpace: "normal",
                  }}>{v}</span>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {!modal.is_published && (
                  <button style={{ flex: 1, padding: "9px 0", fontSize: 13, background: "#15803d", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }} onClick={() => { publish(modal.id); setModal(null); }}>
                    📨 Send Result
                  </button>
                )}
                <button style={{ flex: 1, padding: "9px 0", fontSize: 13, background: "#7f1d1d", border: "none", borderRadius: 8, color: "#fca5a5", cursor: "pointer", fontWeight: 700 }} onClick={() => deleteResult(modal.id)}>
                  🗑 Delete
                </button>
                <button style={S.mClose} onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
