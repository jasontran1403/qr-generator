import React, { useState } from "react";
import axios from "axios";
import "./QrForm.css"; // Tạo file CSS riêng

const QrForm = () => {
  const [url, setUrl] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQrImage(null);

    try {
      const formData = new URLSearchParams();
      formData.append("link", url);
      formData.append("websiteName", websiteName);

      const res = await axios.post(
        "https://overenthusiastically-caespitose-allegra.ngrok-free.app/api/v1/auth/generate",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );

      setQrImage(res.data.qrImage);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tạo QR code. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-container">
      <div className="qr-card">
        <div className="qr-header">
          <div className="qr-icon">
            <i className="fas fa-qrcode"></i>
          </div>
          <h2>Tạo QR Code</h2>
          <p>Nhập thông tin website để tạo mã QR</p>
        </div>

        <form onSubmit={handleSubmit} className="qr-form">
          <div className="form-group">
            <label htmlFor="websiteName">
              <i className="fas fa-globe"></i> Tên website
            </label>
            <input
              id="websiteName"
              type="text"
              placeholder="Ví dụ: Google, Facebook..."
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
              required
            />
          </div>

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

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
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

        {qrImage && (
          <div className="qr-result">
            <div className="result-header">
              <i className="fas fa-check-circle"></i>
              <h3>QR Code đã được tạo thành công!</h3>
            </div>
            <div className="qr-image-container">
              <img src={qrImage} alt="QR Code" className="qr-image" />
              <div className="qr-actions">
                <button className="action-btn download-btn">
                  <i className="fas fa-download"></i> Tải xuống
                </button>
                <button className="action-btn share-btn">
                  <i className="fas fa-share-alt"></i> Chia sẻ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrForm;