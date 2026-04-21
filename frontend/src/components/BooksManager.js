import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function BooksManager() {
  const [books, setBooks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsForSummary, setPointsForSummary] = useState(20);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [showSummaries, setShowSummaries] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${API}/books`);
      setBooks(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBooks(); }, []);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  const addBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/books`, { title, description, points_for_summary: pointsForSummary });
      setShowAdd(false);
      setTitle(""); setDescription(""); setPointsForSummary(20);
      setMessage("تمت إضافة الكتاب بنجاح ✅");
      await fetchBooks();
    } catch (err) {
      setMessage("خطأ في إضافة الكتاب");
    } finally { setLoading(false); }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return;
    try {
      await axios.delete(`${API}/books/${bookId}`);
      setMessage("تم حذف الكتاب");
      await fetchBooks();
    } catch (err) { console.error(err); }
  };

  const uploadFile = async (bookId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/books/${bookId}/upload-file`, formData);
      setMessage("تم رفع ملف الكتاب بنجاح ✅");
      await fetchBooks();
    } catch (err) {
      setMessage("خطأ في رفع الملف");
    }
  };

  const uploadCover = async (bookId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/books/${bookId}/upload-cover`, formData);
      setMessage("تم رفع صورة الغلاف بنجاح ✅");
      await fetchBooks();
    } catch (err) {
      setMessage("خطأ في رفع الصورة");
    }
  };

  const viewSummaries = async (book) => {
    setSelectedBook(book);
    try {
      const res = await axios.get(`${API}/books/${book.id}/summaries`);
      setSummaries(res.data);
      setShowSummaries(true);
    } catch (err) { console.error(err); }
  };

  const reviewSummary = async (summaryId, status, points) => {
    try {
      await axios.put(`${API}/books/summaries/${summaryId}/review`, { status, points });
      setMessage(status === "approved" ? "تم اعتماد الملخص ✅" : "تم رفض الملخص ❌");
      if (selectedBook) viewSummaries(selectedBook);
    } catch (err) {
      setMessage("خطأ في المراجعة");
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {message && <div className="bg-lime-100 text-green-700 p-3 rounded-lg text-center font-semibold border border-lime-300">{message}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">📚 إدارة المكتبة</h2>
        <button onClick={() => setShowAdd(true)} className="bg-lime-500 hover:bg-lime-600 text-black px-4 py-2 rounded-lg text-sm font-bold border-2 border-black">
          ➕ إضافة كتاب
        </button>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map(book => (
          <div key={book.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 group hover:shadow-xl transition-all">
            {/* Cover */}
            <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center relative overflow-hidden">
              {book.cover_image ? (
                <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">📖</span>
              )}
              <label className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-gray-600 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-white transition-all">
                📷 غلاف
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadCover(book.id, e.target.files[0])} />
              </label>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-bold text-gray-800 text-lg">{book.title}</h3>
              {book.description && <p className="text-sm text-gray-500 line-clamp-2">{book.description}</p>}
              
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-lime-100 text-green-700 px-2 py-1 rounded-full font-bold border border-green-200">💎 {book.points_for_summary} نقطة للملخص</span>
                {book.file_url !== undefined && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">📄 ملف مرفق</span>}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <label className="flex-1 text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-xs font-bold cursor-pointer transition-all">
                  📤 رفع كتاب (PDF)
                  <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => e.target.files[0] && uploadFile(book.id, e.target.files[0])} />
                </label>
                <button onClick={() => viewSummaries(book)} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-bold transition-all">
                  📝 الملخصات
                </button>
                <button onClick={() => deleteBook(book.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {books.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-lg font-bold">لا توجد كتب بعد. أضف أول كتاب!</p>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">📚 إضافة كتاب جديد</h3>
            <form onSubmit={addBook} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">عنوان الكتاب *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="اسم الكتاب" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">وصف الكتاب</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" placeholder="وصف مختصر عن الكتاب" rows="3" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">نقاط الملخص</label>
                <input type="number" min="1" value={pointsForSummary} onChange={e => setPointsForSummary(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-lime-500" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-lime-500 hover:bg-lime-600 text-black py-3 rounded-lg font-bold disabled:opacity-50 border-2 border-black">
                  {loading ? "جاري الحفظ..." : "إضافة الكتاب"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summaries Modal */}
      {showSummaries && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSummaries(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">📝 ملخصات: {selectedBook.title}</h3>
              <button onClick={() => setShowSummaries(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            {summaries.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <p className="font-bold">لا توجد ملخصات بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summaries.map(s => (
                  <div key={s.id} className={`border rounded-xl p-4 ${s.status === "approved" ? "border-green-300 bg-green-50" : s.status === "rejected" ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">👤 {s.student_name}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === "approved" ? "bg-green-500 text-white" : s.status === "rejected" ? "bg-red-500 text-white" : "bg-yellow-500 text-white"}`}>
                        {s.status === "approved" ? "✅ معتمد" : s.status === "rejected" ? "❌ مرفوض" : "⏳ بانتظار المراجعة"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap bg-white rounded-lg p-3 border">{s.summary_text}</p>
                    
                    {s.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => reviewSummary(s.id, "approved", selectedBook.points_for_summary)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                          ✅ اعتماد (+{selectedBook.points_for_summary} نقطة)
                        </button>
                        <button onClick={() => reviewSummary(s.id, "rejected", 0)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                          ❌ رفض
                        </button>
                      </div>
                    )}
                    {s.status === "approved" && s.points_awarded > 0 && (
                      <p className="text-xs text-green-600 font-bold mt-1">💎 تم منح {s.points_awarded} نقطة</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BooksManager;
