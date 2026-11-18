const ITEMS_DATA_URL = "data/items.json";

let allItems = [];
let filteredItems = [];
let currentPage = 1;
let rowsPerPage = 20;
let activeStatusFilter = "All";
let searchQuery = "";

const tableBody = document.getElementById("items-table-body");
const paginationText = document.querySelector(".pagination-text");
const paginationPages = document.querySelector(".pagination-pages");
const pageSizeBtn = document.getElementById("page-size-btn");
const searchInput = document.getElementById("items-search-input");
const todayBtn = document.getElementById("today-btn");
const resyncBtn = document.getElementById("resync-btn");
const statusFilterBox = document.getElementById("status-filter-box");
const datePickerBox = document.getElementById("date-picker-box");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderItemRow(item, index) {
  return `
    <tr>
      <td class="col-items-no">${index + 1}</td>
      <td class="col-items-sku">${escapeHtml(item.sku)}</td>
      <td class="col-items-name">${escapeHtml(item.name)}</td>
      <td class="col-items-uom">${escapeHtml(item.uom)}</td>
      <td class="col-items-desc">${escapeHtml(item.description)}</td>
      <td class="col-items-date">${escapeHtml(item.dueDate || "01, Jan, 2026")}</td>
      <td class="col-items-status">${escapeHtml(item.paymentStatus || item.dueDate || "01, Jan, 2026")}</td>
      <td class="col-items-action">
        <button class="invoice-action-btn" type="button" aria-label="Action menu">
          <img src="images/union.svg" alt="" width="16" height="16" />
        </button>
      </td>
    </tr>
  `;
}

function applyItemFilters() {
  filteredItems = allItems.filter((item) => {
    if (activeStatusFilter !== "All") {
      const statusVal = String(item.paymentStatus || item.status || "");
      if (statusVal !== activeStatusFilter) {
        return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const sku = String(item.sku || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const desc = String(item.description || "").toLowerCase();
      if (!sku.includes(q) && !name.includes(q) && !desc.includes(q)) {
        return false;
      }
    }

    return true;
  });

  currentPage = 1;
  renderCurrentItemsPage();
}

function renderCurrentItemsPage() {
  if (!tableBody) return;

  const total = filteredItems.length;
  if (total === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:48px;color:#71717a;">No items found</td></tr>';
    if (paginationText) paginationText.textContent = "Showing 0 to 0 of 0 records";
    if (paginationPages) paginationPages.innerHTML = "";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, total);
  const paged = filteredItems.slice(start, end);

  tableBody.innerHTML = paged.map((it, idx) => renderItemRow(it, start + idx)).join("");

  if (paginationText) {
    paginationText.textContent = `Showing ${start + 1} to ${end} of ${total} records`;
  }

  renderItemsPaginationButtons(totalPages);
}

function renderItemsPaginationButtons(totalPages) {
  if (!paginationPages) return;

  let html = `
    <button class="page-btn page-arrow prev-btn" aria-label="Previous page" ${currentPage === 1 ? "disabled" : ""}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  `;

  let startPage = 1;
  let endPage = totalPages;

  if (totalPages > 7) {
    if (currentPage <= 4) {
      startPage = 1;
      endPage = 5;
    } else if (currentPage >= totalPages - 3) {
      startPage = totalPages - 4;
      endPage = totalPages;
    } else {
      startPage = currentPage - 1;
      endPage = currentPage + 1;
    }
  }

  if (startPage > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) html += '<span class="page-dots">...</span>';
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += '<span class="page-dots">...</span>';
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `
    <button class="page-btn page-arrow next-btn" aria-label="Next page" ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  `;

  paginationPages.innerHTML = html;
}

function initItemsDropdown() {
  if (!pageSizeBtn) return;

  let menu = null;

  function closeMenu() {
    if (menu && menu.parentNode) {
      menu.parentNode.removeChild(menu);
      menu = null;
    }
  }

  pageSizeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu) {
      closeMenu();
      return;
    }

    menu = document.createElement("div");
    menu.className = "floating-dropdown-menu";
    menu.style.cssText = `
      position: absolute;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 4px;
      z-index: 1000;
      min-width: 60px;
    `;

    [10, 20, 50, 100].forEach((opt) => {
      const item = document.createElement("div");
      item.textContent = opt;
      item.style.cssText = `
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
        color: #27272a;
        border-radius: 6px;
      `;
      item.addEventListener("mouseenter", () => (item.style.background = "#f4f4f5"));
      item.addEventListener("mouseleave", () => (item.style.background = "transparent"));
      item.addEventListener("click", (ev) => {
        ev.stopPropagation();
        rowsPerPage = opt;
        currentPage = 1;
        const span = pageSizeBtn.querySelector("span");
        if (span) span.textContent = opt;
        closeMenu();
        renderCurrentItemsPage();
      });
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    const rect = pageSizeBtn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
  });

  document.addEventListener("click", closeMenu);
}

function initItemsFilterDropdowns() {
  function createDropdown(triggerEl, options, activeVal, onSelect) {
    if (triggerEl._dropdownMenu) {
      if (triggerEl._dropdownMenu.parentNode) {
        triggerEl._dropdownMenu.parentNode.removeChild(triggerEl._dropdownMenu);
      }
      triggerEl._dropdownMenu = null;
      return;
    }

    const menu = document.createElement("div");
    menu.className = "floating-dropdown-menu";
    menu.style.cssText = `
      position: absolute;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
      border-radius: 8px;
      padding: 4px;
      z-index: 1000;
      min-width: 140px;
    `;

    options.forEach((opt) => {
      const item = document.createElement("div");
      item.textContent = opt;
      const isActive = opt === activeVal;
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
        color: ${isActive ? "#10b981" : "#27272a"};
        font-weight: ${isActive ? "600" : "400"};
        background: ${isActive ? "#ecfdf5" : "transparent"};
        border-radius: 6px;
      `;
      item.addEventListener("mouseenter", () => {
        if (!isActive) item.style.background = "#f4f4f5";
      });
      item.addEventListener("mouseleave", () => {
        if (!isActive) item.style.background = "transparent";
      });
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        if (menu.parentNode) menu.parentNode.removeChild(menu);
        triggerEl._dropdownMenu = null;
        onSelect(opt);
      });
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    const rect = triggerEl.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
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

  if (statusFilterBox) {
    statusFilterBox.addEventListener("click", (e) => {
      e.stopPropagation();
      createDropdown(
        statusFilterBox,
        ["All"],
        activeStatusFilter,
        (val) => {
          activeStatusFilter = val;
          const label = statusFilterBox.querySelector("span");
          if (label) label.innerHTML = `Status: <strong>${val}</strong>`;
          applyItemFilters();
        }
      );
    });
  }

  if (datePickerBox) {
    datePickerBox.addEventListener("click", (e) => {
      e.stopPropagation();
      createDropdown(
        datePickerBox,
        ["All Time", "Today", "Last 7 Days", "22 Sep, 2024 - 22 Sep, 2026"],
        "22 Sep, 2024 - 22 Sep, 2026",
        (val) => {
          const span = datePickerBox.querySelector("span");
          if (span) span.textContent = val;
        }
      );
    });
  }
}

function initItemsSearch() {
  if (!searchInput) return;
  let timer;
  searchInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      applyItemFilters();
    }, 300);
  });
}

function initItemsPaginationClicks() {
  if (!paginationPages) return;
  paginationPages.addEventListener("click", (e) => {
    const pageBtn = e.target.closest(".page-btn[data-page]");
    if (pageBtn) {
      currentPage = parseInt(pageBtn.getAttribute("data-page"), 10);
      renderCurrentItemsPage();
      return;
    }
    const prevBtn = e.target.closest(".prev-btn");
    if (prevBtn && currentPage > 1) {
      currentPage--;
      renderCurrentItemsPage();
      return;
    }
    const nextBtn = e.target.closest(".next-btn");
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
    if (nextBtn && currentPage < totalPages) {
      currentPage++;
      renderCurrentItemsPage();
      return;
    }
  });
}

function initItemsActions() {
  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      activeStatusFilter = "All";
      searchQuery = "";
      if (searchInput) searchInput.value = "";
      if (statusFilterBox) {
        const span = statusFilterBox.querySelector("span");
        if (span) span.innerHTML = "Status: <strong>All</strong>";
      }
      applyItemFilters();
    });
  }

  if (resyncBtn) {
    resyncBtn.addEventListener("click", () => {
      resyncBtn.classList.add("is-syncing");
      loadItemsData().finally(() => {
        setTimeout(() => resyncBtn.classList.remove("is-syncing"), 600);
      });
    });
  }
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

async function loadItemsData() {
  if (!tableBody) return;
  try {
    const res = await fetch(ITEMS_DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Items json is not an array");

    allItems = data;
    filteredItems = [...allItems];

    renderCurrentItemsPage();
  } catch (err) {
    console.error("Không tải được dữ liệu Items:", err);
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#c5221f;">Không tải được dữ liệu Items</td></tr>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  initItemsDropdown();
  initItemsFilterDropdowns();
  initItemsSearch();
  initItemsPaginationClicks();
  initItemsActions();
  loadItemsData();
});
