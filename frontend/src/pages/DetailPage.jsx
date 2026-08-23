import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  Sparkles,
  Key,
  Loader2,
} from "lucide-react";

import API from "../services/api";
import { addTokenUsage } from "../utils/tokenTracker";

import DashboardOverview from "./DetailPage/DashboardOverview";
import CVManagement from "./DetailPage/CVManagement";
import AIAnalysis from "./DetailPage/AIAnalysis";
import SettingsConfig from "./DetailPage/SettingsConfig";

const DetailPage = () => {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(`active_tab_session_${id}`) || "dashboard";
  });

  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    currentFileName: "",
  });
  const [retryingFile, setRetryingFile] = useState(null);

  const [sessionInfo, setSessionInfo] = useState({
    id: id,
    jobTitle: "Memuat...",
    createdAt: "-",
  });
  const [files, setFiles] = useState([]);
  const [candidateResults, setCandidateResults] = useState([]);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("ai_screening_api_key") || "",
  );
  const [selectedModel] = useState(
    () => localStorage.getItem("ai_screening_model") || "qwen/qwen3.8-max",
  );

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    localStorage.setItem(`active_tab_session_${id}`, tabName);
  };

  const fetchSessionData = async () => {
    try {
      const response = await API.get(`/sessions/${id}/`);
      setSessionInfo({
        id: response.data.session.id,
        jobTitle: response.data.session.job_title,
        createdAt: new Date(
          response.data.session.created_at,
        ).toLocaleDateString("id-ID"),
      });
      setFiles(response.data.files || []);
      setCandidateResults(response.data.candidates || []);
    } catch (error) {
      console.error("Gagal mengambil data dari backend:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  // PROSES UPLOAD SATU PER SATU (LANGSUNG TAMPIL DENGAN CEPAT)
  const handleFileUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({
      current: 0,
      total: selectedFiles.length,
      currentFileName: "",
    });

    try {
      // Loop dan kirim file SATU PER SATU
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Update Indikator Progress File ke-N
        setUploadProgress({
          current: i + 1,
          total: selectedFiles.length,
          currentFileName: file.name,
        });

        const formData = new FormData();
        formData.append("files", file); // Kirim 1 file
        formData.append("api_key", apiKey);
        formData.append("model", selectedModel);

        const res = await API.post(`/sessions/${id}/upload/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Catat Token jika ada
        if (res.data?.usage) {
          addTokenUsage(
            res.data.usage.prompt_tokens,
            res.data.usage.completion_tokens,
          );
        }

        // LANGSUNG REFRESH LAYAR SETIAP 1 FILE SELESAI DITANGANI!
        await fetchSessionData();
      }
    } catch (error) {
      console.error("Gagal upload:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0, currentFileName: "" });
    }
  };

  // Retry File
  const handleRetryFile = async (fileName) => {
    try {
      setRetryingFile(fileName);
      const res = await API.post(`/sessions/${id}/retry/`, {
        file_name: fileName,
        api_key: apiKey,
        model: selectedModel,
      });

      if (res.data?.usage) {
        addTokenUsage(
          res.data.usage.prompt_tokens,
          res.data.usage.completion_tokens,
        );
      }

      await fetchSessionData();
    } catch (error) {
      console.error(error);
    } finally {
      setRetryingFile(null);
    }
  };

  const handleRunMultiTableAnalysis = async () => {
    try {
      setIsUploading(true);
      const res = await API.post(`/sessions/${id}/analyze/`, {
        api_key: apiKey,
        model: selectedModel,
      });

      if (res.data?.usage) {
        addTokenUsage(
          res.data.usage.prompt_tokens,
          res.data.usage.completion_tokens,
        );
      }

      await fetchSessionData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (fileName) => {
    if (window.confirm(`Hapus file "${fileName}"?`)) {
      try {
        await API.delete(`/sessions/${id}/upload/?file_name=${fileName}`);
        fetchSessionData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSaveToken = () => {
    localStorage.setItem("ai_screening_api_key", apiKey);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl text-slate-800">
                  {sessionInfo.jobTitle}
                </h1>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                  Sesi Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">ID Sesi: {id}</p>
            </div>
          </div>
        </div>

        {/* Tab Navbar */}
        <div className="max-w-7xl mx-auto px-6 flex gap-8 border-t border-slate-100">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-sm font-semibold transition-all ${activeTab === "dashboard" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleTabChange("cv-manager")}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-sm font-semibold transition-all ${activeTab === "cv-manager" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <FileText size={18} />
            <span>Manajemen CV ({files.length})</span>
          </button>
          <button
            onClick={() => handleTabChange("analysis")}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-sm font-semibold transition-all ${activeTab === "analysis" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <Sparkles size={18} />
            <span>Hasil Analisa AI</span>
          </button>
          <button
            onClick={() => handleTabChange("token")}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-sm font-semibold transition-all ${activeTab === "token" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <Key size={18} />
            <span>Token & Pengaturan</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm">Membaca file sesi dari laptop...</p>
          </div>
        ) : (
          <>
            {/* INDIKATOR PROGRESS REALTIME PROSES SATU PER SATU */}
            {isUploading && (
              <div className="mb-6 bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-amber-300" size={24} />
                  <div>
                    <h4 className="font-bold text-sm">
                      {uploadProgress.total > 0
                        ? `Memproses File ${uploadProgress.current} dari ${uploadProgress.total} (${uploadProgress.currentFileName})`
                        : "Menganalisa AI..."}
                    </h4>
                    <p className="text-xs text-blue-100">
                      File selesai diproses akan langsung tampil di tabel bawah
                      secara otomatis!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <DashboardOverview
                filesCount={files.length}
                candidateResults={candidateResults}
              />
            )}
            {activeTab === "cv-manager" && (
              <CVManagement
                files={files}
                onFileUpload={handleFileUpload}
                onFileDelete={handleFileDelete}
                onRetryFile={handleRetryFile}
                retryingFile={retryingFile}
              />
            )}
            {activeTab === "analysis" && (
              <AIAnalysis
                candidateResults={candidateResults}
                onRunAnalysis={handleRunMultiTableAnalysis}
                isAnalyzing={isUploading}
              />
            )}
            {activeTab === "token" && (
              <SettingsConfig
                apiKey={apiKey}
                setApiKey={setApiKey}
                onSave={handleSaveToken}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DetailPage;
