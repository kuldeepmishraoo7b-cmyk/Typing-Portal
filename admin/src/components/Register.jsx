import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Register() {
  const [students, setStudents] = useState([]);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");

  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const fetchStudents = () => {
    axios.get("${API_BASE_URL}/students")
      .then(res => setStudents(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxPhoto(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Delete this student?")) {
      axios.delete(`${API_BASE_URL}/delete-student/${id}`)
        .then(fetchStudents)
        .catch(err => console.log(err));
    }
  };

  const handleEdit = (student) => {
    setEditData(student);
  };

  const handleUpdate = () => {
    axios.put(`${API_BASE_URL}/update-student/${editData.id}`, {
      username: editData.username,
      phone: editData.phone
    })
      .then(() => {
        setEditData(null);
        fetchStudents();
      })
      .catch(err => console.log(err));
  };

  const filteredStudents = students.filter(s =>
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const getPhotoSrc = (image) => {
    if (!image) return "https://via.placeholder.com/50";
    if (image.startsWith("data:image")) return image;
    return `data:image/jpeg;base64,${image}`;
  };

  return (
    <div className="container mt-4">

      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            style={{
              position: "absolute",
              top: "20px",
              right: "28px",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            ✕
          </button>

          <img
            src={lightboxPhoto}
            alt="Student large view"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              borderRadius: "16px",
              boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
              objectFit: "contain",
              cursor: "default",
            }}
          />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">👨‍🎓 Students</h3>

        <input
          type="text"
          className="form-control w-25"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {editData && (
        <div className="card shadow p-3 mb-4 border-0">
          <h5 className="mb-3 text-primary">✏️ Edit Student</h5>

          <div className="row">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                value={editData.username}
                onChange={(e) =>
                  setEditData({ ...editData, username: e.target.value })
                }
                placeholder="Username"
              />
            </div>

            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                value={editData.phone}
                onChange={(e) =>
                  setEditData({ ...editData, phone: e.target.value })
                }
                placeholder="Phone"
              />
            </div>

            <div className="col-md-2 d-flex gap-2">
              <button className="btn btn-success w-100" onClick={handleUpdate}>
                Save
              </button>
              <button className="btn btn-secondary w-100" onClick={() => setEditData(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Photo</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>

                    <td>
                      <img
                        src={getPhotoSrc(student.image)}
                        alt="student"
                        className="rounded-circle shadow-sm"
                        style={{
                          width: "55px",
                          height: "55px",
                          objectFit: "cover",
                          cursor: "zoom-in",
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onClick={() => setLightboxPhoto(getPhotoSrc(student.image))}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = "scale(1.12)";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "";
                        }}
                      />
                    </td>

                    <td className="fw-semibold">{student.username}</td>
                    <td>{student.phone}</td>

                    <td>
                      <button
                        className="btn btn-outline-warning btn-sm me-2"
                        onClick={() => handleEdit(student)}
                      >
                        ✏️
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(student.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-muted py-4">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
