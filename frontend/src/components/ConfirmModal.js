export default function ConfirmModal({
  show,
  title = "Confirm",
  message = "Are you sure?",
  onConfirm,
  onCancel
}) {
  if (!show) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{title}</h3>
        <p>{message}</p>

        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button
            onClick={onCancel}
            style={{ marginRight: 10 }}
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (typeof onConfirm === "function") {
                onConfirm();
              }
            }}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none"
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999
};

const modalStyle = {
  background: "#ffffff",
  color: "#000",
  padding: 20,
  width: 320,
  borderRadius: 8,
  boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
};