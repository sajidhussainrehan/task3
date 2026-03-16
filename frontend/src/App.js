import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import QuizPage from "./pages/QuizPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import ViewerPage from "./pages/ViewerPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="min-h-screen" dir="rtl">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/quiz/:competitionId" element={<QuizPage />} />
          <Route path="/student/:studentId" element={<StudentProfilePage />} />
          <Route path="/viewer" element={<ViewerPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
      {/* Logo Watermark */}
      <img 
        src="https://customer-assets.emergentagent.com/job_event-tracker-177/artifacts/uiq81qaj_Copy%20of%20Untitled%20Design.png"
        alt=""
        className="logo-watermark"
      />
      {/* Developer Footer */}
      <div className="developer-footer">
        <span>تطوير أبوغيث</span>
      </div>
    </div>
  );
}

export default App;
