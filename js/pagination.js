document.addEventListener("DOMContentLoaded", function () {
    const paginationPages = document.querySelector(".pagination-pages");
    const paginationText = document.querySelector(".pagination-text");
    const dropdownBtn = document.querySelector(".pagination-dropdown");
    const tableBody = document.querySelector("tbody");

    if (!paginationPages || !tableBody) return;

    let allRows = Array.from(tableBody.querySelectorAll("tr"));
    

    while (allRows.length < 243) {
        const clonedRow = allRows[0].cloneNode(true);
        tableBody.appendChild(clonedRow);
        allRows.push(clonedRow);
    }

    let totalRecords = allRows.length;
    let rowsPerPage = 20;
    let currentPage = 1;
    let totalPages = Math.ceil(totalRecords / rowsPerPage);

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

        const options = [10, 20, 50, 100];
        options.forEach(opt => {
            const item = document.createElement("div");
            item.className = "pagination-dropdown-item";
            item.textContent = opt;
            item.style.cssText = `
                padding: 6px 12px;
                cursor: pointer;
                font-size: 14px;
                color: #27272a;
                border-radius: 4px;
            `;
            item.addEventListener("mouseenter", () => item.style.background = "#f4f4f5");
            item.addEventListener("mouseleave", () => item.style.background = "transparent");
            item.addEventListener("click", function (e) {
                e.stopPropagation();
                rowsPerPage = opt;
                const spanNum = dropdownBtn.querySelector("span");
                if (spanNum) spanNum.textContent = opt;
                currentPage = 1;
                closeDropdown();
                updateState();
            });
            dropdownMenu.appendChild(item);
        });

        document.body.appendChild(dropdownMenu);
    }

    function toggleDropdown(e) {
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
    }

    function closeDropdown() {
        if (dropdownMenu) {
            dropdownMenu.style.display = "none";
        }
    }

    if (dropdownBtn) {
        dropdownBtn.style.position = "relative";
        dropdownBtn.addEventListener("click", toggleDropdown);
    }

    document.addEventListener("click", function (e) {
        if (dropdownMenu && !dropdownMenu.contains(e.target) && !dropdownBtn.contains(e.target)) {
            closeDropdown();
        }
    });

    function renderTableRows(startIndex, endIndex) {
        tableBody.innerHTML = "";
        const sliceRows = allRows.slice(startIndex - 1, endIndex);
        sliceRows.forEach(row => tableBody.appendChild(row));
    }

    function updateState() {
        totalPages = Math.ceil(totalRecords / rowsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        let startIndex = (currentPage - 1) * rowsPerPage + 1;
        let endIndex = currentPage * rowsPerPage;
        if (endIndex > totalRecords) endIndex = totalRecords;
        if (totalRecords === 0) { startIndex = 0; endIndex = 0; }

        if (paginationText) {
            paginationText.textContent = `Showing ${startIndex} to ${endIndex} of ${totalRecords} records`;
        }

        renderTableRows(startIndex, endIndex);

        // Cập nhật lại các nút số trang hiển thị linh hoạt theo tổng số trang mới
        let buttonsHTML = `
            <button class="page-btn page-arrow prev-btn" aria-label="Previous page" ${currentPage === 1 ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 12L6 8L10 4" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            buttonsHTML += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) buttonsHTML += `<span class="page-dots">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            buttonsHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) buttonsHTML += `<span class="page-dots">...</span>`;
            buttonsHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        buttonsHTML += `
            <button class="page-btn page-arrow next-btn" aria-label="Next page" ${currentPage === totalPages ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4L10 8L6 12" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

        paginationPages.innerHTML = buttonsHTML;
    }

    paginationPages.addEventListener("click", function (e) {
        const pageBtn = e.target.closest(".page-btn[data-page]");
        if (pageBtn) {
            currentPage = parseInt(pageBtn.getAttribute("data-page"));
            updateState();
            return;
        }

        const prevBtn = e.target.closest(".prev-btn");
        if (prevBtn && currentPage > 1) {
            currentPage--;
            updateState();
            return;
        }

        const nextBtn = e.target.closest(".next-btn");
        if (nextBtn && currentPage < totalPages) {
            currentPage++;
            updateState();
            return;
        }
    });

    if (dropdownBtn) {
        const spanNum = dropdownBtn.querySelector("span");
        if (spanNum) {
            rowsPerPage = parseInt(spanNum.textContent) || 20;
        }
    }

    updateState();
});