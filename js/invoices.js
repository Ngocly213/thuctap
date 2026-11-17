const CONVERSATIONS_DATA_URL = "data/conversations.json";
const state = {
  allInvoices: [],
  filteredInvoices: [],
  currentPage: 1,
  pageSize: 10,
  currentStatus: "All",
  searchQuery: "",
  dateRange: "all"
};

const tableBody = document.getElementById("table-body");
const paginationInfo = document.getElementById("paginationInfo");
const paginationPages = document.getElementById("paginationPages");

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function calculateDueDate(dateStr, days = 15) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const DEFAULT_AVATAR = "images/avatar.svg";
function transformConversationToInvoice(item, index) {
  const custInfo = item.customerInfo || {};
  const fullName = item.conversationName || [custInfo.firstName, custInfo.lastName].filter(Boolean).join(" ") || "Customer";
  const phone = custInfo.phone || "No phone";
  const custType = item.channel === "message" ? "New" : "Existing";
  let paymentStatus = "Pending";
  if (item.status === "Resolved") paymentStatus = "Paid";
  else if (item.status === "Failed") paymentStatus = "Cancelled";
  const totalAmount = `$${((item.totalTokens || 1000) * 0.75 + 150).toFixed(2)}`;
  return {
    id: index + 1,
    invoiceNo: item.erpInvoiceNo || `INV26-${String(index + 1).padStart(5, "0")}`,
    customer: {
      name: fullName,
      phone: phone,
      avatar: DEFAULT_AVATAR, 
      type: custType
    },
    totalAmount: totalAmount,
    createdAt: formatDate(item.date),
    dueDate: calculateDueDate(item.date, 15),
    paymentStatus: paymentStatus
  };
}

function applyFilters() {
  const query = state.searchQuery.toLowerCase().trim();
  const status = state.currentStatus.toLowerCase();

  state.filteredInvoices = state.allInvoices.filter((inv) => {
    const invStatus = (inv.paymentStatus || "").toLowerCase();
    const matchStatus = status === "all" || invStatus === status;
    const invNo = (inv.invoiceNo || "").toLowerCase();
    const custName = (inv.customer?.name || "").toLowerCase();
    const custPhone = (inv.customer?.phone || "").toLowerCase();
    const matchSearch =
      !query ||
      invNo.includes(query) ||
      custName.includes(query) ||
      custPhone.includes(query);

    return matchStatus && matchSearch;
  });

  state.currentPage = 1;
  renderTable();
}

function renderTable() {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  const totalRecords = state.filteredInvoices.length;

  if (totalRecords === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 48px; color: #71717a;">
          <div style="font-size: 15px; font-weight: 500;">No invoices found</div>
          <div style="font-size: 13px; margin-top: 4px;">Try adjusting your search or filter condition</div>
        </td>
      </tr>
    `;
    updatePagination(0, 0, 0, 0);
    return;
  }

  const totalPages = Math.ceil(totalRecords / state.pageSize) || 1;
  if (state.currentPage > totalPages) state.currentPage = totalPages;

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, totalRecords);
  const pagedData = state.filteredInvoices.slice(startIndex, endIndex);

  pagedData.forEach((inv, idx) => {
    const rowNumber = startIndex + idx + 1;
    const status = inv.paymentStatus || "Pending";
    const statusClass = `badge-${status.toLowerCase()}`;
    const custType = inv.customer?.type || "Existing";
    const tagClass = custType === "New" ? "customer-tag-new" : "customer-tag-existing";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-no">${rowNumber}</td>
      <td class="col-invoice"><strong>${escapeHTML(inv.invoiceNo)}</strong></td>
      <td class="col-customer">
        <div class="customer-info-cell">
          <img 
            src="${escapeHTML(inv.customer.avatar)}" 
            alt="${escapeHTML(inv.customer.name)}" 
            class="customer-avatar" 
          />
          <div class="customer-details">
            <span class="customer-name">${escapeHTML(inv.customer.name)}</span>
            <div class="customer-sub-line">
              <span class="customer-phone">${escapeHTML(inv.customer.phone)}</span>
              <span class="customer-tag ${tagClass}">${escapeHTML(custType)}</span>
            </div>
          </div>
        </div>
      </td>
      <td class="col-amount">${escapeHTML(inv.totalAmount)}</td>
      <td class="col-created">${escapeHTML(inv.createdAt)}</td>
      <td class="col-due">${escapeHTML(inv.dueDate)}</td>
      <td class="col-payment-status">
        <span class="badge ${statusClass}">${escapeHTML(status)}</span>
      </td>
      <td class="col-action">
        <button class="action-btn" type="button" aria-label="Action" title="Options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="12" cy="19" r="2"></circle>
          </svg>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  updatePagination(startIndex + 1, endIndex, totalRecords, totalPages);
}

function updatePagination(from, to, total, totalPages) {
  if (paginationInfo) {
    paginationInfo.innerText = total === 0 ? "Showing 0 of 0 records" : `Showing ${from} to ${to} of ${total} records`;
  }

  if (!paginationPages) return;
  paginationPages.innerHTML = "";
  if (total === 0) return;

  const prevBtn = document.createElement("button");
  prevBtn.className = `page-btn page-arrow ${state.currentPage === 1 ? "disabled" : ""}`;
  prevBtn.innerHTML = "&lt;";
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTable();
    }
  });
  paginationPages.appendChild(prevBtn);

  const maxButtons = 5;
  let startPage = Math.max(1, state.currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `page-btn ${i === state.currentPage ? "active" : ""}`;
    pageBtn.innerText = i;
    pageBtn.addEventListener("click", () => {
      state.currentPage = i;
      renderTable();
    });
    paginationPages.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = `page-btn page-arrow ${state.currentPage === totalPages ? "disabled" : ""}`;
  nextBtn.innerHTML = "&gt;";
  nextBtn.disabled = state.currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTable();
    }
  });
  paginationPages.appendChild(nextBtn);
}

function initEvents() {
  const toggleBtn = document.querySelector(".toggle");
  const sidebar = document.querySelector(".sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
  }

  document.querySelectorAll(".menu-title").forEach((title) => {
    title.style.cursor = "pointer";
    title.addEventListener("click", () => {
      const group = title.closest(".menu-group");
      if (group) group.classList.toggle("collapsed");
    });
  });

  function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-menu").forEach((m) => m.classList.remove("show"));
  }

  const dateBtn = document.getElementById("datePickerBtn");
  const dateDropdown = document.getElementById("dateDropdown");
  const dateText = document.getElementById("dateRangeText");
  if (dateBtn && dateDropdown) {
    dateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dateDropdown.classList.contains("show");
      closeAllDropdowns();
      if (!isOpen) dateDropdown.classList.add("show");
    });

    dateDropdown.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        dateDropdown.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        if (dateText) dateText.innerText = item.innerText;
        dateDropdown.classList.remove("show");
      });
    });
  }

  const statusBtn = document.getElementById("statusFilterBtn");
  const statusMenu = document.getElementById("statusDropdown");
  const statusText = document.getElementById("selectedStatusText");
  if (statusBtn && statusMenu) {
    statusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = statusMenu.classList.contains("show");
      closeAllDropdowns();
      if (!isOpen) statusMenu.classList.add("show");
    });

    statusMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        statusMenu.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        statusMenu.classList.remove("show");

        state.currentStatus = item.getAttribute("data-status") || "All";
        if (statusText) statusText.innerText = state.currentStatus;
        applyFilters();
      });
    });
  }

  const pageSizeBtn = document.getElementById("pageSizeBtn");
  const pageSizeDropdown = document.getElementById("pageSizeDropdown");
  const pageSizeText = document.getElementById("currentPageSizeText");
  if (pageSizeBtn && pageSizeDropdown) {
    pageSizeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = pageSizeDropdown.classList.contains("show");
      closeAllDropdowns();
      if (!isOpen) pageSizeDropdown.classList.add("show");
    });

    pageSizeDropdown.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        pageSizeDropdown.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        pageSizeDropdown.classList.remove("show");

        state.pageSize = parseInt(item.getAttribute("data-size"), 10) || 10;
        if (pageSizeText) pageSizeText.innerText = state.pageSize;
        state.currentPage = 1;
        renderTable();
      });
    });
  }

  document.addEventListener("click", closeAllDropdowns);

  const todayBtn = document.getElementById("todayBtn");
  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      const now = new Date();
      const formatted = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      if (dateText) dateText.innerText = `${formatted} - ${formatted}`;
    });
  }

  const resyncBtn = document.getElementById("resyncBtn");
  if (resyncBtn) {
    resyncBtn.addEventListener("click", () => {
      resyncBtn.classList.add("is-syncing");
      loadInvoiceData().finally(() => {
        setTimeout(() => resyncBtn.classList.remove("is-syncing"), 600);
      });
    });
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      applyFilters();
    });
  }
}

async function loadInvoiceData() {
  try {
    const res = await fetch(CONVERSATIONS_DATA_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const conversations = await res.json();

    if (Array.isArray(conversations)) {
      state.allInvoices = conversations.map((item, idx) => transformConversationToInvoice(item, idx));
    } else {
      state.allInvoices = [];
    }

    applyFilters();
  } catch (error) {
    console.error("Lỗi nạp conversations.json:", error);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 32px; color: #ef4444;">
            Không tìm thấy file <code>data/conversations.json</code>. Vui lòng kiểm tra lại đường dẫn!
          </td>
        </tr>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initEvents();
  loadInvoiceData();
});