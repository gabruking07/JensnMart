/** Administrator admins tab screen; loads and updates the corresponding marketplace records through the shared API client. */

import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";
import { confirmToast } from "../../components/confirmToast";

/** Renders the admins tab interface and coordinates the state and actions for this screen or reusable component. */
export default function AdminsTab() {
  const [admins, setAdmins] = useState([]);
  const [pending, setPending] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "manager"
  });

  /* ================= LOAD ================= */
    /** Fetches admin and manager records for account management. */
    const loadAdmins = async () => {
    try {
      const res = await api.get("/admin/all-admins");
      setAdmins(res.data);
    } catch {
      toast.error("Failed to load admins");
    }
  };

    /** Fetches admin accounts awaiting approval. */
    const loadPending = async () => {
    try {
      const res = await api.get("/admin/pending-admins");
      setPending(res.data);
    } catch {}
  };

  useEffect(() => {
    loadAdmins();
    loadPending();
  }, []);

  const totalPages = Math.max(1, Math.ceil(admins.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdmins = admins.slice(startIndex, endIndex);
  const managerCount = admins.filter((admin) => admin.role === "manager").length;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  /* ================= CREATE ================= */
    /** Submits the new administrator form and refreshes the account list after success. */
    const createAdmin = async () => {
    if (!form.email || !form.password) {
      toast.error("Email & password required");
      return;
    }

    try {
      await api.post("/admin/create-admin", form);
      toast.success("Created. Await approval.");

      setForm({
        email: "",
        password: "",
        role: "manager"
      });

      loadAdmins();
      loadPending();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

  /* ================= APPROVE ================= */
    /** Approves a pending administrator account so it can access the admin area. */
    const approveAdmin = async (id) => {
    try {
      await api.put(`/admin/approve-admin/${id}`);
      toast.success("Approved");
      loadAdmins();
      loadPending();
    } catch {
      toast.error("Approve failed");
    }
  };

  /* ================= REMOVE ================= */
  /** Performs the remove admin step used by this module's workflow. */
  const removeAdmin = async (id) => {
    const confirmed = await confirmToast({
      title: "Remove admin?",
      message: "This account will lose admin access immediately.",
      confirmLabel: "Remove"
    });
    if (!confirmed) return;

    try {
      await api.delete(`/admin/remove-admin/${id}`);
      toast.success("Removed");
      loadAdmins();
      loadPending();
    } catch {
      toast.error("Remove failed");
    }
  };

  return (
    <div className="admin-panel-page">
      <section className="admin-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Team access</p>
          <h1>Manage admin and manager accounts from a clearer control surface.</h1>
          <p>
            Create elevated users, review pending approvals, and keep internal access limited to the
            right people.
          </p>
        </div>

        <div className="admin-page-hero-status">
          <span>Pending approvals</span>
          <strong>{pending.length}</strong>
          <p>{admins.length} approved accounts are live, including {managerCount} managers.</p>
        </div>
      </section>

      {/* CREATE */}
      <div className="card">
        <h3>Create Admin / Manager</h3>

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>

        <button className="create-admin-btn" onClick={createAdmin}>
          Create
        </button>
      </div>

      {/* PENDING */}
      <div className="card">
        <h3>Pending Approvals</h3>

        {pending.length === 0 && <p>No pending</p>}

        {pending.map((p) => (
          <div key={p._id} className="table-row">
            <span>{p.email}</span>
            <span>{p.role}</span>
            <div className="actions">
              <button
                className="approve"
                onClick={() => approveAdmin(p._id)}
              >
                Approve
              </button>
              <button
                className="delete-btn"
                onClick={() => removeAdmin(p._id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ALL ADMINS */}
      <div className="table">
        <div className="table-toolbar">
          <p className="table-count">
            Showing {admins.length === 0 ? 0 : startIndex + 1}-
            {Math.min(endIndex, admins.length)} of {admins.length} admins
          </p>
          <div className="table-page-size">
            <label htmlFor="admins-page-size">Items per page</label>
            <select
              id="admins-page-size"
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
          <span>Role</span>
          <span>Action</span>
        </div>

        {paginatedAdmins.map((a) => (
          <div key={a._id} className="table-row">
            <span>{a.email}</span>
            <span>{a.role}</span>

            <button
              className="delete-btn"
              onClick={() => removeAdmin(a._id)}
            >
              Remove
            </button>
          </div>
        ))}

        {admins.length > 0 && (
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
