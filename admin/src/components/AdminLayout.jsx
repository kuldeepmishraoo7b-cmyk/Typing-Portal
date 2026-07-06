import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div style={{ display: "flex" }}>
      
      {/* Sidebar always visible */}
      <Sidebar />

      {/* Page content */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>

    </div>
  );
}

export default AdminLayout;