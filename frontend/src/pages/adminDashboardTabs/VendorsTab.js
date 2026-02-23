export default function VendorsTab({ ctx }) {
  const {
    vendorEmail,
    setVendorEmail,
    vendorPassword,
    setVendorPassword,
    createVendor,
    vendors,
    approveVendor,
    rejectVendor,
    vendorSearch,
    setVendorSearch,
    filteredVendors,
  } = ctx;

  return (
    <div className="vendors-layout">
      <div className="vendors-create">
        <h2>Create Vendor</h2>
        <input
          className="input-modern"
          placeholder="Vendor Email"
          value={vendorEmail}
          onChange={(e) => setVendorEmail(e.target.value)}
        />
        <input
          className="input-modern"
          placeholder="Password"
          value={vendorPassword}
          onChange={(e) => setVendorPassword(e.target.value)}
        />
        <button className="btn-primary" onClick={createVendor}>
          Create Vendor
        </button>
      </div>

      <div className="vendors-approvals">
        <h2>Pending Approvals</h2>
        {vendors.filter((v) => !v.approved).length === 0 && <p>No pending vendors</p>}

        {vendors
          .filter((v) => !v.approved)
          .map((v) => (
            <div key={v._id} className="vendor-row">
              <div className="vendor-left">
                <div className="vendor-avatar">{v.email.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="vendor-email">{v.email}</div>
                  <div className="vendor-status pending">Pending</div>
                </div>
              </div>

              <div className="vendor-actions">
                <button className="btn-approve" onClick={() => approveVendor(v._id)}>
                  Approve
                </button>
                <button className="btn-remove" onClick={() => rejectVendor(v._id)}>
                  Reject
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="vendors-all">
        <div className="vendors-header">
          <h2>All Vendors</h2>
          <input
            className="vendor-search"
            placeholder="Search vendors..."
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
          />
        </div>

        <div className="vendors-table-wrapper">
          <table className="vendors-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((v) => (
                <tr key={v._id}>
                  <td>{v.email}</td>
                  <td>
                    <span className={v.approved ? "status-active" : "status-pending"}>
                      {v.approved ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td>{new Date(v.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td>
                    {!v.approved && (
                      <button className="btn-approve" onClick={() => approveVendor(v._id)}>
                        Approve
                      </button>
                    )}
                    <button className="btn-remove" onClick={() => rejectVendor(v._id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
