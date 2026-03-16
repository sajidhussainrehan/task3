import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import QuizPage from "./pages/QuizPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import ViewerPage from "./pages/ViewerPage";
import TeacherPage from "./pages/TeacherPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="min-h-screen" dir="rtl">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/quiz/:competitionId" element={<QuizPage />} />
          <Route path="/student/:studentId" element={<StudentProfilePage />} />
          <Route path="/viewer" element={<ViewerPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
      {/* Developer Footer */}
      <div className="developer-footer">
        <span>made with. aboughaith</span>
      </div>
    </div>
  );
}

export default App;
