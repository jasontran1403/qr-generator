import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { fetchReport } from "../services/rawDataService";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const CORRECT_PASSWORD = "longlong";
const SESSION_MS       = 5 * 60 * 1000;  // 5 phut

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toISO(d) {
  if (!d) return "";
  // Dung local date, KHONG dung toISOString() vi se bi lech timezone UTC+7
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function Calendar({ viewDate, setViewDate, start, end, hovered, onDayClick, onDayHover }) {
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(new Date(year, month, d));

  const inRange = (d) => {
    if (!d) return false;
    const hi = hovered || end;
    if (start && hi) {
      const lo = start < hi ? start : hi;
      const hi2 = start < hi ? hi : start;
      return d >= lo && d <= hi2;
    }
    return false;
  };

  const isStart   = (d) => d && start && d.toDateString() === start.toDateString();
  const isEnd     = (d) => d && end   && d.toDateString() === end.toDateString();
  const isHovered = (d) => d && hovered && !end && d.toDateString() === hovered.toDateString();
  const today     = new Date(); today.setHours(0,0,0,0);
  const isFuture  = (d) => d && d > today;

  return (
    <div style={{ width: 240 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 18, lineHeight: 1, padding: "2px 6px", borderRadius: 6 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 18, lineHeight: 1, padding: "2px 6px", borderRadius: 6 }}>›</button>
      </div>
      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_NAMES.map(n => (
          <div key={n} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94A3B8", padding: "2px 0" }}>{n}</div>
        ))}
      </div>
      {/* Cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const future  = isFuture(d);
          const sel     = isStart(d) || isEnd(d);
          const inR     = inRange(d);
          const hov     = isHovered(d);
          return (
            <div key={d.toDateString()}
              onClick={() => !future && onDayClick(d)}
              onMouseEnter={() => !future && onDayHover(d)}
              onMouseLeave={() => onDayHover(null)}
              style={{
                height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: sel ? 8 : inR ? 0 : 6,
                background: sel ? "#667EEA" : inR ? "#EEF2FF" : hov ? "#F1F5F9" : "transparent",
                color: sel ? "#fff" : future ? "#CBD5E1" : inR ? "#4338CA" : "#374151",
                fontSize: 12, fontWeight: sel ? 700 : 500,
                cursor: future ? "not-allowed" : "pointer",
                transition: "all 0.1s",
                borderTopLeftRadius:  (isStart(d) || (!start && inR)) ? 8 : inR ? 0 : 6,
                borderBottomLeftRadius: (isStart(d) || (!start && inR)) ? 8 : inR ? 0 : 6,
                borderTopRightRadius:  (isEnd(d) || (hov && !end)) ? 8 : inR ? 0 : 6,
                borderBottomRightRadius: (isEnd(d) || (hov && !end)) ? 8 : inR ? 0 : 6,
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Date Range Picker ────────────────────────────────────────────────────────
function DateRangePicker({ value, onChange }) {
  const [open, setOpen]       = useState(false);
  const [hovered, setHovered] = useState(null);
  const [viewL, setViewL]     = useState(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); return d; });
  const [viewR, setViewR]     = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const ref = useRef(null);

  const { start, end } = value;

  const handleDay = (d) => {
    if (!start || (start && end)) {
      onChange({ start: d, end: null });
    } else {
      if (d < start) onChange({ start: d, end: start });
      else           onChange({ start, end: d });
      setOpen(false);
    }
  };

  const label = start && end
    ? `${fmt(start)} → ${fmt(end)}`
    : start
    ? `${fmt(start)} → ...`
    : "Chọn khoảng thời gian";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 14px", borderRadius: 10,
          border: `1.5px solid ${open ? "#667EEA" : "#E2E8F0"}`,
          background: "#fff", cursor: "pointer", minWidth: 280,
          fontSize: 13, color: start ? "#1E293B" : "#94A3B8",
          fontWeight: start ? 600 : 400,
          boxShadow: open ? "0 0 0 3px #667EEA18" : "none",
          transition: "all 0.15s",
        }}>
        <svg width="14" height="14" fill="none" stroke={open ? "#667EEA" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {label}
        {(start || end) && (
          <span onClick={(e) => { e.stopPropagation(); onChange({ start: null, end: null }); }}
            style={{ marginLeft: "auto", color: "#CBD5E1", fontSize: 16, lineHeight: 1, cursor: "pointer" }}>×</span>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 1000,
          background: "#fff", borderRadius: 16, padding: 20,
          boxShadow: "0 8px 32px #00000018, 0 0 0 1px #E2E8F0",
          display: "flex", gap: 24,
        }}>
          <Calendar viewDate={viewL} setViewDate={setViewL} start={start} end={end} hovered={hovered} onDayClick={handleDay} onDayHover={setHovered} />
          <div style={{ width: 1, background: "#F1F5F9" }} />
          <Calendar viewDate={viewR} setViewDate={setViewR} start={start} end={end} hovered={hovered} onDayClick={handleDay} onDayHover={setHovered} />
        </div>
      )}
    </div>
  );
}

// ─── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ onSuccess }) {
  const [pw, setPw]       = useState("");
  const [show, setShow]   = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (pw === CORRECT_PASSWORD) onSuccess();
    else { setError("Mật khẩu không đúng."); setPw(""); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg,#F8FAFF 0%,#EEF2FF 55%,#F0FDF4 100%)",
    }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 36px", width: 360,
        boxShadow: "0 8px 40px #00000012, 0 0 0 1px #E2E8F0",
        animation: "fadeUp 0.35s ease",
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#667EEA,#764BA2)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: "#1E293B", margin: "0 0 6px" }}>Khu vực riêng tư</h2>
        <p style={{ textAlign: "center", fontSize: 13, color: "#64748B", margin: "0 0 24px" }}>Nhập mật khẩu để truy cập dữ liệu báo cáo</p>

        <div style={{ position: "relative", marginBottom: error ? 8 : 20 }}>
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={e => { setPw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Mật khẩu..."
            autoFocus
            style={{
              width: "100%", padding: "11px 44px 11px 14px", borderRadius: 10,
              border: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`,
              background: error ? "#FFF5F5" : "#F8FAFC",
              fontSize: 14, outline: "none", boxSizing: "border-box",
              letterSpacing: show ? 0 : 4,
            }}
          />
          <button onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            {show
              ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>

        {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, display: "flex", gap: 5, alignItems: "center" }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}
        </div>}

        <button onClick={submit} disabled={!pw}
          style={{
            width: "100%", padding: "11px", borderRadius: 10, border: "none",
            background: pw ? "linear-gradient(135deg,#667EEA,#764BA2)" : "#E2E8F0",
            color: pw ? "#fff" : "#94A3B8",
            fontWeight: 700, fontSize: 14, cursor: pw ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: pw ? "0 4px 12px #667EEA30" : "none",
            transition: "all 0.15s",
          }}>
          Vào xem dữ liệu
        </button>
      </div>
    </div>
  );
}

// ─── PDF Preview ──────────────────────────────────────────────────────────────
function PDFPreview({ blobUrl, filename, onClose, remaining, isWarning, onLogout, fmtRemaining }) {
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom]         = useState(90);
  const btn = { border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, borderRadius: 8, transition: "all 0.15s", fontWeight: 600 };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
        background: "#fff", borderBottom: "1px solid #E2E8F0", flexShrink: 0,
      }}>
        <button onClick={onClose}
          style={{ ...btn, padding: "6px 12px", background: "#F1F5F9", color: "#64748B", fontSize: 12 }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Quay lại
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
          <svg width="12" height="12" fill="#EF4444" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename}</span>
        </div>
        {numPages > 0 && <span style={{ fontSize: 12, color: "#94A3B8" }}>{numPages} trang</span>}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Session countdown */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 8,
            background: isWarning ? "#FEF2F2" : "#F0FDF4",
            border: `1px solid ${isWarning ? "#FECACA" : "#BBF7D0"}`,
            fontSize: 12, fontWeight: 700,
            color: isWarning ? "#DC2626" : "#15803D",
            transition: "all 0.3s",
          }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {fmtRemaining()}
          </div>
          <button onClick={onLogout}
            style={{ ...btn, padding: "5px 10px", background: "none", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: 12 }}>
            Thoát
          </button>
          {/* Zoom */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "4px 8px" }}>
            <button onClick={() => setZoom(z => Math.max(40, z - 10))} style={{ ...btn, background: "none", color: "#64748B", padding: "0 3px", fontSize: 16 }}>−</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", minWidth: 34, textAlign: "center" }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ ...btn, background: "none", color: "#64748B", padding: "0 3px", fontSize: 16 }}>+</button>
          </div>
          {/* Download */}
          <button onClick={handleDownload}
            style={{ ...btn, padding: "7px 14px", fontSize: 13, background: "linear-gradient(135deg,#667EEA,#764BA2)", color: "#fff", boxShadow: "0 4px 12px #667EEA30" }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Tải PDF
          </button>
        </div>
      </div>

      {/* PDF scroll area */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px", background: "#F1F5F9" }}>
        <style>{`@keyframes spin3{to{transform:rotate(360deg)}}`}</style>
        <Document
          file={blobUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 80, color: "#94A3B8", fontSize: 14 }}>
              <div style={{ width: 20, height: 20, border: "2px solid #E2E8F0", borderTopColor: "#667EEA", borderRadius: "50%", animation: "spin3 0.8s linear infinite" }} />
              Đang tải PDF...
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#94A3B8", textTransform: "uppercase", marginBottom: 8 }}>
                Trang {i + 1} / {numPages}
              </div>
              <div style={{ boxShadow: "0 2px 8px #94A3B820, 0 8px 32px #94A3B818, 0 0 0 1px #E2E8F0", borderRadius: 3, lineHeight: 0 }}>
                <Page pageNumber={i + 1} width={Math.round(595 * zoom / 100)} renderAnnotationLayer={false} renderTextLayer={false} />
              </div>
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RawDataPage() {
  const [authed, setAuthed]       = useState(false);
  const [range, setRange]         = useState({ start: null, end: null });
  const [reportType, setType]     = useState("pos");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [result, setResult]       = useState(null);  // {blobUrl, filename}
  const [remaining, setRemaining] = useState(SESSION_MS);
  const expireAtRef               = useRef(null);   // absolute timestamp het han
  const countdownRef              = useRef(null);
  const navigate                  = useNavigate();

  const logout = useCallback(() => {
    clearInterval(countdownRef.current);
    expireAtRef.current = null;
    setAuthed(false);
    setResult(null);
    setRange({ start: null, end: null });
    navigate("/");
  }, [navigate]);

  // Khoi dong session timer khi dang nhap thanh cong
  useEffect(() => {
    if (!authed) return;

    // Luu absolute expiry time - khong bi anh huong boi tab hidden
    expireAtRef.current = Date.now() + SESSION_MS;
    setRemaining(SESSION_MS);

    // Tick moi 500ms, tinh remaining dua tren wall clock thuc te
    countdownRef.current = setInterval(() => {
      const left = expireAtRef.current - Date.now();
      if (left <= 0) {
        clearInterval(countdownRef.current);
        logout();
      } else {
        setRemaining(left);
      }
    }, 500);

    return () => clearInterval(countdownRef.current);
  }, [authed, logout]);

  // Format mm:ss
  const fmtRemaining = () => {
    const total = Math.ceil(remaining / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const isWarning = remaining <= 60_000;  // do vang khi con 1 phut

  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;

  const canQuery = range.start && range.end;

  const handleQuery = async () => {
    if (!canQuery || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      // Neu end_date >= hom nay (ngay chua ket thuc), tru 1 ngay
      // Vi du: hom nay 30/4, end=30/4 -> chi lay den 29/4
      // Vi du: hom nay 7/5,  end=30/4 -> giu nguyen 30/4 (da la qua khu)
      const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
      const effectiveEnd  = new Date(range.end); effectiveEnd.setHours(0, 0, 0, 0);
      if (effectiveEnd >= todayMidnight) {
        effectiveEnd.setDate(effectiveEnd.getDate() - 1);
      }
      const data = await fetchReport({
        type:      reportType,
        startDate: toISO(range.start),
        endDate:   toISO(effectiveEnd),
      });
      setResult(data);
    } catch (e) {
      setError(e.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  const btn = { border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, borderRadius: 8, transition: "all 0.15s", fontWeight: 600 };

  // ── Nếu đã có kết quả, show preview ──────────────────────────────────────
  if (result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F8FAFC" }}>
        <style>{`.react-pdf__Page{display:block!important}.react-pdf__Page canvas{display:block;border-radius:3px}`}</style>
        <PDFPreview
          blobUrl={result.blobUrl}
          filename={result.filename}
          onClose={() => setResult(null)}
          remaining={remaining}
          isWarning={isWarning}
          onLogout={logout}
          fmtRemaining={fmtRemaining}
        />
      </div>
    );
  }

  // ── Form nhập ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "linear-gradient(160deg,#F8FAFF 0%,#EEF2FF 55%,#F0FDF4 100%)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin3{to{transform:rotate(360deg)}}
      `}</style>

      {/* Minimal top bar */}
      <div style={{
        height: 54, background: "#fff", borderBottom: "1px solid #E2E8F0",
        padding: "0 24px", display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 1px 3px #0000000a", flexShrink: 0,
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#667EEA,#764BA2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Raw Data</span>
        <span style={{ fontSize: 12, color: "#94A3B8", padding: "3px 8px", background: "#F1F5F9", borderRadius: 6, fontWeight: 600 }}>Internal</span>
      </div>

      {/* Session countdown */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 8,
          background: isWarning ? "#FEF2F2" : "#F0FDF4",
          border: `1px solid ${isWarning ? "#FECACA" : "#BBF7D0"}`,
          fontSize: 12, fontWeight: 700,
          color: isWarning ? "#DC2626" : "#15803D",
          transition: "all 0.3s",
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {fmtRemaining()}
        </div>
        <button onClick={logout}
          style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 10px", fontSize: 12, color: "#94A3B8", cursor: "pointer", fontWeight: 600 }}>
          Thoát
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 560, animation: "fadeUp 0.35s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1E293B", margin: "0 0 8px", letterSpacing: -0.5 }}>Xuất báo cáo dữ liệu</h1>
            <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Chọn khoảng thời gian và loại báo cáo để tạo file PDF</p>
          </div>

          <div style={{
            background: "#fff", borderRadius: 20, padding: 32,
            boxShadow: "0 4px 24px #00000010, 0 0 0 1px #E2E8F0",
          }}>
            {/* Type selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
                Loại báo cáo
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { value: "pos",       label: "📋 POS",      sub: "Fake 50%" },
                  { value: "wholesale", label: "📦 Sỉ / Lẻ",  sub: "Fake 100%" },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setType(opt.value)}
                    style={{
                      flex: 1, padding: "12px 16px", borderRadius: 12,
                      border: `2px solid ${reportType === opt.value ? "#667EEA" : "#E2E8F0"}`,
                      background: reportType === opt.value ? "#EEF2FF" : "#F8FAFC",
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: reportType === opt.value ? "#4338CA" : "#374151" }}>{opt.label}</span>
                    <span style={{ fontSize: 11, color: reportType === opt.value ? "#6366F1" : "#94A3B8", fontWeight: 500 }}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
                Khoảng thời gian <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <DateRangePicker value={range} onChange={setRange} />
              {range.start && range.end && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="12" height="12" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {Math.round((range.end - range.start) / 86400000) + 1} ngày
                  &nbsp;·&nbsp;{fmt(range.start)} → {fmt(range.end)}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                background: "#FEF2F2", border: "1px solid #FECACA",
                fontSize: 13, color: "#DC2626", display: "flex", gap: 8, alignItems: "flex-start",
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleQuery} disabled={!canQuery || loading}
              style={{
                ...btn,
                width: "100%", padding: "13px", justifyContent: "center",
                fontSize: 14,
                background: canQuery && !loading
                  ? "linear-gradient(135deg,#667EEA,#764BA2)"
                  : "#E2E8F0",
                color: canQuery && !loading ? "#fff" : "#94A3B8",
                cursor: canQuery && !loading ? "pointer" : "not-allowed",
                boxShadow: canQuery ? "0 4px 16px #667EEA30" : "none",
                borderRadius: 12,
              }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid #ffffff40", borderTopColor: "#fff", borderRadius: "50%", animation: "spin3 0.8s linear infinite" }} />
                  Đang tạo báo cáo...
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Xuất báo cáo
                </>
              )}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#CBD5E1", marginTop: 16 }}>
            🔒 Dữ liệu nội bộ — không chia sẻ
          </p>
        </div>
      </div>
    </div>
  );
}