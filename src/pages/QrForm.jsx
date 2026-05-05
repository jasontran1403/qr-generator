import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { generateQrCode } from "../services/qrService";

const QrForm = () => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [productName, setProductName] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [packageWeight, setPackageWeight] = useState("");
  const [batchWeight, setBatchWeight] = useState("");
  const [qrType, setQrType] = useState("url");
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQrImage(null);
    setShowResult(false);
    try {
      const qr = await generateQrCode({
        qrType, url, text,
        productName, productionDate, expiryDate,
        packageWeight, batchWeight,
      });
      setQrImage(qr);
      setShowResult(true);
    } catch (err) {
      setError(err.message || "Lỗi khi tạo QR code. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `qr_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQrTypeChange = (type) => {
    setQrType(type);
    setQrImage(null);
    setError("");
    setShowResult(false);
  };

  // ── Shared styles ──
  const btn = {
    border: "none", cursor: "pointer", fontFamily: "inherit",
    display: "flex", alignItems: "center", gap: 6,
    borderRadius: 8, transition: "all 0.15s", fontWeight: 600,
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #E2E8F0", background: "#F8FAFC",
    fontSize: 14, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", transition: "border 0.15s",
  };

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#475569",
    letterSpacing: 0.2, display: "block", marginBottom: 6,
  };

  const typeButtons = [
    { key: "url", label: "URL", icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg> },
    { key: "text", label: "Text", icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg> },
    { key: "product", label: "Sản phẩm", icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
  ];

  const renderFields = () => {
    if (qrType === "url") return (
      <div>
        <label style={labelStyle}>URL</label>
        <input style={inputStyle} type="url" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} required />
      </div>
    );
    if (qrType === "text") return (
      <div>
        <label style={labelStyle}>Văn bản</label>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} placeholder="Nhập văn bản, số điện thoại, địa chỉ..." value={text} onChange={e => setText(e.target.value)} rows={4} required />
      </div>
    );
    if (qrType === "product") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Tên sản phẩm", value: productName, set: setProductName, placeholder: "VD: Cheddar", type: "text" },
          { label: "Ngày sản xuất", value: productionDate, set: setProductionDate, placeholder: "", type: "date" },
          { label: "Hạn sử dụng", value: expiryDate, set: setExpiryDate, placeholder: "", type: "date", min: productionDate },
          { label: "Khối lượng gói", value: packageWeight, set: setPackageWeight, placeholder: "VD: 500gr", type: "text" },
          { label: "Khối lượng mẻ sản xuất", value: batchWeight, set: setBatchWeight, placeholder: "VD: 30 kg", type: "text" },
        ].map(f => (
          <div key={f.label}>
            <label style={labelStyle}>{f.label}</label>
            <input style={inputStyle} type={f.type} placeholder={f.placeholder} value={f.value} min={f.min} onChange={e => f.set(e.target.value)} required />
          </div>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .qr-input:focus { border-color: #667EEA !important; background: #fff !important; box-shadow: 0 0 0 3px #667EEA18 !important; }
      `}</style>

      <Navbar />

      {/* Body */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 20px",
        background: "linear-gradient(160deg, #F8FAFF 0%, #EEF2FF 55%, #F0FDF4 100%)",
      }}>
        <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.4s ease" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: "linear-gradient(135deg,#667EEA,#764BA2)",
              margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 12px 32px #667EEA40", animation: "floatY 3s ease-in-out infinite",
            }}>
              <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 8px", letterSpacing: -0.6 }}>Tạo QR Code</h1>
            <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Chọn loại QR code bạn muốn tạo</p>
          </div>

          {/* Card */}
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 28px",
            boxShadow: "0 4px 24px #00000010, 0 0 0 1px #E2E8F0",
          }}>
            {/* Type selector */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 24,
              background: "#F8FAFC", borderRadius: 12, padding: 4,
              border: "1px solid #E2E8F0",
            }}>
              {typeButtons.map(t => {
                const active = qrType === t.key;
                return (
                  <button key={t.key} onClick={() => handleQrTypeChange(t.key)} style={{
                    ...btn, flex: 1, justifyContent: "center",
                    padding: "9px 12px", fontSize: 13,
                    background: active ? "linear-gradient(135deg,#667EEA,#764BA2)" : "transparent",
                    color: active ? "#fff" : "#94A3B8",
                    boxShadow: active ? "0 2px 8px #667EEA30" : "none",
                    borderRadius: 8,
                  }}>
                    {t.icon}{t.label}
                  </button>
                );
              })}
            </div>

            {/* Fields */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {renderFields()}

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 10,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  color: "#DC2626", fontSize: 13,
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                ...btn, justifyContent: "center", width: "100%",
                padding: "13px", fontSize: 14,
                background: loading ? "#E2E8F0" : "linear-gradient(135deg,#667EEA,#764BA2)",
                color: loading ? "#94A3B8" : "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 14px #667EEA30",
                borderRadius: 10, marginTop: 4,
              }}>
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid #C7D2FE", borderTopColor: "#667EEA", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                    Tạo QR Code
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[{ icon: "🔗", label: "URL / Text" }, { icon: "📦", label: "Thông tin sản phẩm" }, { icon: "⬇️", label: "Tải về PNG" }].map(f => (
              <div key={f.label} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 20,
                background: "#fff", border: "1px solid #E2E8F0",
                fontSize: 12, color: "#64748B", fontWeight: 600,
              }}>
                <span>{f.icon}</span>{f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && qrImage && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, backdropFilter: "blur(2px)", animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, padding: "32px 28px",
            width: "90vw", maxWidth: 440, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 60px #0000002a, 0 0 0 1px #E2E8F0",
            animation: "slideUp 0.25s ease", position: "relative",
          }}>
            {/* Close */}
            <button onClick={() => setShowResult(false)} style={{
              position: "absolute", top: 16, right: 16,
              width: 32, height: 32, borderRadius: "50%",
              background: "#F1F5F9", border: "1px solid #E2E8F0",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B", fontSize: 16,
            }}>×</button>

            {/* Success icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "#F0FDF4", border: "2px solid #86EFAC",
                margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: "0 0 4px" }}>QR Code đã được tạo!</h3>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Quét hoặc tải về để sử dụng</p>
            </div>

            {/* QR Image */}
            <div style={{
              background: "#F8FAFC", borderRadius: 16, padding: "20px",
              border: "1px solid #E2E8F0", textAlign: "center", marginBottom: 16,
            }}>
              <img src={qrImage} alt="QR Code" style={{
                maxWidth: 220, width: "100%", borderRadius: 12,
                border: "1px solid #E2E8F0", marginBottom: 16,
              }} />
              <div style={{
                background: "#fff", borderRadius: 10, padding: "12px 14px",
                border: "1px solid #E2E8F0", textAlign: "left",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Nội dung</div>
                <code style={{ fontSize: 12, color: "#1E293B", whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "monospace", lineHeight: 1.6, display: "block" }}>
                  {qrType === "url" && url}
                  {qrType === "text" && text}
                  {qrType === "product" && `Sản phẩm: ${productName}\nNSX: ${productionDate}\nHSD: ${expiryDate}\nKL gói: ${packageWeight}\nKL mẻ: ${batchWeight}`}
                </code>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowResult(false)} style={{
                ...btn, flex: 1, justifyContent: "center", padding: "11px",
                background: "#F1F5F9", color: "#475569", fontSize: 13, borderRadius: 10,
              }}>
                Đóng
              </button>
              <button onClick={handleDownload} style={{
                ...btn, flex: 2, justifyContent: "center", padding: "11px",
                background: "linear-gradient(135deg,#667EEA,#764BA2)", color: "#fff",
                fontSize: 13, borderRadius: 10, boxShadow: "0 4px 12px #667EEA30",
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Tải về PNG
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default QrForm;