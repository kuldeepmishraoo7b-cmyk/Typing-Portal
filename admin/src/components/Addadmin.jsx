import { useState, useEffect } from "react";
import axios from "axios";
const BASE = "http://localhost:5000";
function AddAdmin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAdmins, setFetchingAdmins] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState({});
  useEffect(() => { fetchAdmins(); }, []);
  const fetchAdmins = async () => {
    setFetchingAdmins(true);
    try {
      const res = await axios.get(`${BASE}/api/get-admins`);
      setAdmins(res.data);
    } catch {
      showToast("Failed to load admins.", "error");
    } finally {
      setFetchingAdmins(false);
    }
  };
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required.";
    else if (username.length < 3) e.username = "At least 3 characters.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "At least 6 characters.";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/api/add-admin`, {
        username, password, createdBy: "boss",
      });
      showToast(res.data.message || "Admin added successfully!");
      setUsername(""); setPassword(""); setConfirmPassword(""); setErrors({});
      fetchAdmins();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add admin.", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id, name) => {
    setDeleteId(id);
    try {
      await axios.delete(`${BASE}/api/delete-admin/${id}`);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      showToast(`Admin "${name}" removed. They can no longer log in.`, "warning");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete admin.", "error");
    } finally {
      setDeleteId(null);
    }
  };
  const filtered = admins.filter((a) =>
    a.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getInitials = (name) => name.replace("admin_", "").slice(0, 2).toUpperCase();
  const avatarColors = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#db2777","#0284c7"];
  const getColor = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length];
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .aa-root{font-family:'DM Sans',sans-serif;min-height:100vh;background:#0a0a0f;color:#e8e8f0;padding:2rem 1rem}
        .aa-container{max-width:880px;margin:0 auto}
        .aa-header{margin-bottom:2.5rem}
        .aa-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);color:#a5b4fc;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:1rem}
        .aa-dot{width:6px;height:6px;background:#818cf8;border-radius:50%;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .aa-title{font-family:'Syne',sans-serif;font-size:2.2rem;font-weight:700;color:#f1f1f8;line-height:1.1;letter-spacing:-.03em}
        .aa-title span{color:#818cf8}
        .aa-subtitle{font-size:14px;color:#6b7280;margin-top:.5rem}
        .aa-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start}
        @media(max-width:680px){.aa-grid{grid-template-columns:1fr}.aa-title{font-size:1.6rem}}
        .aa-card{background:#13131a;border:1px solid #1e1e2e;border-radius:16px;padding:1.75rem}
        .aa-card-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:600;color:#c4c4d4;margin-bottom:1.5rem;display:flex;align-items:center;gap:8px}
        .aa-icon{width:28px;height:28px;background:rgba(99,102,241,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px}
        .aa-field{margin-bottom:1.1rem}
        .aa-label{display:block;font-size:12px;font-weight:500;color:#6b7280;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
        .aa-wrap{position:relative}
        .aa-input{width:100%;background:#0d0d14;border:1px solid #1e1e2e;border-radius:10px;color:#e8e8f0;font-family:'DM Sans',sans-serif;font-size:14px;padding:10px 14px;outline:none;transition:border-color .2s,box-shadow .2s}
        .aa-input:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.12)}
        .aa-input.err{border-color:#ef4444}
        .aa-pr{padding-right:44px}
        .aa-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#4b5563;font-size:15px;padding:0;display:flex;align-items:center;transition:color .2s}
        .aa-eye:hover{color:#818cf8}
        .aa-err{font-size:11px;color:#f87171;margin-top:4px}
        .aa-btn{width:100%;background:linear-gradient(135deg,#4f46e5,#6d5ce7);border:none;border-radius:10px;color:#fff;font-family:'Syne',sans-serif;font-size:14px;font-weight:600;padding:11px;cursor:pointer;margin-top:.5rem;transition:opacity .2s,transform .1s;letter-spacing:.03em;display:flex;align-items:center;justify-content:center;gap:8px}
        .aa-btn:hover:not(:disabled){opacity:.88}
        .aa-btn:active:not(:disabled){transform:scale(.98)}
        .aa-btn:disabled{opacity:.5;cursor:not-allowed}
        .aa-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .aa-stats{display:flex;gap:10px;margin-bottom:1.25rem}
        .aa-stat{flex:1;background:#0d0d14;border:1px solid #1e1e2e;border-radius:10px;padding:10px 14px;text-align:center}
        .aa-stat-num{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#818cf8}
        .aa-stat-label{font-size:11px;color:#4b5563;margin-top:2px;text-transform:uppercase;letter-spacing:.05em}
        .aa-search-wrap{position:relative;margin-bottom:1rem}
        .aa-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#374151;font-size:14px}
        .aa-search{width:100%;background:#0d0d14;border:1px solid #1e1e2e;border-radius:10px;color:#e8e8f0;font-family:'DM Sans',sans-serif;font-size:13px;padding:9px 14px 9px 36px;outline:none;transition:border-color .2s}
        .aa-search:focus{border-color:#4f46e5}
        .aa-search::placeholder{color:#374151}
        .aa-list{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto;padding-right:2px}
        .aa-list::-webkit-scrollbar{width:4px}
        .aa-list::-webkit-scrollbar-track{background:transparent}
        .aa-list::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px}
        .aa-item{display:flex;align-items:center;gap:12px;background:#0d0d14;border:1px solid #1e1e2e;border-radius:10px;padding:10px 12px;transition:border-color .2s;animation:fadeIn .3s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .aa-item:hover{border-color:#2a2a3e}
        .aa-avatar{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .aa-info{flex:1;min-width:0}
        .aa-name{font-size:13px;font-weight:500;color:#d1d1e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .aa-meta{font-size:11px;color:#374151;margin-top:2px}
        .aa-del{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:7px;padding:5px 10px;font-size:11px;font-weight:500;cursor:pointer;transition:background .2s,border-color .2s;white-space:nowrap;display:flex;align-items:center;gap:4px;flex-shrink:0}
        .aa-del:hover:not(:disabled){background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.4)}
        .aa-del:disabled{opacity:.5;cursor:not-allowed}
        .aa-empty{text-align:center;padding:2rem;color:#374151;font-size:13px}
        .aa-empty-icon{font-size:28px;margin-bottom:8px;opacity:.4}
        .aa-loading-row{display:flex;align-items:center;gap:10px;padding:1rem;color:#374151;font-size:13px;justify-content:center}
        .aa-toast{position:fixed;bottom:1.5rem;right:1.5rem;background:#13131a;border-radius:10px;padding:12px 16px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:10px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.5);animation:slideUp .3s ease;max-width:320px;border-left:3px solid}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .aa-toast.success{border-color:#10b981;color:#6ee7b7}
        .aa-toast.error{border-color:#ef4444;color:#fca5a5}
        .aa-toast.warning{border-color:#f59e0b;color:#fcd34d}
      `}</style>
      <div className="aa-root">
        <div className="aa-container">
          <div className="aa-header">
            <div className="aa-badge"><span className="aa-dot" /> Boss Panel</div>
            <h1 className="aa-title">Manage <span>Admins</span></h1>
            <p className="aa-subtitle">Add and remove admin accounts for your typing platform.</p>
          </div>
          <div className="aa-grid">
            <div className="aa-card">
              <div className="aa-card-title"><span className="aa-icon">✦</span> Add New Admin</div>
              <div className="aa-field">
                <label className="aa-label">Username</label>
                <input type="text" className={`aa-input${errors.username?" err":""}`} placeholder="e.g. admin_rahul" value={username} onChange={e=>setUsername(e.target.value)} />
                {errors.username && <p className="aa-err">{errors.username}</p>}
              </div>
              <div className="aa-field">
                <label className="aa-label">Password</label>
                <div className="aa-wrap">
                  <input type={showPassword?"text":"password"} className={`aa-input aa-pr${errors.password?" err":""}`} placeholder="Min. 6 characters" value={password} onChange={e=>setPassword(e.target.value)} />
                  <button className="aa-eye" onClick={()=>setShowPassword(v=>!v)}>{showPassword?"🙈":"👁"}</button>
                </div>
                {errors.password && <p className="aa-err">{errors.password}</p>}
              </div>
              <div className="aa-field">
                <label className="aa-label">Confirm Password</label>
                <input type="password" className={`aa-input${errors.confirmPassword?" err":""}`} placeholder="Re-enter password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                {errors.confirmPassword && <p className="aa-err">{errors.confirmPassword}</p>}
              </div>
              <button className="aa-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="aa-spin" /> Adding...</> : "+ Add Admin"}
              </button>
            </div>
            <div className="aa-card">
              <div className="aa-card-title"><span className="aa-icon">◈</span> Active Admins</div>
              <div className="aa-stats">
                <div className="aa-stat">
                  <div className="aa-stat-num">{admins.length}</div>
                  <div className="aa-stat-label">Total</div>
                </div>
                <div className="aa-stat">
                  <div className="aa-stat-num">
                    {admins.filter(a=>{
                      if(!a.created_at) return false;
                      const d=new Date(a.created_at), t=new Date();
                      return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear();
                    }).length}
                  </div>
                  <div className="aa-stat-label">Today</div>
                </div>
                <div className="aa-stat">
                  <div className="aa-stat-num">1</div>
                  <div className="aa-stat-label">Boss</div>
                </div>
              </div>
              <div className="aa-search-wrap">
                <span className="aa-search-icon">⌕</span>
                <input type="text" className="aa-search" placeholder="Search admins..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
              </div>
              <div className="aa-list">
                {fetchingAdmins ? (
                  <div className="aa-loading-row">
                    <span className="aa-spin" style={{borderTopColor:"#818cf8"}} /> Loading admins...
                  </div>
                ) : filtered.length===0 ? (
                  <div className="aa-empty">
                    <div className="aa-empty-icon">◎</div>
                    {searchQuery ? "No admins match your search." : "No admins yet. Add one!"}
                  </div>
                ) : filtered.map(admin=>(
                  <div className="aa-item" key={admin.id}>
                    <div className="aa-avatar" style={{background:getColor(admin.username)}}>
                      {getInitials(admin.username)}
                    </div>
                    <div className="aa-info">
                      <div className="aa-name">{admin.username}</div>
                      <div className="aa-meta">
                        {admin.created_at
                          ? new Date(admin.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
                          : "—"}
                      </div>
                    </div>
                    <button className="aa-del" onClick={()=>handleDelete(admin.id,admin.username)} disabled={deleteId===admin.id}>
                      {deleteId===admin.id
                        ? <span className="aa-spin" style={{borderTopColor:"#f87171"}} />
                        : "✕ Remove"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div className={`aa-toast ${toast.type}`}>
          {toast.type==="success"?"✓":toast.type==="warning"?"⚠":"✕"} {toast.message}
        </div>
      )}
    </>
  );
}
export default AddAdmin;
