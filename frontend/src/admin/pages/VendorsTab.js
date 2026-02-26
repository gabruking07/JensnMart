import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function VendorsTab() {
  const [vendors, setVendors] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  const totalPages = Math.max(1, Math.ceil(vendors.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = vendors.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

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

        <button className="create-vendor-btn" onClick={createVendor}>
          Create
        </button>
      </div>

      {/* LIST */}
      <div className="table">
        <div className="table-toolbar">
          <p className="table-count">
            Showing {vendors.length === 0 ? 0 : startIndex + 1}-
            {Math.min(endIndex, vendors.length)} of {vendors.length} vendors
          </p>
          <div className="table-page-size">
            <label htmlFor="vendors-page-size">Items per page</label>
            <select
              id="vendors-page-size"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        <div className="table-head">
          <span>Email</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {paginatedVendors.map((v) => (
          <div key={v._id} className="table-row">
            <span>{v.email}</span>
            <span>{v.approved ? "Active" : "Pending"}</span>

            <div className="actions">
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
            </div>
          </div>
        ))}

        {vendors.length > 0 && (
          <div className="pagination-bar">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}