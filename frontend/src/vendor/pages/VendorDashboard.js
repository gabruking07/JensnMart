import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Footer from "../../components/Footer";
import "./VendorDashboard.css";
import VendorLayout from "./VendorLayout";

const SEARCH_ALIASES = {
  cheap: ["cheap", "cheapest", "chepes", "chepest", "budget", "low", "affordable", "economy"],
  premium: ["premium", "expensive", "costly", "highend", "luxury"],
  popular: ["best", "top", "popular", "bestseller", "trending"],
  latest: ["new", "latest", "recent", "fresh"]
};

const INTENT_PRIMARY = {
  cheap: "cheapest",
  premium: "premium",
  popular: "best",
  latest: "latest"
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) => normalizeText(value).split(" ").filter(Boolean);

const flattenAliases = () => Object.values(SEARCH_ALIASES).flat();

const isNearMatch = (needle, hayWord) => {
  if (!needle || !hayWord) return false;
  if (hayWord.includes(needle) || needle.includes(hayWord)) return true;
  if (needle.length < 4 || hayWord.length < 4) return false;
  return hayWord.startsWith(needle.slice(0, Math.max(needle.length - 1, 3)));
};

const levenshtein = (a, b) => {
  const s = String(a || "");
  const t = String(b || "");
  const dp = Array.from({ length: s.length + 1 }, () => Array(t.length + 1).fill(0));

  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[s.length][t.length];
};

const hasIntent = (tokens, aliases) => {
  return tokens.some((token) =>
    aliases.some((alias) =>
      token === alias || token.includes(alias) || alias.includes(token) || levenshtein(token, alias) <= 2
    )
  );
};

const getClosestWord = (word, dictionary) => {
  if (!word) return word;
  let bestWord = word;
  let bestScore = Number.MAX_SAFE_INTEGER;

  for (const candidate of dictionary) {
    const score = levenshtein(word, candidate);
    if (score < bestScore) {
      bestScore = score;
      bestWord = candidate;
    }
  }

  if (bestScore <= 2) return bestWord;
  return word;
};

const tokenMatchStrength = (token, words = []) => {
  if (!token || !words.length) return 0;

  let best = 0;
  for (const word of words) {
    if (!word) continue;
    if (token === word) return 1;
    if (word.startsWith(token) || token.startsWith(word)) best = Math.max(best, 0.85);
    else if (word.includes(token) || token.includes(word)) best = Math.max(best, 0.75);
    else {
      const dist = levenshtein(token, word);
      const maxLen = Math.max(token.length, word.length);
      if (maxLen > 0) {
        const ratio = 1 - dist / maxLen;
        if (ratio >= 0.64) best = Math.max(best, Math.min(0.7, ratio));
      }
    }
  }
  return best;
};

const getIntentFlags = (tokens) => ({
  hasCheapIntent: hasIntent(tokens, SEARCH_ALIASES.cheap),
  hasPremiumIntent: hasIntent(tokens, SEARCH_ALIASES.premium),
  hasPopularIntent: hasIntent(tokens, SEARCH_ALIASES.popular),
  hasLatestIntent: hasIntent(tokens, SEARCH_ALIASES.latest),
});

const getAiScore = (product, searchTerm, lowPrice, highPrice) => {
  const query = normalizeText(searchTerm);
  if (!query) return 0;

  const tokens = tokenize(query);
  if (!tokens.length) return 0;

  const intentAliases = flattenAliases();
  const nonIntentTokens = tokens.filter(
    (token) => !intentAliases.some((alias) => alias === token || levenshtein(alias, token) <= 1)
  );

  const queryTokens = nonIntentTokens.length ? nonIntentTokens : tokens;
  const name = normalizeText(product.name);
  const category = normalizeText(product.category?.name);
  const subcategory = normalizeText(product.subcategory?.name);
  const nameWords = tokenize(name);
  const categoryWords = tokenize(category);
  const subcategoryWords = tokenize(subcategory);
  const fullWords = [...nameWords, ...categoryWords, ...subcategoryWords];
  const fullText = fullWords.join(" ");

  let score = 0;
  let matchedKeywordTokens = 0;

  if (fullText.includes(query)) score += 28;
  if (name.includes(query)) score += 18;

  queryTokens.forEach((token) => {
    const nameStrength = tokenMatchStrength(token, nameWords);
    const categoryStrength = tokenMatchStrength(token, categoryWords);
    const subStrength = tokenMatchStrength(token, subcategoryWords);
    const fullStrength = tokenMatchStrength(token, fullWords);

    const tokenStrength = Math.max(nameStrength, categoryStrength, subStrength, fullStrength);
    if (tokenStrength < 0.45) return;

    matchedKeywordTokens += 1;
    score += nameStrength * 12 + categoryStrength * 7 + subStrength * 7 + fullStrength * 4;
  });

  const coverage = matchedKeywordTokens / queryTokens.length;
  score += coverage * 16;

  // Do not allow intent-only matches (cheap/premium/etc) without product keyword relevance.
  if (matchedKeywordTokens === 0) return 0;
  if (coverage < 0.34 && queryTokens.length > 1) return 0;

  const { hasCheapIntent, hasPremiumIntent, hasPopularIntent, hasLatestIntent } = getIntentFlags(tokens);

  if (hasCheapIntent && Number(product.price) <= lowPrice) score += 7;
  if (hasPremiumIntent && Number(product.price) >= highPrice) score += 7;
  if (hasPopularIntent) score += Math.min(10, Math.floor((product.sold || 0) / 4));
  if (hasLatestIntent) {
    const ageDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 30) score += 6;
  }

  return score;
};

const formatDateLabel = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

const buildComparisonInsights = (leftProduct, rightProduct) => {
  if (!leftProduct || !rightProduct) return [];

  const comparisons = [
    {
      label: "Lower price",
      getValue: (product) => Number(product.price || 0),
      better: "lower",
      explanation: "better for budget-focused restocking",
    },
    {
      label: "Higher stock",
      getValue: (product) => Number(product.stock || 0),
      better: "higher",
      explanation: "safer if you need immediate bulk availability",
    },
    {
      label: "Newer arrival",
      getValue: (product) => new Date(product.createdAt).getTime() || 0,
      better: "higher",
      explanation: "more recent in the catalog",
    },
  ];

  return comparisons.map((comparison) => {
    const leftValue = comparison.getValue(leftProduct);
    const rightValue = comparison.getValue(rightProduct);
    const equal = leftValue === rightValue;

    let winner = "Tie";
    if (!equal) {
      const leftWins = comparison.better === "lower"
        ? leftValue < rightValue
        : leftValue > rightValue;
      winner = leftWins ? leftProduct.name : rightProduct.name;
    }

    return {
      label: comparison.label,
      winner,
      explanation: equal ? "Both products are evenly matched here." : comparison.explanation,
    };
  });
};

const buildComparisonSummary = (leftProduct, rightProduct, insights) => {
  if (!leftProduct || !rightProduct || insights.length === 0) return "";

  const wins = new Map([
    [leftProduct.name, 0],
    [rightProduct.name, 0],
  ]);

  insights.forEach((insight) => {
    if (wins.has(insight.winner)) {
      wins.set(insight.winner, wins.get(insight.winner) + 1);
    }
  });

  const leftWins = wins.get(leftProduct.name) || 0;
  const rightWins = wins.get(rightProduct.name) || 0;

  if (leftWins === rightWins) {
    return `${leftProduct.name} is better if you want value pricing, while ${rightProduct.name} is a balanced alternative with similar overall strength.`;
  }

  const winner = leftWins > rightWins ? leftProduct : rightProduct;
  const runnerUp = winner._id === leftProduct._id ? rightProduct : leftProduct;

  return `${winner.name} comes out ahead overall. Choose ${winner.name} for the stronger mix of price, availability, and freshness. Pick ${runnerUp.name} if its specific category fit matters more than the headline metrics.`;
};

export default function VendorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [approved, setApproved] = useState(false);

  const [products, setProducts] = useState([]);
  const [cartQty, setCartQty] = useState({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const categoryScrollerRef = useRef(null);
  const categoryRowRef = useRef(null);
  const subcategoryScrollerRef = useRef(null);
  const subcategoryRowRef = useRef(null);

  const scrollChipRow = (ref, direction) => {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: direction * 220,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const refs = [
      { scrollerRef: categoryScrollerRef, rowRef: categoryRowRef },
      { scrollerRef: subcategoryScrollerRef, rowRef: subcategoryRowRef },
    ];
    const cleanups = refs.map((ref) => {
      const scroller = ref.scrollerRef.current;
      const row = ref.rowRef.current;
      if (!scroller || !row) return null;

      const onWheel = (event) => {
        const delta = event.deltaY || event.deltaX;
        if (!delta) return;
        if (row.scrollWidth <= row.clientWidth) return;

        row.scrollLeft += delta;
        event.preventDefault();
        event.stopPropagation();
      };

      scroller.addEventListener("wheel", onWheel, { passive: false });
      return () => scroller.removeEventListener("wheel", onWheel);
    });

    return () => {
      cleanups.forEach((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, [selectedCategory, categories.length, subcategories.length]);

  useEffect(() => {
    const linkedSearch = String(searchParams.get("search") || "").trim();
    if (linkedSearch) {
      setSearchTerm(linkedSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "vendor") {
        navigate("/");
        return;
      }

      try {
        const profileRes = await api.get("/vendor/profile");
        setApproved(profileRes.data.approved);

        await fetchProducts();
        await fetchCategories();
      } catch (err) {
        console.error("Init error", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await api.get("/subcategories");
        setSubcategories(res.data || []);
      } catch (err) {
        console.error("Subcategory fetch failed");
      }
    };

    fetchSubcategories();
  }, []);

  const fetchProducts = async (sort = "") => {
    const res = await api.get("/products", {
      params: {
        sort,
        t: Date.now(),
      },
    });
    setProducts(res.data || []);
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data || []);
  };

  const sortedPrices = [...products].map((p) => Number(p.price || 0)).sort((a, b) => a - b);
  const lowPrice = sortedPrices.length
    ? sortedPrices[Math.floor((sortedPrices.length - 1) * 0.35)]
    : 0;
  const highPrice = sortedPrices.length
    ? sortedPrices[Math.floor((sortedPrices.length - 1) * 0.7)]
    : 0;

  const suggestionDictionary = [
    ...new Set([
      ...SEARCH_ALIASES.cheap,
      ...SEARCH_ALIASES.premium,
      ...SEARCH_ALIASES.popular,
      ...SEARCH_ALIASES.latest,
      ...products.flatMap((p) => tokenize(p.name)),
      ...products.flatMap((p) => tokenize(p.category?.name)),
      ...products.flatMap((p) => tokenize(p.subcategory?.name))
    ])
  ];

  const hasSearch = Boolean(normalizeText(searchTerm));
  const queryTokens = tokenize(searchTerm);
  const correctedQueryTokens = queryTokens.map((t) => getClosestWord(t, suggestionDictionary));
  const correctedSearchText = correctedQueryTokens.join(" ");
  const effectiveSearchText = hasSearch ? correctedSearchText : "";
  const queryIntentFlags = getIntentFlags(queryTokens);
  const queryHasCheapIntent = queryIntentFlags.hasCheapIntent;
  const queryHasPremiumIntent = queryIntentFlags.hasPremiumIntent;
  const queryHasPopularIntent = queryIntentFlags.hasPopularIntent;
  const queryHasLatestIntent = queryIntentFlags.hasLatestIntent;

  const visibleSubcategoryChips = selectedCategory
    ? subcategories.filter((subcategory) => subcategory.category?._id === selectedCategory)
    : [];

  let filteredProducts = products
    .filter((p) => {
      const matchCategory = !selectedCategory || p.category?._id === selectedCategory;
      const matchSubcategory = !selectedSubcategory || p.subcategory?._id === selectedSubcategory;
      return matchCategory && matchSubcategory;
    })
    .map((p) => ({
      product: p,
      aiScore: getAiScore(p, effectiveSearchText, lowPrice, highPrice)
    }))
    .filter((entry) => !hasSearch || entry.aiScore > 0)
    .sort((a, b) => {
      if (!hasSearch) return 0;
      if (queryHasCheapIntent) {
        return Number(a.product.price || 0) - Number(b.product.price || 0);
      }
      if (queryHasPremiumIntent) {
        return Number(b.product.price || 0) - Number(a.product.price || 0);
      }
      if (queryHasPopularIntent) {
        return Number(b.product.sold || 0) - Number(a.product.sold || 0);
      }
      if (queryHasLatestIntent) {
        return new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime();
      }
      if (b.aiScore !== a.aiScore) return b.aiScore - a.aiScore;
      if (b.product.sold !== a.product.sold) return (b.product.sold || 0) - (a.product.sold || 0);
      return b.aiScore - a.aiScore;
    })
    .map((entry) => entry.product);

  if (sortBy === "priceHigh") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (sortBy === "priceLow") {
    filteredProducts.sort((a, b) => a.price - b.price);
  }

  if (sortBy === "new") {
    filteredProducts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (sortBy === "bestsell") {
    filteredProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  }

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const lowStockProductsCount = products.filter((product) => {
    const stock = Number(product.stock || 0);
    return stock > 0 && stock < 10;
  }).length;
  const compareProducts = compareIds
    .map((id) => products.find((product) => product._id === id))
    .filter(Boolean);
  const comparisonInsights = compareProducts.length === 2
    ? buildComparisonInsights(compareProducts[0], compareProducts[1])
    : [];
  const comparisonSummary = compareProducts.length === 2
    ? buildComparisonSummary(compareProducts[0], compareProducts[1], comparisonInsights)
    : "";

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchTerm, sortBy, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSortChange = (value) => {
    setSortBy(value);
    fetchProducts(value);
  };

  const handleItemsPerPageChange = (event) => {
    const nextSize = Number.parseInt(event.target.value, 10);
    const safeSize = [4, 8, 12, 16].includes(nextSize) ? nextSize : 4;
    setItemsPerPage(safeSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchProducts(sortBy);
  }, [location.key]);

  useEffect(() => {
    const refreshProducts = async () => {
      try {
        await fetchProducts(sortBy);
      } catch (err) {
        console.error("Auto refresh failed", err);
      }
    };

    const intervalId = setInterval(refreshProducts, 5000);

    const onFocus = () => {
      refreshProducts();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        refreshProducts();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [sortBy]);

  const increaseQty = (id) => {
    setCartQty((prev) => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  };

  const decreaseQty = (id) => {
    setCartQty((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) - 1) }));
  };

  const addToCart = async (productId) => {
    try {
      const qty = cartQty[productId] || 1;
      await api.post("/cart/add", { productId, quantity: qty });
      window.dispatchEvent(new Event("cart-updated"));
      alert("Added to cart successfully!");
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Add to cart failed");
    }
  };

  const toggleCompareProduct = (productId) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      if (prev.length >= 2) {
        alert("You can compare only two products at a time.");
        return prev;
      }

      return [...prev, productId];
    });
  };

  const clearComparison = () => {
    setCompareIds([]);
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <VendorLayout>
      <main className="vendor-main">
        {!approved && (
          <div className="status-banner warning">
            Pending approval — cart disabled
          </div>
        )}

        <section className="vendor-storefront-strip">
          <div className="vendor-storefront-bar">
            <div className="vendor-storefront-brand">JensnMart</div>
            <div className="vendor-storefront-search">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for Grocery, Stores, Vegetable or Meat"
              />
            </div>

            <div className="vendor-dashboard-tools">
              <div className="filter-item vendor-dashboard-sort-card">
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="">✨ Default</option>
                  <option value="bestsell">🔥 Most Sold</option>
                  <option value="priceHigh">💸 Price High to Low</option>
                  <option value="priceLow">🪙 Price Low to High</option>
                  <option value="new">🆕 New Arrivals</option>
                </select>
              </div>
            </div>
          </div>

          <div className="vendor-dashboard-hero">
            <div className="vendor-dashboard-hero-copy">
              <span className="vendor-dashboard-eyebrow">Purchase Desk</span>
              <h1>Stock up faster with sharper search.</h1>
              <p>
                Browse categories, compare products, and place vendor orders from one cleaner workspace.
              </p>
            </div>

            <div className="vendor-dashboard-stats">
              <article className="vendor-stat-card">
                <span>Catalog</span>
                <strong>{products.length}</strong>
                <small>products live</small>
              </article>
              <article className="vendor-stat-card">
                <span>Categories</span>
                <strong>{categories.length}</strong>
                <small>browse lanes</small>
              </article>
              <article className="vendor-stat-card">
                <span>Low Stock</span>
                <strong>{lowStockProductsCount}</strong>
                <small>running low</small>
              </article>
            </div>
          </div>

          <div className="vendor-storefront-categories">
            <div className="vendor-section-heading">
              <h2>Categories</h2>
              <p>Browse every category lane without losing your place.</p>
            </div>
            <div ref={categoryScrollerRef} className="vendor-storefront-chip-scroller">
              <button
                type="button"
                className="vendor-chip-nav"
                onClick={() => scrollChipRow(categoryRowRef, -1)}
                aria-label="Scroll categories left"
              >
                ‹
              </button>

                <div
                  ref={categoryRowRef}
                  className="vendor-storefront-chip-row"
                >
                <button
                  type="button"
                  className={`vendor-storefront-chip ${selectedCategory === "" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedSubcategory("");
                  }}
                >
                  All
                </button>

                {categories.map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    className={`vendor-storefront-chip ${selectedCategory === category._id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedCategory(category._id);
                      setSelectedSubcategory("");
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="vendor-chip-nav"
                onClick={() => scrollChipRow(categoryRowRef, 1)}
                aria-label="Scroll categories right"
              >
                ›
              </button>
            </div>
          </div>

          {selectedCategory && (
            <div className="vendor-storefront-categories">
              <div className="vendor-section-heading">
                <h2>Subcategories</h2>
                <p>Refine the selected category before adding products to cart.</p>
              </div>
              <div ref={subcategoryScrollerRef} className="vendor-storefront-chip-scroller">
                <button
                  type="button"
                  className="vendor-chip-nav"
                  onClick={() => scrollChipRow(subcategoryRowRef, -1)}
                  aria-label="Scroll subcategories left"
                >
                  ‹
                </button>

                <div
                  ref={subcategoryRowRef}
                  className="vendor-storefront-chip-row"
                >
                  <button
                    type="button"
                    className={`vendor-storefront-chip ${selectedSubcategory === "" ? "active" : ""}`}
                    onClick={() => setSelectedSubcategory("")}
                  >
                    All
                  </button>

                  {visibleSubcategoryChips.map((subcategory) => (
                    <button
                      key={subcategory._id}
                      type="button"
                      className={`vendor-storefront-chip ${selectedSubcategory === subcategory._id ? "active" : ""}`}
                      onClick={() => setSelectedSubcategory(subcategory._id)}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="vendor-chip-nav"
                  onClick={() => scrollChipRow(subcategoryRowRef, 1)}
                  aria-label="Scroll subcategories right"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </section>

        {/* PAGINATION BAR */}
        <div className="vendor-pagination-toolbar">
          <p className="vendor-pagination-count">
            Showing {filteredProducts.length === 0 ? 0 : startIndex + 1}-
            {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
          </p>
          <div className="vendor-page-size">
            <label htmlFor="vendor-page-size">Items per page</label>
            <select
              id="vendor-page-size"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
            </select>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="vendor-product-grid">
          {paginatedProducts.map(p => (
            <div className="vendor-product-card" key={p._id}>
              <div className="v-card-img">
                <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} />
                <span className="stock-label">{p.stock} in stock</span>
                <button
                  type="button"
                  className={`compare-toggle-btn ${compareIds.includes(p._id) ? "active" : ""}`}
                  onClick={() => toggleCompareProduct(p._id)}
                >
                  {compareIds.includes(p._id) ? "Selected" : "Compare"}
                </button>
              </div>

              <div className="v-card-body">
                <h4>{p.name}</h4>
                <p>₹{p.price}</p>
                <div className="v-card-meta">
                  <span>{p.category?.name || "Uncategorized"}</span>
                  <span>{p.subcategory?.name || "No subcategory"}</span>
                </div>

                <div className="v-purchase-zone">
                  <div className="v-qty-selector">
                    <button onClick={() => decreaseQty(p._id)}>−</button>
                    <span>{cartQty[p._id] || 1}</span>
                    <button onClick={() => increaseQty(p._id)}>+</button>
                  </div>

                  <button
                    className="v-add-btn"
                    disabled={!approved}
                    onClick={() => addToCart(p._id)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length > 0 && (
          <div className="vendor-pagination">
            <button
              className="vendor-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`vendor-page-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="vendor-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}

        {compareProducts.length > 0 && (
          <section className="vendor-compare-tray">
            <div className="vendor-compare-tray-copy">
              <span className="vendor-compare-eyebrow">Product compare</span>
              <strong>
                {compareProducts.length === 1
                  ? "Select one more product to compare."
                  : `${compareProducts[0].name} vs ${compareProducts[1].name}`}
              </strong>
              <p>
                {compareProducts.length === 1
                  ? "Pick another product card to unlock the AI comparison summary."
                  : "Review the side-by-side metrics and the generated buying recommendation below."}
              </p>
            </div>
            <div className="vendor-compare-tray-actions">
              {compareProducts.map((product) => (
                <span key={product._id} className="vendor-compare-pill">
                  {product.name}
                </span>
              ))}
              <button
                type="button"
                className="vendor-compare-clear"
                onClick={clearComparison}
              >
                Clear
              </button>
            </div>
          </section>
        )}

        {compareProducts.length === 2 && (
          <section className="vendor-compare-panel">
            <div className="vendor-compare-panel-header">
              <div>
                <span className="vendor-compare-eyebrow">AI compare</span>
                <h3>Which product fits the vendor better?</h3>
              </div>
              <p>{comparisonSummary}</p>
            </div>

            <div className="vendor-compare-grid">
              {compareProducts.map((product) => (
                <article key={product._id} className="vendor-compare-card">
                  <div className="vendor-compare-card-top">
                    <img src={`http://localhost:5000/uploads/${product.image}`} alt={product.name} />
                    <div>
                      <h4>{product.name}</h4>
                      <span>{product.category?.name || "Uncategorized"}</span>
                    </div>
                  </div>
                  <div className="vendor-compare-stats">
                    <div>
                      <span>Price</span>
                      <strong>₹{product.price}</strong>
                    </div>
                    <div>
                      <span>Stock</span>
                      <strong>{product.stock}</strong>
                    </div>
                    <div>
                      <span>Added</span>
                      <strong>{formatDateLabel(product.createdAt)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="vendor-compare-insights">
              {comparisonInsights.map((insight) => (
                <div key={insight.label} className="vendor-compare-insight">
                  <span>{insight.label}</span>
                  <strong>{insight.winner}</strong>
                  <p>{insight.explanation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Footer />
      </main>
    </VendorLayout>
  );
}
