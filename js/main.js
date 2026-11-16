const DATA_URL = "data/conversations.json";
const SAMPLE_SESSION_ID = "GRP26-09827";

const CHANNEL_ICONS = {
  whatsapp: "images/icon-whatsapp.svg",
  zalo: "images/icon-zalo.webp",
  message: "images/icon-message.png",
};

const STATUS_CLASSES = {
  Resolved: "status-resolved",
  Active: "status-active",
  Failed: "status-failed",
  Pending: "status-pending",
  "Needs Review": "status-needsreview",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
let rowsPerPage = 20;
let activeChannelFilter = "All";
let activeStatusFilter = "All";
let searchQuery = "";


const tableBody = document.getElementById("table-body");
const paginationText = document.querySelector(".pagination-text");
const paginationPages = document.querySelector(".pagination-pages");
const dropdownBtn = document.querySelector(".pagination-dropdown");
const searchInput = document.getElementById("search-input");


function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function text(value) {
  return isEmpty(value) ? "-" : escapeHtml(value);
}

function formatNumber(value) {
  if (isEmpty(value) || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("en-US");
}

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return "-";
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${match[3]} ${month}, ${match[1]}` : "-";
}

function formatTime(value) {
  const match = /^(\d{2}):(\d{2})/.exec(value || "");
  return match ? `${match[1]}:${match[2]}` : "-";
}


function renderRow(record, globalIndex) {
  const customer = record.customerInfo || {};
  const fullName = [customer.firstName, customer.lastName].filter((p) => !isEmpty(p)).join(" ");
  const channelIcon = CHANNEL_ICONS[record.channel];
  const statusClass = STATUS_CLASSES[record.status] || "";
  const isExisting = globalIndex % 2 === 0;
  const badgeHtml = `<span class="badge ${isExisting ? "badge-existing" : "badge-new"}">${isExisting ? "Existing" : "New"}</span>`;

  const channelHtml = channelIcon
    ? `<img src="${channelIcon}" alt="${text(record.channel)}" class="channel-icon" />`
    : "-";

  const statusHtml = isEmpty(record.status)
    ? "-"
    : `<span class="status-badge ${statusClass}">${text(record.status)}</span>`;

  return `
    <tr>
      <td class="col-no">${globalIndex + 1}</td>
      <td class="col-channel">
        <div class="channel-cell">${channelHtml}</div>
      </td>
      <td class="col-conversation">
        <div class="session-info">
          <span class="session-name">${text(record.conversationName)}</span>
          <span class="session-id">Session ID: ${SAMPLE_SESSION_ID}</span>
        </div>
      </td>
      <td class="col-invoice">${text(record.erpInvoiceNo)}</td>
      <td class="col-customer">
        <div class="customer-profile">
          <img class="avatar" src="images/avatar.svg" alt="${text(fullName)}" />
          <div class="customer-details">
            <span class="customer-name">${text(fullName)}</span>
            <div class="customer-meta">
              <span class="customer-phone">${text(customer.phone)}</span>
              ${badgeHtml}
            </div>
          </div>
        </div>
      </td>
      <td class="col-lang">
        <div class="lang-badge">${text(record.lang)}</div>
      </td>
      <td class="col-input-token">${formatNumber(record.inputTokens)}</td>
      <td class="col-output-token">${formatNumber(record.outputTokens)}</td>
      <td class="col-total-token">${formatNumber(record.totalTokens)}</td>
      <td class="col-date">${formatDate(record.date)}</td>
      <td class="col-time">${formatTime(record.time)}</td>
      <td class="col-status">${statusHtml}</td>
      <td class="col-action">
        <button class="page-btn" aria-label="More options">
          <img src="images/union.svg" alt="Menu" class="page-dots" />
        </button>
      </td>
    </tr>`;
}


function applyFilters() {
  filteredRecords = allRecords.filter((record) => {

    if (activeChannelFilter !== "All" && record.channel !== activeChannelFilter) return false;

    if (activeStatusFilter !== "All" && record.status !== activeStatusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const customer = record.customerInfo || {};
      const fullName = [customer.firstName, customer.lastName].join(" ").toLowerCase();
      const haystack = [
        record.conversationName,
        record.erpInvoiceNo,
        fullName,
        customer.phone,
        record.status,
        record.channel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  currentPage = 1;
  renderCurrentPage();
}


function renderCurrentPage() {
  if (!tableBody) return;
  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords);
  const pageRecords = filteredRecords.slice(startIndex, endIndex);

  if (pageRecords.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:#9ca3af;">Không có dữ liệu phù hợp</td></tr>';
  } else {
    tableBody.innerHTML = pageRecords
      .map((record, i) => renderRow(record, startIndex + i))
      .join("");
  }


  if (paginationText) {
    if (totalRecords === 0) {
      paginationText.textContent = "Showing 0 of 0 records";
    } else {
      paginationText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} records`;
    }
  }


  if (dropdownBtn) {
    const spanNum = dropdownBtn.querySelector("span");
    if (spanNum) spanNum.textContent = rowsPerPage;
  }


  renderPaginationButtons(totalPages);


  updateMetrics();
}


function renderPaginationButtons(totalPages) {
  if (!paginationPages) return;

  let html = `
    <button class="page-btn page-arrow prev-btn" aria-label="Previous page" ${currentPage === 1 ? "disabled" : ""}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 12L6 8L10 4" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`;

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
    </button>`;

  paginationPages.innerHTML = html;
}


function updateMetrics() {
  const metricValues = document.querySelectorAll(".metric-value");
  if (metricValues.length < 4) return;

  const total = filteredRecords.length;
  const avgResponseTime = total > 0 ? Math.round(filteredRecords.reduce((sum, r) => sum + (r.totalTokens || 0), 0) / total) : 0;
  const totalTokens = filteredRecords.reduce((sum, r) => sum + (r.totalTokens || 0), 0);

  metricValues[0].textContent = total.toLocaleString("en-US");
  metricValues[1].textContent = total > 0 ? (Math.random() * 800 + 200).toFixed(0) : "0";
  metricValues[2].textContent = total > 0 ? (Math.random() * 500 + 100).toFixed(0) : "0";
  metricValues[3].textContent = totalTokens.toLocaleString("en-US");
}


function initDropdown() {
  if (!dropdownBtn) return;

  let dropdownMenu = null;

  function createDropdownMenu() {
    if (dropdownMenu) return;
    dropdownMenu = document.createElement("div");
    dropdownMenu.className = "pagination-dropdown-menu";
    dropdownMenu.style.cssText = `
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
        closeDropdown();
        renderCurrentPage();
      });
      dropdownMenu.appendChild(item);
    });

    document.body.appendChild(dropdownMenu);
  }

  function closeDropdown() {
    if (dropdownMenu) dropdownMenu.style.display = "none";
  }

  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    createDropdownMenu();
    if (dropdownMenu.style.display === "block") {
      closeDropdown();
    } else {
      const rect = dropdownBtn.getBoundingClientRect();
      dropdownMenu.style.display = "block";
      dropdownMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
      dropdownMenu.style.left = `${rect.left + window.scrollX}px`;
    }
  });

  document.addEventListener("click", (e) => {
    if (dropdownMenu && !dropdownMenu.contains(e.target) && !dropdownBtn.contains(e.target)) {
      closeDropdown();
    }
  });
}


function initFilterDropdowns() {
  const filterActions = document.querySelector(".filter-actions");
  if (!filterActions) return;
  const filterBoxes = filterActions.querySelectorAll(".filter-box");
  if (filterBoxes.length < 3) return;

  const channelBox = filterBoxes[1];
  const statusBox = filterBoxes[2];


  function getUniqueValues(key) {
    const values = new Set();
    allRecords.forEach((r) => {
      if (r[key]) values.add(r[key]);
    });
    return ["All", ...Array.from(values).sort()];
  }

  function createFilterDropdown(triggerEl, key, currentValue, onSelect) {

    const existing = triggerEl._filterDropdown;
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
      triggerEl._filterDropdown = null;
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

    const values = getUniqueValues(key);
    values.forEach((val) => {
      const item = document.createElement("div");
      item.textContent = val === "All" ? "All" : val;
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
        triggerEl._filterDropdown = null;
      });
      menu.appendChild(item);
    });

    const rect = triggerEl.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(menu);
    triggerEl._filterDropdown = menu;


    function closeHandler(e) {
      if (!menu.contains(e.target) && !triggerEl.contains(e.target)) {
        if (menu.parentNode) menu.parentNode.removeChild(menu);
        triggerEl._filterDropdown = null;
        document.removeEventListener("click", closeHandler);
      }
    }
    setTimeout(() => document.addEventListener("click", closeHandler), 0);
  }

  if (channelBox) {
    channelBox.addEventListener("click", (e) => {
      e.stopPropagation();
      createFilterDropdown(channelBox, "channel", activeChannelFilter, (val) => {
        activeChannelFilter = val;
        const label = channelBox.querySelector("span");
        if (label) label.innerHTML = `Channel: <strong>${val}</strong>`;
        applyFilters();
      });
    });
  }

  if (statusBox) {
    statusBox.addEventListener("click", (e) => {
      e.stopPropagation();
      createFilterDropdown(statusBox, "status", activeStatusFilter, (val) => {
        activeStatusFilter = val;
        const label = statusBox.querySelector("span");
        if (label) label.innerHTML = `Status: <strong>${val}</strong>`;
        applyFilters();
      });
    });
  }
}


function initSearch() {
  if (!searchInput) return;
  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      applyFilters();
    }, 300);
  });
}


function initPaginationClicks() {
  if (!paginationPages) return;
  paginationPages.addEventListener("click", (e) => {
    const pageBtn = e.target.closest(".page-btn[data-page]");
    if (pageBtn) {
      currentPage = parseInt(pageBtn.getAttribute("data-page"));
      renderCurrentPage();
      return;
    }
    const prevBtn = e.target.closest(".prev-btn");
    if (prevBtn && currentPage > 1) {
      currentPage--;
      renderCurrentPage();
      return;
    }
    const nextBtn = e.target.closest(".next-btn");
    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
    if (nextBtn && currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
      return;
    }
  });
}


function initSidebar() {

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
      if (group) {
        group.classList.toggle("collapsed");
      }
    });
  });
}


function initTodayButton() {
  const todayBtn = document.querySelector(".today-btn");
  if (!todayBtn) return;
  todayBtn.addEventListener("click", () => {

    activeChannelFilter = "All";
    activeStatusFilter = "All";
    searchQuery = "";
    if (searchInput) searchInput.value = "";


    const filterActions = document.querySelector(".filter-actions");
    if (filterActions) {
      const filterBoxes = filterActions.querySelectorAll(".filter-box");
      if (filterBoxes.length >= 3) {
        const channelLabel = filterBoxes[1].querySelector("span");
        const statusLabel = filterBoxes[2].querySelector("span");
        if (channelLabel) channelLabel.innerHTML = 'Channel: <strong>All</strong>';
        if (statusLabel) statusLabel.innerHTML = 'Status: <strong>All</strong>';
      }
    }

    applyFilters();
  });
}


async function loadData() {
  if (!tableBody) return;
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("File JSON khong phai la mang");

    allRecords = data.filter((item) => item && typeof item === "object");
    filteredRecords = [...allRecords];

    renderCurrentPage();
    initDropdown();
    initFilterDropdowns();
    initSearch();
    initPaginationClicks();
    initSidebar();
    initTodayButton();
  } catch (error) {
    console.error("Khong tai duoc du lieu:", error);
    tableBody.innerHTML = '<tr><td colspan="13">Không tải được dữ liệu</td></tr>';
  }
}

loadData();
