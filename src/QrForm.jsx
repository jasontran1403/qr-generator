import React, { useState } from "react";
import axios from "axios";
import "./QrForm.css";

const QrForm = () => {
  const [url, setUrl] = useState("");
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
      formData.append("websiteName", "");

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

      // thêm timestamp để tránh cache
      const timestamp = Date.now();
      setQrImage(`${res.data.qrImage}?t=${timestamp}`);
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
    link.download = `qr_${Date.now()}.png`; // tên file theo thời gian
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <button
                  className="action-btn download-btn"
                  type="button"
                  onClick={handleDownload}
                >
                  <i className="fas fa-download"></i> Tải xuống
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
