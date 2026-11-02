/**
 * app.js - Controller chính của ứng dụng BetterMe
 */

class App {
  constructor() {
    this.storage = window.appStorage;
    this.currentTab = 'dashboard';
    this.init();
  }

  init() {
    this.applyTheme(this.storage.data.user.theme || 'dark');
    this.bindNavigation();
    this.bindSettings();
    this.bindGlobalShortcuts();

    // Khởi tạo các module con
    window.scheduleManager = new ScheduleManager(this.storage);
    window.financeManager = new FinanceManager(this.storage);

    // Render ban đầu
    this.renderDashboard();
    this.renderQuote();
    this.updateGreeting();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.storage.data.user.theme = theme;
    this.storage.save();

    const themeToggleBtn = document.getElementById('theme-toggle-icon');
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    this.applyTheme(isDark ? 'light' : 'dark');
    // Cập nhật lại biểu đồ nếu đang ở tab finance
    if (window.financeManager) {
      window.financeManager.renderCharts();
    }
  }

  bindNavigation() {
    const navButtons = document.querySelectorAll('[data-nav-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = btn.getAttribute('data-nav-target');
        this.switchTab(targetTab);
      });
    });

    // Theme toggle button
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Nút đổi quote
    document.getElementById('refresh-quote-btn')?.addEventListener('click', () => {
      this.renderQuote(true);
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Ẩn tất cả tab section
    const tabs = document.querySelectorAll('.app-tab-content');
    tabs.forEach(t => t.classList.add('hidden'));

    // Hiện tab được chọn
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) {
      activeTab.classList.remove('hidden');
    }

    // Cập nhật trạng thái nút nav
    const navButtons = document.querySelectorAll('[data-nav-target]');
    navButtons.forEach(btn => {
      const target = btn.getAttribute('data-nav-target');
      if (target === tabId) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/20');
        btn.classList.remove('text-zinc-600', 'dark:text-zinc-400', 'hover:bg-zinc-100', 'dark:hover:bg-zinc-800');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/20');
        btn.classList.add('text-zinc-600', 'dark:text-zinc-400', 'hover:bg-zinc-100', 'dark:hover:bg-zinc-800');
      }
    });

    // Khi chuyển tab, kích hoạt render tương ứng
    if (tabId === 'dashboard') {
      this.renderDashboard();
    } else if (tabId === 'schedule') {
      window.scheduleManager.render();
    } else if (tabId === 'finance') {
      window.financeManager.render();
    } else if (tabId === 'settings') {
      this.renderSettings();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateGreeting() {
    const greetingEl = document.getElementById('user-greeting');
    const nameEl = document.getElementById('user-name-display');
    const streakEl = document.getElementById('user-streak-badge');

    const hour = new Date().getHours();
    let greet = "Chào buổi sáng 🌅";
    if (hour >= 12 && hour < 18) greet = "Chào buổi chiều ☀️";
    else if (hour >= 18) greet = "Chào buổi tối 🌙";

    if (greetingEl) greetingEl.textContent = greet;
    if (nameEl) nameEl.textContent = this.storage.data.user.name || "Bản Thân Tôi";
    if (streakEl) {
      const streak = this.storage.data.user.streak || 1;
      streakEl.innerHTML = `<i data-lucide="flame" class="w-4 h-4 text-orange-500 fill-orange-500"></i> ${streak} ngày kỷ luật`;
    }
  }

  renderQuote(random = false) {
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    if (!quoteText || !quoteAuthor) return;

    let quote;
    if (random) {
      quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    } else {
      // Dựa vào ngày trong năm để mỗi ngày có 1 quote cố định
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      quote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    }

    quoteText.textContent = `“${quote.text}”`;
    quoteAuthor.textContent = `— ${quote.author}`;
  }

  renderDashboard() {
    this.updateGreeting();

    const todayStr = getLocalDateString();
    const tasks = this.storage.data.tasks || [];
    const todayTasks = tasks.filter(t => t.date === todayStr);

    // Tính toán tiến độ hôm nay
    const todayDone = todayTasks.filter(t => t.completed).length;
    const todayTotal = todayTasks.length;
    const todayPercent = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

    const todayRateEl = document.getElementById('dash-today-rate');
    const todayBarEl = document.getElementById('dash-today-bar');
    const todayCountEl = document.getElementById('dash-today-count');

    if (todayRateEl) todayRateEl.textContent = `${todayPercent}%`;
    if (todayBarEl) todayBarEl.style.width = `${todayPercent}%`;
    if (todayCountEl) todayCountEl.textContent = `${todayDone}/${todayTotal} việc xong`;

    // Render danh sách công việc trọng tâm hôm nay
    const todayTasksList = document.getElementById('dash-today-tasks');
    if (todayTasksList) {
      if (todayTasks.length === 0) {
        todayTasksList.innerHTML = `
          <div class="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-700/60 rounded-xl">
            <p class="text-xs text-zinc-400">Hôm nay bạn chưa có lịch việc nào.</p>
            <button onclick="window.app.switchTab('schedule'); window.scheduleManager.openAddModal('${todayStr}')" class="mt-2 text-xs font-semibold text-indigo-500 hover:underline">
              + Lên kế hoạch cho hôm nay ngay
            </button>
          </div>
        `;
      } else {
        todayTasksList.innerHTML = todayTasks.map(t => {
          const cat = TASK_CATEGORIES[t.category] || TASK_CATEGORIES.growth;
          return `
            <div class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <div class="flex items-center gap-3 min-w-0">
                <input 
                  type="checkbox" 
                  ${t.completed ? 'checked' : ''} 
                  onchange="window.scheduleManager.toggleTask('${t.id}')"
                  class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate ${t.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}">
                    ${escapeHtml(t.title)}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-medium px-1.5 py-0.2 rounded ${cat.badgeClass}">
                      ${cat.label}
                    </span>
                    ${t.time ? `<span class="text-[10px] text-zinc-400 font-mono">${t.time}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Cập nhật tóm tắt tài chính trên Dashboard
    if (window.financeManager) {
      window.financeManager.renderSummaryKPIs();
    }
  }

  renderSettings() {
    const user = this.storage.data.user || {};
    const nameInput = document.getElementById('settings-name-input');
    const mottoInput = document.getElementById('settings-motto-input');
    const streakInput = document.getElementById('settings-streak-input');

    if (nameInput) nameInput.value = user.name || '';
    if (mottoInput) mottoInput.value = user.motto || '';
    if (streakInput) streakInput.value = user.streak || 1;
  }

  bindSettings() {
    // Form lưu hồ sơ
    const profileForm = document.getElementById('settings-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('settings-name-input').value.trim();
        const motto = document.getElementById('settings-motto-input').value.trim();
        const streak = parseInt(document.getElementById('settings-streak-input').value, 10);

        this.storage.data.user.name = name || "Bản Thân Tôi";
        this.storage.data.user.motto = motto;
        if (!isNaN(streak) && streak >= 0) {
          this.storage.data.user.streak = streak;
        }

        this.storage.save();
        this.updateGreeting();
        showToast("Đã cập nhật thông tin cá nhân! 🌟", "success");
      });
    }

    // Xuất dữ liệu (Backup)
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
      this.storage.exportJSON();
      showToast("Đã tải xuống file sao lưu dữ liệu!", "success");
    });

    // Nhập dữ liệu (Restore)
    const importInput = document.getElementById('import-file-input');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          await this.storage.importJSON(file);
          showToast("Khôi phục dữ liệu thành công! 🚀", "success");
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          showToast("Lỗi nhập file: " + err.message, "danger");
        }
      });
    }

    // Đặt lại dữ liệu mẫu
    document.getElementById('reset-sample-btn')?.addEventListener('click', () => {
      if (confirm("Bạn có muốn đặt lại dữ liệu mẫu ban đầu? Toàn bộ dữ liệu hiện tại sẽ được thay bằng bộ mẫu.")) {
        this.storage.reset();
        showToast("Đã khôi phục dữ liệu mẫu thành công!", "success");
        setTimeout(() => location.reload(), 600);
      }
    });

    // Xóa sạch dữ liệu
    document.getElementById('clear-all-btn')?.addEventListener('click', () => {
      if (confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu (công việc, tài chính)? Hành động này không thể hoàn tác.")) {
        this.storage.data.tasks = [];
        this.storage.data.transactions = [];
        this.storage.data.weeklyBig3 = [];
        this.storage.save();
        showToast("Đã dọn sạch dữ liệu!", "info");
        setTimeout(() => location.reload(), 600);
      }
    });
  }

  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape để đóng modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
      }
    });
  }
}

// Hàm thông báo Toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  
  let bg = 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900';
  let icon = 'info';

  if (type === 'success') {
    bg = 'bg-emerald-600 text-white';
    icon = 'check-circle';
  } else if (type === 'warning') {
    bg = 'bg-amber-600 text-white';
    icon = 'alert-triangle';
  } else if (type === 'danger') {
    bg = 'bg-rose-600 text-white';
    icon = 'alert-octagon';
  }

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-medium transform transition-all duration-300 translate-y-4 opacity-0 ${bg}`;
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i> <span>${message}</span>`;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Khởi tạo app khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
