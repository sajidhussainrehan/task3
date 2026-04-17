import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function ChallengesStudent({ studentId, studentName }) {
    const [challenges, setChallenges] = useState([]);
    const [attemptedIds, setAttemptedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tempSelected, setTempSelected] = useState({}); // { challengeId: answerIndex }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [challengesRes, pointLogsRes] = await Promise.all([
                    axios.get(`${API}/challenges`),
                    axios.get(`${API}/points-log/${studentId}`)
                ]);
                
                setChallenges(challengesRes.data || []);
                
                // Extract attempted challenge IDs from points log
                const attempted = new Set();
                (pointLogsRes.data || []).forEach(log => {
                    if (log.reason && log.reason.includes("CHALLENGE_ATTEMPT:")) {
                        const parts = log.reason.split(":");
                        if (parts.length > 1) {
                            const cid = parts[1].split(" ")[0].split("|")[0].trim();
                            attempted.add(cid);
                        }
                    }
                });
                setAttemptedIds(attempted);
            } catch (err) {
                console.error("Error fetching student challenges:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const handleConfirm = async (challengeId) => {
        const answerIndex = tempSelected[challengeId];
        if (answerIndex === undefined || submitting || attemptedIds.has(challengeId)) return;
        
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/challenges/${challengeId}/answer/${studentId}`, {
                answer: answerIndex,
                student_name: studentName
            });
            
            if (res.data.is_correct) {
                alert(`إجابة صحيحة! 🎉 ${res.data.message || ""}`);
            } else {
                alert(res.data.message || "إجابة خاطئة، حاول في المرة القادمة!");
            }
            
            // Lock and hide immediately
            setAttemptedIds(prev => new Set(prev).add(challengeId));
            const newTemp = { ...tempSelected };
            delete newTemp[challengeId];
            setTempSelected(newTemp);

        } catch (err) {
            console.error("Error submitting answer:", err);
            alert(err.response?.data?.detail || "حدث خطأ أثناء إرسال الإجابة");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;
    
    const now = new Date();
    // Filter out: inactive, upcoming, and ALREADY ATTEMPTED
    const visibleChallenges = challenges.filter(c => {
        const isActive = c.active === true || c.is_active === true;
        if (!isActive) return false;
        if (attemptedIds.has(c.id)) return false; // Lock: don't show once answered
        return true;
    });

    if (visibleChallenges.length === 0) {
        return (
            <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center animate-fadeIn">
                <div className="text-4xl mb-4 opacity-30">🎯</div>
                <p className="text-gray-400 font-bold">لقد أتممت جميع المسابقات المتاحة حالياً</p>
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-2">عُد لاحقاً لمسابقات جديدة</p>
            </div>
        );
    }

    const formatDateTime = (dt) => {
        if (!dt) return null;
        const d = new Date(dt);
        return d.toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="space-y-6" id="challenges">
            {visibleChallenges.map(challenge => {
                const start = challenge.start_time ? new Date(challenge.start_time) : null;
                const end = challenge.end_time ? new Date(challenge.end_time) : null;
                const isUpcoming = start && start > now;
                const isEndingSoon = end && (end - now) < (1000 * 60 * 60 * 24); 

                return (
                    <div key={challenge.id} className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200 border-2 border-transparent hover:border-lime-500/20 transition-all group relative overflow-hidden mb-8 animate-fadeIn">
                        {/* Status Accents */}
                        <div className={`absolute top-0 left-0 w-full h-2 ${isUpcoming ? "bg-blue-500" : isEndingSoon ? "bg-rose-500" : "bg-[#006d44]"}`}></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`px-5 py-2 rounded-full border-2 font-black text-[10px] uppercase tracking-widest ${
                                        isUpcoming 
                                            ? "bg-blue-50 text-blue-600 border-blue-100" 
                                            : isEndingSoon 
                                                ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" 
                                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    }`}>
                                        {isUpcoming ? "قريباً جداً" : isEndingSoon ? "فرصة أخيرة" : "منافسة جارية"}
                                    </div>
                                    {end && !isUpcoming && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <span className="text-xs">⌛</span>
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">ينتهي: {formatDateTime(end)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right leading-none">
                                    <span className={`text-4xl font-black italic ${isUpcoming ? "text-gray-300" : "text-emerald-500"}`}>+{challenge.points}</span>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">نقطة</p>
                                </div>
                            </div>
                            
                            <h4 className="text-2xl font-black text-gray-800 mb-8 leading-tight">{challenge.question}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(challenge.options || []).map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setTempSelected(prev => ({ ...prev, [challenge.id]: idx }))}
                                        disabled={submitting || isUpcoming}
                                        className={`w-full p-6 rounded-2xl font-black text-base transition-all text-right flex items-center justify-between group/btn border-2 ${
                                            tempSelected[challenge.id] === idx
                                                ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-[1.02]"
                                                : "bg-gray-50 text-gray-700 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50"
                                        }`}
                                    >
                                        <span>{option}</span>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                            tempSelected[challenge.id] === idx ? "border-white/40 bg-white/20" : "border-gray-200"
                                        }`}>
                                            {tempSelected[challenge.id] === idx && <div className="w-3 h-3 rounded-full bg-white animate-scaleIn"></div>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Confirm Action */}
                            {tempSelected[challenge.id] !== undefined && !isUpcoming && (
                                <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100 flex justify-center">
                                    <button 
                                        onClick={() => handleConfirm(challenge.id)}
                                        disabled={submitting}
                                        className="bg-[#006d44] hover:bg-[#005a38] text-white px-12 py-4 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 animate-slideUp"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>جاري التحقق...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>تأكيد الإجابة النهائية 🎯</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {start && isUpcoming && (
                                <div className="mt-8 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex items-center justify-center gap-4">
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 leading-none">Coming Soon</p>
                                        <p className="text-sm font-black text-blue-600">المسابقة ستبدأ في {formatDateTime(start)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ChallengesStudent;
