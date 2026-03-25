import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowUpDown,
  Columns3,
  Download,
  EllipsisVertical,
  Funnel,
  GripHorizontal,
  LayoutGrid,
  Maximize2,
  Menu,
  RefreshCw,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../../services/api";
import OrderTimeline from "../../components/OrderTimeline";
import { Button } from "../../components/ui/button";

const STATUS_OPTIONS = [
  "all",
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Returned",
  "Cancelled",
];

const SUMMARY_STATUSES = ["Placed", "Processing", "Shipped", "Delivered", "Returned", "Cancelled"];

const getStatusTone = (status) => {
  switch (status) {
    case "Delivered":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20";
    case "Processing":
      return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20";
    case "Shipped":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20";
    case "Returned":
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20";
    case "Cancelled":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/20";
    default:
      return "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20";
  }
};

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [commission, setCommission] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [compactRows, setCompactRows] = useState(false);
  const [showAddressColumn, setShowAddressColumn] = useState(true);
  const [showSummaryStrip, setShowSummaryStrip] = useState(true);
  const [fullWidthMode, setFullWidthMode] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "orderId", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const searchInputRef = useRef(null);

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders/admin");
      setOrders(res.data || []);
    } catch {
      toast.error("Failed to load orders");
    }
  };

  const loadCommission = async () => {
    try {
      const res = await api.get("/orders/commission");
      setCommission(res.data?.total || 0);
    } catch {}
  };

  useEffect(() => {
    loadOrders();
    loadCommission();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/status/${id}`, { status });
      toast.success("Status updated");
      loadOrders();
      loadCommission();
    } catch {
      toast.error("Update failed");
    }
  };

  const vendors = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      if (order.vendor?._id) map.set(order.vendor._id, order.vendor.email);
    });
    return Array.from(map.entries()).map(([id, email]) => ({ id, email }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (vendorFilter !== "all" && order.vendor?._id !== vendorFilter) return false;
      if (!search.trim()) return true;

      const needle = search.trim().toLowerCase();
      return [
        order.orderNumber,
        order.vendor?.email,
        order.deliveryAddress,
        order.products?.[0]?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [orders, search, statusFilter, vendorFilter]);

  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];

    const getValue = (order, key) => {
      switch (key) {
        case "vendor":
          return String(order.vendor?.email || "");
        case "items":
          return String(order.products?.[0]?.name || "");
        case "total":
          return Number(order.total || 0);
        case "status":
          return String(order.status || "");
        case "address":
          return String(order.deliveryAddress || "");
        default:
          return String(order.orderNumber || order._id || "");
      }
    };

    list.sort((a, b) => {
      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const compared = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortConfig.direction === "asc" ? compared : -compared;
    });

    return list;
  }, [filteredOrders, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, vendorFilter, itemsPerPage, sortConfig]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      placed: orders.filter((order) => order.status === "Placed").length,
      processing: orders.filter((order) => order.status === "Processing").length,
      shipped: orders.filter((order) => order.status === "Shipped").length,
      delivered: orders.filter((order) => order.status === "Delivered").length,
      returned: orders.filter((order) => order.status === "Returned").length,
      cancelled: orders.filter((order) => order.status === "Cancelled").length,
    };
  }, [orders]);

  const commissionRupees = Math.round(Number(commission || 0));

  const resetOrdersView = () => {
    setStatusFilter("all");
    setSearch("");
    setVendorFilter("all");
    setExpandedOrders({});
    setSortConfig({ key: "orderId", direction: "desc" });
    toast.success("Orders view reset");
  };

  const handleRefresh = async () => {
    await Promise.all([loadOrders(), loadCommission()]);
    toast.success("Orders refreshed");
  };

  const toggleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const cycleHeaderFilter = (key) => {
    if (key === "status") {
      const currentIndex = STATUS_OPTIONS.indexOf(statusFilter);
      setStatusFilter(STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length]);
      return;
    }

    if (key === "vendor" && vendors.length) {
      setVendorFilter((prev) => {
        const ids = ["all", ...vendors.map((vendor) => vendor.id)];
        const currentIndex = ids.indexOf(prev);
        return ids[(currentIndex + 1) % ids.length];
      });
      return;
    }

    searchInputRef.current?.focus();
  };

  const exportOrders = () => {
    if (!sortedOrders.length) {
      toast.error("No orders to export");
      return;
    }

    const headers = ["Order ID", "Vendor", "Items", "Total", "Status", "Address"];
    const csvRows = sortedOrders.map((order) =>
      [
        order.orderNumber || order._id,
        order.vendor?.email || "-",
        (order.products || []).map((product) => `${product.name} x${product.qty}`).join(" | "),
        order.total || 0,
        order.status || "-",
        String(order.deliveryAddress || "").replace(/\r?\n/g, " "),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleOrderProducts = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const renderHeader = (label, key) => (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <div className="flex items-center gap-1 text-zinc-500">
        <button
          type="button"
          className="rounded p-1 transition hover:bg-white/5 hover:text-zinc-200"
          onClick={() => cycleHeaderFilter(key)}
          aria-label={`${label} filter`}
        >
          <Funnel className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded p-1 transition hover:bg-white/5 hover:text-zinc-200"
          onClick={() => toggleSort(key)}
          aria-label={`${label} sort`}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded p-1 transition hover:bg-white/5 hover:text-zinc-200"
          onClick={() => setCompactRows((prev) => !prev)}
          aria-label={`${label} density`}
        >
          <GripHorizontal className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded p-1 transition hover:bg-white/5 hover:text-zinc-200"
          onClick={() => setExpandedOrders({})}
          aria-label={`${label} more`}
        >
          <EllipsisVertical className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${fullWidthMode ? "max-w-none" : "mx-auto max-w-[1500px]"} px-0 py-5`}>
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#1a1a1f] text-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="border-b border-white/6 bg-[#1f1f24] px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-500">
                Order Management
              </p>
              <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-white">ORDERS</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  In View
                </div>
                <div className="text-lg font-extrabold text-white">{sortedOrders.length}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Commission
                </div>
                <div className="text-lg font-extrabold text-white">Rs {commissionRupees.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {showSummaryStrip && (
          <div className="grid gap-2 border-b border-white/6 bg-[#1b1b20] px-5 py-3 md:grid-cols-3 xl:grid-cols-6">
            {SUMMARY_STATUSES.map((status) => (
              <div key={status} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {status}
                </div>
                <div className="mt-1 text-lg font-extrabold text-white">{stats[status.toLowerCase()]}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-b border-white/6 bg-[#18181d] px-4 py-3">
          <Button
            onClick={exportOrders}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:from-violet-500 hover:to-fuchsia-400"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-zinc-300">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order id"
                className="h-11 w-full border-0 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 min-w-[150px] rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-100 outline-none"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="bg-zinc-900">
                  {status === "all" ? "All Status" : status}
                </option>
              ))}
            </select>

            <select
              value={vendorFilter}
              onChange={(event) => setVendorFilter(event.target.value)}
              className="h-11 min-w-[180px] rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-100 outline-none"
            >
              <option value="all" className="bg-zinc-900">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id} className="bg-zinc-900">
                  {vendor.email}
                </option>
              ))}
            </select>

            <select
              value={itemsPerPage}
              onChange={(event) => setItemsPerPage(Number(event.target.value))}
              className="h-11 min-w-[120px] rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-100 outline-none"
            >
              {[4, 6, 8, 12].map((count) => (
                <option key={count} value={count} className="bg-zinc-900">
                  {count} / page
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={resetOrdersView}
              className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white"
            >
              Reset
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
              onClick={() => searchInputRef.current?.focus()}
              aria-label="Focus search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className={`rounded-xl border p-2.5 transition ${
                compactRows
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
              }`}
              onClick={() => setCompactRows((prev) => !prev)}
              aria-label="Toggle compact rows"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className={`rounded-xl border p-2.5 transition ${
                showAddressColumn
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
              }`}
              onClick={() => setShowAddressColumn((prev) => !prev)}
              aria-label="Toggle address column"
            >
              <Columns3 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className={`rounded-xl border p-2.5 transition ${
                fullWidthMode
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
              }`}
              onClick={() => setFullWidthMode((prev) => !prev)}
              aria-label="Toggle full width"
            >
              <Maximize2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className={`rounded-xl border p-2.5 transition ${
                showSummaryStrip
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
              }`}
              onClick={() => setShowSummaryStrip((prev) => !prev)}
              aria-label="Toggle summary strip"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
              onClick={handleRefresh}
              aria-label="Refresh orders"
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
              onClick={resetOrdersView}
              aria-label="Reset orders view"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full border-collapse">
            <thead>
              <tr className="bg-[#17171c] text-left text-sm font-bold text-zinc-200">
                <th className="border-b border-white/8 px-6 py-4">{renderHeader("Order Id", "orderId")}</th>
                <th className="border-b border-white/8 px-6 py-4">{renderHeader("Vendor", "vendor")}</th>
                <th className="border-b border-white/8 px-6 py-4">{renderHeader("Items", "items")}</th>
                <th className="border-b border-white/8 px-6 py-4">{renderHeader("Total", "total")}</th>
                <th className="border-b border-white/8 px-6 py-4">{renderHeader("Status", "status")}</th>
                {showAddressColumn && (
                  <th className="border-b border-white/8 px-6 py-4">{renderHeader("Address", "address")}</th>
                )}
                <th className="border-b border-white/8 px-6 py-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const products = order.products || [];
                const previewProduct = products[0];
                const isExpanded = Boolean(expandedOrders[order._id]);
                const cellPadding = compactRows ? "py-3" : "py-4";

                return (
                  <Fragment key={order._id}>
                    <tr className="border-b border-white/6 bg-[#1b1b21] text-sm text-zinc-300 transition hover:bg-[#23232b]">
                      <td className={`px-6 ${cellPadding}`}>
                        <div className="font-semibold text-zinc-100">
                          order_{order.orderNumber || order._id?.slice(-10)}
                        </div>
                      </td>
                      <td className={`px-6 ${cellPadding}`}>
                        <div className="max-w-[260px] truncate">{order.vendor?.email || "-"}</div>
                      </td>
                      <td className={`px-6 ${cellPadding}`}>
                        {previewProduct ? (
                          <div className="flex min-w-[240px] items-center gap-3">
                            <img
                              src={`http://localhost:5000/uploads/${previewProduct.image}`}
                              alt=""
                              className={`${compactRows ? "h-10 w-10" : "h-12 w-12"} rounded-xl object-cover bg-white`}
                            />
                            <div>
                              <div className="font-semibold text-zinc-100">{previewProduct.name}</div>
                              <div className="mt-1 text-xs text-zinc-500">
                                Qty {previewProduct.qty}
                                {products.length > 1 ? ` + ${products.length - 1} more` : ""}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500">No items</span>
                        )}
                      </td>
                      <td className={`px-6 ${cellPadding}`}>
                        <div className="font-semibold text-zinc-100">
                          Rs {Number(order.total || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className={`px-6 ${cellPadding}`}>
                        <div className="flex min-w-[170px] items-center gap-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusTone(order.status)}`}>
                            {order.status}
                          </span>
                          <select
                            value={order.status}
                            onChange={(event) => updateStatus(order._id, event.target.value)}
                            className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-100 outline-none"
                          >
                            {STATUS_OPTIONS.filter((status) => status !== "all").map((status) => (
                              <option key={status} value={status} className="bg-zinc-900">
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      {showAddressColumn && (
                        <td className={`px-6 ${cellPadding}`}>
                          <div className="max-w-[280px] truncate text-zinc-400">
                            {order.deliveryAddress || "-"}
                          </div>
                        </td>
                      )}
                      <td className={`px-6 text-center ${cellPadding}`}>
                        <button
                          type="button"
                          onClick={() => toggleOrderProducts(order._id)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#17171c]">
                        <td colSpan={showAddressColumn ? 7 : 6} className="border-b border-white/8 px-6 py-5">
                          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                            <div className="grid gap-3">
                              {products.map((product, index) => (
                                <div
                                  key={`${order._id}-${index}`}
                                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3"
                                >
                                  <img
                                    src={`http://localhost:5000/uploads/${product.image}`}
                                    alt=""
                                    className="h-12 w-12 rounded-xl object-cover bg-white"
                                  />
                                  <div>
                                    <div className="font-semibold text-zinc-100">{product.name}</div>
                                    <div className="mt-1 text-xs text-zinc-500">
                                      Qty {product.qty} | Rs {product.price}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-3">
                              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-500">
                                  Timeline
                                </div>
                                <OrderTimeline status={order.status} />
                              </div>
                              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-500">
                                  Delivery Address
                                </div>
                                <p className="m-0 text-sm leading-6 text-zinc-300">
                                  {order.deliveryAddress || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
            className="rounded-xl border border-white/10 bg-[#1b1b21] px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-[#23232b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`h-10 w-10 rounded-xl border text-sm font-bold transition ${
                currentPage === index + 1
                  ? "border-violet-500/40 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
                  : "border-white/10 bg-[#1b1b21] text-zinc-200 hover:bg-[#23232b]"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
            className="rounded-xl border border-white/10 bg-[#1b1b21] px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-[#23232b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
