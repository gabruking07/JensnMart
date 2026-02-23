export default function AddProductTab({ ctx }) {
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
