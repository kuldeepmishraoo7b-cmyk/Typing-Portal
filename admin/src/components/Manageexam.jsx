import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import API_BASE_URL from "../config";
const INSCRIPT_MAP = {
  "`": "़",  "~": "ॐ",
  "1": "१",  "!": "!",
  "2": "२",  "@": "@",
  "3": "३",  "#": "#",
  "4": "४",  "$": "₹",
  "5": "५",  "%": "%",
  "6": "६",  "^": "^",
  "7": "७",  "&": "&",
  "8": "८",  "*": "*",
  "9": "९",  "(": "(",
  "0": "०",  ")": ")",
  "-": "-",  "_": "_",
  "=": "ृ",  "+": "ॄ",
  "q": "ौ",  "Q": "औ",
  "w": "ै",  "W": "ऐ",
  "e": "ा",  "E": "आ",
  "r": "ी",  "R": "ई",
  "t": "ू",  "T": "ऊ",
  "y": "ब",  "Y": "भ",
  "u": "ह",  "U": "ङ",
  "i": "ग",  "I": "घ",
  "o": "द",  "O": "ध",
  "p": "ज",  "P": "झ",
  "[": "ड",  "{": "ढ",
  "]": "़",  "}": "ञ",
  "\\": "ॉ",
  "|": "ऑ",
  "a": "ो",  "A": "ओ",
  "s": "े",  "S": "ए",
  "d": "्",  "D": "अ",
  "f": "ि",  "F": "इ",
  "g": "ु",  "G": "उ",
  "h": "प",  "H": "फ",
  "j": "र",  "J": "ऱ",
  "k": "क",  "K": "ख",
  "l": "त",  "L": "थ",
  ";": "च",  ":": "छ",
  "'": "ट",  "\"": "ठ",
  "z": "ॆ",  "Z": "ऍ",
  "x": "ँ",  "X": "ः",
  "c": "म",  "C": "ण",
  "v": "न",  "V": "ऩ",
  "b": "व",  "B": "ऴ",
  "n": "ल",  "N": "ळ",
  "m": "स",  "M": "श",
  ",": ",",  "<": "ष",
  ".": "।",  ">": ".",
  "/": "य",  "?": "?"
};
function toHindi(char) {
  return INSCRIPT_MAP[char] ?? char;
}
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --surface2: #22263a;
    --border: #2e3350;
    --accent: #6c63ff;
    --accent2: #00d4aa;
    --danger: #ff4d6d;
    --warn: #f59e0b;
    --text: #e8eaf6;
    --muted: #7c83a8;
    --success: #10b981;
    --card-glow: 0 0 30px rgba(108,99,255,0.08);
  }
  body { background: var(--bg) !important; font-family: 'Sora', sans-serif !important; color: var(--text) !important; }
  .exam-wrapper {
    min-height: 100vh;
    background: var(--bg);
    padding: 2rem 1.5rem;
    font-family: 'Sora', sans-serif;
  }
  .page-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }
  .page-header h2 {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #6c63ff, #00d4aa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }
  .page-header .subtitle {
    color: var(--muted);
    font-size: 0.85rem;
    margin-top: 2px;
  }
  .glass-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.75rem;
    margin-bottom: 1.5rem;
    box-shadow: var(--card-glow);
    transition: all 0.3s ease;
  }
  .glass-card:hover {
    border-color: rgba(108,99,255,0.3);
    box-shadow: 0 0 40px rgba(108,99,255,0.12);
  }
  .section-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .section-title .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .form-label-custom {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.5rem;
    display: block;
  }
  .form-control-custom, .form-select-custom {
    background: var(--surface2) !important;
    border: 1.5px solid var(--border) !important;
    border-radius: 10px !important;
    color: var(--text) !important;
    font-family: 'Sora', sans-serif !important;
    font-size: 0.9rem !important;
    padding: 0.65rem 1rem !important;
    transition: all 0.2s ease !important;
    width: 100%;
  }
  .form-control-custom:focus, .form-select-custom:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px rgba(108,99,255,0.15) !important;
    outline: none !important;
    background: var(--surface2) !important;
  }
  .form-control-custom::placeholder { color: var(--muted) !important; }
  textarea.form-control-custom { resize: vertical; min-height: 90px; }
  .student-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .student-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.6rem;
    max-height: 260px;
    overflow-y: auto;
    padding: 0.25rem;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .student-chip {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.75rem;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }
  .student-chip:hover { border-color: var(--accent); background: rgba(108,99,255,0.08); }
  .student-chip.selected { border-color: var(--accent); background: rgba(108,99,255,0.18); }
  .student-chip .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    object-fit: cover; background: var(--border); flex-shrink: 0;
  }
  .student-chip .avatar-placeholder {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0;
  }
  .student-chip .info { overflow: hidden; }
  .student-chip .name { font-size: 0.82rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .student-chip .phone { font-size: 0.72rem; color: var(--muted); }
  .student-chip .check {
    margin-left: auto; width: 18px; height: 18px; border-radius: 5px;
    border: 1.5px solid var(--border); background: transparent;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.2s;
  }
  .student-chip.selected .check { background: var(--accent); border-color: var(--accent); }
  .selected-count {
    background: rgba(108,99,255,0.2); border: 1px solid rgba(108,99,255,0.4);
    border-radius: 20px; padding: 0.2rem 0.7rem;
    font-size: 0.78rem; font-weight: 600; color: var(--accent);
  }
  .btn-create {
    background: linear-gradient(135deg, var(--accent), #8b83ff);
    border: none; border-radius: 10px; color: white;
    font-family: 'Sora', sans-serif; font-weight: 600; font-size: 0.9rem;
    padding: 0.7rem 2rem; cursor: pointer; transition: all 0.3s ease;
    display: inline-flex; align-items: center; gap: 0.5rem;
  }
  .btn-create:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(108,99,255,0.4); }
  .btn-select-all {
    background: transparent; border: 1px solid var(--border);
    border-radius: 8px; color: var(--muted); font-size: 0.78rem;
    font-weight: 500; padding: 0.3rem 0.75rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Sora', sans-serif;
  }
  .btn-select-all:hover { border-color: var(--accent2); color: var(--accent2); }
  .exam-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden; transition: all 0.3s ease; height: 100%;
  }
  .exam-card:hover { border-color: rgba(108,99,255,0.3); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
  .exam-card-header {
    padding: 1rem 1.25rem; display: flex; align-items: center;
    justify-content: space-between; border-bottom: 1px solid var(--border);
  }
  .exam-id {
    font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;
    color: var(--muted); background: var(--surface2);
    padding: 0.25rem 0.6rem; border-radius: 6px;
  }
  .status-badge {
    font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.75rem;
    border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .status-upcoming { background: rgba(108,99,255,0.15); color: #8b83ff; border: 1px solid rgba(108,99,255,0.3); }
  .status-ongoing  { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid rgba(16,185,129,0.3); }
  .status-expired  { background: rgba(255,77,109,0.12); color: var(--danger); border: 1px solid rgba(255,77,109,0.25); }
  .exam-card-body { padding: 1.25rem; }
  .info-row { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.6rem; font-size: 0.84rem; }
  .info-label { color: var(--muted); min-width: 70px; font-size: 0.78rem; }
  .info-value { color: var(--text); font-weight: 500; }
  .para-preview {
    background: var(--surface2); border-radius: 8px; padding: 0.6rem 0.8rem;
    font-size: 0.8rem; color: var(--muted); line-height: 1.5;
    margin-bottom: 0.75rem; font-style: italic;
  }
  .assigned-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
  .assigned-chip {
    background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.25);
    border-radius: 20px; padding: 0.2rem 0.65rem;
    font-size: 0.72rem; color: var(--accent2); font-weight: 500;
  }
  .all-students-badge {
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25);
    border-radius: 20px; padding: 0.2rem 0.65rem;
    font-size: 0.72rem; color: var(--warn); font-weight: 500;
  }
  .exam-card-footer {
    padding: 0.75rem 1.25rem; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end;
  }
  .btn-delete {
    background: transparent; border: 1px solid rgba(255,77,109,0.35);
    border-radius: 8px; color: var(--danger); font-size: 0.8rem;
    font-weight: 500; padding: 0.4rem 1rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Sora', sans-serif;
    display: flex; align-items: center; gap: 0.4rem;
  }
  .btn-delete:hover { background: rgba(255,77,109,0.12); border-color: var(--danger); }
  .empty-state { text-align: center; padding: 3rem 1rem; color: var(--muted); }
  .empty-state .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .empty-state p { font-size: 0.9rem; }
  .search-bar { position: relative; margin-bottom: 0.75rem; }
  .search-bar input { padding-left: 2.25rem !important; }
  .search-bar .search-icon {
    position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
    color: var(--muted); font-size: 0.85rem; pointer-events: none;
  }
  .divider { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
  .lang-tab {
    background: transparent; border: 1.5px solid var(--border);
    border-radius: 8px; color: var(--muted); font-size: 0.82rem;
    font-weight: 600; padding: 0.45rem 1.1rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Sora', sans-serif;
  }
  .lang-tab.active { background: rgba(108,99,255,0.15); border-color: var(--accent); color: var(--accent); }
  select.form-control-custom option { background: #1a1d27; color: var(--text); }
  .hindi-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.35);
    border-radius: 20px; padding: 0.28rem 0.85rem;
    font-size: 0.78rem; font-weight: 600; color: #f59e0b;
    margin-bottom: 0.6rem; font-family: 'Sora', sans-serif;
  }
  .hindi-textarea {
    font-family: 'Mangal', 'Noto Sans Devanagari', 'Arial Unicode MS', sans-serif !important;
    font-size: 1.05rem !important;
    line-height: 1.9 !important;
    letter-spacing: 0.02em !important;
  }
  .hindi-border:focus {
    border-color: #f59e0b !important;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.15) !important;
  }
`;
export default function ManageExam() {
  const [language, setLanguage] = useState("EN");
  const [paragraph, setParagraph] = useState("");
  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignToAll, setAssignToAll] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const paraRef = useRef(null);
  const paragraphRef = useRef("");
  useEffect(() => { paragraphRef.current = paragraph; }, [paragraph]);
  const handleHindiKeyDown = useCallback((e) => {
    if (language !== "HI") return;
    const navKeys = [
      "ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
      "Home","End","Escape","Shift","Control","Alt","Meta",
      "CapsLock","PageUp","PageDown",
      "F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12",
    ];
    if (navKeys.includes(e.key)) return;
    if (e.key === "Tab") return;
    if (e.ctrlKey || e.metaKey) return;
    const el = paraRef.current;
    if (!el) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      const start = el.selectionStart ?? paragraphRef.current.length;
      const end   = el.selectionEnd   ?? paragraphRef.current.length;
      const current = paragraphRef.current;
      let newValue;
      if (start !== end) {
        newValue = current.slice(0, start) + current.slice(end);
      } else if (start > 0) {
        const chars = Array.from(current);
        const charsBefore = Array.from(current.slice(0, start)).length;
        chars.splice(charsBefore - 1, 1);
        newValue = chars.join("");
      } else { return; }
      setParagraph(newValue);
      paragraphRef.current = newValue;
      const newCursor = start !== end ? start : Math.max(0, start - 1);
      setTimeout(() => { el.selectionStart = newCursor; el.selectionEnd = newCursor; }, 0);
      return;
    }
    if (e.key === "Delete") {
      e.preventDefault();
      const start = el.selectionStart ?? paragraphRef.current.length;
      const end   = el.selectionEnd   ?? paragraphRef.current.length;
      const current = paragraphRef.current;
      let newValue;
      if (start !== end) {
        newValue = current.slice(0, start) + current.slice(end);
      } else if (start < current.length) {
        const chars = Array.from(current);
        const charsBefore = Array.from(current.slice(0, start)).length;
        chars.splice(charsBefore, 1);
        newValue = chars.join("");
      } else { return; }
      setParagraph(newValue);
      paragraphRef.current = newValue;
      setTimeout(() => { el.selectionStart = start; el.selectionEnd = start; }, 0);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const start = el.selectionStart ?? paragraphRef.current.length;
      const end   = el.selectionEnd   ?? paragraphRef.current.length;
      const current = paragraphRef.current;
      const newValue = current.slice(0, start) + "\n" + current.slice(end);
      setParagraph(newValue);
      paragraphRef.current = newValue;
      setTimeout(() => { el.selectionStart = start + 1; el.selectionEnd = start + 1; }, 0);
      return;
    }
    e.preventDefault();
    const hindiChar = toHindi(e.key);
    const start = el.selectionStart ?? paragraphRef.current.length;
    const end   = el.selectionEnd   ?? paragraphRef.current.length;
    const current = paragraphRef.current;
    const newValue = current.slice(0, start) + hindiChar + current.slice(end);
    setParagraph(newValue);
    paragraphRef.current = newValue;
    setTimeout(() => {
      el.selectionStart = start + hindiChar.length;
      el.selectionEnd   = start + hindiChar.length;
    }, 0);
  }, [language]);
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setParagraph("");
    paragraphRef.current = "";
    setTimeout(() => paraRef.current?.focus(), 100);
  };
  const loadExams = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/all-exams`);
      setExams(res.data);
    } catch (err) { console.error("Load Exams Error:", err); }
  };
  const loadStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/students`);
      setStudents(res.data);
    } catch (err) { console.error("Load Students Error:", err); }
  };
  useEffect(() => { loadExams(); loadStudents(); }, []);
  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };
  const toggleAll = () => {
    if (selectedStudents.length === students.length) setSelectedStudents([]);
    else setSelectedStudents(students.map(s => s.id));
  };
  const filteredStudents = students.filter(s =>
    s.username.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.phone && s.phone.includes(studentSearch))
  );
  const createExam = async () => {
    if (!paragraph || !examDate || !startTime || !duration) {
      alert("Please fill all fields"); return;
    }
    if (!assignToAll && selectedStudents.length === 0) {
      alert("Please select at least one student or choose 'Assign to All'"); return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/create-exam`, {
        language, paragraph, examDate, startTime, duration,
        assignToAll, studentIds: assignToAll ? [] : selectedStudents,
      });
      alert("Exam Created Successfully");
      setParagraph(""); setExamDate(""); setStartTime(""); setDuration("");
      setSelectedStudents([]); setAssignToAll(false);
      loadExams();
    } catch (err) { console.error(err); alert("Error creating exam"); }
  };
  const deleteExam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/exam/${id}`);
      alert("Exam Deleted"); loadExams();
    } catch (err) { console.error(err); alert("Failed to delete exam"); }
  };
  const getStatus = (exam) => {
    const now = new Date();
    const start = new Date(`${exam.exam_date}T${exam.start_time}`);
    const end = new Date(start.getTime() + exam.duration * 60000);
    if (now < start) return { text: "Upcoming", cls: "status-upcoming" };
    if (now > end)   return { text: "Expired",  cls: "status-expired"  };
    return { text: "Ongoing", cls: "status-ongoing" };
  };
  const isHindi = language === "HI";
  return (
    <>
      <style>{styles}</style>
      <div className="exam-wrapper">
        <div className="page-header">
          <div>
            <h2>📝 Manage Exams</h2>
            <div className="subtitle">Create, assign & manage typing exams for students</div>
          </div>
        </div>
        <div className="glass-card">
          <div className="section-title" style={{ color: "#6c63ff" }}>
            <span className="dot" style={{ background: "#6c63ff" }}></span>
            Create New Exam
          </div>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label-custom">Language</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className={`lang-tab ${language === "EN" ? "active" : ""}`} onClick={() => handleLanguageChange("EN")}>🇬🇧 EN</button>
                <button className={`lang-tab ${language === "HI" ? "active" : ""}`} onClick={() => handleLanguageChange("HI")}>🇮🇳 HI</button>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label-custom">Exam Date</label>
              <input type="date" className="form-control-custom" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label-custom">Start Time</label>
              <input type="time" className="form-control-custom" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label-custom">Duration (minutes)</label>
              <input type="number" className="form-control-custom" placeholder="e.g. 30" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label-custom">
                Typing Paragraph
                {isHindi && (
                  <span className="hindi-badge" style={{ marginLeft: "0.75rem", verticalAlign: "middle" }}>
                    ⌨️ InScript (Mangal) — हिंदी में टाइप करें
                  </span>
                )}
              </label>
              <textarea
                ref={paraRef}
                className={`form-control-custom ${isHindi ? "hindi-textarea hindi-border" : ""}`}
                rows="3"
                placeholder={
                  isHindi
                    ? "हिंदी paragraph यहाँ टाइप करें... (InScript कीबोर्ड सक्रिय)"
                    : "Enter the paragraph students will type during the exam..."
                }
                value={paragraph}
                onChange={isHindi ? undefined : e => setParagraph(e.target.value)}
                onKeyDown={isHindi ? handleHindiKeyDown : undefined}
                onPaste={isHindi ? (e) => e.preventDefault() : undefined}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.35rem", textAlign: "right" }}>
                {paragraph.length} characters
                {isHindi && paragraph.length > 0 && (
                  <span style={{ marginLeft: "0.75rem", color: "#f59e0b" }}>🇮🇳 Hindi paragraph ready</span>
                )}
              </div>
            </div>
          </div>
          <hr className="divider" />
          <div className="section-title" style={{ color: "#00d4aa" }}>
            <span className="dot" style={{ background: "#00d4aa" }}></span>
            Assign to Students
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div
              onClick={() => { setAssignToAll(!assignToAll); setSelectedStudents([]); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer",
                background: assignToAll ? "rgba(245,158,11,0.1)" : "var(--surface2)",
                border: `1.5px solid ${assignToAll ? "rgba(245,158,11,0.5)" : "var(--border)"}`,
                borderRadius: "10px", padding: "0.55rem 1rem", transition: "all 0.2s"
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: assignToAll ? "#f59e0b" : "transparent",
                border: `2px solid ${assignToAll ? "#f59e0b" : "var(--muted)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
              }}>
                {assignToAll && <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: assignToAll ? "#f59e0b" : "var(--muted)" }}>
                🌐 Assign to All Students
              </span>
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>— or select specific students below</span>
          </div>
          {!assignToAll && (
            <>
              <div className="student-selector-header">
                <label className="form-label-custom" style={{ marginBottom: 0 }}>
                  Select Students ({filteredStudents.length} available)
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {selectedStudents.length > 0 && (
                    <span className="selected-count">{selectedStudents.length} selected</span>
                  )}
                  <button className="btn-select-all" onClick={toggleAll}>
                    {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
              </div>
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="form-control-custom"
                  placeholder="Search by name or phone..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
              {students.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "1rem", textAlign: "center" }}>
                  No registered students found
                </div>
              ) : (
                <div className="student-grid">
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className={`student-chip ${selectedStudents.includes(student.id) ? "selected" : ""}`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      {student.image ? (
                        <img src={student.image} alt="" className="avatar" />
                      ) : (
                        <div className="avatar-placeholder">{student.username.charAt(0).toUpperCase()}</div>
                      )}
                      <div className="info">
                        <div className="name">{student.username}</div>
                        <div className="phone">{student.phone || "—"}</div>
                      </div>
                      <div className="check">
                        {selectedStudents.includes(student.id) && (
                          <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div style={{ marginTop: "1.25rem" }}>
            <button className="btn-create" onClick={createExam}>🚀 Create Exam</button>
          </div>
        </div>
        <div className="glass-card">
          <div className="section-title" style={{ color: "#8b83ff" }}>
            <span className="dot" style={{ background: "#8b83ff" }}></span>
            All Exams
            <span style={{
              marginLeft: "0.5rem", background: "rgba(108,99,255,0.15)",
              border: "1px solid rgba(108,99,255,0.3)", borderRadius: "20px",
              padding: "0.1rem 0.6rem", fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600
            }}>{exams.length}</span>
          </div>
          {exams.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <p>No exams created yet. Create your first exam above!</p>
            </div>
          ) : (
            <div className="row g-3">
              {exams.map((exam) => {
                const status = getStatus(exam);
                const assignedNames = exam.assigned_students
                  ? exam.assigned_students.split(",").map(n => n.trim()).filter(Boolean)
                  : [];
                return (
                  <div key={exam.id} className="col-md-6 col-xl-4">
                    <div className="exam-card">
                      <div className="exam-card-header">
                        <span className="exam-id">#{exam.id}</span>
                        <span className={`status-badge ${status.cls}`}>{status.text}</span>
                      </div>
                      <div className="exam-card-body">
                        <div
                          className="para-preview"
                          style={exam.language === "HI"
                            ? { fontFamily: "'Mangal','Noto Sans Devanagari',sans-serif", fontSize: "0.88rem", fontStyle: "normal" }
                            : {}}
                        >
                          "{exam.paragraph.substring(0, 100)}{exam.paragraph.length > 100 ? "…" : ""}"
                        </div>
                        <div className="info-row">
                          <span className="info-label">🌐 Lang</span>
                          <span className="info-value">{exam.language === "EN" ? "🇬🇧 English" : "🇮🇳 Hindi (InScript)"}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">📅 Date</span>
                          <span className="info-value">{exam.exam_date}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">⏰ Start</span>
                          <span className="info-value">{exam.start_time}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">⏱ Duration</span>
                          <span className="info-value">{exam.duration} min</span>
                        </div>
                        <div className="info-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <span className="info-label" style={{ marginBottom: "0.4rem" }}>👥 Assigned</span>
                          {exam.assign_to_all ? (
                            <span className="all-students-badge">🌐 All Students</span>
                          ) : assignedNames.length > 0 ? (
                            <div className="assigned-chips">
                              {assignedNames.slice(0, 4).map((name, i) => (
                                <span key={i} className="assigned-chip">{name}</span>
                              ))}
                              {assignedNames.length > 4 && (
                                <span className="assigned-chip">+{assignedNames.length - 4} more</span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>—</span>
                          )}
                        </div>
                      </div>
                      <div className="exam-card-footer">
                        <button className="btn-delete" onClick={() => deleteExam(exam.id)}>🗑 Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
