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

    /* ================= SUBMIT ================= */
    const publish = async () => {
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

    return (
        <div className="add-product-wrapper">
            <div className="add-product-card">
                <input
                    placeholder="Product name"
                    value={form.name}
                    onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                    }
                />

                <input
                    placeholder="Price"
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                    }
                />

                <input
                    placeholder="Stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                    }
                />

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

                <label className="file-upload">
                    Upload Image
                    <input
                        type="file"
                        onChange={(e) =>
                            setForm({ ...form, image: e.target.files[0] })
                        }
                    />
                </label>

                <button className="publish-btn" onClick={publish}>
                    Publish Product
                </button>
            </div>
        </div>
    );
}
