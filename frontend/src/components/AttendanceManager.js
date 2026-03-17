import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function AttendanceManager({ onAttendanceChange }) {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [stats, setStats] = useState({ early: 0, late: 0, absent: 0, total: 0 });
  const [scannedStudent, setScannedStudent] = useState(null);
  const inputRef = useRef(null);

  // Fetch students list
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`);
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const res = await axios.get(`${API}/attendance/today`);
      if (res.data.session) {
        setSession(res.data.session);
        setRecords(res.data.records);
        setSessionStarted(true);
        setTimerActive(res.data.session.is_active);
        updateStats(res.data.records);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchTodayAttendance();
  }, []);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (session && session.started_at) {
      const startTime = new Date(session.started_at).getTime();
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = now - startTime;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const display = hours > 0 
          ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setTimerDisplay(display);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [session]);

  // Focus input when session is active
  useEffect(() => {
    if (sessionStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sessionStarted]);

  const updateStats = (attendanceRecords) => {
    const early = attendanceRecords.filter(r => r.status === "early").length;
    const late = attendanceRecords.filter(r => r.status === "late").length;
    const absent = attendanceRecords.filter(r => r.status === "absent").length;
    setStats({ early, late, absent, total: attendanceRecords.length });
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/start`);
      setSession(res.data);
      setSessionStarted(true);
      setTimerActive(true);
      setMessage("✅ تم بدء جلسة الحضور");
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setMessage("❌ خطأ في بدء الجلسة");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/${session.id}/stop`);
      setTimerActive(false);
      setSession({ ...session, is_active: false, ended_at: res.data.ended_at });
      setMessage("⏹️ تم إيقاف المؤقت - بداية فترة التأخير (-10 نقاط)");
    } catch (err) {
      setMessage("❌ خطأ في إيقاف المؤقت");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !session) return;

    // Find student by barcode (using student ID as barcode for simplicity)
    // In a real scenario, you might have a separate barcode field
    const student = students.find(s => 
      s.id.toLowerCase() === barcodeInput.toLowerCase() ||
      s.name.includes(barcodeInput)
    );

    if (!student) {
      setMessage("❌ الطالب غير موجود");
      setBarcodeInput("");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/${session.id}/scan`, {
        student_id: student.id,
        barcode: barcodeInput
      });

      if (res.data.already_scanned) {
        setMessage("⚠️ تم تسجيل حضور هذا الطالب مسبقاً");
      } else {
        const { student: scannedStu, status, points } = res.data;
        setScannedStudent({ ...scannedStu, status, points });
        setMessage(`${status === "early" ? "✅" : "⚠️"} ${scannedStu.name}: ${status === "early" ? "حضور مبكر" : "حضور متأخر"} (${points > 0 ? "+" : ""}${points} نقطة)`);
        
        // Update records
        const newRecord = {
          id: Date.now().toString(),
          student_id: scannedStu.id,
          student_name: scannedStu.name,
          status,
          points,
          scanned_at: new Date().toISOString()
        };
        const updatedRecords = [...records, newRecord];
        setRecords(updatedRecords);
        updateStats(updatedRecords);
        
        if (onAttendanceChange) onAttendanceChange();
      }
    } catch (err) {
      setMessage("❌ خطأ في مسح الباركود");
      console.error(err);
    } finally {
      setLoading(false);
      setBarcodeInput("");
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const finalizeAttendance = async () => {
    if (!session) return;
    if (!window.confirm("هل أنت متأكد من إنهاء الحضور؟ سيتم تسجيل الغائبين وخصم 30 نقطة من كل طالب غائب.")) return;
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/${session.id}/finalize`);
      setMessage(`✅ تم إنهاء الحضور: ${res.data.present_count} حاضر، ${res.data.absent_count} غائب`);
      
      // Refresh records
      const updatedRes = await axios.get(`${API}/attendance/today`);
      setRecords(updatedRes.data.records);
      updateStats(updatedRes.data.records);
      setSession({ ...session, is_finalized: true });
      
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setMessage("❌ خطأ في إنهاء الحضور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "early": return "bg-lime-100 text-green-700 border-green-300";
      case "late": return "bg-orange-100 text-orange-700 border-orange-300";
      case "absent": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "early": return "✅";
      case "late": return "⚠️";
      case "absent": return "❌";
      default: return "❓";
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-500 to-green-600 text-black p-4 rounded-xl border-2 border-black">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📱</span>
          <span>نظام تسجيل الحضور بالباركود</span>
        </h2>
        <p className="text-sm mt-1 opacity-80">مسح الباركود لتسجيل حضور الطلاب تلقائياً</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-center font-semibold ${
          message.includes("✅") ? "bg-lime-100 text-green-700 border border-green-300" :
          message.includes("⚠️") ? "bg-orange-100 text-orange-700 border border-orange-300" :
          message.includes("❌") ? "bg-red-100 text-red-700 border border-red-300" :
          "bg-blue-100 text-blue-700 border border-blue-300"
        }`}>
          {message}
        </div>
      )}

      {/* Scanned Student Animation */}
      {scannedStudent && (
        <div className={`p-4 rounded-xl text-center animate-fadeIn ${
          scannedStudent.status === "early" ? "bg-lime-100 border-2 border-green-400" : "bg-orange-100 border-2 border-orange-400"
        }`}>
          <div className="text-4xl mb-2">
            {scannedStudent.status === "early" ? "🌟" : "⏰"}
          </div>
          <h3 className="text-lg font-bold text-gray-800">{scannedStudent.name}</h3>
          <p className={`text-sm font-bold ${scannedStudent.points > 0 ? "text-green-600" : "text-red-600"}`}>
            {scannedStudent.status === "early" ? "حضور مبكر" : "حضور متأخر"}
            <br />
            {scannedStudent.points > 0 ? "+" : ""}{scannedStudent.points} نقطة
          </p>
        </div>
      )}

      {/* Session Controls */}
      {!sessionStarted ? (
        <button
          onClick={startSession}
          disabled={loading}
          className="w-full bg-lime-500 hover:bg-lime-600 text-black py-4 rounded-xl font-bold text-lg border-2 border-black transition-all"
        >
          {loading ? "جاري البدء..." : "▶️ بدء جلسة الحضور"}
        </button>
      ) : (
        <div className="space-y-4">
          {/* Timer Display */}
          <div className="bg-black text-lime-400 p-4 rounded-xl text-center border-2 border-lime-400">
            <p className="text-sm mb-1">⏱️ مؤقت الحضور</p>
            <p className="text-4xl font-mono font-bold">{timerDisplay}</p>
            <p className={`text-sm mt-2 ${timerActive ? "text-green-400" : "text-orange-400"}`}>
              {timerActive ? "✅ فترة الحضور المبكر (+20 نقطة)" : "⚠️ فترة التأخير (-10 نقاط)"}
            </p>
          </div>

          {/* Timer Controls */}
          {timerActive && (
            <button
              onClick={stopTimer}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-lg border-2 border-black transition-all"
            >
              ⏹️ إيقاف المؤقت (بدء فترة التأخير)
            </button>
          )}

          {/* Barcode Input */}
          {!session?.is_finalized && (
            <form onSubmit={handleBarcodeSubmit} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                🔍 مسح الباركود أو إدخال رقم الطالب:
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="امسح الباركود هنا..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-lime-500 text-lg"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !barcodeInput.trim()}
                  className="bg-lime-500 hover:bg-lime-600 text-black px-6 py-3 rounded-lg font-bold border-2 border-black disabled:opacity-50"
                >
                  📲 مسح
                </button>
              </div>
              <p className="text-xs text-gray-500">
                💡 يمكنك استخدام قارئ الباركود أو كتابة رقم الطالب يدوياً
              </p>
            </form>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-lime-100 p-3 rounded-xl text-center border border-green-300">
              <p className="text-2xl">✅</p>
              <p className="text-xl font-bold text-green-700">{stats.early}</p>
              <p className="text-xs text-green-600">مبكر (+20)</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl text-center border border-orange-300">
              <p className="text-2xl">⚠️</p>
              <p className="text-xl font-bold text-orange-700">{stats.late}</p>
              <p className="text-xs text-orange-600">متأخر (-10)</p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl text-center border border-red-300">
              <p className="text-2xl">❌</p>
              <p className="text-xl font-bold text-red-700">{stats.absent}</p>
              <p className="text-xs text-red-600">غائب (-30)</p>
            </div>
          </div>

          {/* Records List */}
          {records.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-700">📋 سجل الحضور ({records.length})</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {records.map((record, index) => (
                  <div
                    key={record.id || index}
                    className={`p-3 border-b border-gray-100 flex items-center justify-between ${
                      index === records.length - 1 ? "bg-lime-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(record.status)}</span>
                      <div>
                        <p className="font-semibold text-sm">{record.student_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.scanned_at).toLocaleTimeString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(record.status)}`}>
                        {record.points > 0 ? "+" : ""}{record.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finalize Button */}
          {!session?.is_finalized && (
            <button
              onClick={finalizeAttendance}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-lg border-2 border-black transition-all"
            >
              🔒 إنهاء الحضور وتسجيل الغائبين (-30 لكل غائب)
            </button>
          )}

          {session?.is_finalized && (
            <div className="bg-gray-100 p-4 rounded-xl text-center border-2 border-gray-400">
              <p className="text-lg font-bold text-gray-700">🔒 تم إنهاء الحضور لهذا اليوم</p>
            </div>
          )}
        </div>
      )}

      {/* Point Rules Info */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-2">📊 نظام نقاط الحضور:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ <strong>حضور مبكر (قبل إيقاف المؤقت):</strong> +20 نقطة</li>
          <li>⚠️ <strong>حضور متأخر (بعد إيقاف المؤقت):</strong> -10 نقاط</li>
          <li>❌ <strong>غياب (لم يتم المسح):</strong> -30 نقطة</li>
        </ul>
      </div>
    </div>
  );
}

export default AttendanceManager;
