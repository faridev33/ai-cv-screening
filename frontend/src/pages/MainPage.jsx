import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, Loader2 } from "lucide-react";

import API from "../services/api";
import SessionCard from "../components/SessionCard";
import AddSessionModal from "../components/AddSessionModal";
import EditSessionModal from "../components/EditSessionModal";

const MainPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Daftar Sesi dari Django Backend
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await API.get("/sessions/");
      setSessions(response.data);
    } catch (error) {
      console.error("Gagal mengambil data sesi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 2. Handler Tambah Sesi Baru (Hanya Nama Sesi)
  const handleCreateSession = async (formData) => {
    try {
      setIsSubmitting(true);
      await API.post("/sessions/", formData);
      setIsAddModalOpen(false);
      fetchSessions();
    } catch (error) {
      alert("Gagal membuat sesi baru!");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handler Edit Nama Sesi
  const handleOpenEditModal = (session) => {
    setSessionToEdit(session);
    setIsEditModalOpen(true);
  };

  const handleUpdateSession = async (sessionId, formData) => {
    try {
      setIsSubmitting(true);
      await API.put(`/sessions/${sessionId}/`, formData);
      setIsEditModalOpen(false);
      fetchSessions(); // Refresh list card
    } catch (error) {
      alert("Gagal mengedit nama sesi!");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handler Hapus Sesi
  const handleDeleteSession = async (id) => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus sesi ini? Seluruh file folder terkait akan dihapus permanen.",
      )
    ) {
      try {
        await API.delete(`/sessions/${id}/`);
        setSessions(sessions.filter((session) => session.id !== id));
      } catch (error) {
        alert("Gagal menghapus sesi!");
        console.error(error);
      }
    }
  };

  // 5. Masuk ke Detail Sesi
  const handleOpenDetail = (id) => {
    navigate(`/session/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Bar Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800">
                AI CV Screening
              </h1>
              <p className="text-xs text-slate-500">
                Automated Candidate Selection System
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            <span>Tambah Sesi Baru</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Daftar Sesi Rekrutmen
            </h2>
            <p className="text-sm text-slate-500">
              Pilih sesi untuk mengelola CV dan melihat hasil analisa AI.
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-600 bg-slate-200 px-3.5 py-1 rounded-full">
            Total: {sessions.length} Sesi
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm">Memuat data dari Django Backend...</p>
          </div>
        ) : sessions.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Belum Ada Sesi
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Mulai dengan membuat sesi rekrutmen baru untuk posisi pekerjaan
              Anda.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Buat Sesi Sekarang
            </button>
          </div>
        ) : (
          /* Grid Card Sesi */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={handleDeleteSession}
                onOpen={handleOpenDetail}
                onEdit={handleOpenEditModal}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal Popup Tambah Sesi */}
      <AddSessionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateSession}
        isLoading={isSubmitting}
      />

      {/* Modal Popup Edit Nama Sesi */}
      <EditSessionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateSession}
        session={sessionToEdit}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default MainPage;
