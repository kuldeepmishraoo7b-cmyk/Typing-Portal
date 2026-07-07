import React, { useState, useEffect } from "react";
import { Card, Button, Badge, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "https:////axios.get(`${API_BASE_URL}/students`);";

export default function Dashboard() {

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  
  const adminRole = sessionStorage.getItem("adminRole"); 
  const isBoss = adminRole === "boss";

  
  useEffect(() => {
    if (sessionStorage.getItem("adminLogin") !== "true") {
      navigate("/", { replace: true });
      return;
    }

    const loginTime = sessionStorage.getItem("adminLoginTime");
    if (loginTime) {
      const eightHours = 8 * 60 * 60 * 1000;
      if (Date.now() - parseInt(loginTime) > eightHours) {
        sessionStorage.removeItem("adminLogin");
        sessionStorage.removeItem("adminRole");
        sessionStorage.removeItem("adminLoginTime");
        navigate("/", { replace: true });
        return;
      }
    }

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (sessionStorage.getItem("adminLogin") !== "true") {
        navigate("/", { replace: true });
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  
  const allSections = [
    { title: "Manage Exams", description: "Create and manage exams", link: "/Manageexam", allowedFor: ["boss", "admin"] },
    { title: "Manage Students", description: "View and edit student data", link: "/Managestudent", allowedFor: ["boss"] },
    { title: "Add Admin", description: "Add new administrators", link: "/addadmin", allowedFor: ["boss"] },
    { title: "Results", description: "Check exam results", link: "/results", allowedFor: ["boss"] },
    { title: "Register Students", description: "Check Register Students", link: "/Register", allowedFor: ["boss"] },
  ];

  
  const dashboardSections = allSections.filter(s => s.allowedFor.includes(adminRole));

  useEffect(() => {
    if (isBoss) fetchMessages(); 
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/messages`);
      const normalized = res.data.map(msg => ({
        ...msg,
        reply: msg.reply || "",
        status: msg.status || "Pending",
        replied: !!(msg.reply && msg.reply.trim()),
      }));
      setMessages(normalized);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const updateStatus = async (id, status) => {
    setMessages(prev =>
      prev.map(msg => msg.id === id ? { ...msg, status } : msg)
    );
    try {
      await axios.post(`${BASE_URL}/api/update-status`, { id, status });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleReplyChange = (id, value) => {
    setMessages(prev =>
      prev.map(msg => msg.id === id ? { ...msg, reply: value } : msg)
    );
  };

  const sendReply = async (id, status, reply) => {
    if (!reply || !reply.trim()) {
      alert("Please write a reply first!");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/api/reply-message`, { id, reply, status });
      setMessages(prev =>
        prev.map(msg => msg.id === id ? { ...msg, reply, replied: true } : msg)
      );
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Error sending reply");
    }
  };

  const deleteMessage = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/delete-message/${id}`);
      setMessages(prev => prev.filter(msg => msg.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert("Error deleting message");
    }
  };

  const getPhotoSrc = (photo) => {
    if (!photo) return null;
    if (photo.startsWith("data:")) return photo;
    return `data:image/jpeg;base64,${photo}`;
  };

  const getBadgeVariant = (status) => {
    if (status === "Accepted") return "success";
    if (status === "Declined") return "danger";
    return "warning";
  };

  return (
    <div className="container-fluid p-4" style={{ background: "#f0f4f8", minHeight: "100vh" }}>

      <h1 className="mb-4" style={{ fontWeight: "700", color: "#1e3c72" }}>
  
        Welcome, {isBoss ? "Super Admin" : "Admin"}
      </h1>


      {!isBoss && (
        <div style={{
          background: "#fff8e1",
          border: "1px solid #ffc107",
          borderRadius: "10px",
          padding: "12px 18px",
          marginBottom: "20px",
          color: "#856404",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>⚠️</span>
          <span>You have limited access. You can only create and manage exams.</span>
        </div>
      )}

    
      <div className="row">
        {dashboardSections.map((section, idx) => (
          <div key={idx} className="col-12 col-md-6 col-lg-4 mb-4">
            <Card
              className="shadow-lg border-0 rounded-4"
              style={{
                background: "linear-gradient(145deg, #ffffff, #e6ecf4)",
                cursor: "pointer",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
              }}
            >
              <Card.Body>
                <Card.Title style={{ fontWeight: "600", color: "#1e3c72" }}>
                  {section.title}
                </Card.Title>
                <Card.Text style={{ color: "#555", fontSize: "0.95rem" }}>
                  {section.description}
                </Card.Text>
                <Button
                  href={section.link}
                  variant="primary"
                  style={{
                    borderRadius: "30px",
                    background: "#1e3c72",
                    border: "none",
                    boxShadow: "0 5px 15px rgba(30,60,114,0.3)",
                  }}
                >
                  Go
                </Button>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      
      {isBoss && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(30,60,114,0.08)",
            padding: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
        
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              paddingBottom: "0.875rem",
              borderBottom: "1px solid #e8eef6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #1e3c72, #2a52a0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h5 style={{ margin: 0, fontWeight: "600", color: "#1e3c72", fontSize: "1rem" }}>
                  Student Requests
                </h5>
                <span style={{ fontSize: "0.78rem", color: "#7a90b0" }}>
                  {messages.length} request{messages.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {messages.filter(m => m.status === "Pending").length > 0 && (
              <span
                style={{
                  background: "#fff3cd",
                  color: "#856404",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  border: "1px solid #ffc107",
                }}
              >
                {messages.filter(m => m.status === "Pending").length} pending
              </span>
            )}
          </div>

        
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                color: "#9aabbf",
                border: "1.5px dashed #d0dcea",
                borderRadius: "12px",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c0cfe0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "10px" }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>No student requests yet</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  background: "#f8fafd",
                  border: "1px solid #e4eaf4",
                  borderRadius: "12px",
                  padding: "1rem 1.125rem",
                  marginBottom: "0.75rem",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#b8cae8";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,60,114,0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e4eaf4";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                    {getPhotoSrc(msg.student_photo) ? (
                      <img
                        src={getPhotoSrc(msg.student_photo)}
                        alt={msg.student_name}
                        style={{
                          width: "44px", height: "44px", borderRadius: "50%",
                          objectFit: "cover", flexShrink: 0, border: "2px solid #d0dcea",
                        }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "44px", height: "44px", borderRadius: "50%",
                          background: "linear-gradient(135deg, #1e3c72, #2a52a0)",
                          color: "white", display: "flex", alignItems: "center",
                          justifyContent: "center", fontWeight: "600", fontSize: "1rem",
                          flexShrink: 0, boxShadow: "0 2px 8px rgba(30,60,114,0.25)",
                        }}
                      >
                        {msg.student_name ? msg.student_name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: "600", color: "#1e3c72", fontSize: "0.9rem" }}>
                        {msg.student_name}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0", color: "#5a7498", fontSize: "0.82rem",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}
                        title={msg.message}
                      >
                        {msg.message}
                      </p>
                    </div>
                  </div>
                  <Badge bg={getBadgeVariant(msg.status)} style={{ fontSize: "0.72rem", padding: "5px 10px", borderRadius: "20px", flexShrink: 0, fontWeight: "600" }}>
                    {msg.status}
                  </Badge>
                </div>

                <div style={{ height: "1px", background: "#e4eaf4", margin: "0.875rem 0" }} />

                {msg.replied ? (
                  <div style={{ background: "#f0f7f0", border: "1px solid #b7ddb7", borderRadius: "8px", padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#198754" }}>Reply sent</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#2d5a2d", lineHeight: "1.5" }}>{msg.reply}</p>
                  </div>
                ) : (
                  <Form.Control
                    as="textarea" rows={2}
                    placeholder={`Write a reply to ${msg.student_name}...`}
                    value={msg.reply}
                    onChange={(e) => handleReplyChange(msg.id, e.target.value)}
                    style={{
                      fontSize: "0.85rem", border: "1px solid #d0dcea", borderRadius: "8px",
                      background: "#ffffff", color: "#2d3f5a", padding: "8px 10px", resize: "vertical",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#1e3c72"; e.target.style.boxShadow = "0 0 0 3px rgba(30,60,114,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#d0dcea"; e.target.style.boxShadow = "none"; }}
                  />
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "0.75rem" }}>
                  <button onClick={() => updateStatus(msg.id, "Accepted")} disabled={msg.status === "Accepted"}
                    style={{ fontSize: "0.8rem", padding: "6px 14px", borderRadius: "8px", border: "1px solid #198754", background: msg.status === "Accepted" ? "#d1e7dd" : "#ffffff", color: "#198754", cursor: msg.status === "Accepted" ? "not-allowed" : "pointer", opacity: msg.status === "Accepted" ? 0.6 : 1, fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Accept
                  </button>

                  <button onClick={() => updateStatus(msg.id, "Declined")} disabled={msg.status === "Declined"}
                    style={{ fontSize: "0.8rem", padding: "6px 14px", borderRadius: "8px", border: "1px solid #dc3545", background: msg.status === "Declined" ? "#f8d7da" : "#ffffff", color: "#dc3545", cursor: msg.status === "Declined" ? "not-allowed" : "pointer", opacity: msg.status === "Declined" ? 0.6 : 1, fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    Decline
                  </button>

                  {!msg.replied && (
                    <button onClick={() => sendReply(msg.id, msg.status, msg.reply)}
                      style={{ fontSize: "0.8rem", padding: "6px 14px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1e3c72, #2a52a0)", color: "#ffffff", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px", boxShadow: "0 2px 8px rgba(30,60,114,0.3)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                      Send Reply
                    </button>
                  )}

                  <button onClick={() => setConfirmDeleteId(confirmDeleteId === msg.id ? null : msg.id)}
                    style={{ fontSize: "0.8rem", padding: "6px 14px", borderRadius: "8px", border: "1px solid #dc3545", background: confirmDeleteId === msg.id ? "#f8d7da" : "transparent", color: "#dc3545", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px", marginLeft: "auto" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                    Delete
                  </button>
                </div>

                {confirmDeleteId === msg.id && (
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "#fff5f5", border: "1px solid #f5c2c7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      <span style={{ fontSize: "0.82rem", color: "#842029", fontWeight: "500" }}>Delete this message permanently?</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: "0.78rem", padding: "5px 14px", borderRadius: "7px", border: "1px solid #d0dcea", background: "#ffffff", color: "#5a7498", cursor: "pointer", fontWeight: "500" }}>Cancel</button>
                      <button onClick={() => deleteMessage(msg.id)} style={{ fontSize: "0.78rem", padding: "5px 14px", borderRadius: "7px", border: "none", background: "#dc3545", color: "#ffffff", cursor: "pointer", fontWeight: "600", boxShadow: "0 2px 6px rgba(220,53,69,0.35)" }}>Yes, delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
