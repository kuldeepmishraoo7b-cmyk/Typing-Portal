import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function ManageStudent() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [photoMap, setPhotoMap] = useState({});

  const [historyModal, setHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchPhotos = () => {
    axios
      .get("http://axios.get(`${API_BASE_URL}/students`);/students")
      .then((res) => {
        const map = {};
        res.data.forEach((s) => {
          if (s.username && s.image) map[s.username] = s.image;
        });
        setPhotoMap(map);
      })
      .catch((err) => console.log("Photo fetch error:", err));
  };

  const fetchData = () => {
    axios
      .get("http://axios.get(`${API_BASE_URL}/students`);/admin/login_activity")
      .then((res) => {
        setStudents(res.data);
        setLastUpdated(new Date());
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchData();
    fetchPhotos();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this record?")) {
      axios
        .delete(`http://axios.get(`${API_BASE_URL}/students`);/delete-activity/${id}`)
        .then(() => fetchData())
        .catch((err) => console.log(err));
    }
  };

  const handleClearAll = async () => {
    if (students.length === 0) {
      alert("No records to clear.");
      return;
    }
    if (!window.confirm(`⚠️ Clear ALL records?\n\nThis cannot be undone.`)) return;
    setClearing(true);
    try {
      await Promise.all(
        students.map((s) => axios.delete(`http://axios.get(`${API_BASE_URL}/students`);/delete-activity/${s.id}`))
      );
      setStudents([]);
      alert("✅ All records cleared.");
    } catch (err) {
      console.log(err);
      alert("Error deleting records.");
      fetchData();
    } finally {
      setClearing(false);
    }
  };

  const handleStudentClick = (username) => {
    setSelectedStudent(username);
    setHistoryModal(true);
    setHistoryLoading(true);

    const history = students
      .filter((s) => s.username === username)
      .sort((a, b) => new Date(b.login_time) - new Date(a.login_time));

    setStudentHistory(history);
    setHistoryLoading(false);
  };

  const closeModal = () => {
    setHistoryModal(false);
    setSelectedStudent(null);
    setStudentHistory([]);
  };

  const uniqueStudentsMap = {};
  students.forEach((item) => {
    if (!item.username) return;
    const existing = uniqueStudentsMap[item.username];
    if (!existing || new Date(item.login_time) > new Date(existing.login_time)) {
      uniqueStudentsMap[item.username] = item;
    }
  });
  const uniqueStudents = Object.values(uniqueStudentsMap);

  const filtered = uniqueStudents.filter((s) =>
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dt) => {
    if (!dt) return "N/A";
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatLastUpdated = (dt) => {
    if (!dt) return "";
    return dt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="container-fluid mt-3 px-3">
      <style>{`
        @keyframes livePulseAdmin {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(1.5); }
        }
        .student-row {
          cursor: pointer;
          transition: background 0.15s;
        }
        .student-row:hover {
          background: #eff6ff !important;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-box {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          width: 100%;
          max-width: 620px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-header-custom {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: #fff;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-body-custom {
          overflow-y: auto;
          padding: 18px 22px;
          flex: 1;
        }
        .history-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin-bottom: 8px;
          background: #f8fafc;
        }
        .history-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #3b82f6;
          flex-shrink: 0;
        }
        .close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: #fff;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 1rem;
          cursor: pointer;
          line-height: 1.4;
        }
        .close-btn:hover { background: rgba(255,255,255,0.35); }

        /* Student avatar in table */
        .student-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #bfdbfe;
          flex-shrink: 0;
        }
        .student-avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e40af;
          border: 2px solid #bfdbfe;
          flex-shrink: 0;
        }

        /* Modal student avatar */
        .modal-student-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(255,255,255,0.4);
        }
        .modal-student-avatar-placeholder {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          border: 3px solid rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: "#1e40af" }}>
            📊 Student Practice Activity
          </h4>
          <div className="d-flex align-items-center gap-1 mt-1">
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
              display: "inline-block", animation: "livePulseAdmin 1.2s infinite"
            }} />
            <small style={{ color: "#6b7280", fontSize: "0.78rem" }}>
              Live · every 5s
              {lastUpdated && ` · ${formatLastUpdated(lastUpdated)}`}
            </small>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <input
            type="text"
            className="form-control"
            style={{ width: 200 }}
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-outline-primary btn-sm" onClick={fetchData}>
            ⟳ Refresh
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleClearAll}
            disabled={clearing}
          >
            {clearing ? "Clearing..." : "🗑 Clear All"}
          </button>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Stat label="Total Students" value={uniqueStudents.length} color="#3b82f6" />
      </div>

      <div className="mb-2" style={{ fontSize: "0.78rem", color: "#6b7280" }}>
        💡 Click on any student row to view their full login history
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Photo</th>
                <th>Student</th>
                <th>Last Login</th>
                <th>Language</th>
                <th>Score</th>
                <th>Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, index) => (
                  <tr
                    key={item.id}
                    className="student-row"
                    onClick={() => handleStudentClick(item.username)}
                    title={`Click to see ${item.username}'s login history`}
                  >
                    <td>{index + 1}</td>
                    <td>
                      {photoMap[item.username] ? (
                        <img
                          src={photoMap[item.username]}
                          alt={item.username}
                          className="student-avatar"
                        />
                      ) : (
                        <span className="student-avatar-placeholder">
                          {item.username ? item.username.charAt(0).toUpperCase() : "?"}
                        </span>
                      )}
                    </td>
                    <td className="fw-bold" style={{ color: "#1e40af" }}>
                      👤 {item.username}
                    </td>
                    <td>{formatTime(item.login_time)}</td>
                    <td>{item.language || "N/A"}</td>
                    <td className="text-success fw-semibold">{item.score || 0}</td>
                    <td>{item.level_reached || 0}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete this record"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-muted py-4">No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 text-muted" style={{ fontSize: "0.8rem" }}>
        Showing {filtered.length} of {uniqueStudents.length}
      </div>

      {historyModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="d-flex align-items-center gap-3">
                {photoMap[selectedStudent] ? (
                  <img
                    src={photoMap[selectedStudent]}
                    alt={selectedStudent}
                    className="modal-student-avatar"
                  />
                ) : (
                  <div className="modal-student-avatar-placeholder">
                    {selectedStudent ? selectedStudent.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    📋 Login History
                  </div>
                  <div style={{ fontSize: "0.82rem", opacity: 0.85 }}>
                    {selectedStudent} · {studentHistory.length} session{studentHistory.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body-custom">
              {historyLoading ? (
                <div className="text-center py-4 text-muted">Loading...</div>
              ) : studentHistory.length === 0 ? (
                <div className="text-center py-4 text-muted">No history found.</div>
              ) : (
                studentHistory.map((record, i) => (
                  <div className="history-row" key={record.id}>
                    <div className="history-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b" }}>
                        {formatTime(record.login_time)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                        Language: {record.language || "N/A"} &nbsp;·&nbsp;
                        Score: <span style={{ color: "#10b981", fontWeight: 600 }}>{record.score || 0}</span> &nbsp;·&nbsp;
                        Level: {record.level_reached || 0}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "0.7rem",
                      background: "#dbeafe",
                      color: "#1e40af",
                      borderRadius: 20,
                      padding: "2px 10px",
                      fontWeight: 600
                    }}>
                      #{i + 1}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{
              padding: "12px 22px",
              borderTop: "1px solid #e5e7eb",
              fontSize: "0.75rem",
              color: "#9ca3af",
              textAlign: "right"
            }}>
              Sorted by most recent first
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      flex: "0 0 auto",
      minWidth: 140,
      background: "#f8fafc",
      borderRadius: 10,
      padding: "10px 18px",
      textAlign: "center",
      border: `1px solid ${color}33`
    }}>
      <div style={{ fontSize: "1.3rem", fontWeight: "bold", color }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{label}</div>
    </div>
  );
}

export default ManageStudent;
