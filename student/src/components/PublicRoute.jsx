// src/components/PublicRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

// ── Helper: read sessionStorage only (same logic as ProtectedRoute) ────────
function getStudentData() {
  return sessionStorage.getItem("studentData") || null;
}

function clearAllStorage() {
  const keys = ["studentData", "studentLogin", "login_id", "username", "activeMenu"];
  keys.forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}
// ──────────────────────────────────────────────────────────────────────────

export default function PublicRoute({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "loggedin" | "guest"
  const navigate = useNavigate();

  useEffect(() => {
    const studentData = getStudentData(); // ← sessionStorage only
    if (!studentData) {
      clearAllStorage(); // wipe any stale localStorage too
      setStatus("guest");
      return;
    }

    // Verify session is actually valid with the server
    const student = JSON.parse(studentData);
    axios
      .get(`http://https://typing-portal-es53.onrender.com/verify-session/${student.id}`)
      .then((res) => {
        if (res.data.valid) {
          setStatus("loggedin"); // Already logged in → go to dashboard

          // ── BACK BUTTON LOCK ──────────────────────────────────────
          // Push an extra history entry so if the user presses Back
          // they can NEVER land on / or /login while logged in.
          window.history.pushState(null, "", window.location.href);
          const handlePopState = () => {
            navigate("/dashboard", { replace: true });
          };
          window.addEventListener("popstate", handlePopState);
          return () => window.removeEventListener("popstate", handlePopState);
          // ─────────────────────────────────────────────────────────
        } else {
          // Stale sessionStorage → clear both and show login
          clearAllStorage();
          setStatus("guest");
        }
      })
      .catch(() => {
        // Server down or error → clear and show login
        clearAllStorage();
        setStatus("guest");
      });
  }, [navigate]);

  if (status === "checking") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#060d1f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#38bdf8",
        fontFamily: "sans-serif",
        fontSize: "1rem",
        gap: "12px"
      }}>
        <div style={{
          width: 20, height: 20,
          border: "2px solid rgba(56,189,248,0.3)",
          borderTopColor: "#38bdf8",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading...
      </div>
    );
  }

  if (status === "loggedin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
