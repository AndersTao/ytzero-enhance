/* A short notice in the corner of a source-site page, built without innerHTML. */
const TOAST_ID = "ytze-toast";

export function showPageToast(message: string, tone: "success" | "error") {
  document.getElementById(TOAST_ID)?.remove();
  const toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed", left: "50%", bottom: "32px", transform: "translateX(-50%)", zIndex: "2147483647",
    maxWidth: "min(480px, calc(100vw - 32px))", padding: "12px 18px", borderRadius: "12px",
    background: tone === "success" ? "#0a5fff" : "#b42318", color: "#fff",
    font: "500 14px/1.4 Roboto, Arial, sans-serif", boxShadow: "0 8px 24px rgba(0,0,0,.35)", pointerEvents: "none",
  });
  (document.body ?? document.documentElement).append(toast);
  window.setTimeout(() => toast.remove(), 3_500);
}
