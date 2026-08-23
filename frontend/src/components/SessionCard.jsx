import React from "react";
import { Briefcase, Calendar, FolderOpen, Trash2, Pencil } from "lucide-react";

const SessionCard = ({ session, onDelete, onOpen, onEdit }) => {
  const formattedDate = new Date(session.created_at).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Briefcase size={24} />
          </div>

          <div className="flex items-center gap-1">
            {/* TOMBOL EDIT NAMA SESI */}
            <button
              onClick={() => onEdit(session)}
              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors p-1.5 rounded-lg"
              title="Edit Nama Sesi"
            >
              <Pencil size={18} />
            </button>

            {/* TOMBOL HAPUS SESI */}
            <button
              onClick={() => onDelete(session.id)}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors p-1.5 rounded-lg"
              title="Hapus Sesi"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1">
          {session.job_title}
        </h3>

        <div className="flex items-center text-xs text-slate-500 gap-2 mb-4">
          <Calendar size={14} />
          <span>Dibuat: {formattedDate}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
          ID: {session.id.substring(0, 8)}...
        </span>
        <button
          onClick={() => onOpen(session.id)}
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>Buka Detail</span>
          <FolderOpen size={16} />
        </button>
      </div>
    </div>
  );
};

export default SessionCard;
