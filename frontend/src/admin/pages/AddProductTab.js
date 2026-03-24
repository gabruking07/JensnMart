import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function AddProductTab() {
    const [form, setForm] = useState({
        name: "",
        price: "",
        stock: "",
        category: "",
        subcategory: "",
        image: null
    });

    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [importFile, setImportFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    /* ================= LOAD ================= */
    const loadCategories = async () => {
        try {
            const res = await api.get("/categories");
            setCategories(res.data);
        } catch {
            toast.error("Failed to load categories");
        }
    };

    const loadSub = async () => {
        try {
            const res = await api.get("/subcategories");
            setSubcategories(res.data);
        } catch { }
    };

    useEffect(() => {
        loadCategories();
        loadSub();
    }, []);

    /* ================= SUB FILTER ================= */
    const filteredSub = subcategories.filter(
        (s) => s.category?._id === form.category
    );
    const selectedCategory = categories.find((category) => category._id === form.category);
    const selectedSubcategory = filteredSub.find((subcategory) => subcategory._id === form.subcategory);
    const completedFields = [form.name, form.price, form.stock, form.category].filter(Boolean).length;

    /* ================= SUBMIT ================= */
    const publish = async (e) => {
        e?.preventDefault();

        if (!form.name || !form.price || !form.stock || !form.category) {
            return toast.error("Fill all fields");
        }

        const data = new FormData();
        data.append("name", form.name);
        data.append("price", form.price);
        data.append("stock", form.stock);
        data.append("category", form.category);
        if (form.subcategory) data.append("subcategory", form.subcategory);
        if (form.image) data.append("image", form.image);

        try {
            await api.post("/products", data);
            toast.success("Product added");

            setForm({
                name: "",
                price: "",
                stock: "",
                category: "",
                subcategory: "",
                image: null
            });
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed");
        }
    };

    const importProducts = async () => {
        if (!importFile) {
            toast.error("Choose a CSV or Excel file first");
            return;
        }

        const data = new FormData();
        data.append("file", importFile);

        try {
            setIsImporting(true);
            const res = await api.post("/products/import", data);
            toast.success(res.data?.message || "Products imported");
            setImportFile(null);
        } catch (err) {
            const errorList = err?.response?.data?.errors;
            if (Array.isArray(errorList) && errorList.length) {
                toast.error(errorList[0]);
            } else {
                toast.error(err?.response?.data?.message || "Import failed");
            }
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="add-product-wrapper admin-panel-page">
            <section className="admin-page-hero">
                <div className="admin-page-hero-copy">
                    <p className="admin-page-eyebrow">Catalog publishing</p>
                    <h1>Add new products with the same guided layout as the rest of admin.</h1>
                    <p>
                        Create product records, assign them to the correct category tree, and publish
                        fresh stock into the storefront without leaving this workflow.
                    </p>
                </div>

                <div className="admin-page-hero-status">
                    <span>Catalog coverage</span>
                    <strong>{categories.length}</strong>
                    <p>{subcategories.length} subcategories are available for product placement.</p>
                </div>
            </section>

            <div className="add-product-shell">
                <form className="add-product-card add-product-form" onSubmit={publish}>
                    <div className="add-product-form-header">
                        <div>
                            <p className="add-product-kicker">Product editor</p>
                            <h2>Build a polished listing</h2>
                            <p>
                                Fill in the essentials, place the item in the right category, and
                                attach a storefront-ready image.
                            </p>
                        </div>

                        <div className="add-product-progress">
                            <span>Required fields</span>
                            <strong>{completedFields}/4</strong>
                        </div>
                    </div>

                    <div className="add-product-form-grid">
                        <label className="add-product-field add-product-field-wide">
                            <span>Product name</span>
                            <input
                                placeholder="Noise Cancelling Headphones"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </label>

                        <label className="add-product-field">
                            <span>Price</span>
                            <input
                                placeholder="2499"
                                type="number"
                                value={form.price}
                                onChange={(e) =>
                                    setForm({ ...form, price: e.target.value })
                                }
                            />
                        </label>

                        <label className="add-product-field">
                            <span>Stock</span>
                            <input
                                placeholder="120"
                                type="number"
                                value={form.stock}
                                onChange={(e) =>
                                    setForm({ ...form, stock: e.target.value })
                                }
                            />
                        </label>

                        <label className="add-product-field">
                            <span>Category</span>
                            <select
                                value={form.category}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        category: e.target.value,
                                        subcategory: ""
                                    })
                                }
                            >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="add-product-field">
                            <span>Subcategory</span>
                            <select
                                value={form.subcategory}
                                disabled={!form.category}
                                onChange={(e) =>
                                    setForm({ ...form, subcategory: e.target.value })
                                }
                            >
                                <option value="">
                                    {form.category
                                        ? "Select Subcategory"
                                        : "Select Category First"}
                                </option>

                                {filteredSub.map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="add-product-field add-product-field-wide">
                            <span>Product image</span>
                            <label className="file-upload">
                                <span>Choose image</span>
                                <strong>{form.image ? form.image.name : "No file selected"}</strong>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setForm({ ...form, image: e.target.files[0] })
                                    }
                                />
                            </label>
                        </div>
                    </div>

                    <div className="add-product-actions">
                        <button className="publish-btn" type="submit">
                            Publish Product
                        </button>
                    </div>
                </form>

                <aside className="add-product-side-panel">
                    <div className="add-product-side-card add-product-panel-summary">
                        <span className="add-product-side-label">Live summary</span>
                        <h3>{form.name || "Your new product"}</h3>
                        <p>
                            {selectedCategory?.name || "Choose a category"} 
                            {selectedSubcategory?.name ? ` / ${selectedSubcategory.name}` : ""}
                        </p>
                        <div className="add-product-side-metrics">
                            <div>
                                <span>Price</span>
                                <strong>{form.price ? `Rs. ${Number(form.price).toLocaleString()}` : "Pending"}</strong>
                            </div>
                            <div>
                                <span>Stock</span>
                                <strong>{form.stock || "Pending"}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="add-product-side-card add-product-side-card-soft add-product-panel-checklist">
                        <span className="add-product-side-label">Publishing checklist</span>
                        <ul className="add-product-checklist">
                            <li className={form.name ? "done" : ""}>Name added</li>
                            <li className={form.price ? "done" : ""}>Price entered</li>
                            <li className={form.stock ? "done" : ""}>Stock entered</li>
                            <li className={form.category ? "done" : ""}>Category assigned</li>
                            <li className={form.image ? "done" : ""}>Image attached</li>
                        </ul>
                    </div>
                </aside>

                <div className="add-product-side-card add-product-import-card add-product-panel-import">
                    <span className="add-product-side-label">Bulk import</span>
                    <h3>Upload CSV or Excel</h3>
                    <p>
                        Import multiple products at once using columns like name, price,
                        stock, category, subcategory, and image.
                    </p>
                    <p className="add-product-import-note">Supported files: CSV, XLSX, XLS</p>

                    <label className="file-upload add-product-import-upload">
                        <span>Choose sheet</span>
                        <strong>{importFile ? importFile.name : "No import file selected"}</strong>
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        />
                    </label>

                    <div className="add-product-import-columns">
                        <span>Supported columns</span>
                        <p>`name`, `price`, `stock`, `category`, `subcategory`, `image`</p>
                    </div>

                    <button
                        className="publish-btn add-product-import-btn"
                        type="button"
                        onClick={importProducts}
                        disabled={isImporting}
                    >
                        {isImporting ? "Importing..." : "Import Products"}
                    </button>
                </div>
            </div>
        </div>
    );
}
