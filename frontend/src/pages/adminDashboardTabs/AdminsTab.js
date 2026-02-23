export default function AdminsTab({ ctx }) {
  const {
    newAdminName,
    setNewAdminName,
    newAdminEmail,
    setNewAdminEmail,
    newAdminPhone,
    setNewAdminPhone,
    newAdminPassword,
    setNewAdminPassword,
    newAdminRole,
    setNewAdminRole,
    createAdmin,
    pendingAdmins,
    approveAdmin,
    removeAdmin,
    adminSearch,
    setAdminSearch,
    admins,
  } = ctx;

  return (
    <div className="admin-page">
      <div className="admin-top">
        <div className="admin-card">
          <h2>Create Admin / Manager</h2>
          <input placeholder="Name" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} />
          <input placeholder="Email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} />
          <input placeholder="Phone" value={newAdminPhone} onChange={(e) => setNewAdminPhone(e.target.value)} />
          <input
            type="password"
            placeholder="Password"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
          />
          <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)}>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary" onClick={createAdmin}>Create</button>
        </div>

        <div className="admin-card">
          <h2>Pending Approvals</h2>
          {pendingAdmins.length === 0 && <p>No pending admins</p>}
          {pendingAdmins.map((a) => (
            <div key={a._id} className="admin-row">
              <div>
                <b>{a.email}</b>
                <div className="muted">Pending</div>
              </div>
              <div>
                <button className="btn-approve" onClick={() => approveAdmin(a._id)}>Approve</button>
                <button className="btn-remove" onClick={() => removeAdmin(a._id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card full">
        <div className="admins-header-row">
          <h2>All Admins</h2>
          <input
            className="admin-search"
            placeholder="Search admins..."
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {admins
              .filter((a) => a.approved)
              .filter((a) => a.email.toLowerCase().includes(adminSearch.toLowerCase()))
              .map((a) => (
                <tr key={a._id}>
                  <td>{a.email}</td>
                  <td>{a.role}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-remove" onClick={() => removeAdmin(a._id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
