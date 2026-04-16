import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function HalaqaStudent({ studentId }) {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const res = await axios.get(`${API}/halaqa-grades/${studentId}`);
                setGrades(res.data);
            } catch (err) {
                console.error("Error fetching halaqa grades:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, [studentId]);

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;

    if (grades.length === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 text-center text-gray-400 font-bold">
                لا يوجد سجل درجات للحلقة حالياً
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {grades.map((grade, index) => (
                <div key={index} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📖</span>
                            <span className="font-black text-gray-800 text-lg">درجات الحلقة</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400">
                            {grade.created_at ? new Date(grade.created_at).toLocaleDateString('ar-SA') : ""}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-purple-50 rounded-3xl">
                            <p className="text-[10px] font-black text-purple-400 mb-1">الحفظ</p>
                            <p className="text-2xl font-black text-purple-700">{grade.memorization}</p>
                        </div>
                        <div className="text-center p-4 bg-emerald-50 rounded-3xl">
                            <p className="text-[10px] font-black text-emerald-400 mb-1">المراجعة</p>
                            <p className="text-2xl font-black text-emerald-700">{grade.revision}</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-3xl">
                            <p className="text-[10px] font-black text-orange-400 mb-1">المتون</p>
                            <p className="text-2xl font-black text-orange-700">{grade.mutun}</p>
                        </div>
                    </div>

                    {grade.notes && (
                         <div className="mt-4 p-4 bg-gray-50 rounded-2xl border-r-4 border-purple-400">
                            <p className="text-[10px] font-black text-gray-400 mb-1">ملاحظات المعلم</p>
                            <p className="text-sm font-bold text-gray-700">{grade.notes}</p>
                         </div>
                    )}

                    <div className="pt-2 flex justify-end items-center gap-2">
                        <span className="text-xs font-black text-gray-400 uppercase">مجموع النقاط:</span>
                        <span className="text-2xl font-black italic text-[#006d44]">+{grade.total_points}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default HalaqaStudent;
