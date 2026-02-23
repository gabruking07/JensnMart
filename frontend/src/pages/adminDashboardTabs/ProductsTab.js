export default function ProductsTab({ ctx }) {
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
