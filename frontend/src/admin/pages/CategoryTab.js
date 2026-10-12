<<<<<<< HEAD
/** Administrator category tab screen; loads and updates the corresponding marketplace records through the shared API client. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
import { useEffect, useMemo, useState } from "react";
import { FolderTree, Layers3, Plus, Tag } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";
import { confirmToast } from "../../components/confirmToast";

<<<<<<< HEAD
/** Renders the category tab interface and coordinates the state and actions for this screen or reusable component. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
export default function CategoryTab() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [subForm, setSubForm] = useState({
    name: "",
    category: ""
  });

<<<<<<< HEAD
    /** Fetches categories used to populate the screen and its selection controls. */
    const loadCategories = async () => {
=======
  const loadCategories = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    const res = await api.get("/categories");
    setCategories(res.data);
  };

<<<<<<< HEAD
    /** Fetches subcategories used by the category or product form. */
    const loadSub = async () => {
=======
  const loadSub = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    const res = await api.get("/subcategories");
    setSubcategories(res.data);
  };

  useEffect(() => {
    loadCategories();
    loadSub();
  }, []);

<<<<<<< HEAD
    /** Validates and creates a product category through the API. */
    const createCategory = async () => {
=======
  const createCategory = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    if (!newCategory.trim()) return toast.error("Enter name");

    try {
      await api.post("/categories", { name: newCategory.trim() });
      toast.success("Category added");
      setNewCategory("");
      loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

<<<<<<< HEAD
    /** Deletes the selected category through the admin API. */
    const deleteCategory = async (id) => {
=======
  const deleteCategory = async (id) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    const confirmed = await confirmToast({
      title: "Delete category?",
      message: "Deleting this category may affect linked products.",
      confirmLabel: "Delete"
    });
    if (!confirmed) return;

    await api.delete(`/categories/${id}`);
    loadCategories();
    loadSub();
    toast.success("Deleted");
  };

<<<<<<< HEAD
    /** Creates a subcategory linked to the selected parent category. */
    const createSub = async () => {
=======
  const createSub = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    if (!subForm.name.trim() || !subForm.category) {
      return toast.error("Fill fields");
    }

    await api.post("/subcategories", {
      name: subForm.name.trim(),
      category: subForm.category
    });
    toast.success("Subcategory added");

    setSubForm({ name: "", category: "" });
    loadSub();
  };

<<<<<<< HEAD
    /** Deletes the selected subcategory through the admin API. */
    const deleteSub = async (id) => {
=======
  const deleteSub = async (id) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    const confirmed = await confirmToast({
      title: "Delete subcategory?",
      message: "This subcategory will be removed from the catalog structure.",
      confirmLabel: "Delete"
    });
    if (!confirmed) return;

    await api.delete(`/subcategories/${id}`);
    toast.success("Deleted");
    loadSub();
  };

  const categoryCount = categories.length;
  const subcategoryCount = subcategories.length;
  const subcategoryMap = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      subcategoryItems: subcategories.filter((subcategory) => subcategory.category?._id === category._id)
    }));
  }, [categories, subcategories]);

  return (
    <div className="category-wrapper category-page">
      <section className="category-hero">
        <div className="category-hero-copy">
          <p className="category-eyebrow">Catalog structure</p>
          <h1>Manage categories and subcategories from the same page pattern as the rest of admin.</h1>
          <p className="category-hero-text">
            Build a cleaner catalog tree so inventory, search, and storefront filters stay aligned.
          </p>
        </div>

        <div className="category-hero-status">
          <span>Catalog health</span>
          <strong>{subcategoryCount}</strong>
          <p>Active subcategory lanes currently mapped across {categoryCount} main categories.</p>
        </div>
      </section>

      <section className="category-summary">
        <article className="category-summary-card">
          <span>Categories</span>
          <strong>{categoryCount}</strong>
          <small>top-level catalog groups</small>
        </article>
        <article className="category-summary-card">
          <span>Subcategories</span>
          <strong>{subcategoryCount}</strong>
          <small>catalog drill-down options</small>
        </article>
      </section>

      <section className="category-top">
        <div className="category-box category-box-accent">
          <div className="category-box-head">
            <div>
              <span className="category-box-kicker">Create</span>
              <h3>Add Category</h3>
            </div>
            <FolderTree size={20} />
          </div>
          <input
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={createCategory}>
            <Plus size={16} />
            Add Category
          </button>
        </div>

        <div className="category-box">
          <div className="category-box-head">
            <div>
              <span className="category-box-kicker">Extend</span>
              <h3>Add Subcategory</h3>
            </div>
            <Layers3 size={20} />
          </div>

          <select
            value={subForm.category}
            onChange={(e) => setSubForm({ ...subForm, category: e.target.value })}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Subcategory name"
            value={subForm.name}
            onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
          />

          <button onClick={createSub}>
            <Plus size={16} />
            Add Subcategory
          </button>
        </div>
      </section>

      <section className="category-list-shell">
        <div className="category-list-head">
          <div>
            <span className="category-box-kicker">Structure</span>
            <h3>Subcategory mapping</h3>
          </div>
          <p>Each category card shows the linked subcategories used by catalog filtering.</p>
        </div>

        <div className="category-grid">
          {subcategoryMap.map((category) => (
            <div key={category._id} className="category-card-new">
              <div className="category-header">
                <div>
                  <h4>{category.name}</h4>
                  <p>{category.subcategoryItems.length} linked subcategories</p>
                </div>
                <button
                  className="small-delete"
                  onClick={() => deleteCategory(category._id)}
                >
                  Delete
                </button>
              </div>

              <div className="subcategory-list">
                {category.subcategoryItems.length === 0 ? (
                  <div className="subcategory-empty">
                    <Tag size={16} />
                    <span>No subcategories mapped yet.</span>
                  </div>
                ) : (
                  category.subcategoryItems.map((subcategory) => (
                    <div key={subcategory._id} className="subcategory-item">
                      <span>{subcategory.name}</span>
                      <button onClick={() => deleteSub(subcategory._id)}>
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
