import { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Form, Button, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import logo from "../assets/logo2.png";

const LOGO_SRC = logo;
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    height: 100vh;
    width: 100vw;
    background: #050d1a;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Exo 2', sans-serif;
  }

  /* ── Animated grid background ── */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,180,255,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,180,255,0.06) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }
  @keyframes gridMove {
    0%   { transform: perspective(500px) rotateX(10deg) translateY(0); }
    100% { transform: perspective(500px) rotateX(10deg) translateY(50px); }
  }

  /* ── Radial glow ── */
  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .glow-orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(0,120,255,0.25) 0%, transparent 70%);
    top: -100px; left: -100px;
    animation: orbFloat1 8s ease-in-out infinite alternate;
  }
  .glow-orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(0,220,200,0.18) 0%, transparent 70%);
    bottom: -80px; right: -80px;
    animation: orbFloat2 10s ease-in-out infinite alternate;
  }
  @keyframes orbFloat1 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(40px, 30px) scale(1.1); }
  }
  @keyframes orbFloat2 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(-30px, -40px) scale(1.15); }
  }

  /* ── Floating particles ── */
  .particles { position: absolute; inset: 0; pointer-events: none; }
  .particle {
    position: absolute;
    width: 3px; height: 3px;
    border-radius: 50%;
    background: rgba(0,200,255,0.7);
    animation: particleFly linear infinite;
    box-shadow: 0 0 6px rgba(0,200,255,0.8);
  }
  @keyframes particleFly {
    0%   { transform: translateY(100vh) translateX(0); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-10vh) translateX(var(--dx, 0px)); opacity: 0; }
  }

  /* ── Title ── */
  .login-title {
    position: absolute;
    top: 7%;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    color: #fff;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: clamp(18px, 2.5vw, 30px);
    letter-spacing: 4px;
    text-transform: uppercase;
    text-shadow: 0 0 20px rgba(0,180,255,0.8), 0 0 40px rgba(0,180,255,0.4);
    animation: titleGlow 3s ease-in-out infinite alternate;
    z-index: 10;
  }
  @keyframes titleGlow {
    from { text-shadow: 0 0 15px rgba(0,180,255,0.6), 0 0 30px rgba(0,180,255,0.3); }
    to   { text-shadow: 0 0 25px rgba(0,220,255,1),   0 0 60px rgba(0,180,255,0.6), 0 0 80px rgba(0,100,255,0.3); }
  }
  .cursor-blink {
    animation: blink 0.9s step-end infinite;
    color: #00ccff;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── Card ── */
  .login-card {
    background: rgba(5,20,45,0.75) !important;
    backdrop-filter: blur(18px) !important;
    border-radius: 20px !important;
    border: 1px solid rgba(0,180,255,0.25) !important;
    box-shadow:
      0 0 0 1px rgba(0,180,255,0.08),
      0 8px 32px rgba(0,0,0,0.5),
      0 0 60px rgba(0,100,255,0.1),
      inset 0 1px 0 rgba(255,255,255,0.07) !important;
    position: relative;
    overflow: hidden;
    animation: cardAppear 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes cardAppear {
    from { opacity:0; transform: translateY(40px) scale(0.92); }
    to   { opacity:1; transform: translateY(0)   scale(1); }
  }
  .card-scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0,200,255,0.6), transparent);
    animation: scanLine 3.5s ease-in-out infinite;
    top: 0;
    z-index: 2;
  }
  @keyframes scanLine {
    0%   { top: 0%;   opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }

  /* ── Card corner accents ── */
  .corner { position: absolute; width: 18px; height: 18px; z-index: 3; }
  .corner-tl { top: 12px;  left: 12px;  border-top: 2px solid #00ccff; border-left: 2px solid #00ccff; }
  .corner-tr { top: 12px;  right: 12px; border-top: 2px solid #00ccff; border-right: 2px solid #00ccff; }
  .corner-bl { bottom: 12px; left: 12px;  border-bottom: 2px solid #00ccff; border-left: 2px solid #00ccff; }
  .corner-br { bottom: 12px; right: 12px; border-bottom: 2px solid #00ccff; border-right: 2px solid #00ccff; }

  /* ── Logo ── */
  .college-logo {
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
    width: 72px; height: 72px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid rgba(0,180,255,0.45);
    box-shadow: 0 0 20px rgba(0,150,255,0.4), 0 0 0 6px rgba(0,150,255,0.08);
    animation: logoPulse 3s ease-in-out infinite;
    overflow: hidden;
    padding: 4px;
  }
  @keyframes logoPulse {
    0%,100% { box-shadow: 0 0 20px rgba(0,150,255,0.4), 0 0 0 6px rgba(0,150,255,0.08); }
    50%      { box-shadow: 0 0 35px rgba(0,200,255,0.7), 0 0 0 6px rgba(0,200,255,0.15); }
  }

  /* ── Heading ── */
  .card-heading {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 24px;
    letter-spacing: 3px;
    text-align: center;
    color: #fff;
    text-transform: uppercase;
    margin-bottom: 6px;
    text-shadow: 0 0 12px rgba(0,180,255,0.5);
  }
  .card-sub {
    text-align: center;
    color: rgba(150,210,255,0.6);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 28px;
  }

  /* ── Divider ── */
  .cyber-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,180,255,0.4), transparent);
    margin-bottom: 24px;
  }

  /* ── Form labels ── */
  .form-label-cyber {
    color: rgba(0,200,255,0.9) !important;
    font-size: 11px !important;
    letter-spacing: 2px !important;
    text-transform: uppercase !important;
    font-weight: 600 !important;
    margin-bottom: 6px !important;
    font-family: 'Rajdhani', sans-serif !important;
  }

  /* ── Input wrapper with animated border ── */
  .input-wrapper {
    position: relative;
    margin-bottom: 20px;
  }
  .input-cyber {
    background: rgba(0,20,50,0.6) !important;
    border: 1px solid rgba(0,150,255,0.3) !important;
    border-radius: 8px !important;
    color: #e0f4ff !important;
    padding: 12px 16px 12px 42px !important;
    font-family: 'Exo 2', sans-serif !important;
    font-size: 14px !important;
    transition: all 0.3s ease !important;
    width: 100% !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .input-cyber::placeholder { color: rgba(100,160,220,0.4) !important; }
  .input-cyber:focus {
    border-color: rgba(0,200,255,0.7) !important;
    background: rgba(0,30,70,0.7) !important;
    box-shadow: 0 0 0 3px rgba(0,150,255,0.12), 0 0 20px rgba(0,150,255,0.1) !important;
    color: #fff !important;
  }
  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(0,180,255,0.6);
    font-size: 16px;
    pointer-events: none;
    z-index: 5;
  }
  .input-focus-bar {
    position: absolute;
    bottom: 0; left: 50%;
    width: 0; height: 2px;
    background: linear-gradient(90deg, #00aaff, #00ffcc);
    transform: translateX(-50%);
    transition: width 0.4s ease;
    border-radius: 0 0 8px 8px;
  }
  .input-cyber:focus ~ .input-focus-bar { width: 100%; }

  /* ── Login Button ── */
  .btn-cyber {
    width: 100%;
    margin-top: 8px;
    padding: 13px !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    letter-spacing: 3px !important;
    text-transform: uppercase !important;
    border: none !important;
    border-radius: 10px !important;
    background: linear-gradient(135deg, #0066ff, #00ccff) !important;
    color: #fff !important;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 20px rgba(0,120,255,0.35) !important;
    cursor: pointer;
  }
  .btn-cyber:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 30px rgba(0,150,255,0.55) !important;
    background: linear-gradient(135deg, #0077ff, #00ddff) !important;
  }
  .btn-cyber:active:not(:disabled) {
    transform: translateY(0) !important;
  }
  .btn-cyber:disabled {
    opacity: 0.75 !important;
    cursor: not-allowed !important;
  }
  .btn-cyber-shine {
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: btnShine 3s ease-in-out infinite;
  }
  @keyframes btnShine {
    0%   { left: -100%; }
    30%,100% { left: 150%; }
  }

  /* ── Forgot Password Link ── */
  .forgot-link-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: -12px;
    margin-bottom: 8px;
  }
  .forgot-link {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: 'Rajdhani', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(0,200,255,0.65);
    text-decoration: none;
    transition: color 0.25s ease, text-shadow 0.25s ease;
    position: relative;
  }
  .forgot-link::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,200,255,0.5), transparent);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  .forgot-link:hover {
    color: #00eeff;
    text-shadow: 0 0 10px rgba(0,220,255,0.6);
  }
  .forgot-link:hover::after {
    transform: scaleX(1);
  }

  /* ── Status bar ── */
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 18px;
    color: rgba(100,180,255,0.5);
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-family: 'Rajdhani', sans-serif;
  }
  .status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #00cc88;
    box-shadow: 0 0 8px #00cc88;
    animation: statusBlink 2s ease-in-out infinite;
  }
  @keyframes statusBlink {
    0%,100% { opacity:1; } 50% { opacity:0.3; }
  }

  /* ── Horizontal lines decorative ── */
  .hex-line {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    pointer-events: none;
  }
  .hex-line-top {
    top: 44px;
    background: linear-gradient(90deg, transparent, rgba(0,180,255,0.15), transparent);
  }
`;

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  duration: `${6 + Math.random() * 10}s`,
  delay: `${Math.random() * 10}s`,
  dx: `${(Math.random() - 0.5) * 80}px`,
  size: `${2 + Math.random() * 3}px`,
}));

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [loading, setLoading] = useState(false);

  const fullText = "Typing Management System";

  useEffect(() => {
    if (sessionStorage.getItem("adminLogin") === "true") {
      navigate("/dashboard", { replace: true });
    }
    window.history.replaceState(null, "", window.location.href);
  }, [navigate]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) index = 0;
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http:///admin-login", {
        username: username,
        password: password,
      });

      if (res.data.success) {
        sessionStorage.setItem("adminLogin", "true");
        sessionStorage.setItem("adminRole", res.data.role);
        sessionStorage.setItem("adminLoginTime", Date.now().toString());
        alert("Admin Login successful!");
        navigate("/dashboard", { replace: true });
      } else {
        alert("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "ERR_NETWORK") {
        alert("Backend server is not running. Please start backend.");
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="login-root">

        <div className="grid-bg" />

        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />

        <div className="particles">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                bottom: "-10px",
                animationDuration: p.duration,
                animationDelay: p.delay,
                "--dx": p.dx,
                width: p.size,
                height: p.size,
              }}
            />
          ))}
        </div>

        <h1 className="login-title">
          {displayText}
          <span className="cursor-blink">|</span>
        </h1>

        <Container fluid className="d-flex justify-content-center align-items-center">
          <Row className="justify-content-center w-100">
            <Col xs={11} sm={9} md={7} lg={5} xl={4}>

              <Card className="p-4 login-card">

                <div className="card-scan-line" />

                <div className="corner corner-tl" />
                <div className="corner corner-tr" />
                <div className="corner corner-bl" />
                <div className="corner corner-br" />

                <Card.Body style={{ position: "relative", zIndex: 1 }}>

                  <div className="college-logo">
                    <img
                      src={LOGO_SRC}
                      alt="College Logo"
                      style={{ width: "62px", height: "62px", objectFit: "contain" }}
                    />
                  </div>

                  <h3 className="card-heading">Admin Login</h3>
                  <p className="card-sub">Secure Access Portal</p>

                  <div className="cyber-divider" />

                  <Form onSubmit={handleLogin}>

                    <Form.Group className="mb-0">
                      <Form.Label className="form-label-cyber">Username</Form.Label>
                      <div className="input-wrapper">
                        <span className="input-icon">👤</span>
                        <Form.Control
                          type="text"
                          placeholder="Enter username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="input-cyber"
                        />
                        <div className="input-focus-bar" />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-0">
                      <Form.Label className="form-label-cyber">Password</Form.Label>
                      <div className="input-wrapper">
                        <span className="input-icon">🔒</span>
                        <Form.Control
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input-cyber"
                        />
                        <div className="input-focus-bar" />
                      </div>
                    </Form.Group>

                    <div className="forgot-link-wrap">
                        <button
                        type="button"
                       className="forgot-link"
                        onClick={() => navigate("/forgot-password")}
                          >
                       🔑 Forgot Password?
                     </button>
                     </div>

                       <button
                      type="submit"
                       className="btn-cyber"
                       disabled={loading}
                           >
                      <div className="btn-cyber-shine" />
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" style={{ marginRight: 8 }} />
                          Authenticating...
                        </>
                      ) : (
                        "Login"
                      )}
                    </button>

                  </Form>

                  <div className="status-bar">
                    <div className="status-dot" />
                    <span>System Online · SSL Secured</span>
                  </div>

                </Card.Body>
              </Card>

            </Col>
          </Row>
        </Container>

      </div>
    </>
  );
}

export default Login;
