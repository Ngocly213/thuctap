const ORDERS_DATA_URL = "data/orders.json";

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
let rowsPerPage = 20;
let activeSourceFilter = "All";
let activeStatusFilter = "All";
let searchQuery = "";

const tableBody = document.getElementById("orders-table-body");
const paginationText = document.querySelector(".pagination-text");
const paginationPages = document.querySelector(".pagination-pages");
const dropdownBtn = document.querySelector(".pagination-dropdown");
const searchInput = document.getElementById("order-search-input");
const todayBtn = document.getElementById("today-btn");
const resyncBtn = document.getElementById("resync-btn");
const sourceFilterBox = document.getElementById("filter-source");
const statusFilterBox = document.getElementById("filter-status");

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
    Completed: "badge-completed",
    Pending: "badge-pending",
    Cancelled: "badge-cancelled",
    Refunded: "badge-refunded",
  };
  return map[status] || "badge-gray";
}

function renderSourceHtml(source) {
  const isAgent = source === "Agent System";
  const icon = isAgent
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#231f20" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7zm5 3v2m6-2v2"></path></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#231f20" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

  return `
    <div class="source-cell">
      <span class="source-icon">${icon}</span>
      <span class="source-name">${escapeHtml(source)}</span>
    </div>
  `;
}

function renderOrderRow(record, globalIndex) {
  const customer = record.customer || {};
  const statusClass = getStatusBadgeClass(record.status);
  const avatarSrc = customer.avatar || "images/avatar.svg";

  return `
    <tr>
      <td class="col-no">${globalIndex + 1}</td>
      <td class="col-order-id">
        <span class="order-id-text">${escapeHtml(record.orderId)}</span>
      </td>
      <td class="col-customer">
        <div class="customer-profile">
          <img class="avatar" src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(customer.name)}" />
          <div class="customer-details">
            <span class="customer-name">${escapeHtml(customer.name)}</span>
            <span class="customer-phone">${escapeHtml(customer.phone)}</span>
          </div>
        </div>
      </td>
      <td class="col-source">
        ${renderSourceHtml(record.source)}
      </td>
      <td class="col-created">
        <span>${escapeHtml(record.createdAt)}</span>
      </td>
      <td class="col-status">
        <span class="order-status-badge ${statusClass}">${escapeHtml(record.status)}</span>
      </td>
      <td class="col-action">
        <button class="page-btn action-menu-btn" aria-label="More options">
          <img src="images/union.svg" alt="Menu" class="page-dots" />
        </button>
      </td>
    </tr>
  `;
}

function applyOrderFilters() {
  filteredOrders = allOrders.filter((record) => {
    if (activeSourceFilter !== "All" && record.source !== activeSourceFilter) return false;
    if (activeStatusFilter !== "All" && record.status !== activeStatusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const customer = record.customer || {};
      const haystack = [
        record.orderId,
        customer.name,
        customer.phone,
        record.source,
        record.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  currentPage = 1;
  renderCurrentOrderPage();
}

function renderCurrentOrderPage() {
  if (!tableBody) return;
  const total = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, total);
  const pageItems = filteredOrders.slice(start, end);

  if (pageItems.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af;">Không có dữ liệu phù hợp</td></tr>';
  } else {
    tableBody.innerHTML = pageItems.map((r, i) => renderOrderRow(r, start + i)).join("");
  }

  if (paginationText) {
    if (total === 0) {
      paginationText.textContent = "Showing 0 of 0 records";
    } else {
      paginationText.textContent = `Showing ${start + 1} to ${end} of ${total} records`;
    }
  }

  if (dropdownBtn) {
    const span = dropdownBtn.querySelector("span");
    if (span) span.textContent = rowsPerPage;
  }

  renderOrderPaginationButtons(totalPages);
  updateOrderKpis();
}

function renderOrderPaginationButtons(totalPages) {
  if (!paginationPages) return;

  let html = `
    <button class="page-btn page-arrow prev-btn" aria-label="Previous page" ${currentPage === 1 ? "disabled" : ""}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 12L6 8L10 4" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="page-dots">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-dots">...</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `
    <button class="page-btn page-arrow next-btn" aria-label="Next page" ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4L10 8L6 12" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  paginationPages.innerHTML = html;
}

function updateOrderKpis() {
  const total = filteredOrders.length;
  const completed = filteredOrders.filter((r) => r.status === "Completed").length;
  const pending = filteredOrders.filter((r) => r.status === "Pending").length;
  const cancelled = filteredOrders.filter((r) => r.status === "Cancelled").length;
  const refunded = filteredOrders.filter((r) => r.status === "Refunded").length;

  const totalEl = document.getElementById("kpi-total-orders");
  const reviewEl = document.getElementById("kpi-needs-review");
  const completedEl = document.getElementById("badge-completed");
  const pendingEl = document.getElementById("badge-pending");
  const cancelledEl = document.getElementById("badge-cancelled");
  const refundedEl = document.getElementById("badge-refunded");

  if (totalEl) totalEl.textContent = total.toLocaleString("en-US");
  if (reviewEl) reviewEl.textContent = pending.toLocaleString("en-US");
  if (completedEl) completedEl.textContent = completed.toLocaleString("en-US");
  if (pendingEl) pendingEl.textContent = pending.toLocaleString("en-US");
  if (cancelledEl) cancelledEl.textContent = cancelled.toLocaleString("en-US");
  if (refundedEl) refundedEl.textContent = refunded.toLocaleString("en-US");

  const aiOrders = filteredOrders.filter((r) => r.source === "Agent System").length;
  const humanOrders = total - aiOrders;
  const aiPercent = total > 0 ? Math.round((aiOrders / total) * 100) : 0;
  const humanPercent = 100 - aiPercent;

  const aiLabel = document.getElementById("ai-dist-label");
  const humanLabel = document.getElementById("human-dist-label");
  const progressFill = document.querySelector(".progress-fill");

  if (aiLabel) aiLabel.textContent = `AI Distribution (${aiPercent}%)`;
  if (humanLabel) humanLabel.textContent = `Human (${humanPercent}%)`;
  if (progressFill) progressFill.style.width = `${aiPercent}%`;
}

function initOrderDropdown() {
  if (!dropdownBtn) return;
  let menu = null;

  function createMenu() {
    if (menu) return;
    menu = document.createElement("div");
    menu.className = "pagination-dropdown-menu";
    menu.style.cssText = `
      position: absolute;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      padding: 4px;
      display: none;
      z-index: 1000;
      min-width: 60px;
    `;

    [10, 20, 50, 100].forEach((opt) => {
      const item = document.createElement("div");
      item.textContent = opt;
      item.style.cssText = `
        padding: 6px 12px;
        cursor: pointer;
        font-size: 14px;
        color: #27272a;
        border-radius: 4px;
      `;
      item.addEventListener("mouseenter", () => (item.style.background = "#f4f4f5"));
      item.addEventListener("mouseleave", () => (item.style.background = "transparent"));
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        rowsPerPage = opt;
        currentPage = 1;
        closeMenu();
        renderCurrentOrderPage();
      });
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
  }

  function closeMenu() {
    if (menu) menu.style.display = "none";
  }

  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    createMenu();
    if (menu.style.display === "block") {
      closeMenu();
    } else {
      const rect = dropdownBtn.getBoundingClientRect();
      menu.style.display = "block";
      menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;
    }
  });

  document.addEventListener("click", (e) => {
    if (menu && !menu.contains(e.target) && !dropdownBtn.contains(e.target)) {
      closeMenu();
    }
  });
}

function initOrderFilterDropdowns() {
  function createDropdown(triggerEl, options, currentValue, onSelect) {
    const existing = triggerEl._dropdownMenu;
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
      triggerEl._dropdownMenu = null;
      return;
    }

    const menu = document.createElement("div");
    menu.className = "filter-dropdown-menu";
    menu.style.cssText = `
      position: absolute;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      padding: 4px;
      z-index: 1000;
      min-width: 140px;
      max-height: 240px;
      overflow-y: auto;
    `;

    options.forEach((val) => {
      const item = document.createElement("div");
      item.textContent = val;
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
        color: ${val === currentValue ? "#101828" : "#4b5563"};
        font-weight: ${val === currentValue ? "600" : "400"};
        border-radius: 6px;
        background: ${val === currentValue ? "#f3f4f6" : "transparent"};
      `;
      item.addEventListener("mouseenter", () => {
        if (val !== currentValue) item.style.background = "#f9fafb";
      });
      item.addEventListener("mouseleave", () => {
        if (val !== currentValue) item.style.background = "transparent";
      });
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(val);
        if (menu.parentNode) menu.parentNode.removeChild(menu);
        triggerEl._dropdownMenu = null;
      });
      menu.appendChild(item);
    });

    const rect = triggerEl.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(menu);
    triggerEl._dropdownMenu = menu;

    function closeHandler(e) {
      if (!menu.contains(e.target) && !triggerEl.contains(e.target)) {
        if (menu.parentNode) menu.parentNode.removeChild(menu);
        triggerEl._dropdownMenu = null;
        document.removeEventListener("click", closeHandler);
      }
    }
    setTimeout(() => document.addEventListener("click", closeHandler), 0);
  }

  if (sourceFilterBox) {
    sourceFilterBox.addEventListener("click", (e) => {
      e.stopPropagation();
      createDropdown(
        sourceFilterBox,
        ["All", "Agent System", "Human"],
        activeSourceFilter,
        (val) => {
          activeSourceFilter = val;
          const label = sourceFilterBox.querySelector("span");
          if (label) label.innerHTML = `Source: <strong>${val}</strong>`;
          applyOrderFilters();
        }
      );
    });
  }

  if (statusFilterBox) {
    statusFilterBox.addEventListener("click", (e) => {
      e.stopPropagation();
      createDropdown(
        statusFilterBox,
        ["All", "Completed", "Pending", "Cancelled", "Refunded"],
        activeStatusFilter,
        (val) => {
          activeStatusFilter = val;
          const label = statusFilterBox.querySelector("span");
          if (label) label.innerHTML = `Status: <strong>${val}</strong>`;
          applyOrderFilters();
        }
      );
    });
  }
}

function initOrderSearch() {
  if (!searchInput) return;
  let timer;
  searchInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      applyOrderFilters();
    }, 300);
  });
}

function initOrderPaginationClicks() {
  if (!paginationPages) return;
  paginationPages.addEventListener("click", (e) => {
    const pageBtn = e.target.closest(".page-btn[data-page]");
    if (pageBtn) {
      currentPage = parseInt(pageBtn.getAttribute("data-page"));
      renderCurrentOrderPage();
      return;
    }
    const prevBtn = e.target.closest(".prev-btn");
    if (prevBtn && currentPage > 1) {
      currentPage--;
      renderCurrentOrderPage();
      return;
    }
    const nextBtn = e.target.closest(".next-btn");
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
    if (nextBtn && currentPage < totalPages) {
      currentPage++;
      renderCurrentOrderPage();
      return;
    }
  });
}

function initOrderActions() {
  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      activeSourceFilter = "All";
      activeStatusFilter = "All";
      searchQuery = "";
      if (searchInput) searchInput.value = "";
      if (sourceFilterBox) {
        const span = sourceFilterBox.querySelector("span");
        if (span) span.innerHTML = 'Source: <strong>All</strong>';
      }
      if (statusFilterBox) {
        const span = statusFilterBox.querySelector("span");
        if (span) span.innerHTML = 'Status: <strong>All</strong>';
      }
      applyOrderFilters();
    });
  }

  if (resyncBtn) {
    resyncBtn.addEventListener("click", () => {
      resyncBtn.style.opacity = "0.7";
      const icon = resyncBtn.querySelector("svg");
      if (icon) icon.style.animation = "spin 0.8s linear infinite";
      setTimeout(() => {
        if (icon) icon.style.animation = "none";
        resyncBtn.style.opacity = "1";
        loadOrderData();
      }, 600);
    });
  }

  const toggleBtn = document.querySelector(".toggle");
  const sidebar = document.querySelector(".sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }

  const menuTitles = document.querySelectorAll(".menu-title");
  menuTitles.forEach((title) => {
    title.style.cursor = "pointer";
    title.addEventListener("click", () => {
      const group = title.closest(".menu-group");
      if (group) group.classList.toggle("collapsed");
    });
  });
}

async function loadOrderData() {
  if (!tableBody) return;
  try {
    const res = await fetch(ORDERS_DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Orders json is not an array");

    allOrders = data;
    filteredOrders = [...allOrders];

    renderCurrentOrderPage();
    initOrderDropdown();
    initOrderFilterDropdowns();
    initOrderSearch();
    initOrderPaginationClicks();
    initOrderActions();
  } catch (err) {
    console.error("Error loading orders:", err);
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#c5221f;">Không tải được dữ liệu Orders</td></tr>';
  }
}

loadOrderData();
