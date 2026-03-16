import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  Users, BookOpen, RotateCcw, Scroll, Plus, LogOut, 
  ArrowRight, User, History, ChevronDown, ChevronUp,
  Sparkles, School, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

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

const QURAN_CATEGORIES = [
  { id: "hifz", name: "حفظ", points: 10, emoji: "📖", icon: BookOpen },
  { id: "review", name: "مراجعة", points: 5, emoji: "🔄", icon: RotateCcw },
  { id: "mutun", name: "متون", points: 3, emoji: "📜", icon: Scroll },
];

export default function TeacherPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  // Data states
  const [students, setStudents] = useState([]);
  const [recentPoints, setRecentPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customPoints, setCustomPoints] = useState(10);
  const [notes, setNotes] = useState("");
  const [addPointsDialogOpen, setAddPointsDialogOpen] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Check for stored auth on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("teacher_auth");
    const storedId = sessionStorage.getItem("teacher_id");
    const storedName = sessionStorage.getItem("teacher_name");
    if (stored === "true" && storedId) {
      setIsAuthenticated(true);
      setTeacherId(storedId);
      setTeacher({ id: storedId, name: storedName || "" });
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && teacherId) {
      fetchTeacherData();
    }
  }, [isAuthenticated, teacherId, fetchTeacherData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");
    
    try {
      const res = await axios.post(`${API}/teachers/login`, {
        username: username,
        password: password
      });
      
      if (res.data.success) {
        setIsAuthenticated(true);
        setTeacherId(res.data.teacher_id);
        setTeacher({ id: res.data.teacher_id, name: res.data.name });
        sessionStorage.setItem("teacher_auth", "true");
        sessionStorage.setItem("teacher_id", res.data.teacher_id);
        sessionStorage.setItem("teacher_name", res.data.name);
        setLoginError("");
      } else {
        setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error.response?.data?.detail || "اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("teacher_auth");
    sessionStorage.removeItem("teacher_id");
    sessionStorage.removeItem("teacher_name");
    setIsAuthenticated(false);
    setTeacherId(null);
    setTeacher(null);
    setStudents([]);
    setRecentPoints([]);
  };

  const fetchTeacherData = useCallback(async () => {
    if (!teacherId) return;
    
    try {
      setLoading(true);
      const res = await axios.get(`${API}/teacher/dashboard/${teacherId}`);
      setStudents(res.data.students || []);
      setRecentPoints(res.data.recent_points || []);
      if (res.data.teacher) {
        setTeacher(res.data.teacher);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  const handleAddPoints = async () => {
    if (!selectedStudent || !selectedCategory) return;

    const category = QURAN_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) return;

    try {
      await axios.post(`${API}/quran-points`, {
        teacher_id: teacherId,
        student_id: selectedStudent.id,
        category: category.name,
        points: category.points,
        notes: notes
      });

      toast.success(`تم إضافة ${category.points} نقاط ${category.name} للطالب ${selectedStudent.name}`);
      
      // Reset form
      setSelectedStudent(null);
      setSelectedCategory(null);
      setNotes("");
      setAddPointsDialogOpen(false);
      
      // Refresh data
      fetchTeacherData();
    } catch (error) {
      console.error("Error adding points:", error);
      toast.error(error.response?.data?.detail || "حدث خطأ في إضافة النقاط");
    }
  };

  const getCategoryIcon = (categoryName) => {
    const category = QURAN_CATEGORIES.find(c => c.name === categoryName);
    if (category) {
      const IconComponent = category.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <BookOpen className="w-4 h-4" />;
  };

  const getCategoryColor = (categoryName) => {
    switch(categoryName) {
      case "حفظ": return "bg-blue-100 text-blue-700 border-blue-300";
      case "مراجعة": return "bg-green-100 text-green-700 border-green-300";
      case "متون": return "bg-amber-100 text-amber-700 border-amber-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900 to-emerald-700">
        <Card className="w-full max-w-sm mx-4 bg-white shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <School className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-emerald-800 mb-2">بوابة معلمي القرآن</h2>
            <p className="text-gray-500 text-sm mb-6">أدخل بيانات الدخول للمتابعة</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-right">
                <Label htmlFor="username" className="text-sm text-gray-600 mb-1 block">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                  placeholder="اسم المستخدم"
                  className={`text-right h-12 ${loginError ? 'border-red-500' : ''}`}
                  autoFocus
                />
              </div>
              <div className="text-right">
                <Label htmlFor="password" className="text-sm text-gray-600 mb-1 block">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  placeholder="كلمة المرور"
                  className={`text-right h-12 ${loginError ? 'border-red-500' : ''}`}
                />
              </div>
              {loginError && (
                <p className="text-red-500 text-sm">{loginError}</p>
              )}
              <Button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-emerald-700 text-white hover:bg-emerald-800 rounded-full h-12 text-lg disabled:opacity-50"
              >
                {isLoggingIn ? 'جاري الدخول...' : 'دخول'}
              </Button>
            </form>
            <div className="mt-6 pt-4 border-t">
              <Link to="/">
                <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  العودة للصفحة الرئيسية
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900 to-emerald-700">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white py-4 px-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">بوابة معلمي القرآن</h1>
              <p className="text-emerald-100 text-sm flex items-center gap-1">
                <User className="w-3 h-3" />
                {teacher?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 rounded-full"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                الرئيسية
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-white hover:bg-red-500/20 rounded-full"
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">الطلاب المخصصين</p>
                <p className="text-xl font-bold text-gray-800">{students.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي النقاط المضافة</p>
                <p className="text-xl font-bold text-gray-800">
                  {recentPoints.reduce((sum, p) => sum + p.points, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">عمليات الحفظ</p>
                <p className="text-xl font-bold text-gray-800">
                  {recentPoints.filter(p => p.category === "حفظ").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <History className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">العمليات اليوم</p>
                <p className="text-xl font-bold text-gray-800">
                  {recentPoints.filter(p => {
                    const today = new Date().toDateString();
                    const pDate = new Date(p.created_at).toDateString();
                    return today === pDate;
                  }).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white p-1 rounded-full border border-emerald-200">
            <TabsTrigger 
              value="students" 
              className="rounded-full data-[state=active]:bg-emerald-700 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 ml-2" />
              طلابي
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-full data-[state=active]:bg-emerald-700 data-[state=active]:text-white"
            >
              <History className="w-4 h-4 ml-2" />
              سجل العمليات
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  الطلاب المخصصين لك ({students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">لا يوجد طلاب مخصصين لك حالياً</p>
                    <p className="text-sm">تواصل مع المشرف لتخصيص الطلاب</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => {
                      const isExpanded = expandedStudent === student.id;
                      const studentPoints = recentPoints.filter(p => p.student_id === student.id);
                      
                      return (
                        <div 
                          key={student.id}
                          className="border rounded-xl overflow-hidden transition-all hover:shadow-md"
                        >
                          {/* Student Header */}
                          <div 
                            className="flex items-center gap-4 p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                          >
                            {student.photo ? (
                              <img 
                                src={student.photo} 
                                alt={student.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-300"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xl">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 text-lg">{student.name}</h3>
                              <p className="text-sm text-gray-500">
                                {studentPoints.length} عملية • {studentPoints.reduce((s, p) => s + p.points, 0)} نقطة
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Dialog open={addPointsDialogOpen && selectedStudent?.id === student.id} 
                                      onOpenChange={(open) => {
                                        setAddPointsDialogOpen(open);
                                        if (open) {
                                          setSelectedStudent(student);
                                          setSelectedCategory(null);
                                          setNotes("");
                                        }
                                      }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStudent(student);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 rounded-full"
                                  >
                                    <Plus className="w-4 h-4 ml-1" />
                                    إضافة نقاط
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-white">
                                  <DialogHeader>
                                    <DialogTitle className="text-emerald-800">
                                      إضافة نقاط للطالب: {student.name}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div>
                                      <Label>اختر النوع</Label>
                                      <div className="grid grid-cols-3 gap-2 mt-2">
                                        {QURAN_CATEGORIES.map((cat) => (
                                          <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                                              selectedCategory === cat.id 
                                                ? 'border-emerald-500 bg-emerald-50' 
                                                : 'border-gray-200 hover:border-emerald-300'
                                            }`}
                                          >
                                            <div className="text-2xl mb-1">{cat.emoji}</div>
                                            <div className="font-medium text-sm">{cat.name}</div>
                                            <div className="text-xs text-gray-500">+{cat.points} نقاط</div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>ملاحظات (اختياري)</Label>
                                      <Input
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="مثال: سورة البقرة الآية 1-10"
                                        className="mt-1 text-right"
                                      />
                                    </div>
                                    <Button 
                                      onClick={handleAddPoints}
                                      disabled={!selectedCategory}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full h-12"
                                    >
                                      <Plus className="w-4 h-4 ml-2" />
                                      إضافة النقاط
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedStudent(isExpanded ? null : student.id);
                                }}
                              >
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Expanded Student History */}
                          {isExpanded && (
                            <div className="p-4 bg-white border-t">
                              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                سجل العمليات ({studentPoints.length})
                              </h4>
                              {studentPoints.length === 0 ? (
                                <p className="text-gray-400 text-center py-4">لا توجد عمليات مسجلة</p>
                              ) : (
                                <div className="space-y-2">
                                  {studentPoints.slice(0, 5).map((point, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Badge className={getCategoryColor(point.category)}>
                                          {getCategoryIcon(point.category)}
                                          <span className="mr-1">{point.category}</span>
                                        </Badge>
                                        {point.notes && (
                                          <span className="text-sm text-gray-500">{point.notes}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-100 text-emerald-700">+{point.points}</Badge>
                                        <span className="text-xs text-gray-400">
                                          {new Date(point.created_at).toLocaleDateString('ar-SA')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  سجل العمليات ({recentPoints.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPoints.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">لا توجد عمليات مسجلة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPoints.map((point, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          {point.student?.photo ? (
                            <img 
                              src={point.student.photo} 
                              alt={point.student.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                              {point.student?.name?.charAt(0) || "?"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{point.student?.name || "طالب"}</p>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getCategoryColor(point.category)}`}>
                                {getCategoryIcon(point.category)}
                                <span className="mr-1">{point.category}</span>
                              </Badge>
                              {point.notes && (
                                <span className="text-xs text-gray-500">{point.notes}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge className="bg-emerald-100 text-emerald-700 text-sm">+{point.points}</Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(point.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
