import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function AttendanceStudent({ studentId }) {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await axios.get(`${API}/attendance/student/${studentId}`);
                setAttendance(res.data);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [studentId]);

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;

    if (attendance.length === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 text-center text-gray-400 font-bold">
                لا يوجد سجل حضور حالياً
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {attendance.map((record, index) => (
                <div key={index} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                            record.status === "early" ? "bg-emerald-100 text-emerald-600" :
                            record.status === "late" ? "bg-orange-100 text-orange-600" :
                            "bg-rose-100 text-rose-600"
                        }`}>
                            {record.status === "early" ? "✅" : record.status === "late" ? "🕒" : "❌"}
                        </div>
                        <div>
                            <p className="font-black text-gray-800">
                                {record.status === "early" ? "حضور مبكر" :
                                 record.status === "late" ? "حضور متأخر" : "غياب"}
                            </p>
                            <p className="text-xs text-gray-400 font-bold">{record.date}</p>
                        </div>
                    </div>
                    <div className={`text-xl font-black italic ${record.points >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {record.points > 0 ? `+${record.points}` : record.points}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default AttendanceStudent;
