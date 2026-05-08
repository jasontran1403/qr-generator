const API_BASE = "http://localhost:9321";

export async function fetchReport({ type, startDate, endDate }) {
  const res = await fetch(`${API_BASE}/api/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      start_date: startDate,
      end_date:   endDate,
    }),
  });

  if (!res.ok) {
    let msg = `Lỗi ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message ?? msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const cd       = res.headers.get("Content-Disposition") ?? "";
  const match    = cd.match(/filename[^;=\n]*=\s*(?:["']?)([^"'\n;]+)/i);
  const filename = match?.[1] ?? `bao_cao_${type}_${Date.now()}.pdf`;
  const blob     = await res.blob();
  const blobUrl  = URL.createObjectURL(blob);

  return { blobUrl, filename };
}