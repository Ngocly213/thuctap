const INVOICES_DATA_URL = "data/invoices.json";

const DEFAULT_ITEMS = [
  {
    no: 1,
    item: "Awesome Rubber Bacon",
    description: "Boston's most advanced compression wear technology increases muscle oxygenation, stabilizes active muscles",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  },
  {
    no: 2,
    item: "Incredible Concrete Shoes",
    description: "New range of formal shirts are designed keeping you in mind. With fits and styling that will make you stand apart",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  },
  {
    no: 3,
    item: "Intelligent Rubber Towels",
    description: "The Apollotech B340 is an affordable wireless mouse with reliable connectivity, 12 months battery life and modern design",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  },
  {
    no: 4,
    item: "Handcrafted Plastic Fish",
    description: "The beautiful range of Apple Naturalé that has an exciting mix of natural ingredients. With the Goodness of 100% Natural Ingredients",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  },
  {
    no: 5,
    item: "Intelligent Steel Mouse",
    description: "The beautiful range of Apple Naturalé that has an exciting mix of natural ingredients. With the Goodness of 100% Natural Ingredients",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  },
  {
    no: 6,
    item: "Unbranded Frozen Computer",
    description: "The slim & simple Maple Gaming Keyboard from Dev Byte comes with a sleek body and 7- Color RGB LED Back-lighting for smart functionality",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  },
  {
    no: 7,
    item: "Intelligent Plastic Keyboard",
    description: "The beautiful range of Apple Naturalé that has an exciting mix of natural ingredients. With the Goodness of 100% Natural Ingredients",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  },
  {
    no: 8,
    item: "Ergonomic Concrete Chicken",
    description: "The Apollotech B340 is an affordable wireless mouse with reliable connectivity, 12 months battery life and modern design",
    qty: 12,
    uom: "Box",
    unitPrice: 2.18
  }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatusBadgeClass(status) {
  const map = {
    Paid: "badge-status-paid",
    Pending: "badge-status-pending",
    Cancelled: "badge-status-cancelled"
  };
  return map[status] || "badge-status-paid";
}

function renderItemsTable(items) {
  const tbody = document.getElementById("invoice-items-tbody");
  if (!tbody) return;

  let subtotal = 0;
  const rowsHtml = items.map((it, idx) => {
    const itemTotal = it.qty * it.unitPrice;
    subtotal += itemTotal;
    return `
      <tr>
        <td class="col-item-no">${it.no || idx + 1}</td>
        <td class="col-item-name">${escapeHtml(it.item)}</td>
        <td class="col-item-desc">${escapeHtml(it.description)}</td>
        <td class="col-item-qty">${it.qty}</td>
        <td class="col-item-uom">${escapeHtml(it.uom)}</td>
        <td class="col-item-price">$${it.unitPrice.toFixed(2)}</td>
        <td class="col-item-total">$${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rowsHtml;

  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const subtotalEl = document.getElementById("summary-subtotal");
  const taxEl = document.getElementById("summary-tax");
  const grandTotalEl = document.getElementById("summary-grand-total");

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (taxEl) taxEl.textContent = `$${tax.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (grandTotalEl) grandTotalEl.textContent = `$${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function populateInvoiceDetails(invoice) {
  if (!invoice) return;

  const invNoEl = document.getElementById("detail-invoice-no");
  const statusBadge = document.getElementById("detail-status-badge");
  const createdByEl = document.getElementById("detail-created-by");
  const channelEl = document.getElementById("detail-channel");
  const invoiceDateEl = document.getElementById("detail-invoice-date");
  const dueDateEl = document.getElementById("detail-due-date");

  const custAvatarEl = document.getElementById("detail-cust-avatar");
  const custNameEl = document.getElementById("detail-cust-name");
  const custPhoneEl = document.getElementById("detail-cust-phone");
  const custIdEl = document.getElementById("detail-cust-id");
  const custWhatsappEl = document.getElementById("detail-cust-whatsapp");
  const custTypeEl = document.getElementById("detail-cust-type");

  if (invNoEl) invNoEl.textContent = invoice.invoiceNo;
  if (statusBadge) {
    statusBadge.textContent = invoice.paymentStatus || "Paid";
    statusBadge.className = `badge-status ${getStatusBadgeClass(invoice.paymentStatus)}`;
  }
  if (createdByEl) createdByEl.textContent = "AI Assistant";
  if (channelEl) channelEl.textContent = "WhatsApp";
  if (invoiceDateEl) invoiceDateEl.textContent = invoice.createdAt || "12 Sep, 2026";
  if (dueDateEl) dueDateEl.textContent = invoice.dueDate || "16 Sep, 2026";

  const cust = invoice.customer || {};
  if (custAvatarEl && cust.avatar) custAvatarEl.src = cust.avatar;
  if (custNameEl) custNameEl.textContent = cust.name || "Alexander Boehm";
  if (custPhoneEl) custPhoneEl.textContent = cust.phone || "829-561-2446";
  if (custIdEl) custIdEl.textContent = `CUS-${String(invoice.id || 1293).padStart(6, "0")}`;
  if (custWhatsappEl) custWhatsappEl.textContent = cust.phone || "+65 XXXX XXXX";
  if (custTypeEl) custTypeEl.textContent = "Existing";

  renderItemsTable(DEFAULT_ITEMS);
}

function initSidebar() {
  const toggleBtn = document.querySelector(".toggle");
  const sidebar = document.querySelector(".sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
  }

  document.querySelectorAll(".menu-title").forEach((title) => {
    title.addEventListener("click", () => {
      const group = title.closest(".menu-group");
      if (group) group.classList.toggle("collapsed");
    });
  });
}

async function loadInvoiceDetailData() {
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get("id") || "INV26-000201";

  try {
    const res = await fetch(INVOICES_DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    const found = Array.isArray(list) ? list.find((item) => item.invoiceNo === targetId) : null;

    if (found) {
      populateInvoiceDetails(found);
    } else {
      populateInvoiceDetails({
        id: 1,
        invoiceNo: targetId,
        customer: {
          name: "Alexander Boehm",
          phone: "829-561-2446",
          avatar: "images/avatar.svg"
        },
        createdAt: "12 Sep, 2026",
        dueDate: "16 Sep, 2026",
        paymentStatus: "Paid"
      });
    }
  } catch (err) {
    console.error("Không tải được dữ liệu Invoice Details:", err);
    populateInvoiceDetails({
      id: 1,
      invoiceNo: targetId,
      customer: {
        name: "Alexander Boehm",
        phone: "829-561-2446",
        avatar: "images/avatar.svg"
      },
      createdAt: "12 Sep, 2026",
      dueDate: "16 Sep, 2026",
      paymentStatus: "Paid"
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  loadInvoiceDetailData();
});
