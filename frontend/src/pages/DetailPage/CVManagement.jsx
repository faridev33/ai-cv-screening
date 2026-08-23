import React, { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Mail,
  Phone,
  ExternalLink,
  MapPin,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

const CVManagement = ({
  files,
  onFileUpload,
  onFileDelete,
  onRetryFile,
  retryingFile,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState({ type: null, idx: null });

  const handleCopy = (text, type, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex({ type, idx });
    setTimeout(() => setCopiedIndex({ type: null, idx: null }), 2000);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) onFileUpload(selectedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf"),
    );
    if (pdfFiles.length > 0) onFileUpload(pdfFiles);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* DROPZONE UPLOAD */}
      <div
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
          isDragging
            ? "border-blue-600 bg-blue-50/50 scale-[1.01]"
            : "border-slate-300 hover:border-blue-500"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple
          className="hidden"
        />
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Upload size={24} />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">
          Unggah File CV Pelamar (PDF)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tarik & Lepas file PDF di sini untuk mengekstrak kontak & mengganti
          nama file secara otomatis.
        </p>
      </div>

      {/* DAFTAR PELAMAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm flex justify-between items-center">
          <span>Daftar Pelamar ({files.length})</span>
          <span className="text-xs font-normal text-slate-500">
            Klik nama pelamar untuk membuka file PDF
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {files.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada file CV diunggah.
            </div>
          ) : (
            files.map((file, idx) => {
              const isFailed =
                file.nama?.includes("Gagal AI") ||
                file.filename?.includes("Gagal AI");
              const isProcessingThis = retryingFile === file.filename;

              return (
                <div
                  key={idx}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  {/* Informasi Nama & Kontak Pelamar */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl mt-0.5 ${isFailed ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}
                    >
                      {isFailed ? (
                        <AlertTriangle size={22} />
                      ) : (
                        <FileText size={22} />
                      )}
                    </div>
                    <div>
                      {/* Nama Pelamar (Klik Buka PDF) */}
                      <a
                        href={file.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-bold flex items-center gap-1.5 text-base group ${
                          isFailed
                            ? "text-amber-700 hover:text-amber-800"
                            : "text-slate-900 hover:text-blue-600"
                        }`}
                      >
                        <span>{file.nama}</span>
                        <ExternalLink
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
                        />
                      </a>

                      {/* Baris Kontak: Email, No HP (08.../+62...), Domisili, File Size */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                        {file.email && (
                          <span className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Mail size={12} className="text-blue-600" />
                            {file.email}
                          </span>
                        )}

                        {file.telepon && (
                          <span className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Phone size={12} className="text-emerald-600" />
                            {file.telepon}
                          </span>
                        )}

                        {file.domisili && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin size={12} className="text-slate-400" />
                            {file.domisili}
                          </span>
                        )}

                        <span className="text-slate-400 text-[11px]">
                          ({file.filename} • {file.size})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TOMBOL-TOMBOL AKSI (Coba Lagi, Salin, Hapus) */}
                  <div className="flex items-center gap-2">
                    {/* TOMBOL REFRESH / PROSES ULANG AI */}
                    <button
                      onClick={() => onRetryFile(file.filename)}
                      disabled={isProcessingThis}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isFailed
                          ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                      title="Proses ulang file ini dengan AI"
                    >
                      <RotateCcw
                        size={15}
                        className={
                          isProcessingThis ? "animate-spin text-blue-600" : ""
                        }
                      />
                      {isFailed && <span>Coba Lagi AI</span>}
                    </button>

                    {/* Button Copy Email */}
                    {file.email && (
                      <button
                        onClick={() => handleCopy(file.email, "email", idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          copiedIndex.type === "email" &&
                          copiedIndex.idx === idx
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                        title="Salin Email"
                      >
                        <Mail size={13} />
                        {copiedIndex.type === "email" &&
                        copiedIndex.idx === idx ? (
                          <span>Tersalin!</span>
                        ) : (
                          <span>Salin Email</span>
                        )}
                      </button>
                    )}

                    {/* Button Copy Phone */}
                    {file.telepon && (
                      <button
                        onClick={() => handleCopy(file.telepon, "phone", idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          copiedIndex.type === "phone" &&
                          copiedIndex.idx === idx
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                        title="Salin No HP"
                      >
                        <Phone size={13} />
                        {copiedIndex.type === "phone" &&
                        copiedIndex.idx === idx ? (
                          <span>Tersalin!</span>
                        ) : (
                          <span>Salin No HP</span>
                        )}
                      </button>
                    )}

                    {/* Button Hapus File */}
                    <button
                      onClick={() => onFileDelete(file.filename)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      title="Hapus File"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CVManagement;
