import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  ArrowRight, CheckCircle, XCircle, Trophy, 
  User, ChevronLeft, ChevronRight, Star, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_event-tracker-177/artifacts/uiq81qaj_Copy%20of%20Untitled%20Design.png";

export default function QuizPage() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    fetchData();
  }, [competitionId]);

  useEffect(() => {
    if (selectedStudent && competition) {
      fetchSubmissions();
    }
  }, [selectedStudent, competition]);

  const fetchData = async () => {
    try {
      const [compRes, studentsRes] = await Promise.all([
        axios.get(`${API}/competitions/${competitionId}`),
        axios.get(`${API}/students`)
      ]);
      setCompetition(compRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("حدث خطأ في تحميل المنافسة");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!selectedStudent) return;
    
    try {
      const res = await axios.get(`${API}/quiz/submissions/${selectedStudent.id}/${competitionId}`);
      setSubmissions(res.data);
      
      // Calculate total score
      const score = res.data.reduce((sum, sub) => sum + sub.points_earned, 0);
      setTotalScore(score);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleSelectOption = async (optionIndex) => {
    if (!selectedStudent || answering) return;
    
    const question = competition.questions[currentQuestionIndex];
    
    // Check if already answered
    const alreadyAnswered = submissions.some(s => s.question_id === question.id);
    if (alreadyAnswered) {
      toast.error("لقد أجبت على هذا السؤال من قبل");
      return;
    }
    
    setAnswering(true);
    
    try {
      const res = await axios.post(`${API}/quiz/answer`, {
        student_id: selectedStudent.id,
        competition_id: competitionId,
        question_id: question.id,
        selected_option_index: optionIndex
      });
      
      setLastAnswer({
        questionId: question.id,
        selectedIndex: optionIndex,
        isCorrect: res.data.is_correct,
        pointsEarned: res.data.points_earned
      });
      
      if (res.data.is_correct) {
        toast.success(res.data.message);
        setTotalScore(prev => prev + res.data.points_earned);
      } else {
        toast.error(res.data.message);
      }
      
      // Refresh submissions
      fetchSubmissions();
      
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

  const isQuestionAnswered = (questionId) => {
    return submissions.some(s => s.question_id === questionId);
  };

  const getQuestionSubmission = (questionId) => {
    return submissions.find(s => s.question_id === questionId);
  };

  const getOptionStyle = (question, optionIndex) => {
    const submission = getQuestionSubmission(question.id);
    
    if (!submission && lastAnswer?.questionId !== question.id) {
      return "option-btn";
    }
    
    const isSelected = submission?.selected_option_index === optionIndex || 
                       (lastAnswer?.questionId === question.id && lastAnswer?.selectedIndex === optionIndex);
    const isCorrect = question.options[optionIndex]?.is_correct;
    
    if (isCorrect) {
      return "option-btn correct";
    }
    
    if (isSelected && !isCorrect) {
      return "option-btn incorrect";
    }
    
    return "option-btn";
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < competition.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setLastAnswer(null);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setLastAnswer(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/80">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">المنافسة غير موجودة</p>
            <Link to="/">
              <Button className="mt-4 bg-[#3d2b1f] text-white rounded-full">
                العودة للرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!competition.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/80">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700">هذه المنافسة غير نشطة حالياً</p>
            <Link to="/">
              <Button className="mt-4 bg-[#3d2b1f] text-white rounded-full">
                العودة للرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = competition.questions?.[currentQuestionIndex];
  const answeredCount = submissions.length;
  const totalQuestions = competition.questions?.length || 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="نادي بارع" className="h-12 w-12 rounded-full bg-white p-1" />
          <div>
            <h1 className="text-white text-xl font-bold">{competition.title}</h1>
            <p className="text-white/70 text-sm">{competition.description || 'منافسة نادي بارع'}</p>
          </div>
        </div>
        <Link to="/">
          <Button 
            data-testid="back-to-home-btn"
            className="bg-[#d5f5c0] text-[#3d2b1f] hover:bg-[#c5e5b0] rounded-full px-6 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            العودة
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Student Selection */}
        {!selectedStudent ? (
          <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm" data-testid="student-selection-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3d2b1f]">
                <User className="w-6 h-6" />
                اختر اسمك للمشاركة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => {
                const student = students.find(s => s.id === value);
                setSelectedStudent(student);
              }}>
                <SelectTrigger data-testid="student-select">
                  <SelectValue placeholder="اختر اسمك من القائمة" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        {student.photo ? (
                          <img src={student.photo} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#d5f5c0] flex items-center justify-center text-xs font-bold">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        {student.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {students.length === 0 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  لا يوجد طلاب مسجلين. يرجى التواصل مع المشرف.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quiz Progress */}
            <div className="max-w-2xl mx-auto mb-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedStudent.photo ? (
                        <img src={selectedStudent.photo} alt="" className="w-10 h-10 rounded-full border-2 border-[#d5f5c0]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#d5f5c0] flex items-center justify-center font-bold">
                          {selectedStudent.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#3d2b1f]">{selectedStudent.name}</p>
                        <p className="text-sm text-gray-500">
                          أجبت على {answeredCount} من {totalQuestions} سؤال
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Star className="w-5 h-5 fill-amber-500" />
                        <span className="text-2xl font-bold">{totalScore}</span>
                      </div>
                      <p className="text-xs text-gray-500">نقاط المنافسة</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-l from-[#3d2b1f] to-[#8d5d41] transition-all duration-500"
                        style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quiz Content */}
            {totalQuestions === 0 ? (
              <Card className="max-w-2xl mx-auto bg-white/80">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">لا توجد أسئلة في هذه المنافسة حالياً</p>
                </CardContent>
              </Card>
            ) : answeredCount === totalQuestions ? (
              <Card className="max-w-2xl mx-auto bg-white/80" data-testid="quiz-complete-card">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#3d2b1f] mb-2">أحسنت! أكملت المنافسة</h2>
                  <p className="text-gray-600 mb-4">حصلت على {totalScore} نقطة من أصل {competition.questions.reduce((sum, q) => sum + q.points, 0)}</p>
                  <Link to="/">
                    <Button className="bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full px-8">
                      العودة للصفحة الرئيسية
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : currentQuestion && (
              <Card className="max-w-2xl mx-auto bg-white/80" data-testid="question-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[#d5f5c0] text-[#3d2b1f]">
                      السؤال {currentQuestionIndex + 1} من {totalQuestions}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700">
                      {currentQuestion.points} نقطة
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h2 className="text-xl font-bold text-[#3d2b1f] mb-6" data-testid="question-text">
                    {currentQuestion.text}
                  </h2>
                  
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => {
                      const isAnswered = isQuestionAnswered(currentQuestion.id);
                      const submission = getQuestionSubmission(currentQuestion.id);
                      const showResult = isAnswered || lastAnswer?.questionId === currentQuestion.id;
                      
                      return (
                        <button
                          key={index}
                          data-testid={`option-btn-${index}`}
                          onClick={() => handleSelectOption(index)}
                          disabled={isAnswered || answering}
                          className={`${getOptionStyle(currentQuestion, index)} ${(isAnswered || answering) ? 'cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#3d2b1f]">
                              {index + 1}
                            </span>
                            <span className="flex-1">{option.text}</span>
                            {showResult && option.is_correct && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {showResult && !option.is_correct && 
                              (submission?.selected_option_index === index || lastAnswer?.selectedIndex === index) && (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={goToPrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      data-testid="prev-question-btn"
                      className="rounded-full border-[#3d2b1f] text-[#3d2b1f]"
                    >
                      <ChevronRight className="w-4 h-4 ml-1" />
                      السابق
                    </Button>
                    <Button
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === totalQuestions - 1}
                      data-testid="next-question-btn"
                      className="rounded-full bg-[#3d2b1f] text-white hover:bg-[#5d4033]"
                    >
                      التالي
                      <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                  
                  {/* Question dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    {competition.questions.map((q, index) => {
                      const isAnswered = isQuestionAnswered(q.id);
                      const submission = getQuestionSubmission(q.id);
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentQuestionIndex(index);
                            setLastAnswer(null);
                          }}
                          data-testid={`question-dot-${index}`}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentQuestionIndex 
                              ? 'bg-[#3d2b1f] scale-125' 
                              : isAnswered 
                                ? submission?.is_correct 
                                  ? 'bg-green-500' 
                                  : 'bg-red-400'
                                : 'bg-gray-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
