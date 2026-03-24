import { useState } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const TEACHER_NAMES = {}; // Will be filled from backend if needed

function TeacherLogin({ onLogin }) {
  const [teacherId, setTeacherId] = useState("");
  const [existingTeachers, setExistingTeachers] = useState([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(`${API}/teachers/list`);
        setExistingTeachers(res.data);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };
    fetchTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/teacher-login`, { password });
      const teacherData = {
        token: res.data.token,
        teacherId: teacherId,
        teacherName: teacherId // Use the name as the ID
      };
      localStorage.setItem("teacher_token", JSON.stringify(teacherData));
      onLogin(teacherData);
    } catch (err) {
      setError("❌ كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-black">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-lime-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-black">بارع</h1>
          <p className="text-green-600 font-semibold mt-2">بوابة معلمي القرآن</p>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">اختر أو أضف معلم</label>
            <input
              type="text"
              list="teachers-list"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-lime-500 text-center font-bold"
              placeholder="اختر اسمك أو اكتبه هنا..."
              required
            />
            <datalist id="teachers-list">
              {existingTeachers.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-lime-500 text-center"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lime-500 hover:bg-lime-600 text-black py-3 rounded-lg font-bold transition disabled:opacity-50 border-2 border-black"
          >
            {loading ? "⏳ جاري الدخول..." : "🔓 دخول"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <p className="text-blue-800 text-sm font-bold mb-2">� تعليمات:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• يمكن لكل معلم رؤية طلابه المخصصين فقط</li>
            <li>• أدخل درجات الحفظ والمراجعة والمتون</li>
            <li>• النقاط تضاف تلقائياً للطالب</li>
          </ul>
        </div>
      </div>

      {/* Made with Aboughaith Badge */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg shadow-lg">
          <span className="text-xs">بارع - نظام إدارة حلقة القرآن</span>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;
