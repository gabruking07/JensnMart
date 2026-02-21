import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function AdminsTab() {
  const [admins, setAdmins] = useState([]);
  const [pending, setPending] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "manager"
  });

  /* ================= LOAD ================= */
  const loadAdmins = async () => {
    try {
      const res = await api.get("/admin/all-admins");
      setAdmins(res.data);
    } catch {
      toast.error("Failed to load admins");
    }
  };

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

  /* ================= CREATE ================= */
  const createAdmin = async () => {
    try {
      await api.post("/admin/create-admin", form);
      toast.success("Admin created. Await approval.");
      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "manager"
      });
      loadAdmins();
      loadPending();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

  /* ================= APPROVE ================= */
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
  const removeAdmin = async (id) => {
    if (!window.confirm("Remove admin?")) return;

    try {
      await api.delete(`/admin/remove-admin/${id}`);
      toast.success("Removed");
      loadAdmins();
    } catch {
      toast.error("Remove failed");
    }
  };

  return (
    <div>
      <h1>Admins</h1>

      {/* CREATE */}
      <div className="card">
        <h3>Create Admin / Manager</h3>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

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

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
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

        <button onClick={createAdmin}>Create</button>
      </div>

      {/* PENDING */}
      <div className="card">
        <h3>Pending Approvals</h3>

        {pending.length === 0 && <p>No pending admins</p>}

        {pending.map((p) => (
          <div key={p._id} className="table-row">
            <span>{p.email}</span>
            <span>{p.role}</span>

            <button
              className="approve"
              onClick={() => approveAdmin(p._id)}
            >
              Approve
            </button>
          </div>
        ))}
      </div>

      {/* ALL ADMINS */}
      <div className="table">
        <div className="table-head">
          <span>Email</span>
          <span>Role</span>
          <span>Action</span>
        </div>

        {admins.map((a) => (
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
      </div>
    </div>
  );
}