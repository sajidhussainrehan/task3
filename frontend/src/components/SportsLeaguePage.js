import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function SportsLeaguePage() {
  const [standings, setStandings] = useState([]);
  const [results, setResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState("ranking");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("ghiras_token");
  const lastStudentId = sessionStorage.getItem("last_student_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [standRes, matchRes, teamRes] = await Promise.all([
          axios.get(`${API}/league-standings`),
          axios.get(`${API}/matches`),
          axios.get(`${API}/teams`)
        ]);
        setStandings(standRes.data || []);
        setResults((matchRes.data || []).filter(m => m.status === "completed"));
        setTeams(teamRes.data || []);
      } catch (err) {
        console.error("Error fetching league data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper to get team photo from the teams list
  const getTeamPhoto = (teamName) => {
    const team = teams.find(t => t.name === teamName);
    return team?.group_photo || null;
  };

  const navItems = [
    { 
      label: "الرئيسية", 
      icon: "🏠", 
      path: token ? "/" : (lastStudentId ? `/public/${lastStudentId}` : "/login") 
    },
    { label: "الدوري", icon: "🏆", path: "/league", active: true },
    { label: "المسابقات", icon: "🕒", path: "#" },
    { label: "الاستثمار", icon: "⚡", path: "#" },
    { label: "المهام", icon: "📋", path: "#" },
  ];

  if (loading) return <div className="min-h-screen bg-[#0a0f1e] text-white flex items-center justify-center font-black">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6 pb-32 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic tracking-tighter">دوري بريء لكرة القدم</h1>
        <div className="bg-[#006d44]/20 border border-[#006d44]/50 px-4 py-1 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black text-emerald-400">مباشر الآن</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-10 h-64 shadow-2xl group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200" 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
          alt="الدوري" 
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#006d44] text-[10px] font-black px-3 py-1 rounded-full">الجولة النهائية</span>
            <span className="text-gray-300 text-[10px] font-bold italic">ملعب بريء</span>
          </div>
          <h2 className="text-3xl font-black italic leading-none mb-1">بطولة نجوم بريء 2026</h2>
          <p className="text-gray-400 text-xs font-bold tracking-widest">المنافسة على لقب بطل الملعب</p>
        </div>
      </div>

      {/* Selection Tabs */}
      <div className="flex gap-2 bg-[#1a1f2e]/50 p-1.5 rounded-2xl mb-8 border border-white/5">
        {[
          {id: "ranking", label: "الترتيب العام"},
          {id: "results", label: "آخر النتائج"},
          {id: "teams", label: "الفرق المشاركة"}
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${
                activeTab === tab.id ? "bg-[#006d44] text-white shadow-xl scale-[1.02]" : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {activeTab === "ranking" && (
          <div className="space-y-3">
            {standings.map((team, index) => (
              <div key={index} className="bg-[#151a28] rounded-[1.5rem] p-5 flex items-center justify-between border border-white/5 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black italic shrink-0 ${
                    index === 0 ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : 
                    index === 1 ? "bg-gray-300 text-black" : 
                    index === 2 ? "bg-orange-400 text-black" : "bg-[#1f2637] text-gray-400"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    {getTeamPhoto(team.team) ? (
                        <img src={getTeamPhoto(team.team)} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                    ) : (
                        <div className="w-10 h-10 bg-[#1f2637] rounded-lg flex items-center justify-center text-lg shadow-inner">🛡️</div>
                    )}
                    <div>
                        <p className="font-black text-sm">{team.team}</p>
                        <p className="text-[10px] font-bold text-gray-500 tracking-tighter">المباريات: {team.played}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-500 text-xl font-black italic leading-none">{team.points}</p>
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">نقطة</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "results" && (
          <div className="space-y-4">
            {results.map((match, index) => (
              <div key={index} className="bg-[#151a28] rounded-[2.5rem] p-8 border border-white/5 shadow-lg">
                 <div className="flex items-center justify-between gap-6">
                    {/* Team 1 */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {getTeamPhoto(match.team1) ? (
                            <img src={getTeamPhoto(match.team1)} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-xl" />
                        ) : (
                            <div className="w-16 h-16 bg-[#1f2637] rounded-2xl flex items-center justify-center text-3xl shadow-inner">🛡️</div>
                        )}
                        <p className="font-black text-xs text-center leading-tight truncate w-full">{match.team1}</p>
                        <p className="text-4xl font-black italic text-white mt-1">{match.score1}</p>
                    </div>

                    <div className="text-emerald-500/30 font-black italic text-3xl">-</div>

                    {/* Team 2 */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {getTeamPhoto(match.team2) ? (
                            <img src={getTeamPhoto(match.team2)} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-xl" />
                        ) : (
                            <div className="w-16 h-16 bg-[#1f2637] rounded-2xl flex items-center justify-center text-3xl shadow-inner">🛡️</div>
                        )}
                        <p className="font-black text-xs text-center leading-tight truncate w-full">{match.team2}</p>
                        <p className="text-4xl font-black italic text-white mt-1">{match.score2}</p>
                    </div>
                 </div>
                 <div className="text-center mt-6">
                    <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20">انتهت الجولة</span>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "teams" && (
           <div className="grid grid-cols-2 gap-4">
              {teams.map((team, index) => (
                <div key={index} className="bg-[#151a28] rounded-[1.5rem] p-4 text-center border border-white/5 group hover:border-emerald-500/50 transition-all">
                    {team.group_photo ? (
                        <img src={team.group_photo} alt={team.name} className="w-full h-28 object-cover rounded-xl mb-3 shadow-xl group-hover:scale-105 transition-transform" />
                    ) : (
                        <div className="w-full h-28 bg-[#1f2637] rounded-xl mb-3 flex items-center justify-center text-3xl">🛡️</div>
                    )}
                    <h3 className="font-black text-sm">{team.name}</h3>
                </div>
              ))}
           </div>
        )}
      </div>

      {/* Premium Bottom Nav */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-[#151a28]/80 backdrop-blur-2xl px-6 py-4 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex justify-between items-center max-w-lg mx-auto">
          {navItems.map((item, idx) => (
            <Link key={idx} to={item.path} className="flex flex-col items-center gap-1.5 group">
              <span className={`text-xl transition-transform group-active:scale-95 ${item.active ? "opacity-100 scale-110" : "opacity-30 hover:opacity-100"}`}>{item.icon}</span>
              <span className={`text-[9px] font-black tracking-tighter ${item.active ? "text-emerald-500" : "text-gray-500"}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SportsLeaguePage;
