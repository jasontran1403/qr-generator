import { Link, useLocation } from "react-router-dom";

export default function Navbar({ rightSlot }) {
  return (
    <nav style={{
      height: 54, background: "#fff", borderBottom: "1px solid #E2E8F0",
      padding: "0 20px", display: "flex", alignItems: "center",
      justifyContent: "space-between", flexShrink: 0, zIndex: 100,
      boxShadow: "0 1px 3px #0000000a",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#667EEA,#764BA2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px #667EEA40" }}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", letterSpacing: -0.3 }}>Công cụ</span>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <NavLink to="/" label="QR Code" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        }/>
        <NavLink to="/e-sign" label="Ký số" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/><path d="M9 13l2 2 4-4"/>
          </svg>
        }/>
        <NavLink to="/watermark" label="Watermark" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        }/>
      </div>

      <div style={{ minWidth: 140, display: "flex", justifyContent: "flex-end" }}>
        {rightSlot}
      </div>
    </nav>
  );
}

function NavLink({ to, label, icon }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link to={to} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 8, textDecoration: "none",
      fontSize: 13, fontWeight: 600,
      background: active ? "#EEF2FF" : "transparent",
      color: active ? "#4338CA" : "#64748B",
      border: `1px solid ${active ? "#C7D2FE" : "transparent"}`,
      transition: "all 0.15s",
    }}>
      {icon}{label}
    </Link>
  );
}