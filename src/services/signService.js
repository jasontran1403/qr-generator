const API_BASE = import.meta.env.VITE_API_BASE;

export async function signPdf({ file, zones, pin }) {
  const form = new FormData();
  form.append("file", file);
  form.append("zones", JSON.stringify({ zones }));

  const res = await fetch(`${API_BASE}/api/sign`, {
    method: "POST",
    headers: { "X-Token-Pin": pin },
    body: form,
  });

  pin = ""; // xóa PIN khỏi closure ngay lập tức

  if (!res.ok) {
    let msg = `Lỗi ${res.status}`;
    try { const j = await res.json(); msg = j.message || msg; } catch (_) {}
    throw new Error(msg);
  }

  const cd       = res.headers.get("Content-Disposition") || "";
  const match    = cd.match(/filename[^;=\n]*=\s*(?:["']?)([^"'\n;]+)/i);
  const filename = match?.[1] || `signed_${Date.now()}.pdf`;
  const blob     = await res.blob();
  const blobUrl  = URL.createObjectURL(blob);

  return { blobUrl, filename };
}