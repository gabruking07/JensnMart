import {
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function ProductsTab({ ctx }) {
  const {
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedSubcategory,
    setSelectedSubcategory,
    subcategories,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    editCategoryProductId,
    setEditCategoryProductId,
    updateProductCategory,
    getCategoryColor,
    getCategoryTextColor,
    getCategoryName,
    editSubcategoryProductId,
    setEditSubcategoryProductId,
    updateProductSubcategory,
    getSubcategoryColor,
    getSubcategoryTextColor,
    editPriceId,
    newPrice,
    setNewPrice,
    updatePrice,
    setEditPriceId,
    editNameId,
    newName,
    setNewName,
    setEditNameId,
    updateProductName,
    editStockId,
    newStock,
    setNewStock,
    updateStockValue,
    setEditStockId,
    deleteProduct,
  } = ctx;

  return (
    <>
      <div className="filter-header">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          disabled={!selectedCategory}
        >
          <option value="">All Subcategories</option>
          {subcategories
            .filter((sc) => !selectedCategory || sc.category._id === selectedCategory)
            .map((sc) => (
              <option key={sc._id} value={sc._id}>
                {sc.name}
              </option>
            ))}
        </select>

        <input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="product-grid">
        {filteredProducts.map((p) => (
          <div className="glass-card" key={p._id}>
            <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} />
            {editNameId === p._id ? (
              <div className="inline-edit">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => updateProductName(p._id)}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditNameId(null);
                    setNewName("");
                  }}
                >
                  x
                </button>
              </div>
            ) : (
              <div className="row-between">
                <h5 className="product-name">{p.name}</h5>
                <button
                  type="button"
                  className="edit-icon"
                  onClick={() => {
                    setEditNameId(p._id);
                    setNewName(p.name);
                  }}
                  title="Edit name"
                >
                  Edit
                </button>
              </div>
            )}

            <div className="category-block">
              {editCategoryProductId === p._id ? (
                <select
                  className="category-select"
                  value={
                    typeof p.category === "object" ? p.category?._id : p.category || ""
                  }
                  autoFocus
                  onChange={(e) => updateProductCategory(p._id, e.target.value)}
                  onBlur={() => setEditCategoryProductId(null)}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className="category-pill premium"
                  style={{
                    backgroundColor: getCategoryColor(
                      typeof p.category === "object" ? p.category?._id : p.category
                    ),
                    color: getCategoryTextColor(
                      typeof p.category === "object" ? p.category?._id : p.category
                    ),
                  }}
                  onClick={() => setEditCategoryProductId(p._id)}
                >
                  {getCategoryName(p)}
                </span>
              )}

              {editSubcategoryProductId === p._id ? (
                <select
                  className="subcategory-select"
                  value={
                    typeof p.subcategory === "object"
                      ? p.subcategory?._id
                      : p.subcategory || ""
                  }
                  autoFocus
                  onChange={(e) => updateProductSubcategory(p._id, e.target.value)}
                  onBlur={() => setEditSubcategoryProductId(null)}
                >
                  <option value="">Select subcategory</option>
                  {subcategories
                    .filter(
                      (s) =>
                        (typeof p.category === "object" ? p.category?._id : p.category) ===
                        (typeof s.category === "object" ? s.category?._id : s.category)
                    )
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              ) : (
                <span
                  className="subcategory-pill premium"
                  onClick={() => setEditSubcategoryProductId(p._id)}
                  style={{
                    backgroundColor: getSubcategoryColor(
                      typeof p.subcategory === "object"
                        ? p.subcategory?._id
                        : p.subcategory || "none"
                    ),
                    color: getSubcategoryTextColor(
                      typeof p.subcategory === "object"
                        ? p.subcategory?._id
                        : p.subcategory || "none"
                    ),
                  }}
                >
                  {p.subcategory?.name || "No Subcategory"}
                </span>
              )}
            </div>

            {editPriceId === p._id ? (
              <div className="inline-edit">
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
                <button onClick={updatePrice} disabled={Number(newPrice) === p.price}>
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditPriceId(null);
                    setNewPrice("");
                  }}
                >
                  x
                </button>
              </div>
            ) : (
              <div className="row-between">
                <span className="value-text">Rs {p.price}</span>
                <button
                  className="edit-icon"
                  onClick={() => {
                    setEditPriceId(p._id);
                    setNewPrice(p.price);
                  }}
                  title="Edit price"
                >
                  Edit
                </button>
              </div>
            )}

            {editStockId === p._id ? (
              <div className="inline-edit">
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                />
                <button
                  onClick={() => updateStockValue(p._id)}
                  disabled={Number(newStock) === p.stock}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditStockId(null);
                    setNewStock("");
                  }}
                >
                  x
                </button>
              </div>
            ) : (
              <div className="row-between">
                <span className="value-text">Stock: {p.stock}</span>
                <button
                  className="edit-icon"
                  onClick={() => {
                    setEditStockId(p._id);
                    setNewStock(p.stock);
                  }}
                  title="Edit stock"
                >
                  Edit
                </button>
              </div>
            )}

            <button className="delete-btn" onClick={() => deleteProduct(p._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function VendorsTab({ ctx }) {
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

export function AdminsTab({ ctx }) {
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

export function OrdersTab({ ctx }) {
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

export function AddProductTab({ ctx }) {
  const {
    pname,
    setPname,
    price,
    setPrice,
    stock,
    setStock,
    categoryId,
    setCategoryId,
    categories,
    subcategoryId,
    setSubcategoryId,
    subcategories,
    setImage,
    addProduct,
  } = ctx;

  return (
    <div className="form-container">
      <h3>Add Product</h3>
      <input placeholder="Name" value={pname} onChange={(e) => setPname(e.target.value)} />
      <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(+e.target.value)} />
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
        <option value="">Select Subcategory</option>
        {subcategories
          .filter((sc) => sc.category._id === categoryId)
          .map((sc) => (
            <option key={sc._id} value={sc._id}>{sc.name}</option>
          ))}
      </select>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <button onClick={addProduct}>Publish</button>
    </div>
  );
}

export function CategoriesTab({ ctx }) {
  const {
    categorySearch,
    setCategorySearch,
    newCategory,
    setNewCategory,
    addCategory,
    filteredCategories,
    collapsedCats,
    toggleCollapse,
    editCategoryId,
    editCategoryName,
    setEditCategoryName,
    updateCategory,
    setEditCategoryId,
    deleteCategory,
    subcategories,
    deleteSubcategory,
    parentCategoryId,
    setParentCategoryId,
    categories,
    newSubName,
    setNewSubName,
    addSubcategory,
  } = ctx;

  return (
    <div className="cat-wrapper">
      <div className="cat-card">
        <div className="cat-card-header"><h2>Categories</h2></div>
        <input
          className="cat-search"
          placeholder="Search categories..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
        />

        <div className="cat-create-row">
          <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <button className="btn-add" onClick={addCategory}>Add</button>
        </div>

        <div className="cat-list">
          {filteredCategories.map((c) => (
            <div key={c._id} className="cat-item">
              <div className="cat-title-row">
                <div className="cat-left-title">
                  <span className="collapse-icon" onClick={() => toggleCollapse(c._id)}>
                    {collapsedCats[c._id] ? ">" : "v"}
                  </span>

                  {editCategoryId === c._id ? (
                    <input
                      className="cat-inline-input"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      onBlur={() => updateCategory(c._id)}
                    />
                  ) : (
                    <span
                      className="cat-name"
                      onClick={() => {
                        setEditCategoryId(c._id);
                        setEditCategoryName(c.name);
                      }}
                    >
                      {c.name}
                    </span>
                  )}
                </div>

                <button className="cat-delete-btn" onClick={() => deleteCategory(c._id)}>
                  Del
                </button>
              </div>

              {!collapsedCats[c._id] && (
                <div className="subcat-wrap">
                  {subcategories
                    .filter((sc) => sc.category._id === c._id)
                    .map((sc) => (
                      <div key={sc._id} className="sub-chip">
                        {sc.name}
                        <span onClick={() => deleteSubcategory(sc._id)}>x</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="cat-card">
        <div className="cat-card-header"><h2>Add Subcategory</h2></div>
        <select className="input-modern" value={parentCategoryId} onChange={(e) => setParentCategoryId(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <input
          className="input-modern"
          placeholder="Subcategory name"
          value={newSubName}
          onChange={(e) => setNewSubName(e.target.value)}
        />

        <button className="btn-add full" onClick={addSubcategory}>Create</button>
      </div>
    </div>
  );
}

export function ReportsTab({ ctx }) {
  const {
    reportRange,
    setReportRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    analytics,
    salesChartData,
    orderStatusData,
    vendorData,
    topProductsData,
  } = ctx;

  return (
    <div className="reports-page">
      <div className="report-filters">
        <div className="range-tabs">
          {["today", "week", "month", "year"].map((r) => (
            <button
              key={r}
              className={`range-btn ${reportRange === r ? "active" : ""}`}
              onClick={() => setReportRange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          <button
            className={`range-btn ${reportRange === "custom" ? "active" : ""}`}
            onClick={() => setReportRange("custom")}
          >
            Custom
          </button>
        </div>

        <h3>Showing: {reportRange.charAt(0).toUpperCase() + reportRange.slice(1)}</h3>

        {reportRange === "custom" && (
          <div className="custom-range">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <span>to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        )}
      </div>

      <div className="report-top-row">
        <div className="kpi-card"><p>Total Sales</p><h2>Rs {analytics.totalSales}</h2></div>
        <div className="kpi-card"><p>Orders</p><h2>{analytics.totalOrders}</h2></div>
        <div className="kpi-card"><p>Completed</p><h2>{analytics.completedCount}</h2></div>
        <div className="kpi-card"><p>Cancelled</p><h2>{analytics.cancelledCount}</h2></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Sales Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Order Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart width={350} height={260}>
              <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85}>
                {orderStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" align="center" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Vendor Performance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vendorData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top Products</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProductsData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
