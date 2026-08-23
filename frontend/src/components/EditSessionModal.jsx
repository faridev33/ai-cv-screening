import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

const EditSessionModal = ({
  isOpen,
  onClose,
  onSubmit,
  session,
  isLoading,
}) => {
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    if (session) {
      setJobTitle(session.job_title || "");
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    onSubmit(session.id, { job_title: jobTitle });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Edit Nama Sesi
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Sesi / Posisi Pekerjaan
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm font-semibold"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? (
                "Menyimpan..."
              ) : (
                <>
                  <Check size={16} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;
