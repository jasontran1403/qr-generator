import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { signPdf } from "../services/signService";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const SIGNERS = [
  { bg: "#2563EB", border: "#BFDBFE", light: "#EFF6FF", text: "#1D4ED8", label: "Người ký 1" },
  { bg: "#16A34A", border: "#BBF7D0", light: "#F0FDF4", text: "#15803D", label: "Người ký 2" },
  { bg: "#9333EA", border: "#E9D5FF", light: "#FAF5FF", text: "#7E22CE", label: "Người ký 3" },
  { bg: "#EA580C", border: "#FED7AA", light: "#FFF7ED", text: "#C2410C", label: "Người ký 4" },
];

const fmtDate = () =>
  new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/* ─── Navbar ─────────────────────────────────────────────────────────────────── */
export function Navbar({ rightSlot }) {
  return (
    <nav style={{
      height: 54, background: "#fff", borderBottom: "1px solid #E2E8F0",
      padding: "0 20px", display: "flex", alignItems: "center",
      justifyContent: "space-between", flexShrink: 0, zIndex: 100,
      boxShadow: "0 1px 3px #0000000a",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#667EEA,#764BA2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px #667EEA40" }}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", letterSpacing: -0.3 }}>Công cụ</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <NavLink to="/" label="QR Code" icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>} />
        <NavLink to="/e-sign" label="Ký số" icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 13l2 2 4-4" /></svg>} />
      </div>
      <div style={{ minWidth: 140, display: "flex", justifyContent: "flex-end" }}>{rightSlot}</div>
    </nav>
  );
}

function NavLink({ to, label, icon }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link to={to} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600, background: active ? "#EEF2FF" : "transparent", color: active ? "#4338CA" : "#64748B", border: `1px solid ${active ? "#C7D2FE" : "transparent"}`, transition: "all 0.15s" }}>
      {icon}{label}
    </Link>
  );
}

/* ─── PIN Dialog ─────────────────────────────────────────────────────────────── */
function PinDialog({ zonesCount, onConfirm, onCancel }) {
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleConfirm = () => {
    if (pin.length < 4) { setError("PIN phải có ít nhất 4 ký tự."); return; }
    onConfirm(pin);
    setPin("");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px 28px",
        width: 360, boxShadow: "0 24px 60px #0000002a, 0 0 0 1px #E2E8F0",
        animation: "popIn 0.2s ease",
      }}>
        <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Icon */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#667EEA,#764BA2)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#1E293B", textAlign: "center" }}>
          Nhập PIN USB Token
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 1.5 }}>
          Sắp ký <strong style={{ color: "#1E293B" }}>{zonesCount} vùng</strong> trên file PDF.<br />
          PIN được gửi qua HTTPS và xóa ngay sau khi ký.
        </p>

        {/* PIN input */}
        <div style={{ position: "relative", marginBottom: error ? 8 : 20 }}>
          <input
            ref={inputRef}
            type={show ? "text" : "password"}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleConfirm()}
            placeholder="Nhập PIN token..."
            autoFocus
            style={{
              width: "100%", padding: "11px 44px 11px 14px",
              borderRadius: 10, fontSize: 15, outline: "none",
              border: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`,
              background: error ? "#FFF5F5" : "#F8FAFC",
              boxSizing: "border-box", letterSpacing: show ? 0 : 3,
              transition: "border 0.15s",
            }}
          />
          {/* Toggle show/hide */}
          <button
            onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 2 }}
          >
            {show
              ? <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              : <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            }
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!pin}
            style={{
              flex: 2, padding: "10px", borderRadius: 10, border: "none",
              background: pin ? "linear-gradient(135deg,#667EEA,#764BA2)" : "#E2E8F0",
              color: pin ? "#fff" : "#94A3B8",
              cursor: pin ? "pointer" : "not-allowed",
              fontWeight: 700, fontSize: 14, fontFamily: "inherit",
              boxShadow: pin ? "0 4px 12px #667EEA30" : "none",
              transition: "all 0.15s",
            }}
          >
            Xác nhận ký số
          </button>
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 11, color: "#CBD5E1", textAlign: "center" }}>
          🔒 PIN không được lưu trữ ở bất kỳ đâu
        </p>
      </div>
    </div>
  );
}

/* ─── Signature Stamp ────────────────────────────────────────────────────────── */
function Stamp({ z, selected, onSelect, onDelete }) {
  const c = SIGNERS[z.signerIdx % SIGNERS.length];
  const fs = (b) => Math.max(7, z.h * b);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        position: "absolute",
        left: z.x + "%", top: z.y + "%",
        width: z.w + "%", height: z.h + "%",
        border: `1.5px solid ${c.bg}`,
        background: c.light + "ee",
        borderRadius: 6, cursor: "pointer",
        boxShadow: selected ? `0 0 0 3px ${c.border}, 0 4px 16px ${c.bg}22` : "0 1px 6px #00000014",
        overflow: "hidden", padding: "5px 8px", userSelect: "none",
        display: "flex", flexDirection: "column", justifyContent: "center",
        transition: "box-shadow 0.15s", pointerEvents: "all",
      }}
    >
      <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: fs(0.22), color: c.bg, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden" }}>{z.signerName}</div>
      <div style={{ fontSize: fs(0.15), color: c.text + "99", fontFamily: "monospace", marginTop: 2 }}>{fmtDate()}</div>
      <div style={{ marginTop: 3, borderTop: `1px solid ${c.bg}33`, paddingTop: 2, fontSize: fs(0.13), color: c.text + "77" }}>Ký số điện tử</div>
      <div style={{ position: "absolute", top: 0, right: 0, background: c.bg, color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: "0 5px 0 4px" }}>Tr.{z.page + 1}</div>
      {selected && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ position: "absolute", top: -9, left: -9, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0, boxShadow: "0 2px 6px #ef444450" }}
        >×</button>
      )}
    </div>
  );
}

/* ─── PDF Page ───────────────────────────────────────────────────────────────── */
function PDFPageView({ pageNum, pageCount, zones, activeSigner, onAdd, selectedZone, onSelect, onDelete, zoom }) {
  const wrapRef = useRef(null);
  const [drawing, setDrawing] = useState(null);
  const renderW = Math.round(595 * zoom / 100);
  const c = SIGNERS[activeSigner];

  const pct = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const onDown = (e) => { if (e.button !== 0) return; const p = pct(e); setDrawing({ sx: p.x, sy: p.y, x: p.x, y: p.y, w: 0, h: 0 }); onSelect(null); e.preventDefault(); };
  const onMove = (e) => { if (!drawing) return; const p = pct(e); setDrawing((d) => ({ ...d, x: Math.min(p.x, d.sx), y: Math.min(p.y, d.sy), w: Math.abs(p.x - d.sx), h: Math.abs(p.y - d.sy) })); };
  const onUp = () => { if (drawing && drawing.w > 1.5 && drawing.h > 1) { onAdd({ id: Date.now(), page: pageNum, x: drawing.x, y: drawing.y, w: drawing.w, h: drawing.h, signerIdx: activeSigner, signerName: SIGNERS[activeSigner].label }); } setDrawing(null); };

  return (
    <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#94A3B8", textTransform: "uppercase", marginBottom: 10 }}>Trang {pageNum + 1} / {pageCount}</div>
      <div ref={wrapRef} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        style={{ position: "relative", display: "inline-block", cursor: "crosshair", userSelect: "none", lineHeight: 0, boxShadow: "0 2px 8px #94A3B820, 0 8px 32px #94A3B818, 0 0 0 1px #E2E8F0", borderRadius: 3 }}
      >
        <Page pageNumber={pageNum + 1} width={renderW} renderAnnotationLayer={false} renderTextLayer={false} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {drawing && drawing.w > 0.3 && (
            <div style={{ position: "absolute", left: drawing.x + "%", top: drawing.y + "%", width: drawing.w + "%", height: drawing.h + "%", border: `2px dashed ${c.bg}`, background: c.light + "aa", borderRadius: 5 }} />
          )}
          {zones.filter((z) => z.page === pageNum).map((z) => (
            <Stamp key={z.id} z={z} selected={selectedZone === z.id} onSelect={() => onSelect(z.id)} onDelete={() => onDelete(z.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function ESignPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [zones, setZones] = useState([]);
  const [activeSigner, setActiveSigner] = useState(0);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoom, setZoom] = useState(80);
  const [showAll, setShowAll] = useState(true);
  const [visiblePages, setVisiblePages] = useState([]);
  const [step, setStep] = useState("upload");
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const [numSigners, setNumSigners] = useState(2);
  const [pdfError, setPdfError] = useState(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [signedFileUrl, setSignedFileUrl] = useState(null);
  const [signedFileName, setSignedFileName] = useState("");
  const fileRef = useRef(null);

  const allPages = Array.from({ length: numPages }, (_, i) => i);
  const displayPages = showAll ? allPages : visiblePages.filter((p) => p < numPages);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { alert("Vui lòng chọn file PDF!"); return; }
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(f); setFileUrl(URL.createObjectURL(f));
    setZones([]); setSelectedZone(null); setPdfError(null);
    setSignedFileUrl(null); setSignedFileName("");
    setStep("sign");
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const addZone = (z) => setZones((p) => [...p, z]);
  const deleteZone = (id) => { setZones((z) => z.filter((x) => x.id !== id)); setSelectedZone(null); };

  const togglePage = (p) => {
    setShowAll(false);
    setVisiblePages((prev) => prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]);
  };

  // ── Bước 1: nhấn nút → hiện PIN dialog ──────────────────────────────────────
  const handleSignClick = () => {
    if (zones.length === 0 || submitting) return;
    setShowPinDialog(true);
  };

  // ── Bước 2: user nhập PIN → gửi API ─────────────────────────────────────────
  const handleSubmit = async (pin) => {
    setShowPinDialog(false);
    setSubmitting(true);
    setSubmitProgress("Đang chuẩn bị...");
    try {
      setSubmitProgress("Đang gửi lên server...");
      const { blobUrl, filename } = await signPdf({ file, zones, pin });
      setSignedFileUrl(blobUrl);
      setSignedFileName(filename);
      setStep("done");
    } catch (err) {
      alert("Ký số thất bại: " + err.message);
    } finally {
      setSubmitting(false);
      setSubmitProgress("");
    }
  };


  const handleDownload = () => {
    if (!signedFileUrl) return;
    const a = document.createElement("a");
    a.href = signedFileUrl;
    a.download = signedFileName;
    a.click();
  };

  const reset = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (signedFileUrl) URL.revokeObjectURL(signedFileUrl);
    setFile(null); setFileUrl(null); setZones([]); setNumPages(0);
    setStep("upload"); setSelectedZone(null); setShowAll(true); setVisiblePages([]);
    setSignedFileUrl(null); setSignedFileName("");
  };

  const activeC = SIGNERS[activeSigner];
  const btn = { border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, borderRadius: 8, transition: "all 0.15s", fontWeight: 600 };

  /* ══ UPLOAD ══ */
  if (step === "upload") return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <style>{`@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "linear-gradient(160deg,#F8FAFF 0%,#EEF2FF 55%,#F0FDF4 100%)" }}>
        <div style={{ width: "100%", maxWidth: 520, animation: "fadeUp 0.45s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#667EEA,#764BA2)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px #667EEA40", animation: "floatY 3s ease-in-out infinite" }}>
              <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 13l2 2 4-4" /></svg>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1E293B", margin: "0 0 8px", letterSpacing: -0.8 }}>Ký số điện tử PDF</h1>
            <p style={{ color: "#64748B", fontSize: 15, margin: 0 }}>Đặt vùng chữ ký, gửi ký bằng USB token — nhanh &amp; bảo mật</p>
          </div>
          <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${dragging ? "#667EEA" : "#CBD5E1"}`, borderRadius: 16, padding: "48px 32px", textAlign: "center", cursor: "pointer", background: dragging ? "#EEF2FF" : "#fff", transition: "all 0.2s", boxShadow: dragging ? "0 0 0 4px #667EEA18" : "0 1px 3px #00000008" }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 12, background: dragging ? "#EEF2FF" : "#F8FAFC", border: "1px solid #E2E8F0", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" fill="none" stroke={dragging ? "#667EEA" : "#94A3B8"} strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <div style={{ fontSize: 14, color: "#475569" }}><span style={{ color: "#667EEA", fontWeight: 700 }}>Chọn file PDF</span> hoặc kéo thả vào đây</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 5 }}>Chỉ hỗ trợ PDF · Tối đa 50MB</div>
            <input ref={fileRef} type="file" accept=".pdf" hidden onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[{ icon: "🔐", label: "PKCS#11 chuẩn" }, { icon: "👥", label: "Nhiều người ký" }, { icon: "📍", label: "Chọn vị trí ký" }].map((f) => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, background: "#fff", border: "1px solid #E2E8F0", fontSize: 12, color: "#64748B", fontWeight: 600 }}><span>{f.icon}</span>{f.label}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ DONE ══ */
  if (step === "done") return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <style>{`@keyframes pop{0%{transform:scale(0.7);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}`}</style>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#F8FAFF,#EEF2FF 55%,#F0FDF4)" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40, background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px #00000010, 0 0 0 1px #E2E8F0", animation: "pop 0.4s ease" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #86EFAC", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 8px" }}>Ký số thành công!</h2>
          <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 6px" }}>
            <strong style={{ color: "#1E293B" }}>{zones.length} chữ ký</strong> đã được nhúng vào file.
          </p>
          {signedFileName && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, marginBottom: 20, fontSize: 12, color: "#15803D", fontWeight: 600 }}>
              <svg width="12" height="12" fill="#16A34A" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
              {signedFileName}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={reset} style={{ ...btn, padding: "10px 20px", background: "#F1F5F9", color: "#475569", fontSize: 13 }}>Ký file khác</button>
            <button onClick={handleDownload} style={{ ...btn, padding: "10px 20px", background: "linear-gradient(135deg,#667EEA,#764BA2)", color: "#fff", fontSize: 13, boxShadow: "0 4px 12px #667EEA30" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Tải file đã ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ SIGN EDITOR ══ */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F8FAFC" }}>
      <style>{`
        @keyframes spin2  { to { transform:rotate(360deg) } }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.35} }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:5px; height:5px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:10px }
        .react-pdf__Page { display:block !important; }
        .react-pdf__Page canvas { display:block; border-radius:3px; }
      `}</style>

      {/* PIN Dialog */}
      {showPinDialog && (
        <PinDialog
          zonesCount={zones.length}
          onConfirm={handleSubmit}
          onCancel={() => setShowPinDialog(false)}
        />
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 36px", textAlign: "center", boxShadow: "0 16px 48px #00000020" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #EEF2FF", borderTopColor: "#667EEA", borderRadius: "50%", animation: "spin2 0.8s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>Đang ký số...</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>{submitProgress}</div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar rightSlot={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "4px 8px" }}>
            <button onClick={() => setZoom((z) => Math.max(40, z - 10))} style={{ ...btn, background: "none", color: "#64748B", padding: "0 3px", fontSize: 16 }}>−</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", minWidth: 34, textAlign: "center" }}>{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(200, z + 10))} style={{ ...btn, background: "none", color: "#64748B", padding: "0 3px", fontSize: 16 }}>+</button>
          </div>
          <button
            onClick={handleSignClick}
            disabled={zones.length === 0 || submitting}
            style={{ ...btn, padding: "7px 14px", fontSize: 13, background: zones.length === 0 ? "#F1F5F9" : "linear-gradient(135deg,#667EEA,#764BA2)", color: zones.length === 0 ? "#94A3B8" : "#fff", cursor: zones.length === 0 ? "not-allowed" : "pointer", boxShadow: zones.length > 0 ? "0 4px 12px #667EEA30" : "none" }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
            Gửi ký ({zones.length})
          </button>
        </div>
      } />

      {/* File bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 16px", height: 40, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={reset} style={{ ...btn, background: "#F1F5F9", color: "#64748B", padding: "5px 10px", fontSize: 12 }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>Đổi file
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 7 }}>
          <svg width="12" height="12" fill="#EF4444" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file?.name}</span>
        </div>
        {numPages > 0 && <span style={{ fontSize: 12, color: "#94A3B8" }}>{numPages} trang</span>}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8" }}>Kéo chuột trên PDF để vẽ vùng ký</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left sidebar */}
        <div style={{ width: 210, background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "14px 12px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1.2, textTransform: "uppercase" }}>Người ký</span>
              <div style={{ display: "flex", gap: 3 }}>
                {[["−", () => setNumSigners((n) => Math.max(1, n - 1))], ["+", () => setNumSigners((n) => Math.min(4, n + 1))]].map(([l, fn]) => (
                  <button key={l} onClick={fn} style={{ width: 20, height: 20, borderRadius: 5, background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#64748B", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {SIGNERS.slice(0, numSigners).map((c, i) => (
                <button key={i} onClick={() => setActiveSigner(i)} style={{ ...btn, width: "100%", padding: "8px 10px", background: activeSigner === i ? c.light : "transparent", border: `1px solid ${activeSigner === i ? c.border : "#F1F5F9"}`, color: activeSigner === i ? c.text : "#94A3B8", justifyContent: "flex-start", fontSize: 13 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: c.bg, flexShrink: 0 }} />
                  <span style={{ fontWeight: activeSigner === i ? 700 : 500 }}>{c.label}</span>
                  {zones.filter((z) => z.signerIdx === i).length > 0 && (
                    <span style={{ marginLeft: "auto", background: c.bg, color: "#fff", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{zones.filter((z) => z.signerIdx === i).length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: "#F1F5F9", margin: "0 12px" }} />
          <div style={{ padding: "10px 12px" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Trang</span>
            <button onClick={() => { setShowAll(true); setVisiblePages([]); }} style={{ ...btn, width: "100%", padding: "7px 10px", marginBottom: 4, fontSize: 12, background: showAll ? "#EEF2FF" : "transparent", border: `1px solid ${showAll ? "#C7D2FE" : "#F1F5F9"}`, color: showAll ? "#4338CA" : "#94A3B8", justifyContent: "flex-start", fontWeight: showAll ? 700 : 500 }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>Tất cả
            </button>
            {allPages.map((p) => {
              const active = !showAll && visiblePages.includes(p);
              const cnt = zones.filter((z) => z.page === p).length;
              return (
                <button key={p} onClick={() => togglePage(p)} style={{ ...btn, width: "100%", padding: "7px 10px", marginBottom: 3, fontSize: 12, background: active ? "#F8FAFC" : "transparent", border: `1px solid ${active ? "#E2E8F0" : "transparent"}`, color: active ? "#475569" : "#94A3B8", justifyContent: "space-between", fontWeight: active ? 600 : 400 }}>
                  <span>Trang {p + 1}</span>
                  {cnt > 0 && <span style={{ background: "#667EEA", color: "#fff", fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{cnt}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, background: "#F1F5F9", margin: "0 12px" }} />
          <div style={{ padding: "10px 12px", flex: 1, overflow: "auto" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Hướng dẫn</span>
            {["Chọn người ký", "Kéo chuột vẽ vùng ký trên PDF", "Nhấn vùng ký → × để xóa", "Nhấn Gửi ký số → nhập PIN"].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#EEF2FF", color: "#667EEA", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid #F1F5F9" }}>
            <div style={{ padding: "9px 12px", borderRadius: 10, background: activeC.light, border: `1px solid ${activeC.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeC.bg, animation: "pulse2 1.8s infinite" }} />
              <span style={{ fontSize: 12, color: activeC.text, fontWeight: 700 }}>Đang vẽ: {activeC.label}</span>
            </div>
          </div>
        </div>

        {/* PDF viewer */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 24px", background: "#F1F5F9" }}>
          {pdfError ? (
            <div style={{ textAlign: "center", padding: 60, color: "#EF4444", fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              Không thể đọc file PDF.<div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>{pdfError}</div>
            </div>
          ) : (
            <Document file={fileUrl}
              onLoadSuccess={({ numPages: n }) => { setNumPages(n); setVisiblePages(Array.from({ length: n }, (_, i) => i)); }}
              onLoadError={(err) => { console.error(err); setPdfError(err.message); }}
              loading={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 80, color: "#94A3B8", fontSize: 14 }}><div style={{ width: 20, height: 20, border: "2px solid #E2E8F0", borderTopColor: "#667EEA", borderRadius: "50%", animation: "spin2 0.8s linear infinite" }} />Đang tải PDF...</div>}
            >
              {displayPages.map((p) => (
                <PDFPageView key={`${fileUrl}-${p}`} pageNum={p} pageCount={numPages} zones={zones} activeSigner={activeSigner} onAdd={addZone} selectedZone={selectedZone} onSelect={setSelectedZone} onDelete={deleteZone} zoom={zoom} />
              ))}
            </Document>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: 185, background: "#fff", borderLeft: "1px solid #E2E8F0", padding: "14px 12px", overflow: "auto", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Vùng ký ({zones.length})</span>
          {zones.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#CBD5E1" }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ margin: "0 auto 8px", display: "block" }}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>
              <p style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>Chưa có vùng ký.<br />Kéo chuột trên PDF.</p>
            </div>
          )}
          {zones.map((z) => {
            const c = SIGNERS[z.signerIdx % SIGNERS.length];
            return (
              <div key={z.id} onClick={() => setSelectedZone(z.id === selectedZone ? null : z.id)}
                style={{ padding: "9px 10px", borderRadius: 10, marginBottom: 6, cursor: "pointer", background: selectedZone === z.id ? c.light : "#F8FAFC", border: `1px solid ${selectedZone === z.id ? c.border : "#E2E8F0"}`, transition: "all 0.15s" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.bg }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Trang {z.page + 1}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteZone(z.id); }} style={{ background: "none", border: "none", color: "#CBD5E1", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{z.w.toFixed(1)}% × {z.h.toFixed(1)}%</div>
                <div style={{ fontSize: 10, color: c.text, marginTop: 2, fontWeight: 600 }}>{z.signerName}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}