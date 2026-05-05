import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function generateQrCode({ qrType, url, text, productName, productionDate, expiryDate, packageWeight, batchWeight }) {
  const formData = new URLSearchParams();

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
  }

  const res = await axios.post(`${API_BASE}/api/generate`, formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "ngrok-skip-browser-warning": "69420",
    },
  });

  let qrImage = res.data.qrImage;
  if (qrImage.startsWith("http")) qrImage = `${qrImage}?t=${Date.now()}`;
  return qrImage;
}