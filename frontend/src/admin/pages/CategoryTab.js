import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function CategoryTab() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [subForm, setSubForm] = useState({
    name: "",
    category: ""
  });

  /* ================= LOAD ================= */
  const loadCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  const loadSub = async () => {
    const res = await api.get("/subcategories");
    setSubcategories(res.data);
  };

  useEffect(() => {
    loadCategories();
    loadSub();
  }, []);

  /* ================= CREATE CATEGORY ================= */
  const createCategory = async () => {
    if (!newCategory) return toast.error("Enter name");

    try {
      await api.post("/categories", { name: newCategory });
      toast.success("Category added");
      setNewCategory("");
      loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

  /* ================= DELETE CATEGORY ================= */
  const deleteCategory = async (id) => {
    if (!window.confirm("Delete category?")) return;

    await api.delete(`/categories/${id}`);
    loadCategories();
    toast.success("Deleted");
  };

  /* ================= CREATE SUB ================= */
  const createSub = async () => {
    if (!subForm.name || !subForm.category)
      return toast.error("Fill fields");

    await api.post("/subcategories", subForm);
    toast.success("Subcategory added");

    setSubForm({ name: "", category: "" });
    loadSub();
  };

  /* ================= DELETE SUB ================= */
  const deleteSub = async (id) => {
    if (!window.confirm("Delete subcategory?")) return;

    await api.delete(`/subcategories/${id}`);
    toast.success("Deleted");
    loadSub();
  };

 return (
  <div className="category-wrapper">
    <h1>Categories</h1>

    {/* TOP FORMS ROW */}
    <div className="category-top">
      {/* ADD CATEGORY */}
      <div className="category-box">
        <h3>Add Category</h3>
        <input
          placeholder="Category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button onClick={createCategory}>Add</button>
      </div>

      {/* ADD SUBCATEGORY */}
      <div className="category-box">
        <h3>Add Subcategory</h3>

        <select
          value={subForm.category}
          onChange={(e) =>
            setSubForm({ ...subForm, category: e.target.value })
          }
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Subcategory name"
          value={subForm.name}
          onChange={(e) =>
            setSubForm({ ...subForm, name: e.target.value })
          }
        />

        <button onClick={createSub}>Add</button>
      </div>
    </div>

    {/* CATEGORY LIST */}
    <div className="category-grid">
      {categories.map((c) => (
        <div key={c._id} className="category-card-new">
          <div className="category-header">
            <h4>{c.name}</h4>
            <button
              className="small-delete"
              onClick={() => deleteCategory(c._id)}
            >
              Delete
            </button>
          </div>

          <div className="subcategory-list">
            {subcategories
              .filter((s) => s.category?._id === c._id)
              .map((s) => (
                <div key={s._id} className="subcategory-item">
                  <span>{s.name}</span>
                  <button
                    onClick={() => deleteSub(s._id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
}