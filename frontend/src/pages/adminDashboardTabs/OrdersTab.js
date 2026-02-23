export default function OrdersTab({ ctx }) {
  const {
    placedCount,
    completedCount,
    cancelledCount,
    commission,
    statusFilter,
    setStatusFilter,
    orderSearch,
    setOrderSearch,
    vendorFilter,
    setVendorFilter,
    vendors,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredOrders,
    getStatusClass,
    requestStatusChange,
    downloadInvoice,
  } = ctx;

  return (
    <div className="orders-container">
      <div className="orders-stats">
        <div className="stat-card"><p>Placed</p><h2>{placedCount}</h2></div>
        <div className="stat-card"><p>Completed</p><h2>{completedCount}</h2></div>
        <div className="stat-card"><p>Cancelled</p><h2>{cancelledCount}</h2></div>
        <div className="stat-card"><p>Comission</p><h2>{commission}</h2></div>
      </div>

      <div className="orders-filter-bar">
        <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Placed">Placed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          className="order-search"
          placeholder="Search Order #"
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
        />

        <select className="vendor-select" value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v._id} value={v._id}>{v.email}</option>
          ))}
        </select>

        <input className="date-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input className="date-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <button
          className="filter-reset-btn"
          onClick={() => {
            setStatusFilter("all");
            setVendorFilter("");
            setOrderSearch("");
            setStartDate("");
            setEndDate("");
          }}
        >
          Reset
        </button>
      </div>

      {filteredOrders.map((o) => (
        <div key={o._id} className="admin-card order-card-wide">
          <div className="order-header">
            <span className="order-id">Order :#{o.orderNumber}</span>
            <span className={getStatusClass(o.status)}>{o.status}</span>
            <div className="order-actions">
              <select value={o.status} onChange={(e) => requestStatusChange(o._id, e.target.value)}>
                <option value="Placed">Placed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <br />
              <br />
            </div>
          </div>

          <div className="order-body">
            {o.products.map((p, i) => (
              <div key={i} className="order-item-row">
                <img
                  src={p.image ? `http://localhost:5000/uploads/${p.image}` : "https://via.placeholder.com/50"}
                  alt=""
                />
                <div>
                  <h6>{p.name}</h6>
                  <p>Qty: {p.qty} | Rs {p.price}</p>
                </div>
              </div>
            ))}

            <div className="order-footer">
              <p>Vendor: {o.vendor?.email}</p>
              <p>Order ID:#{o.orderNumber}</p>
              <p>Total: Rs {o.total}</p>
              <button onClick={() => downloadInvoice(o)}>Invoice PDF</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
