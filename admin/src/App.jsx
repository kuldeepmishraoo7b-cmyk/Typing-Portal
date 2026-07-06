import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import AdminForgotPassword from "./components/AdminForgotPassword";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./components/Dashboard";
import Manageexam from "./components/Manageexam";
import Managestudent from "./components/Managestudent";
import Addadmin from "./components/Addadmin";
import Results from "./components/Results";
import Register from "./components/Register";

const authUtils = {
  isLoggedIn: () => {
    const loggedIn = sessionStorage.getItem("adminLogin");
    const loginTime = sessionStorage.getItem("adminLoginTime");
    if (!loggedIn || !loginTime) return false;
    
    const eightHours = 8 * 60 * 60 * 1000;
    if (Date.now() - parseInt(loginTime) > eightHours) {
      authUtils.logout();
      return false;
    }
    return true;
  },
  logout: () => {
    sessionStorage.removeItem("adminLogin");
    sessionStorage.removeItem("adminRole");
    sessionStorage.removeItem("adminLoginTime");
  },
  getRole: () => sessionStorage.getItem("adminRole"),
};


function PublicRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUtils.isLoggedIn()) return; 

    
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  
  if (authUtils.isLoggedIn()) return <Navigate to="/dashboard" replace />;

  return children;
}


function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    
    if (!authUtils.isLoggedIn()) {
      navigate("/", { replace: true });
      return;
    }

    
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (!authUtils.isLoggedIn()) {
        
        navigate("/", { replace: true });
      } else {
        
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, location.pathname]);

  if (!authUtils.isLoggedIn()) return <Navigate to="/" replace />;
  return children;
}


function BossOnlyRoute({ children }) {
  if (!authUtils.isLoggedIn())          return <Navigate to="/" replace />;
  if (authUtils.getRole() !== "boss")   return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />

        
        <Route path="/forgot-password" element={<PublicRoute><AdminForgotPassword /></PublicRoute>} />

        
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/manageexam"  element={<Manageexam />} />

          
          <Route path="/managestudent" element={<BossOnlyRoute><Managestudent /></BossOnlyRoute>} />
          <Route path="/addadmin"      element={<BossOnlyRoute><Addadmin /></BossOnlyRoute>} />
          <Route path="/results"       element={<BossOnlyRoute><Results /></BossOnlyRoute>} />
          <Route path="/register"      element={<BossOnlyRoute><Register /></BossOnlyRoute>} />

        </Route>

        
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
