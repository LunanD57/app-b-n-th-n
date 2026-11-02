/**
 * schedule.js - Quản lý Thời khóa biểu tuần, Kế hoạch hành động & Đánh giá kỷ luật
 */

class ScheduleManager {
  constructor(storage) {
    this.storage = storage;
    this.currentWeekOffset = 0; // 0 = tuần hiện tại, 1 = tuần sau, -1 = tuần trước
    this.filterCategory = 'all';
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Sự kiện chuyển tuần
    document.getElementById('prev-week-btn')?.addEventListener('click', () => {
      this.currentWeekOffset--;
      this.render();
    });

    document.getElementById('next-week-btn')?.addEventListener('click', () => {
      this.currentWeekOffset++;
      this.render();
    });

    document.getElementById('current-week-btn')?.addEventListener('click', () => {
      this.currentWeekOffset = 0;
      this.render();
    });

    // Lọc theo danh mục
    document.getElementById('task-category-filter')?.addEventListener('change', (e) => {
      this.filterCategory = e.target.value;
      this.render();
    });

    // Form thêm/sửa công việc
    const taskForm = document.getElementById('task-modal-form');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTaskFromModal();
      });
    }

    // Nút áp dụng mẫu tuần chuẩn
    document.getElementById('apply-template-btn')?.addEventListener('click', () => {
      this.applyMasterTemplate();
    });

    // Nút lưu tuần này thành mẫu chuẩn
    document.getElementById('save-as-template-btn')?.addEventListener('click', () => {
      this.saveCurrentWeekAsTemplate();
    });

    // Nút sao chép tuần trước
    document.getElementById('copy-prev-week-btn')?.addEventListener('click', () => {
      this.copyFromPreviousWeek();
    });

    // Lưu Top 3 mục tiêu tuần
    document.getElementById('save-big3-btn')?.addEventListener('click', () => {
      this.saveBig3Goals();
    });

    // Lưu nhật ký soi xét tuần
    document.getElementById('save-reflection-btn')?.addEventListener('click', () => {
      this.saveReflection();
    });
  }

  // Lấy ngày thứ 2 của tuần được chọn
  getMondayOfWeek(offset = this.currentWeekOffset) {
    const today = new Date();
    const day = today.getDay(); // 0 là CN, 1 là T2...
    const diff = (day === 0 ? -6 : 1 - day) + (offset * 7);
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Danh sách 7 ngày trong tuần được chọn
  getDaysOfWeek() {
    const monday = this.getMondayOfWeek();
    const days = [];
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const shortNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const todayStr = getLocalDateString();

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalDateString(d);

      days.push({
        index: i,
        dayName: dayNames[i],
        shortName: shortNames[i],
        dateStr: dateStr,
        displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
        fullDateStr: d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }),
        isToday: dateStr === todayStr,
        dateObj: d
      });
    }
    return days;
  }

  // Tính khoá tuần (VD: 2026-W44)
  getWeekIdentifier() {
    const monday = this.getMondayOfWeek();
    const year = monday.getFullYear();
    const firstJan = new Date(year, 0, 1);
    const pastDaysOfYear = (monday - firstJan) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstJan.getDay() + 1) / 7);
    return `${year}-W${weekNum}`;
  }

  render() {
    const days = this.getDaysOfWeek();
    const monday = days[0];
    const sunday = days[6];
    
    // Cập nhật tiêu đề tuần
    const weekTitleEl = document.getElementById('current-week-display');
    if (weekTitleEl) {
      weekTitleEl.textContent = `Tuần: ${monday.displayDate} - ${sunday.displayDate}/${sunday.dateObj.getFullYear()}`;
    }

    // Render danh sách ngày và việc
    this.renderWeekSchedule(days);

    // Render Top 3 Mục Tiêu Tuần
    this.renderBig3Goals();

    // Render Thống kê Kỷ luật
    this.renderDisciplineStats(days);

    // Render Reflection
    this.renderReflection();

    // Khởi tạo lại icons Lucide
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderWeekSchedule(days) {
    const container = document.getElementById('weekly-schedule-grid');
    if (!container) return;

    const allTasks = this.storage.data.tasks || [];

    // Tạo HTML cho 7 ngày
    container.innerHTML = days.map((day) => {
      // Lọc việc theo ngày
      let dayTasks = allTasks.filter(t => t.date === day.dateStr);

      if (this.filterCategory !== 'all') {
        dayTasks = dayTasks.filter(t => t.category === this.filterCategory);
      }

      // Sắp xếp: Ưu tiên cao trước, theo giờ
      dayTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.time || '').localeCompare(b.time || '');
      });

      const completedCount = dayTasks.filter(t => t.completed).length;
      const totalCount = dayTasks.length;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return `
        <div class="flex flex-col bg-white dark:bg-zinc-800/80 rounded-2xl p-4 border ${day.isToday ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'border-zinc-200 dark:border-zinc-700/60'} transition-all duration-200">
          <!-- Header ngày -->
          <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-700/50 mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-base ${day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-200'}">
                  ${day.dayName}
                </span>
                ${day.isToday ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">HÔM NAY</span>' : ''}
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">${day.displayDate}</p>
            </div>
            <!-- Chỉ số ngày -->
            <div class="text-right">
              <span class="text-xs font-semibold ${completedCount === totalCount && totalCount > 0 ? 'text-emerald-500' : 'text-zinc-500'}">
                ${completedCount}/${totalCount} xong
              </span>
              <div class="w-14 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full mt-1 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
              </div>
            </div>
          </div>

          <!-- Danh sách nhiệm vụ trong ngày -->
          <div class="flex-1 space-y-2.5 min-h-[220px]">
            ${dayTasks.length === 0 ? `
              <div class="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 dark:border-zinc-700/70 rounded-xl">
                <i data-lucide="calendar-plus" class="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2"></i>
                <p class="text-xs text-zinc-400 dark:text-zinc-500">Chưa có lịch trình</p>
                <button onclick="window.scheduleManager.openAddModal('${day.dateStr}')" class="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  + Thêm việc cần làm
                </button>
              </div>
            ` : dayTasks.map(task => this.renderTaskItem(task)).join('')}
          </div>

          <!-- Nút thêm nhanh -->
          <button onclick="window.scheduleManager.openAddModal('${day.dateStr}')" class="w-full mt-3 py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/40 rounded-xl transition flex items-center justify-center gap-1.5 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            Thêm việc
          </button>
        </div>
      `;
    }).join('');
  }

  renderTaskItem(task) {
    const cat = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.growth;
    return `
      <div class="group relative bg-zinc-50/80 dark:bg-zinc-900/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/90 p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 transition-all duration-150 ${task.completed ? 'opacity-60 bg-emerald-50/30 dark:bg-emerald-950/10' : ''}">
        <div class="flex items-start gap-2.5">
          <!-- Checkbox -->
          <input 
            type="checkbox" 
            ${task.completed ? 'checked' : ''} 
            onchange="window.scheduleManager.toggleTask('${task.id}')"
            class="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 cursor-pointer"
          />

          <!-- Nội dung việc -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-medium px-2 py-0.5 rounded-md ${cat.badgeClass} flex items-center gap-1">
                <i data-lucide="${cat.icon}" class="w-3 h-3"></i>
                ${cat.label}
              </span>
              ${task.priority === 'high' ? '<span class="text-[10px] font-bold px-1.5 py-0.2 rounded text-rose-600 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300">GẤP</span>' : ''}
              ${task.time ? `<span class="text-[11px] text-zinc-400 font-mono flex items-center gap-0.5"><i data-lucide="clock" class="w-2.5 h-2.5"></i>${task.time}</span>` : ''}
            </div>
            <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1 break-words leading-relaxed ${task.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}">
              ${escapeHtml(task.title)}
            </p>
          </div>

          <!-- Nút hành động nhanh -->
          <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button onclick="window.scheduleManager.openEditModal('${task.id}')" title="Sửa việc" class="p-1 hover:text-indigo-500 text-zinc-400 transition">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.scheduleManager.deleteTask('${task.id}')" title="Xóa việc" class="p-1 hover:text-rose-500 text-zinc-400 transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderBig3Goals() {
    const list = this.storage.data.weeklyBig3 || [];
    const container = document.getElementById('big3-goals-container');
    if (!container) return;

    container.innerHTML = [0, 1, 2].map(idx => {
      const goal = list[idx] || { id: `b3_${idx}`, text: '', completed: false };
      return `
        <div class="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/90 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
          <input 
            type="checkbox" 
            ${goal.completed ? 'checked' : ''} 
            onchange="window.scheduleManager.toggleBig3Goal(${idx})"
            class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 cursor-pointer"
          />
          <div class="flex-1">
            <input 
              type="text" 
              value="${escapeHtml(goal.text || '')}" 
              placeholder="Mục tiêu lớn #${idx + 1} của tuần này..." 
              onblur="window.scheduleManager.updateBig3Text(${idx}, this.value)"
              class="w-full text-xs md:text-sm bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 focus:outline-none py-1 text-zinc-800 dark:text-zinc-200 ${goal.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}"
            />
          </div>
          <span class="text-[11px] font-bold text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700/50">TOP ${idx + 1}</span>
        </div>
      `;
    }).join('');
  }

  updateBig3Text(index, text) {
    if (!this.storage.data.weeklyBig3) this.storage.data.weeklyBig3 = [];
    if (!this.storage.data.weeklyBig3[index]) {
      this.storage.data.weeklyBig3[index] = { id: `b3_${index}`, text: text, completed: false };
    } else {
      this.storage.data.weeklyBig3[index].text = text;
    }
    this.storage.save();
  }

  toggleBig3Goal(index) {
    if (!this.storage.data.weeklyBig3) return;
    if (this.storage.data.weeklyBig3[index]) {
      const isCompleted = !this.storage.data.weeklyBig3[index].completed;
      this.storage.data.weeklyBig3[index].completed = isCompleted;
      this.storage.save();
      if (isCompleted && window.confetti) {
        window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
      this.render();
    }
  }

  renderDisciplineStats(days) {
    const dates = days.map(d => d.dateStr);
    const tasks = (this.storage.data.tasks || []).filter(t => dates.includes(t.date));

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const rateEl = document.getElementById('week-discipline-rate');
    const barEl = document.getElementById('week-discipline-bar');
    const noteEl = document.getElementById('week-discipline-note');
    const totalEl = document.getElementById('week-discipline-total');

    if (rateEl) rateEl.textContent = `${rate}%`;
    if (totalEl) totalEl.textContent = `${completed}/${total} nhiệm vụ hoàn tất`;
    if (barEl) barEl.style.width = `${rate}%`;

    if (noteEl) {
      if (total === 0) {
        noteEl.textContent = "Hãy bắt đầu lên lịch các mục tiêu tuần để kích hoạt chỉ số kỷ luật!";
      } else if (rate >= 80) {
        noteEl.innerHTML = `<span class="text-emerald-500 font-semibold">Phong độ đỉnh cao!</span> Bạn đang thực sự kỷ luật và thay đổi từng ngày.`;
      } else if (rate >= 50) {
        noteEl.innerHTML = `<span class="text-indigo-500 font-semibold">Khá tốt!</span> Tiếp tục đẩy nhanh tiến độ cho các ngày còn lại nhé.`;
      } else {
        noteEl.innerHTML = `<span class="text-amber-500 font-semibold">Cần cố gắng!</span> Tập trung hoàn thành 1 việc quan trọng ngay lúc này.`;
      }
    }

    // Cập nhật thẻ Dashboard nếu có
    const dashProgress = document.getElementById('dash-schedule-progress');
    if (dashProgress) {
      dashProgress.textContent = `${rate}%`;
    }
  }

  renderReflection() {
    const weekKey = this.getWeekIdentifier();
    const refData = (this.storage.data.reflections || {})[weekKey] || { score: '', proud: '', improve: '' };

    const scoreInput = document.getElementById('reflection-score');
    const proudInput = document.getElementById('reflection-proud');
    const improveInput = document.getElementById('reflection-improve');

    if (scoreInput) scoreInput.value = refData.score || '';
    if (proudInput) proudInput.value = refData.proud || '';
    if (improveInput) improveInput.value = refData.improve || '';
  }

  saveReflection() {
    const weekKey = this.getWeekIdentifier();
    if (!this.storage.data.reflections) this.storage.data.reflections = {};

    const scoreInput = document.getElementById('reflection-score');
    const proudInput = document.getElementById('reflection-proud');
    const improveInput = document.getElementById('reflection-improve');

    this.storage.data.reflections[weekKey] = {
      score: scoreInput ? scoreInput.value : '',
      proud: proudInput ? proudInput.value : '',
      improve: improveInput ? improveInput.value : '',
      updatedAt: Date.now()
    };

    this.storage.save();
    showToast("Đã lưu nhật ký tự soi xét tuần thành công! 🌟", "success");
  }

  toggleTask(taskId) {
    const task = (this.storage.data.tasks || []).find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.storage.save();

      if (task.completed) {
        if (window.confetti) {
          window.confetti({
            particleCount: 45,
            spread: 50,
            origin: { y: 0.7 }
          });
        }
      }

      this.render();
      if (window.app) window.app.renderDashboard();
    }
  }

  deleteTask(taskId) {
    if (confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này khỏi thời khóa biểu?")) {
      this.storage.data.tasks = (this.storage.data.tasks || []).filter(t => t.id !== taskId);
      this.storage.save();
      this.render();
      if (window.app) window.app.renderDashboard();
      showToast("Đã xóa nhiệm vụ", "info");
    }
  }

  openAddModal(dateStr) {
    const modal = document.getElementById('task-modal');
    const titleEl = document.getElementById('task-modal-title');
    const form = document.getElementById('task-modal-form');

    form.reset();
    document.getElementById('task-id-input').value = '';
    document.getElementById('task-date-input').value = dateStr || getLocalDateString();
    titleEl.textContent = "Thêm Việc Vào Thời Khóa Biểu";

    modal.classList.add('active');
  }

  openEditModal(taskId) {
    const task = (this.storage.data.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('task-modal');
    const titleEl = document.getElementById('task-modal-title');

    document.getElementById('task-id-input').value = task.id;
    document.getElementById('task-date-input').value = task.date;
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-time-input').value = task.time || '';
    document.getElementById('task-session-select').value = task.session || 'morning';
    document.getElementById('task-category-select').value = task.category || 'growth';
    document.getElementById('task-priority-select').value = task.priority || 'normal';

    titleEl.textContent = "Chỉnh Sửa Nhiệm Vụ";
    modal.classList.add('active');
  }

  closeModal() {
    document.getElementById('task-modal')?.classList.remove('active');
  }

  saveTaskFromModal() {
    const id = document.getElementById('task-id-input').value;
    const date = document.getElementById('task-date-input').value;
    const title = document.getElementById('task-title-input').value.trim();
    const time = document.getElementById('task-time-input').value.trim();
    const session = document.getElementById('task-session-select').value;
    const category = document.getElementById('task-category-select').value;
    const priority = document.getElementById('task-priority-select').value;

    if (!title) {
      showToast("Vui lòng nhập tên công việc!", "warning");
      return;
    }

    if (!date) {
      showToast("Vui lòng chọn ngày thực hiện!", "warning");
      return;
    }

    if (id) {
      // Sửa
      const task = (this.storage.data.tasks || []).find(t => t.id === id);
      if (task) {
        task.date = date;
        task.title = title;
        task.time = time;
        task.session = session;
        task.category = category;
        task.priority = priority;
      }
      showToast("Đã cập nhật nhiệm vụ thành công!", "success");
    } else {
      // Thêm mới
      const newTask = {
        id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        date: date,
        title: title,
        time: time,
        session: session,
        category: category,
        priority: priority,
        completed: false,
        createdAt: Date.now()
      };
      if (!this.storage.data.tasks) this.storage.data.tasks = [];
      this.storage.data.tasks.push(newTask);
      showToast("Đã thêm công việc mới vào lịch trình!", "success");
    }

    this.storage.save();
    this.closeModal();
    this.render();
    if (window.app) window.app.renderDashboard();
  }

  // Áp dụng Mẫu tuần chuẩn vào tuần hiện tại
  applyMasterTemplate() {
    const template = this.storage.data.masterTemplate || [];
    if (template.length === 0) {
      showToast("Chưa có mẫu tuần chuẩn nào được lưu! Hãy tạo lịch tuần này và bấm 'Lưu làm mẫu'.", "warning");
      return;
    }

    if (!confirm(`Bạn có muốn áp dụng ${template.length} thói quen từ "Mẫu Tuần Chuẩn" vào tuần này không?`)) {
      return;
    }

    const days = this.getDaysOfWeek();
    if (!this.storage.data.tasks) this.storage.data.tasks = [];

    template.forEach(item => {
      const targetDay = days[item.dayIndex];
      if (targetDay) {
        this.storage.data.tasks.push({
          id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          date: targetDay.dateStr,
          title: item.title,
          time: item.time || '',
          session: item.session || 'morning',
          category: item.category || 'growth',
          priority: item.priority || 'normal',
          completed: false,
          createdAt: Date.now()
        });
      }
    });

    this.storage.save();
    this.render();
    if (window.app) window.app.renderDashboard();
    showToast(`Đã áp dụng thành công ${template.length} nhiệm vụ từ mẫu tuần!`, "success");
  }

  // Lưu tuần hiện tại làm mẫu chuẩn
  saveCurrentWeekAsTemplate() {
    const days = this.getDaysOfWeek();
    const dates = days.map(d => d.dateStr);
    const currentTasks = (this.storage.data.tasks || []).filter(t => dates.includes(t.date));

    if (currentTasks.length === 0) {
      showToast("Tuần này chưa có công việc nào để lưu làm mẫu!", "warning");
      return;
    }

    if (!confirm(`Lưu ${currentTasks.length} nhiệm vụ của tuần này thành "Mẫu Tuần Chuẩn" cho tương lai?`)) {
      return;
    }

    const templateItems = currentTasks.map(t => {
      const dayIndex = dates.indexOf(t.date);
      return {
        dayIndex: dayIndex >= 0 ? dayIndex : 0,
        title: t.title,
        time: t.time || '',
        session: t.session || 'morning',
        category: t.category || 'growth',
        priority: t.priority || 'normal'
      };
    });

    this.storage.data.masterTemplate = templateItems;
    this.storage.save();
    showToast("Đã lưu lịch biểu thành công làm Mẫu Tuần Chuẩn!", "success");
  }

  // Sao chép lịch từ tuần trước
  copyFromPreviousWeek() {
    const prevMonday = this.getMondayOfWeek(this.currentWeekOffset - 1);
    const currMonday = this.getMondayOfWeek(this.currentWeekOffset);

    const prevDates = [];
    const currDates = [];

    for (let i = 0; i < 7; i++) {
      const p = new Date(prevMonday);
      p.setDate(prevMonday.getDate() + i);
      prevDates.push(getLocalDateString(p));

      const c = new Date(currMonday);
      c.setDate(currMonday.getDate() + i);
      currDates.push(getLocalDateString(c));
    }

    const prevTasks = (this.storage.data.tasks || []).filter(t => prevDates.includes(t.date));
    if (prevTasks.length === 0) {
      showToast("Tuần trước không có nhiệm vụ nào để sao chép!", "warning");
      return;
    }

    if (!confirm(`Sao chép ${prevTasks.length} nhiệm vụ từ tuần trước sang tuần này? (Trạng thái sẽ được đặt lại về chưa hoàn thành)`)) {
      return;
    }

    prevTasks.forEach(task => {
      const dayIdx = prevDates.indexOf(task.date);
      if (dayIdx >= 0) {
        this.storage.data.tasks.push({
          id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          date: currDates[dayIdx],
          title: task.title,
          time: task.time || '',
          session: task.session || 'morning',
          category: task.category || 'growth',
          priority: task.priority || 'normal',
          completed: false,
          createdAt: Date.now()
        });
      }
    });

    this.storage.save();
    this.render();
    if (window.app) window.app.renderDashboard();
    showToast(`Đã sao chép ${prevTasks.length} nhiệm vụ sang tuần này!`, "success");
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
