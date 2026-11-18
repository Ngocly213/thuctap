const CONVERSATIONS_DATA_URL = "data/conversations.json";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function renderDemoChat(container) {
  container.innerHTML = `
    <div class="chat-msg-row ai">
      <div class="chat-msg-header">
        <span class="chat-msg-time">12 Sep, 2026 - 04:32</span>
        <div class="chat-msg-author-info">
          <span class="chat-msg-author-name">AI Assistant</span>
          <span class="chat-msg-meta-text">openclaw/default • 12 in • 24 out • <strong>1.029 tokens</strong></span>
        </div>
        <div class="chat-msg-avatar ai-avatar">
          <img src="images/bot-sparkle.svg" alt="" width="16" height="16" />
        </div>
      </div>
      <div class="chat-msg-bubble ai-bubble">
        <p>👋 Hi! I’d be happy to help you with your egg order</p>
        <p>🥚 We currently have fresh chicken eggs available. How many trays would you like to order today?</p>
      </div>
    </div>

    <div class="chat-msg-row customer">
      <div class="chat-msg-header">
        <div class="chat-msg-avatar customer-avatar">
          <img src="images/avatar.svg" alt="" />
        </div>
        <div class="chat-msg-author-info">
          <span class="chat-msg-author-name">Jeanette O'Reilly</span>
          <span class="chat-msg-meta-text">Customer</span>
        </div>
        <span class="chat-msg-time">12 Sep, 2026 - 04:32</span>
      </div>
      <div class="chat-msg-bubble customer-bubble">
        <p>I’d like to order some fresh chicken eggs</p>
        <p>I’m looking for 12 trays, preferably with delivery tomorrowtomorrow. Could you please let me know the total price?</p>
      </div>
    </div>

    <div class="chat-msg-row ai">
      <div class="chat-msg-header">
        <span class="chat-msg-time">12 Sep, 2026 - 04:32</span>
        <div class="chat-msg-author-info">
          <span class="chat-msg-author-name">AI Assistant</span>
          <span class="chat-msg-meta-text">openclaw/default • 12 in • 24 out • <strong>1.029 tokens</strong></span>
        </div>
        <div class="chat-msg-avatar ai-avatar">
          <img src="images/bot-sparkle.svg" alt="" width="16" height="16" />
        </div>
      </div>
      <div class="chat-msg-bubble ai-bubble">
        <p>Sure! 😊 We have 12 trays of fresh chicken eggs available.</p>
        <p>The total product amount is $1,674.01. I’ll check the delivery availability and prepare the order for you</p>
      </div>
    </div>

    <div class="chat-msg-row customer">
      <div class="chat-msg-header">
        <div class="chat-msg-avatar customer-avatar">
          <img src="images/avatar.svg" alt="" />
        </div>
        <div class="chat-msg-author-info">
          <span class="chat-msg-author-name">Jeanette O'Reilly</span>
          <span class="chat-msg-meta-text">Customer</span>
        </div>
        <span class="chat-msg-time">12 Sep, 2026 - 04:32</span>
      </div>
      <div class="chat-msg-bubble customer-bubble">
        <p>That sounds good! Please go ahead with the order for 12 trays of fresh chicken eggs. I would like the eggs delivered tomorrow if possible.</p>
        <p>Please make sure the eggs are fresh and carefully packed for delivery. You can use the delivery address saved on my account</p>
        <p>If there are any additional delivery charges, please let me know before confirming the order.</p>
        <p>Thank you for your help! 😊</p>
      </div>
    </div>

    <div class="handover-divider">
      <span>The conversation has been handed over to the support agent</span>
    </div>

    <div class="chat-msg-row support">
      <div class="chat-msg-header">
        <span class="chat-msg-time">12 Sep, 2026 - 04:32</span>
        <div class="chat-msg-author-info">
          <span class="chat-msg-author-name">Lisa Nguyen</span>
          <span class="chat-msg-meta-text">Manager</span>
        </div>
        <div class="chat-msg-avatar support-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
      <div class="chat-msg-bubble support-bubble">
        <p>Hi! 👋 I’m Lisa from the support team. I’ve reviewed your request and can confirm that your order for 12 trays of fresh chicken eggs has been received</p>
        <p>I’ll assist you with the delivery arrangements and make sure everything is confirmed.</p>
      </div>
    </div>
  `;
  container.scrollTop = 0;
}

function renderEmptyChat(container, customerName) {
  container.innerHTML = `
    <div class="conversation-empty-state">
      <div class="empty-state-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div class="empty-state-title">Chưa có lịch sử tin nhắn</div>
      <div class="empty-state-desc">Hộp thoại với khách hàng <strong>${escapeHtml(customerName)}</strong> hiện đang trống.</div>
    </div>
  `;
  container.scrollTop = 0;
}

async function loadConversationDetails() {
  const chatScroll = document.getElementById("conversation-chat-scroll");
  const sidebarPane = document.querySelector(".conversation-sidebar-pane");
  if (!chatScroll) return;

  const params = new URLSearchParams(window.location.search);
  const targetId = params.get("id");

  let conversations = [];
  try {
    const res = await fetch(CONVERSATIONS_DATA_URL);
    if (res.ok) {
      conversations = await res.json();
    }
  } catch (e) {}

  const isDemo = !targetId || targetId === "demo" || targetId === "GR26-00392" || (conversations.length > 0 && targetId === conversations[0].conversationName);

  if (isDemo) {
    renderDemoChat(chatScroll);

    const nameEl = document.getElementById("conv-name");
    const idEl = document.getElementById("conv-id");
    const custNameEl = document.getElementById("conv-customer-name");
    const custPhoneEl = document.getElementById("conv-customer-phone");
    const custIdEl = document.getElementById("conv-customer-id");
    const custWhatsappEl = document.getElementById("conv-customer-whatsapp");
    const orderIdEl = document.getElementById("conv-order-id");

    if (nameEl) nameEl.textContent = "Alexander Boehm";
    if (idEl) idEl.textContent = "ID: GR26-00392";
    if (custNameEl) custNameEl.textContent = "Alexander Boehm";
    if (custPhoneEl) custPhoneEl.textContent = "829-561-2446";
    if (custIdEl) custIdEl.textContent = "CUS-001293";
    if (custWhatsappEl) custWhatsappEl.textContent = "+65 0284 1673";
    if (orderIdEl) orderIdEl.textContent = "ORD26-00102";
  } else {
    const found = conversations.find(
      (c) => c.conversationName === targetId || (c.customerInfo && `${c.customerInfo.firstName} ${c.customerInfo.lastName}` === targetId) || c.erpInvoiceNo === targetId
    );

    const customerName = found ? found.conversationName : targetId;
    renderEmptyChat(chatScroll, customerName);

    const nameEl = document.getElementById("conv-name");
    const idEl = document.getElementById("conv-id");
    const statusBadge = document.getElementById("conv-status-badge");
    const custNameEl = document.getElementById("conv-customer-name");
    const custPhoneEl = document.getElementById("conv-customer-phone");
    const custIdEl = document.getElementById("conv-customer-id");
    const custWhatsappEl = document.getElementById("conv-customer-whatsapp");
    const orderIdEl = document.getElementById("conv-order-id");
    const tokensTimeEl = document.getElementById("conv-tokens-time");
    const inputTokensEl = document.getElementById("conv-input-tokens");
    const outputTokensEl = document.getElementById("conv-output-tokens");

    if (nameEl) nameEl.textContent = customerName;
    if (idEl) idEl.textContent = `ID: GR26-${Math.floor(10000 + Math.random() * 90000)}`;
    if (statusBadge && found && found.status) {
      statusBadge.textContent = found.status;
      if (found.status === "Completed") {
        statusBadge.className = "badge-status badge-status-paid";
      } else if (found.status === "Cancelled") {
        statusBadge.className = "badge-status badge-status-cancelled";
      } else {
        statusBadge.className = "badge-status badge-status-pending";
      }
    }

    if (custNameEl) custNameEl.textContent = customerName;
    if (found && found.customerInfo) {
      const phone = found.customerInfo.phone || "829-561-2446";
      if (custPhoneEl) custPhoneEl.textContent = phone;
      if (custWhatsappEl) custWhatsappEl.textContent = phone;
    }
    if (custIdEl) custIdEl.textContent = `CUS-${Math.floor(100000 + Math.random() * 900000)}`;
    if (orderIdEl && found && found.erpInvoiceNo) {
      orderIdEl.textContent = found.erpInvoiceNo.replace("IN", "ORD");
    }
    if (found && found.totalTokens) {
      if (tokensTimeEl) tokensTimeEl.textContent = `${(found.totalTokens / 1000).toFixed(2)}s`;
      if (inputTokensEl) inputTokensEl.textContent = found.inputTokens || 0;
      if (outputTokensEl) outputTokensEl.textContent = found.outputTokens || 0;
    }
  }

  if (sidebarPane) {
    sidebarPane.scrollTop = 0;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  loadConversationDetails();
});