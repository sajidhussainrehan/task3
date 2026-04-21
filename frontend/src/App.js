import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import GlobalLoader from "./components/GlobalLoader";

// Lazy load components to reduce initial bundle size
const Dashboard = lazy(() => import("./components/DashboardNew"));
const StudentProfilePublic = lazy(() => import("./components/StudentProfilePublic"));
const ChallengesManager = lazy(() => import("./components/ChallengesManager"));
const ViewerPage = lazy(() => import("./components/ViewerPage"));
const LoginPage = lazy(() => import("./components/LoginPage"));
const ViewOnlyLogin = lazy(() => import("./components/ViewOnlyLogin"));
const ViewOnlyDashboard = lazy(() => import("./components/ViewOnlyDashboard"));
const TeacherLogin = lazy(() => import("./components/TeacherLogin"));
const TeacherDashboard = lazy(() => import("./components/TeacherDashboard"));
const SportsLeaguePage = lazy(() => import("./components/SportsLeaguePage"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#006d44] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem("ghiras_token"));
  const [viewOnlyToken, setViewOnlyToken] = useState(localStorage.getItem("viewonly_token"));
  const [teacherToken, setTeacherToken] = useState(() => {
    const stored = localStorage.getItem("teacher_token");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleViewOnlyLogin = (newToken) => {
    setViewOnlyToken(newToken);
  };

  const handleTeacherLogin = (teacherData) => {
    setTeacherToken(teacherData);
  };

  const handleLogout = () => {
    localStorage.removeItem("ghiras_token");
    setToken(null);
  };

  const handleViewOnlyLogout = () => {
    localStorage.removeItem("viewonly_token");
    setViewOnlyToken(null);
  };

  const handleTeacherLogout = () => {
    localStorage.removeItem("teacher_token");
    setTeacherToken(null);
  };

  const getTeacherData = () => {
    if (!teacherToken) return null;
    return typeof teacherToken === 'object' ? teacherToken : JSON.parse(teacherToken);
  };

  return (
    <BrowserRouter>
      <GlobalLoader />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route 
            path="/" 
            element={token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} 
          />
          <Route path="/public/:studentId" element={<StudentProfilePublic />} />
          <Route path="/league" element={<SportsLeaguePage />} />
          <Route 
            path="/challenges" 
            element={token ? <ChallengesManager /> : <Navigate to="/login" />} 
          />
          <Route path="/view/:viewerToken" element={<ViewerRoute />} />
          <Route 
            path="/viewonly" 
            element={viewOnlyToken ? <ViewOnlyDashboard onLogout={handleViewOnlyLogout} /> : <Navigate to="/viewonly-login" />} 
          />
          <Route 
            path="/viewonly-login" 
            element={viewOnlyToken ? <Navigate to="/viewonly" /> : <ViewOnlyLogin onLogin={handleViewOnlyLogin} />} 
          />
          <Route 
            path="/teacher" 
            element={teacherToken ? <TeacherDashboard onLogout={handleTeacherLogout} teacherData={getTeacherData()} /> : <Navigate to="/teacher-login" />} 
          />
          <Route 
            path="/teacher-login" 
            element={teacherToken ? <Navigate to="/teacher" /> : <TeacherLogin onLogin={handleTeacherLogin} />} 
          />
          <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function ViewerRoute() {
  const viewerToken = window.location.pathname.split("/view/")[1];
  return <ViewerPage token={viewerToken} />;
}

export default App;
