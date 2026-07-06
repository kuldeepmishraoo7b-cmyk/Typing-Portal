import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = { PHONE: 0, OTP: 1, NEW_PASSWORD: 2, SUCCESS: 3 }

const API = 'http://localhost:5000/api/forgot-password'  // ← change if your backend runs elsewhere

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  .fr-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .fr-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d0d0d;
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .fr-bg-circle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .fr-bg-circle-1 {
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(255,160,60,0.12) 0%, transparent 70%);
    top: -120px; right: -80px;
  }
  .fr-bg-circle-2 {
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(255,100,80,0.08) 0%, transparent 70%);
    bottom: -80px; left: -60px;
  }

  .fr-card {
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 20px;
    padding: 48px 44px;
    width: 100%;
    max-width: 420px;
    position: relative;
    animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fr-step-indicator {
    display: flex;
    gap: 6px;
    margin-bottom: 36px;
  }
  .fr-step-dot {
    height: 3px;
    border-radius: 2px;
    flex: 1;
    background: #2a2a2a;
    transition: background 0.4s;
  }
  .fr-step-dot.active { background: #ff9a3c; }
  .fr-step-dot.done   { background: #ff6b3d; }

  .fr-icon-wrap {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #ff9a3c22, #ff6b3d22);
    border: 1px solid #ff9a3c33;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px;
    font-size: 22px;
  }

  .fr-title {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    color: #f5f5f0;
    line-height: 1.2;
    margin-bottom: 8px;
  }
  .fr-subtitle {
    font-size: 13.5px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 32px;
  }
  .fr-subtitle span { color: #ff9a3c; font-weight: 500; }

  .fr-label {
    display: block;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 8px;
  }

  .fr-input-wrap {
    position: relative;
    margin-bottom: 20px;
  }
  .fr-input-prefix {
    position: absolute;
    left: 14px; top: 50%;
    transform: translateY(-50%);
    color: #555;
    font-size: 14px;
    pointer-events: none;
    font-weight: 500;
  }
  .fr-input {
    width: 100%;
    background: #0d0d0d;
    border: 1.5px solid #2a2a2a;
    border-radius: 12px;
    padding: 14px 16px 14px 38px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    color: #f0f0ec;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    letter-spacing: 0.01em;
  }
  .fr-input::placeholder { color: #3a3a3a; }
  .fr-input:focus {
    border-color: #ff9a3c;
    box-shadow: 0 0 0 3px rgba(255,154,60,0.1);
  }
  .fr-input.error { border-color: #ff4d4d; box-shadow: 0 0 0 3px rgba(255,77,77,0.1); }
  .fr-input.no-prefix { padding-left: 16px; }

  .fr-otp-row {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    width: 100%;
  }
  .fr-otp-box {
    flex: 1 1 0;
    min-width: 0;
    width: 0;
    background: #0d0d0d;
    border: 1.5px solid #2a2a2a;
    border-radius: 12px;
    padding: 12px 0;
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    font-family: 'DM Serif Display', serif;
    color: #f0f0ec;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    caret-color: #ff9a3c;
  }
  .fr-otp-box:focus {
    border-color: #ff9a3c;
    box-shadow: 0 0 0 3px rgba(255,154,60,0.1);
  }
  .fr-otp-box.filled { border-color: #ff9a3c55; }
  .fr-otp-box.error  { border-color: #ff4d4d; }

  .fr-timer {
    font-size: 12.5px;
    color: #555;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .fr-timer-count { color: #ff9a3c; font-weight: 600; font-size: 13px; }
  .fr-resend {
    background: none; border: none; cursor: pointer;
    font-size: 12.5px; font-family: 'DM Sans', sans-serif;
    color: #ff9a3c; text-decoration: underline; padding: 0;
  }
  .fr-resend:disabled { color: #444; cursor: default; text-decoration: none; }

  .fr-password-wrap { position: relative; margin-bottom: 16px; }
  .fr-eye-btn {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #555; font-size: 15px; padding: 0; line-height: 1;
  }

  .fr-strength-bar { display: flex; gap: 4px; margin-bottom: 6px; }
  .fr-strength-seg {
    height: 3px; flex: 1; border-radius: 2px;
    background: #2a2a2a; transition: background 0.3s;
  }
  .fr-strength-label { font-size: 11px; color: #555; margin-bottom: 20px; }

  .fr-error-msg {
    font-size: 12px; color: #ff4d4d;
    margin-top: -14px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 4px;
  }

  .fr-btn {
    width: 100%;
    background: linear-gradient(135deg, #ff9a3c, #ff6b3d);
    border: none;
    border-radius: 12px;
    padding: 15px;
    font-size: 14.5px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    letter-spacing: 0.02em;
    box-shadow: 0 4px 20px rgba(255,107,61,0.3);
    position: relative;
    overflow: hidden;
  }
  .fr-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,107,61,0.4); }
  .fr-btn:active:not(:disabled) { transform: translateY(0); }
  .fr-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .fr-back-link {
    display: flex; align-items: center; gap: 6px;
    margin-top: 20px; justify-content: center;
    font-size: 13px; color: #555;
    cursor: pointer; transition: color 0.2s;
    background: none; border: none; font-family: 'DM Sans', sans-serif;
    width: 100%;
  }
  .fr-back-link:hover { color: #ff9a3c; }

  .fr-success-wrap { text-align: center; }
  .fr-success-icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff9a3c22, #ff6b3d22);
    border: 1px solid #ff9a3c44;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
    margin: 0 auto 24px;
    animation: popIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes popIn {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .fr-fade-enter { animation: fadeSlide 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .fr-spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle; margin-right: 8px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`

function getStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#ff4d4d', '#ffaa00', '#6dd58c', '#3ddc84']

export default function Forgot({ onNavigateToLogin }) {
  const navigate = useNavigate()
  const [step, setStep]                     = useState(STEPS.PHONE)
  const [phone, setPhone]                   = useState('')
  const [maskedEmail, setMaskedEmail]       = useState('')
  const [otp, setOtp]                       = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError]             = useState('')
  const [timer, setTimer]                   = useState(300)
  const [timerActive, setTimerActive]       = useState(false)
  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]               = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [pwError, setPwError]               = useState('')
  const [loading, setLoading]               = useState(false)
  const [phoneError, setPhoneError]         = useState('')
  const [animKey, setAnimKey]               = useState(0)

  const otpRefs  = useRef([])
  const timerRef = useRef(null)

  const goTo = (s) => { setAnimKey(k => k + 1); setStep(s) }

  // ── timer countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    }
    if (timer === 0) setTimerActive(false)
    return () => clearTimeout(timerRef.current)
  }, [timerActive, timer])

  const formatTimer = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── STEP 0: send OTP ────────────────────────────────────────────────────────
  const handlePhoneSubmit = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError('Enter a valid 10-digit phone number')
      return
    }
    setPhoneError('')
    setLoading(true)
    try {
      const res  = await fetch(`${API}/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (!res.ok) {
        // server returned 404 = phone not found, 500 = email error, etc.
        setPhoneError(data.message || 'No account found with this number.')
        return
      }

      setMaskedEmail(data.maskedEmail)
      setTimer(300)
      setTimerActive(true)
      goTo(STEPS.OTP)

    } catch {
      setPhoneError('Cannot connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 1: OTP input handlers ───────────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    setOtpError('')
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  // ── STEP 1: verify OTP ──────────────────────────────────────────────────────
  const handleOtpSubmit = async () => {
    const code = otp.join('')
    if (code.length < 6) { setOtpError('Enter all 6 digits'); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, otp: code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setOtpError(data.message || 'Incorrect OTP. Please try again.')
        return
      }

      setTimerActive(false)
      goTo(STEPS.NEW_PASSWORD)

    } catch {
      setOtpError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 1: resend OTP ──────────────────────────────────────────────────────
  const handleResend = async () => {
    setOtp(['', '', '', '', '', ''])
    setOtpError('')
    setTimer(300)
    setTimerActive(true)
    try {
      await fetch(`${API}/resend-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone }),
      })
    } catch {
      // silently ignore — timer already reset so user knows it's refreshed
    }
  }

  // ── STEP 2: reset password ──────────────────────────────────────────────────
  const handlePasswordSubmit = async () => {
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    setPwError('')
    setLoading(true)
    try {
      const res  = await fetch(`${API}/reset`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, otp: otp.join(''), newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPwError(data.message || 'Something went wrong. Please try again.')
        return
      }

      goTo(STEPS.SUCCESS)

    } catch {
      setPwError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    if (onNavigateToLogin) { onNavigateToLogin(); return }
    navigate('/login')
  }

  const strength  = getStrength(newPassword)
  const stepDots  = [0, 1, 2]

  return (
    <>
      <style>{styles}</style>
      <div className="fr-root">
        <div className="fr-bg-circle fr-bg-circle-1" />
        <div className="fr-bg-circle fr-bg-circle-2" />

        <div className="fr-card">
          {step !== STEPS.SUCCESS && (
            <div className="fr-step-indicator">
              {stepDots.map(i => (
                <div key={i} className={`fr-step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
              ))}
            </div>
          )}

          <div key={animKey} className="fr-fade-enter">

            {/* ── STEP 0: Phone ─────────────────────────────────────────────── */}
            {step === STEPS.PHONE && (
              <>
                <div className="fr-icon-wrap">📱</div>
                <div className="fr-title">Forgot password?</div>
                <div className="fr-subtitle">
                  Enter your registered phone number. We'll send an OTP to the email linked to your account.
                </div>

                <label className="fr-label">Phone number</label>
                <div className="fr-input-wrap">
                  <span className="fr-input-prefix">+91</span>
                  <input
                    className={`fr-input ${phoneError ? 'error' : ''}`}
                    type="tel" maxLength={10} value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneError('') }}
                    onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
                    placeholder="98765 43210"
                    autoFocus
                  />
                </div>
                {phoneError && <div className="fr-error-msg">⚠ {phoneError}</div>}

                <button className="fr-btn" onClick={handlePhoneSubmit} disabled={loading || !phone}>
                  {loading ? <><span className="fr-spinner" />Searching account…</> : 'Send OTP'}
                </button>

                <button className="fr-back-link" onClick={handleGoToLogin}>
                  ← Back to login
                </button>
              </>
            )}

            {/* ── STEP 1: OTP ───────────────────────────────────────────────── */}
            {step === STEPS.OTP && (
              <>
                <div className="fr-icon-wrap">✉️</div>
                <div className="fr-title">Check your email</div>
                <div className="fr-subtitle">
                  We've sent a 6-digit OTP to <span>{maskedEmail}</span>. It expires in 5 minutes.
                </div>

                <label className="fr-label">Enter OTP</label>
                <div className="fr-otp-row" onPaste={handleOtpPaste}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      className={`fr-otp-box ${otpError ? 'error' : d ? 'filled' : ''}`}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {otpError && <div className="fr-error-msg">⚠ {otpError}</div>}

                <div className="fr-timer">
                  <span>
                    {timer > 0
                      ? <>Expires in <span className="fr-timer-count">{formatTimer(timer)}</span></>
                      : <span style={{ color: '#ff4d4d' }}>OTP expired</span>
                    }
                  </span>
                  <button className="fr-resend" onClick={handleResend} disabled={timer > 240}>
                    Resend OTP
                  </button>
                </div>

                <button className="fr-btn" onClick={handleOtpSubmit}
                  disabled={loading || otp.join('').length < 6 || timer === 0}>
                  {loading ? <><span className="fr-spinner" />Verifying…</> : 'Verify OTP'}
                </button>

                <button className="fr-back-link" onClick={() => goTo(STEPS.PHONE)}>
                  ← Change phone number
                </button>
              </>
            )}

            {/* ── STEP 2: New Password ──────────────────────────────────────── */}
            {step === STEPS.NEW_PASSWORD && (
              <>
                <div className="fr-icon-wrap">🔐</div>
                <div className="fr-title">Create new password</div>
                <div className="fr-subtitle">
                  Choose a strong password. At least 8 characters with a mix of letters, numbers & symbols.
                </div>

                <label className="fr-label">New password</label>
                <div className="fr-password-wrap">
                  <input
                    className="fr-input no-prefix"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPwError('') }}
                    placeholder="Min. 8 characters"
                    autoFocus
                    style={{ paddingRight: '40px' }}
                  />
                  <button className="fr-eye-btn" onClick={() => setShowNew(v => !v)} type="button">
                    {showNew ? '🙈' : '👁'}
                  </button>
                </div>

                {newPassword && (
                  <>
                    <div className="fr-strength-bar">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="fr-strength-seg"
                          style={{ background: i <= strength ? STRENGTH_COLORS[strength] : '#2a2a2a' }} />
                      ))}
                    </div>
                    <div className="fr-strength-label" style={{ color: STRENGTH_COLORS[strength] }}>
                      {STRENGTH_LABELS[strength]}
                    </div>
                  </>
                )}

                <label className="fr-label">Confirm password</label>
                <div className="fr-password-wrap">
                  <input
                    className={`fr-input no-prefix ${pwError && confirmPassword ? 'error' : ''}`}
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPwError('') }}
                    onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="Re-enter password"
                    style={{ paddingRight: '40px' }}
                  />
                  <button className="fr-eye-btn" onClick={() => setShowConfirm(v => !v)} type="button">
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>

                {pwError && <div className="fr-error-msg">⚠ {pwError}</div>}

                <button className="fr-btn" onClick={handlePasswordSubmit}
                  disabled={loading || !newPassword || !confirmPassword}>
                  {loading ? <><span className="fr-spinner" />Updating password…</> : 'Update Password'}
                </button>
              </>
            )}

            {/* ── STEP 3: Success ───────────────────────────────────────────── */}
            {step === STEPS.SUCCESS && (
              <div className="fr-success-wrap">
                <div className="fr-success-icon">✅</div>
                <div className="fr-title" style={{ marginBottom: 10 }}>Password updated!</div>
                <div className="fr-subtitle" style={{ marginBottom: 36 }}>
                  Your password has been reset successfully. You can now log in with your new password.
                </div>
                <button className="fr-btn" onClick={handleGoToLogin}>
                  Continue to Login →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
