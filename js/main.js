const DATA_URL = "data/conversations.json";
const PAGE_SIZE = 20;
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

const REQUIRED_FIELDS = [
  "channel",
  "conversationName",
  "erpInvoiceNo",
  "customerInfo.firstName",
  "customerInfo.lastName",
  "customerInfo.phone",
  "lang",
  "inputToken",
  "outputTokens",
  "totalTokens",
  "date",
  "time",
  "status",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const tableBody = document.getElementById("table-body");
const paginationText = document.querySelector(".pagination-text");

function getValue(record, path) {
  return path.split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), record);
}

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

function normalizeRecord(record) {
  if (isEmpty(record.inputToken) && !isEmpty(record.inputTokens)) {
    return { ...record, inputToken: record.inputTokens };
  }
  return record;
}

function getMissingFields(record) {
  return REQUIRED_FIELDS.filter((path) => isEmpty(getValue(record, path)));
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

function renderRow(record, index) {
  const customer = record.customerInfo || {};
  const fullName = [customer.firstName, customer.lastName].filter((part) => !isEmpty(part)).join(" ");
  const channelIcon = CHANNEL_ICONS[record.channel];
  const statusClass = STATUS_CLASSES[record.status] || "";
  const isExisting = index % 2 === 0;
  const badgeHtml = `<span class="badge ${isExisting ? "badge-existing" : "badge-new"}">${isExisting ? "Existing" : "New"}</span>`;

  const channelHtml = channelIcon
    ? `<img src="${channelIcon}" alt="${text(record.channel)}" class="channel-icon" />`
    : "-";

  const statusHtml = isEmpty(record.status)
    ? "-"
    : `<span class="status-badge ${statusClass}">${text(record.status)}</span>`;

  return `
    <tr>
      <td class="col-no">${index + 1}</td>
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
      <td class="col-input-token">${formatNumber(record.inputToken)}</td>
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

function renderTable(records) {
  tableBody.innerHTML = records.map(renderRow).join("");
}

function filterCompleteRecords(records) {
  const complete = [];
  const removed = [];
  records.forEach((record, index) => {
    const missing = getMissingFields(record);
    if (missing.length === 0) {
      complete.push(record);
    } else {
      removed.push({ dong: index + 1, ma: record.erpInvoiceNo || "-", thieu: missing.join(", ") });
    }
  });
  if (removed.length > 0) {
    console.warn(`Da loc bo ${removed.length}/${records.length} ban ghi thieu field`);
    console.table(removed);
  }
  return complete;
}

function updatePaginationText(shown, total) {
  if (!paginationText) return;
  paginationText.textContent = shown === 0 ? "Showing 0 of 0 records" : `Showing 1 to ${shown} of ${total} records`;
}

async function loadData() {
  if (!tableBody) return;
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("File JSON khong phai la mang");
    const records = filterCompleteRecords(
      data.filter((item) => item && typeof item === "object").map(normalizeRecord)
    );
    const firstPage = records.slice(0, PAGE_SIZE);
    if (firstPage.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="13">Không có dữ liệu hợp lệ để hiển thị</td></tr>';
      updatePaginationText(0, 0);
      return;
    }
    renderTable(firstPage);
    updatePaginationText(firstPage.length, records.length);
  } catch (error) {
    console.error("Khong tai duoc du lieu:", error);
    tableBody.innerHTML = '<tr><td colspan="13">Không tải được dữ liệu</td></tr>';
  }
}

loadData();