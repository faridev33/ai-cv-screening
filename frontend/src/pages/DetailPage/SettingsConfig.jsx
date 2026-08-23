import React, { useState, useEffect } from "react";
import {
  Key,
  Cpu,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
  Zap,
  DollarSign,
  RotateCcw,
  Settings,
  Check,
  Trash2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import API from "../../services/api";

const SettingsConfig = ({ apiKey, setApiKey, onSave }) => {
  const [testingAi, setTestingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // 1. STATE PILIHAN MODEL QWEN
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("ai_screening_model") || "qwen/qwen3.8-max";
  });

  // 2. STATE PARAMETER AI (HANYA TEMPERATURE PRESI)
  const [temperature, setTemperature] = useState(() => {
    return parseFloat(localStorage.getItem("ai_screening_temp")) || 0.1;
  });

  // 3. STATISTIK PEMAKAIAN TOKEN REALTIME
  const [tokenStats, setTokenStats] = useState({
    total: 0,
    prompt: 0,
    completion: 0,
    costUSD: 0,
  });

  useEffect(() => {
    const syncTokenStats = () => {
      const saved = localStorage.getItem("ai_screening_token_stats");
      if (saved) {
        setTokenStats(JSON.parse(saved));
      } else {
        setTokenStats({ total: 0, prompt: 0, completion: 0, costUSD: 0 });
      }
    };

    syncTokenStats();
    window.addEventListener("storage", syncTokenStats);
    return () => window.removeEventListener("storage", syncTokenStats);
  }, []);

  const featuredQwenModels = [
    {
      id: "qwen/qwen3.8-max",
      name: "Qwen 3.8 Max",
      context: "1,000,000 Tokens",
      tag: "Flagship Terbaru",
      desc: "Model Qwen tercerdas & konteks 1 Juta token. Paling presisi untuk 3 Tabel Matriks.",
    },
    {
      id: "qwen/qwen3.7-flash",
      name: "Qwen 3.7 Flash",
      context: "1,000,000 Tokens",
      tag: "Super Cepat & Hemat",
      desc: "Respon kilat, sangat murah & konteks 1 Juta token untuk batch CV besar.",
    },
    {
      id: "qwen/qwen3.7-plus",
      name: "Qwen 3.7 Plus",
      context: "1,000,000 Tokens",
      tag: "High Performance",
      desc: "Penalaran seimbang untuk kualifikasi CV kompleks.",
    },
    {
      id: "qwen/qwen3-coder-plus",
      name: "Qwen 3 Coder Plus",
      context: "1,000,000 Tokens",
      tag: "Spesialis Tech & IT",
      desc: "Sangat cocok untuk screening CV IT, Software Engineer & Data Science.",
    },
    {
      id: "qwen/qwen3-max",
      name: "Qwen 3 Max",
      context: "262,144 Tokens",
      tag: "Deep Reasoning",
      desc: "Akurasi tinggi untuk membandingkan puluhan kandidat sekaligus.",
    },
    {
      id: "qwen/qwen-2.5-72b-instruct",
      name: "Qwen 2.5 72B Instruct",
      context: "32,768 Tokens",
      tag: "Classic Standard",
      desc: "Model standar teruji yang stabil & sangat konsisten.",
    },
  ];

  const all51QwenModels = [
    { id: "qwen/qwen3.8-max", name: "qwen/qwen3.8-max (1,000,000 tokens)" },
    { id: "qwen/qwen3.8-27b", name: "qwen/qwen3.8-27b (1,000,000 tokens)" },
    {
      id: "qwen/qwen3.8-2.4t-a95b",
      name: "qwen/qwen3.8-2.4t-a95b (1,048,576 tokens)",
    },
    { id: "qwen/qwen3.7-flash", name: "qwen/qwen3.7-flash (1,000,000 tokens)" },
    { id: "qwen/qwen3.7-plus", name: "qwen/qwen3.7-plus (1,000,000 tokens)" },
    { id: "qwen/qwen3.7-max", name: "qwen/qwen3.7-max (1,000,000 tokens)" },
    { id: "qwen/qwen3.6-flash", name: "qwen/qwen3.6-flash (1,000,000 tokens)" },
    { id: "qwen/qwen3.6-plus", name: "qwen/qwen3.6-plus (1,000,000 tokens)" },
    { id: "qwen/qwen3.6-27b", name: "qwen/qwen3.6-27b (262,144 tokens)" },
    {
      id: "qwen/qwen3.6-35b-a3b",
      name: "qwen/qwen3.6-35b-a3b (262,144 tokens)",
    },
    {
      id: "qwen/qwen3.6-max-preview",
      name: "qwen/qwen3.6-max-preview (262,144 tokens)",
    },
    {
      id: "qwen/qwen3.5-plus-20260420",
      name: "qwen/qwen3.5-plus-20260420 (1,000,000 tokens)",
    },
    {
      id: "qwen/qwen3.5-flash-02-23",
      name: "qwen/qwen3.5-flash-02-23 (1,000,000 tokens)",
    },
    {
      id: "qwen/qwen3.5-plus-02-15",
      name: "qwen/qwen3.5-plus-02-15 (1,000,000 tokens)",
    },
    { id: "qwen/qwen3.5-9b", name: "qwen/qwen3.5-9b (262,144 tokens)" },
    { id: "qwen/qwen3.5-27b", name: "qwen/qwen3.5-27b (262,144 tokens)" },
    {
      id: "qwen/qwen3.5-35b-a3b",
      name: "qwen/qwen3.5-35b-a3b (262,144 tokens)",
    },
    {
      id: "qwen/qwen3.5-122b-a10b",
      name: "qwen/qwen3.5-122b-a10b (262,144 tokens)",
    },
    {
      id: "qwen/qwen3.5-397b-a17b",
      name: "qwen/qwen3.5-397b-a17b (262,144 tokens)",
    },
    { id: "qwen/qwen3-max", name: "qwen/qwen3-max (262,144 tokens)" },
    {
      id: "qwen/qwen3-max-thinking",
      name: "qwen/qwen3-max-thinking (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-coder-plus",
      name: "qwen/qwen3-coder-plus (1,000,000 tokens)",
    },
    {
      id: "qwen/qwen3-coder-flash",
      name: "qwen/qwen3-coder-flash (1,000,000 tokens)",
    },
    {
      id: "qwen/qwen3-coder-next",
      name: "qwen/qwen3-coder-next (262,144 tokens)",
    },
    { id: "qwen/qwen3-coder", name: "qwen/qwen3-coder (262,144 tokens)" },
    {
      id: "qwen/qwen3-coder-30b-a3b-instruct",
      name: "qwen/qwen3-coder-30b-a3b-instruct (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-next-80b-a3b-instruct",
      name: "qwen/qwen3-next-80b-a3b-instruct (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-next-80b-a3b-thinking",
      name: "qwen/qwen3-next-80b-a3b-thinking (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-vl-235b-a22b-instruct",
      name: "qwen/qwen3-vl-235b-a22b-instruct (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-vl-235b-a22b-thinking",
      name: "qwen/qwen3-vl-235b-a22b-thinking (131,072 tokens)",
    },
    {
      id: "qwen/qwen3-vl-32b-instruct",
      name: "qwen/qwen3-vl-32b-instruct (131,072 tokens)",
    },
    {
      id: "qwen/qwen3-vl-30b-a3b-instruct",
      name: "qwen/qwen3-vl-30b-a3b-instruct (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-vl-30b-a3b-thinking",
      name: "qwen/qwen3-vl-30b-a3b-thinking (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-vl-8b-instruct",
      name: "qwen/qwen3-vl-8b-instruct (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-vl-8b-thinking",
      name: "qwen/qwen3-vl-8b-thinking (131,072 tokens)",
    },
    { id: "qwen/qwen-plus", name: "qwen/qwen-plus (1,000,000 tokens)" },
    {
      id: "qwen/qwen-plus-2025-07-28",
      name: "qwen/qwen-plus-2025-07-28 (1,000,000 tokens)",
    },
    {
      id: "qwen/qwen-plus-2025-07-28:thinking",
      name: "qwen/qwen-plus-2025-07-28:thinking (1,000,000 tokens)",
    },
    {
      id: "qwen/qwen3-30b-a3b-instruct-2507",
      name: "qwen/qwen3-30b-a3b-instruct-2507 (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-30b-a3b-thinking-2507",
      name: "qwen/qwen3-30b-a3b-thinking-2507 (81,920 tokens)",
    },
    {
      id: "qwen/qwen3-235b-a22b-thinking-2507",
      name: "qwen/qwen3-235b-a22b-thinking-2507 (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-235b-a22b-2507",
      name: "qwen/qwen3-235b-a22b-2507 (262,144 tokens)",
    },
    {
      id: "qwen/qwen3-235b-a22b",
      name: "qwen/qwen3-235b-a22b (131,072 tokens)",
    },
    { id: "qwen/qwen3-32b", name: "qwen/qwen3-32b (131,072 tokens)" },
    { id: "qwen/qwen3-30b-a3b", name: "qwen/qwen3-30b-a3b (131,072 tokens)" },
    { id: "qwen/qwen3-14b", name: "qwen/qwen3-14b (131,072 tokens)" },
    { id: "qwen/qwen3-8b", name: "qwen/qwen3-8b (131,072 tokens)" },
    {
      id: "qwen/qwen2.5-vl-72b-instruct",
      name: "qwen/qwen2.5-vl-72b-instruct (128,000 tokens)",
    },
    {
      id: "qwen/qwen-2.5-coder-32b-instruct",
      name: "qwen/qwen-2.5-coder-32b-instruct (32,768 tokens)",
    },
    {
      id: "qwen/qwen-2.5-72b-instruct",
      name: "qwen/qwen-2.5-72b-instruct (32,768 tokens)",
    },
    {
      id: "qwen/qwen-2.5-7b-instruct",
      name: "qwen/qwen-2.5-7b-instruct (32,768 tokens)",
    },
  ];

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    localStorage.setItem("ai_screening_model", modelId);
  };

  const handleSaveAll = () => {
    localStorage.setItem("ai_screening_api_key", apiKey);
    localStorage.setItem("ai_screening_model", selectedModel);
    localStorage.setItem("ai_screening_temp", temperature.toString());

    if (onSave) onSave();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestAiConnection = async () => {
    if (!apiKey.trim()) {
      setAiStatus({
        type: "error",
        message:
          "API Key belum diisi! Silakan masukkan OpenRouter API Key Anda terlebih dahulu.",
      });
      return;
    }

    try {
      setTestingAi(true);
      setAiStatus(null);
      const response = await API.post("/check-ai/", {
        api_key: apiKey,
        model: selectedModel,
      });
      setAiStatus({ type: "success", message: response.data.message });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Gagal terhubung ke AI. Periksa API Key!";
      setAiStatus({ type: "error", message: msg });
    } finally {
      setTestingAi(false);
    }
  };

  const handleResetTokenStats = () => {
    if (window.confirm("Reset hitungan pemakaian token menjadi 0?")) {
      const resetData = { total: 0, prompt: 0, completion: 0, costUSD: 0 };
      setTokenStats(resetData);
      localStorage.setItem(
        "ai_screening_token_stats",
        JSON.stringify(resetData),
      );
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm("Kembalikan model ke Qwen 3.8 Max default?")) {
      handleModelSelect("qwen/qwen3.8-max");
      setTemperature(0.1);
      localStorage.removeItem("ai_screening_temp");
      alert("Pengaturan di-reset ke Qwen 3.8 Max!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 pb-12">
      {/* 1. STATISTIK PEMAKAIAN TOKEN REALTIME */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Token Terpakai
            </p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {(tokenStats.total || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Prompt: {((tokenStats.prompt || 0) / 1000).toFixed(1)}k | Output:{" "}
              {((tokenStats.completion || 0) / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Zap size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimasi Biaya API
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              ${tokenStats.costUSD || 0}{" "}
              <span className="text-xs font-normal text-slate-400">USD</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Setara ~Rp{" "}
              {((tokenStats.costUSD || 0) * 16000).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reset Statistik
            </p>
            <button
              onClick={handleResetTokenStats}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} /> Reset Token
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Hitung ulang statistik pemakaian token dari awal.
          </p>
        </div>
      </div>

      {/* 2. CARD STATUS KONEKSI AI */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Cpu size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Status Server Qwen AI
              </h3>
              <p className="text-xs text-slate-500">
                Model Aktif:{" "}
                <code className="text-blue-600 font-bold font-mono">
                  {selectedModel}
                </code>
              </p>
            </div>
          </div>

          <button
            onClick={handleTestAiConnection}
            disabled={testingAi}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {testingAi ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wifi size={14} />
            )}
            <span>{testingAi ? "Mengecek..." : "Tes Koneksi Qwen AI"}</span>
          </button>
        </div>

        {aiStatus && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              aiStatus.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {aiStatus.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{aiStatus.message}</span>
          </div>
        )}
      </div>

      {/* 3. REKOMENDASI UTAMA MODEL QWEN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles className="text-blue-600" size={20} />
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Rekomendasi Utama Qwen Model
            </h3>
            <p className="text-xs text-slate-500">
              Pilih model unggulan Qwen dengan performa & konteks terbaik
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredQwenModels.map((m) => (
            <div
              key={m.id}
              onClick={() => handleModelSelect(m.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                selectedModel === m.id
                  ? "border-blue-600 bg-blue-50/40 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{m.name}</h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedModel === m.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {m.tag}
                </span>
              </div>
              <p className="text-xs text-slate-500">{m.desc}</p>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                <span>{m.id}</span>
                <span className="font-bold text-blue-600">{m.context}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. DROPDOWN LENGKAP 51 MODEL QWEN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Settings className="text-blue-600" size={20} />
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Daftar Lengkap 51 Varian Model Qwen
            </h3>
            <p className="text-xs text-slate-500">
              Pilih langsung dari seluruh koleksi resmi Qwen di OpenRouter
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Pilih Varian Model Qwen (51 Models Available)
          </label>
          <select
            value={selectedModel}
            onChange={(e) => handleModelSelect(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-xs font-bold text-blue-900 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {all51QwenModels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. CONFIGURASI API KEY & TEMPERATURE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Key className="text-blue-600" size={20} />
          <h3 className="font-bold text-slate-800 text-base">
            Pengaturan OpenRouter API Key & Parameter
          </h3>
        </div>

        {/* NOTIFIKASI UNLIMITED TOKENS */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
          <span>
            <b>Sistem Output Tanpa Batasan (Unlimited Mode):</b> AI Qwen akan
            memberikan jawaban 3 Tabel secara penuh tanpa terpotong.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            OpenRouter API Key
          </label>
          <input
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-slate-800"
          />
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Info size={12} /> Key juga bisa disimpan di file{" "}
            <code className="text-blue-600 font-mono">backend/.env</code>{" "}
            (MY_API_KEY).
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">
                Temperature (Presisi Qwen AI)
              </span>
              <span className="text-blue-600 font-mono font-bold">
                {temperature}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Disarankan 0.0 - 0.1 untuk analisis CV & 3 Tabel yang sangat
              presisi.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleFactoryReset}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Reset ke Qwen 3.8 Max</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSaveAll();
              handleTestAiConnection();
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check size={16} />
                <span>Pengaturan Qwen Tersimpan!</span>
              </>
            ) : (
              <span>Simpan & Tes Model Qwen</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsConfig;
