import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function generateQrCode({
  qrType,
  url,
  text,
  productName,
  productionDate,
  expiryDate,
  packageWeight,
  batchWeight,
  logoFile, // File object từ <input type="file"/>, có thể null
}) {
  const formData = new FormData();

  if (qrType === "url") {
    if (!url) throw new Error("Vui lòng nhập URL");
    formData.append("type", "url");
    formData.append("content", url);
  } else if (qrType === "text") {
    if (!text) throw new Error("Vui lòng nhập văn bản");
    formData.append("type", "text");
    formData.append("content", text);
  } else if (qrType === "product") {
    if (!productName || !productionDate || !expiryDate || !packageWeight || !batchWeight)
      throw new Error("Vui lòng điền đầy đủ thông tin sản phẩm");
    if (new Date(expiryDate) <= new Date(productionDate))
      throw new Error("Hạn sử dụng phải sau ngày sản xuất");
    formData.append("type", "product");
    formData.append("productName", productName);
    formData.append("productionDate", productionDate);
    formData.append("expiryDate", expiryDate);
    formData.append("packageWeight", packageWeight);
    formData.append("batchWeight", batchWeight);
  } else {
    throw new Error("Loại QR không hợp lệ");
  }

  // Logo (tuỳ chọn) — chèn vào giữa QR ở backend
  if (logoFile) {
    if (!logoFile.type?.startsWith("image/")) {
      throw new Error("Logo phải là file ảnh (PNG/JPG)");
    }
    if (logoFile.size > 5 * 1024 * 1024) {
      throw new Error("Logo tối đa 5MB");
    }
    formData.append("logo", logoFile);
  }

  const res = await axios.post(`${API_BASE}/api/tools/qr/generate`, formData, {
    headers: {
      // KHÔNG set "Content-Type" bằng tay cho FormData —
      // axios/browser sẽ tự thêm boundary cho multipart/form-data.
      "ngrok-skip-browser-warning": "69420",
    },
  });

  // ✅ Kiểm tra success và lấy đúng field
  if (!res.data?.success) {
    throw new Error(res.data?.message || "Tạo QR thất bại");
  }

  let qrImage = res.data.data?.qrImage; // ← lấy đúng từ data.data
  if (!qrImage) throw new Error("Server không trả về ảnh QR");

  if (qrImage.startsWith("http")) {
    qrImage = `${qrImage}?t=${Date.now()}`;
  }
  return qrImage;
}