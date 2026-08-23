import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Trash2,
  Scale,
  Star,
  Loader2,
  AlertCircle,
  Award,
  RefreshCw,
  Upload,
} from "lucide-react";

import API from "../../services/api";

const AIAnalysis = ({ isAnalyzing }) => {
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocalAnalyzing, setIsLocalAnalyzing] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  const [tablesData, setTablesData] = useState(null);
  const [filesCount, setFilesCount] = useState(0);
  const [analysisError, setAnalysisError] = useState(null);

  // STATE KRITERIA
  const [criteria, setCriteria] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("kualifikasi");
  const [newWeight, setNewWeight] = useState(8);

  // 1. Fetch Kriteria, Jumlah File, & Hasil 3 Tabel
  const fetchPageData = async () => {
    try {
      setLoadingCriteria(true);
      setAnalysisError(null);

      const resCriteria = await API.get(`/sessions/${id}/criteria/`);
      setCriteria(resCriteria.data.criteria || []);

      const resSession = await API.get(`/sessions/${id}/`);
      const fileList = resSession.data.files || [];
      setFilesCount(fileList.length);

      if (resSession.data.tables) {
        setTablesData(resSession.data.tables);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setAnalysisError("Gagal terhubung ke server Django.");
    } finally {
      setLoadingCriteria(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [id]);

  // 2. Upload PDF Lowongan -> Ekstrak Kualifikasi Otomatis
  const handleUploadJobDescPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("File lowongan harus berformat PDF!");
      return;
    }

    const apiKey = localStorage.getItem("ai_screening_api_key");
    const selectedModel =
      localStorage.getItem("ai_screening_model") || "qwen/qwen3.8-max";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("model", selectedModel);

    try {
      setIsExtractingPdf(true);
      setAnalysisError(null);
      const response = await API.post(
        `/sessions/${id}/criteria/upload/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setCriteria(response.data.criteria || []);
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        "Gagal mengekstrak kualifikasi dari PDF Lowongan.";
      setAnalysisError(`❌ Gagal Ekstrak Lowongan: ${msg}`);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // 3. Simpan Kriteria ke Backend
  const saveCriteriaToBackend = async (updatedCriteria) => {
    try {
      setIsSaving(true);
      await API.post(`/sessions/${id}/criteria/`, {
        criteria: updatedCriteria,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Trigger AI 3 Tabel
  const handleTriggerAI = async () => {
    if (filesCount === 0) {
      setAnalysisError(
        "❌ AI Tidak Bisa Jalan: Belum ada file CV PDF yang diunggah. Silakan unggah CV terlebih dahulu di tab 'Manajemen CV'.",
      );
      return;
    }

    if (criteria.length === 0) {
      setAnalysisError(
        "❌ AI Tidak Bisa Jalan: Belum ada kualifikasi yang dimasukkan. Silakan unggah PDF Lowongan Kerja atau ketik kriteria manual di bawah.",
      );
      return;
    }

    const apiKey = localStorage.getItem("ai_screening_api_key");
    const selectedModel =
      localStorage.getItem("ai_screening_model") || "qwen/qwen3.8-max";

    try {
      setAnalysisError(null);
      setIsLocalAnalyzing(true);

      const response = await API.post(`/sessions/${id}/analyze/`, {
        api_key: apiKey,
        model: selectedModel,
      });

      if (response.data.tables) {
        setTablesData(response.data.tables);
      } else {
        setAnalysisError(
          "⚠️ AI merespons tetapi gagal menghasilkan format 3 Tabel. Coba periksa API Key Anda.",
        );
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Gagal menjalankan analisa AI.";
      setAnalysisError(
        `❌ AI Gagal Bekerja: ${errorMsg}. Periksa API Key di tab 'Token & Pengaturan' atau koneksi internet Anda.`,
      );
    } finally {
      setIsLocalAnalyzing(false);
    }
  };

  const getPriorityBadge = (score) => {
    if (score >= 9)
      return {
        label: "Sangat Wajib",
        bg: "bg-red-50 text-red-700 border-red-200",
      };
    if (score >= 7)
      return {
        label: "Penting",
        bg: "bg-blue-50 text-blue-700 border-blue-200",
      };
    if (score >= 5)
      return {
        label: "Sedang",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
      };
    return {
      label: "Opsional",
      bg: "bg-slate-100 text-slate-600 border-slate-200",
    };
  };

  const handleAddCriteria = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newItem = {
      id: Date.now(),
      type: newType,
      title: newTitle,
      weight: parseInt(newWeight),
    };
    const updated = [...criteria, newItem];
    setCriteria(updated);
    setNewTitle("");
    setNewWeight(8);
    await saveCriteriaToBackend(updated);
  };

  const handleDeleteCriteria = async (criteriaId) => {
    const updated = criteria.filter((item) => item.id !== criteriaId);
    setCriteria(updated);
    await saveCriteriaToBackend(updated);
  };

  const handleClearAllCriteria = async () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus seluruh kriteria di sesi ini?",
      )
    ) {
      setCriteria([]);
      await saveCriteriaToBackend([]);
    }
  };

  const handleWeightChange = (criteriaId, weight) => {
    const updated = criteria.map((item) =>
      item.id === criteriaId ? { ...item, weight: parseInt(weight) } : item,
    );
    setCriteria(updated);
  };

  const handleBlurSave = async () => {
    await saveCriteriaToBackend(criteria);
  };

  const getSymbolBadge = (simbol) => {
    if (simbol === "✔️")
      return (
        <span className="text-emerald-600 font-extrabold text-base">✔️</span>
      );
    if (simbol === "⚠️")
      return (
        <span className="text-amber-500 font-extrabold text-base">⚠️</span>
      );
    return <span className="text-red-500 font-extrabold text-base">❌</span>;
  };

  const candidateNames =
    tablesData?.tabel_kualifikasi?.[0]?.evaluasi?.map((e) => e.nama) || [];
  const isLoading = isAnalyzing || isLocalAnalyzing;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* STATUS BADGE AI REALTIME */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              filesCount === 0
                ? "bg-amber-500/20 text-amber-400"
                : criteria.length === 0
                  ? "bg-amber-500/20 text-amber-400"
                  : tablesData
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400"
            }`}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Status AI Engine</h4>
            <p className="text-xs text-slate-400">
              {filesCount === 0
                ? "⚠️ Belum ada file CV diunggah"
                : criteria.length === 0
                  ? "⚠️ Belum ada kriteria dimasukkan"
                  : tablesData
                    ? "🟢 AI Terhubung & 3 Tabel Matriks Berhasil Dibuat"
                    : "🔵 Terdeteksi " +
                      filesCount +
                      " CV & " +
                      criteria.length +
                      " Kriteria (Siap Dianalisa AI)"}
            </p>
          </div>
        </div>

        <button
          onClick={fetchPageData}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* DISPLAY PESAN ERROR */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-sm text-red-900">
              Peringatan Analisa AI
            </h5>
            <p className="leading-relaxed">{analysisError}</p>
          </div>
        </div>
      )}

      {/* INDIKATOR LOADING EKSTRAKSI PDF LOWONGAN KERJA */}
      {isExtractingPdf && (
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg flex items-center gap-4 animate-pulse">
          <Loader2 size={32} className="animate-spin text-amber-300" />
          <div>
            <h4 className="font-bold text-base">
              PyMuPDF4LLM & AI Sedang Membaca PDF Lowongan...
            </h4>
            <p className="text-xs text-indigo-100 mt-1">
              AI sedang mengonversi PDF Lowongan ke .MD dan mengekstrak seluruh
              Kualifikasi & Tanggung Jawab secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* INDIKATOR LOADING AI 3 TABEL */}
      {isLoading && (
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg flex items-center gap-4 animate-pulse">
          <Loader2 size={32} className="animate-spin text-amber-300" />
          <div>
            <h4 className="font-bold text-base">
              AI Qwen Sedang Menganalisa Seluruh CV...
            </h4>
            <p className="text-xs text-blue-100 mt-1">
              AI sedang membaca {filesCount} file CV pelamar dan mencocokkannya
              dengan {criteria.length} kriteria. Mohon tunggu 10 - 30 detik.
            </p>
          </div>
        </div>
      )}

      {/* BOX UPLOAD PDF LOWONGAN KERJA */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase bg-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Fitur Cerdas
            </span>
            <h3 className="font-bold text-base text-white mt-1">
              Unggah PDF Lowongan Kerja / Job Description
            </h3>
            <p className="text-xs text-slate-300">
              Unggah file PDF lowongan kerja untuk mengekstrak kualifikasi &
              tanggung jawab otomatis tanpa mengisinya manual.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isExtractingPdf}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Upload size={16} />
            <span>
              {isExtractingPdf ? "Mengekstrak..." : "Unggah PDF Lowongan"}
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadJobDescPdf}
            accept=".pdf"
            className="hidden"
          />
        </div>
      </div>

      {/* SECTION 1: MANAJEMEN KRITERIA & SKALA PRIORITAS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Scale size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Tingkat Kepentingan Kriteria (Skala 1 - 10)
              </h3>
              <p className="text-xs text-slate-500">
                Atur kriteria penilaian lowongan pekerjaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-xs text-blue-600 font-semibold animate-pulse">
                Menyimpan...
              </span>
            )}

            {criteria.length > 0 && (
              <button
                onClick={handleClearAllCriteria}
                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5"
                title="Hapus semua kriteria"
              >
                <Trash2 size={14} />
                <span>Kosongkan Semua</span>
              </button>
            )}

            <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              <span>Total: {criteria.length} Kriteria</span>
            </div>
          </div>
        </div>

        {/* LIST DAFTAR KRITERIA */}
        {loadingCriteria ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Membaca kriteria dari
            backend...
          </div>
        ) : criteria.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
            <Scale size={32} className="mx-auto text-slate-400 mb-1" />
            <p className="font-bold text-slate-800 text-sm">
              Belum Ada Kualifikasi / Tanggung Jawab
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Unggah PDF Lowongan Kerja di kotak atas, atau ketik kualifikasi
              manual pada form di bawah.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {criteria.map((item) => {
              const priority = getPriorityBadge(item.weight);
              return (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${
                        item.type === "kualifikasi"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {item.type === "kualifikasi"
                        ? "Kualifikasi"
                        : "Tanggung Jawab"}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 min-w-[280px]">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${priority.bg}`}
                        >
                          {priority.label}
                        </span>
                        <span className="text-blue-600 font-extrabold text-sm">
                          {item.weight} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={item.weight}
                        onChange={(e) =>
                          handleWeightChange(item.id, e.target.value)
                        }
                        onMouseUp={handleBlurSave}
                        onTouchEnd={handleBlurSave}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteCriteria(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FORM TAMBAH KRITERIA */}
        <form
          onSubmit={handleAddCriteria}
          className="pt-2 border-t border-slate-100 flex flex-col md:flex-row gap-3"
        >
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-semibold"
          >
            <option value="kualifikasi">Kualifikasi</option>
            <option value="tanggung_jawab">Tanggung Jawab</option>
          </select>
          <input
            type="text"
            required
            placeholder="Ketik kualifikasi / tanggung jawab baru di sini..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-bold text-blue-600"
          >
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 10
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Tambah Manual</span>
          </button>
        </form>
      </div>

      {/* BANNER TRIGGER AI */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-amber-300" />
            <h3 className="font-bold text-lg">
              Jalankan Analisa AI 3 Tabel Matriks
            </h3>
          </div>
          <p className="text-xs text-blue-100">
            Bandingkan seluruh pelamar sekaligus dalam 3 Tabel Komparatif.
          </p>
        </div>

        <button
          onClick={handleTriggerAI}
          disabled={isLoading}
          className="bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm px-6 py-3 rounded-xl shadow-md flex items-center gap-2.5 whitespace-nowrap disabled:opacity-50 cursor-pointer"
        >
          <Sparkles size={18} className={isLoading ? "animate-spin" : ""} />
          <span>
            {isLoading
              ? "Sedang Menganalisa AI..."
              : "Jalankan Analisa AI 3 Tabel"}
          </span>
        </button>
      </div>

      {/* TAMPILKAN 3 TABEL HASIL ANALISA AI */}
      {tablesData ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* TABEL 1: EVALUASI PERSYARATAN / KUALIFIKASI */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
              <span>TABEL 1: Evaluasi Terhadap Persyaratan (Requirements)</span>
              <span className="text-xs font-normal text-slate-300">
                Matriks Komparatif
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-3.5 border-r border-slate-200 w-12 text-center">
                      No
                    </th>
                    <th className="p-3.5 border-r border-slate-200 min-w-[250px]">
                      Persyaratan (Requirements)
                    </th>
                    {candidateNames.map((name, idx) => (
                      <th
                        key={idx}
                        className="p-3.5 border-r border-slate-200 text-center min-w-[140px] bg-blue-50/50 text-blue-900"
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tablesData.tabel_kualifikasi?.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/80">
                      <td className="p-3.5 text-center font-bold text-slate-500 border-r border-slate-200">
                        {row.no}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 border-r border-slate-200">
                        {row.persyaratan}
                      </td>
                      {row.evaluasi?.map((item, eIdx) => (
                        <td
                          key={eIdx}
                          className="p-3.5 border-r border-slate-200 text-center"
                        >
                          <div>{getSymbolBadge(item.simbol)}</div>
                          {item.catatan && (
                            <div className="text-[10px] text-slate-500 mt-1 italic">
                              ({item.catatan})
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 2: EVALUASI TANGGUNG JAWAB */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
              <span>
                TABEL 2: Evaluasi Terhadap Tanggung Jawab (Responsibilities)
              </span>
              <span className="text-xs font-normal text-slate-300">
                Matriks Komparatif
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-3.5 border-r border-slate-200 w-12 text-center">
                      No
                    </th>
                    <th className="p-3.5 border-r border-slate-200 min-w-[250px]">
                      Tanggung Jawab (Responsibilities)
                    </th>
                    {candidateNames.map((name, idx) => (
                      <th
                        key={idx}
                        className="p-3.5 border-r border-slate-200 text-center min-w-[140px] bg-purple-50/50 text-purple-900"
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tablesData.tabel_tanggung_jawab?.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/80">
                      <td className="p-3.5 text-center font-bold text-slate-500 border-r border-slate-200">
                        {row.no}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 border-r border-slate-200">
                        {row.tanggung_jawab}
                      </td>
                      {row.evaluasi?.map((item, eIdx) => (
                        <td
                          key={eIdx}
                          className="p-3.5 border-r border-slate-200 text-center"
                        >
                          <div>{getSymbolBadge(item.simbol)}</div>
                          {item.catatan && (
                            <div className="text-[10px] text-slate-500 mt-1 italic">
                              ({item.catatan})
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 3: KESIMPULAN RINGKASAN & HASIL SELEKSI KANDIDAT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award size={18} className="text-amber-300" />
                TABEL 3: Kesimpulan Ringkasan & Hasil Seleksi Kandidat
              </span>
              <span className="text-xs font-normal text-blue-100">
                Terurut dari Rekomendasi Utama
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-3.5 w-12 text-center">Rank</th>
                    <th className="p-3.5 min-w-[160px]">Nama Kandidat</th>
                    <th className="p-3.5 text-center w-28">Kesesuaian %</th>
                    <th className="p-3.5 min-w-[300px]">
                      Skor / Catatan Utama
                    </th>
                    <th className="p-3.5 min-w-[180px]">Status Seleksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tablesData.tabel_kesimpulan?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3.5 text-center font-extrabold text-slate-700">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center ${
                            idx === 0
                              ? "bg-amber-400 text-slate-900 font-black"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          #{row.rank || idx + 1}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-900 text-sm">
                        {row.nama}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-base font-black text-blue-600">
                          {row.fit_score}%
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 leading-relaxed">
                        {row.catatan_utama}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                            row.status_seleksi?.includes("Utama")
                              ? "bg-emerald-600 text-white"
                              : row.status_seleksi?.includes("LOLOS")
                                ? "bg-blue-600 text-white"
                                : row.status_seleksi?.includes("Cadangan")
                                  ? "bg-amber-500 text-white"
                                  : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {row.status_seleksi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
          <Sparkles size={28} className="mx-auto text-blue-500 mb-2" />
          <p className="font-bold text-slate-700 text-sm mb-1">
            3 Tabel Matriks Belum Dibuat
          </p>
          <p className="max-w-md mx-auto">
            Unggah PDF lowongan di atas atau ketik kriteria manual, lalu klik
            tombol ungu <b>"Jalankan Analisa AI 3 Tabel"</b>.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
