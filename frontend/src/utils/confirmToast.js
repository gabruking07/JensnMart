import toast from "react-hot-toast";

const baseButtonStyle = {
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700,
  minHeight: "38px",
  padding: "0 14px"
};

export function confirmToast({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger"
}) {
  return new Promise((resolve) => {
    const close = (toastId, result) => {
      toast.dismiss(toastId);
      resolve(result);
    };

    toast.custom(
      (t) => (
        <div
          style={{
            width: "min(420px, calc(100vw - 32px))",
            padding: "16px",
            borderRadius: "18px",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            background: "linear-gradient(180deg, #ffffff, #f8fafc)",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.18)",
            color: "#0f172a"
          }}
        >
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>
            {title}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              color: "#475569",
              fontSize: "13px",
              lineHeight: 1.6
            }}
          >
            {message}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "14px"
            }}
          >
            <button
              type="button"
              onClick={() => close(t.id, false)}
              style={{
                ...baseButtonStyle,
                background: "#e2e8f0",
                color: "#334155"
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => close(t.id, true)}
              style={{
                ...baseButtonStyle,
                background:
                  tone === "danger"
                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                    : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff"
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center"
      }
    );
  });
}
