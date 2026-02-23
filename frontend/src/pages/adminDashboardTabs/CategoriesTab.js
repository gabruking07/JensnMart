export default function CategoriesTab({ ctx }) {
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
