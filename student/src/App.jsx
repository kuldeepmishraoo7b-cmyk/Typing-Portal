// src/App.jsx
import { HashRouter, Routes, Route } from "react-router-dom";

import PublicRoute    from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import Home         from "./components/Home";
import Login        from "./components/Login";
import Register     from "./components/Register";
import Forgot       from "./components/Forgot";
import Dashboard    from "./components/Dashboard";
import Practice     from "./components/Practice";
import Exam         from "./components/Exam";
import Results      from "./components/Result";
import Instructions from "./components/Instructions";

function App() {
  return (
    <HashRouter>
      <Routes>

        <Route path="/" element={
          <PublicRoute><Home /></PublicRoute>
        } />

        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot" element={<PublicRoute><Forgot /></PublicRoute>} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="/practice" element={
          <ProtectedRoute><Practice /></ProtectedRoute>
        } />

        <Route path="/exam" element={
          <ProtectedRoute><Exam /></ProtectedRoute>
        } />

        <Route path="/result" element={
          <ProtectedRoute><Results /></ProtectedRoute>
        } />

        <Route path="/instructions" element={
          <ProtectedRoute><Instructions /></ProtectedRoute>
        } />

        {/*
          SAFETY NET: catches any unmatched path (typos like /Login,
          /Register, /Forgot with wrong casing, or any future mistake).
          Without this, React Router renders a BLANK page for any URL
          that doesn't exactly match a route above. Now it just sends
          the user back to Home instead of a blank screen.
        */}
        <Route path="*" element={<Home />} />

      </Routes>
    </HashRouter>
  );
}

export default App;
