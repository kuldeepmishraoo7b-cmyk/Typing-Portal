import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaTachometerAlt,
  FaBook,
  FaFileAlt,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaKeyboard,
  FaPaperPlane,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from "react-icons/fa";
import Practice from "./Practice";
import Exam from "./Exam";
import Results from "./Result";
import Instructions from "./Instructions";
import "../App.css";
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  .sd-root * { box-sizing: border-box; }
  .sd-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex;
    min-height: 100vh;
    background: #f0f2f7;
  }
  /* ── SIDEBAR ── */
  .sd-sidebar {
    width: 260px;
    min-height: 100vh;
    background: linear-gradient(175deg, #0f172a 0%, #1e293b 60%, #0f2044 100%);
    display: flex;
    flex-direction: column;
    padding: 0;
    position: fixed;
    top: 0; left: 0;
    z-index: 100;
    box-shadow: 4px 0 24px rgba(0,0,0,0.18);
  }
  .sd-sidebar-brand {
    padding: 28px 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .sd-sidebar-brand h4 {
    color: #fff;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sd-brand-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px #38bdf8;
    display: inline-block;
  }
  .sd-sidebar-brand p {
    color: #94a3b8;
    font-size: 0.78rem;
    margin: 0;
    font-weight: 500;
  }
  .sd-sidebar-brand b {
    color: #e2e8f0;
    font-weight: 700;
  }
  .sd-nav {
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sd-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 16px;
    border-radius: 10px;
    cursor: pointer;
    color: #94a3b8;
    font-size: 0.88rem;
    font-weight: 600;
    transition: all 0.18s ease;
    position: relative;
    overflow: hidden;
  }
  .sd-nav-item:hover {
    background: rgba(255,255,255,0.07);
    color: #e2e8f0;
  }
  .sd-nav-item.active {
    background: linear-gradient(90deg, rgba(56,189,248,0.18), rgba(56,189,248,0.06));
    color: #38bdf8;
    border-left: 3px solid #38bdf8;
  }
  .sd-nav-item.active .sd-nav-icon {
    color: #38bdf8;
  }
  .sd-nav-item.logout:hover {
    background: rgba(239,68,68,0.12);
    color: #f87171;
  }
  .sd-nav-icon {
    font-size: 0.95rem;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
  }
  .sd-sidebar-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.07);
    color: #475569;
    font-size: 0.72rem;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.3px;
  }
  /* ── MAIN CONTENT ── */
  .sd-main {
    margin-left: 260px;
    flex: 1;
    padding: 32px 36px;
    min-height: 100vh;
  }
  /* ── WELCOME CARD ── */
  .sd-welcome {
    background: linear-gradient(120deg, #1e3a5f 0%, #0f2044 50%, #1a1a4e 100%);
    border-radius: 20px;
    padding: 36px 40px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(15,32,68,0.28);
  }
  .sd-welcome::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: rgba(56,189,248,0.08);
    pointer-events: none;
  }
  .sd-welcome::after {
    content: '';
    position: absolute;
    bottom: -40px; right: 80px;
    width: 140px; height: 140px;
    border-radius: 50%;
    background: rgba(99,102,241,0.08);
    pointer-events: none;
  }
  .sd-welcome-top {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
  }
  .sd-welcome-icon {
    width: 56px; height: 56px;
    border-radius: 14px;
    background: rgba(56,189,248,0.15);
    display: flex; align-items: center; justify-content: center;
    color: #38bdf8;
    font-size: 1.5rem;
    border: 1px solid rgba(56,189,248,0.2);
    flex-shrink: 0;
  }
  .sd-welcome h4 {
    color: #fff;
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 4px;
  }
  .sd-welcome p {
    color: #94a3b8;
    margin: 0;
    font-size: 0.9rem;
  }
  .sd-welcome-btns {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .sd-btn-primary {
    padding: 10px 22px;
    background: #38bdf8;
    color: #0f172a;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.18s;
    box-shadow: 0 4px 14px rgba(56,189,248,0.3);
  }
  .sd-btn-primary:hover {
    background: #7dd3fc;
    transform: translateY(-1px);
  }
  .sd-btn-success {
    padding: 10px 22px;
    background: rgba(52,211,153,0.15);
    color: #34d399;
    border: 1px solid rgba(52,211,153,0.3);
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.18s;
  }
  .sd-btn-success:hover {
    background: rgba(52,211,153,0.25);
    transform: translateY(-1px);
  }
  /* ── STAT CARDS ── */
  .sd-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-bottom: 28px;
  }
  .sd-stat-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.04);
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .sd-stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }
  .sd-stat-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    flex-shrink: 0;
  }
  .sd-stat-icon.blue { background: #eff6ff; color: #3b82f6; }
  .sd-stat-icon.green { background: #f0fdf4; color: #22c55e; }
  .sd-stat-icon.amber { background: #fffbeb; color: #f59e0b; }
  .sd-stat-label {
    color: #64748b;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .sd-stat-title {
    color: #1e293b;
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }
  .sd-stat-sub {
    color: #94a3b8;
    font-size: 0.78rem;
    margin: 0;
  }
  /* ── MESSAGE SECTION ── */
  .sd-msg-card {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.04);
    overflow: hidden;
  }
  .sd-msg-header {
    padding: 22px 28px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sd-msg-header h5 {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: #1e293b;
  }
  .sd-msg-header-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #38bdf8;
  }
  .sd-msg-body {
    padding: 24px 28px;
  }
  .sd-textarea {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.9rem;
    color: #1e293b;
    resize: none;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    margin-bottom: 14px;
    background: #f8fafc;
  }
  .sd-textarea:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
    background: #fff;
  }
  .sd-send-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 24px;
    background: linear-gradient(135deg, #0f2044, #1e3a5f);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.18s;
    box-shadow: 0 4px 14px rgba(15,32,68,0.25);
  }
  .sd-send-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(15,32,68,0.35);
  }
  .sd-divider {
    border: none;
    border-top: 1px solid #f1f5f9;
    margin: 24px 0 20px;
  }
  .sd-msgs-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 16px;
  }
  .sd-msg-empty {
    text-align: center;
    color: #94a3b8;
    padding: 32px 0;
    font-size: 0.9rem;
  }
  /* ── MESSAGE BUBBLE ── */
  .sd-bubble {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px 20px;
    margin-bottom: 14px;
    transition: box-shadow 0.18s;
  }
  .sd-bubble:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  }
  .sd-bubble-you {
    font-size: 0.9rem;
    color: #1e293b;
    margin-bottom: 12px;
    line-height: 1.5;
  }
  .sd-bubble-you span {
    font-weight: 700;
    color: #0f172a;
  }
  .sd-bubble-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .sd-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .sd-status-badge.pending {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  .sd-status-badge.accepted {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  .sd-status-badge.declined {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  .sd-bubble-reply {
    margin-top: 12px;
    padding: 10px 14px;
    background: linear-gradient(90deg, rgba(56,189,248,0.07), rgba(99,102,241,0.04));
    border-left: 3px solid #38bdf8;
    border-radius: 0 8px 8px 0;
    font-size: 0.85rem;
    color: #334155;
  }
  .sd-bubble-reply span {
    font-weight: 700;
    color: #0f172a;
  }
  .sd-delete-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: transparent;
    border: 1px solid #fecaca;
    color: #ef4444;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.15s;
  }
  .sd-delete-btn:hover {
    background: #fef2f2;
    border-color: #ef4444;
  }
`;
export default function Dashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem("activeMenu") || "dashboard";
  });
  const [username, setUsername] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const studentData = sessionStorage.getItem("studentData");
    if (!studentData) {
      const keys = ["studentData","studentLogin","login_id","username","activeMenu"];
      keys.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
      navigate("/login", { replace: true });
      return;
    }
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);
  useEffect(() => {
    localStorage.setItem("activeMenu", activeMenu);
    const data = JSON.parse(sessionStorage.getItem("studentData") || localStorage.getItem("studentData"));
    if (data && data.username) {
      setUsername(data.username);
      const loginKey = `hasLoggedInBefore_${data.id}`;
      const hasLoggedInBefore = localStorage.getItem(loginKey);
      if (!hasLoggedInBefore) {
        setIsFirstLogin(true);
        localStorage.setItem(loginKey, "true");
      } else {
        setIsFirstLogin(false);
      }
    }
  }, [activeMenu]);
  useEffect(() => {
    fetchStudentMessages();
  }, []);
  const fetchStudentMessages = async () => {
    const student = JSON.parse(sessionStorage.getItem("studentData") || localStorage.getItem("studentData"));
    if (!student) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/student-messages/${student.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const student = JSON.parse(sessionStorage.getItem("studentData") || localStorage.getItem("studentData"));
    try {
      await axios.post("http://localhost:5000/api/send-message", {
        student_id: student.id,
        student_name: student.username,
        student_photo: student.photo,
        message: message
      });
      alert("Message sent successfully!");
      setMessage("");
      fetchStudentMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Error sending message");
    }
  };
  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/delete-message/${id}`);
      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert("Error deleting message");
    }
  };
  const menuItems = [
    { name: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { name: "practice", label: "Practice", icon: <FaBook /> },
    { name: "exam", label: "Exam", icon: <FaFileAlt /> },
    { name: "result", label: "Result", icon: <FaChartBar /> },
    { name: "Instructions", label: "Instructions", icon: <FaCog /> },
    { name: "logout", label: "Logout", icon: <FaSignOutAlt />, className: "logout" },
  ];
  const handleMenuClick = (menuName) => {
    if (menuName === "logout") {
      alert("Logged out successfully!");
      const keys = ["activeMenu","studentData","studentLogin","username","login_id"];
      keys.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
      navigate("/login", { replace: true });
    } else {
      setActiveMenu(menuName);
    }
  };
  const statCards = [
    { icon: <FaBook />, iconClass: "blue", label: "Mode", title: "Practice", sub: "Improve daily" },
    { icon: <FaFileAlt />, iconClass: "green", label: "Mode", title: "Exam", sub: "Test yourself" },
    { icon: <FaChartBar />, iconClass: "amber", label: "Track", title: "Results", sub: "View progress" },
  ];
  const displayName = username
    ? username.charAt(0).toUpperCase() + username.slice(1)
    : "Student";
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div>
            <div className="sd-welcome">
              <div className="sd-welcome-top">
                <div className="sd-welcome-icon"><FaKeyboard /></div>
                <div>
                  <h4>
                    {isFirstLogin
                      ? `Welcome, ${displayName} 👋`
                      : `Welcome  ${displayName} 👋`}
                  </h4>
                  <p>
                    {isFirstLogin
                      ? "Great to have you here! Let's start sharpening your typing skills."
                      : "Ready to sharpen your typing skills today?"}
                  </p>
                </div>
              </div>
              <div className="sd-welcome-btns">
                <button className="sd-btn-primary" onClick={() => setActiveMenu("practice")}>Start Practice</button>
                <button className="sd-btn-success" onClick={() => setActiveMenu("exam")}>Take Exam</button>
              </div>
            </div>
            <div className="sd-stats">
              {statCards.map((s, i) => (
                <div className="sd-stat-card" key={i}>
                  <div className={`sd-stat-icon ${s.iconClass}`}>{s.icon}</div>
                  <div>
                    <div className="sd-stat-label">{s.label}</div>
                    <p className="sd-stat-title">{s.title}</p>
                    <p className="sd-stat-sub">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="sd-msg-card">
              <div className="sd-msg-header">
                <div className="sd-msg-header-dot" />
                <h5>Send Request / Message</h5>
              </div>
              <div className="sd-msg-body">
                <textarea
                  className="sd-textarea"
                  rows="4"
                  placeholder="Write your message or request to admin..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button className="sd-send-btn" onClick={handleSendMessage}>
                  <FaPaperPlane size={13} />
                  Send Message
                </button>
                <hr className="sd-divider" />
                <div className="sd-msgs-title">Your Messages</div>
                {messages.length === 0 ? (
                  <div className="sd-msg-empty">No messages sent yet</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="sd-bubble">
                      <p className="sd-bubble-you">
                        <span>You: </span>{msg.message}
                      </p>
                      <div className="sd-bubble-meta">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {msg.status === "Accepted" && (
                            <span className="sd-status-badge accepted"><FaCheckCircle size={10} /> Accepted</span>
                          )}
                          {msg.status === "Declined" && (
                            <span className="sd-status-badge declined"><FaTimesCircle size={10} /> Declined</span>
                          )}
                          {msg.status === "Pending" && (
                            <span className="sd-status-badge pending"><FaClock size={10} /> Pending</span>
                          )}
                        </div>
                        <button className="sd-delete-btn" onClick={() => handleDeleteMessage(msg.id)}>
                          <FaTrash size={10} /> Delete
                        </button>
                      </div>
                      {msg.reply && (
                        <div className="sd-bubble-reply">
                          <span>Admin: </span>{msg.reply}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case "practice": return <Practice />;
      case "exam": return <Exam />;
      case "result": return <Results />;
      case "Instructions": return <Instructions />;
      default: return <h2>Welcome</h2>;
    }
  };
  return (
    <>
      <style>{styles}</style>
      <div className="sd-root">
        <div className="sd-sidebar">
          <div className="sd-sidebar-brand">
            <h4><span className="sd-brand-dot" /> Student Panel</h4>
            <p>Logged in as <b>{username}</b></p>
          </div>
          <nav className="sd-nav">
            {menuItems.map(item => (
              <div
                key={item.name}
                className={`sd-nav-item ${activeMenu === item.name ? "active" : ""} ${item.className || ""}`}
                onClick={() => handleMenuClick(item.name)}
              >
                <span className="sd-nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
          <div className="sd-sidebar-footer">v1.0 · Typing Portal</div>
        </div>
        <div className="sd-main">
          {renderContent()}
        </div>
      </div>
    </>
  );
}
