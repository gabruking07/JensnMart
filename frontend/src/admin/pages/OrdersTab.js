<<<<<<< HEAD
/** Administrator orders tab screen; loads and updates the corresponding marketplace records through the shared API client. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
import { Fragment, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RotateCcw, Sparkles } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import OrderTimeline from "../../components/OrderTimeline";
import "../admin.css";

<<<<<<< HEAD
/** Formats a numeric amount as Indian rupees for consistent display in the user interface. */
const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

/** Converts a date into the date-and-time format used in this screen. */
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "Not available";

/** Calculates how long an order has been open so the admin screen can flag delays. */
=======
const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "Not available";

>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const getOrderAgeHours = (value) => {
  const createdAt = new Date(value || 0).getTime();
  if (Number.isNaN(createdAt) || createdAt <= 0) return 0;
  return Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60));
};

<<<<<<< HEAD
/** Assigns an attention level to an order based on its status and age. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const getOrderRisk = (order) => {
  const ageHours = getOrderAgeHours(order.createdAt);
  const total = Number(order.total || 0);
  const paymentStatus = order.paymentStatus || order.payment?.status || "";
  const itemCount = Array.isArray(order.products)
    ? order.products.reduce((sum, product) => sum + Number(product.qty || 0), 0)
    : 0;

  let score = 0;
  const reasons = [];

  if (paymentStatus === "Pending") {
    score += 2;
    reasons.push("payment pending");
  }

  if (["Returned", "Cancelled"].includes(order.status)) {
    score += 3;
    reasons.push(order.status.toLowerCase());
  }

  if (ageHours >= 72 && ["Placed", "Processing", "Shipped"].includes(order.status)) {
    score += 3;
    reasons.push("aging order");
  } else if (ageHours >= 36 && ["Placed", "Processing"].includes(order.status)) {
    score += 2;
    reasons.push("slow progress");
  }

  if (total >= 10000) {
    score += 2;
    reasons.push("high value");
  } else if (total >= 5000) {
    score += 1;
    reasons.push("large value");
  }

  if (itemCount >= 10) {
    score += 1;
    reasons.push("bulk quantity");
  }

  if (order.status === "Delivered" && paymentStatus === "Paid") {
    score = Math.max(0, score - 2);
  }

  let level = "Low";
  if (score >= 5) level = "High";
  else if (score >= 3) level = "Medium";

  const tone = level.toLowerCase();
  const summary =
    reasons.length > 0 ? reasons.slice(0, 2).join(" • ") : "stable order flow";

  return {
    level,
    tone,
    summary,
  };
};

<<<<<<< HEAD
/** Renders the orders tab interface and coordinates the state and actions for this screen or reusable component. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState("");
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

<<<<<<< HEAD
    /** Fetches order records for the current admin view. */
    const loadOrders = async () => {
=======
  const loadOrders = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    try {
      const res = await api.get("/orders/admin");
      setOrders(res.data || []);
    } catch {
      toast.error("Failed to load orders");
    }
  };

<<<<<<< HEAD
    /** Fetches order commission totals for the admin order/report view. */
    const loadCommission = async () => {
=======
  const loadCommission = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    try {
      const res = await api.get("/orders/commission");
      setCommission(res.data?.total || 0);
    } catch {}
  };

  useEffect(() => {
    loadOrders();
    loadCommission();
  }, []);

<<<<<<< HEAD
    /** Sends a status change to the backend and refreshes the affected record list. */
    const updateStatus = async (id, status) => {
=======
  const updateStatus = async (id, status) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

  const aiSummary = useMemo(() => {
    const processingOrders = orders.filter((order) => order.status === "Processing");
    const shippedOrders = orders.filter((order) => order.status === "Shipped");
    const pendingPaymentOrders = orders.filter(
      (order) => order.paymentStatus === "Pending" || order.payment?.status === "Pending"
    );
    const highValueOrders = orders.filter((order) => Number(order.total || 0) >= 5000);
    const staleOrders = orders.filter((order) => {
      const ageHours = getOrderAgeHours(order.createdAt);
      return (
        ageHours >= 48 &&
        ["Placed", "Processing", "Shipped"].includes(order.status) &&
        order.paymentStatus !== "Paid" &&
        order.payment?.status !== "Paid"
      );
    });

    const vendorStats = new Map();
    orders.forEach((order) => {
      const vendorKey = order.vendor?._id || order.vendor?.email || "unknown";
      const current = vendorStats.get(vendorKey) || {
        name: order.vendor?.name || order.vendor?.email || "Unknown vendor",
        email: order.vendor?.email || "Not available",
        processing: 0,
        returned: 0,
        pending: 0,
      };

      if (order.status === "Processing") current.processing += 1;
      if (order.status === "Returned") current.returned += 1;
      if (order.paymentStatus === "Pending" || order.payment?.status === "Pending") {
        current.pending += 1;
      }

      vendorStats.set(vendorKey, current);
    });

    const vendorHighlights = Array.from(vendorStats.values()).sort((a, b) => {
      const scoreA = a.returned * 3 + a.processing * 2 + a.pending;
      const scoreB = b.returned * 3 + b.processing * 2 + b.pending;
      return scoreB - scoreA;
    });

    const topVendor = vendorHighlights[0];
    const newestOrder = [...orders].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0];
    const deliveredRevenue = orders
      .filter((order) => order.status === "Delivered")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    const overview = [
      `${processingOrders.length} orders are actively processing across the marketplace.`,
      `${pendingPaymentOrders.length} orders still have pending payment status.`,
      `${highValueOrders.length} high-value orders are above Rs 5,000.`,
      `Delivered orders have generated ${formatCurrency(deliveredRevenue)} in completed value.`,
    ];

    const attention = [];
    if (staleOrders.length > 0) {
      const staleOrder = staleOrders
        .slice()
        .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0];
      attention.push(
        `Order #${staleOrder.orderNumber || "N/A"} has been open for more than 48 hours with payment or fulfillment still unresolved.`
      );
    }
    if (topVendor && (topVendor.returned > 0 || topVendor.processing > 2 || topVendor.pending > 1)) {
      attention.push(
        `${topVendor.name} is the busiest risk vendor right now with ${topVendor.processing} processing, ${topVendor.pending} pending-payment, and ${topVendor.returned} returned orders.`
      );
    }
    if (shippedOrders.length > 0) {
      const oldestShipped = shippedOrders
        .slice()
        .sort((a, b) => getOrderAgeHours(b.createdAt) - getOrderAgeHours(a.createdAt))[0];
      if (getOrderAgeHours(oldestShipped.createdAt) >= 72) {
        attention.push(
          `Shipped order #${oldestShipped.orderNumber || "N/A"} looks aged in transit and may need a delivery follow-up.`
        );
      }
    }
    if (newestOrder) {
      attention.push(
        `Latest order received: #${newestOrder.orderNumber || "N/A"} for ${formatCurrency(newestOrder.total)} on ${formatDateTime(newestOrder.createdAt)}.`
      );
    }

    const actions = [];
    if (pendingPaymentOrders.length > 0) {
      actions.push("Review pending-payment orders before advancing their fulfillment status.");
    }
    if (staleOrders.length > 0) {
      actions.push("Prioritize orders older than 48 hours that are still placed, processing, or shipped.");
    }
    if (topVendor && topVendor.returned > 0) {
      actions.push(`Audit return reasons for ${topVendor.name} and confirm any catalog or packing issues.`);
    }
    if (highValueOrders.length > 0) {
      actions.push("Double-check the highest-value orders before marking them delivered or returned.");
    }

    return {
      overview,
      attention: attention.slice(0, 4),
      actions: actions.slice(0, 4),
      metrics: [
        {
          label: "Needs review",
          value: staleOrders.length + pendingPaymentOrders.length,
          caption: "stale or pending-payment orders",
        },
        {
          label: "High value",
          value: highValueOrders.length,
          caption: "orders above Rs 5,000",
        },
        {
          label: "Top vendor watch",
          value: topVendor?.name || "None",
          caption: topVendor ? `${topVendor.returned} returns flagged` : "no vendor risk pattern",
        },
      ],
    };
  }, [orders]);

<<<<<<< HEAD
    /** Expands or collapses the product details for an order row. */
    const toggleOrderProducts = (orderId) => {
=======
  const toggleOrderProducts = (orderId) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

<<<<<<< HEAD
  /** Checks whether an order date belongs to the selected receipt export range. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Collects order fields into the receipt data structure used by the PDF renderer. */
    const buildReceiptDetails = (order) => {
=======
  const buildReceiptDetails = (order) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Draws one order receipt into the PDF document using the prepared receipt details. */
    const renderReceiptPage = (doc, order, receiptIndex, receiptCount) => {
=======
  const renderReceiptPage = (doc, order, receiptIndex, receiptCount) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Draws multiple selected orders into one receipt PDF for batch export. */
    const renderCombinedReceipt = (doc, selectedOrders) => {
=======
  const renderCombinedReceipt = (doc, selectedOrders) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
<<<<<<< HEAD
        /** Finds the next vertical position in the PDF so receipt sections do not overlap. */
        const getSectionStartY = (preferredY, requiredHeight) => {
=======
    const getSectionStartY = (preferredY, requiredHeight) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
  /** Performs the toggle order selection step used by this module's workflow. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

<<<<<<< HEAD
    /** Selects the currently listed orders for a bulk PDF export. */
    const selectReceiptOrders = () => {
=======
  const selectReceiptOrders = () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Selects orders inside the chosen date range for PDF export. */
    const selectReceiptOrdersByDate = () => {
=======
  const selectReceiptOrdersByDate = () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Exports the selected order details as a downloadable receipt. */
    const downloadReceipt = (order) => {
=======
  const downloadReceipt = (order) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Creates one PDF containing the receipts for all selected orders. */
    const downloadSelectedReceipts = () => {
=======
  const downloadSelectedReceipts = () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

        <div className="orders-filter-actions">
          <button
            className="reset-btn orders-filter-btn orders-filter-btn-secondary"
            onClick={() => {
              setStatusFilter("all");
              setSearch("");
              setVendorFilter("all");
            }}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reset
          </button>

          <button
            type="button"
            className={`orders-ai-summary-toggle orders-filter-btn ${
              isAiSummaryOpen ? "is-open" : ""
            }`}
            onClick={() => setIsAiSummaryOpen((open) => !open)}
          >
            <Sparkles size={15} aria-hidden="true" />
            {isAiSummaryOpen ? "Hide AI Summary" : "Show AI Summary"}
          </button>
        </div>

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

      {isAiSummaryOpen && (
        <section className="orders-ai-summary">
          <div className="orders-ai-summary-hero">
            <div>
              <p className="orders-ai-summary-kicker">AI Summary</p>
              <h2>What deserves attention in orders right now?</h2>
              <p>
                A quick plain-language read of payment friction, fulfillment delays,
                vendor pressure, and recent order movement.
              </p>
            </div>

            <div className="orders-ai-summary-metrics">
              {aiSummary.metrics.map((metric) => (
                <article key={metric.label} className="orders-ai-metric-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.caption}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="orders-ai-summary-grid">
            <article className="orders-ai-card">
              <span className="orders-ai-card-title">Overview</span>
              <div className="orders-ai-list">
                {aiSummary.overview.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>

            <article className="orders-ai-card">
              <span className="orders-ai-card-title">Attention Alerts</span>
              <div className="orders-ai-list">
                {aiSummary.attention.length > 0 ? (
                  aiSummary.attention.map((item) => <p key={item}>{item}</p>)
                ) : (
                  <p>No urgent order risk patterns are standing out right now.</p>
                )}
              </div>
            </article>

            <article className="orders-ai-card">
              <span className="orders-ai-card-title">Suggested Actions</span>
              <div className="orders-ai-list">
                {aiSummary.actions.length > 0 ? (
                  aiSummary.actions.map((item) => <p key={item}>{item}</p>)
                ) : (
                  <p>Orders look steady. Keep monitoring status changes and payment updates.</p>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

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
                <th>Risk</th>
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
          const risk = getOrderRisk(order);
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
                  <div className="orders-risk-wrap">
                    <span className={`orders-risk-badge ${risk.tone}`}>{risk.level} Risk</span>
                    <small>{risk.summary}</small>
                  </div>
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
                  <td colSpan={9}>
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

