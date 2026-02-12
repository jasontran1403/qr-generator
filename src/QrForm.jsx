import React, { useState } from "react";
import axios from "axios";
import "./QrForm.css";

const QrForm = () => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  // Fields cho product
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
      const formData = new URLSearchParams();

      if (qrType === "url") {
        if (!url) throw new Error("Vui lòng nhập URL");
        formData.append("type", "url");
        formData.append("content", url);
      }
      else if (qrType === "text") {
        if (!text) throw new Error("Vui lòng nhập văn bản");
        formData.append("type", "text");
        formData.append("content", text);
      }
      else if (qrType === "product") {
        if (!productName || !productionDate || !expiryDate || !packageWeight || !batchWeight) {
          throw new Error("Vui lòng điền đầy đủ thông tin sản phẩm");
        }
        if (new Date(expiryDate) <= new Date(productionDate)) {
          throw new Error("Hạn sử dụng phải sau ngày sản xuất");
        }

        formData.append("type", "product");
        formData.append("productName", productName);
        formData.append("productionDate", productionDate);
        formData.append("expiryDate", expiryDate);
        formData.append("packageWeight", packageWeight);
        formData.append("batchWeight", batchWeight);
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
        qr = `${qr}?t=${Date.now()}`;
      }
      setQrImage(qr);
      setShowResult(true);
    } catch (err) {
      console.error(err);
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

  const closeResult = () => {
    setShowResult(false);
  };

  // ... handleDownload, handleQrTypeChange, closeResult giữ nguyên ...

  const renderFormContent = () => {
    if (qrType === "url") {
      return (
        <div className="form-group">
          <label htmlFor="url"><i className="fas fa-link"></i> URL</label>
          <input
            id="url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
      );
    } else if (qrType === "text") {
      return (
        <div className="form-group">
          <label htmlFor="text"><i className="fas fa-font"></i> Văn bản</label>
          <textarea
            id="text"
            placeholder="Nhập văn bản, số điện thoại, địa chỉ..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="4"
            required
            className="text-input"
          />
        </div>
      );
    } else if (qrType === "product") {
      return (
        <>
          <div className="form-group">
            <label>Tên sản phẩm</label>
            <input
              type="text"
              placeholder="Tên sản phẩm: Cheddar"
              value={productName}
              onChange={(e) => {
                const value = e.target.value;
                const filtered = value.replace(
                  /[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễếệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]/g,
                  ''
                );
                setProductName(filtered);
              }}
              onBeforeInput={(e) => {
                const char = e.data || '';
                if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễếệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]*$/.test(char)) {
                  e.preventDefault();
                }
              }}
              required
            />
          </div>
          <div className="form-group">
            <label>Ngày sản xuất</label>
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Hạn sử dụng</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              min={productionDate || undefined} // ràng buộc HTML5 cơ bản
            />
          </div>
          <div className="form-group">
            <label>Khối lượng gói</label>
            <input
              type="text"
              placeholder="Khối lượng gói: 500gr"
              value={packageWeight}
              onChange={(e) => setPackageWeight(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Khối lượng mẻ sản xuất</label>
            <input
              type="text"
              placeholder="Khối lượng mẻ sản xuất: 30 kg"
              value={batchWeight}
              onChange={(e) => setBatchWeight(e.target.value)}
              required
            />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="qr-container">
      <div className="qr-card">
        <div className="qr-header">
          <div className="qr-icon"><i className="fas fa-qrcode"></i></div>
          <h2>Tạo QR Code</h2>
          <p>Chọn loại QR code bạn muốn tạo</p>
        </div>

        <div className="qr-type-selector">
          <button
            className={`type-btn ${qrType === "url" ? "active" : ""}`}
            onClick={() => handleQrTypeChange("url")}
          >
            <i className="fas fa-link"></i> URL
          </button>
          <button
            className={`type-btn ${qrType === "text" ? "active" : ""}`}
            onClick={() => handleQrTypeChange("text")}
          >
            <i className="fas fa-font"></i> Text
          </button>
          <button
            className={`type-btn ${qrType === "product" ? "active" : ""}`}
            onClick={() => handleQrTypeChange("product")}
          >
            <i className="fas fa-cheese"></i> Sản phẩm
          </button>
        </div>

        <form onSubmit={handleSubmit} className="qr-form">
          {renderFormContent()}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Đang tạo...
              </>
            ) : (
              <>
                <i className="fas fa-plus-circle"></i> Tạo QR Code
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Phần hiển thị kết quả giữ nguyên, chỉ thêm preview nội dung phù hợp */}
        {showResult && qrImage && (
          <div className="qr-overlay">
            <div className="qr-result-modal">
              <button className="close-btn" onClick={closeResult}>
                <i className="fas fa-times"></i>
              </button>
              <div className="result-header">
                <i className="fas fa-check-circle"></i>
                <h3>QR Code đã được tạo!</h3>
              </div>
              <div className="qr-image-container">
                <img src={qrImage} alt="QR Code" className="qr-image" />
                <div className="qr-content-preview">
                  <p><strong>Nội dung:</strong></p>
                  {qrType === "url" && <code>{url}</code>}
                  {qrType === "text" && <code>{text}</code>}
                  {qrType === "product" && (
                    <code>
                      Sản phẩm: {productName}<br />
                      NSX: {productionDate}<br />
                      HSD: {expiryDate}<br />
                      KL gói: {packageWeight}<br />
                      KL mẻ: {batchWeight}
                    </code>
                  )}
                </div>

                <div className="qr-actions">
                  <button
                    className="action-btn close-modal-btn"
                    onClick={closeResult}
                  >
                    <i className="fas fa-times"></i> Đóng
                  </button>
                  <button
                    className="action-btn download-btn"
                    onClick={handleDownload}
                  >
                    <i className="fas fa-download"></i> Tải
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