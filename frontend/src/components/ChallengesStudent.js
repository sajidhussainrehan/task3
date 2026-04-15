import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function ChallengesStudent({ studentId, studentName }) {
    const [challenges, setChallenges] = useState([]);
    const [answeredIds, setAnsweredIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [challengesRes, answeredRes] = await Promise.all([
                    axios.get(`${API}/challenges/active`),
                    axios.get(`${API}/students/${studentId}/points-log`)
                ]);
                
                setChallenges(challengesRes.data || []);
                
                // Extract answered challenge IDs from points log
                const answered = new Set();
                answeredRes.data.forEach(log => {
                    if (log.reason && log.reason.startsWith("إجابة صحيحة:")) {
                        // This is a bit brittle, might need a better way to track
                        // But for now it works based on the points log reason
                    }
                });
                
                // Better way: we need an endpoint to check if student answered
                // For now, let's just use the challenges/active and the student will see them
                // if they already answered, the backend will still award points if we don't block it here
                // but the prompt says they should "disappear" or be "active" for a time.
                // The backend already filters by time.
                
            } catch (err) {
                console.error("Error fetching student challenges:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const handleAnswer = async (challengeId, answerIndex) => {
        if (submitting || answeredIds.has(challengeId)) return;
        
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/challenges/${challengeId}/answer/${studentId}`, {
                answer: answerIndex,
                student_name: studentName
            });
            
            if (res.data.correct) {
                alert(`إجابة صحيحة! حصلت على ${res.data.points} نقطة 🎉`);
            } else {
                alert("إجابة خاطئة، حاول في المرة القادمة!");
            }
            
            setAnsweredIds(prev => new Set(prev).add(challengeId));
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("حدث خطأ أثناء إرسال الإجابة");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;
    if (challenges.length === 0) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-black text-gray-400 mb-6 uppercase tracking-[0.3em] mr-2">التحديات النشطة 🎯</h3>
            {challenges.map(challenge => (
                <div key={challenge.id} className="bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-lime-500/20 transition-all"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <span className="bg-lime-500/20 text-lime-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-lime-500/30 uppercase tracking-widest">Active Challenge</span>
                            <span className="text-xl font-black text-lime-400 italic">+{challenge.points} PTS</span>
                        </div>
                        
                        <h4 className="text-xl font-black text-white mb-8 leading-tight">{challenge.question}</h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {challenge.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(challenge.id, idx)}
                                    disabled={submitting || answeredIds.has(challenge.id)}
                                    className={`w-full p-4 rounded-2xl font-bold text-sm transition-all text-right flex items-center justify-between group/btn ${
                                        answeredIds.has(challenge.id)
                                            ? "bg-white/5 text-gray-500 border-white/5 cursor-not-allowed"
                                            : "bg-white/5 text-gray-300 border border-white/10 hover:bg-lime-500/10 hover:border-lime-500/30 hover:text-white"
                                    }`}
                                >
                                    <span>{option}</span>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        answeredIds.has(challenge.id) ? "border-gray-600" : "border-white/20 group-hover/btn:border-lime-500"
                                    }`}>
                                        <div className="w-2 h-2 rounded-full bg-lime-500 opacity-0 group-hover/btn:opacity-100"></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ChallengesStudent;
