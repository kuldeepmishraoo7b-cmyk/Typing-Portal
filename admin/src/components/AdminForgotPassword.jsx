
import { useState, useEffect, useRef } from "react";
import API_BASE_URL from "../config";

const API = API_BASE_URL;

const STEP_USERNAME = 1;
const STEP_OTP      = 2;
const STEP_RESET    = 3;
const STEP_DONE     = 4;

export default function AdminForgotPassword() {
  const [step,         setStep]         = useState(STEP_USERNAME);
  const [username,     setUsername]     = useState("");
  const [otp,          setOtp]          = useState(["", "", "", "", "", ""]);
  const [newPassword,  setNewPassword]  = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [maskedEmail,  setMaskedEmail]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [timer,        setTimer]        = useState(0);
  const timerRef  = useRef(null);
  const otpRefs   = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    clearMessages();
    if (!username.trim()) return setError("Please enter your admin username.");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin-forgot-password/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Failed to send OTP.");
      setMaskedEmail(data.maskedEmail || "your registered email");
      setSuccess(data.message);
      setTimer(60);
      setStep(STEP_OTP);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Server unreachable. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    clearMessages();
    const otpValue = otp.join("");
    if (otpValue.length < 6) return setError("Please enter the complete 6-digit OTP.");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin-forgot-password/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "OTP verification failed.");
      setSuccess("OTP verified! Set your new password.");
      setStep(STEP_RESET);
    } catch {
      setError("Server unreachable. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    clearMessages();
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (newPassword !== confirmPass) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin-forgot-password/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Password reset failed.");
      setSuccess(data.message);
      setStep(STEP_DONE);
    } catch {
      setError("Server unreachable. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (timer > 0) return;
    clearMessages();
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin-forgot-password/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Failed to resend OTP.");
      setSuccess("New OTP sent!");
      setTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Server unreachable.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otp];
    pasted.split("").forEach((ch, i) => { updated[i] = ch; });
    setOtp(updated);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const steps = ["Username", "Verify OTP", "New Password"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .afp-root {
          min-height: 100vh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* animated background grid */
        .afp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridMove 20s linear infinite;
          pointer-events: none;
        }

        @keyframes gridMove {
          0%   { transform: translateY(0); }
          100% { transform: translateY(48px); }
        }

        /* glowing orbs */
        .afp-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.18;
          animation: orbFloat 8s ease-in-out infinite alternate;
        }
        .afp-orb-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #6366f1, transparent);
          top: -100px; left: -100px;
        }
        .afp-orb-2 {
          width: 320px; height: 320px;
          background: radial-gradient(circle, #a78bfa, transparent);
          bottom: -60px; right: -60px;
          animation-delay: -4s;
        }
        @keyframes orbFloat {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.1); }
        }

        .afp-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px 36px;
          backdrop-filter: blur(20px);
          position: relative;
          z-index: 1;
          animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        /* ── step tracker ── */
        .afp-steps {
          display: flex;
          align-items: center;
          margin-bottom: 36px;
          gap: 0;
        }
        .afp-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }
        .afp-step-item:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 16px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,0.08);
          z-index: 0;
          transition: background 0.4s;
        }
        .afp-step-item.done:not(:last-child)::after {
          background: linear-gradient(90deg, #6366f1, #a78bfa);
        }
        .afp-step-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600;
          border: 2px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.3);
          position: relative; z-index: 1;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
          font-family: 'JetBrains Mono', monospace;
        }
        .afp-step-item.active .afp-step-dot {
          background: linear-gradient(135deg, #6366f1, #a78bfa);
          border-color: #6366f1;
          color: #fff;
          box-shadow: 0 0 20px rgba(99,102,241,0.5);
        }
        .afp-step-item.done .afp-step-dot {
          background: linear-gradient(135deg, #6366f1, #a78bfa);
          border-color: #6366f1;
          color: #fff;
        }
        .afp-step-label {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          margin-top: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.3s;
        }
        .afp-step-item.active .afp-step-label,
        .afp-step-item.done .afp-step-label {
          color: rgba(255,255,255,0.6);
        }

        /* ── heading ── */
        .afp-icon {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.15));
          border: 1px solid rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .afp-title {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .afp-subtitle {
          font-size: 13.5px;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .afp-subtitle strong {
          color: rgba(167,139,250,0.9);
          font-weight: 500;
        }

        /* ── form ── */
        .afp-field {
          margin-bottom: 16px;
        }
        .afp-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .afp-input-wrap {
          position: relative;
        }
        .afp-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 14.5px;
          font-family: 'Sora', sans-serif;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .afp-input:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .afp-input::placeholder { color: rgba(255,255,255,0.2); }

        .afp-eye {
          position: absolute;
          right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3);
          font-size: 18px;
          padding: 2px;
          transition: color 0.2s;
        }
        .afp-eye:hover { color: rgba(255,255,255,0.7); }

        /* ── OTP boxes ── FIX: constrain row so boxes never overflow card ── */
        .afp-otp-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          width: 100%;        /* fill parent, never exceed it */
        }
        .afp-otp-box {
          flex: 1 1 0;        /* grow/shrink equally from 0 base — no min-content blowout */
          min-width: 0;       /* allow shrinking below content size */
          max-width: 56px;    /* cap so boxes stay square-ish on wide screens */
          height: 52px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          text-align: center;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
          caret-color: #6366f1;
          padding: 0;         /* let text-align center the digit without padding fights */
        }
        .afp-otp-box:focus {
          border-color: rgba(99,102,241,0.7);
          background: rgba(99,102,241,0.08);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .afp-otp-box.filled {
          border-color: rgba(167,139,250,0.5);
          color: #a78bfa;
        }

        /* ── alerts ── */
        .afp-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 18px;
          display: flex; align-items: flex-start; gap: 8px;
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX( 3px); }
          30%, 50%, 70% { transform: translateX(-3px); }
          40%, 60% { transform: translateX( 3px); }
        }
        .afp-success-msg {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          color: #86efac;
          margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }

        /* ── button ── */
        .afp-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 24px rgba(99,102,241,0.35);
          letter-spacing: 0.01em;
          margin-top: 4px;
        }
        .afp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.45);
        }
        .afp-btn:active:not(:disabled) { transform: translateY(0); }
        .afp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .afp-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          pointer-events: none;
        }

        /* spinner */
        .afp-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── resend row ── */
        .afp-resend {
          text-align: center;
          margin-top: 16px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }
        .afp-resend button {
          background: none; border: none;
          color: #a78bfa;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }
        .afp-resend button:disabled {
          color: rgba(255,255,255,0.25);
          cursor: not-allowed;
          text-decoration: none;
        }
        .afp-resend button:hover:not(:disabled) { color: #c4b5fd; }

        /* ── back link ── */
        .afp-back {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 24px;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
        }
        .afp-back a {
          color: rgba(167,139,250,0.8);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .afp-back a:hover { color: #c4b5fd; }

        /* ── success screen ── */
        .afp-done {
          text-align: center;
          animation: cardIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .afp-done-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15));
          border: 1px solid rgba(34,197,94,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px;
          margin: 0 auto 20px;
          animation: popIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        .afp-done-title {
          font-size: 24px; font-weight: 700;
          color: #fff; letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .afp-done-text {
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          margin-bottom: 30px;
        }
        .afp-btn-outline {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid rgba(99,102,241,0.4);
          background: transparent;
          color: #a78bfa;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .afp-btn-outline:hover {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.6);
        }

        /* password strength bar */
        .afp-strength {
          margin-top: 8px;
          display: flex;
          gap: 4px;
        }
        .afp-strength-bar {
          flex: 1; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .afp-strength-bar.weak   { background: #ef4444; }
        .afp-strength-bar.medium { background: #f59e0b; }
        .afp-strength-bar.strong { background: #22c55e; }

        @media (max-width: 480px) {
          .afp-card { padding: 30px 22px; }
          .afp-otp-box { height: 44px; font-size: 18px; }
        }
      `}</style>

      <div className="afp-root">
        <div className="afp-orb afp-orb-1" />
        <div className="afp-orb afp-orb-2" />

        <div className="afp-card">

          {step === STEP_DONE ? (
            <div className="afp-done">
              <div className="afp-done-icon">✅</div>
              <div className="afp-done-title">Password Reset!</div>
              <p className="afp-done-text">
                Your admin password has been updated successfully.<br />
                You can now log in with your new password.
              </p>
              <button
                className="afp-btn-outline"
                onClick={() => window.location.href = "/admin/login"}
              >
                Go to Admin Login
              </button>
            </div>
          ) : (
            <>
              <div className="afp-steps">
                {steps.map((label, i) => {
                  const num   = i + 1;
                  const isDone   = step > num;
                  const isActive = step === num;
                  return (
                    <div
                      key={label}
                      className={`afp-step-item ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
                    >
                      <div className="afp-step-dot">
                        {isDone ? "✓" : num}
                      </div>
                      <div className="afp-step-label">{label}</div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="afp-error">
                  <span>⚠️</span> {error}
                </div>
              )}
              {success && !error && (
                <div className="afp-success-msg">
                  <span>✔</span> {success}
                </div>
              )}

              {step === STEP_USERNAME && (
                <>
                  <div className="afp-icon">🔐</div>
                  <div className="afp-title">Forgot Password?</div>
                  <p className="afp-subtitle">
                    Enter your admin username and we'll send an OTP to your registered email.
                  </p>

                  <form onSubmit={handleSendOtp}>
                    <div className="afp-field">
                      <label className="afp-label">Admin Username</label>
                      <div className="afp-input-wrap">
                        <input
                          className="afp-input"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={e => { clearMessages(); setUsername(e.target.value); }}
                          autoFocus
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <button className="afp-btn" type="submit" disabled={loading}>
                      {loading ? <><span className="afp-spinner" />Sending OTP...</> : "Send OTP →"}
                    </button>
                  </form>

                  <div className="afp-back">
                    <span>Remember your password?</span>
                    <a href="/admin/login">Back to Login</a>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════════
                  STEP 2 — Enter OTP
              ══════════════════════════════════════════ */}
              {step === STEP_OTP && (
                <>
                  <div className="afp-icon">📧</div>
                  <div className="afp-title">Enter OTP</div>
                  <p className="afp-subtitle">
                    A 6-digit OTP was sent to <strong>{maskedEmail}</strong>. It expires in 10 minutes.
                  </p>

                  <form onSubmit={handleVerifyOtp}>
                    <div className="afp-field">
                      <label className="afp-label">One-Time Password</label>
                      <div className="afp-otp-row" onPaste={handleOtpPaste}>
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => otpRefs.current[i] = el}
                            className={`afp-otp-box${digit ? " filled" : ""}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => { clearMessages(); handleOtpChange(i, e.target.value); }}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      className="afp-btn"
                      type="submit"
                      disabled={loading || otp.join("").length < 6}
                    >
                      {loading ? <><span className="afp-spinner" />Verifying...</> : "Verify OTP →"}
                    </button>
                  </form>

                  <div className="afp-resend">
                    Didn't receive it?&nbsp;
                    <button onClick={handleResend} disabled={timer > 0 || loading}>
                      {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                    </button>
                  </div>

                  <div className="afp-back">
                    <span>Wrong username?</span>
                    <a href="#" onClick={e => { e.preventDefault(); setStep(STEP_USERNAME); clearMessages(); }}>
                      Go back
                    </a>
                  </div>
                </>
              )}

              {step === STEP_RESET && (
                <>
                  <div className="afp-icon">🔑</div>
                  <div className="afp-title">Set New Password</div>
                  <p className="afp-subtitle">
                    Choose a strong password for your admin account.
                  </p>

                  <form onSubmit={handleResetPassword}>
                    <div className="afp-field">
                      <label className="afp-label">New Password</label>
                      <div className="afp-input-wrap">
                        <input
                          className="afp-input"
                          type={showPass ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          value={newPassword}
                          style={{ paddingRight: "44px" }}
                          onChange={e => { clearMessages(); setNewPassword(e.target.value); }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="afp-eye"
                          onClick={() => setShowPass(s => !s)}
                          tabIndex={-1}
                        >
                          {showPass ? "🙈" : "👁️"}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="afp-strength">
                          {[0,1,2,3].map(i => {
                            let cls = "";
                            const len = newPassword.length;
                            const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
                            const hasNum     = /\d/.test(newPassword);
                            const strength   = (len >= 6 ? 1 : 0) + (len >= 10 ? 1 : 0) + (hasSpecial ? 1 : 0) + (hasNum ? 1 : 0);
                            if (i < strength) {
                              cls = strength <= 1 ? "weak" : strength <= 2 ? "medium" : "strong";
                            }
                            return <div key={i} className={`afp-strength-bar ${cls}`} />;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="afp-field">
                      <label className="afp-label">Confirm Password</label>
                      <input
                        className="afp-input"
                        type={showPass ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPass}
                        onChange={e => { clearMessages(); setConfirmPass(e.target.value); }}
                      />
                      {confirmPass && newPassword && confirmPass !== newPassword && (
                        <p style={{ color: "#fca5a5", fontSize: "12px", marginTop: "6px" }}>
                          ✗ Passwords don't match
                        </p>
                      )}
                      {confirmPass && newPassword && confirmPass === newPassword && (
                        <p style={{ color: "#86efac", fontSize: "12px", marginTop: "6px" }}>
                          ✓ Passwords match
                        </p>
                      )}
                    </div>

                    <button
                      className="afp-btn"
                      type="submit"
                      disabled={loading || !newPassword || !confirmPass}
                    >
                      {loading
                        ? <><span className="afp-spinner" />Resetting...</>
                        : "Reset Password ✓"}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
