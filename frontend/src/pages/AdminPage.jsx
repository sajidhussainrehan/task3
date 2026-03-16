import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { 
  Users, Trophy, Plus, Trash2, ArrowRight, 
  MinusCircle, PlusCircle, CheckCircle, 
  Settings, Phone, Crown, Star, Shield, Rocket,
  Search, QrCode, X, Download, Printer, Sparkles, Edit2, Eye, Goal,
  CalendarDays, Swords, ClipboardList, UtensilsCrossed, School, BookOpen
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { ImageCropper } from "../components/ImageCropper";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// Ensure BACKEND_URL uses same protocol as current page (HTTP or HTTPS)
const getSecureBackendUrl = (url) => {
  if (!url) return '';
  // If current page is HTTPS but URL is HTTP, upgrade to HTTPS
  if (window.location.protocol === 'https:' && url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  return url;
};
const API_BASE = getSecureBackendUrl(BACKEND_URL);
const API = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

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

export default function AdminPage() {
  // Admin authentication with username/password
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [deductionCategories, setDeductionCategories] = useState([]);
  const [positiveCategories, setPositiveCategories] = useState([]);
  const [starPlayer, setStarPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [newStudent, setNewStudent] = useState({ name: "", phone: "", photo: "", team: "" });
  const [newCompetition, setNewCompetition] = useState({ title: "", description: "" });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [addCompetitionDialogOpen, setAddCompetitionDialogOpen] = useState(false);
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrStudent, setQrStudent] = useState(null);
  const [printAllQROpen, setPrintAllQROpen] = useState(false);
  const [starDialogOpen, setStarDialogOpen] = useState(false);
  const [selectedStarStudent, setSelectedStarStudent] = useState("");
  const [starDescription, setStarDescription] = useState("");
  
  // Edit student states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", photo: "", team: "" });
  const [editCropperOpen, setEditCropperOpen] = useState(false);
  const [editTempImage, setEditTempImage] = useState(null);
  
  // Image cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  
  // League states
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [newMatch, setNewMatch] = useState({ team1_id: "", team2_id: "", match_date: "" });
  const [addMatchDialogOpen, setAddMatchDialogOpen] = useState(false);
  const [editMatchId, setEditMatchId] = useState(null);
  const [editMatchScores, setEditMatchScores] = useState({ team1_score: 0, team2_score: 0 });

  // Custom points states
  const [customReason, setCustomReason] = useState("");
  const [customPoints, setCustomPoints] = useState(10);
  const [customIsPositive, setCustomIsPositive] = useState(true);

  // Team points states
  const [teamPointsDialogOpen, setTeamPointsDialogOpen] = useState(false);
  const [selectedTeamForPoints, setSelectedTeamForPoints] = useState(null);
  const [teamCustomReason, setTeamCustomReason] = useState("");
  const [teamCustomPoints, setTeamCustomPoints] = useState(10);
  const [teamCustomIsPositive, setTeamCustomIsPositive] = useState(true);

  // Weekly Tasks states
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [socialReservations, setSocialReservations] = useState([]);
  const [specialDinners, setSpecialDinners] = useState([]);
  const [taskWeek, setTaskWeek] = useState("");
  const [dinnerTeamId, setDinnerTeamId] = useState("");
  const [dinnerStudentId, setDinnerStudentId] = useState("");
  const [dinnerDialogOpen, setDinnerDialogOpen] = useState(false);

  // Teachers states
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({ name: "", username: "", password: "" });
  const [addTeacherDialogOpen, setAddTeacherDialogOpen] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState({});
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState(null);
  const [assignStudentDialogOpen, setAssignStudentDialogOpen] = useState(false);

  // Question form
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    points: 10,
    options: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false }
    ]
  });

  const printRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");
    
    try {
      const res = await axios.post(`${API}/admin/login`, {
        username: username,
        password: password
      });
      
      if (res.data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
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

  const fetchData = async () => {
    try {
      const [studentsRes, teamsRes, competitionsRes, deductionsRes, positiveRes, starRes, matchesRes, standingsRes, tasksRes, teachersRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/teams`),
        axios.get(`${API}/competitions`),
        axios.get(`${API}/categories/deductions`),
        axios.get(`${API}/categories/positive`),
        axios.get(`${API}/star-player`),
        axios.get(`${API}/league/matches`),
        axios.get(`${API}/league/standings`),
        axios.get(`${API}/tasks/active`),
        axios.get(`${API}/teachers`)
      ]);
      setStudents(studentsRes.data);
      setTeams(teamsRes.data);
      setCompetitions(competitionsRes.data);
      setDeductionCategories(deductionsRes.data);
      setPositiveCategories(positiveRes.data);
      setStarPlayer(starRes.data);
      setMatches(matchesRes.data);
      setStandings(standingsRes.data);
      setWeeklyTasks(tasksRes.data.tasks || []);
      setSocialReservations(tasksRes.data.reservations || []);
      setSpecialDinners(tasksRes.data.dinners || []);
      setTaskWeek(tasksRes.data.week || "");
      setTeachers(teachersRes.data || []);
      
      // Load teacher assignments
      const assignments = {};
      for (const teacher of teachersRes.data || []) {
        try {
          const res = await axios.get(`${API}/teacher-assignments/${teacher.id}`);
          assignments[teacher.id] = res.data || [];
        } catch (e) {
          assignments[teacher.id] = [];
        }
      }
      setTeacherAssignments(assignments);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Filter students by search query
  const filteredStudentsByTeam = useMemo(() => {
    const result = {};
    teams.forEach(team => {
      const teamStudents = students.filter(s => s.team === team.id);
      if (searchQuery.trim()) {
        result[team.id] = teamStudents.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.phone?.includes(searchQuery)
        );
      } else {
        result[team.id] = teamStudents;
      }
    });
    return result;
  }, [students, teams, searchQuery]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage) => {
    setNewStudent(prev => ({ ...prev, photo: croppedImage }));
    setTempImage(null);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error("يرجى إدخال اسم الطالب");
      return;
    }
    if (!newStudent.team) {
      toast.error("يرجى اختيار الفريق");
      return;
    }
    
    try {
      await axios.post(`${API}/students`, newStudent);
      toast.success("تم إضافة الطالب بنجاح");
      setNewStudent({ name: "", phone: "", photo: "", team: "" });
      setAddStudentDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("حدث خطأ في إضافة الطالب");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    
    try {
      await axios.delete(`${API}/students/${studentId}`);
      toast.success("تم حذف الطالب بنجاح");
      fetchData();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("حدث خطأ في حذف الطالب");
    }
  };

  // Edit student functions
  const openEditDialog = (student) => {
    setEditStudent(student);
    setEditForm({
      name: student.name,
      phone: student.phone || "",
      photo: student.photo || "",
      team: student.team || ""
    });
    setEditDialogOpen(true);
  };

  const handleEditImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditTempImage(reader.result);
        setEditCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditCropComplete = (croppedImage) => {
    setEditForm(prev => ({ ...prev, photo: croppedImage }));
    setEditTempImage(null);
  };

  const handleUpdateStudent = async () => {
    if (!editStudent) return;
    if (!editForm.name.trim()) {
      toast.error("يرجى إدخال اسم الطالب");
      return;
    }
    
    try {
      await axios.put(`${API}/students/${editStudent.id}`, editForm);
      toast.success("تم تحديث بيانات الطالب بنجاح");
      setEditDialogOpen(false);
      setEditStudent(null);
      fetchData();
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("حدث خطأ في تحديث بيانات الطالب");
    }
  };

  const handleAddPoints = async (category, points, isPositive) => {
    if (!selectedStudent) return;
    
    try {
      await axios.post(`${API}/points`, {
        student_id: selectedStudent.id,
        category: category,
        points: points,
        is_positive: isPositive
      });
      toast.success(isPositive ? `تم إضافة ${points} نقطة` : `تم خصم ${Math.abs(points)} نقطة`);
      fetchData();
    } catch (error) {
      console.error("Error adding points:", error);
      toast.error("حدث خطأ في تعديل النقاط");
    }
  };

  const handleCustomPoints = async (isPositive) => {
    if (!selectedStudent) return;
    if (!customReason.trim()) {
      toast.error("يرجى إدخال سبب النقاط");
      return;
    }
    if (customPoints <= 0) {
      toast.error("يرجى إدخال عدد نقاط صحيح");
      return;
    }
    try {
      await axios.post(`${API}/points`, {
        student_id: selectedStudent.id,
        category: customReason,
        points: customPoints,
        is_positive: isPositive
      });
      toast.success(isPositive ? `تم إضافة ${customPoints} نقطة` : `تم خصم ${customPoints} نقطة`);
      setCustomReason("");
      setCustomPoints(10);
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في تعديل النقاط");
    }
  };

  const handleTeamPoints = async (category, points, isPositive) => {
    if (!selectedTeamForPoints) return;
    const teamStudents = students.filter(s => s.team === selectedTeamForPoints.id);
    if (teamStudents.length === 0) {
      toast.error("لا يوجد طلاب في هذا الفريق");
      return;
    }
    try {
      await Promise.all(teamStudents.map(student =>
        axios.post(`${API}/points`, {
          student_id: student.id,
          category: category,
          points: points,
          is_positive: isPositive
        })
      ));
      toast.success(`تم ${isPositive ? 'إضافة' : 'خصم'} ${points} نقطة لـ ${teamStudents.length} طالب في ${selectedTeamForPoints.name}`);
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في تعديل النقاط");
    }
  };

  const handleTeamCustomPoints = async (isPositive) => {
    if (!teamCustomReason.trim()) {
      toast.error("يرجى إدخال سبب النقاط");
      return;
    }
    if (teamCustomPoints <= 0) {
      toast.error("يرجى إدخال عدد نقاط صحيح");
      return;
    }
    await handleTeamPoints(teamCustomReason, teamCustomPoints, isPositive);
    setTeamCustomReason("");
    setTeamCustomPoints(10);
  };

  const handleAddCompetition = async () => {
    if (!newCompetition.title.trim()) {
      toast.error("يرجى إدخال عنوان المنافسة");
      return;
    }
    
    try {
      await axios.post(`${API}/competitions`, newCompetition);
      toast.success("تم إضافة المنافسة بنجاح");
      setNewCompetition({ title: "", description: "" });
      setAddCompetitionDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding competition:", error);
      toast.error("حدث خطأ في إضافة المنافسة");
    }
  };

  const handleDeleteCompetition = async (competitionId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المنافسة؟")) return;
    
    try {
      await axios.delete(`${API}/competitions/${competitionId}`);
      toast.success("تم حذف المنافسة بنجاح");
      fetchData();
    } catch (error) {
      console.error("Error deleting competition:", error);
      toast.error("حدث خطأ في حذف المنافسة");
    }
  };

  const handleToggleCompetition = async (competitionId) => {
    try {
      const res = await axios.put(`${API}/competitions/${competitionId}/toggle`);
      toast.success(res.data.is_active ? "تم تفعيل المنافسة" : "تم إيقاف المنافسة");
      fetchData();
    } catch (error) {
      console.error("Error toggling competition:", error);
      toast.error("حدث خطأ في تعديل حالة المنافسة");
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedCompetition) return;
    if (!newQuestion.text.trim()) {
      toast.error("يرجى إدخال نص السؤال");
      return;
    }
    
    const hasCorrectAnswer = newQuestion.options.some(opt => opt.is_correct);
    if (!hasCorrectAnswer) {
      toast.error("يرجى تحديد الإجابة الصحيحة");
      return;
    }
    
    const validOptions = newQuestion.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error("يرجى إدخال خيارين على الأقل");
      return;
    }
    
    try {
      await axios.post(`${API}/competitions/${selectedCompetition.id}/questions`, {
        competition_id: selectedCompetition.id,
        text: newQuestion.text,
        points: newQuestion.points,
        options: validOptions
      });
      toast.success("تم إضافة السؤال بنجاح");
      setNewQuestion({
        text: "",
        points: 10,
        options: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false }
        ]
      });
      setAddQuestionDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("حدث خطأ في إضافة السؤال");
    }
  };

  const handleDeleteQuestion = async (competitionId, questionId) => {
    try {
      await axios.delete(`${API}/competitions/${competitionId}/questions/${questionId}`);
      toast.success("تم حذف السؤال بنجاح");
      fetchData();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("حدث خطأ في حذف السؤال");
    }
  };

  const updateQuestionOption = (index, field, value) => {
    setNewQuestion(prev => {
      const newOptions = [...prev.options];
      if (field === 'is_correct') {
        newOptions.forEach((opt, i) => {
          opt.is_correct = i === index;
        });
      } else {
        newOptions[index] = { ...newOptions[index], [field]: value };
      }
      return { ...prev, options: newOptions };
    });
  };

  const handleSetStarPlayer = async () => {
    if (!selectedStarStudent) {
      toast.error("يرجى اختيار الطالب");
      return;
    }
    
    try {
      await axios.post(`${API}/star-player`, {
        student_id: selectedStarStudent,
        title: "نجم الدوري",
        description: starDescription
      });
      toast.success("تم تعيين نجم الدوري بنجاح");
      setStarDialogOpen(false);
      setSelectedStarStudent("");
      setStarDescription("");
      fetchData();
    } catch (error) {
      console.error("Error setting star player:", error);
      toast.error("حدث خطأ في تعيين نجم الدوري");
    }
  };

  const handleRemoveStarPlayer = async () => {
    try {
      await axios.delete(`${API}/star-player`);
      toast.success("تم إزالة نجم الدوري");
      fetchData();
    } catch (error) {
      console.error("Error removing star player:", error);
      toast.error("حدث خطأ في إزالة نجم الدوري");
    }
  };

  // League handlers
  const handleDistributeTasks = async () => {
    try {
      const res = await axios.post(`${API}/tasks/distribute`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في توزيع المهام");
    }
  };

  const handleClearTasks = async () => {
    if (!window.confirm("هل أنت متأكد من إزالة جميع المهام؟")) return;
    try {
      await axios.delete(`${API}/tasks/clear`);
      toast.success("تم إزالة جميع المهام");
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في إزالة المهام");
    }
  };

  const handleAssignTask = async (taskId, studentId) => {
    try {
      await axios.put(`${API}/tasks/${taskId}/assign`, { student_id: studentId });
      toast.success("تم تعيين الطالب للمهمة");
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في تعيين المهمة");
    }
  };

  const handleAddSpecialDinner = async () => {
    if (!dinnerTeamId) { toast.error("اختر الفريق"); return; }
    try {
      await axios.post(`${API}/tasks/special-dinner`, {
        team_id: dinnerTeamId,
        student_id: dinnerStudentId || null
      });
      toast.success("تم إضافة مهمة العشاء المتميز");
      setDinnerDialogOpen(false);
      setDinnerTeamId("");
      setDinnerStudentId("");
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  const handleDeleteDinner = async (dinnerId) => {
    try {
      await axios.delete(`${API}/tasks/special-dinner/${dinnerId}`);
      toast.success("تم حذف مهمة العشاء المتميز");
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  const getTaskTypeName = (typeId) => {
    const types = { adhan: "🕌 الأذان والإقامة والصلاة", speech: "🎤 كلمة بعد المغرب والعشاء", activity: "🎯 فعالية الفريق", social: "🤝 الاجتماعي" };
    return types[typeId] || typeId;
  };

  const handleAddMatch = async () => {
    if (!newMatch.team1_id || !newMatch.team2_id) {
      toast.error("يرجى اختيار الفريقين");
      return;
    }
    if (newMatch.team1_id === newMatch.team2_id) {
      toast.error("لا يمكن اختيار نفس الفريق");
      return;
    }
    try {
      await axios.post(`${API}/league/matches`, newMatch);
      toast.success("تم إضافة المباراة بنجاح");
      setNewMatch({ team1_id: "", team2_id: "", match_date: "" });
      setAddMatchDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في إضافة المباراة");
    }
  };

  const handleUpdateMatchScore = async (matchId) => {
    try {
      await axios.put(`${API}/league/matches/${matchId}`, {
        team1_score: editMatchScores.team1_score,
        team2_score: editMatchScores.team2_score,
        is_played: true
      });
      toast.success("تم تحديث نتيجة المباراة");
      setEditMatchId(null);
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في تحديث النتيجة");
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المباراة؟")) return;
    try {
      await axios.delete(`${API}/league/matches/${matchId}`);
      toast.success("تم حذف المباراة");
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ في حذف المباراة");
    }
  };

  const getTeamById = (teamId) => teams.find(t => t.id === teamId);

  // Teacher management handlers
  const handleAddTeacher = async () => {
    if (!newTeacher.name.trim() || !newTeacher.username.trim() || !newTeacher.password.trim()) {
      toast.error("يرجى إدخال جميع بيانات المعلم");
      return;
    }
    
    try {
      await axios.post(`${API}/teachers`, newTeacher);
      toast.success("تم إضافة المعلم بنجاح");
      setNewTeacher({ name: "", username: "", password: "" });
      setAddTeacherDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding teacher:", error);
      toast.error(error.response?.data?.detail || "حدث خطأ في إضافة المعلم");
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المعلم؟")) return;
    
    try {
      await axios.delete(`${API}/teachers/${teacherId}`);
      toast.success("تم حذف المعلم بنجاح");
      fetchData();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("حدث خطأ في حذف المعلم");
    }
  };

  const handleAssignStudent = async (teacherId, studentId) => {
    try {
      await axios.post(`${API}/teacher-assignments`, {
        teacher_id: teacherId,
        student_id: studentId
      });
      toast.success("تم تخصيص الطالب للمعلم بنجاح");
      fetchData();
    } catch (error) {
      console.error("Error assigning student:", error);
      toast.error(error.response?.data?.detail || "حدث خطأ في تخصيص الطالب");
    }
  };

  const handleRemoveStudent = async (teacherId, studentId) => {
    try {
      await axios.delete(`${API}/teacher-assignments`, {
        data: { teacher_id: teacherId, student_id: studentId }
      });
      toast.success("تم إزالة تخصيص الطالب");
      fetchData();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("حدث خطأ في إزالة التخصيص");
    }
  };

  const downloadQR = (studentId, studentName) => {
    const svg = document.getElementById(`qr-${studentId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement("a");
      link.download = `qr-${studentName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getStudentProfileUrl = (studentId) => {
    return `${window.location.origin}/student/${studentId}`;
  };

  const printAllQRCodes = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>باركودات الطلاب - نادي بارع</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .card { border: 2px solid #3d2b1f; border-radius: 12px; padding: 15px; text-align: center; page-break-inside: avoid; }
            .name { font-weight: bold; font-size: 14px; margin-top: 10px; color: #3d2b1f; }
            .team { font-size: 12px; color: #666; margin-top: 5px; }
            @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; color: #3d2b1f; margin-bottom: 30px;">باركودات طلاب نادي بارع الشبابي</h1>
          <div class="grid">
    `);
    
    students.forEach(student => {
      const team = getTeamById(student.team);
      const svg = document.getElementById(`print-qr-${student.id}`);
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const base64 = btoa(unescape(encodeURIComponent(svgData)));
        printWindow.document.write(`
          <div class="card" style="border-color: ${team?.color || '#3d2b1f'}">
            <img src="data:image/svg+xml;base64,${base64}" width="150" height="150" />
            <div class="name">${student.name}</div>
            <div class="team">${team?.emoji || ''} ${team?.name || ''}</div>
          </div>
        `);
      }
    });
    
    printWindow.document.write(`
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#3d2b1f] to-[#5d4033]">
        <Card className="w-full max-w-sm mx-4 bg-white shadow-2xl">
          <CardContent className="p-8 text-center">
            <img src={LOGO_URL} alt="نادي بارع" className="h-20 w-20 rounded-full mx-auto mb-4 border-4 border-[#3d2b1f]" />
            <h2 className="text-xl font-bold text-[#3d2b1f] mb-2">لوحة تحكم المشرف</h2>
            <p className="text-gray-500 text-sm mb-6">أدخل بيانات الدخول للمتابعة</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-right">
                <Label htmlFor="username" className="text-sm text-gray-600 mb-1 block">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  data-testid="admin-username-input"
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
                  data-testid="admin-password-input"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  placeholder="كلمة المرور"
                  className={`text-right h-12 ${loginError ? 'border-red-500' : ''}`}
                />
              </div>
              {loginError && (
                <p className="text-red-500 text-sm" data-testid="login-error">{loginError}</p>
              )}
              <Button 
                type="submit"
                data-testid="admin-login-submit"
                disabled={isLoggingIn}
                className="w-full bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full h-12 text-lg disabled:opacity-50"
              >
                {isLoggingIn ? 'جاري الدخول...' : 'دخول'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-white text-xl font-bold">لوحة تحكم المشرف</h1>
            <p className="text-white/70 text-sm">إدارة الطلاب والمنافسات</p>
          </div>
        </div>
        <Link to="/">
          <Button 
            data-testid="home-link-btn"
            className="bg-[#d5f5c0] text-[#3d2b1f] hover:bg-[#c5e5b0] rounded-full px-6 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            الصفحة الرئيسية
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Star Player Section */}
        <Card className="bg-gradient-to-l from-amber-50 to-yellow-50 border-amber-300 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                {starPlayer?.student ? (
                  <div className="flex items-center gap-3">
                    {starPlayer.student.photo ? (
                      <img 
                        src={starPlayer.student.photo} 
                        alt={starPlayer.student.name}
                        className="w-12 h-12 rounded-full object-cover border-3 border-amber-400"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-xl">
                        {starPlayer.student.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-amber-800 text-lg">⭐ نجم الدوري</h3>
                      <p className="font-bold text-[#3d2b1f]">{starPlayer.student.name}</p>
                      {starPlayer.description && (
                        <p className="text-sm text-gray-600">{starPlayer.description}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-amber-800">⭐ نجم الدوري</h3>
                    <p className="text-sm text-gray-600">لم يتم تعيين نجم الدوري بعد</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Dialog open={starDialogOpen} onOpenChange={setStarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-500 text-white hover:bg-amber-600 rounded-full">
                      <Sparkles className="w-4 h-4 ml-2" />
                      {starPlayer ? 'تغيير النجم' : 'تعيين النجم'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle>تعيين نجم الدوري</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>اختر الطالب</Label>
                        <Select value={selectedStarStudent} onValueChange={setSelectedStarStudent}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الطالب" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map(s => {
                              const team = getTeamById(s.team);
                              return (
                                <SelectItem key={s.id} value={s.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{team?.emoji}</span>
                                    <span>{s.name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>وصف (اختياري)</Label>
                        <Input
                          value={starDescription}
                          onChange={(e) => setStarDescription(e.target.value)}
                          placeholder="مثال: أفضل أداء في المباراة"
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handleSetStarPlayer}
                        className="w-full bg-amber-500 text-white hover:bg-amber-600 rounded-full"
                      >
                        تعيين نجم الدوري
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {starPlayer && (
                  <Button 
                    variant="outline"
                    onClick={handleRemoveStarPlayer}
                    className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/80 p-1 rounded-full border border-[#3d2b1f]/10">
            <TabsTrigger 
              value="students" 
              data-testid="tab-students"
              className="rounded-full data-[state=active]:bg-[#3d2b1f] data-[state=active]:text-white text-xs"
            >
              <Users className="w-4 h-4 ml-1" />
              الطلاب
            </TabsTrigger>
            <TabsTrigger 
              value="teachers" 
              data-testid="tab-teachers"
              className="rounded-full data-[state=active]:bg-[#3d2b1f] data-[state=active]:text-white text-xs"
            >
              <School className="w-4 h-4 ml-1" />
              المعلمين
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              data-testid="tab-tasks"
              className="rounded-full data-[state=active]:bg-[#3d2b1f] data-[state=active]:text-white text-xs"
            >
              <ClipboardList className="w-4 h-4 ml-1" />
              المهام
            </TabsTrigger>
            <TabsTrigger 
              value="competitions" 
              data-testid="tab-competitions"
              className="rounded-full data-[state=active]:bg-[#3d2b1f] data-[state=active]:text-white text-xs"
            >
              <Trophy className="w-4 h-4 ml-1" />
              المنافسات
            </TabsTrigger>
            <TabsTrigger 
              value="league" 
              data-testid="tab-league"
              className="rounded-full data-[state=active]:bg-[#3d2b1f] data-[state=active]:text-white text-xs"
            >
              <Goal className="w-4 h-4 ml-1" />
              الدوري
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-[#3d2b1f]">الفرق والطلاب ({students.length})</h2>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="البحث عن طالب..."
                    data-testid="search-student-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 rounded-full border-[#3d2b1f]/20"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                
                {/* Print All QR Button */}
                <Button 
                  variant="outline"
                  onClick={() => setPrintAllQROpen(true)}
                  className="rounded-full border-[#3d2b1f] text-[#3d2b1f]"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة الباركودات
                </Button>
                
                <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      data-testid="add-student-btn"
                      className="bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة طالب
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle>إضافة طالب جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="name">اسم الطالب *</Label>
                        <Input
                          id="name"
                          data-testid="student-name-input"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="أدخل اسم الطالب"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">رقم الجوال</Label>
                        <Input
                          id="phone"
                          data-testid="student-phone-input"
                          value={newStudent.phone}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="05xxxxxxxx"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="team">الفريق *</Label>
                        <Select 
                          value={newStudent.team} 
                          onValueChange={(value) => setNewStudent(prev => ({ ...prev, team: value }))}
                        >
                          <SelectTrigger data-testid="student-team-select" className="mt-1">
                            <SelectValue placeholder="اختر الفريق" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                <div className="flex items-center gap-2">
                                  <span>{team.emoji}</span>
                                  <span>{team.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="photo">صورة الطالب</Label>
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          data-testid="student-photo-input"
                          onChange={handleImageSelect}
                          className="mt-1"
                        />
                        {newStudent.photo && (
                          <div className="mt-2 flex items-center gap-2">
                            <img 
                              src={newStudent.photo} 
                              alt="Preview" 
                              className="w-20 h-20 rounded-full object-cover border-2 border-[#d5f5c0]"
                            />
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTempImage(newStudent.photo);
                                setCropperOpen(true);
                              }}
                              className="text-xs"
                            >
                              تعديل الصورة
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleAddStudent}
                        data-testid="submit-student-btn"
                        className="w-full bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                      >
                        إضافة الطالب
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team, teamIndex) => {
                const teamStudents = filteredStudentsByTeam[team.id] || [];
                return (
                  <Card 
                    key={team.id}
                    className="overflow-hidden animate-fadeIn"
                    style={{ 
                      animationDelay: `${teamIndex * 0.1}s`,
                      borderColor: team.color,
                      borderWidth: '2px'
                    }}
                    data-testid={`team-card-${team.id}`}
                  >
                    {/* Team Header */}
                    <div 
                      className="p-4 flex items-center gap-3"
                      style={{ backgroundColor: team.bg }}
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: team.color }}
                      >
                        <TeamIcon teamId={team.id} className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: team.color }}>
                          <span>{team.emoji}</span>
                          {team.name}
                        </h3>
                        <p className="text-sm text-gray-600">{teamStudents.length} طالب</p>
                      </div>
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: team.color }}
                      >
                        {teamStudents.reduce((sum, s) => sum + s.total_points, 0)} نقطة
                      </Badge>
                    </div>

                    {/* Team Points Button */}
                    <div className="px-4 pt-2">
                      <Dialog open={teamPointsDialogOpen && selectedTeamForPoints?.id === team.id} onOpenChange={(open) => {
                        setTeamPointsDialogOpen(open);
                        if (open) setSelectedTeamForPoints(team);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            data-testid={`team-points-btn-${team.id}`}
                            className="w-full rounded-full text-white text-sm"
                            style={{ backgroundColor: team.color }}
                            onClick={() => setSelectedTeamForPoints(team)}
                          >
                            <Sparkles className="w-4 h-4 ml-1" />
                            إضافة نقاط لكل الفريق
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white">
                          <DialogHeader>
                            <DialogTitle className="text-[#3d2b1f]">
                              نقاط فريق {team.emoji} {team.name} ({teamStudents.length} طالب)
                            </DialogTitle>
                          </DialogHeader>
                          <Tabs defaultValue="team-positive" className="mt-4">
                            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                              <TabsTrigger value="team-positive" className="text-green-600 data-[state=active]:bg-white text-xs">
                                <PlusCircle className="w-3 h-3 ml-1" />
                                إيجابيات
                              </TabsTrigger>
                              <TabsTrigger value="team-deductions" className="text-red-600 data-[state=active]:bg-white text-xs">
                                <MinusCircle className="w-3 h-3 ml-1" />
                                خصومات
                              </TabsTrigger>
                              <TabsTrigger value="team-custom" className="text-blue-600 data-[state=active]:bg-white text-xs">
                                <Edit2 className="w-3 h-3 ml-1" />
                                مخصصة
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="team-positive" className="mt-4">
                              <div className="space-y-2">
                                {positiveCategories.map((cat, i) => (
                                  <button
                                    key={i}
                                    data-testid={`team-positive-${team.id}-${i}`}
                                    onClick={() => handleTeamPoints(cat.name, cat.points, true)}
                                    className="w-full flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 text-right bg-white transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{cat.emoji}</span>
                                      <span className="font-medium text-[#3d2b1f]">{cat.name}</span>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 border-0">
                                      +{cat.points}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            </TabsContent>
                            <TabsContent value="team-deductions" className="mt-4">
                              <div className="space-y-2">
                                {deductionCategories.map((cat, i) => (
                                  <button
                                    key={i}
                                    data-testid={`team-deduction-${team.id}-${i}`}
                                    onClick={() => handleTeamPoints(cat.name, cat.points, false)}
                                    className="w-full flex items-center justify-between p-3 border border-red-200 rounded-lg hover:bg-red-50 text-right bg-white transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{cat.emoji}</span>
                                      <span className="font-medium text-[#3d2b1f]">{cat.name}</span>
                                    </div>
                                    <Badge className="bg-red-100 text-red-700 border-0">
                                      {cat.points}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            </TabsContent>
                            <TabsContent value="team-custom" className="mt-4">
                              <div className="space-y-4 p-1">
                                <div>
                                  <Label>السبب</Label>
                                  <Input
                                    data-testid={`team-custom-reason-${team.id}`}
                                    value={teamCustomReason}
                                    onChange={(e) => setTeamCustomReason(e.target.value)}
                                    placeholder="مثال: الفوز في المسابقة"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>عدد النقاط</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    data-testid={`team-custom-points-${team.id}`}
                                    value={teamCustomPoints}
                                    onChange={(e) => setTeamCustomPoints(parseInt(e.target.value) || 0)}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    data-testid={`team-custom-positive-${team.id}`}
                                    onClick={() => handleTeamCustomPoints(true)}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 rounded-full"
                                    disabled={!teamCustomReason.trim() || teamCustomPoints <= 0}
                                  >
                                    <PlusCircle className="w-4 h-4 ml-1" />
                                    إضافة نقاط
                                  </Button>
                                  <Button
                                    data-testid={`team-custom-negative-${team.id}`}
                                    onClick={() => handleTeamCustomPoints(false)}
                                    className="flex-1 bg-red-600 text-white hover:bg-red-700 rounded-full"
                                    disabled={!teamCustomReason.trim() || teamCustomPoints <= 0}
                                  >
                                    <MinusCircle className="w-4 h-4 ml-1" />
                                    خصم نقاط
                                  </Button>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Team Students */}
                    <CardContent className="p-4 max-h-[400px] overflow-y-auto">
                      {teamStudents.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>{searchQuery ? "لا توجد نتائج" : "لا يوجد طلاب في هذا الفريق"}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {teamStudents.map((student, index) => (
                            <div 
                              key={student.id}
                              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                              style={{ backgroundColor: `${team.bg}80` }}
                              data-testid={`student-${team.id}-${index}`}
                            >
                              {student.photo ? (
                                <img 
                                  src={student.photo} 
                                  alt={student.name}
                                  className="w-12 h-12 rounded-full object-cover border-2"
                                  style={{ borderColor: team.color }}
                                />
                              ) : (
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                  style={{ backgroundColor: team.color }}
                                >
                                  {student.name.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[#3d2b1f] truncate">{student.name}</h4>
                                {student.phone && (
                                  <p className="text-xs text-gray-500">{student.phone}</p>
                                )}
                              </div>
                              <div className="text-left">
                                <span className={`text-lg font-bold ${student.total_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {student.total_points}
                                </span>
                                <p className="text-xs text-gray-500">نقطة</p>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex gap-1">
                                {/* Edit Button */}
                                <Button 
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`edit-btn-${team.id}-${index}`}
                                  className="rounded-full hover:bg-white"
                                  onClick={() => openEditDialog(student)}
                                >
                                  <Edit2 className="w-4 h-4" style={{ color: team.color }} />
                                </Button>

                                {/* QR Code Button */}
                                <Button 
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`qr-btn-${team.id}-${index}`}
                                  className="rounded-full hover:bg-white"
                                  onClick={() => {
                                    setQrStudent(student);
                                    setQrDialogOpen(true);
                                  }}
                                >
                                  <QrCode className="w-4 h-4" style={{ color: team.color }} />
                                </Button>

                                {/* Points Dialog */}
                                <Dialog open={pointsDialogOpen && selectedStudent?.id === student.id} onOpenChange={(open) => {
                                  setPointsDialogOpen(open);
                                  if (open) setSelectedStudent(student);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="icon"
                                      variant="ghost"
                                      data-testid={`manage-points-${team.id}-${index}`}
                                      className="rounded-full hover:bg-white"
                                      onClick={() => setSelectedStudent(student)}
                                    >
                                      <Settings className="w-4 h-4" style={{ color: team.color }} />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white">
                                    <DialogHeader>
                                      <DialogTitle className="text-[#3d2b1f]">إدارة نقاط {student.name}</DialogTitle>
                                    </DialogHeader>
                                    <Tabs defaultValue="positive" className="mt-4">
                                      <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                                        <TabsTrigger value="positive" className="text-green-600 data-[state=active]:bg-white text-xs">
                                          <PlusCircle className="w-3 h-3 ml-1" />
                                          إيجابيات
                                        </TabsTrigger>
                                        <TabsTrigger value="deductions" className="text-red-600 data-[state=active]:bg-white text-xs">
                                          <MinusCircle className="w-3 h-3 ml-1" />
                                          خصومات
                                        </TabsTrigger>
                                        <TabsTrigger value="custom" className="text-blue-600 data-[state=active]:bg-white text-xs">
                                          <Edit2 className="w-3 h-3 ml-1" />
                                          مخصصة
                                        </TabsTrigger>
                                      </TabsList>
                                      <TabsContent value="positive" className="mt-4">
                                        <div className="space-y-2">
                                          {positiveCategories.map((cat, i) => (
                                            <button
                                              key={i}
                                              data-testid={`positive-category-${i}`}
                                              onClick={() => handleAddPoints(cat.name, cat.points, true)}
                                              className="w-full flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 text-right bg-white transition-colors"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-xl">{cat.emoji}</span>
                                                <span className="font-medium text-[#3d2b1f]">{cat.name}</span>
                                              </div>
                                              <Badge className="bg-green-100 text-green-700 border-0">
                                                +{cat.points}
                                              </Badge>
                                            </button>
                                          ))}
                                        </div>
                                      </TabsContent>
                                      <TabsContent value="deductions" className="mt-4">
                                        <div className="space-y-2">
                                          {deductionCategories.map((cat, i) => (
                                            <button
                                              key={i}
                                              data-testid={`deduction-category-${i}`}
                                              onClick={() => handleAddPoints(cat.name, cat.points, false)}
                                              className="w-full flex items-center justify-between p-3 border border-red-200 rounded-lg hover:bg-red-50 text-right bg-white transition-colors"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-xl">{cat.emoji}</span>
                                                <span className="font-medium text-[#3d2b1f]">{cat.name}</span>
                                              </div>
                                              <Badge className="bg-red-100 text-red-700 border-0">
                                                {cat.points}
                                              </Badge>
                                            </button>
                                          ))}
                                        </div>
                                      </TabsContent>
                                      <TabsContent value="custom" className="mt-4">
                                        <div className="space-y-4 p-1">
                                          <div>
                                            <Label>السبب</Label>
                                            <Input
                                              data-testid="custom-reason-input"
                                              value={customReason}
                                              onChange={(e) => setCustomReason(e.target.value)}
                                              placeholder="مثال: مشاركة متميزة"
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label>عدد النقاط</Label>
                                            <Input
                                              type="number"
                                              min="1"
                                              data-testid="custom-points-input"
                                              value={customPoints}
                                              onChange={(e) => setCustomPoints(parseInt(e.target.value) || 0)}
                                              className="mt-1"
                                            />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              data-testid="custom-positive-btn"
                                              onClick={() => handleCustomPoints(true)}
                                              className="flex-1 bg-green-600 text-white hover:bg-green-700 rounded-full"
                                              disabled={!customReason.trim() || customPoints <= 0}
                                            >
                                              <PlusCircle className="w-4 h-4 ml-1" />
                                              إضافة نقاط
                                            </Button>
                                            <Button
                                              data-testid="custom-negative-btn"
                                              onClick={() => handleCustomPoints(false)}
                                              className="flex-1 bg-red-600 text-white hover:bg-red-700 rounded-full"
                                              disabled={!customReason.trim() || customPoints <= 0}
                                            >
                                              <MinusCircle className="w-4 h-4 ml-1" />
                                              خصم نقاط
                                            </Button>
                                          </div>
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button 
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`delete-student-${team.id}-${index}`}
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-[#3d2b1f] flex items-center gap-2">
                <School className="w-6 h-6" />
                معلمي القرآن ({teachers.length})
              </h2>
              
              <Dialog open={addTeacherDialogOpen} onOpenChange={setAddTeacherDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة معلم
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white">
                  <DialogHeader>
                    <DialogTitle>إضافة معلم جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="teacher-name">اسم المعلم *</Label>
                      <Input
                        id="teacher-name"
                        value={newTeacher.name}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="أدخل اسم المعلم"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher-username">اسم المستخدم *</Label>
                      <Input
                        id="teacher-username"
                        value={newTeacher.username}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="اسم المستخدم للدخول"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher-password">كلمة المرور *</Label>
                      <Input
                        id="teacher-password"
                        type="password"
                        value={newTeacher.password}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="كلمة المرور"
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleAddTeacher}
                      className="w-full bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                    >
                      إضافة المعلم
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {teachers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <School className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">لا يوجد معلمين مسجلين</p>
                <p className="text-sm">أضف معلمين للبدء</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((teacher) => {
                  const assignedStudents = teacherAssignments[teacher.id] || [];
                  const canAssignMore = assignedStudents.length < 3;
                  
                  return (
                    <Card key={teacher.id} className="bg-white overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                              {teacher.name.charAt(0)}
                            </div>
                            <div>
                              <CardTitle className="text-emerald-800 text-lg">{teacher.name}</CardTitle>
                              <p className="text-sm text-gray-500">@{teacher.username}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            الطلاب المخصصين ({assignedStudents.length}/3)
                          </h4>
                          {canAssignMore && (
                            <Dialog 
                              open={assignStudentDialogOpen && selectedTeacherForAssign === teacher.id}
                              onOpenChange={(open) => {
                                setAssignStudentDialogOpen(open);
                                if (open) setSelectedTeacherForAssign(teacher.id);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTeacherForAssign(teacher.id)}
                                  className="rounded-full text-xs"
                                >
                                  <Plus className="w-3 h-3 ml-1" />
                                  إضافة طالب
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md bg-white">
                                <DialogHeader>
                                  <DialogTitle>تخصيص طالب للمعلم {teacher.name}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                                  {students.filter(s => !assignedStudents.some(as => as.id === s.id)).length === 0 ? (
                                    <p className="text-center text-gray-400 py-4">لا يوجد طلاب متاحين</p>
                                  ) : (
                                    students
                                      .filter(s => !assignedStudents.some(as => as.id === s.id))
                                      .map(student => {
                                        const team = getTeamById(student.team);
                                        return (
                                          <div 
                                            key={student.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                          >
                                            <div className="flex items-center gap-3">
                                              {student.photo ? (
                                                <img 
                                                  src={student.photo} 
                                                  alt={student.name}
                                                  className="w-10 h-10 rounded-full object-cover"
                                                />
                                              ) : (
                                                <div 
                                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                  style={{ backgroundColor: team?.color || '#3d2b1f' }}
                                                >
                                                  {student.name.charAt(0)}
                                                </div>
                                              )}
                                              <div>
                                                <p className="font-medium">{student.name}</p>
                                                <Badge style={{ backgroundColor: team?.bg, color: team?.color }}>
                                                  {team?.emoji} {team?.name}
                                                </Badge>
                                              </div>
                                            </div>
                                            <Button 
                                              size="sm"
                                              onClick={() => {
                                                handleAssignStudent(teacher.id, student.id);
                                                setAssignStudentDialogOpen(false);
                                              }}
                                              className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                                            >
                                              <Plus className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        );
                                      })
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        
                        {assignedStudents.length === 0 ? (
                          <p className="text-gray-400 text-center py-4">لا يوجد طلاب مخصصين</p>
                        ) : (
                          <div className="space-y-2">
                            {assignedStudents.map((student) => {
                              const team = getTeamById(student.team);
                              return (
                                <div 
                                  key={student.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    {student.photo ? (
                                      <img 
                                        src={student.photo} 
                                        alt={student.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                        style={{ backgroundColor: team?.color || '#3d2b1f' }}
                                      >
                                        {student.name.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">{student.name}</p>
                                      <Badge className="text-xs" style={{ backgroundColor: team?.bg, color: team?.color }}>
                                        {team?.emoji}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRemoveStudent(teacher.id, student.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-full"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#3d2b1f]">📋 المهام الأسبوعية</h2>
              <div className="flex gap-2">
                <Button 
                  data-testid="distribute-tasks-btn"
                  onClick={handleDistributeTasks}
                  className="bg-green-600 text-white hover:bg-green-700 rounded-full text-sm"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  توزيع المهام
                </Button>
                <Button 
                  data-testid="clear-tasks-btn"
                  onClick={handleClearTasks}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 rounded-full text-sm"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  إزالة الكل
                </Button>
              </div>
            </div>

            {taskWeek && (
              <Badge className="mb-4 bg-[#d5f5c0] text-[#3d2b1f]">
                <CalendarDays className="w-3 h-3 ml-1" />
                أسبوع {taskWeek}
              </Badge>
            )}

            {weeklyTasks.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-8 text-center text-gray-400">
                  <ClipboardList className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>لا توجد مهام موزعة</p>
                  <p className="text-sm mt-1">اضغط "توزيع المهام" لتوزيع مهام الأسبوع</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {teams.map(team => {
                  const teamTasks = weeklyTasks.filter(t => t.team_id === team.id);
                  const teamReservations = socialReservations.filter(r => r.team_id === team.id);
                  const teamDinners = specialDinners.filter(d => d.team_id === team.id);
                  const teamStudentsList = students.filter(s => s.team === team.id);

                  return (
                    <Card key={team.id} className="overflow-hidden" style={{ borderColor: team.color, borderWidth: '2px' }}>
                      <div className="p-4 flex items-center gap-3" style={{ backgroundColor: team.bg }}>
                        <span className="text-2xl">{team.emoji}</span>
                        <h3 className="text-lg font-bold flex-1" style={{ color: team.color }}>{team.name}</h3>
                        <Badge className="text-white" style={{ backgroundColor: team.color }}>{teamStudentsList.length} طالب</Badge>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        {teamTasks.map(task => {
                          const taskInfo = [
                            {id: "adhan", name: "🕌 الأذان والإقامة والصلاة", assign: true},
                            {id: "speech", name: "🎤 كلمة بعد المغرب والعشاء", assign: true},
                            {id: "activity", name: "🎯 فعالية الفريق", assign: false},
                            {id: "social", name: "🤝 الاجتماعي", assign: false, social: true}
                          ].find(t => t.id === task.task_type) || {};

                          const assignedStudent = task.assigned_student_id ? students.find(s => s.id === task.assigned_student_id) : null;

                          return (
                            <div key={task.id} className="p-3 border rounded-xl bg-gray-50" data-testid={`task-${task.id}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-[#3d2b1f]">{taskInfo.name}</span>
                                {assignedStudent && (
                                  <Badge className="bg-green-100 text-green-700">{assignedStudent.name}</Badge>
                                )}
                              </div>

                              {/* Assign student for adhan/speech */}
                              {taskInfo.assign && (
                                <Select 
                                  value={task.assigned_student_id || ""} 
                                  onValueChange={(v) => handleAssignTask(task.id, v)}
                                >
                                  <SelectTrigger className="mt-1" data-testid={`assign-${task.id}`}>
                                    <SelectValue placeholder="تعيين طالب" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teamStudentsList.map(s => (
                                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                              {/* Social items display */}
                              {taskInfo.social && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  {["قهوة", "شاي", "حلى", "سمبوسة"].map(item => {
                                    const reservation = teamReservations.find(r => r.item === item);
                                    const reservedBy = reservation ? students.find(s => s.id === reservation.student_id) : null;
                                    return (
                                      <div 
                                        key={item} 
                                        className={`p-2 rounded-lg text-center text-sm ${reservation ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-200'}`}
                                      >
                                        <span className="font-bold">{item === "قهوة" ? "☕" : item === "شاي" ? "🍵" : item === "حلى" ? "🍰" : "🥟"} {item}</span>
                                        {reservedBy ? (
                                          <p className="text-xs text-green-700 mt-1">{reservedBy.name}</p>
                                        ) : (
                                          <p className="text-xs text-gray-400 mt-1">متاح</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Special Dinners */}
                        {teamDinners.map(dinner => {
                          const dStudent = dinner.assigned_student_id ? students.find(s => s.id === dinner.assigned_student_id) : null;
                          return (
                            <div key={dinner.id} className="p-3 border-2 border-amber-300 rounded-xl bg-amber-50 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-[#3d2b1f]">🍽️ العشاء المتميز</span>
                                {dStudent && <Badge className="mr-2 bg-amber-100 text-amber-700">{dStudent.name}</Badge>}
                              </div>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 rounded-full" onClick={() => handleDeleteDinner(dinner.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Special Dinner Dialog */}
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-[#3d2b1f] text-lg flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                      إضافة عشاء متميز
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={dinnerTeamId} onValueChange={setDinnerTeamId}>
                      <SelectTrigger data-testid="dinner-team-select">
                        <SelectValue placeholder="اختر الفريق" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {dinnerTeamId && (
                      <Select value={dinnerStudentId} onValueChange={setDinnerStudentId}>
                        <SelectTrigger data-testid="dinner-student-select">
                          <SelectValue placeholder="اختر الطالب (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.team === dinnerTeamId).map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      data-testid="add-dinner-btn"
                      onClick={handleAddSpecialDinner}
                      className="w-full bg-amber-500 text-white hover:bg-amber-600 rounded-full"
                      disabled={!dinnerTeamId}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة العشاء المتميز
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Competitions Tab */}
          <TabsContent value="competitions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#3d2b1f]">المنافسات ({competitions.length})</h2>
              <Dialog open={addCompetitionDialogOpen} onOpenChange={setAddCompetitionDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    data-testid="add-competition-btn"
                    className="bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة منافسة
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white">
                  <DialogHeader>
                    <DialogTitle>إضافة منافسة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="title">عنوان المنافسة *</Label>
                      <Input
                        id="title"
                        data-testid="competition-title-input"
                        value={newCompetition.title}
                        onChange={(e) => setNewCompetition(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="أدخل عنوان المنافسة"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">الوصف (اختياري)</Label>
                      <Textarea
                        id="description"
                        data-testid="competition-desc-input"
                        value={newCompetition.description}
                        onChange={(e) => setNewCompetition(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="أدخل وصف المنافسة"
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleAddCompetition}
                      data-testid="submit-competition-btn"
                      className="w-full bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                    >
                      إضافة المنافسة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {competitions.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-8 text-center" data-testid="empty-competitions-admin">
                  <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">لا توجد منافسات</p>
                  <p className="text-sm text-gray-400 mt-2">ابدأ بإضافة منافسة جديدة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {competitions.map((competition, index) => (
                  <Card 
                    key={competition.id} 
                    className="bg-white border-[#3d2b1f]/10 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    data-testid={`competition-card-${index}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${competition.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Trophy className={`w-5 h-5 ${competition.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{competition.title}</CardTitle>
                            {competition.description && (
                              <p className="text-sm text-gray-500">{competition.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={competition.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                            {competition.is_active ? 'نشط' : 'متوقف'}
                          </Badge>
                          <Switch
                            checked={competition.is_active}
                            data-testid={`toggle-competition-${index}`}
                            onCheckedChange={() => handleToggleCompetition(competition.id)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-[#3d2b1f]">
                            الأسئلة ({competition.questions?.length || 0})
                          </h4>
                          <Dialog open={addQuestionDialogOpen && selectedCompetition?.id === competition.id} onOpenChange={(open) => {
                            setAddQuestionDialogOpen(open);
                            if (open) setSelectedCompetition(competition);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                data-testid={`add-question-btn-${index}`}
                                className="bg-[#d5f5c0] text-[#3d2b1f] hover:bg-[#c5e5b0] rounded-full"
                                onClick={() => setSelectedCompetition(competition)}
                              >
                                <Plus className="w-4 h-4 ml-1" />
                                إضافة سؤال
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white">
                              <DialogHeader>
                                <DialogTitle>إضافة سؤال جديد</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div>
                                  <Label htmlFor="question-text">نص السؤال *</Label>
                                  <Textarea
                                    id="question-text"
                                    data-testid="question-text-input"
                                    value={newQuestion.text}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                                    placeholder="أدخل نص السؤال"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="question-points">النقاط</Label>
                                  <Input
                                    id="question-points"
                                    type="number"
                                    data-testid="question-points-input"
                                    value={newQuestion.points}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>الاختيارات (حدد الإجابة الصحيحة)</Label>
                                  <div className="space-y-2 mt-2">
                                    {newQuestion.options.map((option, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          data-testid={`option-correct-${i}`}
                                          onClick={() => updateQuestionOption(i, 'is_correct', true)}
                                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${option.is_correct ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                        >
                                          {option.is_correct ? <CheckCircle className="w-5 h-5" /> : (i + 1)}
                                        </button>
                                        <Input
                                          data-testid={`option-text-${i}`}
                                          value={option.text}
                                          onChange={(e) => updateQuestionOption(i, 'text', e.target.value)}
                                          placeholder={`الاختيار ${i + 1}`}
                                          className="flex-1"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <Button 
                                  onClick={handleAddQuestion}
                                  data-testid="submit-question-btn"
                                  className="w-full bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                                >
                                  إضافة السؤال
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {competition.questions?.length > 0 ? (
                          <div className="space-y-2">
                            {competition.questions.map((question, qIndex) => (
                              <div 
                                key={question.id} 
                                className="p-3 bg-gray-50 rounded-lg"
                                data-testid={`question-item-${index}-${qIndex}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-[#3d2b1f]">{question.text}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {question.options?.map((opt, oIndex) => (
                                        <Badge 
                                          key={oIndex}
                                          className={opt.is_correct ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}
                                        >
                                          {opt.text}
                                          {opt.is_correct && <CheckCircle className="w-3 h-3 mr-1" />}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-amber-100 text-amber-700">
                                      {question.points} نقطة
                                    </Badge>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      data-testid={`delete-question-${index}-${qIndex}`}
                                      onClick={() => handleDeleteQuestion(competition.id, question.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">لا توجد أسئلة</p>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`delete-competition-${index}`}
                          onClick={() => handleDeleteCompetition(competition.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف المنافسة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* League Tab */}
          <TabsContent value="league">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#3d2b1f]">⚽ دوري كرة القدم</h2>
              <Dialog open={addMatchDialogOpen} onOpenChange={setAddMatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    data-testid="add-match-btn"
                    className="bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مباراة
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white">
                  <DialogHeader>
                    <DialogTitle>إضافة مباراة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>الفريق الأول *</Label>
                      <Select value={newMatch.team1_id} onValueChange={(v) => setNewMatch(p => ({ ...p, team1_id: v }))}>
                        <SelectTrigger data-testid="match-team1-select" className="mt-1">
                          <SelectValue placeholder="اختر الفريق الأول" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              <span>{t.emoji} {t.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>الفريق الثاني *</Label>
                      <Select value={newMatch.team2_id} onValueChange={(v) => setNewMatch(p => ({ ...p, team2_id: v }))}>
                        <SelectTrigger data-testid="match-team2-select" className="mt-1">
                          <SelectValue placeholder="اختر الفريق الثاني" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              <span>{t.emoji} {t.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>تاريخ المباراة (اختياري)</Label>
                      <Input
                        type="date"
                        data-testid="match-date-input"
                        value={newMatch.match_date}
                        onChange={(e) => setNewMatch(p => ({ ...p, match_date: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleAddMatch}
                      data-testid="submit-match-btn"
                      className="w-full bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                    >
                      إضافة المباراة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Standings Table */}
            <Card className="bg-white mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#3d2b1f] text-lg">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  جدول الترتيب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="standings-table">
                    <thead>
                      <tr className="bg-[#3d2b1f] text-white text-sm">
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
                      {standings.map((team, index) => (
                        <tr key={team.team_id} className={`border-b ${index === 0 ? 'bg-yellow-50' : ''}`}>
                          <td className="p-3">
                            <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-orange-400 text-white' :
                              'bg-gray-100 text-gray-600'
                            }`}>{index + 1}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold" style={{ color: team.team_color }}>{team.team_emoji} {team.team_name}</span>
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
                            <span className="bg-[#3d2b1f] text-white px-3 py-1 rounded-full font-bold text-sm">{team.points}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Matches List */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#3d2b1f] text-lg">
                  <Goal className="w-5 h-5 text-green-600" />
                  المباريات ({matches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Goal className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>لا توجد مباريات</p>
                    <p className="text-sm mt-1">ابدأ بإضافة مباراة جديدة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((match) => {
                      const team1 = getTeamById(match.team1_id);
                      const team2 = getTeamById(match.team2_id);
                      const isEditing = editMatchId === match.id;
                      return (
                        <div 
                          key={match.id}
                          className={`p-4 rounded-xl border-2 ${match.is_played ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                          data-testid={`match-card-${match.id}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-center flex-1">
                              <span className="text-2xl">{team1?.emoji}</span>
                              <p className="font-bold text-sm" style={{ color: team1?.color }}>{team1?.name}</p>
                            </div>
                            <div className="px-4 text-center">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    data-testid="edit-score1-input"
                                    value={editMatchScores.team1_score}
                                    onChange={(e) => setEditMatchScores(p => ({ ...p, team1_score: parseInt(e.target.value) || 0 }))}
                                    className="w-16 text-center"
                                  />
                                  <span className="font-bold">-</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    data-testid="edit-score2-input"
                                    value={editMatchScores.team2_score}
                                    onChange={(e) => setEditMatchScores(p => ({ ...p, team2_score: parseInt(e.target.value) || 0 }))}
                                    className="w-16 text-center"
                                  />
                                </div>
                              ) : match.is_played ? (
                                <div className="bg-[#3d2b1f] text-white px-4 py-2 rounded-xl">
                                  <span className="text-xl font-bold">{match.team1_score} - {match.team2_score}</span>
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
                          <div className="flex justify-center gap-2 mt-2">
                            {isEditing ? (
                              <>
                                <Button 
                                  size="sm"
                                  data-testid="save-score-btn"
                                  className="bg-green-600 text-white hover:bg-green-700 rounded-full"
                                  onClick={() => handleUpdateMatchScore(match.id)}
                                >
                                  <CheckCircle className="w-4 h-4 ml-1" />
                                  حفظ النتيجة
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                  onClick={() => setEditMatchId(null)}
                                >
                                  إلغاء
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm"
                                  data-testid={`update-score-btn-${match.id}`}
                                  className="bg-[#d5f5c0] text-[#3d2b1f] hover:bg-[#c5e5b0] rounded-full"
                                  onClick={() => {
                                    setEditMatchId(match.id);
                                    setEditMatchScores({ team1_score: match.team1_score, team2_score: match.team2_score });
                                  }}
                                >
                                  <Edit2 className="w-4 h-4 ml-1" />
                                  {match.is_played ? 'تعديل النتيجة' : 'إدخال النتيجة'}
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  data-testid={`delete-match-btn-${match.id}`}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                  onClick={() => handleDeleteMatch(match.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-center">باركود {qrStudent?.name}</DialogTitle>
          </DialogHeader>
          {qrStudent && (
            <div className="flex flex-col items-center gap-4 p-4">
              <div className="bg-white p-4 rounded-2xl shadow-lg border-2" style={{ borderColor: getTeamById(qrStudent.team)?.color || '#3d2b1f' }}>
                <QRCodeSVG 
                  id={`qr-${qrStudent.id}`}
                  value={getStudentProfileUrl(qrStudent.id)}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: LOGO_URL,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg text-[#3d2b1f]">{qrStudent.name}</h3>
                {getTeamById(qrStudent.team) && (
                  <Badge 
                    className="mt-1"
                    style={{ 
                      backgroundColor: getTeamById(qrStudent.team).bg,
                      color: getTeamById(qrStudent.team).color 
                    }}
                  >
                    {getTeamById(qrStudent.team).emoji} {getTeamById(qrStudent.team).name}
                  </Badge>
                )}
              </div>
              <Button
                onClick={() => downloadQR(qrStudent.id, qrStudent.name)}
                className="bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
              >
                <Download className="w-4 h-4 ml-2" />
                تحميل الباركود
              </Button>
              <p className="text-xs text-gray-400 text-center">
                امسح الباركود لفتح صفحة الطالب
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print All QR Dialog */}
      <Dialog open={printAllQROpen} onOpenChange={setPrintAllQROpen}>
        <DialogContent className="sm:max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">طباعة جميع الباركودات</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 mb-4">
            <Button
              onClick={printAllQRCodes}
              className="bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
            >
              <Printer className="w-4 h-4 ml-2" />
              طباعة الكل ({students.length} طالب)
            </Button>
          </div>
          <div ref={printRef} className="grid grid-cols-3 gap-4 p-4">
            {students.map(student => {
              const team = getTeamById(student.team);
              return (
                <div 
                  key={student.id}
                  className="border-2 rounded-xl p-3 text-center"
                  style={{ borderColor: team?.color || '#3d2b1f' }}
                >
                  <QRCodeSVG 
                    id={`print-qr-${student.id}`}
                    value={getStudentProfileUrl(student.id)}
                    size={120}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="font-bold text-sm text-[#3d2b1f] mt-2">{student.name}</p>
                  <p className="text-xs text-gray-500">{team?.emoji} {team?.name}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      <ImageCropper 
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setTempImage(null);
        }}
        imageSrc={tempImage}
        onCropComplete={handleCropComplete}
      />

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          {editStudent && (
            <div className="space-y-4 mt-4">
              {/* Current Photo */}
              <div className="flex justify-center">
                {editForm.photo ? (
                  <img 
                    src={editForm.photo} 
                    alt={editForm.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#d5f5c0]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#d5f5c0] flex items-center justify-center text-[#3d2b1f] text-3xl font-bold">
                    {editForm.name?.charAt(0) || "؟"}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit-name">اسم الطالب *</Label>
                <Input
                  id="edit-name"
                  data-testid="edit-student-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم الطالب"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-phone">رقم الجوال</Label>
                <Input
                  id="edit-phone"
                  data-testid="edit-student-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-team">الفريق</Label>
                <Select 
                  value={editForm.team} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, team: value }))}
                >
                  <SelectTrigger data-testid="edit-student-team" className="mt-1">
                    <SelectValue placeholder="اختر الفريق" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <span>{team.emoji}</span>
                          <span>{team.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-photo">تغيير الصورة</Label>
                <Input
                  id="edit-photo"
                  type="file"
                  accept="image/*"
                  data-testid="edit-student-photo"
                  onChange={handleEditImageSelect}
                  className="mt-1"
                />
              </div>

              {editForm.photo && (
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditTempImage(editForm.photo);
                    setEditCropperOpen(true);
                  }}
                  className="w-full"
                >
                  <Edit2 className="w-4 h-4 ml-2" />
                  تعديل الصورة الحالية
                </Button>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdateStudent}
                  data-testid="save-student-btn"
                  className="flex-1 bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  حفظ التعديلات
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="rounded-full"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Image Cropper */}
      <ImageCropper 
        isOpen={editCropperOpen}
        onClose={() => {
          setEditCropperOpen(false);
          setEditTempImage(null);
        }}
        imageSrc={editTempImage}
        onCropComplete={handleEditCropComplete}
      />
    </div>
  );
}
