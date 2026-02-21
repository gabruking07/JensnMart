import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function VendorsTab() {
  const [vendors, setVendors] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadVendors = async () => {
    try {
      const res = await api.get("/admin/vendors");
      setVendors(res.data);
    } catch {
      toast.error("Failed to load vendors");
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  /* ================= CREATE ================= */
  const createVendor = async () => {
    if (!email || !password) return toast.error("Fill fields");

    try {
      await api.post("/admin/create-vendor", { email, password });
      toast.success("Vendor created");
      setEmail("");
      setPassword("");
      loadVendors();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

  /* ================= APPROVE ================= */
  const approveVendor = async (id) => {
    try {
      await api.put(`/admin/approve/${id}`);
      toast.success("Vendor approved");
      loadVendors();
    } catch {
      toast.error("Approval failed");
    }
  };

  /* ================= REJECT ================= */
  const rejectVendor = async (id) => {
    if (!window.confirm("Reject vendor?")) return;

    try {
      await api.delete(`/admin/reject-vendor/${id}`);
      toast.success("Vendor removed");
      loadVendors();
    } catch {
      toast.error("Remove failed");
    }
  };

  return (
    <div>
      <h1>Vendors</h1>

      {/* CREATE VENDOR */}
      <div className="card">
        <h3>Create Vendor</h3>

        <input
          placeholder="Vendor Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={createVendor}>Create</button>
      </div>

      {/* LIST */}
      <div className="table">
        <div className="table-head">
          <span>Email</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {vendors.map((v) => (
          <div key={v._id} className="table-row">
            <span>{v.email}</span>
            <span>{v.approved ? "Active" : "Pending"}</span>

            <span className="actions">
              {!v.approved && (
                <button
                  className="approve"
                  onClick={() => approveVendor(v._id)}
                >
                  Approve
                </button>
              )}

              <button
                className="delete-btn"
                onClick={() => rejectVendor(v._id)}
              >
                Remove
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}