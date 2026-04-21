import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function BooksStudent({ studentId, studentName }) {
  const [books, setBooks] = useState([]);
  const [mySummaries, setMySummaries] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [summaryText, setSummaryText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [readingBook, setReadingBook] = useState(null);
  const [bookFileData, setBookFileData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [booksRes, summariesRes] = await Promise.all([
        axios.get(`${API}/books`),
        axios.get(`${API}/books/summaries/by-student/${studentId}`)
      ]);
      setBooks(booksRes.data);
      setMySummaries(summariesRes.data);
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 4000); return () => clearTimeout(t); } }, [message]);

  const openBook = async (book) => {
    try {
      const res = await axios.get(`${API}/books/${book.id}`);
      if (res.data.file_url) {
        setBookFileData(res.data.file_url);
        setReadingBook(book);
      } else {
        setMessage("لم يتم رفع ملف لهذا الكتاب بعد 📭");
      }
    } catch (err) {
      setMessage("خطأ في فتح الكتاب");
    }
  };

  const submitSummary = async (e) => {
    e.preventDefault();
    if (!selectedBook || !summaryText.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/books/${selectedBook.id}/summary`, {
        student_id: studentId,
        student_name: studentName,
        summary_text: summaryText.trim()
      });
      setMessage("تم إرسال الملخص بنجاح ✅ بانتظار مراجعة المشرف");
      setSummaryText("");
      setSelectedBook(null);
      await fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "خطأ في إرسال الملخص");
    } finally {
      setSubmitting(false);
    }
  };

  const getSummaryForBook = (bookId) => {
    return mySummaries.find(s => s.book_id === bookId);
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl text-center font-bold border-2 border-amber-100 animate-fadeIn">
          {message}
        </div>
      )}

      {books.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-lg font-bold text-gray-400">لا توجد كتب متاحة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {books.map(book => {
            const existingSummary = getSummaryForBook(book.id);
            
            return (
              <div key={book.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 border-2 border-gray-50 group hover:border-[#006d44]/20 transition-all">
                {/* Cover + Info */}
                <div className="flex gap-0">
                  <div className="w-32 h-44 bg-gradient-to-br from-amber-100 to-orange-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {book.cover_image ? (
                      <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">📖</span>
                    )}
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-800 mb-2">{book.title}</h3>
                      {book.description && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{book.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <span className="bg-[#006d44]/10 text-[#006d44] px-3 py-1 rounded-full text-xs font-black">
                        💎 +{book.points_for_summary} نقطة
                      </span>
                      {existingSummary && (
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                          existingSummary.status === "approved" ? "bg-green-100 text-green-700" :
                          existingSummary.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {existingSummary.status === "approved" ? "✅ معتمد" :
                           existingSummary.status === "rejected" ? "❌ مرفوض" :
                           "⏳ قيد المراجعة"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => openBook(book)}
                    className="flex-1 bg-[#006d44] text-white py-3 rounded-2xl font-black text-sm hover:bg-[#014029] transition-all shadow-lg"
                  >
                    📖 قراءة الكتاب
                  </button>
                  {!existingSummary ? (
                    <button
                      onClick={() => { setSelectedBook(book); setSummaryText(""); }}
                      className="flex-1 bg-amber-500 text-white py-3 rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-lg"
                    >
                      ✍️ كتابة ملخص
                    </button>
                  ) : (
                    <div className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-2xl font-black text-sm text-center cursor-default">
                      تم إرسال الملخص
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reading Modal */}
      {readingBook && bookFileData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-black text-gray-800">📖 {readingBook.title}</h3>
              <button onClick={() => { setReadingBook(null); setBookFileData(null); }} className="bg-gray-200 hover:bg-gray-300 text-gray-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl transition-all">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={bookFileData}
                title={readingBook.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Write Summary Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBook(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">✍️</div>
              <div>
                <h3 className="text-xl font-black text-gray-800">كتابة ملخص</h3>
                <p className="text-sm text-gray-500">{selectedBook.title}</p>
              </div>
            </div>

            <form onSubmit={submitSummary} className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-600 mb-2">ملخص الكتاب *</label>
                <textarea
                  value={summaryText}
                  onChange={e => setSummaryText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#006d44] resize-none"
                  placeholder="اكتب ملخصك للكتاب هنا... ماذا تعلمت؟ ما أهم النقاط؟"
                  rows="8"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 font-bold">💎 ستحصل على {selectedBook.points_for_summary} نقطة عند اعتماد الملخص من المشرف</p>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !summaryText.trim()}
                  className="flex-1 bg-[#006d44] text-white py-3 rounded-xl font-black disabled:opacity-50 transition-all hover:bg-[#014029]"
                >
                  {submitting ? "جاري الإرسال..." : "إرسال الملخص 📤"}
                </button>
                <button type="button" onClick={() => setSelectedBook(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 py-3 rounded-xl font-black transition-all">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BooksStudent;
