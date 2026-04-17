import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import QuduratStudent from "./QuduratStudent";
import ChallengesStudent from "./ChallengesStudent";
import TasksStudent from "./TasksStudent";
import PointsHistoryStudent from "./PointsHistoryStudent";
import AttendanceStudent from "./AttendanceStudent";
import HalaqaStudent from "./HalaqaStudent";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function StudentProfilePublic() {
  const { studentId: paramId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [rankInfo, setRankInfo] = useState({ rank: 0, total: 0 });
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null); // null = home view

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, matchesRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/students/${paramId}/profile`).catch(err => {
          console.error("Profile error:", err);
          return { data: { student: null, rank: 0, total_students: 0 } };
        }),
        axios.get(`${API}/matches/upcoming`).catch(err => {
          console.error("Matches error:", err);
          return { data: [] };
        }),
        axios.get(`${API}/students`).catch(err => {
          console.error("Leaderboard error:", err);
          return { data: [] };
        })
      ]);

      if (profileRes.data && profileRes.data.student) {
        setStudent(profileRes.data.student);
        setRankInfo({ rank: profileRes.data.rank, total: profileRes.data.total_students });
        sessionStorage.setItem("last_student_id", paramId);
      } else {
        setStudent(null);
      }
      
      setUpcomingMatches(matchesRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
    } catch (err) {
      console.error("Error fetching student:", err);
    } finally {
      setLoading(false);
    }
  }, [paramId]);

  useEffect(() => {
    if (paramId) {
      fetchStudent();
    }
  }, [paramId, fetchStudent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[#006d44] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-[#006d44] animate-pulse">جاري تحميل بيانات بارع...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-red-500 bg-white p-10 text-center">
        <div>
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-2xl mb-4">عذراً، لم يتم العثور على الطالب</p>
            <button onClick={() => navigate(-1)} className="bg-gray-100 px-6 py-2 rounded-xl text-gray-600">العودة للخلف</button>
        </div>
      </div>
    );
  }

  const services = [
    { name: "مقاطع الفيديو", icon: "📹", color: "bg-blue-100 text-blue-600", key: "qudurat" },
    { name: "المبادرات", icon: "🚩", color: "bg-rose-100 text-rose-600", key: "initiatives" },
    { name: "الحلقة", icon: "✅", color: "bg-purple-100 text-purple-600", key: "halaqa" },
    { name: "المسابقات", icon: "🏆", color: "bg-yellow-100 text-yellow-600", key: "challenges" },
    { name: "الحضور", icon: "📅", color: "bg-cyan-100 text-cyan-600", key: "attendance" },
    { name: "كشف الحساب", icon: "📄", color: "bg-emerald-100 text-emerald-600", key: "history" },
    { name: "الترتيب", icon: "📊", color: "bg-indigo-100 text-indigo-600", key: "ranking" },
    { name: "الكتب", icon: "📚", color: "bg-amber-100 text-amber-600", key: "books" },
    { name: "الدوري", icon: "⚽", color: "bg-emerald-100 text-emerald-600", key: "league" }
  ];

  const handleServiceClick = (key) => {
    if (key === "league") {
      navigate("/league");
    } else {
      setActiveSection(key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "qudurat":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">📹</div>
              <p className="text-2xl font-black text-gray-800">مقاطع الفيديو</p>
            </div>
            <QuduratStudent studentId={student.id} studentName={student.name} />
          </div>
        );
      case "initiatives":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🚩</div>
              <p className="text-2xl font-black text-gray-800">المبادرات</p>
            </div>
            <TasksStudent studentId={student.id} studentName={student.name} studentGroup={student.group} />
          </div>
        );
      case "halaqa":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">✅</div>
              <p className="text-2xl font-black text-gray-800">الحلقة</p>
            </div>
            <HalaqaStudent studentId={student.id} />
          </div>
        );
      case "challenges":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🏆</div>
              <p className="text-2xl font-black text-gray-800">المسابقات</p>
            </div>
            <ChallengesStudent studentId={student.id} studentName={student.name} />
          </div>
        );
      case "attendance":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">📅</div>
              <p className="text-2xl font-black text-gray-800">سجل الحضور</p>
            </div>
            <AttendanceStudent studentId={student.id} />
          </div>
        );
      case "history":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">📄</div>
              <p className="text-2xl font-black text-gray-800">كشف الحساب</p>
            </div>
            <PointsHistoryStudent studentId={student.id} />
          </div>
        );
      case "ranking":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">📊</div>
              <p className="text-2xl font-black text-gray-800">ترتيب نجوم النادي</p>
            </div>
            {leaderboard.length > 0 ? (
              <div className="bg-white rounded-[3rem] p-6 shadow-2xl shadow-gray-200 border border-gray-100">
                <div className="space-y-4">
                  {leaderboard.map((s, idx) => (
                    <div key={s.id} className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 ${s.id === student.id ? "bg-[#006d44] text-white border-transparent scale-105 shadow-2xl z-10" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${idx === 0 ? "bg-yellow-400 text-white shadow-yellow-200" : idx === 1 ? "bg-gray-300 text-white shadow-gray-200" : idx === 2 ? "bg-orange-400 text-white shadow-orange-200" : s.id === student.id ? "bg-white/20 text-white" : "bg-white text-gray-400 border border-gray-100"}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-black text-base ${s.id === student.id ? "text-white" : "text-gray-800"}`}>
                          {s.name}
                          {s.id === student.id && <span className="mr-3 text-[10px] bg-white text-[#006d44] px-3 py-1 rounded-full font-black">أنت</span>}
                        </p>
                        <p className={`text-[11px] font-bold ${s.id === student.id ? "text-white/60" : "text-gray-400"}`}>{s.group}</p>
                      </div>
                      <div className="text-left flex flex-col items-end">
                        <p className={`text-2xl font-black italic leading-none ${s.id === student.id ? "text-white" : "text-[#006d44]"}`}>{s.points}</p>
                        <p className={`text-[9px] font-black mt-1 ${s.id === student.id ? "text-white/40" : "text-gray-300"}`}>نقطة</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="text-center py-6">لا يوجد بيانات للترتيب حالياً</div>}
          </div>
        );
      case "books":
        return (
          <div className="mt-8 px-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">📚</div>
              <p className="text-2xl font-black text-gray-800">المكتبة</p>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 text-center text-gray-400 font-bold py-6">
              سيتم إضافة الكتب والمراجع قريباً
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 pb-32 overflow-x-hidden" dir="rtl">
      {/* Top Banner & Profile */}
      <div className="relative h-96 bg-gradient-to-br from-[#006d44] to-[#014029] overflow-hidden rounded-b-[4rem] shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
          {activeSection && (
            <button onClick={() => setActiveSection(null)} className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-black flex items-center gap-2 hover:bg-white/30 transition-all">
              <span>→</span>
              <span>الرجوع</span>
            </button>
          )}

          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-8 border-white/20 shadow-2xl overflow-hidden bg-white ring-8 ring-[#006d44]/50 group-hover:scale-105 transition-all duration-500">
              <img src={student.image_url ? (student.image_url.startsWith('data:') ? student.image_url : `${API_BASE}${student.image_url}`) : "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"} className="w-full h-full object-cover" alt={student.name} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white animate-bounce-slow">🏅</div>
          </div>
          
          <div className="text-center mt-6 space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">{student.name}</h2>
            <div className="bg-white/10 backdrop-blur-xl px-10 py-3 rounded-full border border-white/20 inline-flex items-center gap-3 shadow-2xl">
              <span className="text-4xl font-black text-yellow-300 italic drop-shadow-sm">{student.points || 0}</span>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black text-white tracking-widest">إجمالي النقاط</span>
                <span className="text-lg">⭐</span>
              </div>
            </div>
            <p className="text-xs font-black text-white/50 tracking-[.4em]">{student.group || "نادي بارع"}</p>
          </div>
        </div>
      </div>

      {activeSection ? (
        <div className="pb-8">{renderSectionContent()}</div>
      ) : (
        <div className="mt-16 px-6 space-y-16 animate-fadeIn">
          <div>
            <h3 className="text-xs font-black text-gray-400 mb-8 tracking-[0.4em] mr-2 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-gray-200"></span>
              خدمات نادي بارع
            </h3>
            <div className="grid grid-cols-3 gap-8">
              {services.map((s, idx) => (
                <button onClick={() => handleServiceClick(s.key)} key={idx} className="flex flex-col items-center gap-4 group text-center">
                  <div className={`w-24 h-24 ${s.color} rounded-[2rem] flex items-center justify-center text-4xl shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 border-2 border-white relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12"></div>
                    <span className="relative z-10">{s.icon}</span>
                  </div>
                  <span className="text-[11px] font-black text-gray-700 text-center leading-tight tracking-wider">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1f2e] text-white rounded-[4rem] p-12 relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#006d44]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-[11px] font-black tracking-widest mb-1">المركز الحالي</p>
                <p className="text-xl font-black italic text-[#006d44]">المركز #{rankInfo.rank} <span className="text-gray-400 font-bold not-italic text-sm">/ {rankInfo.total}</span></p>
              </div>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#006d44] to-emerald-600 flex flex-col items-center justify-center border-[10px] border-[#252a3a] shadow-2xl scale-110 font-black italic">
                <span className="text-3xl text-white leading-none">Elite</span>
                <span className="text-[8px] text-emerald-300 uppercase tracking-widest mt-1">Bariaa</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentProfilePublic;
