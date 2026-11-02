/**
 * finance.js - Quản lý Chi tiêu, Thu nhập, Ngân sách & Biểu đồ phân tích tài chính
 */

class FinanceManager {
  constructor(storage) {
    this.storage = storage;
    this.timeFilter = 'this_month'; // 'this_week', 'this_month', 'all'
    this.typeFilter = 'all';        // 'all', 'expense', 'income'
    this.searchQuery = '';
    
    this.categoryChart = null;
    this.trendChart = null;

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Bộ lọc thời gian
    document.getElementById('finance-time-filter')?.addEventListener('change', (e) => {
      this.timeFilter = e.target.value;
      this.render();
    });

    // Bộ lọc loại thu/chi
    document.getElementById('finance-type-filter')?.addEventListener('change', (e) => {
      this.typeFilter = e.target.value;
      this.render();
    });

    // Tìm kiếm giao dịch
    document.getElementById('finance-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTransactionsList();
    });

    // Form thêm giao dịch
    const txForm = document.getElementById('tx-modal-form');
    if (txForm) {
      txForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTransactionFromModal();
      });
    }

    // Đổi loại Chi / Thu trong Modal
    const typeRadios = document.querySelectorAll('input[name="modal-tx-type"]');
    typeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateCategoryOptionsInModal(e.target.value);
      });
    });

    // Form sửa ngân sách
    const budgetForm = document.getElementById('budget-modal-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveBudget();
      });
    }
  }

  // Định dạng tiền tệ VND
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  // Lọc danh sách giao dịch theo bộ lọc
  getFilteredTransactions() {
    const all = this.storage.data.transactions || [];
    const today = new Date();
    const todayStr = getLocalDateString(today);

    // Tính đầu tuần hiện tại
    const day = today.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return all.filter(tx => {
      // Lọc theo loại
      if (this.typeFilter !== 'all' && tx.type !== this.typeFilter) {
        return false;
      }

      // Lọc theo thời gian
      const txDate = new Date(tx.date + 'T00:00:00');
      if (this.timeFilter === 'this_week') {
        if (txDate < monday) return false;
      } else if (this.timeFilter === 'this_month') {
        if (txDate < firstDayOfMonth) return false;
      }

      // Lọc theo tìm kiếm
      if (this.searchQuery) {
        const catInfo = FINANCE_CATEGORIES[tx.category];
        const catName = catInfo ? catInfo.label.toLowerCase() : '';
        const note = (tx.note || '').toLowerCase();
        if (!catName.includes(this.searchQuery) && !note.includes(this.searchQuery)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
  }

  render() {
    this.renderSummaryKPIs();
    this.renderTransactionsList();
    this.renderCharts();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderSummaryKPIs() {
    const all = this.storage.data.transactions || [];
    const today = new Date();

    // Tính toán theo tuần và tháng
    const day = today.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let weekExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    all.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      const txDate = new Date(tx.date + 'T00:00:00');

      if (tx.type === 'income') {
        totalIncome += amount;
        if (txDate >= firstDayOfMonth) monthIncome += amount;
      } else {
        totalExpense += amount;
        if (txDate >= firstDayOfMonth) monthExpense += amount;
        if (txDate >= monday) weekExpense += amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    // Cập nhật DOM
    const totalIncomeEl = document.getElementById('finance-total-income');
    const totalExpenseEl = document.getElementById('finance-total-expense');
    const netBalanceEl = document.getElementById('finance-net-balance');

    if (totalIncomeEl) totalIncomeEl.textContent = this.formatCurrency(monthIncome);
    if (totalExpenseEl) totalExpenseEl.textContent = this.formatCurrency(monthExpense);
    if (netBalanceEl) {
      netBalanceEl.textContent = this.formatCurrency(netBalance);
      netBalanceEl.className = `text-xl md:text-2xl font-extrabold ${netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`;
    }

    // Ngân sách tuần
    const weeklyBudget = this.storage.data.user.weeklyBudget || 1500000;
    const weeklySpentPercent = Math.min(100, Math.round((weekExpense / weeklyBudget) * 100));

    const weekBudgetDisplay = document.getElementById('weekly-budget-display');
    const weekBudgetBar = document.getElementById('weekly-budget-bar');
    const weekBudgetStatus = document.getElementById('weekly-budget-status');

    if (weekBudgetDisplay) {
      weekBudgetDisplay.textContent = `${this.formatCurrency(weekExpense)} / ${this.formatCurrency(weeklyBudget)}`;
    }
    if (weekBudgetBar) {
      weekBudgetBar.style.width = `${weeklySpentPercent}%`;
      if (weekExpense > weeklyBudget) {
        weekBudgetBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-300';
      } else if (weeklySpentPercent > 80) {
        weekBudgetBar.className = 'h-full bg-amber-500 rounded-full transition-all duration-300';
      } else {
        weekBudgetBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-300';
      }
    }
    if (weekBudgetStatus) {
      if (weekExpense > weeklyBudget) {
        weekBudgetStatus.innerHTML = `<span class="text-rose-500 font-bold">⚠️ Vượt hạn mức:</span> Đã chi vượt ${this.formatCurrency(weekExpense - weeklyBudget)}. Hãy tiết chế ngay!`;
      } else {
        const remaining = weeklyBudget - weekExpense;
        weekBudgetStatus.innerHTML = `<span class="text-emerald-500 font-medium">An toàn:</span> Còn lại <strong class="text-zinc-800 dark:text-zinc-200">${this.formatCurrency(remaining)}</strong> cho tuần này.`;
      }
    }

    // Cập nhật lên Dashboard Card
    const dashExpense = document.getElementById('dash-expense-week');
    if (dashExpense) {
      dashExpense.textContent = this.formatCurrency(weekExpense);
    }
    const dashBalance = document.getElementById('dash-balance');
    if (dashBalance) {
      dashBalance.textContent = this.formatCurrency(netBalance);
    }
  }

  renderTransactionsList() {
    const container = document.getElementById('transactions-list-container');
    if (!container) return;

    const list = this.getFilteredTransactions();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
          <i data-lucide="receipt" class="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2"></i>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">Không tìm thấy giao dịch nào</p>
          <button onclick="window.financeManager.openAddModal()" class="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            + Thêm khoản thu / chi mới
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(tx => {
      const cat = FINANCE_CATEGORIES[tx.category] || { label: 'Khác', icon: 'tag', color: '#71717a' };
      const isExpense = tx.type === 'expense';
      const formattedDate = new Date(tx.date + 'T00:00:00').toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      return `
        <div class="group flex items-center justify-between p-3.5 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 transition">
          <!-- Icon và thông tin -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background-color: ${cat.color}20; color: ${cat.color}">
              <i data-lucide="${cat.icon}" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  ${cat.label}
                </span>
                <span class="text-[11px] text-zinc-400 font-medium">
                  • ${formattedDate}
                </span>
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                ${escapeHtml(tx.note || 'Không có ghi chú')}
              </p>
            </div>
          </div>

          <!-- Số tiền và hành động -->
          <div class="flex items-center gap-4 shrink-0 pl-3">
            <span class="text-sm font-bold ${isExpense ? 'text-rose-500' : 'text-emerald-500'}">
              ${isExpense ? '-' : '+'}${this.formatCurrency(tx.amount)}
            </span>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button onclick="window.financeManager.deleteTransaction('${tx.id}')" title="Xóa giao dịch" class="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCharts() {
    this.renderCategoryDoughnutChart();
    this.renderWeeklyBarChart();
  }

  renderCategoryDoughnutChart() {
    const ctx = document.getElementById('category-doughnut-chart');
    if (!ctx) return;

    // Nhóm chi phí theo danh mục (chỉ tính chi phí)
    const list = this.getFilteredTransactions().filter(t => t.type === 'expense');
    const categoryTotals = {};

    list.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Number(tx.amount);
    });

    const labels = [];
    const data = [];
    const bgColors = [];

    Object.keys(categoryTotals).forEach(catKey => {
      const cat = FINANCE_CATEGORIES[catKey] || { label: catKey, color: '#94a3b8' };
      labels.push(cat.label);
      data.push(categoryTotals[catKey]);
      bgColors.push(cat.color);
    });

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');

    if (data.length === 0) {
      // Nếu chưa có dữ liệu chi tiêu
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Chưa có dữ liệu'],
          datasets: [{
            data: [1],
            backgroundColor: [isDark ? '#3f3f46' : '#e4e4e7']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
      return;
    }

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: isDark ? '#18181b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              color: isDark ? '#d4d4d8' : '#3f3f46',
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                return ` ${context.label}: ${this.formatCurrency(val)}`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  renderWeeklyBarChart() {
    const ctx = document.getElementById('weekly-spending-bar-chart');
    if (!ctx) return;

    // Tính 7 ngày trong tuần hiện tại
    const today = new Date();
    const day = today.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    const weekLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dailyExpenses = [0, 0, 0, 0, 0, 0, 0];
    const dailyIncome = [0, 0, 0, 0, 0, 0, 0];

    const all = this.storage.data.transactions || [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = getLocalDateString(d);

      all.filter(tx => tx.date === dStr).forEach(tx => {
        if (tx.type === 'expense') {
          dailyExpenses[i] += Number(tx.amount) || 0;
        } else {
          dailyIncome[i] += Number(tx.amount) || 0;
        }
      });
    }

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');

    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weekLabels,
        datasets: [
          {
            label: 'Chi tiêu',
            data: dailyExpenses,
            backgroundColor: '#f43f5e',
            borderRadius: 6
          },
          {
            label: 'Thu nhập',
            data: dailyIncome,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: isDark ? '#a1a1aa' : '#71717a', font: { size: 11 } }
          },
          y: {
            grid: { color: isDark ? 'rgba(63, 63, 70, 0.4)' : 'rgba(228, 228, 231, 0.6)' },
            ticks: {
              color: isDark ? '#a1a1aa' : '#71717a',
              font: { size: 10 },
              callback: (val) => {
                if (val >= 1000000) return (val / 1000000) + 'M';
                if (val >= 1000) return (val / 1000) + 'k';
                return val;
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 10,
              color: isDark ? '#d4d4d8' : '#3f3f46',
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return ` ${context.dataset.label}: ${this.formatCurrency(context.raw)}`;
              }
            }
          }
        }
      }
    });
  }

  openAddModal(defaultType = 'expense') {
    const modal = document.getElementById('tx-modal');
    const form = document.getElementById('tx-modal-form');
    form.reset();

    // Chọn radio
    const radio = document.querySelector(`input[name="modal-tx-type"][value="${defaultType}"]`);
    if (radio) radio.checked = true;

    this.updateCategoryOptionsInModal(defaultType);

    document.getElementById('modal-tx-date').value = getLocalDateString();
    modal.classList.add('active');
  }

  closeModal() {
    document.getElementById('tx-modal')?.classList.remove('active');
  }

  updateCategoryOptionsInModal(type) {
    const select = document.getElementById('modal-tx-category');
    if (!select) return;

    select.innerHTML = '';
    Object.keys(FINANCE_CATEGORIES).forEach(key => {
      const item = FINANCE_CATEGORIES[key];
      if (item.type === type) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = item.label;
        select.appendChild(opt);
      }
    });
  }

  saveTransactionFromModal() {
    const type = document.querySelector('input[name="modal-tx-type"]:checked')?.value || 'expense';
    const amountInput = document.getElementById('modal-tx-amount');
    const category = document.getElementById('modal-tx-category').value;
    const date = document.getElementById('modal-tx-date').value;
    const note = document.getElementById('modal-tx-note').value.trim();

    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
      showToast("Vui lòng nhập số tiền hợp lệ (> 0)!", "warning");
      return;
    }

    if (!date) {
      showToast("Vui lòng chọn ngày giao dịch!", "warning");
      return;
    }

    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type,
      amount: amount,
      category: category,
      date: date,
      note: note,
      createdAt: Date.now()
    };

    if (!this.storage.data.transactions) this.storage.data.transactions = [];
    this.storage.data.transactions.push(newTx);
    this.storage.save();

    this.closeModal();
    this.render();
    if (window.app) window.app.renderDashboard();

    showToast(`Đã lưu khoản ${type === 'expense' ? 'chi' : 'thu'} ${this.formatCurrency(amount)}!`, "success");
  }

  deleteTransaction(id) {
    if (confirm("Bạn có chắc muốn xóa giao dịch này?")) {
      this.storage.data.transactions = (this.storage.data.transactions || []).filter(t => t.id !== id);
      this.storage.save();
      this.render();
      if (window.app) window.app.renderDashboard();
      showToast("Đã xóa giao dịch", "info");
    }
  }

  openBudgetModal() {
    const modal = document.getElementById('budget-modal');
    document.getElementById('input-weekly-budget').value = this.storage.data.user.weeklyBudget || 1500000;
    document.getElementById('input-monthly-budget').value = this.storage.data.user.monthlyBudget || 6000000;
    modal.classList.add('active');
  }

  closeBudgetModal() {
    document.getElementById('budget-modal')?.classList.remove('active');
  }

  saveBudget() {
    const w = parseFloat(document.getElementById('input-weekly-budget').value);
    const m = parseFloat(document.getElementById('input-monthly-budget').value);

    if (isNaN(w) || w <= 0 || isNaN(m) || m <= 0) {
      showToast("Vui lòng nhập ngân sách hợp lệ!", "warning");
      return;
    }

    this.storage.data.user.weeklyBudget = w;
    this.storage.data.user.monthlyBudget = m;
    this.storage.save();

    this.closeBudgetModal();
    this.render();
    if (window.app) window.app.renderDashboard();
    showToast("Đã cập nhật hạn mức ngân sách mới! 🎯", "success");
  }
}
