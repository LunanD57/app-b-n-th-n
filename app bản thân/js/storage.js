/**
 * storage.js - Quản lý lưu trữ LocalStorage, Sao lưu & Khôi phục dữ liệu
 */

const STORAGE_KEY = 'better_me_app_data_v1';

// Lời trích dẫn truyền động lực thay đổi bản thân
const MOTIVATIONAL_QUOTES = [
  { text: "Chúng ta không thể thay đổi quá khứ, nhưng có thể kiến tạo tương lai bắt đầu từ kỷ luật hôm nay.", author: "Marcus Aurelius" },
  { text: "Thay đổi nhỏ tích luỹ mỗi ngày sẽ tạo nên kết quả phi thường theo thời gian.", author: "James Clear (Atomic Habits)" },
  { text: "Người duy nhất bạn nên cố gắng vượt qua là chính bạn của ngày hôm qua.", author: "Anonymous" },
  { text: "Kỷ luật là cầu nối giữa mục tiêu và sự thành tựu.", author: "Jim Rohn" },
  { text: "Đầu tư cho bản thân luôn là khoản đầu tư mang lại mức lãi suất cao nhất.", author: "Warren Buffett" },
  { text: "Đừng chờ đợi cảm hứng; hãy tạo dựng thói quen và cảm hứng sẽ tự tìm đến bạn.", author: "Jack London" },
  { text: "Hãy làm những việc khó khăn khi chúng còn dễ dàng và làm những việc vĩ đại từ những bước nhỏ bé.", author: "Lão Tử" },
  { text: "Cái giá của sự kỷ luật luôn nhẹ hơn nhiều so với cái giá của sự hối tiếc.", author: "Nido Qubein" }
];

// Danh mục công việc
const TASK_CATEGORIES = {
  health: { label: 'Sức Khỏe & Thể Lực', badgeClass: 'badge-health', icon: 'dumbbell', color: '#ef4444' },
  growth: { label: 'Học Tập & Phát Triển', badgeClass: 'badge-growth', icon: 'book-open', color: '#8b5cf6' },
  work: { label: 'Công Việc & Dự Án', badgeClass: 'badge-work', icon: 'briefcase', color: '#3b82f6' },
  mind: { label: 'Tâm Trí & Kỷ Luật', badgeClass: 'badge-mind', icon: 'sparkles', color: '#10b981' },
  life: { label: 'Sinh Hoạt & Cá Nhân', badgeClass: 'badge-life', icon: 'heart', color: '#f59e0b' }
};

// Danh mục chi tiêu
const FINANCE_CATEGORIES = {
  // Khoản chi
  food: { label: 'Ăn uống & Dinh dưỡng', type: 'expense', icon: 'utensils', color: '#f97316' },
  self_growth: { label: 'Đầu tư Bản thân (Sách/Học)', type: 'expense', icon: 'graduation-cap', color: '#8b5cf6' },
  health: { label: 'Sức khoẻ & Thể thao', type: 'expense', icon: 'activity', color: '#10b981' },
  bills: { label: 'Nhà cửa & Hoá đơn', type: 'expense', icon: 'home', color: '#3b82f6' },
  transport: { label: 'Đi lại & Xăng xe', type: 'expense', icon: 'car', color: '#64748b' },
  shopping: { label: 'Mua sắm thiết yếu', type: 'expense', icon: 'shopping-bag', color: '#ec4899' },
  entertainment: { label: 'Giải trí / Bạn bè', type: 'expense', icon: 'coffee', color: '#eab308' },
  other_expense: { label: 'Chi phí khác', type: 'expense', icon: 'more-horizontal', color: '#71717a' },
  // Khoản thu
  salary: { label: 'Tiền lương chính', type: 'income', icon: 'wallet', color: '#22c55e' },
  side_income: { label: 'Thu nhập phụ / Freelance', type: 'income', icon: 'trending-up', color: '#06b6d4' },
  reward: { label: 'Thưởng / Tiền lời', type: 'income', icon: 'award', color: '#a855f7' },
  other_income: { label: 'Thu nhập khác', type: 'income', icon: 'plus-circle', color: '#14b8a6' }
};

// Lấy ngày chuẩn định dạng YYYY-MM-DD
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Tạo dữ liệu mẫu ban đầu
function createSampleData() {
  const today = new Date();
  
  // Tính ngày Thứ 2 của tuần này
  const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const getWeekDayStr = (offsetDays) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offsetDays);
    return getLocalDateString(d);
  };

  return {
    version: 1,
    user: {
      name: "Bản Thân Tôi",
      motto: "Mỗi ngày tốt hơn 1% - Kỷ luật tạo nên tự do",
      theme: "dark",
      weeklyBudget: 1500000,
      monthlyBudget: 6000000,
      streak: 7,
      lastActiveDate: getLocalDateString(today)
    },
    weeklyBig3: [
      { id: 'b3_1', text: "Tập gym / chạy bộ tối thiểu 4 buổi tuần này", completed: true },
      { id: 'b3_2', text: "Đọc xong 5 chương cuốn sách Phát Triển Bản Thân", completed: false },
      { id: 'b3_3', text: "Kiểm soát chi tiêu không vượt quá 1.500.000đ/tuần", completed: false }
    ],
    // Danh sách nhiệm vụ theo tuần
    tasks: [
      // Thứ 2
      { id: 't_mon_1', date: getWeekDayStr(0), session: 'morning', time: '05:30 - 06:15', title: 'Thức dậy sớm, uống 500ml nước ấm & Chạy bộ 3km', category: 'health', priority: 'high', completed: true },
      { id: 't_mon_2', date: getWeekDayStr(0), session: 'morning', time: '08:30 - 11:30', title: 'Làm việc chuyên sâu (Deep Work): Kế hoạch tuần', category: 'work', priority: 'high', completed: true },
      { id: 't_mon_3', date: getWeekDayStr(0), session: 'evening', time: '20:30 - 21:30', title: 'Đọc sách Thay Đổi Thói Quen (20 trang)', category: 'growth', priority: 'normal', completed: true },
      
      // Thứ 3
      { id: 't_tue_1', date: getWeekDayStr(1), session: 'morning', time: '06:00 - 07:00', title: 'Tập gym phần trên (Ngực & Tay sau)', category: 'health', priority: 'high', completed: true },
      { id: 't_tue_2', date: getWeekDayStr(1), session: 'afternoon', time: '14:00 - 16:30', title: 'Hoàn thành báo cáo & giải quyết dự án', category: 'work', priority: 'high', completed: true },
      { id: 't_tue_3', date: getWeekDayStr(1), session: 'evening', time: '21:00 - 21:45', title: 'Học 30 từ vựng tiếng Anh & Nghe podcast tư duy', category: 'growth', priority: 'normal', completed: false },

      // Thứ 4
      { id: 't_wed_1', date: getWeekDayStr(2), session: 'morning', time: '06:00 - 06:45', title: 'Thiền định 15p & Lên kế hoạch việc quan trọng', category: 'mind', priority: 'high', completed: true },
      { id: 't_wed_2', date: getWeekDayStr(2), session: 'afternoon', time: '15:00 - 17:00', title: 'Nghiên cứu kỹ năng mới phục vụ công việc', category: 'growth', priority: 'normal', completed: false },
      { id: 't_wed_3', date: getWeekDayStr(2), session: 'evening', time: '20:00 - 21:00', title: 'Chạy bộ phục hồi 4km ngoài trời', category: 'health', priority: 'high', completed: false },

      // Thứ 5
      { id: 't_thu_1', date: getWeekDayStr(3), session: 'morning', time: '06:00 - 07:00', title: 'Tập gym phần thân dưới (Chân & Bụng)', category: 'health', priority: 'high', completed: false },
      { id: 't_thu_2', date: getWeekDayStr(3), session: 'afternoon', time: '13:30 - 16:30', title: 'Tập trung xử lý các đầu việc tồn đọng', category: 'work', priority: 'normal', completed: false },
      { id: 't_thu_3', date: getWeekDayStr(3), session: 'evening', time: '21:00 - 22:00', title: 'Viết nhật ký phản chiếu bản thân & Đọc sách', category: 'mind', priority: 'normal', completed: false },

      // Thứ 6
      { id: 't_fri_1', date: getWeekDayStr(4), session: 'morning', time: '06:00 - 06:45', title: 'Cardio nhẹ & Ăn sáng lành mạnh nhiều protein', category: 'health', priority: 'normal', completed: false },
      { id: 't_fri_2', date: getWeekDayStr(4), session: 'afternoon', time: '14:00 - 16:30', title: 'Tổng kết công việc tuần, dọn dẹp hòm thư', category: 'work', priority: 'high', completed: false },
      { id: 't_fri_3', date: getWeekDayStr(4), session: 'evening', time: '19:30 - 21:30', title: 'Gặp gỡ bạn bè thân thiết / Networking tích cực', category: 'life', priority: 'normal', completed: false },

      // Thứ 7
      { id: 't_sat_1', date: getWeekDayStr(5), session: 'morning', time: '07:00 - 08:30', title: 'Đạp xe ngoài trời tận hưởng không khí trong lành', category: 'health', priority: 'normal', completed: false },
      { id: 't_sat_2', date: getWeekDayStr(5), session: 'afternoon', time: '14:00 - 17:00', title: 'Dọn dẹp lại phòng ngủ và góc làm việc tối giản', category: 'life', priority: 'normal', completed: false },
      { id: 't_sat_3', date: getWeekDayStr(5), session: 'evening', time: '20:00 - 21:30', title: 'Xem phim tư liệu truyền cảm hứng hoặc nghe sách nói', category: 'growth', priority: 'normal', completed: false },

      // Chủ Nhật
      { id: 't_sun_1', date: getWeekDayStr(6), session: 'morning', time: '08:00 - 09:30', title: 'Nấu bữa ăn dinh dưỡng cho bản thân & gia đình', category: 'life', priority: 'normal', completed: false },
      { id: 't_sun_2', date: getWeekDayStr(6), session: 'afternoon', time: '15:00 - 17:00', title: 'Soi xét tuần cũ & Lập thời khóa biểu chi tiết cho tuần mới', category: 'mind', priority: 'high', completed: false },
      { id: 't_sun_3', date: getWeekDayStr(6), session: 'evening', time: '21:00 - 22:00', title: 'Chuẩn bị trang phục, đi ngủ sớm trước 22:30', category: 'health', priority: 'high', completed: false }
    ],

    // Mẫu tuần chuẩn (Ideal Template) để áp dụng nhanh
    masterTemplate: [
      { dayIndex: 0, session: 'morning', time: '05:30 - 06:30', title: 'Dậy sớm, tập thể dục & Đọc sách', category: 'health', priority: 'high' },
      { dayIndex: 0, session: 'evening', time: '21:00 - 22:00', title: 'Học kỹ năng mới & Viết nhật ký', category: 'growth', priority: 'normal' },
      { dayIndex: 1, session: 'morning', time: '06:00 - 07:00', title: 'Tập Gym / Chạy bộ', category: 'health', priority: 'high' },
      { dayIndex: 2, session: 'evening', time: '20:30 - 21:30', title: 'Học tiếng Anh / Kỹ năng chuyên môn', category: 'growth', priority: 'normal' },
      { dayIndex: 3, session: 'morning', time: '06:00 - 07:00', title: 'Tập Gym / Vận động', category: 'health', priority: 'high' },
      { dayIndex: 4, session: 'evening', time: '20:30 - 21:30', title: 'Đọc sách phát triển tư duy', category: 'growth', priority: 'normal' },
      { dayIndex: 6, session: 'afternoon', time: '15:00 - 17:00', title: 'Đánh giá tuần & Lên lịch tuần sau', category: 'mind', priority: 'high' }
    ],

    // Giao dịch tài chính mẫu
    transactions: [
      { id: 'tx_1', type: 'income', amount: 15000000, category: 'salary', date: getWeekDayStr(-3), note: 'Lương tháng nhận qua tài khoản', createdAt: Date.now() - 300000000 },
      { id: 'tx_2', type: 'expense', amount: 220000, category: 'self_growth', date: getWeekDayStr(0), note: 'Mua sách Atomic Habits & Sổ tay kỷ luật', createdAt: Date.now() - 250000000 },
      { id: 'tx_3', type: 'expense', amount: 65000, category: 'food', date: getWeekDayStr(0), note: 'Bữa trưa cơm gà dinh dưỡng', createdAt: Date.now() - 240000000 },
      { id: 'tx_4', type: 'expense', amount: 350000, category: 'health', date: getWeekDayStr(1), note: 'Mua vé tháng phòng tập Gym', createdAt: Date.now() - 170000000 },
      { id: 'tx_5', type: 'expense', amount: 80000, category: 'transport', date: getWeekDayStr(1), note: 'Đổ xăng xe máy', createdAt: Date.now() - 150000000 },
      { id: 'tx_6', type: 'expense', amount: 45000, category: 'food', date: getWeekDayStr(2), note: 'Bữa sáng phở bò', createdAt: Date.now() - 90000000 },
      { id: 'tx_7', type: 'income', amount: 800000, category: 'side_income', date: getWeekDayStr(2), note: 'Thu nhập từ dự án làm thêm', createdAt: Date.now() - 50000000 }
    ],

    // Đánh giá tuần
    reflections: {}
  };
}

class AppStorage {
  constructor() {
    this.data = this.load();
    this.checkAndUpdateStreak();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.error("Lỗi đọc dữ liệu từ LocalStorage:", e);
    }
    const sample = createSampleData();
    this.save(sample);
    return sample;
  }

  save(data = this.data) {
    try {
      this.data = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Lỗi lưu dữ liệu vào LocalStorage:", e);
      return false;
    }
  }

  reset() {
    const sample = createSampleData();
    this.save(sample);
    return sample;
  }

  exportJSON() {
    const jsonStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BetterMe_Backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported && (imported.tasks || imported.transactions)) {
            this.save(imported);
            resolve(imported);
          } else {
            reject(new Error("File JSON không đúng cấu trúc ứng dụng!"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Không thể đọc file"));
      reader.readAsText(file);
    });
  }

  checkAndUpdateStreak() {
    const todayStr = getLocalDateString();
    if (!this.data.user) return;
    
    const lastActive = this.data.user.lastActiveDate;
    if (lastActive === todayStr) {
      // Đã cập nhật hôm nay
      return;
    }

    const todayDate = new Date();
    const lastDate = lastActive ? new Date(lastActive) : null;

    if (lastDate) {
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        this.data.user.streak = (this.data.user.streak || 0) + 1;
      } else if (diffDays > 1) {
        this.data.user.streak = 1; // Khởi động lại streak nếu ngắt quãng
      }
    } else {
      this.data.user.streak = 1;
    }

    this.data.user.lastActiveDate = todayStr;
    this.save();
  }
}

window.appStorage = new AppStorage();
