import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Award, Users, CheckCircle2, TrendingUp, Sparkles, UserCheck, 
  Send, Lock, Bot, User, Loader2, Trash2
} from "lucide-react";

import API from "../../services/api";
import { addTokenUsage } from "../../utils/tokenTracker";

const DashboardOverview = ({ filesCount, candidateResults }) => {
  const { id } = useParams();
  const totalCV = filesCount || 0;

  // Filter Kandidat yang Sudah Murni Dianalisa AI (Ada fit_score > 0 atau status_seleksi)
  const analyzedCandidates = (candidateResults || []).filter(
    (c) =>
      (c.fit_score || c.score || 0) > 0 ||
      (c.status_seleksi && c.status_seleksi !== "Evaluated"),
  );

  const hasAnalyzed = analyzedCandidates.length > 0;

  // Hitung Kandidat Lolos
  const shortlistedCandidates = analyzedCandidates.filter(
    (c) =>
      (c.fit_score || c.score || 0) >= 70 ||
      c.status_seleksi?.includes("LOLOS"),
  );

  // Hitung Rata-Rata Skor
  const totalScores = analyzedCandidates.reduce(
    (sum, c) => sum + (c.fit_score || c.score || 0),
    0,
  );
  const avgScore = hasAnalyzed
    ? (totalScores / analyzedCandidates.length).toFixed(1)
    : "-";

  // Kandidat Terbaik #1
  const topCandidate = hasAnalyzed ? analyzedCandidates[0] : null;

  // ========================================================
  // 1. STATE CHATBOT AI DENGAN PENYIMPANAN OTOMATIS (PER SESI)
  // ========================================================
  const [chatMessages, setChatMessages] = useState(() => {
    // Membaca riwayat chat tersimpan dari LocalStorage khusus ID Sesi ini
    const savedChat = localStorage.getItem(`ai_chat_history_session_${id}`);
    return savedChat ? JSON.parse(savedChat) : [];
  });

  const [inputQuery, setInputQuery] = useState("");
  const [isChatThinking, setIsChatThinking] = useState(false);

  // SIMPAN PERCAKAPAN CHAT KE LOCALSTORAGE SETIAP TERJADI PERUBAHAN
  useEffect(() => {
    if (id) {
      localStorage.setItem(`ai_chat_history_session_${id}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, id]);

  // 2. HELPER BERSIHKAN RIWAYAT CHAT
  const handleClearChat = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat percakapan chat ini?")) {
      setChatMessages([]);
      localStorage.removeItem(`ai_chat_history_session_${id}`);
    }
  };

  // 3. HELPER PARSER BOLD TEKS MARKDOWN (**TEKS** -> BOLD REAL)
  const renderFormattedText = (text) => {
    if (!text) return null;

    const paragraphs = text.split("\n");

    return paragraphs.map((paragraph, pIdx) => {
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);

      return (
        <p key={pIdx} className={pIdx > 0 ? "mt-1.5" : ""}>
          {parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={idx} className="font-extrabold text-slate-900 bg-amber-100/70 px-1 rounded">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // 4. HANDLER CHAT REALTIME KE DJANGO BACKEND
  const handleSendMessage = async () => {
    if (!inputQuery.trim() || isChatThinking || !hasAnalyzed) return;

    const userText = inputQuery;
    const newMessages = [...chatMessages, { sender: "user", text: userText }];
    setChatMessages(newMessages);
    setInputQuery("");
    setIsChatThinking(true);

    const apiKey = localStorage.getItem('ai_screening_api_key');
    const selectedModel = localStorage.getItem('ai_screening_model') || 'qwen/qwen3.8-max';

    try {
      const response = await API.post(`/sessions/${id}/chat/`, {
        query: userText,
        api_key: apiKey,
        model: selectedModel
      });

      const aiReply = response.data.reply || "Maaf, AI tidak dapat merespons saat ini.";

      if (response.data.usage) {
        addTokenUsage(response.data.usage.prompt_tokens, response.data.usage.completion_tokens);
      }

      setChatMessages([...newMessages, { sender: "ai", text: aiReply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages([
        ...newMessages,
        { sender: "ai", text: "🔴 Gagal terhubung ke AI Chatbot Server. Periksa API Key Anda." },
      ]);
    } finally {
      setIsChatThinking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* 1. METRIC STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total CV Terunggah</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{totalCV} File</h3>
            <p className="text-xs text-slate-400 mt-1">File siap di-analisa</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kandidat Lolos Seleksi</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
              {hasAnalyzed ? `${shortlistedCandidates.length} Orang` : "-"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {hasAnalyzed ? "Rekomendasi Lolos AI" : "Belum di-analisa"}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Skor Kecocokan</p>
            <h3 className="text-3xl font-extrabold text-indigo-600 mt-1">
              {hasAnalyzed ? `${avgScore}%` : "-"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {hasAnalyzed ? "Kalkulasi kriteria AI" : "Belum di-analisa"}
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <TrendingUp size={26} />
          </div>
        </div>
      </div>

      {/* 2. HIGHLIGHT KANDIDAT TERBAIK (#1 RANK) */}
      {hasAnalyzed && topCandidate ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden border border-amber-500/30">
          <div className="flex items-center gap-2 mb-3 text-amber-400">
            <Award size={24} />
            <h3 className="font-extrabold text-lg tracking-wide">Kandidat Rekomendasi Utama (#1 Rank)</h3>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h4 className="text-2xl font-black text-white">{topCandidate.nama || topCandidate.name}</h4>
                <span className="bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full uppercase">
                  {topCandidate.status_seleksi || "LOLOS (Rekomendasi Utama)"}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">
                {topCandidate.catatan_utama || topCandidate.summary || "Kandidat memiliki kualifikasi paling unggul berdasarkan evaluasi AI."}
              </p>
            </div>

            <div className="text-right bg-slate-900/60 p-4 rounded-xl border border-slate-700 min-w-[140px]">
              <p className="text-3xl font-black text-amber-400">{topCandidate.fit_score || topCandidate.score || 0}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Tingkat Kesesuaian</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {totalCV > 0 ? `${totalCV} File CV Siap Di-analisa` : "Belum Ada File CV"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mt-1">
              {totalCV > 0
                ? "File CV pelamar telah terunggah di laptop Anda. Silakan masuk ke tab 'Hasil Analisa AI' untuk menjalankan perankingan."
                : "Silakan unggah file PDF CV pelamar terlebih dahulu di tab Manajemen CV."}
            </p>
          </div>
        </div>
      )}

      {/* 3. CHATBOT AI CANDIDATE Q&A (DENGAN PENYIMPANAN CHAT & TOMBOL BERSIHKAN) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        
        {/* OVERLAY LOCK JIKA BELUM DIANALISA */}
        {!hasAnalyzed && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[3px] p-6 text-center text-white">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-3 border border-amber-500/40 shadow-lg">
              <Lock size={24} />
            </div>
            <h4 className="font-extrabold text-base text-white">Fitur AI Chat Candidate Terkunci 🔒</h4>
            <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
              Jalankan <b>"Analisa AI 3 Tabel Matriks"</b> terlebih dahulu untuk membuka fitur tanya-jawab kandidat ini.
            </p>
          </div>
        )}

        {/* HEADER CHAT (DENGAN TOMBOL BERSIHKAN CHAT) */}
        <div className={`p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 ${!hasAnalyzed ? 'opacity-40' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">AI Candidate Chat</h3>
              <p className="text-[11px] text-slate-400">Tanya jawab interaktif seputar kandidat pelamar</p>
            </div>
          </div>

          {/* TOMBOL BERSIHKAN CHAT */}
          {hasAnalyzed && chatMessages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hapus Seluruh Riwayat Chat"
            >
              <Trash2 size={13} />
              <span>Bersihkan Chat</span>
            </button>
          )}
        </div>

        {/* BODY MESSAGES */}
        <div className={`p-4 space-y-3 min-h-[140px] max-h-[350px] overflow-y-auto bg-slate-50/50 ${!hasAnalyzed ? 'opacity-40 filter blur-[1px]' : ''}`}>
          {chatMessages.length === 0 && !isChatThinking && (
            <p className="text-center text-slate-400 text-xs py-8">
              Ketik pertanyaan seputar kandidat di bawah (misal: "Mengapa Bayu dipilih sebagai Rekomendasi Utama?").
            </p>
          )}

          {chatMessages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                msg.sender === "user" ? "bg-blue-600 text-white" : "bg-slate-900 text-amber-400"
              }`}>
                {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className={`p-3.5 rounded-xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
              }`}>
                {renderFormattedText(msg.text)}
              </div>
            </div>
          ))}

          {isChatThinking && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
                <Bot size={14} />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                <span>AI sedang menganalisa data kandidat...</span>
              </div>
            </div>
          )}
        </div>

        {/* FORM INPUT CHAT */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className={`p-3 bg-white border-t border-slate-200 flex items-center gap-2 ${!hasAnalyzed ? 'opacity-40' : ''}`}
        >
          <input
            type="text"
            disabled={!hasAnalyzed || isChatThinking}
            placeholder={hasAnalyzed ? "Ketik pertanyaan seputar kandidat di sini..." : "Jalankan Analisa AI terlebih dahulu untuk mengetik..."}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!hasAnalyzed || isChatThinking || !inputQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
            title="Kirim Pertanyaan"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* 4. LEADERBOARD RANKING SELURUH KANDIDAT */}
      {hasAnalyzed && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm flex justify-between items-center">
            <span className="flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" />
              Peringkat Seluruh Pelamar ({analyzedCandidates.length} Orang)
            </span>
            <span className="text-xs font-normal text-slate-500">Terurut dari skor tertinggi</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analyzedCandidates.map((candidate, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs ${
                    idx === 0 ? "bg-amber-400 text-slate-900 font-black" :
                    idx === 1 ? "bg-slate-200 text-slate-800" :
                    idx === 2 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    #{idx + 1}
                  </span>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{candidate.nama || candidate.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                      {candidate.catatan_utama || candidate.summary || "Evaluasi AI selesai"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 min-w-[220px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500 text-[10px]">Kesesuaian:</span>
                      <span className="text-blue-600 font-extrabold">{candidate.fit_score || candidate.score || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          (candidate.fit_score || candidate.score || 0) >= 80 ? "bg-emerald-500" :
                          (candidate.fit_score || candidate.score || 0) >= 60 ? "bg-blue-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${candidate.fit_score || candidate.score || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase whitespace-nowrap ${
                    (candidate.status_seleksi || candidate.status)?.includes("Utama") ? "bg-emerald-100 text-emerald-800" :
                    (candidate.status_seleksi || candidate.status)?.includes("LOLOS") ? "bg-blue-100 text-blue-800" :
                    (candidate.status_seleksi || candidate.status)?.includes("Cadangan") ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    {candidate.status_seleksi || candidate.status || "Evaluated"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;