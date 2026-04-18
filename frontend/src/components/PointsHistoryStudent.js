import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function PointsHistoryStudent({ studentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API}/points-log/${studentId}`);
        setLogs(res.data || []);
      } catch (err) {
        console.error("Error fetching points log:", err);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchLogs();
  }, [studentId]);

  const formatReason = (reason) => {
    if (!reason) return "بدون سبب";
    
    // Translate challenge participation
    if (reason.startsWith("CHALLENGE_ATTEMPT:")) {
      return "مشاركة في مسابقة ثقافية 🏆";
    }
    
    // Clean up task prefixes if any
    if (reason.startsWith("مهمة: ")) {
      return reason;
    }

    return reason;
  };

  if (loading) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-0" id="history">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-2">سجل العمليات</h3>
            <p className="text-xl sm:text-2xl font-black text-gray-800">كشف الحساب 📄</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-sm border border-rose-100">📄</div>
      </div>

      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[300px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-3 sm:px-6 py-4 sm:py-5 text-xs font-black uppercase text-gray-400 tracking-wider border-b border-gray-100/50 text-right">السبب / العملية</th>
                <th className="px-3 sm:px-6 py-4 sm:py-5 text-xs font-black uppercase text-gray-400 tracking-wider border-b border-gray-100/50 text-center">النقاط</th>
                <th className="px-3 sm:px-6 py-4 sm:py-5 text-xs font-black uppercase text-gray-400 tracking-wider border-b border-gray-100/50 text-left">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-3 sm:px-6 py-4 sm:py-6">
                        <p className="text-sm sm:text-base font-black text-gray-800 group-hover:text-[#006d44] transition-colors leading-tight">
                          {formatReason(log.reason)}
                        </p>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tighter mt-0.5">سجل النظام</p>
                    </td>
                    <td className="px-3 sm:px-6 py-4 sm:py-6 text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-base sm:text-lg font-black italic ${log.points >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {log.points >= 0 ? `+${log.points}` : log.points}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase">نقطة</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 sm:py-6">
                      <div className="flex flex-col items-start sm:items-end">
                        <p className="text-[10px] sm:text-xs font-black text-gray-600 whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleDateString('ar-SA') : '-'}
                        </p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-bold italic">لا يوجد سجل عمليات لهذا الطالب</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary Mini Card */}
      {logs.length > 0 && (
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 text-white border border-white/5 flex items-center justify-between shadow-xl mx-2 sm:mx-0">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-lg sm:text-xl border border-emerald-500/30">📊</div>
                <div>
                    <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest">إجمالي الحركات</p>
                    <p className="text-sm sm:text-lg font-black italic">السجل محدث بالكامل</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xl sm:text-2xl font-black text-emerald-400 italic">نشط</p>
                <p className="text-[10px] font-black text-gray-600 uppercase">الحالة</p>
            </div>
        </div>
      )}
    </div>
  );
}

export default PointsHistoryStudent;
