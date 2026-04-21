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
  const [studentMap, setStudentMap] = useState({}); // {id: {image, points}}
  const [activeTab, setActiveTab] = useState("ranking");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("ghiras_token");
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
        
        // Build map for quick access
        const stdMap = {};
        (studentsRes.data || []).forEach(s => {
          stdMap[s.id] = { image: s.image_url, points: s.points || 0 };
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
    if (y < 25) return { label: "FWD", color: "bg-rose-500" };
    if (y < 55) return { label: "MID", color: "bg-blue-500" };
    if (y < 85) return { label: "DEF", color: "bg-orange-500" };
    return { label: "GK", color: "bg-yellow-500" };
  };

  const navItems = [
    { 
      label: "الرئيسية", 
      icon: "🏠", 
      path: lastStudentId ? `/public/${lastStudentId}` : "/"
    },
    { label: "الدوري", icon: "🏆", path: "/league", active: true },
    { label: "المسابقات", icon: "🕒", path: lastStudentId ? `/public/${lastStudentId}#challenges` : "#" },
    { label: "الاستثمار", icon: "⚡", path: lastStudentId ? `/public/${lastStudentId}#investment` : "#" },
    { label: "المهام", icon: "📋", path: lastStudentId ? `/public/${lastStudentId}#tasks` : "#" },
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
          <img src={getTeamPhoto(standings[0].team)} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="المتصدر" />
        ) : (
          <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="الدوري" />
        )}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#006d44] text-[10px] font-black px-3 py-1 rounded-full">المتصدر حالياً</span>
            <span className="text-gray-300 text-[10px] font-bold italic">ملعب بارع</span>
          </div>
          <h2 className="text-3xl font-black italic leading-none mb-1">
            {standings.length > 0 ? standings[0].team : "بطولة نجوم بارع 2026"}
          </h2>
          <p className="text-gray-400 text-xs font-bold tracking-widest">المنافسة على لقب بطل الملعب</p>
        </div>
      </div>

      <div className="flex gap-2 bg-[#1a1f2e]/50 p-1.5 rounded-2xl mb-8 border border-white/5 overflow-x-auto scroller-hidden">
        {[{id: "ranking", label: "الترتيب العام"}, {id: "upcoming", label: "مباريات قادمة"}, {id: "results", label: "آخر النتائج"}, {id: "teams", label: "الفرق المشاركة"}].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-xs transition-all ${activeTab === tab.id ? "bg-[#006d44] text-white shadow-xl scale-[1.02]" : "text-gray-500"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "ranking" && (
          <div className="space-y-3">
            {standings.map((team, index) => (
              <div key={index} className="bg-[#151a28] rounded-[1.5rem] p-5 flex items-center justify-between border border-white/5 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black italic shrink-0 ${index === 0 ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "bg-[#1f2637] text-gray-400"}`}>
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    {getTeamPhoto(team.team) ? <img src={getTeamPhoto(team.team)} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" /> : <div className="w-10 h-10 bg-[#1f2637] rounded-lg flex items-center justify-center text-lg shadow-inner">🛡️</div>}
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

        {activeTab === "upcoming" && (
          <div className="space-y-4">
            {upcomingMatches.length > 0 ? upcomingMatches.map((match, index) => (
              <div key={index} className="bg-[#151a28] rounded-[2.5rem] p-8 border border-white/5 shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-4 py-1 rounded-bl-2xl border-l border-b border-emerald-500/20 uppercase tracking-widest">جدولة</div>
                 <div className="flex items-center justify-between gap-6 mt-2">
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {getTeamPhoto(match.team1) ? <img src={getTeamPhoto(match.team1)} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-xl" /> : <div className="w-16 h-16 bg-[#1f2637] rounded-2xl flex items-center justify-center text-3xl shadow-inner">🛡️</div>}
                        <p className="font-black text-xs text-center leading-tight truncate w-full">{match.team1}</p>
                    </div>
                    <div className="px-4 py-2 bg-[#1f2637] rounded-xl text-emerald-500 font-black italic text-xl shadow-inner shrink-0 tracking-tighter">VS</div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {getTeamPhoto(match.team2) ? <img src={getTeamPhoto(match.team2)} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-xl" /> : <div className="w-16 h-16 bg-[#1f2637] rounded-2xl flex items-center justify-center text-3xl shadow-inner">🛡️</div>}
                        <p className="font-black text-xs text-center leading-tight truncate w-full">{match.team2}</p>
                    </div>
                 </div>
              </div>
            )) : <div className="text-center py-20 text-gray-500 font-black italic">لا يوجد مباريات مجدولة حالياً</div>}
          </div>
        )}

        {activeTab === "results" && (
           <div className="space-y-4">
            {results.map((match, index) => (
              <div key={index} className="bg-[#151a28] rounded-[2.5rem] p-8 border border-white/5 shadow-lg">
                 <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {getTeamPhoto(match.team1) ? <img src={getTeamPhoto(match.team1)} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-xl" /> : <div className="w-16 h-16 bg-[#1f2637] rounded-2xl flex items-center justify-center text-3xl shadow-inner">🛡️</div>}
                        <p className="font-black text-xs text-center leading-tight truncate w-full">{match.team1}</p>
                        <p className="text-4xl font-black italic text-white mt-1">{match.score1}</p>
                    </div>
                    <div className="text-emerald-500/30 font-black italic text-3xl">-</div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                        {getTeamPhoto(match.team2) ? <img src={getTeamPhoto(match.team2)} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-xl" /> : <div className="w-16 h-16 bg-[#1f2637] rounded-2xl flex items-center justify-center text-3xl shadow-inner">🛡️</div>}
                        <p className="font-black text-xs text-center leading-tight truncate w-full">{match.team2}</p>
                        <p className="text-4xl font-black italic text-white mt-1">{match.score2}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "teams" && (
           <div>
              <div className="grid grid-cols-2 gap-4">
                {teams.map((team, index) => (
                  <button key={index} onClick={() => setSelectedTeam(team)} className="bg-[#151a28] rounded-[1.5rem] p-4 text-center border border-white/5 group hover:border-emerald-500/50 transition-all text-right w-full">
                      {team.group_photo ? <img src={team.group_photo} alt={team.name} className="w-full h-28 object-cover rounded-xl mb-3 shadow-xl group-hover:scale-105 transition-transform" /> : <div className="w-full h-28 bg-[#1f2637] rounded-xl mb-3 flex items-center justify-center text-3xl">🛡️</div>}
                      <h3 className="font-black text-sm text-center">{team.name}</h3>
                      {team.lineup && team.lineup.length > 0 && <p className="text-[10px] text-emerald-500 font-bold text-center mt-1">👥 {team.lineup.length} لاعب — تشكيلة الفريق</p>}
                  </button>
                ))}
              </div>

              {selectedTeam && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setSelectedTeam(null)}>
                  <div className="bg-[#0a0f1e] rounded-3xl sm:rounded-[3rem] p-3 sm:p-6 w-full max-w-xl max-h-[95vh] overflow-y-auto border-2 border-white/10 shadow-[0_0_50px_rgba(0,109,68,0.3)]" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black italic text-white tracking-tighter">{selectedTeam.name}</h3>
                        <p className="text-[10px] text-emerald-500 font-bold">تشكيلة الملعب الرسمية</p>
                      </div>
                      <button onClick={() => setSelectedTeam(null)} className="bg-white/10 text-white w-10 h-10 rounded-full text-base font-bold hover:bg-white/20 transition-colors">✕</button>
                    </div>

                    {/* Football Field Visual */}
                    <div className="relative aspect-[3/4.2] sm:aspect-[4/5.5] bg-[#005a38] rounded-3xl sm:rounded-[2.5rem] overflow-hidden border-[6px] border-[#006d44] shadow-inner shadow-black/50">
                      
                      {/* Field Grass Patterns */}
                      <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.1) 0, rgba(0,0,0,0.1) 5%, transparent 5%, transparent 10%)' }}></div>
                      
                      {/* Field Markings */}
                      <div className="absolute inset-4 border-2 border-white/25 pointer-events-none rounded-2xl"></div>
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/25"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 border-2 border-white/25 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                      </div>

                      {/* Penalty Boxes */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-16 sm:h-24 border-2 border-white/25 bg-white/5"></div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-18 sm:h-28 border-2 border-white/25 bg-white/5 rounded-t-lg"></div>
                      <div className="absolute bottom-20 sm:bottom-32 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-6 sm:h-10 border-2 border-white/20 border-t-0 rounded-b-full"></div>

                      {/* Players */}
                      {selectedTeam.lineup && selectedTeam.lineup.length > 0 ? (
                        selectedTeam.lineup.map(player => {
                          const student = studentMap[player.student_id] || {};
                          const playerImg = player.image_url || student.image || null;
                          const points = student.points || 0;
                          const pos = getPlayerPosition(player.y);
                          
                          return (
                          <div key={player.student_id} className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${player.x}%`, top: `${player.y}%` }}>
                            <div className="flex flex-col items-center animate-fadeIn group">
                              {/* Position Badge */}
                              <div className={`${pos.color} text-white text-[6px] sm:text-[8px] px-2 py-0.5 rounded-full font-black mb-1 shadow-md scale-90 group-hover:scale-110 transition-transform`}>
                                {pos.label}
                              </div>

                              {/* Avatar Bubble */}
                              <div className="relative">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)] p-1 border-2 border-white transition-all group-hover:border-emerald-400 group-hover:scale-105">
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {playerImg ? (
                                      <img src={getImageUrl(playerImg)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="text-2xl sm:text-3xl opacity-50">👤</div>
                                    )}
                                  </div>
                                </div>
                                {/* Small Points Star Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 border-2 border-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                  <span className="text-[8px] font-black text-black">🌟</span>
                                </div>
                              </div>

                              {/* Name & Points Card */}
                              <div className="mt-2 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                <p className="text-white text-[10px] sm:text-[11px] font-black whitespace-nowrap leading-tight">{player.name}</p>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                    <span className="text-yellow-400 font-bold text-[9px]">{points}</span>
                                    <span className="text-white/60 text-[7px] font-black italic">PT</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/30 font-black text-lg italic uppercase tracking-widest">No Lineup Fixed</div>
                      )}
                    </div>

                    {selectedTeam.group_photo && (
                       <div className="mt-6 space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">صورة الفريق الجماعية</p>
                        <img src={selectedTeam.group_photo} alt="" className="w-full h-32 object-cover rounded-2xl border-2 border-white/5 opacity-80" />
                       </div>
                    )}
                  </div>
                </div>
              )}
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
