import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";
import logo from "../assets/logo2.png";
import bg from "../assets/mcu1.jpg";
import API_BASE_URL from "../config";

const LOGO_SRC = logo;
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');

  .login-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Campus background image */
  .login-bg-image {
    position: absolute;
    inset: 0;
    background-image: url(${bg});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
  }

  /* Dark overlay on top of background image */
  .login-bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(6, 13, 31, 0.82) 0%,
      rgba(6, 13, 31, 0.70) 50%,
      rgba(15, 32, 68, 0.80) 100%
    );
    z-index: 1;
  }

  /* Animated background orbs */
  .login-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.15;
    animation: orbFloat 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 2;
  }
  .login-orb-1 {
    width: 420px; height: 420px;
    background: radial-gradient(circle, #38bdf8, #6366f1);
    top: -120px; left: -100px;
    animation-delay: 0s;
  }
  .login-orb-2 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, #818cf8, #ec4899);
    bottom: -80px; right: -60px;
    animation-delay: -3s;
  }
  .login-orb-3 {
    width: 200px; height: 200px;
    background: radial-gradient(circle, #34d399, #06b6d4);
    bottom: 30%; left: 10%;
    animation-delay: -5s;
  }

  @keyframes orbFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-30px) scale(1.06); }
  }

  /* Grid overlay */
  .login-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 2;
  }

  /* Card */
  .login-card {
    position: relative;
    z-index: 10;
    width: 420px;
    background: rgba(10, 18, 38, 0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(56,189,248,0.15);
    border-radius: 24px;
    padding: 44px 40px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
    animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(32px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Logo mark */
  .login-logo {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid rgba(56,189,248,0.3);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 0 0 6px rgba(56,189,248,0.08), 0 4px 20px rgba(0,0,0,0.4);
    animation: logoPop 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both;
    overflow: hidden;
    padding: 4px;
  }

  @keyframes logoPop {
    from { opacity: 0; transform: scale(0.6); }
    to   { opacity: 1; transform: scale(1); }
  }

  .login-title {
    text-align: center;
    color: #f1f5f9;
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 6px;
    letter-spacing: -0.3px;
    animation: fadeUp 0.5s 0.25s both;
  }

  .login-sub {
    text-align: center;
    color: #64748b;
    font-size: 0.88rem;
    margin: 0 0 32px;
    animation: fadeUp 0.5s 0.3s both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Error */
  .login-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 10px;
    padding: 12px 16px;
    color: #f87171;
    font-size: 0.85rem;
    margin-bottom: 20px;
    animation: fadeUp 0.3s both;
  }

  /* Field group */
  .login-field {
    margin-bottom: 16px;
    animation: fadeUp 0.5s both;
  }
  .login-field:nth-child(1) { animation-delay: 0.35s; }
  .login-field:nth-child(2) { animation-delay: 0.4s; }

  .login-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 8px;
  }

  .login-input {
    width: 100%;
    background: rgba(30,41,59,0.8);
    border: 1.5px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 13px 16px;
    color: #f1f5f9;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.92rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }

  .login-input::placeholder { color: #475569; }

  .login-input:focus {
    border-color: #38bdf8;
    background: rgba(30,41,59,1);
    box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
  }

  /* Submit button */
  .login-btn {
    width: 100%;
    padding: 14px;
    margin-top: 8px;
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.2px;
    position: relative;
    overflow: hidden;
    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(56,189,248,0.25);
    animation: fadeUp 0.5s 0.45s both;
  }

  .login-btn:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(56,189,248,0.35);
  }

  .login-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Shimmer on button */
  .login-btn::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    animation: btnShimmer 2.5s 1s infinite;
  }

  @keyframes btnShimmer {
    0%   { left: -100%; }
    50%, 100% { left: 160%; }
  }

  /* Spinner */
  .login-spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Register link */
  .login-register {
    text-align: center;
    margin-top: 24px;
    font-size: 0.85rem;
    color: #475569;
    animation: fadeUp 0.5s 0.5s both;
  }

  .login-register a {
    color: #38bdf8;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.15s;
  }

  .login-register a:hover { color: #7dd3fc; }

  /* Divider line in footer */
  .login-divider {
    width: 40px; height: 2px;
    background: linear-gradient(90deg, #38bdf8, #6366f1);
    border-radius: 2px;
    margin: 0 auto 16px;
    animation: fadeUp 0.5s 0.5s both;
  }

  /* Mono tag */
  .login-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: #334155;
    text-align: center;
    margin-top: 28px;
    animation: fadeUp 0.5s 0.55s both;
  }

  /* Registered photo preview */
  .registered-photo-box {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 18px;
    padding: 12px;
    background: rgba(30,41,59,0.55);
    border: 1px solid rgba(56,189,248,0.15);
    border-radius: 14px;
    animation: fadeUp 0.35s both;
  }

  .registered-photo-thumb {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(56,189,248,0.55);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .registered-photo-thumb:hover {
    transform: scale(1.06);
    box-shadow: 0 0 18px rgba(56,189,248,0.35);
  }

  .registered-photo-text {
    color: #cbd5e1;
    font-size: 0.82rem;
    line-height: 1.35;
  }

  .registered-photo-text span {
    color: #38bdf8;
    font-weight: 700;
  }

  .password-wrap {
    position: relative;
  }

  .password-wrap .login-input {
    padding-right: 54px;
  }

  .password-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: rgba(15,23,42,0.75);
    color: #94a3b8;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: color 0.2s, background 0.2s;
  }

  .password-toggle:hover {
    color: #f1f5f9;
    background: rgba(56,189,248,0.18);
  }

  .photo-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(2,6,23,0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .photo-modal {
    width: min(420px, 94vw);
    background: rgba(10,18,38,0.96);
    border: 1px solid rgba(56,189,248,0.25);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.65);
    text-align: center;
  }

  .photo-modal img {
    width: 100%;
    max-height: 420px;
    object-fit: contain;
    border-radius: 16px;
    background: rgba(15,23,42,0.8);
  }

  .photo-modal-title {
    color: #f1f5f9;
    font-weight: 800;
    margin-bottom: 14px;
  }

  .photo-modal-close {
    width: 100%;
    margin-top: 14px;
    padding: 11px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    color: white;
    font-weight: 800;
    cursor: pointer;
  }

`;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registeredPhoto, setRegisteredPhoto] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const navigate = useNavigate();

  // Shows only the already registered photo. Student cannot upload or change it here.
  useEffect(() => {
    const searchValue = username.trim();

    if (searchValue.length < 2) {
      setRegisteredPhoto("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/students`);
        const students = Array.isArray(res.data) ? res.data : [];

        const matchedStudent = students.find((student) => {
          const savedUsername = String(student.username || "").toLowerCase();
          const savedPhone = String(student.phone || "").toLowerCase();
          const typedValue = searchValue.toLowerCase();

          return savedUsername === typedValue || savedPhone === typedValue;
        });

        setRegisteredPhoto(matchedStudent?.photo || "");
      } catch (err) {
        console.log("Photo preview fetch error:", err);
        setRegisteredPhoto("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/student-login`, {
  username,
  password,
});
      console.log("SERVER RESPONSE:", res.data);

      if (res.data.success) {
        alert("Student Login Successful");
        localStorage.setItem("login_id", res.data.login_id);
        localStorage.setItem("studentLogin", "true");
        localStorage.setItem("studentData", JSON.stringify(res.data.student));
        localStorage.setItem("username", res.data.student.username);

        // ── SESSION-ONLY STORAGE ──────────────────────────────────
        // Also store in sessionStorage so if the student closes the
        // tab / browser, the session is wiped automatically and they
        // must log in again when they return.
        sessionStorage.setItem("login_id", res.data.login_id);
        sessionStorage.setItem("studentLogin", "true");
        sessionStorage.setItem("studentData", JSON.stringify(res.data.student));
        sessionStorage.setItem("username", res.data.student.username);
        // ─────────────────────────────────────────────────────────

        // ✅ FIXED: was "/Dashboard" (capital D) — route is "/dashboard" (lowercase)
        navigate("/dashboard", { replace: true });
      } else {
        setError(res.data.message || "Invalid username or password");
      }
    } catch (err) {
      console.log("FULL ERROR:", err);
      if (err.response) {
        setError("Backend Error: " + JSON.stringify(err.response.data));
      } else if (err.request) {
        setError("Cannot connect to backend server (check port 5000)");
      } else {
        setError("Request error");
      }
    }

    setLoading(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">

        {/* Campus background image with overlay */}
        <div className="login-bg-image" />
        <div className="login-bg-overlay" />

        {/* Subtle grid + orbs on top */}
        <div className="login-grid" />
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />

        {/* Card */}
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo">
            <img src={LOGO_SRC} alt="College Logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
          </div>

          <h2 className="login-title">Welcome</h2>
          <p className="login-sub">Login to your student panel</p>

          {error && <div className="login-error">⚠ {error}</div>}

          {registeredPhoto && (
            <div className="registered-photo-box">
              <img
                src={registeredPhoto}
                alt="Registered Student"
                className="registered-photo-thumb"
                onClick={() => setShowPhotoModal(true)}
                title="Click to view bigger photo"
              />
              <div className="registered-photo-text">
                Registered photo found.<br />
                <span>Click photo to view bigger</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">Username</label>
              <input
                className="login-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="password-wrap">
                <input
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <><span className="login-spinner" />Logging in...</>
              ) : (
                "Login →"
              )}
            </button>
          </form>

          <div className="login-divider" style={{ marginTop: "28px" }} />

         <div className="login-register">
  Don't have an account?{" "}
  <Link to="/register">Register here</Link>
</div>

          <div className="forgot">
  <Link to="/forgot">Forgot Password?</Link>
</div>

        </div>

        {showPhotoModal && registeredPhoto && (
          <div className="photo-modal-backdrop" onClick={() => setShowPhotoModal(false)}>
            <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
              <div className="photo-modal-title">Registered Student Photo</div>
              <img src={registeredPhoto} alt="Registered Student Large" />
              <button
                type="button"
                className="photo-modal-close"
                onClick={() => setShowPhotoModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
