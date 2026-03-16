import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trophy, Users, Star, Medal, ChevronLeft, ChevronRight, Crown, Shield, Rocket, Sparkles, Eye, School, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_event-tracker-177/artifacts/uiq81qaj_Copy%20of%20Untitled%20Design.png";

// Team icons mapping
const TeamIcon = ({ teamId, className }) => {
  switch(teamId) {
    case 'sadara': return <Crown className={className} />;
    case 'nukhba': return <Star className={className} />;
    case 'zaama': return <Shield className={className} />;
    case 'riyada': return <Rocket className={className} />;
    default: return <Users className={className} />;
  }
};

export default function HomePage() {
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [starPlayer, setStarPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, teamsRes, competitionsRes, starRes] = await Promise.all([
        axios.get(`${API}/leaderboard`),
        axios.get(`${API}/teams`),
        axios.get(`${API}/competitions`),
        axios.get(`${API}/star-player`)
      ]);
      setStudents(studentsRes.data);
      setTeams(teamsRes.data);
      setCompetitions(competitionsRes.data.filter(c => c.is_active));
      setStarPlayer(starRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamById = (teamId) => teams.find(t => t.id === teamId);
  
  const getStudentsByTeam = (teamId) => students.filter(s => s.team === teamId);
  
  const getTeamTotalPoints = (teamId) => {
    return getStudentsByTeam(teamId).reduce((sum, s) => sum + s.total_points, 0);
  };

  const getRankStyle = (index) => {
    if (index === 0) return "leaderboard-rank gold";
    if (index === 1) return "leaderboard-rank silver";
    if (index === 2) return "leaderboard-rank bronze";
    return "leaderboard-rank bg-gray-100 text-gray-600";
  };

  const getRankIcon = (index) => {
    if (index < 3) return <Medal className="w-5 h-5" />;
    return index + 1;
  };

  // Sort teams by total points
  const sortedTeams = [...teams].sort((a, b) => getTeamTotalPoints(b.id) - getTeamTotalPoints(a.id));
  
  // Top 10 students
  const top10Students = students.slice(0, 10);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="نادي بارع" className="h-12 w-12 rounded-full bg-white p-1" />
          <div>
            <h1 className="text-white text-xl font-bold">نادي بارع الشبابي</h1>
            <p className="text-white/70 text-sm">نصنع جيلاً بارعاً</p>
          </div>
        </div>
        <div></div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-[#3d2b1f]/10" data-testid="stats-students">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#d5f5c0] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#3d2b1f]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">عدد الطلاب</p>
                <p className="text-2xl font-bold text-[#3d2b1f]">{students.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-[#3d2b1f]/10" data-testid="stats-competitions">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#d5f5c0] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#3d2b1f]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">المنافسات النشطة</p>
                <p className="text-2xl font-bold text-[#3d2b1f]">{competitions.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-[#3d2b1f]/10" data-testid="stats-points">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#d5f5c0] flex items-center justify-center">
                <Star className="w-6 h-6 text-[#3d2b1f]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">مجموع النقاط</p>
                <p className="text-2xl font-bold text-[#3d2b1f]">
                  {students.reduce((sum, s) => sum + s.total_points, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Star Player Section */}
        {starPlayer?.student && (
          <Card className="bg-gradient-to-l from-amber-100 via-yellow-50 to-amber-100 border-amber-300 border-2 mb-8 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 text-6xl">⭐</div>
              <div className="absolute bottom-4 right-4 text-6xl">⭐</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl">🏆</div>
            </div>
            <CardContent className="p-6 relative">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg z-10">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  {starPlayer.student.photo ? (
                    <img 
                      src={starPlayer.student.photo} 
                      alt={starPlayer.student.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-amber-400 shadow-xl"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-amber-300 shadow-xl">
                      {starPlayer.student.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-center md:text-right flex-1">
                  <h2 className="text-3xl font-bold text-amber-800 flex items-center justify-center md:justify-start gap-2">
                    ⭐ نجم الدوري ⭐
                  </h2>
                  <p className="text-2xl font-bold text-[#3d2b1f] mt-2">{starPlayer.student.name}</p>
                  {starPlayer.description && (
                    <p className="text-gray-600 mt-1">{starPlayer.description}</p>
                  )}
                  {getTeamById(starPlayer.student.team) && (
                    <Badge 
                      className="mt-2 text-sm"
                      style={{ 
                        backgroundColor: getTeamById(starPlayer.student.team).bg,
                        color: getTeamById(starPlayer.student.team).color 
                      }}
                    >
                      {getTeamById(starPlayer.student.team).emoji} {getTeamById(starPlayer.student.team).name}
                    </Badge>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-amber-700 text-sm">النقاط</p>
                  <p className={`text-4xl font-bold ${starPlayer.student.total_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {starPlayer.student.total_points}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 10 Slider */}
        {top10Students.length > 0 && (
          <Card className="bg-gradient-to-l from-amber-50 to-yellow-50 border-amber-200 mb-8 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
                <Trophy className="w-6 h-6 text-amber-500" />
                العشر الأوائل في النادي
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <button 
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                data-testid="scroll-right-btn"
              >
                <ChevronRight className="w-5 h-5 text-[#3d2b1f]" />
              </button>
              <button 
                onClick={scrollLeft}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                data-testid="scroll-left-btn"
              >
                <ChevronLeft className="w-5 h-5 text-[#3d2b1f]" />
              </button>
              
              <div 
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto py-4 px-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                data-testid="top10-slider"
              >
                {top10Students.map((student, index) => {
                  const team = getTeamById(student.team);
                  return (
                    <div 
                      key={student.id}
                      className="flex-shrink-0 w-28 text-center animate-fadeIn group cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      data-testid={`top10-student-${index}`}
                    >
                      <div className="relative">
                        {/* Rank Badge */}
                        <div 
                          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-md ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                            'bg-[#3d2b1f] text-white'
                          }`}
                        >
                          {index + 1}
                        </div>
                        
                        {/* Avatar */}
                        {student.photo ? (
                          <img 
                            src={student.photo} 
                            alt={student.name}
                            className="w-20 h-20 mx-auto rounded-full object-cover border-4 shadow-lg group-hover:scale-105 transition-transform"
                            style={{ borderColor: team?.color || '#d5f5c0' }}
                          />
                        ) : (
                          <div 
                            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 shadow-lg group-hover:scale-105 transition-transform"
                            style={{ 
                              backgroundColor: team?.color || '#3d2b1f',
                              borderColor: team?.color || '#d5f5c0'
                            }}
                          >
                            {student.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      {/* Name */}
                      <p className="mt-3 text-sm font-bold text-[#3d2b1f] truncate">{student.name}</p>
                      
                      {/* Team Badge */}
                      {team && (
                        <Badge 
                          className="mt-1 text-xs"
                          style={{ backgroundColor: team.bg, color: team.color }}
                        >
                          {team.emoji}
                        </Badge>
                      )}
                      
                      {/* Points */}
                      <p className={`mt-1 text-lg font-bold ${student.total_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {student.total_points}
                        <span className="text-xs text-gray-400 mr-1">نقطة</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams Ranking */}
        <Card className="bg-white/80 backdrop-blur-sm border-[#3d2b1f]/10 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
              <Shield className="w-6 h-6 text-amber-500" />
              ترتيب الفرق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="teams-ranking">
              {sortedTeams.map((team, index) => {
                const teamStudents = getStudentsByTeam(team.id);
                const totalPoints = getTeamTotalPoints(team.id);
                return (
                  <div 
                    key={team.id}
                    className="relative overflow-hidden rounded-2xl p-4 transition-all hover:shadow-lg animate-fadeIn"
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      backgroundColor: team.bg,
                      border: `2px solid ${team.color}`
                    }}
                    data-testid={`team-ranking-${team.id}`}
                  >
                    {/* Rank badge */}
                    {index < 3 && (
                      <div 
                        className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }}
                      >
                        {index + 1}
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white mb-3 shadow-lg"
                        style={{ backgroundColor: team.color }}
                      >
                        <TeamIcon teamId={team.id} className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold flex items-center justify-center gap-1" style={{ color: team.color }}>
                        <span className="text-xl">{team.emoji}</span>
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{teamStudents.length} طالب</p>
                      <div className="mt-3">
                        <span className={`text-3xl font-bold ${totalPoints >= 0 ? '' : 'text-red-600'}`} style={{ color: totalPoints >= 0 ? team.color : undefined }}>
                          {totalPoints}
                        </span>
                        <p className="text-xs text-gray-500">نقطة</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-[#3d2b1f]/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
                  <Medal className="w-6 h-6 text-amber-500" />
                  لوحة المتصدرين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="empty-state" data-testid="empty-leaderboard">
                    <Users className="empty-state-icon mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">لا يوجد طلاب مسجلين حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto" data-testid="leaderboard-list">
                    {students.map((student, index) => {
                      const team = getTeamById(student.team);
                      return (
                        <div 
                          key={student.id} 
                          className="leaderboard-item animate-fadeIn"
                          style={{ 
                            animationDelay: `${index * 0.05}s`,
                            borderColor: team?.color || '#e5e7eb'
                          }}
                          data-testid={`leaderboard-item-${index}`}
                        >
                          <div className={getRankStyle(index)}>
                            {getRankIcon(index)}
                          </div>
                          {student.photo ? (
                            <img 
                              src={student.photo} 
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover border-2"
                              style={{ borderColor: team?.color || '#d5f5c0' }}
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: team?.color || '#3d2b1f' }}
                            >
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-[#3d2b1f]">{student.name}</h3>
                            {team && (
                              <Badge 
                                className="mt-1 text-xs"
                                style={{ backgroundColor: team.bg, color: team.color }}
                              >
                                {team.emoji} {team.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-left">
                            <span className={`text-2xl font-bold ${student.total_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {student.total_points}
                            </span>
                            <p className="text-xs text-gray-500">نقطة</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Competitions */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm border-[#3d2b1f]/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
                  <Star className="w-6 h-6 text-amber-500" />
                  المنافسات النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competitions.length === 0 ? (
                  <div className="empty-state" data-testid="empty-competitions">
                    <Trophy className="empty-state-icon mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">لا توجد منافسات نشطة</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="competitions-list">
                    {competitions.map((competition, index) => (
                      <Link 
                        key={competition.id} 
                        to={`/quiz/${competition.id}`}
                        className="block"
                        data-testid={`competition-link-${index}`}
                      >
                        <div className="competition-card p-4 hover:border-[#3d2b1f] animate-fadeIn"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-[#3d2b1f]">{competition.title}</h3>
                              {competition.description && (
                                <p className="text-sm text-gray-500 mt-1">{competition.description}</p>
                              )}
                              <Badge className="mt-2 bg-[#d5f5c0] text-[#3d2b1f]">
                                {competition.questions?.length || 0} أسئلة
                              </Badge>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Quick Access Navigation */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-[#3d2b1f] mb-4 text-center">الوصول السريع</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link to="/viewer">
              <Button 
                variant="outline"
                className="w-full h-16 border-2 border-[#3d2b1f]/20 hover:border-[#3d2b1f] hover:bg-[#3d2b1f]/5 rounded-xl flex flex-col items-center gap-1"
              >
                <Eye className="w-5 h-5" />
                <span className="font-medium">صفحة المشاهد</span>
                <span className="text-xs text-gray-500">للمتابعة فقط</span>
              </Button>
            </Link>
            <Link to="/teacher">
              <Button 
                variant="outline"
                className="w-full h-16 border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl flex flex-col items-center gap-1"
              >
                <School className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">بوابة المعلم</span>
                <span className="text-xs text-gray-500">للمعلمين</span>
              </Button>
            </Link>
            <Link to="/admin">
              <Button 
                variant="outline"
                className="w-full h-16 border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-50 rounded-xl flex flex-col items-center gap-1"
              >
                <Lock className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">لوحة التحكم</span>
                <span className="text-xs text-gray-500">للمشرفين</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            صنع بـ ❤️ - made with. aboughaith
          </p>
        </div>
      </main>
    </div>
  );
}
