import { Nav } from "react-bootstrap";
import { FaHome, FaBook, FaUser, FaChartBar, FaCog, FaSignOutAlt } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("adminLogin");
    sessionStorage.removeItem("adminRole");
    sessionStorage.removeItem("adminLoginTime");
    navigate("/", { replace: true });
  };

  const navLinks = [
    { path: "/dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/Manageexam", icon: <FaBook />, label: "Manage Exams" },
    { path: "/Managestudent", icon: <FaUser />, label: "Manage Students" },
    { path: "/addadmin", icon: <FaCog />, label: "Add Admin" },
    { path: "/results", icon: <FaChartBar />, label: "Results" },
    { path: "/register", icon: <FaCog />, label: "Registered Student" },
  ];

  return (
    <div
      style={{
        width: "250px",
        minHeight: "100vh",
        background: "#1e3c72",
        color: "white",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      <h3
        className="text-center mb-4"
        style={{ fontWeight: "bold", letterSpacing: "1px", color: "#fff" }}
      >
        Admin Panel
      </h3>

      <Nav className="flex-column">
        {navLinks.map((link, index) => (
          <Nav.Link
            as={Link}
            to={link.path}
            key={index}
            style={{
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              fontWeight: location.pathname === link.path ? "bold" : "normal",
              backgroundColor: location.pathname === link.path ? "rgba(255,255,255,0.1)" : "transparent",
              borderRadius: "8px",
              padding: "8px 12px",
              transition: "all 0.2s ease-in-out",
            }}
            className="sidebar-link"
          >
            {link.icon} <span>{link.label}</span>
          </Nav.Link>
        ))}

        <Nav.Link
          as="button"
          onClick={handleLogout}
          style={{
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
            fontWeight: "normal",
            backgroundColor: "transparent",
            borderRadius: "8px",
            padding: "8px 12px",
            transition: "all 0.2s ease-in-out",
            border: "none",
            width: "100%",
            cursor: "pointer",
            textAlign: "left",
          }}
          className="sidebar-link"
        >
          <FaSignOutAlt /> <span>Logout</span>
        </Nav.Link>
      </Nav>
    </div>
  );
}

export default Sidebar;
