// Streams out ahead of any page that is still waiting on its gate — the
// login check, the role lookup, the station build — so the browser has
// something on screen other than a blank tab. The page replaces it in
// place when it is ready.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#0b141c",
        color: "#9fb3c3",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            border: "2px solid #23384a",
            borderTopColor: "#4aa3df",
            borderRadius: "50%",
            animation: "twr-spin 0.9s linear infinite",
          }}
        />
        <span>Booking on</span>
      </div>
      <style>{`@keyframes twr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
