import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  Trophy, Star, Medal, Crown, Shield, Rocket, Users,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Sparkles, Goal, ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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

export default function StudentProfilePage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [starPlayer, setStarPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState({});
  const [answering, setAnswering] = useState(false);
  const [lastAnswers, setLastAnswers] = useState({});
  const [standings, setStandings] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [teamReservations, setTeamReservations] = useState([]);
  const [teamDinners, setTeamDinners] = useState([]);
  const [reserving, setReserving] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      const [studentRes, teamsRes, competitionsRes, leaderboardRes, pointsRes, starRes, standingsRes] = await Promise.all([
        axios.get(`${API}/students/${studentId}`),
        axios.get(`${API}/teams`),
        axios.get(`${API}/competitions`),
        axios.get(`${API}/leaderboard`),
        axios.get(`${API}/points/${studentId}`),
        axios.get(`${API}/star-player`),
        axios.get(`${API}/league/standings`)
      ]);
      setStudent(studentRes.data);
      setTeams(teamsRes.data);
      const activeComps = competitionsRes.data.filter(c => c.is_active);
      setCompetitions(activeComps);
      setTopStudents(leaderboardRes.data.slice(0, 10));
      setPointsHistory(pointsRes.data);
      setStarPlayer(starRes.data);
      setStandings(standingsRes.data);

      // Fetch team tasks if student has a team
      if (studentRes.data?.team) {
        try {
          const tasksRes = await axios.get(`${API}/tasks/team/${studentRes.data.team}`);
          setTeamTasks(tasksRes.data.tasks || []);
          setTeamReservations(tasksRes.data.reservations || []);
          setTeamDinners(tasksRes.data.dinners || []);
        } catch (e) { /* ignore */ }
      }
      
      // Fetch submissions for each competition
      const subsObj = {};
      for (const comp of activeComps) {
        try {
          const subsRes = await axios.get(`${API}/quiz/submissions/${studentId}/${comp.id}`);
          subsObj[comp.id] = subsRes.data;
        } catch (e) {
          subsObj[comp.id] = [];
        }
      }
      setSubmissions(subsObj);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const getTeamById = (teamId) => teams.find(t => t.id === teamId);

  const handleReserveSocialItem = async (taskId, item) => {
    if (reserving) return;
    setReserving(true);
    try {
      await axios.post(`${API}/tasks/social/reserve`, {
        student_id: studentId,
        task_id: taskId,
        team_id: student.team,
        item: item
      });
      toast.success(`تم حجز ${item} بنجاح`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ في الحجز");
    } finally {
      setReserving(false);
    }
  };

  const getStudentRank = () => {
    const index = topStudents.findIndex(s => s.id === studentId);
    return index >= 0 ? index + 1 : null;
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

  const isQuestionAnswered = (competitionId, questionId) => {
    const compSubs = submissions[competitionId] || [];
    return compSubs.some(s => s.question_id === questionId);
  };

  const getQuestionSubmission = (competitionId, questionId) => {
    const compSubs = submissions[competitionId] || [];
    return compSubs.find(s => s.question_id === questionId);
  };

  const handleSelectOption = async (competition, question, optionIndex) => {
    if (answering) return;
    
    // Check if already answered
    if (isQuestionAnswered(competition.id, question.id)) {
      toast.error("لقد أجبت على هذا السؤال من قبل");
      return;
    }
    
    setAnswering(true);
    
    try {
      const res = await axios.post(`${API}/quiz/answer`, {
        student_id: studentId,
        competition_id: competition.id,
        question_id: question.id,
        selected_option_index: optionIndex
      });
      
      setLastAnswers(prev => ({
        ...prev,
        [`${competition.id}-${question.id}`]: {
          selectedIndex: optionIndex,
          isCorrect: res.data.is_correct,
          pointsEarned: res.data.points_earned
        }
      }));
      
      if (res.data.is_correct) {
        toast.success(`إجابة صحيحة! +${res.data.points_earned} نقطة`);
      } else {
        toast.error("إجابة خاطئة");
      }
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error("Error submitting answer:", error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("حدث خطأ في إرسال الإجابة");
      }
    } finally {
      setAnswering(false);
    }
  };

  const getOptionStyle = (competition, question, optionIndex) => {
    const submission = getQuestionSubmission(competition.id, question.id);
    const lastAnswer = lastAnswers[`${competition.id}-${question.id}`];
    
    if (!submission && !lastAnswer) {
      return "w-full p-3 text-right border-2 border-gray-200 rounded-xl bg-white hover:border-[#3d2b1f] hover:bg-gray-50 transition-all cursor-pointer";
    }
    
    const isSelected = submission?.selected_option_index === optionIndex || lastAnswer?.selectedIndex === optionIndex;
    const isCorrect = question.options[optionIndex]?.is_correct;
    
    if (isCorrect) {
      return "w-full p-3 text-right border-2 border-green-500 rounded-xl bg-green-50 cursor-default";
    }
    
    if (isSelected && !isCorrect) {
      return "w-full p-3 text-right border-2 border-red-500 rounded-xl bg-red-50 cursor-default";
    }
    
    return "w-full p-3 text-right border-2 border-gray-200 rounded-xl bg-gray-50 cursor-default opacity-60";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/80">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">الطالب غير موجود</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const team = getTeamById(student.team);
  const rank = getStudentRank();

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header 
        className="relative py-8 px-4"
        style={{ 
          background: team ? `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)` : 'linear-gradient(135deg, #3d2b1f 0%, #5d4033 100%)'
        }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-6">
            <img src={LOGO_URL} alt="نادي بارع" className="h-10 w-10 rounded-full bg-white p-1" />
          </div>
          
          <div className="flex flex-col items-center text-center">
            {student.photo ? (
              <img 
                src={student.photo} 
                alt={student.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold shadow-lg mb-4" style={{ color: team?.color || '#3d2b1f' }}>
                {student.name.charAt(0)}
              </div>
            )}
            <h1 className="text-2xl font-bold text-white mb-1">{student.name}</h1>
            {team && (
              <Badge className="bg-white/20 text-white border-0 text-sm">
                {team.emoji} {team.name}
              </Badge>
            )}
            
            {/* Points Display */}
            <div className="mt-4 bg-white/20 rounded-2xl px-8 py-4">
              <p className="text-white/80 text-sm">مجموع النقاط</p>
              <p className={`text-4xl font-bold ${student.total_points >= 0 ? 'text-white' : 'text-red-200'}`}>
                {student.total_points}
              </p>
              {rank && rank <= 10 && (
                <Badge className="mt-2 bg-amber-400 text-amber-900">
                  <Medal className="w-3 h-3 ml-1" />
                  المركز {rank}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 -mt-4">
        {/* Star Player Section */}
        {starPlayer?.student && (
          <Card className="bg-gradient-to-l from-amber-100 via-yellow-50 to-amber-100 border-amber-300 border-2 mb-6 overflow-hidden relative">
            <CardContent className="p-4 relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow z-10">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  {starPlayer.student.photo ? (
                    <img 
                      src={starPlayer.student.photo} 
                      alt={starPlayer.student.name}
                      className="w-16 h-16 rounded-full object-cover border-3 border-amber-400"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-xl font-bold border-2 border-amber-300">
                      {starPlayer.student.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-800 text-sm">⭐ نجم الدوري</h3>
                  <p className="font-bold text-[#3d2b1f]">{starPlayer.student.name}</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-bold ${starPlayer.student.total_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {starPlayer.student.total_points}
                  </p>
                  <p className="text-xs text-gray-500">نقطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Tasks Section */}
        {teamTasks.length > 0 && (
          <Card className="bg-white shadow-lg mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[#3d2b1f] text-lg">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                📋 مهام الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamTasks.map(task => {
                const taskNames = { adhan: "🕌 الأذان والإقامة والصلاة", speech: "🎤 كلمة بعد المغرب والعشاء", activity: "🎯 فعالية الفريق", social: "🤝 الاجتماعي" };
                const isAssignedToMe = task.assigned_student_id === studentId;
                const assignedStudent = task.assigned_student_id ? topStudents.find(s => s.id === task.assigned_student_id) : null;
                const myReservation = teamReservations.find(r => r.student_id === studentId);

                return (
                  <div 
                    key={task.id} 
                    className={`p-3 rounded-xl border-2 ${isAssignedToMe ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                    data-testid={`student-task-${task.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#3d2b1f] text-sm">{taskNames[task.task_type]}</span>
                      {isAssignedToMe && <Badge className="bg-blue-500 text-white text-xs">مهمتك</Badge>}
                      {task.assigned_student_id && !isAssignedToMe && assignedStudent && (
                        <Badge className="bg-gray-200 text-gray-600 text-xs">{assignedStudent.name}</Badge>
                      )}
                    </div>

                    {/* Social items for reservation */}
                    {task.task_type === "social" && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {["قهوة", "شاي", "حلى", "سمبوسة"].map(item => {
                          const reservation = teamReservations.find(r => r.item === item);
                          const isMine = reservation?.student_id === studentId;
                          const isTaken = !!reservation;
                          const emojis = { "قهوة": "☕", "شاي": "🍵", "حلى": "🍰", "سمبوسة": "🥟" };
                          
                          return (
                            <button
                              key={item}
                              data-testid={`reserve-${item}`}
                              disabled={isTaken || !!myReservation || reserving}
                              onClick={() => !isTaken && !myReservation && handleReserveSocialItem(task.id, item)}
                              className={`p-3 rounded-xl text-center transition-all ${
                                isMine ? 'bg-green-100 border-2 border-green-500 ring-2 ring-green-200' :
                                isTaken ? 'bg-red-50 border-2 border-red-200 opacity-60 cursor-not-allowed' :
                                myReservation ? 'bg-gray-100 border-2 border-gray-200 opacity-50 cursor-not-allowed' :
                                'bg-white border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                              }`}
                            >
                              <span className="text-2xl">{emojis[item]}</span>
                              <p className="font-bold text-sm mt-1">{item}</p>
                              {isMine && <p className="text-xs text-green-600 mt-1">اختيارك ✓</p>}
                              {isTaken && !isMine && <p className="text-xs text-red-500 mt-1">محجوز</p>}
                              {!isTaken && !myReservation && <p className="text-xs text-gray-400 mt-1">متاح</p>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Special Dinners */}
              {teamDinners.map(dinner => {
                const isMe = dinner.assigned_student_id === studentId;
                return (
                  <div key={dinner.id} className={`p-3 rounded-xl border-2 ${isMe ? 'border-amber-400 bg-amber-50' : 'border-amber-200 bg-amber-50/50'}`}>
                    <span className="font-bold text-[#3d2b1f] text-sm">🍽️ العشاء المتميز</span>
                    {isMe && <Badge className="mr-2 bg-amber-500 text-white text-xs">مهمتك</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Top 10 Slider */}
        <Card className="bg-white shadow-lg mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#3d2b1f] text-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
              العشر الأوائل
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <button 
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5 text-[#3d2b1f]" />
            </button>
            <button 
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5 text-[#3d2b1f]" />
            </button>
            
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {topStudents.map((s, index) => {
                const sTeam = getTeamById(s.team);
                const isCurrentStudent = s.id === studentId;
                return (
                  <div 
                    key={s.id}
                    className={`flex-shrink-0 w-24 text-center transition-all ${isCurrentStudent ? 'scale-110' : ''}`}
                  >
                    <div className="relative">
                      {index < 3 && (
                        <div 
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-10"
                          style={{ 
                            backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' 
                          }}
                        >
                          {index + 1}
                        </div>
                      )}
                      {s.photo ? (
                        <img 
                          src={s.photo} 
                          alt={s.name}
                          className={`w-16 h-16 mx-auto rounded-full object-cover border-3 ${isCurrentStudent ? 'ring-4 ring-amber-400' : ''}`}
                          style={{ borderColor: sTeam?.color || '#d5f5c0', borderWidth: '3px' }}
                        />
                      ) : (
                        <div 
                          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold ${isCurrentStudent ? 'ring-4 ring-amber-400' : ''}`}
                          style={{ backgroundColor: sTeam?.color || '#3d2b1f' }}
                        >
                          {s.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#3d2b1f] truncate">{s.name}</p>
                    <p className={`text-sm font-bold ${s.total_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.total_points}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Competitions with Questions */}
        {competitions.length > 0 && (
          <Card className="bg-white shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3d2b1f] text-lg">
                <Star className="w-5 h-5 text-amber-500" />
                المنافسات النشطة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {competitions.map((competition) => {
                const compSubmissions = submissions[competition.id] || [];
                const answeredCount = compSubmissions.length;
                const totalQuestions = competition.questions?.length || 0;
                const totalEarned = compSubmissions.reduce((sum, s) => sum + s.points_earned, 0);
                
                return (
                  <div key={competition.id} className="border-2 border-[#3d2b1f]/10 rounded-2xl overflow-hidden">
                    {/* Competition Header */}
                    <div className="bg-gradient-to-l from-[#d5f5c0] to-[#e8f8d8] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#3d2b1f] text-lg">{competition.title}</h3>
                          {competition.description && (
                            <p className="text-sm text-gray-600">{competition.description}</p>
                          )}
                        </div>
                        <div className="text-center">
                          <Badge className="bg-[#3d2b1f] text-white">
                            {answeredCount}/{totalQuestions} أجبت
                          </Badge>
                          {totalEarned > 0 && (
                            <p className="text-sm text-green-600 font-bold mt-1">+{totalEarned} نقطة</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Questions */}
                    <div className="p-4 space-y-4">
                      {competition.questions?.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">لا توجد أسئلة في هذه المنافسة</p>
                      ) : (
                        competition.questions?.map((question, qIndex) => {
                          const isAnswered = isQuestionAnswered(competition.id, question.id);
                          const submission = getQuestionSubmission(competition.id, question.id);
                          const lastAnswer = lastAnswers[`${competition.id}-${question.id}`];
                          
                          return (
                            <div 
                              key={question.id}
                              className={`p-4 rounded-xl ${isAnswered || lastAnswer ? 'bg-gray-50' : 'bg-white border-2 border-dashed border-[#3d2b1f]/20'}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-full bg-[#3d2b1f] text-white flex items-center justify-center text-sm font-bold">
                                    {qIndex + 1}
                                  </span>
                                  <h4 className="font-bold text-[#3d2b1f]">{question.text}</h4>
                                </div>
                                <Badge className="bg-amber-100 text-amber-700">
                                  {question.points} نقطة
                                </Badge>
                              </div>
                              
                              <div className="space-y-2 mr-10">
                                {question.options?.map((option, oIndex) => {
                                  const showResult = isAnswered || lastAnswer;
                                  const isCorrectOption = option.is_correct;
                                  const wasSelected = submission?.selected_option_index === oIndex || lastAnswer?.selectedIndex === oIndex;
                                  
                                  return (
                                    <button
                                      key={oIndex}
                                      onClick={() => !isAnswered && !lastAnswer && handleSelectOption(competition, question, oIndex)}
                                      disabled={isAnswered || lastAnswer || answering}
                                      className={getOptionStyle(competition, question, oIndex)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                          showResult && isCorrectOption ? 'bg-green-500 text-white' :
                                          showResult && wasSelected && !isCorrectOption ? 'bg-red-500 text-white' :
                                          'bg-gray-100 text-[#3d2b1f]'
                                        }`}>
                                          {showResult && isCorrectOption ? <CheckCircle className="w-4 h-4" /> :
                                           showResult && wasSelected && !isCorrectOption ? <XCircle className="w-4 h-4" /> :
                                           oIndex + 1}
                                        </span>
                                        <span className={`flex-1 ${showResult && isCorrectOption ? 'text-green-700 font-bold' : showResult && wasSelected && !isCorrectOption ? 'text-red-700' : ''}`}>
                                          {option.text}
                                        </span>
                                        {showResult && isCorrectOption && (
                                          <span className="text-green-600 text-sm font-bold">✓ صحيح</span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {/* Result message */}
                              {(submission || lastAnswer) && (
                                <div className={`mt-3 mr-10 p-2 rounded-lg text-sm ${
                                  (submission?.is_correct || lastAnswer?.isCorrect) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {(submission?.is_correct || lastAnswer?.isCorrect) 
                                    ? `أحسنت! حصلت على ${submission?.points_earned || lastAnswer?.pointsEarned} نقطة`
                                    : 'إجابة خاطئة، حاول في السؤال التالي'}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {competitions.length === 0 && (
          <Card className="bg-white shadow-lg mb-6">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">لا توجد منافسات نشطة حالياً</p>
            </CardContent>
          </Card>
        )}

        {/* League Standings */}
        <Card className="bg-white shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3d2b1f] text-lg">
              <Goal className="w-5 h-5 text-green-600" />
              ⚽ ترتيب دوري كرة القدم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="student-standings-table">
                <thead>
                  <tr className="bg-[#3d2b1f] text-white">
                    <th className="p-2 text-right">#</th>
                    <th className="p-2 text-right">الفريق</th>
                    <th className="p-2 text-center">لعب</th>
                    <th className="p-2 text-center">فوز</th>
                    <th className="p-2 text-center">تعادل</th>
                    <th className="p-2 text-center">خسارة</th>
                    <th className="p-2 text-center">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => {
                    const isMyTeam = student?.team === t.team_id;
                    return (
                      <tr key={t.team_id} className={`border-b ${isMyTeam ? 'bg-amber-50 font-bold' : ''} ${i === 0 ? 'bg-yellow-50' : ''}`}>
                        <td className="p-2">
                          <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>{i + 1}</span>
                        </td>
                        <td className="p-2">
                          <span style={{ color: t.team_color }}>{t.team_emoji} {t.team_name}</span>
                          {isMyTeam && <Badge className="mr-2 bg-amber-100 text-amber-700 text-xs">فريقي</Badge>}
                        </td>
                        <td className="p-2 text-center">{t.played}</td>
                        <td className="p-2 text-center text-green-600">{t.won}</td>
                        <td className="p-2 text-center text-gray-500">{t.drawn}</td>
                        <td className="p-2 text-center text-red-600">{t.lost}</td>
                        <td className="p-2 text-center">
                          <span className="bg-[#3d2b1f] text-white px-2 py-0.5 rounded-full text-xs font-bold">{t.points}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Points History */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3d2b1f] text-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
              سجل النقاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pointsHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد نقاط مسجلة بعد</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pointsHistory.map((point, index) => (
                  <div 
                    key={point.id || index}
                    className={`flex items-center justify-between p-3 rounded-lg ${point.is_positive ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      {point.is_positive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium text-[#3d2b1f]">{point.category}</span>
                    </div>
                    <Badge className={point.is_positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {point.points > 0 ? '+' : ''}{point.points}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
