import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

function SportsLeaguePage() {
  const [standings, setStandings] = useState([]);
  const [results, setResults] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [activeTab, setActiveTab] = useState("ranking");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const lastStudentId = localStorage.getItem("last_student_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [standRes, matchRes, upcomingRes, teamRes, studentsRes] = await Promise.all([
          axios.get(`${API}/league-standings`),
          axios.get(`${API}/matches`),
          axios.get(`${API}/matches/upcoming`),
          axios.get(`${API}/teams`),
          axios.get(`${API}/students`)
        ]);
        setStandings(standRes.data || []);
        setResults((matchRes.data || []).filter(m => m.status === "completed"));
        setUpcomingMatches(upcomingRes.data || []);
        setTeams(teamRes.data || []);

        const stdMap = {};
        (studentsRes.data || []).forEach(s => {
          const sid = s.id || s._id;
          stdMap[sid] = { image: s.image_url, points: s.points || 0, name: s.name };
        });
        setStudentMap(stdMap);
      } catch (err) {
        console.error("Error fetching league data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTeamPhoto = (teamName) => {
    const team = teams.find(t => t.name === teamName);
    return team?.group_photo || null;
  };

  const getPlayerPosition = (y) => {
    if (y < 30) return { label: "FWD", color: "bg-red-500" };
    if (y < 60) return { label: "MID", color: "bg-cyan-500" };
    if (y < 85) return { label: "DEF", color: "bg-orange-500" };
    return { label: "GK", color: "bg-blue-600" };
  };

  const navItems = [
    {
      label: "الرئيسية",
      icon: "🏠",
      path: lastStudentId ? `/public/${lastStudentId}` : "/login"
    },
    { label: "الدوري", icon: "🏆", path: "/league", active: true },
    { label: "المسابقات", icon: "🕒", path: lastStudentId ? `/public/${lastStudentId}#challenges` : "/login" },
    { label: "الاستثمار", icon: "⚡", path: lastStudentId ? `/public/${lastStudentId}#investment` : "/login" },
    { label: "المهام", icon: "📋", path: lastStudentId ? `/public/${lastStudentId}#tasks` : "/login" },
  ];

  if (loading) return <div className="min-h-screen bg-[#0a0f1e] text-white flex items-center justify-center font-black">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6 pb-32 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic tracking-tighter">دوري بارع لكرة القدم</h1>
        <div className="bg-[#006d44]/20 border border-[#006d44]/50 px-4 py-1 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black text-emerald-400">مباشر الآن</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-10 h-64 shadow-2xl group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent z-10"></div>
        {standings.length > 0 && getTeamPhoto(standings[0].team) ? (
          <img src={getTeamPhoto(standings[0].team)} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
        ) : (
          <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
        )}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-right">
          <h2 className="text-3xl font-black italic leading-none mb-1">
            {standings.length > 0 ? standings[0].team : "بطولة نجوم بارع"}
          </h2>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">المتصدر الحالي للملعب</p>
        </div>
      </div>

      <div className="flex gap-2 bg-[#1a1f2e]/50 p-1.5 rounded-2xl mb-8 border border-white/5 overflow-x-auto scroller-hidden">
        {[{ id: "ranking", label: "الترتيب" }, { id: "upcoming", label: "المباريات" }, { id: "results", label: "النتائج" }, { id: "teams", label: "الفرق" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] transition-all ${activeTab === tab.id ? "bg-[#00a86b] text-white shadow-xl scale-[1.02]" : "text-gray-500"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "ranking" && (
          <div className="grid grid-cols-1 gap-3">
            {standings.map((team, index) => (
              <div key={index} className="bg-[#151a28] rounded-2xl p-4 flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-black italic ${index === 0 ? "text-yellow-400" : "text-gray-600"}`}>{index + 1}</span>
                  {getTeamPhoto(team.team) ? <img src={getTeamPhoto(team.team)} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-[#1f2637] rounded-lg"></div>}
                  <p className="font-black text-sm">{team.team}</p>
                </div>
                <p className="text-[#00a86b] text-xl font-black italic">{team.points}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "teams" && (
          <div className="grid grid-cols-2 gap-4">
            {teams.map((team, index) => (
              <button key={index} onClick={() => setSelectedTeam(team)} className="bg-[#151a28] rounded-2xl p-3 border border-white/5 text-right w-full">
                {team.group_photo ? <img src={team.group_photo} alt="" className="w-full h-24 object-cover rounded-xl mb-2" /> : <div className="w-full h-24 bg-[#1f2637] rounded-xl mb-2"></div>}
                <h3 className="font-black text-xs text-center">{team.name}</h3>
              </button>
            ))}

            {selectedTeam && (
              <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedTeam(null)}>
                <div className="bg-[#1a1f2e] rounded-[2.5rem] p-4 sm:p-6 w-full max-w-lg border-2 border-white/10 shadow-[0_0_50px_rgba(0,168,107,0.4)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xl font-black italic text-white uppercase">{selectedTeam.name}</h3>
                    <button onClick={() => setSelectedTeam(null)} className="w-10 h-10 bg-white/10 text-white rounded-full font-black">✕</button>
                  </div>

                  {/* PHOTO ACCURATE PITCH UI */}
                  <div className="relative aspect-[3/4.5] bg-[#388e3c] rounded-3xl overflow-hidden border-4 border-white/20 shadow-inner">
                    {/* Vibrant stripes pattern */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 8%, transparent 8%, transparent 16%)' }}></div>

                    {/* Field markings in light mode */}
                    <div className="absolute inset-3 border-2 border-white/40 pointer-events-none rounded-xl"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full"></div>
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-40 h-20 border-2 border-white/40 bg-white/5"></div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-24 border-2 border-white/40 bg-white/5"></div>

                    {/* Players logic */}
                    {selectedTeam.lineup && selectedTeam.lineup.map(player => {
                      const std = studentMap[player.student_id] || {};
                      const pos = getPlayerPosition(player.y);
                      return (
                        <div key={player.student_id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${player.x}%`, top: `${player.y}%` }}>
                          <div className="flex flex-col items-center group scale-[0.85] sm:scale-100">
                            {/* Badge at TOP */}
                            <div className={`${pos.color} text-white text-[8px] font-black px-2.5 py-1 rounded-full shadow-lg border border-white/30 -mb-2 z-20`}>
                              {pos.label}
                            </div>

                            {/* Avatar */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full p-1 shadow-2xl border-2 border-[#a5d6a7]">
                              <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                                {getImageUrl(player.image_url || std.image) ? (
                                  <img src={getImageUrl(player.image_url || std.image)} className="w-full h-full object-cover" alt="" />
                                ) : <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">👤</div>}
                              </div>
                            </div>

                            {/* Name Overlay in White */}
                            <p className="text-white font-black text-[10px] sm:text-[12px] mt-1 whitespace-nowrap drop-shadow-lg uppercase tracking-tighter">
                              {player.name}
                            </p>

                            {/* Points Visibility Fix with Star */}
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 mt-0.5 border border-white/10 scale-90">
                              <span className="text-yellow-400 text-xs text-shadow-sm">⭐</span>
                              <span className="text-white font-black text-xs leading-none">{std.points || 0}+</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-[#151a28]/90 backdrop-blur-2xl px-6 py-4 rounded-[2.5rem] border border-white/10 shadow-2xl flex justify-between items-center max-w-lg mx-auto">
          {navItems.map((item, idx) => (
            <Link key={idx} to={item.path} className="flex flex-col items-center gap-1">
              <span className={`text-xl transition-all ${item.active ? "opacity-100 scale-125" : "opacity-30"}`}>{item.icon}</span>
              <span className={`text-[8px] font-black italic tracking-tighter ${item.active ? "text-[#00a86b]" : "text-gray-500"}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SportsLeaguePage;
