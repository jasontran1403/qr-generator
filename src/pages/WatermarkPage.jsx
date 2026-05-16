import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";

export default function WatermarkPage() {
  const [activeTab, setActiveTab] = useState("image");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [watermarkImg, setWatermarkImg] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    x: 50,
    y: 70,
    scale: 0.28,
    rotation: 0,
    opacity: 1,
  });

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);

  const isDragging = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const API_BASE = import.meta.env.VITE_API_BASE;

  // Load Watermark
  useEffect(() => {
    fetch(`${API_BASE}/api/watermark/logo`)
      .then(res => res.blob())
      .then(blob => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => setWatermarkImg(img);
      })
      .catch(err => console.error(err));
  }, []);

  // Reset file khi chuyển tab
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setFile(null);
      setPreviewUrl(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (activeTab === "image" && !selectedFile.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh!");
      return;
    }
    if (activeTab === "video" && !selectedFile.type.startsWith("video/")) {
      alert("Vui lòng chọn file video!");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError("");
  };

  // ==================== DRAW WATERMARK ====================
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !watermarkImg) return;

    const ctx = canvas.getContext("2d");

    if (activeTab === "image" && previewUrl) {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        drawOverlay(ctx, img.width, img.height);
      };
      img.src = previewUrl;
    } else if (activeTab === "video" && videoRef.current) {
      const video = videoRef.current;
      if (video.videoWidth === 0) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      drawOverlay(ctx, video.videoWidth, video.videoHeight);
    }
  }, [previewUrl, watermarkImg, settings, activeTab]);

  const drawOverlay = (ctx, width, height) => {
    ctx.save();
    ctx.globalAlpha = settings.opacity;

    const wmWidth = width * settings.scale;
    const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;

    const centerX = (settings.x / 100) * width;
    const centerY = (settings.y / 100) * height;

    ctx.translate(centerX, centerY);
    ctx.rotate((settings.rotation * Math.PI) / 180);
    ctx.drawImage(watermarkImg, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
    ctx.restore();
  };

  useEffect(() => {
    drawWatermark();
  }, [drawWatermark]);

  // Video redraw loop
  useEffect(() => {
    if (activeTab === "video" && videoRef.current) {
      const video = videoRef.current;
      const loop = () => {
        drawWatermark();
        animationRef.current = requestAnimationFrame(loop);
      };

      video.addEventListener("play", loop);
      video.addEventListener("pause", () => cancelAnimationFrame(animationRef.current));
      video.addEventListener("seeked", drawWatermark);

      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [activeTab, drawWatermark]);

  // ==================== DRAG ====================
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleMouseDown = (e) => {
    if (!watermarkImg) return;
    const pos = getMousePos(e);
    const wmW = settings.scale * 100;
    const wmH = wmW * (watermarkImg.height / watermarkImg.width);

    if (Math.abs(pos.x - settings.x) < wmW / 1.4 && Math.abs(pos.y - settings.y) < wmH / 1.4) {
      isDragging.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      canvasRef.current.style.cursor = "grabbing";

      document.addEventListener("mousemove", handleGlobalMove);
      document.addEventListener("mouseup", handleGlobalUp);
    }
  };

  const handleGlobalMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = (e.clientX - lastMouseRef.current.x) * (100 / canvasRef.current.getBoundingClientRect().width);
    const deltaY = (e.clientY - lastMouseRef.current.y) * (100 / canvasRef.current.getBoundingClientRect().height);

    setSettings(prev => ({
      ...prev,
      x: Math.max(5, Math.min(95, prev.x + deltaX)),
      y: Math.max(5, Math.min(95, prev.y + deltaY)),
    }));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleGlobalUp = () => {
    isDragging.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = "default";
    document.removeEventListener("mousemove", handleGlobalMove);
    document.removeEventListener("mouseup", handleGlobalUp);
  };

  const handleMouseMoveOnCanvas = (e) => {
    if (isDragging.current) return;
    const pos = getMousePos(e);
    const wmW = settings.scale * 100;
    const wmH = wmW * (watermarkImg?.height / watermarkImg?.width || 1);

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 
        Math.abs(pos.x - settings.x) < wmW / 1.4 && Math.abs(pos.y - settings.y) < wmH / 1.4 
          ? "grab" 
          : "default";
    }
  };

  // Save
  const handleSave = async () => {
    if (!file) return;
    setSaveLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("settings", JSON.stringify(settings));
    formData.append("type", activeTab);

    try {
      const res = await fetch(`${API_BASE}/api/watermark/add`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Lỗi server");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeTab === "video" ? `watermarked_${Date.now()}.mp4` : `watermarked_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F8FAFC" }}>
      <Navbar rightSlot={
        <button
          onClick={handleSave}
          disabled={!file || saveLoading}
          style={{
            padding: "9px 24px",
            background: file && !saveLoading ? "linear-gradient(135deg,#667EEA,#764BA2)" : "#E2E8F0",
            color: file && !saveLoading ? "#fff" : "#94A3B8",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {saveLoading ? "Đang xử lý..." : `💾 Lưu ${activeTab === "image" ? "Ảnh" : "Video"}`}
        </button>
      } />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Tab */}
        <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 20px" }}>
          {["image", "video"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: "16px 40px",
                fontSize: "15px",
                fontWeight: 600,
                border: "none",
                background: "none",
                borderBottom: activeTab === tab ? "3px solid #667EEA" : "3px solid transparent",
                color: activeTab === tab ? "#4338CA" : "#64748B",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab === "image" ? "📷 Ảnh" : "🎥 Video"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex" }}>
          {/* Sidebar */}
          <div style={{ width: 340, background: "#fff", borderRight: "1px solid #E2E8F0", padding: 24 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #CBD5E1",
                borderRadius: 12,
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                background: "#F8FAFC",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = "#667EEA"}
              onMouseOut={(e) => e.currentTarget.style.borderColor = "#CBD5E1"}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <div style={{ fontWeight: 600, color: "#1E293B" }}>Chọn file {activeTab === "image" ? "ảnh" : "video"}</div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                {activeTab === "image" ? "PNG, JPG, JPEG" : "MP4, MOV"}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === "image" ? "image/*" : "video/*"}
              onChange={handleFileUpload}
              hidden
            />

            {file && (
              <div style={{ marginTop: 20, padding: 12, background: "#F1F5F9", borderRadius: 10, fontSize: 13 }}>
                <strong>{file.name}</strong>
              </div>
            )}

            {file && (
              <div style={{ marginTop: 30 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Điều chỉnh Watermark</div>
                <div style={{ marginBottom: 16 }}>
                  <label>Kích thước: {Math.round(settings.scale * 100)}%</label>
                  <input type="range" min="0.05" max="0.6" step="0.01" value={settings.scale} onChange={(e) => setSettings(s => ({ ...s, scale: +e.target.value }))} style={{ width: "100%" }} />
                </div>
                {/* <div style={{ marginBottom: 16 }}>
                  <label>Góc xoay: {settings.rotation}°</label>
                  <input type="range" min="-180" max="180" value={settings.rotation} onChange={(e) => setSettings(s => ({ ...s, rotation: +e.target.value }))} style={{ width: "100%" }} />
                </div> */}
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div style={{ flex: 1, position: "relative", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            {!file && (
              <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 18 }}>
                Chọn {activeTab === "image" ? "ảnh" : "video"} để bắt đầu
              </div>
            )}

            {file && activeTab === "image" && (
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMoveOnCanvas}
                style={{ maxHeight: "85vh", boxShadow: "0 10px 40px rgba(0,0,0,0.25)", borderRadius: 12 }}
              />
            )}

            {file && activeTab === "video" && (
              <div style={{ position: "relative" }}>
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  style={{ maxHeight: "70vh", borderRadius: 12 }}
                />
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMoveOnCanvas}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    maxHeight: "70vh",
                    borderRadius: 12,
                    pointerEvents: "auto",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}