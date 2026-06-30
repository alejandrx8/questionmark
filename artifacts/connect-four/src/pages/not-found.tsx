export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111" }}>404</h1>
        <p style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>Page not found.</p>
      </div>
    </div>
  );
}
