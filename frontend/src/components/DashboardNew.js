import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import PointsModal from "./PointsModal";
import LeaderboardTicker from "./LeaderboardTicker";
import FootballLeague from "./FootballLeague";
import TasksManager from "./TasksManager";
import LeagueStarManager from "./LeagueStarManager";
import ViewerLinksManager from "./ViewerLinksManager";
import GroupsManager from "./GroupsManager";
import AttendanceManager from "./AttendanceManager";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const SUPERVISOR_COLORS = [
  { bg: "bg-lime-100", text: "text-lime-700", border: "border-lime-400", gradient: "from-lime-500 to-lime-600" },
  { bg: "bg-green-100", text: "text-green-700", border: "border-green-400", gradient: "from-green-500 to-green-600" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-400", gradient: "from-emerald-500 to-emerald-600" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-400", gradient: "from-teal-500 to-teal-600" },
  { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-400", gradient: "from-cyan-500 to-cyan-600" },
  { bg: "bg-green-100", text: "text-green-700", border: "border-green-400", gradient: "from-green-500 to-green-600" },
];

function Dashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBulkPoints, setShowBulkPoints] = useState(false);
  const [activeSection, setActiveSection] = useState("groups");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [leagueStar, setLeagueStar] = useState(null);

  // Add student form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSupervisor, setNewSupervisor] = useState("");
  const [newBarcode, setNewBarcode] = useState("");

  // Bulk points
  const [bulkGroup, setBulkGroup] = useState("");
  const [bulkPoints, setBulkPoints] = useState("");
  const [bulkReason, setBulkReason] = useState("");

  // Edit student
  const [editStudent, setEditStudent] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSupervisor, setEditSupervisor] = useState("");
  const [editTeacher, setEditTeacher] = useState("");
  const [editBarcode, setEditBarcode] = useState("");

  const headers = {};

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchStudents = useCallback(async () => {
    try {
      const [studentsRes, groupsRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/groups`)
      ]);
      setStudents(studentsRes.data);
      setSupervisors(groupsRes.data.map(g => g.name));
    } catch {
      showMsg("خطأ في جلب البيانات");
    }
  }, []);

  const fetchLeagueStar = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/league-star`);
      setLeagueStar(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchLeagueStar();
  }, [fetchStudents, fetchLeagueStar]);

  const addStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/students`, { name: newName, phone: newPhone, supervisor: newSupervisor, barcode: newBarcode || undefined }, { headers });
      setNewName(""); setNewPhone(""); setNewSupervisor(""); setNewBarcode("");
      setShowAddStudent(false);
      showMsg("تمت إضافة الطالب بنجاح");
      await fetchStudents();
    } catch {
      showMsg("خطأ في إضافة الطالب");
    } finally { setLoading(false); }
  };

  const updateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/students/${editStudent.id}`, { name: editName, phone: editPhone, supervisor: editSupervisor, teacher: editTeacher, barcode: editBarcode || undefined }, { headers });
      setEditStudent(null);
      showMsg("تم تحديث بيانات الطالب");
      await fetchStudents();
    } catch {
      showMsg("خطأ في التحديث");
    } finally { setLoading(false); }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    try {
      await axios.delete(`${API}/students/${id}`, { headers });
      showMsg("تم حذف الطالب");
      await fetchStudents();
    } catch {
      showMsg("خطأ في الحذف");
    }
  };

  const updatePoints = async (studentId, points, reason) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/points`, { points, reason }, { headers });
      showMsg(`تم ${points > 0 ? 'إضافة' : 'خصم'} ${Math.abs(points)} نقطة`);
      setSelectedStudent(null);
      await fetchStudents();
    } catch {
      showMsg("خطأ في تحديث النقاط");
    } finally { setLoading(false); }
  };

  const handleBulkPoints = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/students/bulk-points`, { group: bulkGroup, points: parseInt(bulkPoints), reason: bulkReason }, { headers });
      showMsg("تم تحديث نقاط المجموعة");
      setShowBulkPoints(false);
      setBulkGroup(""); setBulkPoints(""); setBulkReason("");
      await fetchStudents();
    } catch (err) {
      showMsg(err.response?.data?.detail || "خطأ");
    } finally { setLoading(false); }
  };

  const uploadImage = async (studentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/students/${studentId}/upload-image`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" }
      });
      showMsg("تم رفع الصورة");
      await fetchStudents();
    } catch {
      showMsg("خطأ في رفع الصورة");
    }
  };

  const getColor = (index) => SUPERVISOR_COLORS[index % SUPERVISOR_COLORS.length];
  const FRONTEND_URL = window.location.origin;

  const sections = [
    { id: "groups", label: "المجموعات", icon: "🏅" },
    { id: "students", label: "الطلاب", icon: "👥" },
    { id: "attendance", label: "الحضور", icon: "📱" },
    { id: "tasks", label: "المهام", icon: "📋" },
    { id: "league", label: "الدوري", icon: "⚽" },
    { id: "star", label: "نجم الدوري", icon: "⭐" },
    { id: "viewers", label: "روابط المشاهدة", icon: "🔗" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-500 to-green-600 text-black py-4 shadow-lg border-b-4 border-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">🌟 بارع</h1>
              <p className="text-green-900 text-sm">🎯 لوحة تحكم المشرف</p>
            </div>
            <div className="flex gap-2">
              <Link to="/challenges" className="bg-black hover:bg-gray-800 text-lime-400 px-3 py-2 rounded-lg text-sm font-semibold border-2 border-lime-400" data-testid="challenges-link">🏆 المنافسات</Link>
              <button onClick={onLogout} className="bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-semibold border-2 border-white" data-testid="logout-btn">🚪 خروج</button>
            </div>
          </div>
        </div>
      </div>

      {/* League Star Banner */}
      {leagueStar && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white py-3 px-4">
          <div className="container mx-auto flex items-center justify-center gap-3 text-center">
            <span className="text-xl">⭐</span>
            {leagueStar.image_url && <img src={leagueStar.image_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white/40" />}
            <span className="font-bold">نجم الدوري: {leagueStar.student_name}</span>
            <span className="text-yellow-100 text-sm">✨ {leagueStar.reason}</span>
          </div>
        </div>
      )}

      {/* Leaderboard Ticker */}
      <LeaderboardTicker students={students.slice(0, 10)} />

      {/* Message */}
      {message && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-white border-r-4 border-lime-500 text-green-700 p-3 rounded-lg shadow text-center font-semibold animate-fadeIn">{message}</div>
        </div>
      )}

      <div className="container mx-auto px-4 py-4">
        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeSection === s.id ? "bg-lime-500 text-black shadow-lg border-2 border-black" : "bg-white text-gray-600 shadow hover:bg-gray-50"}`}
              data-testid={`section-${s.id}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* ===== Groups Section ===== */}
        {activeSection === "groups" && <GroupsManager onGroupsChange={(names) => setSupervisors(names)} />}

        {/* ===== Students Section ===== */}
        {activeSection === "students" && (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowAddStudent(true)} className="bg-lime-500 hover:bg-lime-600 text-black px-4 py-2 rounded-lg text-sm font-bold border-2 border-black" data-testid="add-student-btn">➕ إضافة طالب</button>
              <button onClick={() => setShowQRModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold" data-testid="qr-codes-btn">📱 رموز QR</button>
              <button onClick={() => setShowBulkPoints(true)} className="bg-lime-500 hover:bg-lime-600 text-black px-4 py-2 rounded-lg text-sm font-bold border-2 border-black" data-testid="bulk-points-btn">💎 نقاط جماعية</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-lime-100">
                <p className="text-xl">👥</p>
                <div className="text-xl font-bold text-lime-600">{students.length}</div>
                <div className="text-xs text-gray-500">طالب</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-blue-100">
                <p className="text-xl">💎</p>
                <div className="text-xl font-bold text-blue-600">{students.reduce((a, s) => a + s.points, 0)}</div>
                <div className="text-xs text-gray-500">مجموع النقاط</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-green-100">
                <p className="text-xl">🏅</p>
                <div className="text-xl font-bold text-green-600">{supervisors.length}</div>
                <div className="text-xs text-gray-500">مجموعة</div>
              </div>
            </div>

            {/* Students by Group */}
            {supervisors.map((sup, si) => {
              const color = getColor(si);
              const groupStudents = students.filter(s => s.supervisor === sup);
              return (
                <div key={sup} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className={`bg-gradient-to-r ${color.gradient} text-white p-3 flex items-center justify-between`}>
                    <h3 className="font-bold">🏅 {sup}</h3>
                    <span className="bg-white/20 px-3 py-0.5 rounded-full text-sm">{groupStudents.length} طالب</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {groupStudents.map(student => (
                      <div key={student.id} className={`flex items-center gap-3 p-2 rounded-lg border ${color.border} bg-gray-50 hover:bg-white transition`}>
                        {/* Image */}
                        <div className="relative">
                          {student.image_url ? (
                            <img src={student.image_url} alt="" className={`w-10 h-10 rounded-full object-cover border-2 ${color.border}`} />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${color.bg} ${color.text} flex items-center justify-center font-bold`}>
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <label className="absolute -bottom-1 -left-1 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer text-xs hover:bg-gray-400">
                            +
                            <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) uploadImage(student.id, e.target.files[0]); }} />
                          </label>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{student.name}</p>
                          {student.phone && <p className="text-xs text-gray-400">{student.phone}</p>}
                          {student.teacher && (
                            <span className="inline-block mt-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-300">
                              📚 معلم {student.teacher}
                            </span>
                          )}
                        </div>

                        {/* Points */}
                        <span className="bg-gradient-to-r from-lime-100 to-green-100 text-green-700 px-2 py-0.5 rounded-full text-sm font-bold">{student.points} ⭐</span>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedStudent(student)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold" data-testid={`points-btn-${student.id}`}>نقاط</button>
                          <button onClick={() => { setEditStudent(student); setEditName(student.name); setEditPhone(student.phone || ""); setEditSupervisor(student.supervisor || ""); setEditTeacher(student.teacher || ""); setEditBarcode(student.barcode || ""); }}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs" data-testid={`edit-btn-${student.id}`}>تعديل</button>
                          <button onClick={() => deleteStudent(student.id)} className="text-red-400 hover:text-red-600 text-sm" data-testid={`delete-btn-${student.id}`}>&#10005;</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Ungrouped students */}
            {students.filter(s => !s.supervisor).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-500 text-white p-3"><h3 className="font-bold">بدون مجموعة</h3></div>
                <div className="p-3 space-y-2">
                  {students.filter(s => !s.supervisor).map(student => (
                    <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-300 bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">{student.name.charAt(0)}</div>
                      <div className="flex-1"><p className="font-semibold text-sm">{student.name}</p></div>
                      <span className="bg-lime-100 text-green-700 px-2 py-0.5 rounded-full text-sm font-bold">{student.points}</span>
                      <button onClick={() => setSelectedStudent(student)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">نقاط</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== Attendance Section ===== */}
        {activeSection === "attendance" && (
          <div className="space-y-4">
            <AttendanceManager onAttendanceChange={fetchStudents} />
          </div>
        )}

        {/* ===== Tasks Section ===== */}
        {activeSection === "tasks" && <TasksManager supervisors={supervisors} />}

        {/* ===== League Section ===== */}
        {activeSection === "league" && <FootballLeague supervisors={supervisors} />}

        {/* ===== Star Section ===== */}
        {activeSection === "star" && <LeagueStarManager />}

        {/* ===== Viewers Section ===== */}
        {activeSection === "viewers" && <ViewerLinksManager />}
      </div>

      {/* ===== Modals ===== */}

      {/* Points Modal */}
      {selectedStudent && (
        <PointsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdatePoints={updatePoints} loading={loading} />
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddStudent(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">إضافة طالب جديد</h3>
            <form onSubmit={addStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم الطالب *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="الاسم الكامل" required data-testid="new-student-name" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">جوال ولي الأمر</label>
                <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="05xxxxxxxx" data-testid="new-student-phone" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">المجموعة *</label>
                <select value={newSupervisor} onChange={e => setNewSupervisor(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" required data-testid="new-student-supervisor">
                  <option value="">اختر المجموعة</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {supervisors.length === 0 && <p className="text-xs text-red-500 mt-1">⚠️ أضف مجموعة أولاً من قسم المجموعات</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">📊 رقم الباركود</label>
                <input type="text" value={newBarcode} onChange={e => setNewBarcode(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="رقم باركود الطالب (اختياري)" data-testid="new-student-barcode" />
                <p className="text-xs text-gray-500 mt-1">💡 يُستخدم لتسجيل الحضور بمسح الباركود</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-lime-500 hover:bg-lime-600 text-black py-3 rounded-lg font-bold disabled:opacity-50 border-2 border-black" data-testid="submit-add-student">
                  {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setEditStudent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">تعديل بيانات الطالب</h3>
            <form onSubmit={updateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">الاسم</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">الجوال</label>
                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">المجموعة</label>
                <select value={editSupervisor} onChange={e => setEditSupervisor(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500">
                  <option value="">بدون مجموعة</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">📚 معلم القرآن</label>
                <select value={editTeacher} onChange={e => setEditTeacher(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500">
                  <option value="">بدون معلم</option>
                  <option value="1">المعلم الأول</option>
                  <option value="2">المعلم الثاني</option>
                  <option value="3">المعلم الثالث</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">💡 يمكن تعيين الطالب إلى أحد 3 معلمين للقرآن</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">📊 رقم الباركود</label>
                <input type="text" value={editBarcode} onChange={e => setEditBarcode(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="رقم باركود الطالب" />
                <p className="text-xs text-gray-500 mt-1">💡 يُستخدم لتسجيل الحضور بمسح الباركود</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-lime-500 hover:bg-lime-600 text-black py-3 rounded-lg font-bold disabled:opacity-50 border-2 border-black">تحديث</button>
                <button type="button" onClick={() => setEditStudent(null)} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Codes Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">رموز QR للطلاب</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {students.map(s => {
                const studentLink = `${FRONTEND_URL}/public/${s.id}`;
                const copyLink = () => {
                  navigator.clipboard.writeText(studentLink);
                  showMsg(`تم نسخ رابط ${s.name}`);
                };
                return (
                  <div key={s.id} className="text-center border rounded-lg p-3">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(studentLink)}`} alt="QR" className="mx-auto mb-2" />
                    <p className="text-sm font-semibold truncate mb-2">{s.name}</p>
                    <button onClick={copyLink} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs font-bold">
                      📋 نسخ الرابط
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowQRModal(false)} className="w-full mt-4 bg-gray-500 text-white py-2 rounded-lg font-bold">إغلاق</button>
          </div>
        </div>
      )}

      {/* Bulk Points Modal */}
      {showBulkPoints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBulkPoints(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">نقاط جماعية للمجموعة</h3>
            <form onSubmit={handleBulkPoints} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">المجموعة</label>
                <select value={bulkGroup} onChange={e => setBulkGroup(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" required data-testid="bulk-group">
                  <option value="">اختر المجموعة</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">النقاط</label>
                <input type="number" value={bulkPoints} onChange={e => setBulkPoints(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="مثال: 50 أو -20" required data-testid="bulk-points-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">السبب</label>
                <input type="text" value={bulkReason} onChange={e => setBulkReason(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="سبب إضافة/خصم النقاط" required data-testid="bulk-reason" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-lime-500 hover:bg-lime-600 text-black py-3 rounded-lg font-bold disabled:opacity-50 border-2 border-black" data-testid="submit-bulk-points">تطبيق</button>
                <button type="button" onClick={() => setShowBulkPoints(false)} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Footer */}
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-sm text-gray-400">Made with ❤️ by Aboughaith</p>
      </div>
    </div>
  );
}

export default Dashboard;
