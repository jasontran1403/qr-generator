import React, { useState } from "react";
import axios from "axios";
import "./QrForm.css";

const QrForm = () => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [qrType, setQrType] = useState("url"); // "url" hoặc "text"
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
      const formData = new URLSearchParams();
      
      if (qrType === "url") {
        formData.append("link", url);
        formData.append("websiteName", "");
      } else {
        formData.append("link", text);
        formData.append("websiteName", "text");
      }

      const res = await axios.post(
        "https://api.glossify.salon/api/v1/auth/generate",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );

      let qr = res.data.qrImage;
      if (qr.startsWith("http")) {
        // Trường hợp server trả về URL
        qr = `${qr}?t=${Date.now()}`;
      }
      // Nếu là base64 (data:image/png;base64,...) thì giữ nguyên
      setQrImage(qr);
      setShowResult(true);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tạo QR code. Vui lòng thử lại.");
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

  const closeResult = () => {
    setShowResult(false);
  };

  return (
    <div className="qr-container">
      <div className="qr-card">
        <div className="qr-header">
          <div className="qr-icon">
            <i className="fas fa-qrcode"></i>
          </div>
          <h2>Tạo QR Code</h2>
          <p>Chọn loại QR code bạn muốn tạo</p>
        </div>

        {/* Lựa chọn loại QR code */}
        <div className="qr-type-selector">
          <button
            type="button"
            className={`type-btn ${qrType === "url" ? "active" : ""}`}
            onClick={() => handleQrTypeChange("url")}
          >
            <i className="fas fa-link"></i>
            QR URL
          </button>
          <button
            type="button"
            className={`type-btn ${qrType === "text" ? "active" : ""}`}
            onClick={() => handleQrTypeChange("text")}
          >
            <i className="fas fa-font"></i>
            QR Text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="qr-form">
          {qrType === "url" ? (
            <div className="form-group">
              <label htmlFor="url">
                <i className="fas fa-link"></i> URL
              </label>
              <input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="text">
                <i className="fas fa-font"></i> Văn bản
              </label>
              <textarea
                id="text"
                placeholder="Nhập văn bản, số điện thoại, địa chỉ, hoặc bất kỳ nội dung nào..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows="4"
                required
                className="text-input"
              />
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Đang tạo QR...
              </>
            ) : (
              <>
                <i className="fas fa-plus-circle"></i>
                Tạo QR Code
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {/* Overlay hiển thị kết quả QR */}
        {showResult && qrImage && (
          <div className="qr-overlay">
            <div className="qr-result-modal">
              <button 
                className="close-btn"
                onClick={closeResult}
              >
                <i className="fas fa-times"></i>
              </button>
              
              <div className="result-header">
                <i className="fas fa-check-circle"></i>
                <h3>QR Code đã được tạo thành công!</h3>
              </div>
              
              <div className="qr-image-container">
                <img src={qrImage} alt="QR Code" className="qr-image" />
                
                <div className="qr-content-preview">
                  <p><strong>Nội dung:</strong></p>
                  <code>{qrType === "url" ? url : text}</code>
                </div>
                
                <div className="qr-actions">
                  <button
                    className="action-btn download-btn"
                    type="button"
                    onClick={handleDownload}
                  >
                    <i className="fas fa-download"></i> Tải xuống
                  </button>
                  <button
                    className="action-btn close-modal-btn"
                    type="button"
                    onClick={closeResult}
                  >
                    <i className="fas fa-times"></i> Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrForm;