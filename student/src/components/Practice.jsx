import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import hindiKeyboardImg from "../assets/hindi keyboard.png";
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
  "\\": "ॉ", "|": "ऑ",
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
// ─── Build a reverse lookup: hindiChar → list of raw physical keys ──────────
// Each entry is { baseKey: string, needsShift: boolean }
// baseKey is always the UNSHIFTED physical key (e.g. "q", not "Q")
const HINDI_CHAR_TO_KEYS = {};
for (const [rawKey, hindiChar] of Object.entries(INSCRIPT_MAP)) {
  if (!HINDI_CHAR_TO_KEYS[hindiChar]) HINDI_CHAR_TO_KEYS[hindiChar] = [];
  // Determine if this rawKey is the shifted version
  const isUpperLetter = rawKey.length === 1 && rawKey >= "A" && rawKey <= "Z";
  const shiftedSymbols = new Set(["~","!","@","#","$","%","^","&","*","(",")",
    "_","+","{","}","|","<",">","?",":","\"",]);
  const isShiftedSymbol = shiftedSymbols.has(rawKey);
  const needsShift = isUpperLetter || isShiftedSymbol;
  // baseKey: unshifted physical key
  let baseKey;
  if (isUpperLetter) {
    baseKey = rawKey.toLowerCase();
  } else if (isShiftedSymbol) {
    const symbolToBase = {
      "~":"`","!":"1","@":"2","#":"3","$":"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",
      "_":"-","+":"=","{":"[","}":"]","|":"\\","<":",",">":".","?":"/",":":";","\"":"'",
    };
    baseKey = symbolToBase[rawKey] || rawKey;
  } else {
    baseKey = rawKey;
  }
  HINDI_CHAR_TO_KEYS[hindiChar].push({ baseKey, needsShift });
}
// Also map space → space (space is universal, not in INSCRIPT_MAP)
HINDI_CHAR_TO_KEYS[" "] = [{ baseKey: " ", needsShift: false }];
// English shifted symbol → base physical key
const EN_SHIFT_TO_BASE = {
  "~":"`","!":"1","@":"2","#":"3","$":"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",
  "_":"-","+":"=","{":"[","}":"]","|":"\\","<":",",">":".","?":"/",":":";","\"":"'",
};
// ─── Given the next character needed, return what physical keys to highlight ─
// Returns { baseKeys: Set<string>, needsShift: boolean }
function getRequiredKeys(nextChar, language) {
  if (!nextChar) return { baseKeys: new Set(), needsShift: false };
  if (language === "HI") {
    const entries = HINDI_CHAR_TO_KEYS[nextChar];
    if (!entries || entries.length === 0) {
      // Fallback: if it's a space or unknown, check
      if (nextChar === " ") return { baseKeys: new Set([" "]), needsShift: false };
      return { baseKeys: new Set(), needsShift: false };
    }
    const baseKeys = new Set(entries.map(e => e.baseKey));
    const needsShift = entries.some(e => e.needsShift);
    return { baseKeys, needsShift };
  } else {
    // English
    if (nextChar === " ") return { baseKeys: new Set([" "]), needsShift: false };
    // Uppercase letter
    if (nextChar >= "A" && nextChar <= "Z") {
      return { baseKeys: new Set([nextChar.toLowerCase()]), needsShift: true };
    }
    // Shifted symbol
    if (EN_SHIFT_TO_BASE[nextChar]) {
      return { baseKeys: new Set([EN_SHIFT_TO_BASE[nextChar]]), needsShift: true };
    }
    return { baseKeys: new Set([nextChar]), needsShift: false };
  }
}
// ─── On-Screen Keyboard Layout ─────────────────────────────────────────────
const EN_KEYBOARD_ROWS = [
  [
    { key: "`", shift: "~" }, { key: "1", shift: "!" }, { key: "2", shift: "@" },
    { key: "3", shift: "#" }, { key: "4", shift: "$" }, { key: "5", shift: "%" },
    { key: "6", shift: "^" }, { key: "7", shift: "&" }, { key: "8", shift: "*" },
    { key: "9", shift: "(" }, { key: "0", shift: ")" }, { key: "-", shift: "_" },
    { key: "=", shift: "+" }, { key: "Backspace", shift: "Backspace", wide: true, label: "⌫" },
  ],
  [
    { key: "Tab", shift: "Tab", wide: true, label: "Tab" },
    { key: "q", shift: "Q" }, { key: "w", shift: "W" }, { key: "e", shift: "E" },
    { key: "r", shift: "R" }, { key: "t", shift: "T" }, { key: "y", shift: "Y" },
    { key: "u", shift: "U" }, { key: "i", shift: "I" }, { key: "o", shift: "O" },
    { key: "p", shift: "P" }, { key: "[", shift: "{" }, { key: "]", shift: "}" },
    { key: "\\", shift: "|" },
  ],
  [
    { key: "CapsLock", shift: "CapsLock", wide: true, label: "Caps" },
    { key: "a", shift: "A" }, { key: "s", shift: "S" }, { key: "d", shift: "D" },
    { key: "f", shift: "F" }, { key: "g", shift: "G" }, { key: "h", shift: "H" },
    { key: "j", shift: "J" }, { key: "k", shift: "K" }, { key: "l", shift: "L" },
    { key: ";", shift: ":" }, { key: "'", shift: "\"" },
    { key: "Enter", shift: "Enter", wide: true, label: "Enter" },
  ],
  [
    { key: "Shift", shift: "Shift", wide: true, label: "⇧ Shift" },
    { key: "z", shift: "Z" }, { key: "x", shift: "X" }, { key: "c", shift: "C" },
    { key: "v", shift: "V" }, { key: "b", shift: "B" }, { key: "n", shift: "N" },
    { key: "m", shift: "M" }, { key: ",", shift: "<" }, { key: ".", shift: ">" },
    { key: "/", shift: "?" },
    { key: "Shift", shift: "Shift", wide: true, label: "⇧ Shift" },
  ],
  [
    { key: " ", shift: " ", extraWide: true, label: "Space" },
  ],
];
const HI_KEYBOARD_ROWS = [
  [
    { key: "`", shift: "~", hi: "़", hiShift: "ॐ" },
    { key: "1", shift: "!", hi: "१", hiShift: "!" },
    { key: "2", shift: "@", hi: "२", hiShift: "@" },
    { key: "3", shift: "#", hi: "३", hiShift: "#" },
    { key: "4", shift: "$", hi: "४", hiShift: "₹" },
    { key: "5", shift: "%", hi: "५", hiShift: "%" },
    { key: "6", shift: "^", hi: "६", hiShift: "^" },
    { key: "7", shift: "&", hi: "७", hiShift: "&" },
    { key: "8", shift: "*", hi: "८", hiShift: "*" },
    { key: "9", shift: "(", hi: "९", hiShift: "(" },
    { key: "0", shift: ")", hi: "०", hiShift: ")" },
    { key: "-", shift: "_", hi: "-", hiShift: "_" },
    { key: "=", shift: "+", hi: "ृ", hiShift: "ॄ" },
    { key: "Backspace", shift: "Backspace", wide: true, label: "⌫", hi: "⌫", hiShift: "⌫" },
  ],
  [
    { key: "Tab", shift: "Tab", wide: true, label: "Tab", hi: "Tab", hiShift: "Tab" },
    { key: "q", shift: "Q", hi: "ौ", hiShift: "औ" },
    { key: "w", shift: "W", hi: "ै", hiShift: "ऐ" },
    { key: "e", shift: "E", hi: "ा", hiShift: "आ" },
    { key: "r", shift: "R", hi: "ी", hiShift: "ई" },
    { key: "t", shift: "T", hi: "ू", hiShift: "ऊ" },
    { key: "y", shift: "Y", hi: "ब", hiShift: "भ" },
    { key: "u", shift: "U", hi: "ह", hiShift: "ङ" },
    { key: "i", shift: "I", hi: "ग", hiShift: "घ" },
    { key: "o", shift: "O", hi: "द", hiShift: "ध" },
    { key: "p", shift: "P", hi: "ज", hiShift: "झ" },
    { key: "[", shift: "{", hi: "ड", hiShift: "ढ" },
    { key: "]", shift: "}", hi: "़", hiShift: "ञ" },
    { key: "\\", shift: "|", hi: "ॉ", hiShift: "ऑ" },
  ],
  [
    { key: "CapsLock", shift: "CapsLock", wide: true, label: "Caps", hi: "Caps", hiShift: "Caps" },
    { key: "a", shift: "A", hi: "ो", hiShift: "ओ" },
    { key: "s", shift: "S", hi: "े", hiShift: "ए" },
    { key: "d", shift: "D", hi: "्", hiShift: "अ" },
    { key: "f", shift: "F", hi: "ि", hiShift: "इ" },
    { key: "g", shift: "G", hi: "ु", hiShift: "उ" },
    { key: "h", shift: "H", hi: "प", hiShift: "फ" },
    { key: "j", shift: "J", hi: "र", hiShift: "ऱ" },
    { key: "k", shift: "K", hi: "क", hiShift: "ख" },
    { key: "l", shift: "L", hi: "त", hiShift: "थ" },
    { key: ";", shift: ":", hi: "च", hiShift: "छ" },
    { key: "'", shift: "\"", hi: "ट", hiShift: "ठ" },
    { key: "Enter", shift: "Enter", wide: true, label: "Enter", hi: "Enter", hiShift: "Enter" },
  ],
  [
    { key: "Shift", shift: "Shift", wide: true, label: "⇧", hi: "⇧", hiShift: "⇧" },
    { key: "z", shift: "Z", hi: "ॆ", hiShift: "ऍ" },
    { key: "x", shift: "X", hi: "ँ", hiShift: "ः" },
    { key: "c", shift: "C", hi: "म", hiShift: "ण" },
    { key: "v", shift: "V", hi: "न", hiShift: "ऩ" },
    { key: "b", shift: "B", hi: "व", hiShift: "ऴ" },
    { key: "n", shift: "N", hi: "ल", hiShift: "ळ" },
    { key: "m", shift: "M", hi: "स", hiShift: "श" },
    { key: ",", shift: "<", hi: ",", hiShift: "ष" },
    { key: ".", shift: ">", hi: "।", hiShift: "." },
    { key: "/", shift: "?", hi: "य", hiShift: "?" },
    { key: "Shift", shift: "Shift", wide: true, label: "⇧", hi: "⇧", hiShift: "⇧" },
  ],
  [
    { key: " ", shift: " ", extraWide: true, label: "Space", hi: "Space", hiShift: "Space" },
  ],
];
// ─── Local storage helpers ──────────────────────────────────────────────────
const getStudentId = () => {
  try {
    const student = JSON.parse(localStorage.getItem("studentData"));
    return student ? student.id : "guest";
  } catch { return "guest"; }
};
const getLSKey   = () => `practice_session_${getStudentId()}`;
const getBestKey = () => `practice_best_${getStudentId()}`;
function saveSession(data)  { try { localStorage.setItem(getLSKey(), JSON.stringify(data)); } catch {} }
function loadSession()      { try { const r = localStorage.getItem(getLSKey()); return r ? JSON.parse(r) : null; } catch { return null; } }
function clearSession()     { try { localStorage.removeItem(getLSKey()); } catch {} }
function loadBestResult()   { try { const r = localStorage.getItem(getBestKey()); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveBestResult(result) {
  try {
    const existing = loadBestResult();
    if (!existing || result.score >= existing.score) {
      localStorage.setItem(getBestKey(), JSON.stringify(result));
      return true;
    }
    return false;
  } catch { return false; }
}
// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", fontFamily: "'Segoe UI', sans-serif", color: "#fff", padding: "2rem 1rem" },
  activePage: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", fontFamily: "'Segoe UI', sans-serif", color: "#fff", padding: "1.5rem 1rem" },
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 99998,
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#fff",
    overflowY: "auto",
    padding: "1.5rem 2rem",
  },
  card: { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "2rem", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
  cardFullscreen: { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
  title: { fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.25rem" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", marginBottom: "1.8rem" },
  langBtn: (active) => ({ padding: "0.45rem 1.4rem", borderRadius: "50px", border: "none", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s", background: active ? "linear-gradient(135deg, #a78bfa, #60a5fa)" : "rgba(255,255,255,0.1)", color: "#fff", boxShadow: active ? "0 4px 15px rgba(167,139,250,0.4)" : "none" }),
  statBox: (color) => ({ background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}44`, borderRadius: "14px", padding: "0.8rem 1rem", textAlign: "center", minWidth: "80px", flex: 1 }),
  statBoxFS: (color) => ({ background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}44`, borderRadius: "14px", padding: "1rem 1.4rem", textAlign: "center", minWidth: "100px", flex: 1 }),
  statVal: { fontSize: "1.5rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 },
  statValFS: { fontSize: "1.9rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 },
  statLabel: { fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" },
  statLabelFS: { fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" },
  progressBar: { height: "6px", borderRadius: "99px", background: "rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: "1.2rem" },
  progressBarFS: { height: "8px", borderRadius: "99px", background: "rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: "1.5rem" },
  progressFill: (pct) => ({ height: "100%", width: `${pct}%`, borderRadius: "99px", background: pct > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : pct > 50 ? "linear-gradient(90deg, #fbbf24, #f59e0b)" : "linear-gradient(90deg, #34d399, #60a5fa)", transition: "width 0.5s ease, background 0.5s ease" }),
  textDisplay: { background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "1.2rem 1.5rem", fontSize: "1.25rem", lineHeight: "2", letterSpacing: "0.03em", minHeight: "80px", marginBottom: "1rem", textAlign: "left", wordBreak: "break-word" },
  textDisplayFS: { background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "1.5rem 2rem", fontSize: "1.6rem", lineHeight: "2.2", letterSpacing: "0.03em", minHeight: "100px", marginBottom: "1.2rem", textAlign: "left", wordBreak: "break-word" },
  inputBox: { width: "100%", background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "0.9rem 1.2rem", fontSize: "1.1rem", color: "#fff", outline: "none", transition: "border-color 0.2s", caretColor: "#a78bfa" },
  inputBoxFS: { width: "100%", background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.15)", borderRadius: "14px", padding: "1.1rem 1.5rem", fontSize: "1.35rem", color: "#fff", outline: "none", transition: "border-color 0.2s", caretColor: "#a78bfa" },
  inputBoxFocus: { borderColor: "#a78bfa", boxShadow: "0 0 0 3px rgba(167,139,250,0.2)" },
  primaryBtn: { background: "linear-gradient(135deg, #a78bfa, #60a5fa)", border: "none", borderRadius: "50px", padding: "0.6rem 2rem", fontWeight: 700, fontSize: "1rem", color: "#fff", cursor: "pointer", boxShadow: "0 4px 15px rgba(167,139,250,0.35)", transition: "transform 0.15s, box-shadow 0.15s" },
  dangerBtn:  { background: "linear-gradient(135deg, #f87171, #ef4444)", border: "none", borderRadius: "50px", padding: "0.6rem 2rem", fontWeight: 700, fontSize: "1rem", color: "#fff", cursor: "pointer", boxShadow: "0 4px 15px rgba(239,68,68,0.3)", transition: "transform 0.15s" },
  restartBtn: { background: "linear-gradient(135deg, #fbbf24, #f59e0b)", border: "none", borderRadius: "50px", padding: "0.6rem 2rem", fontWeight: 700, fontSize: "1rem", color: "#fff", cursor: "pointer", boxShadow: "0 4px 15px rgba(251,191,36,0.3)", transition: "transform 0.15s" },
  resumeBtn:  { background: "linear-gradient(135deg, #34d399, #059669)", border: "none", borderRadius: "50px", padding: "0.6rem 2rem", fontWeight: 700, fontSize: "1rem", color: "#fff", cursor: "pointer", boxShadow: "0 4px 15px rgba(52,211,153,0.35)", transition: "transform 0.15s, box-shadow 0.15s" },
  levelBadge: { display: "inline-block", background: "linear-gradient(135deg, #a78bfa33, #60a5fa33)", border: "1px solid #a78bfa55", borderRadius: "50px", padding: "0.2rem 0.9rem", fontSize: "0.8rem", fontWeight: 700, color: "#a78bfa", marginBottom: "1rem" },
  levelBadgeFS: { display: "inline-block", background: "linear-gradient(135deg, #a78bfa33, #60a5fa33)", border: "1px solid #a78bfa55", borderRadius: "50px", padding: "0.3rem 1.2rem", fontSize: "1rem", fontWeight: 700, color: "#a78bfa", marginBottom: "1rem" },
  pausedBanner: { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: "12px", padding: "0.7rem 1.2rem", color: "#fbbf24", fontWeight: 600, textAlign: "center", marginBottom: "1rem", fontSize: "0.95rem" },
  liveDot: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#34d399", marginRight: 6, animation: "livePulse 1.2s ease-in-out infinite", verticalAlign: "middle" },
  hindiBadge: { display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "50px", padding: "0.3rem 1rem", fontSize: "0.82rem", fontWeight: 700, color: "#fbbf24", marginBottom: "0.8rem" },
  bestCard: { background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(96,165,250,0.08))", border: "1px solid rgba(167,139,250,0.35)", borderRadius: "20px", padding: "1.5rem 2rem", marginTop: "1.5rem", boxShadow: "0 4px 24px rgba(167,139,250,0.15)" },
  bestTitle: { fontSize: "1.1rem", fontWeight: 800, color: "#a78bfa", marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "8px" },
  bestSubtitle: { fontSize: "0.78rem", color: "rgba(255,255,255,0.38)", marginBottom: "1rem" },
  newBestBadge: { display: "inline-block", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#1a1a1a", fontWeight: 800, fontSize: "0.72rem", borderRadius: "50px", padding: "0.15rem 0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", animation: "newBestPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" },
};
const hindiFont = { fontFamily: "'Mangal', 'Noto Sans Devanagari', 'Arial Unicode MS', sans-serif", fontSize: "1.3rem" };
const hindiFontFS = { fontFamily: "'Mangal', 'Noto Sans Devanagari', 'Arial Unicode MS', sans-serif", fontSize: "1.6rem" };
// ─── On-Screen Keyboard Component ───────────────────────────────────────────
function OnScreenKeyboard({ language, word, typed, pressedKey, pressedCorrect, isShiftActive, isFullscreen }) {
  const rows = language === "HI" ? HI_KEYBOARD_ROWS : EN_KEYBOARD_ROWS;
  // Figure out what the next character to type is
  const nextChar = (word && typed.length < word.length) ? word[typed.length] : null;
  // Get which physical base keys are required, and whether shift is needed
  const { baseKeys: requiredBaseKeys, needsShift } = nextChar
    ? getRequiredKeys(nextChar, language)
    : { baseKeys: new Set(), needsShift: false };
  const keyHeight = isFullscreen ? 54 : 42;
  const keyMinWidth = isFullscreen ? 48 : 36;
  const keyWideWidth = isFullscreen ? 80 : 64;
  const keyExtraWideWidth = isFullscreen ? 240 : 180;
  const keyFontSize = isFullscreen ? "0.95rem" : "0.82rem";
  const keyHindiSize = isFullscreen ? "0.92rem" : "0.78rem";
  const keySpecialSize = isFullscreen ? "0.8rem" : "0.65rem";
  const rowGap = isFullscreen ? 6 : 4;
  const rowMb = isFullscreen ? 6 : 4;
  const getKeyLabel = (keyDef) => {
    if (language === "HI") {
      if (keyDef.label && ["⌫","Tab","Caps","Enter","⇧","Space"].includes(keyDef.label)) return keyDef.label;
      return isShiftActive ? (keyDef.hiShift || keyDef.hiShift) : (keyDef.hi || keyDef.key);
    }
    if (keyDef.label) return keyDef.label;
    return isShiftActive ? keyDef.shift : keyDef.key;
  };
  const getKeySubLabel = (keyDef) => {
    if (["Backspace","Tab","CapsLock","Enter","Shift"," "].includes(keyDef.key)) return null;
    if (language === "HI") {
      return isShiftActive ? keyDef.hi : keyDef.hiShift;
    }
    return isShiftActive ? keyDef.key : keyDef.shift;
  };
  // ── Is this key the one that needs to be pressed next? (highlight red) ──
  const isKeyRequired = (keyDef) => {
    // The Shift key itself is required when the next char needs shift
    if (keyDef.key === "Shift") return needsShift;
    // Space key: keyDef.key === " "
    // All other keys: match against requiredBaseKeys using the UNSHIFTED key string
    return requiredBaseKeys.has(keyDef.key);
  };
  // ── Is this key being pressed right now? ──
  // pressedKey is always stored as the UNSHIFTED physical key (e.g. "q", "=", " ")
  const isKeyPressed = (keyDef) => {
    if (!pressedKey) return false;
    // For Shift key, check if pressedKey === "Shift"
    if (keyDef.key === "Shift") return pressedKey === "Shift";
    // Match the base (unshifted) key
    return keyDef.key === pressedKey;
  };
  return (
    <div style={{
      background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "18px",
      padding: isFullscreen ? "20px 16px 16px" : "16px 12px 12px",
      marginBottom: "1.2rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      userSelect: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: isFullscreen ? 14 : 10 }}>
        <span style={{ fontSize: isFullscreen ? "0.85rem" : "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          ⌨️ {language === "HI" ? "InScript Keyboard" : "English Keyboard"}
        </span>
        {needsShift && (
          <span style={{ fontSize: isFullscreen ? "0.8rem" : "0.68rem", background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.5)", color: "#fbbf24", borderRadius: "50px", padding: "1px 8px", fontWeight: 700, animation: "shiftPulse 0.8s ease-in-out infinite" }}>
            ⇧ Press Shift
          </span>
        )}
      </div>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} style={{
          display: "flex",
          justifyContent: "center",
          gap: `${rowGap}px`,
          marginBottom: `${rowMb}px`,
          paddingLeft: rowIdx === 1 ? (isFullscreen ? "26px" : "20px") : rowIdx === 2 ? (isFullscreen ? "38px" : "30px") : rowIdx === 3 ? (isFullscreen ? "52px" : "40px") : "0",
        }}>
          {row.map((keyDef, keyIdx) => {
            const required = isKeyRequired(keyDef);
            const pressed  = isKeyPressed(keyDef);
            const isCorrectPress = pressed && pressedCorrect;
            const isWrongPress   = pressed && !pressedCorrect;
            let bg = "rgba(255,255,255,0.07)";
            let border = "1px solid rgba(255,255,255,0.12)";
            let color = "rgba(255,255,255,0.7)";
            let boxShadow = "none";
            let animation = "none";
            let transform = "scale(1)";
            if (required && !pressed) {
              bg = "rgba(248,113,113,0.18)";
              border = "2px solid #f87171";
              color = "#f87171";
              boxShadow = "0 0 12px rgba(248,113,113,0.5), 0 0 24px rgba(248,113,113,0.2)";
              animation = "keyBlink 0.9s ease-in-out infinite";
            }
            if (isCorrectPress) {
              bg = "rgba(52,211,153,0.35)";
              border = "2px solid #34d399";
              color = "#34d399";
              boxShadow = "0 0 18px rgba(52,211,153,0.7), 0 0 36px rgba(52,211,153,0.3)";
              animation = "keyPressCorrect 0.3s ease both";
              transform = "scale(0.93)";
            } else if (isWrongPress) {
              bg = "rgba(248,113,113,0.35)";
              border = "2px solid #f87171";
              color = "#f87171";
              boxShadow = "0 0 18px rgba(248,113,113,0.7)";
              animation = "keyPressWrong 0.3s ease both";
              transform = "scale(0.93)";
            } else if (pressed) {
              transform = "scale(0.93)";
              bg = "rgba(167,139,250,0.25)";
            }
            const specialKeys = ["Backspace","Tab","CapsLock","Enter","Shift"," "];
            const isSpecial = specialKeys.includes(keyDef.key);
            const subLabel = getKeySubLabel(keyDef);
            return (
              <div
                key={keyIdx}
                style={{
                  position: "relative",
                  minWidth: keyDef.extraWide ? `${keyExtraWideWidth}px` : keyDef.wide ? `${keyWideWidth}px` : `${keyMinWidth}px`,
                  height: `${keyHeight}px`,
                  borderRadius: "8px",
                  background: bg,
                  border,
                  color,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isSpecial ? keySpecialSize : language === "HI" ? keyHindiSize : keyFontSize,
                  fontWeight: required ? 800 : 600,
                  cursor: "default",
                  transition: "background 0.15s, border 0.15s, box-shadow 0.15s, transform 0.1s",
                  boxShadow,
                  animation,
                  transform,
                  fontFamily: language === "HI" && !isSpecial ? "'Mangal','Noto Sans Devanagari',sans-serif" : "inherit",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <span style={{ lineHeight: 1.1, fontSize: isSpecial ? keySpecialSize : "inherit" }}>
                  {getKeyLabel(keyDef)}
                </span>
                {subLabel && !isSpecial && (
                  <span style={{
                    position: "absolute",
                    top: "2px",
                    right: "3px",
                    fontSize: isFullscreen ? "0.6rem" : "0.52rem",
                    color: required ? color : "rgba(255,255,255,0.35)",
                    fontFamily: language === "HI" ? "'Mangal','Noto Sans Devanagari',sans-serif" : "inherit",
                    lineHeight: 1,
                  }}>
                    {subLabel}
                  </span>
                )}
                {required && (
                  <span style={{
                    position: "absolute",
                    bottom: "2px",
                    width: isFullscreen ? "5px" : "4px",
                    height: isFullscreen ? "5px" : "4px",
                    borderRadius: "50%",
                    background: "#f87171",
                    animation: "dotPulse 0.9s ease-in-out infinite",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
// ─── Custom Modal ────────────────────────────────────────────────────────────
function LevelModal({ show, level, score, onNext, onRestart }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b, #312e81)",
        borderRadius: "20px", padding: "2.5rem 2rem",
        textAlign: "center", color: "#fff",
        maxWidth: "420px", width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        animation: "fadeInUp 0.3s ease both",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⏰</div>
        <h4 style={{ fontWeight: 800, color: "#a78bfa", marginBottom: "0.5rem" }}>
          Level {level} Complete!
        </h4>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.8rem" }}>
          Time&apos;s up! Score: <strong style={{ color: "#a78bfa" }}>{score}</strong>
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button style={S.primaryBtn} onClick={onNext}>Next Level →</button>
          <button style={{ ...S.restartBtn }} onClick={onRestart}>🔄 Restart Level</button>
        </div>
      </div>
    </div>
  );
}
function HighlightedText({ word, typed, isHindi, isFullscreen }) {
  const baseStyle = isFullscreen
    ? { ...S.textDisplayFS, ...(isHindi ? hindiFontFS : {}) }
    : { ...S.textDisplay, ...(isHindi ? hindiFont : {}) };
  return (
    <div style={baseStyle}>
      {word.split("").map((char, i) => {
        let color, bg;
        if (i < typed.length) {
          color = typed[i] === char ? "#34d399" : "#f87171";
          bg    = typed[i] === char ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.15)";
        } else if (i === typed.length) { color = "#fff"; bg = "rgba(167,139,250,0.25)"; }
        else { color = "rgba(255,255,255,0.55)"; bg = "transparent"; }
        return (
          <span key={i} style={{ color, background: bg, borderRadius: "3px", padding: "0 1px", transition: "color 0.1s, background 0.1s", ...(i === typed.length ? { borderBottom: "2px solid #a78bfa" } : {}) }}>
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </div>
  );
}
function StatBox({ label, value, color, isFullscreen }) {
  return (
    <div style={isFullscreen ? S.statBoxFS(color) : S.statBox(color)}>
      <div style={isFullscreen ? S.statValFS : S.statVal}>{value}</div>
      <div style={isFullscreen ? S.statLabelFS : S.statLabel}>{label}</div>
    </div>
  );
}
function BestResultCard({ best, isNewBest }) {
  if (!best) return null;
  const dateStr = best.date
    ? new Date(best.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  return (
    <div style={S.bestCard} className="practice-fade-in">
      <div style={S.bestTitle}>
        🏆 Your Personal Best
        {isNewBest && <span style={S.newBestBadge}>🎉 New Best!</span>}
      </div>
      <div style={S.bestSubtitle}>
        {best.language === "HI" ? "Hindi" : "English"} &nbsp;·&nbsp; Level {best.level}
        {dateStr && <> &nbsp;·&nbsp; {dateStr}</>}
      </div>
      <div className="d-flex gap-2 flex-wrap">
        <StatBox label="Best Score" value={best.score} color="#a78bfa" />
        <StatBox label="Level"      value={best.level} color="#60a5fa" />
      </div>
    </div>
  );
}
// ─── Main Practice Component ─────────────────────────────────────────────────
export default function Practice() {
  const [language, setLanguage]         = useState("EN");
  const [word, setWord]                 = useState("");
  const [typed, setTyped]               = useState("");
  const [score, setScore]               = useState(0);
  const [level, setLevel]               = useState(1);
  const [time, setTime]                 = useState(0);
  const [started, setStarted]           = useState(false);
  const [paused, setPaused]             = useState(false);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars]     = useState(0);
  const [showModal, setShowModal]       = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [wordFlash, setWordFlash]       = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bestResult, setBestResult]     = useState(null);
  const [isNewBest, setIsNewBest]       = useState(false);
  // pressedKey = the UNSHIFTED physical key string, e.g. "q", "=", "[", " ", "Shift"
  const [pressedKey, setPressedKey]         = useState(null);
  const [pressedCorrect, setPressedCorrect] = useState(false);
  const [isShiftActive, setIsShiftActive]   = useState(false);
  const inputRef = useRef(null);
  const timeRef         = useRef(0);
  const startedRef      = useRef(false);
  const pausedRef       = useRef(false);
  const scoreRef        = useRef(0);
  const levelRef        = useRef(1);
  const wordRef         = useRef("");
  const typedRef        = useRef("");
  const correctCharsRef = useRef(0);
  const totalCharsRef   = useRef(0);
  const languageRef     = useRef("EN");
  const loginIdRef      = useRef(null);
  const pressedKeyTimer = useRef(null);
  useEffect(() => { timeRef.current         = time;         }, [time]);
  useEffect(() => { startedRef.current      = started;      }, [started]);
  useEffect(() => { pausedRef.current       = paused;       }, [paused]);
  useEffect(() => { scoreRef.current        = score;        }, [score]);
  useEffect(() => { levelRef.current        = level;        }, [level]);
  useEffect(() => { wordRef.current         = word;         }, [word]);
  useEffect(() => { typedRef.current        = typed;        }, [typed]);
  useEffect(() => { correctCharsRef.current = correctChars; }, [correctChars]);
  useEffect(() => { totalCharsRef.current   = totalChars;   }, [totalChars]);
  useEffect(() => { languageRef.current     = language;     }, [language]);
  const getLevelTimeLimit = () => 300;
  const timePct = Math.min((time / getLevelTimeLimit()) * 100, 100);
  const calcWPM = (cc, t) => { const m = t / 60; return m <= 0 ? 0 : Math.round((cc / 5) / m); };
  const calcAcc = (cc, tc) => tc === 0 ? 0 : Math.round((cc / tc) * 100);
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  };
  const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
  };
  // ── Inject CSS animations ──────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes flashGreen    { 0% { background: rgba(52,211,153,0.25); } 100% { background: transparent; } }
      @keyframes fadeInUp      { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes livePulse     { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(1.4); } }
      @keyframes newBestPop    { 0% { opacity:0; transform:scale(0.6); } 100% { opacity:1; transform:scale(1); } }
      @keyframes keyBlink      { 0%,100% { box-shadow: 0 0 10px rgba(248,113,113,0.6), 0 0 20px rgba(248,113,113,0.25); opacity:1; } 50% { box-shadow: 0 0 22px rgba(248,113,113,0.9), 0 0 40px rgba(248,113,113,0.4); opacity:0.75; } }
      @keyframes keyPressCorrect { 0% { transform:scale(1); } 50% { transform:scale(0.88); box-shadow: 0 0 24px rgba(52,211,153,0.9); } 100% { transform:scale(1); } }
      @keyframes keyPressWrong   { 0% { transform:scale(1); } 25% { transform:scale(0.92) rotate(-2deg); } 75% { transform:scale(0.92) rotate(2deg); } 100% { transform:scale(1); } }
      @keyframes dotPulse      { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.6); opacity:0.5; } }
      @keyframes shiftPulse    { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      @keyframes kbSlideIn     { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      .practice-fade-in        { animation: fadeInUp 0.5s ease both; }
      .practice-fade-in-delay  { animation: fadeInUp 0.5s ease 0.15s both; }
      .kb-slide-in             { animation: kbSlideIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both; }
      /* Hide sidebar & nav when practice overlay is active */
      body.practice-fullscreen-active .sidebar,
      body.practice-fullscreen-active nav,
      body.practice-fullscreen-active .navbar,
      body.practice-fullscreen-active aside,
      body.practice-fullscreen-active [class*="sidebar"],
      body.practice-fullscreen-active [class*="Sidebar"],
      body.practice-fullscreen-active [class*="nav-"],
      body.practice-fullscreen-active [id*="sidebar"],
      body.practice-fullscreen-active [id*="Sidebar"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  // ── Add/remove body class to hide sidebar when overlay is active ───────────
  useEffect(() => {
    if (started && isFullscreen) {
      document.body.classList.add("practice-fullscreen-active");
    } else {
      document.body.classList.remove("practice-fullscreen-active");
    }
    return () => document.body.classList.remove("practice-fullscreen-active");
  }, [started, isFullscreen]);
  // ── Fullscreen change handler ──────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isFull);
      if (!isFull && startedRef.current && !pausedRef.current) {
        setPaused(true);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    document.addEventListener("mozfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
      document.removeEventListener("mozfullscreenchange", handler);
    };
  }, []);
  // ── Load best result ───────────────────────────────────────────────────────
  useEffect(() => {
    const best = loadBestResult();
    if (best) setBestResult(best);
  }, []);
  // ── Resume saved session ───────────────────────────────────────────────────
  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setLanguage(s.language || "EN");
    setWord(s.word || "");
    setTyped(s.typed || "");
    setScore(s.score || 0);
    setLevel(s.level || 1);
    setTime(s.time || 0);
    setCorrectChars(s.correctChars || 0);
    setTotalChars(s.totalChars || 0);
    if (s.login_id) loginIdRef.current = s.login_id;
    setStarted(true);
    setPaused(true);
  }, []);
  // ── Auto-save session ──────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (!startedRef.current) return;
      saveSession({
        language: languageRef.current, word: wordRef.current, typed: typedRef.current,
        score: scoreRef.current, level: levelRef.current, time: timeRef.current,
        correctChars: correctCharsRef.current, totalChars: totalCharsRef.current,
        login_id: loginIdRef.current,
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  // ── Live practice sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(async () => {
      if (!startedRef.current || pausedRef.current) return;
      const lid = loginIdRef.current;
      if (!lid) return;
      try {
        await axios.post("http://https://typing-portal-es53.onrender.com/api/live-practice", {
          login_id:      lid,
          language:      languageRef.current,
          score:         scoreRef.current,
          level_reached: levelRef.current,
          wpm:           calcWPM(correctCharsRef.current, timeRef.current),
          accuracy:      calcAcc(correctCharsRef.current, totalCharsRef.current),
        });
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(iv);
  }, []);
  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || paused) return;
    const iv = setInterval(() => setTime(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [started, paused]);
  // ── Time limit check ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || paused) return;
    if (time >= getLevelTimeLimit()) {
      setPaused(true);
      setShowModal(true);
    }
  }, [time, started, paused]);
  // ── Shift key tracking (global) ────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => { if (e.key === "Shift") setIsShiftActive(true); };
    const onUp   = (e) => { if (e.key === "Shift") setIsShiftActive(false); };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
    };
  }, []);
  const loadWord = useCallback(async (lang, lvl) => {
    try {
      const res = await axios.get(`http://https://typing-portal-es53.onrender.com/practice-text?language=${lang}&level=${lvl}`);
      if (res.data.length > 0) setWord(res.data[0].content);
      setTyped("");
    } catch (e) { console.log(e); }
  }, []);
  const createLoginActivity = async (lang) => {
    try {
      const raw = localStorage.getItem("studentData");
      if (!raw) return null;
      const student = JSON.parse(raw);
      const res = await axios.post("http://https://typing-portal-es53.onrender.com/student-login-activity", {
        student_id: student.id,
        username:   student.username,
        language:   lang || languageRef.current,
      });
      if (res.data?.login_id) {
        loginIdRef.current = res.data.login_id;
        return res.data.login_id;
      }
    } catch (e) { console.log("createLoginActivity error:", e); }
    return null;
  };
  const trySaveBest = (finalScore, finalLevel, finalWPM, finalAccuracy, lang) => {
    if (finalScore === 0 && finalWPM === 0) return;
    const result = {
      score: finalScore, level: finalLevel,
      wpm: finalWPM, accuracy: finalAccuracy,
      language: lang, date: new Date().toISOString(),
    };
    const isNew = saveBestResult(result);
    setBestResult(loadBestResult());
    setIsNewBest(isNew);
    if (isNew) setTimeout(() => setIsNewBest(false), 8000);
  };
  // ── flashKey: ALWAYS call with the UNSHIFTED physical key ─────────────────
  // Examples: "q" (not "Q"), "=" (not "+"), "[" (not "{"), " " for space
  const flashKey = useCallback((baseKey, isCorrect) => {
    setPressedKey(baseKey);
    setPressedCorrect(isCorrect);
    if (pressedKeyTimer.current) clearTimeout(pressedKeyTimer.current);
    pressedKeyTimer.current = setTimeout(() => {
      setPressedKey(null);
      setPressedCorrect(false);
    }, 300);
  }, []);
  // Helper: convert any pressed key to its UNSHIFTED physical base key
  const toBaseKey = (eKey, eShiftKey) => {
    if (eKey === " ") return " ";
    if (eKey === "Shift") return "Shift";
    if (eKey === "Backspace") return "Backspace";
    if (eKey === "Delete") return "Delete";
    // Shifted uppercase letter: "Q" → "q"
    if (eShiftKey && eKey.length === 1 && eKey >= "A" && eKey <= "Z") {
      return eKey.toLowerCase();
    }
    // Shifted symbol: "+" → "=", "{" → "[", etc.
    if (eShiftKey && eKey.length === 1) {
      const symbolMap = {
        "~":"`","!":"1","@":"2","#":"3","$":"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",
        "_":"-","+":"=","{":"[","}":"]","|":"\\","<":",",">":".","?":"/",":":";","\"":"'",
      };
      if (symbolMap[eKey]) return symbolMap[eKey];
    }
    return eKey;
  };
  // ── Start ──────────────────────────────────────────────────────────────────
  const startPractice = async () => {
    clearSession();
    setScore(0); setLevel(1); setTime(0); setCorrectChars(0); setTotalChars(0);
    setTyped(""); setWordFlash(false); setPaused(false); setStarted(true);
    setShowModal(false); setIsNewBest(false);
    setPressedKey(null);
    enterFullscreen();
    await createLoginActivity(language);
    try {
      const res = await axios.get(`http://https://typing-portal-es53.onrender.com/practice-text?language=${language}&level=1`);
      if (res.data.length > 0) setWord(res.data[0].content);
    } catch (e) { console.log(e); }
    setTimeout(() => inputRef.current?.focus(), 200);
  };
  const resumePractice = async () => {
    await createLoginActivity(languageRef.current);
    setPaused(false);
    enterFullscreen();
    setTimeout(() => inputRef.current?.focus(), 200);
  };
  const restartLevel = async () => {
    setShowModal(false);
    setTime(0); setTyped(""); setCorrectChars(0); setTotalChars(0); setPaused(false);
    await loadWord(language, level);
    setTimeout(() => inputRef.current?.focus(), 200);
  };
  const nextLevel = async () => {
    setShowModal(false);
    if (level < 10) {
      const n = level + 1;
      setLevel(n); setTime(0); setTyped(""); setPaused(false);
      await loadWord(language, n);
    } else {
      finishPractice();
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };
  // ── Hindi keydown handler ──────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (languageRef.current !== "HI") return;
    if (pausedRef.current) return;
    const navKeys = [
      "ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
      "Home","End","Tab","Escape","Control","Alt","Meta",
      "CapsLock","PageUp","PageDown",
      "F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12",
    ];
    if (navKeys.includes(e.key)) return;
    if (e.key === "Shift") return;
    if (e.key === "Backspace") {
      e.preventDefault();
      flashKey("Backspace", true);
      const input = inputRef.current;
      if (!input) return;
      const start = input.selectionStart ?? typedRef.current.length;
      const end   = input.selectionEnd   ?? typedRef.current.length;
      const current = typedRef.current;
      let newValue;
      if (start !== end) { newValue = current.slice(0, start) + current.slice(end); }
      else if (start > 0) {
        const chars = Array.from(current);
        const bytePos = [...current.slice(0, start)].length;
        chars.splice(bytePos - 1, 1);
        newValue = chars.join("");
      } else { return; }
      setTyped(newValue); typedRef.current = newValue;
      let correct = 0;
      for (let i = 0; i < newValue.length; i++) { if (newValue[i] === wordRef.current[i]) correct++; }
      setCorrectChars(correct); correctCharsRef.current = correct;
      const newCursor = start !== end ? start : Math.max(0, start - 1);
      setTimeout(() => { input.selectionStart = newCursor; input.selectionEnd = newCursor; }, 0);
      return;
    }
    if (e.key === "Delete") {
      e.preventDefault();
      flashKey("Delete", true);
      const input = inputRef.current;
      if (!input) return;
      const start = input.selectionStart ?? typedRef.current.length;
      const end   = input.selectionEnd   ?? typedRef.current.length;
      const current = typedRef.current;
      let newValue;
      if (start !== end) { newValue = current.slice(0, start) + current.slice(end); }
      else if (start < current.length) {
        const chars = Array.from(current);
        const bytePos = Array.from(current.slice(0, start)).length;
        chars.splice(bytePos, 1);
        newValue = chars.join("");
      } else { return; }
      setTyped(newValue); typedRef.current = newValue;
      let correct = 0;
      for (let i = 0; i < newValue.length; i++) { if (newValue[i] === wordRef.current[i]) correct++; }
      setCorrectChars(correct); correctCharsRef.current = correct;
      setTimeout(() => { input.selectionStart = start; input.selectionEnd = start; }, 0);
      return;
    }
    e.preventDefault();
    // Convert e.key to Hindi character
    const hindiChar = toHindi(e.key);
    const currentTyped = typedRef.current;
    const currentWord  = wordRef.current;
    const isCorrect    = hindiChar === currentWord[currentTyped.length];
    // Always flash the UNSHIFTED physical base key
    flashKey(toBaseKey(e.key, e.shiftKey), isCorrect);
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end   = input.selectionEnd   ?? input.value.length;
    const current = typedRef.current;
    const newValue = current.slice(0, start) + hindiChar + current.slice(end);
    setTyped(newValue); typedRef.current = newValue;
    if (newValue.length > totalCharsRef.current) { setTotalChars(newValue.length); totalCharsRef.current = newValue.length; }
    let correct = 0;
    for (let i = 0; i < newValue.length; i++) { if (newValue[i] === wordRef.current[i]) correct++; }
    setCorrectChars(correct); correctCharsRef.current = correct;
    setTimeout(() => { input.selectionStart = start + hindiChar.length; input.selectionEnd = start + hindiChar.length; }, 0);
    if (newValue === wordRef.current) {
      setScore(p => p + 10); setWordFlash(true);
      setTimeout(() => setWordFlash(false), 400);
      loadWord(languageRef.current, levelRef.current);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [loadWord, flashKey]);
  // ── English change handler ─────────────────────────────────────────────────
  const handleChange = async (e) => {
    if (paused) return;
    if (language === "HI") return;
    const value = e.target.value;
    if (value.length > typed.length) {
      const newChar   = value[value.length - 1];
      const isCorrect = newChar === word[value.length - 1];
      // Derive the unshifted base key from the typed character
      let baseKey;
      if (newChar === " ") {
        baseKey = " ";
      } else if (newChar >= "A" && newChar <= "Z") {
        baseKey = newChar.toLowerCase();
      } else if (EN_SHIFT_TO_BASE[newChar]) {
        baseKey = EN_SHIFT_TO_BASE[newChar];
      } else {
        baseKey = newChar;
      }
      flashKey(baseKey, isCorrect);
    }
    setTyped(value);
    if (value.length > totalChars) setTotalChars(value.length);
    let correct = 0;
    for (let i = 0; i < value.length; i++) { if (value[i] === word[i]) correct++; }
    setCorrectChars(correct);
    if (value === word) {
      setScore(p => p + 10); setWordFlash(true);
      setTimeout(() => setWordFlash(false), 400);
      await loadWord(language, level);
      inputRef.current?.focus();
    }
  };
  const savePractice = async () => {
    try {
      const lid = loginIdRef.current;
      if (!lid) return;
      await axios.post("http://https://typing-portal-es53.onrender.com/save-practice", {
        login_id: lid, language, score, level_reached: level,
        wpm: calcWPM(correctChars, time), accuracy: calcAcc(correctChars, totalChars),
      });
    } catch (e) { console.log(e); }
  };
  const finishPractice = async () => {
    trySaveBest(score, level, calcWPM(correctChars, time), calcAcc(correctChars, totalChars), language);
    await savePractice();
    clearSession(); loginIdRef.current = null;
    setStarted(false); setPaused(false); setShowModal(false);
    exitFullscreen();
    alert("Practice Finished! 🎉");
  };
  const exitPractice = async () => {
    trySaveBest(score, level, calcWPM(correctChars, time), calcAcc(correctChars, totalChars), language);
    await savePractice();
    clearSession(); loginIdRef.current = null;
    setStarted(false); setPaused(false); setShowModal(false);
    exitFullscreen();
  };
  // ── Active practice content (used both in overlay and normal) ─────────────
  const ActiveContent = (
    <>
      <LevelModal
        show={showModal}
        level={level}
        score={score}
        onNext={nextLevel}
        onRestart={restartLevel}
      />
      <div className="container" style={{ maxWidth: isFullscreen ? "1100px" : "820px" }}>
        <div className="text-center d-flex justify-content-center align-items-center gap-3 mb-2">
          <span style={isFullscreen ? S.levelBadgeFS : S.levelBadge}>LEVEL {level} / 10</span>
          {!paused && (
            <span style={{ fontSize: isFullscreen ? "0.9rem" : "0.78rem", color: "#34d399", fontWeight: 600 }}>
              <span style={S.liveDot} />LIVE
            </span>
          )}
          {!isFullscreen && !paused && (
            <button
              onClick={enterFullscreen}
              style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: "50px", padding: "0.2rem 0.8rem", fontSize: "0.75rem", color: "#a78bfa", cursor: "pointer", fontWeight: 600 }}
            >
              ⛶ Fullscreen
            </button>
          )}
        </div>
        <div style={isFullscreen ? S.progressBarFS : S.progressBar}>
          <div style={S.progressFill(timePct)} />
        </div>
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <StatBox label="Score" value={score}            color="#a78bfa" isFullscreen={isFullscreen} />
          <StatBox label="Time"  value={formatTime(time)} color="#60a5fa" isFullscreen={isFullscreen} />
          <StatBox label="Level" value={`${level} / 10`} color="#34d399" isFullscreen={isFullscreen} />
          <StatBox label="WPM"   value={calcWPM(correctChars, time)} color="#f59e0b" isFullscreen={isFullscreen} />
          <StatBox label="Acc"   value={`${calcAcc(correctChars, totalChars)}%`} color="#ec4899" isFullscreen={isFullscreen} />
        </div>
        {paused && (
          <div style={S.pausedBanner}>
            {isFullscreen
              ? "⏸ Session paused — your progress is saved. Click Resume to continue."
              : "⏸ Fullscreen exited — session paused. Click Resume to return to fullscreen & continue."}
          </div>
        )}
        <div style={isFullscreen ? S.cardFullscreen : S.card}>
          <div style={{ ...(wordFlash ? { animation: "flashGreen 0.4s ease" } : {}), borderRadius: "14px" }}>
            <HighlightedText word={word} typed={typed} isHindi={language === "HI"} isFullscreen={isFullscreen} />
          </div>
          <input
            ref={inputRef}
            type="text"
            style={{
              ...(isFullscreen ? S.inputBoxFS : S.inputBox),
              ...(inputFocused ? S.inputBoxFocus : {}),
              ...(paused ? { opacity: 0.4, cursor: "not-allowed" } : {}),
              ...(language === "HI" ? (isFullscreen ? hindiFontFS : hindiFont) : {}),
            }}
            value={typed}
            onChange={handleChange}
            onKeyDown={language === "HI" ? handleKeyDown : undefined}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            disabled={!started || paused}
            placeholder={
              paused
                ? "⏸ Paused — click Resume to continue"
                : (language === "HI" ? "यहाँ टाइप करें..." : "Start typing here...")
            }
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          />
          {/* ── On-Screen Keyboard — shown only during active (non-paused) practice ── */}
          {!paused && (
            <div className="kb-slide-in" style={{ marginTop: "1.2rem" }}>
              <OnScreenKeyboard
                language={language}
                word={word}
                typed={typed}
                pressedKey={pressedKey}
                pressedCorrect={pressedCorrect}
                isShiftActive={isShiftActive}
                isFullscreen={isFullscreen}
              />
            </div>
          )}
          <div className="d-flex justify-content-center gap-3 mt-3 flex-wrap">
            {paused && <button style={S.resumeBtn} onClick={resumePractice}>▶ Resume</button>}
            {!paused && (
              <>
                <button style={S.restartBtn} onClick={restartLevel}>🔄 Restart</button>
                <button style={S.dangerBtn}  onClick={exitPractice}>✖ Exit</button>
              </>
            )}
            {paused && <button style={S.dangerBtn} onClick={exitPractice}>✖ Exit</button>}
          </div>
        </div>
      </div>
    </>
  );
  // ── If active + fullscreen → render in fixed overlay (hides sidebar) ───────
  if (started && isFullscreen) {
    return (
      <div style={S.fullscreenOverlay}>
        {ActiveContent}
      </div>
    );
  }
  // ── Normal (non-fullscreen) render ─────────────────────────────────────────
  return (
    <div style={started ? S.activePage : S.page}>
      <LevelModal
        show={showModal}
        level={level}
        score={score}
        onNext={nextLevel}
        onRestart={restartLevel}
      />
      <div className="container" style={{ maxWidth: "820px" }}>
        {!started && (
          <>
            <div className="text-center practice-fade-in">
              <div style={S.title}>⚡ Typing Practice Pro</div>
              <div style={S.subtitle}>Sharpen your speed. Train your fingers. Beat your best.</div>
            </div>
            <div className="d-flex justify-content-center gap-2 mb-4 practice-fade-in-delay">
              <button style={S.langBtn(language === "EN")} onClick={() => setLanguage("EN")} disabled={started}>🇬🇧 English</button>
              <button style={S.langBtn(language === "HI")} onClick={() => setLanguage("HI")} disabled={started}>🇮🇳 Hindi</button>
            </div>
            {language === "HI" && (
              <div className="d-flex justify-content-center mb-2">
                <div style={S.hindiBadge}>⌨️ InScript (Mangal) कीबोर्ड सक्रिय है</div>
              </div>
            )}
          </>
        )}
        <div style={S.card} className="practice-fade-in-delay">
          {started && (
            <div className="text-center d-flex justify-content-center align-items-center gap-3 mb-2">
              <span style={S.levelBadge}>LEVEL {level} / 10</span>
              {!paused && (
                <span style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: 600 }}>
                  <span style={S.liveDot} />LIVE
                </span>
              )}
              {started && !isFullscreen && !paused && (
                <button
                  onClick={enterFullscreen}
                  style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: "50px", padding: "0.2rem 0.8rem", fontSize: "0.75rem", color: "#a78bfa", cursor: "pointer", fontWeight: 600 }}
                >
                  ⛶ Fullscreen
                </button>
              )}
            </div>
          )}
          {started && <div style={S.progressBar}><div style={S.progressFill(timePct)} /></div>}
          {started && (
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <StatBox label="Score" value={score}            color="#a78bfa" />
              <StatBox label="Time"  value={formatTime(time)} color="#60a5fa" />
              <StatBox label="Level" value={`${level} / 10`} color="#34d399" />
              <StatBox label="WPM"   value={calcWPM(correctChars, time)} color="#f59e0b" />
              <StatBox label="Acc"   value={`${calcAcc(correctChars, totalChars)}%`} color="#ec4899" />
            </div>
          )}
          {paused && started && (
            <div style={S.pausedBanner}>
              {isFullscreen
                ? "⏸ Session paused — your progress is saved. Click Resume to continue."
                : "⏸ Fullscreen exited — session paused. Click Resume to return to fullscreen & continue."}
            </div>
          )}
          {started ? (
            <div style={{ ...(wordFlash ? { animation: "flashGreen 0.4s ease" } : {}), borderRadius: "14px" }}>
              <HighlightedText word={word} typed={typed} isHindi={language === "HI"} isFullscreen={false} />
            </div>
          ) : (
            <div style={{ ...S.textDisplay, ...(language === "HI" ? hindiFont : {}), color: "rgba(255,255,255,0.4)", fontSize: "1rem", textAlign: "center" }}>
              {word || (language === "HI" ? "अभ्यास शुरू करने के लिए Start दबाएं..." : "Press Start to begin practicing...")}
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            style={{ ...S.inputBox, ...(inputFocused ? S.inputBoxFocus : {}), ...(paused ? { opacity: 0.4, cursor: "not-allowed" } : {}), ...(language === "HI" ? hindiFont : {}) }}
            value={typed}
            onChange={handleChange}
            onKeyDown={language === "HI" ? handleKeyDown : undefined}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            disabled={!started || paused}
            placeholder={
              paused
                ? "⏸ Paused — click Resume to continue"
                : started
                  ? (language === "HI" ? "यहाँ टाइप करें..." : "Start typing here...")
                  : (language === "HI" ? "Start Practice दबाएं" : "Click Start Practice to begin")
            }
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          />
          {started && !paused && (
            <div className="kb-slide-in" style={{ marginTop: "1.2rem" }}>
              <OnScreenKeyboard
                language={language}
                word={word}
                typed={typed}
                pressedKey={pressedKey}
                pressedCorrect={pressedCorrect}
                isShiftActive={isShiftActive}
                isFullscreen={false}
              />
            </div>
          )}
          <div className="d-flex justify-content-center gap-3 mt-3 flex-wrap">
            {!started && <button style={S.primaryBtn} onClick={startPractice}>🚀 Start Practice</button>}
            {started && paused && <button style={S.resumeBtn} onClick={resumePractice}>▶ Resume</button>}
            {started && !paused && (
              <>
                <button style={S.restartBtn} onClick={restartLevel}>🔄 Restart</button>
                <button style={S.dangerBtn}  onClick={exitPractice}>✖ Exit</button>
              </>
            )}
            {started && paused && <button style={S.dangerBtn} onClick={exitPractice}>✖ Exit</button>}
          </div>
        </div>
        <BestResultCard best={bestResult} isNewBest={isNewBest} />
      </div>
    </div>
  );
}
