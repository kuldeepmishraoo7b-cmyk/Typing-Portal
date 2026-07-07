import React, { useRef, useState, useEffect } from "react";
import { Button, Card, Row, Col, Alert } from "react-bootstrap";
import Webcam from "react-webcam";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import * as faceapi from "face-api.js";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg:        #070b14;
    --surface:   #0d1526;
    --surface2:  #111d35;
    --border:    #1a2d50;
    --border2:   #243a5e;
    --accent:    #3b82f6;
    --accent2:   #06b6d4;
    --gold:      #f59e0b;
    --success:   #10b981;
    --danger:    #ef4444;
    --warn:      #f59e0b;
    --text:      #e2e8f0;
    --muted:     #64748b;
    --muted2:    #94a3b8;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .reg-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Outfit', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    position: relative;
    overflow: hidden;
  }

  /* Animated background grid */
  .reg-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* Glow orbs */
  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
    animation: floatOrb 8s ease-in-out infinite;
  }
  .orb-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%);
    top: -100px; left: -100px;
    animation-delay: 0s;
  }
  .orb-2 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(6,182,212,0.10), transparent 70%);
    bottom: -50px; right: -50px;
    animation-delay: -4s;
  }

  @keyframes floatOrb {
    0%, 100% { transform: translate(0, 0); }
    50%       { transform: translate(20px, -20px); }
  }

  .reg-wrapper {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 560px;
  }

  /* ── Brand header ── */
  .reg-brand {
    text-align: center;
    margin-bottom: 2rem;
    animation: fadeDown 0.6s ease both;
  }

  .reg-brand .logo-ring {
    width: 64px; height: 64px;
    margin: 0 auto 1rem;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem;
    box-shadow: 0 0 30px rgba(59,130,246,0.35), 0 0 60px rgba(59,130,246,0.15);
    position: relative;
  }

  .reg-brand .logo-ring::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 21px;
    background: linear-gradient(135deg, rgba(59,130,246,0.5), rgba(6,182,212,0.5));
    z-index: -1;
    filter: blur(8px);
  }

  .reg-brand h1 {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #e2e8f0, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .reg-brand p {
    color: var(--muted2);
    font-size: 0.88rem;
    margin-top: 0.4rem;
    font-weight: 400;
  }

  /* ── Main card ── */
  .reg-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 2.25rem;
    box-shadow:
      0 0 0 1px rgba(59,130,246,0.05),
      0 20px 60px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.04);
    animation: fadeUp 0.7s ease both;
  }

  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Section divider ── */
  .section-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.75rem 0 1.25rem;
  }

  .section-divider .line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .section-divider .label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  /* ── Form fields ── */
  .field-group {
    margin-bottom: 1rem;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--muted2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.45rem;
  }

  .field-label .req {
    color: var(--accent);
    font-size: 0.7rem;
  }

  .field-input {
    width: 100%;
    background: var(--surface2) !important;
    border: 1.5px solid var(--border) !important;
    border-radius: 12px !important;
    color: var(--text) !important;
    font-family: 'Outfit', sans-serif !important;
    font-size: 0.92rem !important;
    padding: 0.7rem 1rem !important;
    transition: all 0.2s ease !important;
    outline: none !important;
  }

  .field-input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
    background: rgba(59,130,246,0.04) !important;
  }

  /* NEW: phone check state classes */
  .field-input.field-checking {
    border-color: var(--warn) !important;
  }

  .field-input.field-taken {
    border-color: var(--danger) !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
  }

  .field-input.field-available {
    border-color: var(--success) !important;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important;
  }

  .field-input::placeholder { color: var(--muted) !important; }
  .field-input:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }

  .field-hint {
    font-size: 0.72rem;
    color: var(--muted);
    margin-top: 0.3rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  /* Password strength */
  .strength-bar {
    display: flex;
    gap: 4px;
    margin-top: 0.4rem;
  }

  .strength-seg {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: var(--border);
    transition: background 0.3s;
  }

  .strength-seg.active-weak   { background: var(--danger); }
  .strength-seg.active-fair   { background: var(--warn); }
  .strength-seg.active-good   { background: var(--accent); }
  .strength-seg.active-strong { background: var(--success); }

  .strength-text {
    font-size: 0.72rem;
    margin-top: 0.25rem;
    font-weight: 500;
  }

  /* ── Camera section ── */
  .camera-container {
    background: var(--surface2);
    border: 1.5px dashed var(--border2);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    transition: border-color 0.3s;
  }

  .camera-container.camera-active {
    border-color: var(--accent);
    border-style: solid;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }

  .camera-container video,
  .camera-container .webcam-el {
    display: block;
    width: 100%;
    border-radius: 14px;
  }

  /* Face detection overlay */
  .camera-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .face-frame {
    width: 160px; height: 180px;
    border: 2px solid rgba(59,130,246,0.6);
    border-radius: 50% 50% 45% 45%;
    position: relative;
    animation: pulseFaceFrame 2s ease-in-out infinite;
  }

  @keyframes pulseFaceFrame {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.02); }
  }

  .face-frame .corner {
    position: absolute;
    width: 14px; height: 14px;
    border-color: var(--accent);
    border-style: solid;
  }

  .face-frame .corner-tl { top: -2px; left: -2px; border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
  .face-frame .corner-tr { top: -2px; right: -2px; border-width: 2px 2px 0 0; border-radius: 0 3px 0 0; }
  .face-frame .corner-bl { bottom: -2px; left: -2px; border-width: 0 0 2px 2px; border-radius: 0 0 0 3px; }
  .face-frame .corner-br { bottom: -2px; right: -2px; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }

  /* Camera loading bar */
  .camera-loading-bar {
    position: absolute;
    bottom: 0; left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 0 0 0 16px;
    animation: loadingPulse 1.5s ease-in-out infinite;
    width: 60%;
  }

  @keyframes loadingPulse {
    0%   { width: 20%; opacity: 0.7; }
    50%  { width: 80%; opacity: 1; }
    100% { width: 20%; opacity: 0.7; }
  }

  /* Security badges row */
  .security-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }

  .sec-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: rgba(59,130,246,0.07);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 20px;
    padding: 0.25rem 0.65rem;
    font-size: 0.7rem;
    color: var(--muted2);
    font-weight: 500;
  }

  .sec-badge.active {
    background: rgba(16,185,129,0.1);
    border-color: rgba(16,185,129,0.3);
    color: var(--success);
  }

  .sec-badge.warn {
    background: rgba(245,158,11,0.1);
    border-color: rgba(245,158,11,0.3);
    color: var(--warn);
  }

  .sec-badge.danger {
    background: rgba(239,68,68,0.1);
    border-color: rgba(239,68,68,0.3);
    color: var(--danger);
  }

  /* Captured image preview */
  .capture-preview {
    position: relative;
    display: inline-block;
  }

  .capture-preview img {
    border-radius: 14px;
    display: block;
  }

  .capture-badge {
    position: absolute;
    top: 8px; right: 8px;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }

  .capture-badge.ok {
    background: rgba(16,185,129,0.9);
    color: white;
  }

  .capture-badge.bad {
    background: rgba(245,158,11,0.9);
    color: #1a1a1a;
  }

  /* Scan animation on image */
  .scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.8), transparent);
    animation: scanDown 2s linear infinite;
    pointer-events: none;
    border-radius: 14px;
  }

  @keyframes scanDown {
    0%   { top: 0%;   opacity: 1; }
    90%  { top: 100%; opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }

  /* ── Buttons ── */
  .btn-capture {
    width: 100%;
    background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.15));
    border: 1.5px solid rgba(59,130,246,0.4) !important;
    border-radius: 12px !important;
    color: var(--accent) !important;
    font-family: 'Outfit', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.92rem !important;
    padding: 0.75rem 1rem !important;
    transition: all 0.25s ease !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0.5rem !important;
    cursor: pointer !important;
  }

  .btn-capture:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(6,182,212,0.25)) !important;
    border-color: var(--accent) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(59,130,246,0.2) !important;
  }

  .btn-capture:disabled {
    opacity: 0.45 !important;
    cursor: not-allowed !important;
  }

  .btn-retake {
    background: transparent !important;
    border: 1px solid var(--border2) !important;
    border-radius: 10px !important;
    color: var(--muted2) !important;
    font-family: 'Outfit', sans-serif !important;
    font-weight: 500 !important;
    font-size: 0.82rem !important;
    padding: 0.45rem 1rem !important;
    transition: all 0.2s !important;
    cursor: pointer !important;
  }

  .btn-retake:hover:not(:disabled) {
    border-color: var(--muted2) !important;
    color: var(--text) !important;
  }

  .btn-register {
    width: 100%;
    background: linear-gradient(135deg, var(--accent), #2563eb) !important;
    border: none !important;
    border-radius: 14px !important;
    color: white !important;
    font-family: 'Outfit', sans-serif !important;
    font-weight: 700 !important;
    font-size: 1rem !important;
    padding: 0.9rem 1rem !important;
    transition: all 0.3s ease !important;
    letter-spacing: 0.02em !important;
    cursor: pointer !important;
    position: relative !important;
    overflow: hidden !important;
  }

  .btn-register::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .btn-register:hover:not(:disabled)::after { opacity: 1; }

  .btn-register:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 32px rgba(59,130,246,0.4) !important;
  }

  .btn-register:disabled {
    background: linear-gradient(135deg, #1e293b, #334155) !important;
    color: var(--muted) !important;
    cursor: not-allowed !important;
    transform: none !important;
    box-shadow: none !important;
  }

  /* ── Alert overrides ── */
  .alert-custom {
    border-radius: 12px !important;
    font-size: 0.88rem !important;
    font-family: 'Outfit', sans-serif !important;
    padding: 0.75rem 1rem !important;
    border-width: 1px !important;
    display: flex !important;
    align-items: flex-start !important;
    gap: 0.6rem !important;
  }

  .alert-danger-custom {
    background: rgba(239,68,68,0.1) !important;
    border-color: rgba(239,68,68,0.3) !important;
    color: #fca5a5 !important;
  }

  .alert-success-custom {
    background: rgba(16,185,129,0.1) !important;
    border-color: rgba(16,185,129,0.3) !important;
    color: #6ee7b7 !important;
  }

  .alert-warning-custom {
    background: rgba(245,158,11,0.1) !important;
    border-color: rgba(245,158,11,0.3) !important;
    color: #fde68a !important;
  }

  /* ── Progress steps ── */
  .steps-row {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 2rem;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    flex: 1;
  }

  .step-circle {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 2px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--muted);
    background: var(--surface2);
    transition: all 0.3s;
    position: relative;
    z-index: 1;
  }

  .step-circle.done {
    background: var(--success);
    border-color: var(--success);
    color: white;
    box-shadow: 0 0 12px rgba(16,185,129,0.4);
  }

  .step-circle.active {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
    box-shadow: 0 0 12px rgba(59,130,246,0.4);
  }

  .step-label {
    font-size: 0.65rem;
    color: var(--muted);
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  .step-label.active { color: var(--accent); }
  .step-label.done   { color: var(--success); }

  .step-line {
    flex: 1;
    height: 2px;
    background: var(--border);
    margin-bottom: 1.3rem;
    transition: background 0.3s;
  }

  .step-line.done { background: var(--success); }

  /* ── Login link ── */
  .login-link {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.85rem;
    color: var(--muted2);
  }

  .login-link a {
    color: var(--accent);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
  }

  .login-link a:hover { color: var(--accent2); text-decoration: underline; }

  /* Spinner */
  .spinner-sm {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  /* NEW: tiny phone-check spinner */
  .spinner-xs {
    width: 10px; height: 10px;
    border: 1.5px solid rgba(245,158,11,0.3);
    border-top-color: var(--warn);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Face analysis overlay */
  .analyzing-overlay {
    position: absolute;
    inset: 0;
    background: rgba(7,11,20,0.75);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border-radius: 14px;
    backdrop-filter: blur(4px);
  }

  .analyzing-ring {
    width: 60px; height: 60px;
    border-radius: 50%;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-right-color: var(--accent2);
    animation: spin 1s linear infinite;
  }

  .analyzing-text {
    color: var(--text);
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .analyzing-sub {
    color: var(--muted2);
    font-size: 0.72rem;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Models loading bar */
  .models-bar {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.65rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: var(--muted2);
    margin-bottom: 0.75rem;
  }

  .models-bar .dot-pulse {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    animation: dotPulse 1.2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes dotPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.6); }
  }
`;

// ── Password strength helper ──
function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: "Weak",   color: "weak"   };
  if (score === 2) return { level: 2, label: "Fair",   color: "fair"   };
  if (score === 3) return { level: 3, label: "Good",   color: "good"   };
  return               { level: 4, label: "Strong", color: "strong" };
}

// ── Step calculator ──
function getStep(form, image, descriptor) {
  if (image && descriptor) return 3;
  if (form.username && form.phone && form.password && form.password.length >= 6) return 2;
  return 1;
}

export default function Register() {
  const webcamRef = useRef(null);
  const navigate  = useNavigate();

  const [form, setForm] = useState({ username: "", phone: "", email: "", password: "" });
  const [image, setImage]           = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass]     = useState(false);

  // Multi-face tracking (original)
  const [multiFaceDetected, setMultiFaceDetected] = useState(false);
  const [faceCount, setFaceCount]   = useState(0);

  // NEW: camera active state for styling
  const [cameraActive, setCameraActive] = useState(false);

  // NEW: phone duplicate check — idle | checking | taken | available
  const [phoneCheckStatus, setPhoneCheckStatus] = useState("idle");
  const phoneCheckTimer = useRef(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Resolve relative to the current document location instead of
        // an absolute "/models" path. An absolute path breaks under
        // Electron's file:// protocol (it gets treated as the drive
        // root), causing "Failed to fetch" / ERR_FILE_NOT_FOUND.
        // This also still works fine on a real web server.
        const MODEL_URL = new URL("models", window.location.href).href;
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Model load error:", err);
        setError("Failed to load face models. Please refresh the page.");
      }
    };
    loadModels();
  }, []);

  // Camera activation
  useEffect(() => {
    if (!image) setTimeout(() => setCameraActive(true), 300);
    else setCameraActive(false);
  }, [image]);

  // NEW: debounced phone duplicate check — fires 600ms after user stops typing
  useEffect(() => {
    if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);

    // Only check when exactly 10 digits are entered
    if (!form.phone || !/^\d{10}$/.test(form.phone)) {
      setPhoneCheckStatus("idle");
      return;
    }

    setPhoneCheckStatus("checking");

    phoneCheckTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`https://typing-portal-es53.onrender.com/check-phone/${form.phone}`);
        // Backend must return { exists: true } or { exists: false }
        setPhoneCheckStatus(res.data.exists ? "taken" : "available");
      } catch (err) {
        console.warn("Phone check failed:", err);
        setPhoneCheckStatus("idle"); // non-blocking: don't break UX on network error
      }
    }, 600);

    return () => clearTimeout(phoneCheckTimer.current);
  }, [form.phone]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Retake photo — clears image, descriptor, and all face-related state (original)
  const handleRetake = () => {
    setImage(null);
    setDescriptor(null);
    setMultiFaceDetected(false);
    setFaceCount(0);
    setError("");
    setSuccess("");
  };

  const capture = async () => {
    if (!modelsLoaded) { setError("Face models are still loading. Please wait..."); return; }
    const img = webcamRef.current?.getScreenshot();
    if (!img) { setError("Could not capture image. Make sure camera is enabled."); return; }

    setCapturing(true);
    setError("");
    setDescriptor(null);
    setImage(null);
    setMultiFaceDetected(false);
    setFaceCount(0);

    try {
      await new Promise((resolve, reject) => {
        const imgElement = document.createElement("img");
        imgElement.src = img;

        imgElement.onload = async () => {
          try {
            // Detect ALL faces first (original logic)
            const allDetections = await faceapi
              .detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptors();

            const count = allDetections.length;
            setFaceCount(count);

            if (count === 0) {
              reject(new Error("No face detected. Please look at the camera and try again."));
              return;
            }

            if (count > 1) {
              // Multi-face scenario — capture image but block registration (original)
              setImage(img);
              setMultiFaceDetected(true);
              setDescriptor(null);
              reject(new Error(`${count} faces detected. Only 1 person should be in frame. Please retake.`));
              return;
            }

            // Exactly 1 face — proceed normally (original)
            const detection = await faceapi
              .detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (!detection) {
              reject(new Error("No face detected. Please look at the camera and try again."));
              return;
            }

            setDescriptor(Array.from(detection.descriptor));
            setImage(img);
            setMultiFaceDetected(false);
            resolve();
          } catch (err) { reject(err); }
        };

        imgElement.onerror = () => reject(new Error("Image failed to load for face detection."));
      });
    } catch (err) {
      setError(err.message || "Face capture failed. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim()) { setError("Username is required"); return; }
    if (!form.phone.trim())    { setError("Phone number is required"); return; }
    if (!/^\d{10}$/.test(form.phone.trim())) { setError("Enter a valid 10-digit phone number"); return; }
    // NEW: hard block if phone is already registered
    if (phoneCheckStatus === "taken") { setError("This phone number is already registered. Please use a different number."); return; }
    if (!form.email.trim())    { setError("Email address is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError("Enter a valid email address"); return; }
    if (!form.password)        { setError("Password is required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!image || !descriptor) { setError("Please capture your face photo before registering"); return; }

    setSubmitting(true);
    setError("");

    try {
      await axios.post("https://typing-portal-es53.onrender.com/register-student", {
        ...form,
        photo: image,
        descriptor: descriptor
      });

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setError("This face is already registered. Only one account allowed per person.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Register button disabled if multi-face OR no valid capture (original) OR phone taken/still checking
  const isRegisterDisabled = submitting || capturing || multiFaceDetected || !image || !descriptor || phoneCheckStatus === "taken" || phoneCheckStatus === "checking";

  const pwStrength = getPasswordStrength(form.password);
  const currentStep = getStep(form, image, descriptor);

  // NEW: phone input border class based on check status
  const phoneInputClass = [
    "field-input",
    phoneCheckStatus === "checking"  ? "field-checking"  : "",
    phoneCheckStatus === "taken"     ? "field-taken"     : "",
    phoneCheckStatus === "available" ? "field-available" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <style>{styles}</style>
      <div className="reg-page">
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        <div className="reg-wrapper">

          {/* Brand */}
          <div className="reg-brand">
            <div className="logo-ring">🎓</div>
            <h1>Student Portal</h1>
            <p>Secure biometric registration for typing examinations</p>
          </div>

          {/* Progress steps */}
          <div className="steps-row">
            <div className="step-item">
              <div className={`step-circle ${currentStep > 1 ? "done" : "active"}`}>
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <div className={`step-label ${currentStep === 1 ? "active" : currentStep > 1 ? "done" : ""}`}>
                Details
              </div>
            </div>
            <div className={`step-line ${currentStep > 1 ? "done" : ""}`} />
            <div className="step-item">
              <div className={`step-circle ${currentStep > 2 ? "done" : currentStep === 2 ? "active" : ""}`}>
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <div className={`step-label ${currentStep === 2 ? "active" : currentStep > 2 ? "done" : ""}`}>
                Face ID
              </div>
            </div>
            <div className={`step-line ${currentStep > 2 ? "done" : ""}`} />
            <div className="step-item">
              <div className={`step-circle ${currentStep === 3 ? "active" : ""}`}>
                3
              </div>
              <div className={`step-label ${currentStep === 3 ? "active" : ""}`}>
                Submit
              </div>
            </div>
          </div>

          {/* Main card */}
          <div className="reg-card">

            {/* Alerts */}
            {error && (
              <div className="alert-custom alert-danger-custom" style={{ marginBottom: "1rem", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", gap: "0.5rem", alignItems: "flex-start", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: "0.88rem" }}>
                <span style={{ flexShrink: 0 }}>🚫</span> {error}
              </div>
            )}
            {success && (
              <div className="alert-custom alert-success-custom" style={{ marginBottom: "1rem", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", gap: "0.5rem", alignItems: "flex-start", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#6ee7b7", fontSize: "0.88rem" }}>
                <span style={{ flexShrink: 0 }}>✅</span> {success}
              </div>
            )}

            {/* Multi-face warning (original) */}
            {multiFaceDetected && (
              <div style={{ marginBottom: "1rem", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", gap: "0.5rem", alignItems: "flex-start", border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.1)", color: "#fde68a", fontSize: "0.88rem" }}>
                <span style={{ flexShrink: 0, fontSize: "1.1rem" }}>⚠️</span>
                <div>
                  <strong>{faceCount} faces detected.</strong> Only <strong>1 person</strong> should be in frame.
                  Please retake the photo with only yourself visible.
                </div>
              </div>
            )}

            {/* ── SECTION: Account Info ── */}
            <div className="section-divider">
              <div className="line" />
              <div className="label">🔐 Account Information</div>
              <div className="line" />
            </div>

            <div className="field-group">
              <label className="field-label">
                👤 Username <span className="req">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                name="username"
                value={form.username}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Enter your username"
                autoComplete="off"
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                📱 Phone Number <span className="req">*</span>
              </label>
              {/* NEW: phoneInputClass applies colored border based on check status */}
              <input
                type="text"
                className={phoneInputClass}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={submitting}
                placeholder="10-digit mobile number"
                maxLength={10}
                autoComplete="off"
              />
              {/* NEW: live status hint replaces original digit counter when 10 digits reached */}
              {form.phone && form.phone.length > 0 && (
                <div className="field-hint">
                  {phoneCheckStatus === "checking" && (
                    <><div className="spinner-xs" /> <span style={{ color: "var(--warn)" }}>Checking availability...</span></>
                  )}
                  {phoneCheckStatus === "taken" && (
                    <><span style={{ color: "var(--danger)" }}>✗</span> <span style={{ color: "var(--danger)" }}>Phone number already registered</span></>
                  )}
                  {phoneCheckStatus === "available" && (
                    <><span style={{ color: "var(--success)" }}>✓</span> <span style={{ color: "var(--success)" }}>Phone number available</span></>
                  )}
                  {phoneCheckStatus === "idle" && (
                    /^\d{10}$/.test(form.phone)
                      ? <><span style={{ color: "var(--success)" }}>✓</span> Valid phone number</>
                      : <><span style={{ color: "var(--warn)" }}>⚠</span> {form.phone.length}/10 digits</>
                  )}
                </div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">
                ✉️ Email Address <span className="req">*</span>
              </label>
              <input
                type="email"
                className="field-input"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Enter your email address"
                autoComplete="email"
              />
              {form.email && form.email.length > 0 && (
                <div className="field-hint">
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? (
                    <><span style={{ color: "var(--success)" }}>✓</span> <span style={{ color: "var(--success)" }}>Valid email address</span></>
                  ) : (
                    <><span style={{ color: "var(--warn)" }}>⚠</span> Enter a valid email (e.g. user@example.com)</>
                  )}
                </div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">
                🔑 Password <span className="req">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  className="field-input"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", color: "var(--muted2)",
                    fontSize: "1rem", padding: 0, lineHeight: 1,
                  }}
                  title={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
              {form.password.length > 0 && (
                <>
                  <div className="strength-bar">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`strength-seg ${i <= pwStrength.level ? `active-${pwStrength.color}` : ""}`}
                      />
                    ))}
                  </div>
                  <div className="strength-text" style={{
                    color:
                      pwStrength.color === "weak"   ? "var(--danger)" :
                      pwStrength.color === "fair"   ? "var(--warn)"   :
                      pwStrength.color === "good"   ? "var(--accent)" :
                      "var(--success)"
                  }}>
                    {pwStrength.label} password
                  </div>
                </>
              )}
            </div>

            {/* ── SECTION: Face Capture ── */}
            <div className="section-divider">
              <div className="line" />
              <div className="label">🎭 Face Biometrics</div>
              <div className="line" />
            </div>

            {/* Models loading indicator */}
            {!modelsLoaded && (
              <div className="models-bar">
                <div className="dot-pulse" />
                <span>Loading face detection models — please wait...</span>
              </div>
            )}

            {/* Camera view */}
            {!image && (
              <>
                <div className={`camera-container ${cameraActive ? "camera-active" : ""}`}>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="webcam-el"
                    width="100%"
                    style={{ borderRadius: 14, display: "block" }}
                  />
                  {/* Face alignment overlay */}
                  {modelsLoaded && !capturing && (
                    <div className="camera-overlay">
                      <div className="face-frame">
                        <div className="corner corner-tl" />
                        <div className="corner corner-tr" />
                        <div className="corner corner-bl" />
                        <div className="corner corner-br" />
                      </div>
                    </div>
                  )}
                  {/* Analyzing overlay */}
                  {capturing && (
                    <div className="analyzing-overlay">
                      <div className="analyzing-ring" />
                      <div className="analyzing-text">Analyzing Face</div>
                      <div className="analyzing-sub">scanning biometrics...</div>
                    </div>
                  )}
                  {!modelsLoaded && <div className="camera-loading-bar" />}
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", margin: "0.5rem 0 0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                  <span>👆</span> Align your face within the frame and ensure good lighting
                </div>

                <button
                  className="btn-capture"
                  onClick={capture}
                  disabled={!modelsLoaded || capturing || submitting}
                >
                  {capturing
                    ? <><div className="spinner-sm" /> Detecting Face...</>
                    : <><span>📷</span> Capture Face</>
                  }
                </button>
              </>
            )}

            {/* Captured image preview */}
            {image && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <div className="capture-preview">
                  <img
                    src={image}
                    alt="Captured"
                    width="220"
                    style={{
                      borderRadius: 14,
                      border: `2px solid ${multiFaceDetected ? "var(--warn)" : "var(--success)"}`,
                      boxShadow: multiFaceDetected
                        ? "0 0 20px rgba(245,158,11,0.3)"
                        : "0 0 20px rgba(16,185,129,0.3)"
                    }}
                  />
                  <span className={`capture-badge ${multiFaceDetected ? "bad" : "ok"}`}>
                    {faceCount} {faceCount === 1 ? "face" : "faces"}
                  </span>
                  {/* Scan line only when valid capture */}
                  {!multiFaceDetected && descriptor && <div className="scan-line" />}
                </div>

                {!multiFaceDetected && descriptor && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontWeight: 600, fontSize: "0.9rem" }}>
                    ✅ Face captured & biometrics stored
                  </div>
                )}
                {multiFaceDetected && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--warn)", fontWeight: 600, fontSize: "0.9rem" }}>
                    ⚠️ Multiple faces — registration blocked
                  </div>
                )}

                <button
                  className="btn-retake"
                  onClick={handleRetake}
                  disabled={submitting || capturing}
                >
                  🔄 Retake Photo
                </button>
              </div>
            )}

            {/* Security badges */}
            <div className="security-badges" style={{ marginTop: "1rem" }}>
              <div className={`sec-badge ${modelsLoaded ? "active" : ""}`}>
                🤖 {modelsLoaded ? "AI Models Ready" : "Loading Models"}
              </div>
              <div className={`sec-badge ${descriptor ? "active" : ""}`}>
                🧬 {descriptor ? "Biometrics Stored" : "No Biometrics"}
              </div>
              <div className={`sec-badge ${multiFaceDetected ? "danger" : faceCount === 1 ? "active" : ""}`}>
                👥 {multiFaceDetected ? `${faceCount} Faces (Blocked)` : faceCount === 1 ? "1 Face (OK)" : "Face Check"}
              </div>
              {/* NEW: phone check badge */}
              <div className={`sec-badge ${phoneCheckStatus === "available" ? "active" : phoneCheckStatus === "taken" ? "danger" : ""}`}>
                📱 {phoneCheckStatus === "available" ? "Phone OK" : phoneCheckStatus === "taken" ? "Phone Taken" : "Phone Check"}
              </div>
              <div className="sec-badge active">
                🔒 End-to-End Encrypted
              </div>
            </div>

            {/* Blocked hint (original) */}
            {multiFaceDetected && (
              <p style={{ textAlign: "center", color: "var(--muted2)", marginTop: "0.75rem", fontSize: "0.82rem" }}>
                🚫 Registration disabled — ensure only <strong style={{ color: "var(--text)" }}>1 person</strong> is visible, then retake.
              </p>
            )}

            {/* Submit button */}
            <button
              className="btn-register"
              style={{ marginTop: "1.5rem" }}
              disabled={isRegisterDisabled}
              onClick={handleSubmit}
              title={
                phoneCheckStatus === "taken"
                  ? "This phone number is already registered."
                  : multiFaceDetected
                  ? "Multiple faces detected. Please retake with only yourself in frame."
                  : !image || !descriptor
                  ? "Please capture your face first"
                  : ""
              }
            >
              {submitting
                ? <><div className="spinner-sm" style={{ marginRight: "0.5rem", display: "inline-block" }} /> Registering...</>
                : "🚀 Create Account"
              }
            </button>

            {/* Login link */}
            <div className="login-link">
              Already have an account? <Link to="/login">Sign In →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
