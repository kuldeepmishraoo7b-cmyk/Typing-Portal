// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

// ── Helper: read from sessionStorage first, fall back to localStorage ──────
// sessionStorage is wiped when the tab/browser closes.
// If sessionStorage has no data but localStorage does, that means the student
// opened a NEW tab (or closed and reopened) — we treat that as logged-out.
function getStudentData() {
  return sessionStorage.getItem("studentData") || null;
}

function clearAllStorage() {
  // Clear both storages completely
  const keys = ["studentData", "studentLogin", "login_id", "username", "activeMenu"];
  keys.forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}
// ──────────────────────────────────────────────────────────────────────────

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "ok" | "fail"

  useEffect(() => {
    const studentData = getStudentData(); // ← sessionStorage only
    if (!studentData) {
      clearAllStorage(); // wipe any stale localStorage too
      setStatus("fail");
      return;
    }

    // Verify the student still exists in DB (catches server restart scenario)
    const student = JSON.parse(studentData);
    axios
      .get(`http://https://typing-portal-es53.onrender.com/verify-session/${student.id}`)
      .then((res) => {
        if (res.data.valid) {
          setStatus("ok");
        } else {
          // Session invalid → clear both storages and send to login
          clearAllStorage();
          setStatus("fail");
        }
      })
      .catch(() => {
        // If server is down or any error → force login
        clearAllStorage();
        setStatus("fail");
      });
  }, []);

  if (status === "checking") {
    // Small loading screen while we verify
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
        Verifying session...
      </div>
    );
  }

  if (status === "fail") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
