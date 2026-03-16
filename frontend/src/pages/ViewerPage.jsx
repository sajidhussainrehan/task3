import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Trophy, Users, Star, Medal, Crown, Shield, Rocket, 
  ChevronLeft, ChevronRight, Sparkles, Goal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// Ensure BACKEND_URL uses same protocol as current page (HTTP or HTTPS)
const getSecureBackendUrl = (url) => {
  if (!url) return '';
  if (window.location.protocol === 'https:' && url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  return url;
};
const API_BASE = getSecureBackendUrl(BACKEND_URL);
const API = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_event-tracker-177/artifacts/uiq81qaj_Copy%20of%20Untitled%20Design.png";

const TeamIcon = ({ teamId, className }) => {
  switch(teamId) {
    case 'sadara': return <Crown className={className} />;
    case 'nukhba': return <Star className={className} />;
    case 'zaama': return <Shield className={className} />;
    case 'riyada': return <Rocket className={className} />;
    default: return <Users className={className} />;
  }
};

export default function ViewerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/viewer/all-data`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const getTeamById = (teamId) => data?.teams?.find(t => t.id === teamId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">حدث خطأ في تحميل البيانات</p>
      </div>
    );
  }

  const top10 = data.students?.slice(0, 10) || [];
  const activeCompetitions = data.competitions?.filter(c => c.is_active) || [];

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="نادي بارع" className="h-12 w-12 rounded-full bg-white p-1" />
          <div>
            <h1 className="text-white text-xl font-bold">نادي بارع الشبابي</h1>
            <p className="text-white/70 text-sm">صفحة المشاهدة</p>
          </div>
        </div>
        <Badge className="bg-white/20 text-white border-0">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></span>
          مباشر
        </Badge>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-[#3d2b1f] mb-2" />
              <p className="text-2xl font-bold text-[#3d2b1f]">{data.students?.length || 0}</p>
              <p className="text-sm text-gray-500">طالب</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-[#3d2b1f]">{activeCompetitions.length}</p>
              <p className="text-sm text-gray-500">منافسة نشطة</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-4 text-center">
              <Goal className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-[#3d2b1f]">{data.matches?.filter(m => m.is_played).length || 0}</p>
              <p className="text-sm text-gray-500">مباراة</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 mx-auto text-[#3d2b1f] mb-2" />
              <p className="text-2xl font-bold text-[#3d2b1f]">
                {data.students?.reduce((sum, s) => sum + s.total_points, 0) || 0}
              </p>
              <p className="text-sm text-gray-500">مجموع النقاط</p>
            </CardContent>
          </Card>
        </div>

        {/* Star Player */}
        {data.star_player?.student && (
          <Card className="bg-gradient-to-l from-amber-100 via-yellow-50 to-amber-100 border-amber-300 border-2 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg z-10">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  {data.star_player.student.photo ? (
                    <img 
                      src={data.star_player.student.photo} 
                      alt={data.star_player.student.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-amber-400"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-2xl font-bold">
                      {data.star_player.student.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-800">⭐ نجم الدوري</h2>
                  <p className="text-xl font-bold text-[#3d2b1f]">{data.star_player.student.name}</p>
                  {data.star_player.description && (
                    <p className="text-gray-600">{data.star_player.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Football League Standings */}
        <Card className="bg-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
              <Goal className="w-6 h-6 text-green-600" />
              ⚽ ترتيب دوري كرة القدم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#3d2b1f] text-white">
                    <th className="p-3 text-right">#</th>
                    <th className="p-3 text-right">الفريق</th>
                    <th className="p-3 text-center">لعب</th>
                    <th className="p-3 text-center">فوز</th>
                    <th className="p-3 text-center">تعادل</th>
                    <th className="p-3 text-center">خسارة</th>
                    <th className="p-3 text-center">له</th>
                    <th className="p-3 text-center">عليه</th>
                    <th className="p-3 text-center">الفرق</th>
                    <th className="p-3 text-center">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {data.standings?.map((team, index) => (
                    <tr 
                      key={team.team_id}
                      className={`border-b ${index === 0 ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="p-3">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-400 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{team.team_emoji}</span>
                          <span className="font-bold" style={{ color: team.team_color }}>{team.team_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">{team.played}</td>
                      <td className="p-3 text-center text-green-600 font-bold">{team.won}</td>
                      <td className="p-3 text-center text-gray-500">{team.drawn}</td>
                      <td className="p-3 text-center text-red-600">{team.lost}</td>
                      <td className="p-3 text-center">{team.goals_for}</td>
                      <td className="p-3 text-center">{team.goals_against}</td>
                      <td className="p-3 text-center font-bold" style={{ color: team.goal_difference > 0 ? 'green' : team.goal_difference < 0 ? 'red' : 'gray' }}>
                        {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-[#3d2b1f] text-white px-3 py-1 rounded-full font-bold">
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        {data.matches?.length > 0 && (
          <Card className="bg-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
                <Trophy className="w-6 h-6 text-amber-500" />
                المباريات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.matches.map(match => {
                  const team1 = getTeamById(match.team1_id);
                  const team2 = getTeamById(match.team2_id);
                  return (
                    <div 
                      key={match.id}
                      className={`p-4 rounded-xl border-2 ${match.is_played ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <span className="text-2xl">{team1?.emoji}</span>
                          <p className="font-bold text-sm" style={{ color: team1?.color }}>{team1?.name}</p>
                        </div>
                        <div className="px-4 text-center">
                          {match.is_played ? (
                            <div className="bg-[#3d2b1f] text-white px-4 py-2 rounded-xl">
                              <span className="text-2xl font-bold">{match.team1_score} - {match.team2_score}</span>
                            </div>
                          ) : (
                            <Badge className="bg-gray-200 text-gray-600">لم تُلعب</Badge>
                          )}
                          {match.match_date && (
                            <p className="text-xs text-gray-500 mt-1">{match.match_date}</p>
                          )}
                        </div>
                        <div className="text-center flex-1">
                          <span className="text-2xl">{team2?.emoji}</span>
                          <p className="font-bold text-sm" style={{ color: team2?.color }}>{team2?.name}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 10 Students */}
        <Card className="bg-gradient-to-l from-amber-50 to-yellow-50 border-amber-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
              <Medal className="w-6 h-6 text-amber-500" />
              العشر الأوائل
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <button onClick={scrollRight} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2">
              <ChevronRight className="w-5 h-5 text-[#3d2b1f]" />
            </button>
            <button onClick={scrollLeft} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2">
              <ChevronLeft className="w-5 h-5 text-[#3d2b1f]" />
            </button>
            
            <div ref={scrollRef} className="flex gap-6 overflow-x-auto py-4 px-10" style={{ scrollbarWidth: 'none' }}>
              {top10.map((student, index) => {
                const team = getTeamById(student.team);
                return (
                  <div key={student.id} className="flex-shrink-0 w-28 text-center">
                    <div className="relative">
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-md ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-[#3d2b1f] text-white'
                      }`}>
                        {index + 1}
                      </div>
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-20 h-20 mx-auto rounded-full object-cover border-4 shadow-lg" style={{ borderColor: team?.color || '#d5f5c0' }} />
                      ) : (
                        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 shadow-lg" style={{ backgroundColor: team?.color || '#3d2b1f', borderColor: team?.color || '#d5f5c0' }}>
                          {student.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#3d2b1f] truncate">{student.name}</p>
                    {team && <Badge className="mt-1 text-xs" style={{ backgroundColor: team.bg, color: team.color }}>{team.emoji}</Badge>}
                    <p className={`mt-1 text-lg font-bold ${student.total_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>{student.total_points}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Teams Ranking */}
        <Card className="bg-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
              <Shield className="w-6 h-6 text-amber-500" />
              ترتيب الفرق (النقاط)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.teams?.sort((a, b) => {
                const aPoints = data.students?.filter(s => s.team === a.id).reduce((sum, s) => sum + s.total_points, 0) || 0;
                const bPoints = data.students?.filter(s => s.team === b.id).reduce((sum, s) => sum + s.total_points, 0) || 0;
                return bPoints - aPoints;
              }).map((team, index) => {
                const teamPoints = data.students?.filter(s => s.team === team.id).reduce((sum, s) => sum + s.total_points, 0) || 0;
                const teamCount = data.students?.filter(s => s.team === team.id).length || 0;
                return (
                  <div key={team.id} className="relative rounded-2xl p-4 text-center" style={{ backgroundColor: team.bg, border: `2px solid ${team.color}` }}>
                    {index < 3 && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }}>
                        {index + 1}
                      </div>
                    )}
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white mb-2" style={{ backgroundColor: team.color }}>
                      <TeamIcon teamId={team.id} className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold" style={{ color: team.color }}>{team.emoji} {team.name}</h3>
                    <p className="text-sm text-gray-600">{teamCount} طالب</p>
                    <p className="text-2xl font-bold mt-2" style={{ color: team.color }}>{teamPoints}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Competitions */}
        {activeCompetitions.length > 0 && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
                <Star className="w-6 h-6 text-amber-500" />
                المنافسات النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCompetitions.map(comp => (
                  <div key={comp.id} className="p-4 bg-[#d5f5c0]/30 rounded-xl border border-[#3d2b1f]/10">
                    <h3 className="font-bold text-[#3d2b1f]">{comp.title}</h3>
                    {comp.description && <p className="text-sm text-gray-600">{comp.description}</p>}
                    <Badge className="mt-2 bg-[#3d2b1f] text-white">{comp.questions?.length || 0} سؤال</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
