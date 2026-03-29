import { Fragment, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/api";
import toast from "react-hot-toast";
import OrderTimeline from "../../components/OrderTimeline";
import "../admin.css";

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "Not available";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [commission, setCommission] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [receiptSelectionCount, setReceiptSelectionCount] = useState("3");
  const [receiptDateFrom, setReceiptDateFrom] = useState("");
  const [receiptDateTo, setReceiptDateTo] = useState("");
  const [isReceiptPanelOpen, setIsReceiptPanelOpen] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState("");
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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

  const filtered = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        if (
          search &&
          !String(order.orderNumber || "").toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        if (vendorFilter !== "all" && order.vendor?._id !== vendorFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const orderNumberDiff = Number(b.orderNumber || 0) - Number(a.orderNumber || 0);
        if (orderNumberDiff !== 0) return orderNumberDiff;

        const createdAtDiff =
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (createdAtDiff !== 0) return createdAtDiff;

        return String(b._id || "").localeCompare(String(a._id || ""));
      });
  }, [orders, statusFilter, search, vendorFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, vendorFilter, itemsPerPage]);

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

  const toggleOrderProducts = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const isWithinReceiptDateRange = (order) => {
    if (!receiptDateFrom && !receiptDateTo) return true;

    const orderDate = new Date(order.createdAt || 0);
    if (Number.isNaN(orderDate.getTime())) return false;

    if (receiptDateFrom) {
      const fromDate = new Date(`${receiptDateFrom}T00:00:00`);
      if (orderDate < fromDate) return false;
    }

    if (receiptDateTo) {
      const toDate = new Date(`${receiptDateTo}T23:59:59`);
      if (orderDate > toDate) return false;
    }

    return true;
  };

  const buildReceiptDetails = (order) => {
    const products = Array.isArray(order.products) ? order.products : [];
    const vendorName =
      order.vendor?.name ||
      order.customerName ||
      order.shippingAddress?.name ||
      "Not available";
    const vendorEmail = order.vendor?.email || order.customerEmail || "Not available";
    const vendorPhone =
      order.vendor?.phone ||
      order.phone ||
      order.shippingAddress?.phone ||
      "Not available";
    const deliveryAddress = order.deliveryAddress || "Not available";
    const paymentMethod = order.paymentMethod || order.payment?.method || "Online";
    const transactionId =
      order.razorpayPaymentId ||
      order.transactionId ||
      order.payment?.razorpayPaymentId ||
      order.payment?.transactionId ||
      "Not available";
    const transactionStatus =
      order.paymentStatus ||
      order.payment?.status ||
      (order.status === "Delivered" ? "Paid" : "Pending");
    const orderDate = formatDateTime(order.createdAt);
    const subtotalAmount = products.reduce(
      (sum, product) => sum + Number(product.price || 0) * Number(product.qty || 0),
      0
    );
    const totalAmount = Number(order.total || subtotalAmount || 0);

    return {
      products,
      vendorName,
      vendorEmail,
      vendorPhone,
      deliveryAddress,
      paymentMethod,
      transactionId,
      transactionStatus,
      orderDate,
      subtotalAmount,
      totalAmount,
    };
  };

  const renderReceiptPage = (doc, order, receiptIndex, receiptCount) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const details = buildReceiptDetails(order);

    doc.setFillColor(8, 46, 79);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("JensnMart Receipt", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDateTime(new Date())}`, pageWidth - 14, 14, {
      align: "right",
    });
    doc.text(`Receipt ${receiptIndex + 1} of ${receiptCount}`, pageWidth - 14, 20, {
      align: "right",
    });

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Order Summary", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Order No: #${order.orderNumber || "N/A"}`, 14, 50);
    doc.text(`Order ID: ${order._id || "N/A"}`, 14, 56);
    doc.text(`Created At: ${details.orderDate}`, 14, 62);
    doc.text(`Status: ${order.status || "Not available"}`, 14, 68);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Vendor Details", 14, 82);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${details.vendorName}`, 14, 90);
    doc.text(`Email: ${details.vendorEmail}`, 14, 96);
    doc.text(`Phone: ${details.vendorPhone}`, 14, 102);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Payment & Delivery", 110, 82);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Method: ${details.paymentMethod}`, 110, 90);
    doc.text(`Payment Status: ${details.transactionStatus}`, 110, 96);
    doc.text(`Transaction ID: ${details.transactionId}`, 110, 102);
    doc.text(doc.splitTextToSize(`Address: ${details.deliveryAddress}`, 82), 110, 108);

    autoTable(doc, {
      startY: 126,
      head: [["Product", "Qty", "Unit Price", "Line Total"]],
      body: details.products.map((product) => [
        product.name || "Unnamed product",
        String(product.qty || 0),
        formatCurrency(product.price),
        formatCurrency(Number(product.price || 0) * Number(product.qty || 0)),
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 4,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [8, 46, 79],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable?.finalY || 126;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Subtotal: ${formatCurrency(details.subtotalAmount)}`, pageWidth - 14, finalY + 14, {
      align: "right",
    });
    doc.text(`Total: ${formatCurrency(details.totalAmount)}`, pageWidth - 14, finalY + 22, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "This receipt was downloaded from the admin orders panel.",
      14,
      finalY + 34
    );
  };

  const renderCombinedReceipt = (doc, selectedOrders) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const generatedAt = formatDateTime(new Date());
    const receiptDetails = selectedOrders.map((order) => ({
      order,
      ...buildReceiptDetails(order),
    }));
    const groupedProductRows = receiptDetails.map((details) => ({
      orderNumber: details.order.orderNumber || "N/A",
      productSummary: details.products
        .map((product) => `${product.name || "Unnamed product"} (Qty: ${product.qty || 0})`)
        .join("\n"),
      totalQty: details.products.reduce(
        (sum, product) => sum + Number(product.qty || 0),
        0
      ),
      totalAmount: details.products.reduce(
        (sum, product) => sum + Number(product.price || 0) * Number(product.qty || 0),
        0
      ),
    }));
    const grandTotal = receiptDetails.reduce(
      (sum, details) => sum + Number(details.totalAmount || 0),
      0
    );
    const totalItems = receiptDetails.reduce(
      (sum, details) =>
        sum +
        details.products.reduce((productSum, product) => productSum + Number(product.qty || 0), 0),
      0
    );
    const orderNumbersText = `Orders covered: ${selectedOrders
      .map((order) => `#${order.orderNumber}`)
      .join(", ")}`;
    const orderNumberLines = doc.splitTextToSize(orderNumbersText, pageWidth - 28);
    const getSectionStartY = (preferredY, requiredHeight) => {
      const currentY = doc.lastAutoTable?.finalY || 0;
      if (currentY + requiredHeight > pageHeight - 18) {
        doc.addPage();
        return 24;
      }
      return preferredY;
    };

    doc.setFillColor(8, 46, 79);
    doc.rect(0, 0, pageWidth, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("JensnMart Combined Receipt", 14, 19);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on ${generatedAt}`, pageWidth - 14, 14, { align: "right" });
    doc.text(`${selectedOrders.length} selected order(s)`, pageWidth - 14, 20, {
      align: "right",
    });

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Receipt Summary", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(orderNumberLines, 14, 53);
    const summaryEndY = 53 + orderNumberLines.length * 6;
    doc.text(`Total items: ${totalItems}`, 14, summaryEndY + 2);
    doc.text(`Grand total: ${formatCurrency(grandTotal)}`, 14, summaryEndY + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Product Details", 14, summaryEndY + 17);

    autoTable(doc, {
      startY: summaryEndY + 23,
      head: [["Order No.", "Products", "Total Qty", "Order Total"]],
      body: groupedProductRows.map((row) => [
        `#${row.orderNumber}`,
        row.productSummary || "No products",
        String(row.totalQty),
        formatCurrency(row.totalAmount),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [15, 23, 42],
        valign: "middle",
      },
      headStyles: {
        fillColor: [31, 110, 167],
        textColor: [255, 255, 255],
      },
      margin: { left: 14, right: 14 },
    });

    const productTableEndY = doc.lastAutoTable?.finalY || summaryEndY + 23;
    const vendorTitleY = getSectionStartY(productTableEndY + 14, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Vendor Details", 14, vendorTitleY);

    autoTable(doc, {
      startY: vendorTitleY + 6,
      head: [["Order No.", "Vendor Name", "Email", "Phone"]],
      body: receiptDetails.map((details) => [
        `#${details.order.orderNumber || "N/A"}`,
        details.vendorName,
        details.vendorEmail,
        details.vendorPhone,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [8, 46, 79],
        textColor: [255, 255, 255],
      },
      margin: { left: 14, right: 14 },
    });

    const vendorTableEndY = doc.lastAutoTable?.finalY || vendorTitleY + 6;
    const transactionTitleY = getSectionStartY(vendorTableEndY + 14, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Transaction Details", 14, transactionTitleY);

    autoTable(doc, {
      startY: transactionTitleY + 6,
      head: [["Order No.", "Method", "Transaction ID", "Payment Status", "Amount"]],
      body: receiptDetails.map((details) => [
        `#${details.order.orderNumber || "N/A"}`,
        details.paymentMethod,
        details.transactionId,
        details.transactionStatus,
        formatCurrency(details.totalAmount),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [10, 106, 104],
        textColor: [255, 255, 255],
      },
      margin: { left: 14, right: 14 },
    });

    const finalTableEndY = doc.lastAutoTable?.finalY || transactionTitleY + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(8, 46, 79);
    doc.text(`Grand total for selected orders: ${formatCurrency(grandTotal)}`, pageWidth - 14, finalTableEndY + 14, {
      align: "right",
    });
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const selectReceiptOrders = () => {
    const receiptEligibleOrders = filtered.filter(isWithinReceiptDateRange);
    const limit =
      receiptSelectionCount === "all"
        ? receiptEligibleOrders.length
        : Math.min(Number(receiptSelectionCount || 0), receiptEligibleOrders.length);

    const nextSelection = receiptEligibleOrders.slice(0, limit).map((order) => order._id);
    setSelectedOrderIds(nextSelection);

    if (nextSelection.length === 0) {
      toast.error("No orders match the current receipt filters");
      return;
    }

    toast.success(`${nextSelection.length} order(s) selected for receipt download`);
  };

  const selectReceiptOrdersByDate = () => {
    if (!receiptDateFrom && !receiptDateTo) {
      toast.error("Choose a from or to date first");
      return;
    }

    if (receiptDateFrom && receiptDateTo && receiptDateFrom > receiptDateTo) {
      toast.error("Receipt from date must be before to date");
      return;
    }

    const matchedOrders = filtered.filter(isWithinReceiptDateRange).map((order) => order._id);
    setSelectedOrderIds(matchedOrders);

    if (matchedOrders.length === 0) {
      toast.error("No orders found in that date range");
      return;
    }

    toast.success(`${matchedOrders.length} order(s) selected from the chosen dates`);
  };

  const downloadReceipt = (order) => {
    try {
      setDownloadingOrderId(order._id);
      const doc = new jsPDF();
      renderReceiptPage(doc, order, 0, 1);
      doc.save(`jensnmart-receipt-order-${order.orderNumber || order._id || "download"}.pdf`);
      toast.success(`Receipt downloaded for order #${order.orderNumber || ""}`);
    } catch (error) {
      console.error("Receipt download failed:", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingOrderId("");
    }
  };

  const downloadSelectedReceipts = () => {
    const selectedOrders = filtered.filter(
      (order) => selectedOrderIds.includes(order._id) && isWithinReceiptDateRange(order)
    );

    if (selectedOrders.length === 0) {
      toast.error("Select at least one order for a receipt");
      return;
    }

    try {
      setIsBulkDownloading(true);
      const doc = new jsPDF();
      renderCombinedReceipt(doc, selectedOrders);

      doc.save(`jensnmart-receipts-${selectedOrders.length}-orders.pdf`);
      toast.success(`Downloaded combined receipt for ${selectedOrders.length} order(s)`);
    } catch (error) {
      console.error("Bulk receipt download failed:", error);
      toast.error("Failed to download selected receipts");
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const allVisibleSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((order) => selectedOrderIds.includes(order._id));

  const commissionRupees = Math.round(Number(commission || 0));

  return (
    <div className="admin-container admin-panel-page">
      <section className="admin-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Order oversight</p>
          <h1>Track vendor orders and fulfillment from a unified admin command view.</h1>
          <p>
            Review live order volume, filter by vendor or status, and update
            fulfillment without losing the big-picture view.
          </p>
        </div>

        <div className="admin-page-hero-status">
          <span>Orders in view</span>
          <strong>{filtered.length}</strong>
          <p>
            {orders.length} total orders are loaded, with commission at Rs{" "}
            {commissionRupees.toLocaleString()}.
          </p>
        </div>
      </section>

      <div className="stats-row">
        {["Placed", "Processing", "Shipped", "Delivered", "Returned", "Cancelled"].map((status) => (
          <div className="stat-card" key={status}>
            <span>{status}</span>
            <h3>{stats[status.toLowerCase()]}</h3>
          </div>
        ))}
        <div className="stat-card highlight">
          <span>Commission</span>
          <h3>Rs {commissionRupees.toLocaleString()}</h3>
        </div>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Placed">Placed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Returned">Returned</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          placeholder="Search Order #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
          <option value="all">All Vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.email}
            </option>
          ))}
        </select>

        <button
          className="reset-btn"
          onClick={() => {
            setStatusFilter("all");
            setSearch("");
            setVendorFilter("all");
          }}
        >
          Reset
        </button>

        <div className="orders-page-toolbar">
          <div className="orders-page-size">
            <label htmlFor="orders-page-size">Items per page</label>
            <select
              id="orders-page-size"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>
      </div>

      <div className="orders-table-shell">
        <div className="orders-table-header">
          <div>
            <p className="orders-table-title">Orders Table</p>
            <span className="orders-table-count">
              Showing {paginatedOrders.length} of {filtered.length} orders
            </span>
          </div>

          <div className="orders-receipt-panel-wrap">
            <button
              type="button"
              className="orders-bulk-btn orders-bulk-btn-primary"
              onClick={() => setIsReceiptPanelOpen((open) => !open)}
            >
              {isReceiptPanelOpen
                ? "Close Receipt Options"
                : `Download Receipt (${selectedOrderIds.length})`}
            </button>

            {isReceiptPanelOpen && (
              <div className="orders-receipt-panel">
                <div className="orders-bulk-picker">
                  <label htmlFor="receipt-selection-count">Receipt pick</label>
                  <select
                    id="receipt-selection-count"
                    value={receiptSelectionCount}
                    onChange={(e) => setReceiptSelectionCount(e.target.value)}
                  >
                    <option value="1">1 order</option>
                    <option value="3">3 orders</option>
                    <option value="5">5 orders</option>
                    <option value="10">10 orders</option>
                    <option value="all">All filtered</option>
                  </select>
                </div>

                <div className="orders-date-range">
                  <label className="orders-date-field">
                    <span>From</span>
                    <input
                      type="date"
                      value={receiptDateFrom}
                      onChange={(e) => setReceiptDateFrom(e.target.value)}
                    />
                  </label>
                  <label className="orders-date-field">
                    <span>To</span>
                    <input
                      type="date"
                      value={receiptDateTo}
                      onChange={(e) => setReceiptDateTo(e.target.value)}
                    />
                  </label>
                </div>

                <div className="orders-receipt-panel-actions">
                  <button type="button" className="orders-bulk-btn" onClick={selectReceiptOrders}>
                    Select Orders
                  </button>
                  <button
                    type="button"
                    className="orders-bulk-btn"
                    onClick={selectReceiptOrdersByDate}
                  >
                    Select Date Wise
                  </button>
                  <button
                    type="button"
                    className="orders-bulk-btn orders-bulk-btn-muted"
                    onClick={() => {
                      setSelectedOrderIds([]);
                      setReceiptDateFrom("");
                      setReceiptDateTo("");
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="orders-bulk-btn orders-bulk-btn-primary"
                    onClick={downloadSelectedReceipts}
                    disabled={isBulkDownloading}
                  >
                    {isBulkDownloading
                      ? "Preparing combined receipt..."
                      : `Download Selected (${selectedOrderIds.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>
                  <label className={`orders-select-all ${allVisibleSelected ? "is-checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) =>
                        setSelectedOrderIds((prev) => {
                          const visibleIds = paginatedOrders.map((order) => order._id);
                          if (e.target.checked) {
                            return Array.from(new Set([...prev, ...visibleIds]));
                          }
                          return prev.filter((id) => !visibleIds.includes(id));
                        })
                      }
                    />
                    <span className="orders-checkmark" aria-hidden="true" />
                    <span>Select</span>
                  </label>
                </th>
                <th>Order ID</th>
                <th>Vendor</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Address</th>
                <th>More</th>
              </tr>
            </thead>
            <tbody>
        {paginatedOrders.map((order) => {
          const products = order.products || [];
          const isExpanded = Boolean(expandedOrders[order._id]);
          const isSelected = selectedOrderIds.includes(order._id);
          const firstProduct = products[0];
          const hasPendingPayment =
            order.paymentStatus === "Pending" || order.payment?.status === "Pending";
          const displayStatus = hasPendingPayment ? "Placed" : order.status;
          const vendorName =
            order.vendor?.name ||
            order.customerName ||
            order.shippingAddress?.name ||
            "Not available";
          const vendorEmail = order.vendor?.email || order.customerEmail || "Not available";
          const vendorPhone =
            order.vendor?.phone ||
            order.phone ||
            order.shippingAddress?.phone ||
            "Not available";
          const vendorCountry =
            order.vendor?.country ||
            order.country ||
            order.shippingAddress?.country ||
            "India";
          const paymentMethod = order.paymentMethod || order.payment?.method || "Online";
          const transactionId =
            order.razorpayPaymentId ||
            order.transactionId ||
            order.payment?.razorpayPaymentId ||
            order.payment?.transactionId ||
            "Not available";
          const transactionStatus =
            order.paymentStatus ||
            order.payment?.status ||
            (order.status === "Delivered" ? "Paid" : "Pending");
          const orderDate = formatDateTime(order.createdAt);
          const totalItems = products.reduce((sum, product) => sum + Number(product.qty || 0), 0);
          const subtotalAmount = products.reduce(
            (sum, product) => sum + Number(product.price || 0) * Number(product.qty || 0),
            0
          );

          return (
            <Fragment key={order._id}>
              <tr className="orders-table-row">
                <td>
                  <label className={`orders-row-select ${isSelected ? "is-checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOrderSelection(order._id)}
                    />
                    <span className="orders-checkmark" aria-hidden="true" />
                    <span>{isSelected ? "Picked" : "Pick"}</span>
                  </label>
                </td>
                <td>
                  <div className="orders-table-order-id">
                    <strong>#{order.orderNumber}</strong>
                    <span>{order._id?.slice(-8)}</span>
                  </div>
                </td>
                <td>
                  <div className="orders-table-vendor">
                    <strong>{order.vendor?.email || "-"}</strong>
                  </div>
                </td>
                <td>
                  {firstProduct ? (
                    <div className="orders-table-item">
                      <img src={`http://localhost:5000/uploads/${firstProduct.image}`} alt="" />
                      <div>
                        <strong>{firstProduct.name}</strong>
                        <span>
                          Qty {firstProduct.qty}
                          {products.length > 1 ? ` + ${products.length - 1} more item(s)` : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="orders-table-muted">No products</span>
                  )}
                </td>
                <td>
                  <span className="orders-table-total">
                    Rs {Number(order.total || 0).toLocaleString()}
                  </span>
                </td>
                <td>
                  <select
                    className="orders-table-status"
                    value={displayStatus}
                    disabled={hasPendingPayment}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                  >
                    <option value="Placed">Placed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Returned">Returned</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <div className="orders-table-address">
                    {order.deliveryAddress || "-"}
                    {hasPendingPayment ? " (Payment pending: status locked)" : ""}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="orders-table-expand"
                    onClick={() => toggleOrderProducts(order._id)}
                  >
                    {isExpanded ? "Hide" : "View"}
                  </button>
                </td>
              </tr>
              {isExpanded && (
                <tr className="orders-table-expanded-row">
                  <td colSpan={8}>
                    <div className="orders-table-expanded">
                      <div className="orders-table-products">
                        {products.map((product, index) => (
                          <div key={`${order._id}-${index}`} className="product-chip">
                            <img src={`http://localhost:5000/uploads/${product.image}`} alt="" />
                            <div className="product-info">
                              <span className="p-name">{product.name}</span>
                              <span className="p-details">Qty: {product.qty} | Rs {product.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="orders-table-side">
                        <div className="orders-detail-grid">
                          <div className="orders-detail-card">
                            <span className="orders-detail-kicker">Vendor Details</span>
                            <div className="orders-detail-list">
                              <div>
                                <label>Name</label>
                                <strong>{vendorName}</strong>
                              </div>
                              <div>
                                <label>Email</label>
                                <strong>{vendorEmail}</strong>
                              </div>
                              <div>
                                <label>Phone</label>
                                <strong>{vendorPhone}</strong>
                              </div>
                              <div>
                                <label>Country</label>
                                <strong>{vendorCountry}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="orders-detail-card">
                            <span className="orders-detail-kicker">Order Details</span>
                            <div className="orders-detail-list">
                              <div>
                                <label>Order No.</label>
                                <strong>#{order.orderNumber}</strong>
                              </div>
                              <div>
                                <label>Created At</label>
                                <strong>{orderDate}</strong>
                              </div>
                              <div>
                                <label>Total Items</label>
                                <strong>{totalItems}</strong>
                              </div>
                              <div>
                                <label>Subtotal</label>
                                <strong>{formatCurrency(subtotalAmount)}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="orders-detail-card">
                            <span className="orders-detail-kicker">Transaction Details</span>
                            <div className="orders-detail-list">
                              <div>
                                <label>Method</label>
                                <strong>{paymentMethod}</strong>
                              </div>
                              <div>
                                <label>Transaction ID</label>
                                <strong>{transactionId}</strong>
                              </div>
                              <div>
                                <label>Payment Status</label>
                                <strong>{transactionStatus}</strong>
                              </div>
                              <div>
                                <label>Total Amount</label>
                                <strong>{formatCurrency(order.total)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="timeline-box-dark">
                          <OrderTimeline status={displayStatus} />
                          <div className="order-address-mini">Address: {order.deliveryAddress}</div>
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
        <div className="pagination-container">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
            className="pag-btn"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`page-num ${currentPage === index + 1 ? "active" : ""}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
            className="pag-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
