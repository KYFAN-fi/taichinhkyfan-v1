const STORAGE_KEYS = {
  customers: "m10_customers_v1",
  notifications: "m10_notifications_v1",
  settings: "m10_settings_v1",
  lastReminder: "m10_last_reminder_v1",
};

const STATUS = {
  unreminded: { label: "Chưa nhắc", className: "status-unreminded" },
  reminded: { label: "Đã nhắc", className: "status-reminded" },
  due: { label: "Sắp đến hạn", className: "status-due" },
  overdue: { label: "Quá hạn", className: "status-overdue" },
  paid: { label: "Đã thanh toán", className: "status-paid" },
  paused: { label: "Tạm hoãn", className: "status-paused" },
};

const DEFAULT_CUSTOMERS = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    phone: "0901 234 567",
    principal: 25000000,
    interest: 1000000,
    paid: 0,
    status: "overdue",
    note: "Vay lấy vốn kinh doanh",
    color: "#49b15b",
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    phone: "0912 345 678",
    principal: 15000000,
    interest: 800000,
    paid: 0,
    status: "due",
    note: "Ưu tiên liên hệ qua Zalo",
    color: "#f4a913",
  },
  {
    id: 3,
    name: "Lê Minh Cường",
    phone: "0933 466 789",
    principal: 12000000,
    interest: 600000,
    paid: 0,
    status: "reminded",
    note: "Đã gửi tin nhắn nhắc nợ",
    color: "#48a6e8",
  },
  {
    id: 4,
    name: "Phạm Thùy Linh",
    phone: "0977 888 999",
    principal: 8000000,
    interest: 400000,
    paid: 8400000,
    status: "paid",
    note: "Đã hoàn tất kỳ thanh toán",
    color: "#40aa53",
  },
  {
    id: 5,
    name: "Hoàng Văn Dũng",
    phone: "0988 777 666",
    principal: 20000000,
    interest: 1000000,
    paid: 0,
    status: "paused",
    note: "Tạm hoãn theo thỏa thuận",
    color: "#858b94",
  },
  {
    id: 6,
    name: "Võ Ngọc Mai",
    phone: "0965 222 140",
    principal: 18500000,
    interest: 900000,
    paid: 0,
    status: "unreminded",
    note: "Liên hệ sau 17 giờ",
    color: "#a86ed0",
  },
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    type: "overdue",
    title: "Khoản vay quá hạn",
    message: "Nguyễn Văn An chưa hoàn tất thanh toán kỳ này.",
    time: "08:30",
    read: false,
  },
  {
    id: 2,
    type: "reminded",
    title: "Đã gửi nhắc nợ",
    message: "Tin nhắn nhắc nợ đã được tạo cho Lê Minh Cường.",
    time: "09:15",
    read: false,
  },
  {
    id: 3,
    type: "paid",
    title: "Thanh toán thành công",
    message: "Phạm Thùy Linh đã thanh toán 8.400.000 đ.",
    time: "10:20",
    read: true,
  },
  {
    id: 4,
    type: "paused",
    title: "Tạm hoãn thanh toán",
    message: "Hoàng Văn Dũng được chuyển sang trạng thái tạm hoãn.",
    time: "11:05",
    read: true,
  },
];

const DEFAULT_SETTINGS = {
  early: true,
  repeat: true,
  browser: true,
  zalo: true,
  call: true,
};
const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

let customers = loadData(STORAGE_KEYS.customers, DEFAULT_CUSTOMERS).map(
  (customer) => ({
    ...customer,
    status: STATUS[customer.status] ? customer.status : "unreminded",
  }),
);
let notifications = loadData(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATIONS);
let settings = loadData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
let activeCustomerFilter = "all";
let calendarCursor = new Date();
calendarCursor.setDate(1);

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : structuredClone(fallback);
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function icon(name) {
  return `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, value)) + " đ";
}

function formatShortMoney(value) {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1).replace(".0", "")} tỷ`;
  if (value >= 1_000_000)
    return `${new Intl.NumberFormat("vi-VN").format(value / 1_000_000)} tr`;
  return formatMoney(value);
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getNextReminderDate(from = new Date()) {
  const next = new Date(from.getFullYear(), from.getMonth(), 10, 8, 30, 0, 0);
  if (from.getDate() > 10 || (from.getDate() === 10 && from.getHours() >= 18)) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

function dueDateFor(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 10);
}

function dateText(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function fullDateText(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getTotals() {
  const total = customers.reduce(
    (sum, customer) => sum + customer.principal + customer.interest,
    0,
  );
  const paid = customers.reduce((sum, customer) => sum + customer.paid, 0);
  const remaining = Math.max(0, total - paid);
  const due = customers.filter((customer) =>
    ["unreminded", "due", "overdue", "reminded"].includes(customer.status),
  ).length;
  const unreminded = customers.filter(
    (customer) => customer.status === "unreminded",
  ).length;
  const overdue = customers.filter(
    (customer) => customer.status === "overdue",
  ).length;
  const reminded = customers.filter(
    (customer) => customer.status === "reminded",
  ).length;
  const paidCount = customers.filter(
    (customer) => customer.status === "paid",
  ).length;
  return {
    total,
    paid,
    remaining,
    due,
    unreminded,
    overdue,
    reminded,
    paidCount,
  };
}

function statusBadge(status) {
  const item = STATUS[status] || STATUS.unreminded;
  return `<span class="status-badge ${item.className}">${item.label}</span>`;
}

function statusSelect(customer, context = "card") {
  const item = STATUS[customer.status] || STATUS.unreminded;
  const options = Object.entries(STATUS)
    .map(
      ([value, status]) =>
        `<option value="${value}" ${value === customer.status ? "selected" : ""}>${status.label}</option>`,
    )
    .join("");

  return `
    <label class="status-select-wrap ${item.className} status-select-${context}" title="Điều chỉnh trạng thái">
      <span class="sr-only">Trạng thái của ${customer.name}</span>
      <select class="customer-status-select" data-status-customer-id="${customer.id}" data-status-context="${context}" aria-label="Trạng thái của ${customer.name}">
        ${options}
      </select>
    </label>`;
}

function customerAvatar(customer) {
  return `<span class="avatar" style="background:${customer.color};color:#fff">${initials(customer.name)}</span>`;
}

function setActiveView(viewName) {
  document
    .querySelectorAll(".app-view")
    .forEach((view) =>
      view.classList.toggle("active", view.dataset.view === viewName),
    );
  document
    .querySelectorAll("[data-view-target]")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.viewTarget === viewName),
    );

  const titles = {
    dashboard: "Tổng quan hôm nay",
    customers: "Danh sách khách hàng",
    calendar: "Lịch & trạng thái thu nợ",
    notifications: "Thông báo & báo cáo",
    settings: "Thiết lập nhắc tự động",
  };
  document.getElementById("desktop-page-title").textContent = titles[viewName];
  document.getElementById("mobile-page-title").textContent = titles[
    viewName
  ].replace(" hôm nay", "");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewName === "notifications") renderNotifications();
  if (viewName === "customers") renderCustomers();
  if (viewName === "calendar") renderCalendarPage();
}

function buildCalendar(date, full = false) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayIndex);
  const today = new Date();
  let html = WEEKDAYS.map(
    (day) => `<div class="calendar-weekday">${day}</div>`,
  ).join("");

  const cellCount = full ? 42 : 35;
  for (let i = 0; i < cellCount; i += 1) {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + i);
    const isOther = cellDate.getMonth() !== month;
    const isToday = cellDate.toDateString() === today.toDateString();
    const isReminder = cellDate.getDate() === 10 && !isOther;
    const classes = [
      "calendar-day",
      isOther ? "other-month" : "",
      isToday ? "today" : "",
      isReminder ? "reminder-day" : "",
    ]
      .filter(Boolean)
      .join(" ");
    html += `<div class="${classes}" title="${isReminder ? "Ngày nhắc nợ cố định" : dateText(cellDate)}">${cellDate.getDate()}</div>`;
  }
  return html;
}

function renderDateInformation() {
  const today = new Date();
  const next = getNextReminderDate(today);
  const diff = Math.max(0, Math.ceil((next - today) / 86400000));
  document.getElementById("today-chip").textContent = fullDateText(today);
  document.getElementById("mobile-date").textContent = fullDateText(today);
  document.getElementById("sidebar-next-date").textContent = dateText(next);
  document.getElementById("hero-next-day").textContent = next.getDate();
  document.getElementById("hero-next-month").textContent =
    `${MONTHS[next.getMonth()]} / ${next.getFullYear()}`;
  document.getElementById("hero-countdown").textContent =
    diff === 0 ? "Nhắc trong hôm nay" : `Còn ${diff} ngày`;
  document.getElementById("preview-due-date").textContent = dateText(
    dueDateFor(next),
  );
  document.getElementById("report-month").textContent =
    `${MONTHS[today.getMonth()]} / ${today.getFullYear()}`;
}

function renderDashboard() {
  const totals = getTotals();
  const stats = [
    {
      label: "Tổng công nợ",
      value: formatShortMoney(totals.total),
      note: `${customers.length} khách hàng`,
      icon: "wallet",
      tone: "blue",
    },
    {
      label: "Cần thu kỳ này",
      value: totals.due,
      note: "Khách đang chờ xử lý",
      icon: "users",
      tone: "orange",
    },
    {
      label: "Đã nhắc",
      value: totals.reminded,
      note: "Đã tạo thông báo",
      icon: "send",
      tone: "blue",
    },
    {
      label: "Đã thanh toán",
      value: totals.paidCount,
      note: formatShortMoney(totals.paid),
      icon: "check",
      tone: "green",
    },
  ];

  document.getElementById("dashboard-stats").innerHTML = stats
    .map(
      (stat) => `
    <article class="stat-card ${stat.tone}">
      <div class="stat-icon">${icon(stat.icon)}</div>
      <div class="stat-copy"><span>${stat.label}</span><strong>${stat.value}</strong><small>${stat.note}</small></div>
    </article>
  `,
    )
    .join("");

  const today = new Date();
  document.getElementById("mini-calendar-title").textContent =
    `${MONTHS[today.getMonth()]} / ${today.getFullYear()}`;
  document.getElementById("mini-calendar").innerHTML = buildCalendar(today);

  const priority = customers
    .filter((customer) => customer.status !== "paid")
    .sort((a, b) => {
      const order = {
        overdue: 0,
        due: 1,
        unreminded: 2,
        reminded: 3,
        paused: 4,
      };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    })
    .slice(0, 5);

  document.getElementById("dashboard-customer-list").innerHTML = priority.length
    ? priority
        .map(
          (customer) => `
    <div class="compact-customer" data-customer-id="${customer.id}" role="button" tabindex="0">
      ${customerAvatar(customer)}
      <div class="compact-customer-info"><strong>${customer.name}</strong><span>${customer.phone}</span></div>
      ${statusBadge(customer.status)}
      <strong class="compact-amount">${formatShortMoney(customer.principal + customer.interest - customer.paid)}</strong>
    </div>
  `,
        )
        .join("")
    : emptyState(
        "Không có khách cần xử lý",
        "Các khoản nợ trong kỳ đã hoàn tất.",
      );
}

function renderCustomers() {
  const query = document
    .getElementById("customer-search")
    .value.trim()
    .toLocaleLowerCase("vi");
  const filtered = customers
    .filter((customer) => {
      const matchesQuery = [customer.name, customer.phone, customer.note]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(query);
      const matchesFilter =
        activeCustomerFilter === "all" ||
        customer.status === activeCustomerFilter;
      return matchesQuery && matchesFilter;
    })
    .sort((a, b) => {
      const order = {
        overdue: 0,
        due: 1,
        unreminded: 2,
        reminded: 3,
        paused: 4,
        paid: 5,
      };
      return (order[a.status] ?? 6) - (order[b.status] ?? 6);
    });

  document.getElementById("customer-result-count").textContent =
    `${filtered.length} khách hàng`;
  document.getElementById("customer-grid").innerHTML = filtered.length
    ? filtered
        .map(
          (customer) => `
    <article class="customer-card" data-customer-id="${customer.id}" style="--avatar-color:${customer.color}" tabindex="0">
      ${customerAvatar(customer)}
      <div class="customer-card-main">
        <h3 class="customer-card-name">${customer.name}</h3>
        <span class="customer-phone">${customer.phone}</span>
        <div class="loan-meta">
          <div><span>Số tiền vay</span><strong>${formatMoney(customer.principal)}</strong></div>
          <div><span>Lãi tháng</span><strong>${formatMoney(customer.interest)}</strong></div>
          <div><span>Ngày đến hạn</span><strong>Ngày 10 hằng tháng</strong></div>
          <div><span>Còn phải thu</span><strong>${formatMoney(customer.principal + customer.interest - customer.paid)}</strong></div>
        </div>
      </div>
      <div class="customer-card-actions">
        ${statusSelect(customer)}
        <a class="icon-button call-button" href="tel:${customer.phone.replace(/\s/g, "")}" aria-label="Gọi ${customer.name}" onclick="event.stopPropagation()">${icon("phone")}</a>
      </div>
    </article>
  `,
        )
        .join("")
    : emptyState(
        "Không tìm thấy khách hàng",
        "Thử thay đổi từ khóa hoặc bộ lọc.",
      );
}

function emptyState(title, message) {
  return `<div class="empty-state">${icon("search")}<strong>${title}</strong><p>${message}</p></div>`;
}

function renderCalendarPage() {
  const totals = getTotals();
  document.getElementById("full-calendar-title").textContent =
    `${MONTHS[calendarCursor.getMonth()]} / ${calendarCursor.getFullYear()}`;
  document.getElementById("full-calendar").innerHTML = buildCalendar(
    calendarCursor,
    true,
  );
  document.getElementById("calendar-stats").innerHTML = [
    ["Đến hạn kỳ này", totals.due, "orange"],
    ["Quá hạn", totals.overdue, "red"],
    ["Đã nhắc", totals.reminded, "blue"],
    ["Đã thanh toán", totals.paidCount, "green"],
  ]
    .map(
      ([label, value, tone]) =>
        `<div class="calendar-mini-stat ${tone}"><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join("");

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const schedule = [
    {
      day: 7,
      title: "Nhắc trước hạn",
      info: "Chuẩn bị trước 3 ngày",
      count: totals.due,
    },
    {
      day: 10,
      title: "Nhắc đến hạn",
      info: "Ngày gửi chính thức",
      count: totals.due,
    },
    {
      day: 13,
      title: "Nhắc lại lần 1",
      info: "Nếu chưa thanh toán",
      count: totals.overdue,
    },
  ];
  document.getElementById("reminder-schedule").innerHTML = schedule
    .map((item) => {
      const date = new Date(year, month, item.day);
      return `<div class="schedule-item">
      <div class="schedule-date"><strong>${item.day}</strong><span>${MONTHS[month].replace("Tháng ", "T")}</span></div>
      <div class="schedule-info"><strong>${item.title}</strong><span>${new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(date)} · ${item.info}</span></div>
      <span class="schedule-count">${item.count} KH</span>
    </div>`;
    })
    .join("");
}

function notificationVisual(type) {
  const map = {
    unreminded: { icon: "clock", tone: "gray" },
    due: { icon: "calendar", tone: "orange" },
    overdue: { icon: "bell", tone: "red" },
    reminded: { icon: "send", tone: "blue" },
    paid: { icon: "check", tone: "green" },
    paused: { icon: "clock", tone: "gray" },
  };
  return map[type] || map.reminded;
}

function renderNotifications() {
  const unread = notifications.filter((item) => !item.read).length;
  const list = document.getElementById("notification-list");
  list.innerHTML = notifications.length
    ? notifications
        .map((item) => {
          const visual = notificationVisual(item.type);
          return `<div class="notification-item ${item.read ? "" : "unread"}">
      <div class="notification-icon ${visual.tone}">${icon(visual.icon)}</div>
      <div class="notification-copy"><strong>${item.title}</strong><span>${item.message}</span></div>
      <time>${item.time}</time>
    </div>`;
        })
        .join("")
    : emptyState(
        "Chưa có thông báo",
        "Hoạt động nhắc nợ sẽ xuất hiện tại đây.",
      );

  document.getElementById("unread-label").textContent = `${unread} chưa đọc`;
  updateNotificationBadges();
  renderReport();
}

function updateNotificationBadges() {
  const unread = notifications.filter((item) => !item.read).length;
  [
    "top-notification-count",
    "mobile-notification-count",
    "sidebar-notification-count",
  ].forEach((id) => {
    const badge = document.getElementById(id);
    badge.textContent = unread;
    badge.classList.toggle("visible", unread > 0);
  });
  document
    .getElementById("bottom-notification-dot")
    .classList.toggle("visible", unread > 0);
}

function renderReport() {
  const totals = getTotals();
  const rate = totals.total
    ? Math.round((totals.paid / totals.total) * 100)
    : 0;
  document
    .getElementById("recovery-ring")
    .style.setProperty("--rate", `${rate}%`);
  document.getElementById("recovery-rate").textContent = `${rate}%`;
  document.getElementById("report-total").textContent = formatMoney(
    totals.total,
  );
  document.getElementById("report-paid").textContent = formatMoney(totals.paid);
  document.getElementById("report-remaining").textContent = formatMoney(
    totals.remaining,
  );

  const now = new Date();
  const revenue = [
    42,
    58,
    51,
    73,
    68,
    Math.max(8, Math.round(totals.paid / 1_000_000)),
  ];
  const max = Math.max(...revenue, 1);
  document.getElementById("revenue-chart").innerHTML = revenue
    .map((value, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return `<div class="chart-column"><strong>${value}</strong><div class="chart-bar" style="height:${Math.max(10, (value / max) * 145)}px"></div><span>T${String(month.getMonth() + 1).padStart(2, "0")}</span></div>`;
    })
    .join("");
}

function renderSettings() {
  document.getElementById("setting-early").checked = settings.early;
  document.getElementById("setting-repeat").checked = settings.repeat;
  document.getElementById("setting-browser").checked = settings.browser;
  document.getElementById("setting-zalo").checked = settings.zalo;
  document.getElementById("setting-call").checked = settings.call;
}

function openCustomerDetail(customerId) {
  const customer = customers.find((item) => item.id === Number(customerId));
  if (!customer) return;
  const remaining = Math.max(
    0,
    customer.principal + customer.interest - customer.paid,
  );
  const due = dueDateFor(new Date());
  document.getElementById("customer-detail-content").innerHTML = `
    <div class="detail-hero">
      <div class="detail-person">
        ${customerAvatar(customer)}
        <div><h2 id="detail-customer-name">${customer.name}</h2><p>${customer.phone}</p></div>
        ${statusSelect(customer, "detail")}
      </div>
    </div>
    <div class="detail-body">
      <section class="detail-card">
        <h3>Thông tin công nợ</h3>
        <div class="debt-row"><span>Số tiền vay ban đầu</span><strong>${formatMoney(customer.principal)}</strong></div>
        <div class="debt-row"><span>Lãi hằng tháng</span><strong>${formatMoney(customer.interest)}</strong></div>
        <div class="debt-row"><span>Ngày đến hạn</span><strong>${dateText(due)} · Lặp hằng tháng</strong></div>
        <div class="debt-row"><span>Số tiền còn lại</span><strong class="${remaining ? "red" : "green"}">${formatMoney(remaining)}</strong></div>
        <div class="debt-row"><span>Ghi chú</span><strong>${customer.note || "Không có ghi chú"}</strong></div>
      </section>
      <section class="detail-card">
        <h3>Lịch sử nhắc nhở & thanh toán</h3>
        <div class="timeline">
          <div class="timeline-item" style="--timeline-color:${customer.status === "paid" ? "#16a34a" : "#ef3038"}"><time>${dateText(due)} 08:30</time><strong>${customer.status === "paid" ? "Đã hoàn tất thanh toán" : "Đến hạn thanh toán kỳ này"}</strong></div>
          <div class="timeline-item" style="--timeline-color:#0969da"><time>${dateText(new Date(due.getFullYear(), due.getMonth(), 7))} 09:15</time><strong>Đã tạo thông báo nhắc trước hạn</strong></div>
          <div class="timeline-item" style="--timeline-color:#16a34a"><time>Kỳ thanh toán gần nhất</time><strong>${customer.paid ? `Đã thanh toán ${formatMoney(customer.paid)}` : "Chưa ghi nhận thanh toán"}</strong></div>
        </div>
      </section>
      <div class="detail-actions">
        <a class="detail-action green" href="tel:${customer.phone.replace(/\s/g, "")}">${icon("phone")} Gọi ngay</a>
        <button class="detail-action" data-detail-action="remind" data-id="${customer.id}">${icon("send")} Gửi nhắc</button>
        <button class="detail-action green" data-detail-action="paid" data-id="${customer.id}">${icon("check")} Đánh dấu đã trả</button>
      </div>
    </div>`;
  document.getElementById("customer-modal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  document.getElementById(id).hidden = true;
  document.body.style.overflow = "";
}

function sendReminder(customerId = null, automatic = false) {
  const targets = customerId
    ? customers.filter((customer) => customer.id === Number(customerId))
    : customers.filter(
        (customer) => !["paid", "paused"].includes(customer.status),
      );

  if (!targets.length) {
    showToast(
      "Không có khách cần nhắc",
      "Tất cả khách hàng đã thanh toán hoặc đang tạm hoãn.",
      "info",
    );
    return;
  }

  targets.forEach((customer) => {
    if (customer.status !== "overdue") customer.status = "reminded";
  });

  const now = new Date();
  notifications.unshift({
    id: Date.now(),
    type: "reminded",
    title: automatic ? "Nhắc nợ tự động ngày 10" : "Đã tạo nhắc nợ",
    message: customerId
      ? `Đã tạo thông báo cho ${targets[0].name}.`
      : `Đã tạo thông báo cho ${targets.length} khách hàng cần thanh toán.`,
    time: now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    read: false,
  });

  saveData(STORAGE_KEYS.customers, customers);
  saveData(STORAGE_KEYS.notifications, notifications);
  renderAll();
  showToast(
    "Tạo nhắc nợ thành công",
    `Đã cập nhật ${targets.length} khách hàng.`,
    "success",
  );

  if (
    settings.browser &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification("M10 · Nhắc thu nợ", {
      body: customerId
        ? `Đến lịch nhắc ${targets[0].name}.`
        : `${targets.length} khách hàng cần được nhắc thanh toán.`,
      icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 rx=%2216%22 fill=%22%230969da%22/><text x=%2232%22 y=%2241%22 text-anchor=%22middle%22 font-size=%2228%22 font-family=%22Arial%22 font-weight=%22700%22 fill=%22white%22>10</text></svg>",
    });
  }
}

function markCustomerPaid(customerId) {
  updateCustomerStatus(customerId, "paid");
  closeModal("customer-modal");
}

function updateCustomerStatus(customerId, newStatus, keepDetailOpen = false) {
  const customer = customers.find((item) => item.id === Number(customerId));
  if (!customer || !STATUS[newStatus] || customer.status === newStatus) return;

  const oldStatus = customer.status;
  const totalCustomerDebt = customer.principal + customer.interest;
  customer.status = newStatus;

  if (newStatus === "paid") {
    customer.paid = totalCustomerDebt;
  } else if (oldStatus === "paid" && customer.paid >= totalCustomerDebt) {
    customer.paid = 0;
  }

  const status = STATUS[newStatus];
  notifications.unshift({
    id: Date.now(),
    type: newStatus,
    title:
      newStatus === "paid" ? "Thanh toán thành công" : "Đã cập nhật trạng thái",
    message: `${customer.name} được chuyển sang “${status.label}”.`,
    time: new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    read: false,
  });

  saveData(STORAGE_KEYS.customers, customers);
  saveData(STORAGE_KEYS.notifications, notifications);
  renderAll();
  if (keepDetailOpen && !document.getElementById("customer-modal").hidden) {
    openCustomerDetail(customer.id);
  }
  showToast(
    "Đã cập nhật trạng thái",
    `${customer.name}: ${STATUS[oldStatus]?.label || "Chưa xác định"} → ${status.label}.`,
    newStatus === "paid" ? "success" : "info",
  );
}

function showToast(title, message, tone = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.innerHTML = `${icon(tone === "success" ? "check" : "bell")}<div><strong>${title}</strong><span>${message}</span></div>`;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

function checkAutomaticReminder() {
  const now = new Date();
  if (now.getDate() !== 10) return;
  const reminderKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;
  if (localStorage.getItem(STORAGE_KEYS.lastReminder) === reminderKey) return;
  localStorage.setItem(STORAGE_KEYS.lastReminder, reminderKey);
  sendReminder(null, true);
}

async function requestBrowserNotification() {
  if (!("Notification" in window)) {
    showToast(
      "Thiết bị chưa hỗ trợ",
      "Trình duyệt này không cung cấp Notification API.",
      "info",
    );
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    settings.browser = true;
    document.getElementById("setting-browser").checked = true;
    saveData(STORAGE_KEYS.settings, settings);
    showToast(
      "Đã bật thông báo",
      "M10 có thể hiển thị nhắc nợ khi trang đang mở.",
      "success",
    );
  } else {
    showToast(
      "Chưa được cho phép",
      "Bạn có thể bật lại trong cài đặt của trình duyệt.",
      "info",
    );
  }
}

function saveSettings() {
  settings = {
    early: document.getElementById("setting-early").checked,
    repeat: document.getElementById("setting-repeat").checked,
    browser: document.getElementById("setting-browser").checked,
    zalo: document.getElementById("setting-zalo").checked,
    call: document.getElementById("setting-call").checked,
  };
  saveData(STORAGE_KEYS.settings, settings);
  showToast(
    "Đã lưu thiết lập",
    "Lịch nhắc cố định ngày 10 hằng tháng đã được cập nhật.",
    "success",
  );
}

function addCustomer(form) {
  const data = new FormData(form);
  const colors = ["#5b8def", "#d77b43", "#38a77c", "#a86ed0", "#4aa6bd"];
  const customer = {
    id: Date.now(),
    name: String(data.get("name")).trim(),
    phone: String(data.get("phone")).trim(),
    principal: Number(data.get("principal")),
    interest: Number(data.get("interest")),
    paid: 0,
    status: "unreminded",
    note: String(data.get("note")).trim(),
    color: colors[customers.length % colors.length],
  };
  customers.push(customer);
  saveData(STORAGE_KEYS.customers, customers);
  form.reset();
  closeModal("add-customer-modal");
  renderAll();
  setActiveView("customers");
  showToast(
    "Đã thêm khách hàng",
    `${customer.name} được đặt hạn vào ngày 10 hằng tháng.`,
    "success",
  );
}

function renderAll() {
  renderDateInformation();
  renderDashboard();
  renderCustomers();
  renderCalendarPage();
  renderNotifications();
  renderSettings();
}

document.addEventListener("click", (event) => {
  const navigation = event.target.closest("[data-view-target]");
  if (navigation) {
    event.preventDefault();
    setActiveView(navigation.dataset.viewTarget);
  }

  const customerElement = event.target.closest("[data-customer-id]");
  if (
    customerElement &&
    !event.target.closest("a, button, select, input, textarea, label")
  ) {
    openCustomerDetail(customerElement.dataset.customerId);
  }
});

document.addEventListener("change", (event) => {
  const select = event.target.closest(".customer-status-select");
  if (!select) return;
  updateCustomerStatus(
    select.dataset.statusCustomerId,
    select.value,
    select.dataset.statusContext === "detail",
  );
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal("customer-modal");
    closeModal("add-customer-modal");
  }
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches("[data-customer-id]")
  ) {
    event.preventDefault();
    openCustomerDetail(event.target.dataset.customerId);
  }
});

document
  .getElementById("customer-search")
  .addEventListener("input", renderCustomers);
document
  .getElementById("customer-filters")
  .addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeCustomerFilter = button.dataset.filter;
    document
      .querySelectorAll(".filter-pill")
      .forEach((item) => item.classList.toggle("active", item === button));
    renderCustomers();
  });

document.getElementById("calendar-prev").addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() - 1);
  renderCalendarPage();
});
document.getElementById("calendar-next").addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() + 1);
  renderCalendarPage();
});
document.getElementById("calendar-today").addEventListener("click", () => {
  calendarCursor = new Date();
  calendarCursor.setDate(1);
  renderCalendarPage();
});

document
  .getElementById("hero-send-reminder")
  .addEventListener("click", () => sendReminder());
document
  .getElementById("save-settings")
  .addEventListener("click", saveSettings);
document
  .getElementById("enable-browser-notifications")
  .addEventListener("click", requestBrowserNotification);
document.getElementById("mark-all-read").addEventListener("click", () => {
  notifications.forEach((item) => {
    item.read = true;
  });
  saveData(STORAGE_KEYS.notifications, notifications);
  renderNotifications();
  showToast("Đã đọc tất cả", "Không còn thông báo chưa đọc.", "success");
});

document
  .getElementById("close-customer-modal")
  .addEventListener("click", () => closeModal("customer-modal"));
document.getElementById("customer-modal").addEventListener("click", (event) => {
  if (event.target.id === "customer-modal") closeModal("customer-modal");
});
document
  .getElementById("customer-detail-content")
  .addEventListener("click", (event) => {
    const button = event.target.closest("[data-detail-action]");
    if (!button) return;
    if (button.dataset.detailAction === "remind") {
      sendReminder(button.dataset.id);
      closeModal("customer-modal");
    }
    if (button.dataset.detailAction === "paid")
      markCustomerPaid(button.dataset.id);
  });

document.getElementById("add-customer-button").addEventListener("click", () => {
  document.getElementById("add-customer-modal").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(
    () => document.querySelector('#customer-form input[name="name"]').focus(),
    50,
  );
});
["close-add-modal", "cancel-add-customer"].forEach((id) =>
  document
    .getElementById(id)
    .addEventListener("click", () => closeModal("add-customer-modal")),
);
document
  .getElementById("add-customer-modal")
  .addEventListener("click", (event) => {
    if (event.target.id === "add-customer-modal")
      closeModal("add-customer-modal");
  });
document.getElementById("customer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  addCustomer(event.currentTarget);
});

renderAll();
checkAutomaticReminder();
setInterval(checkAutomaticReminder, 60_000);

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Ứng dụng vẫn hoạt động bình thường nếu trình duyệt không cho phép lưu ngoại tuyến.
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION SCHEDULER — Thêm vào ngày cuối app.js
// ═══════════════════════════════════════════════════════════════════════════════

const NOTIF_STORAGE_KEY = "m10_push_schedule_v1";

// ── Khởi tạo UI chọn ngày ──────────────────────────────────────────────────
function initNotificationScheduler() {
  renderDayPicker();
  renderHourSelect();
  loadScheduleState();
  updatePermissionStatus();

  document
    .getElementById("btn-request-permission")
    .addEventListener("click", requestPushPermission);
  document
    .getElementById("btn-test-notification")
    .addEventListener("click", sendTestNotification);
  document
    .getElementById("btn-cancel-schedule")
    .addEventListener("click", cancelSchedule);
}

function renderDayPicker() {
  const saved = loadScheduleConfig();
  const selectedDays = saved ? saved.days : [7, 8, 9, 10];
  const picker = document.getElementById("day-picker");
  if (!picker) return;
  picker.innerHTML = "";
  for (let d = 1; d <= 31; d++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-btn" + (selectedDays.includes(d) ? " selected" : "");
    btn.textContent = d;
    btn.setAttribute("aria-label", `Ngày ${d}`);
    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
    });
    picker.appendChild(btn);
  }
}

function renderHourSelect() {
  const saved = loadScheduleConfig();
  const savedHour = saved ? saved.hour : 8;
  const sel = document.getElementById("notif-hour");
  if (!sel) return;
  for (let h = 0; h <= 23; h++) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = String(h).padStart(2, "0");
    if (h === savedHour) opt.selected = true;
    sel.appendChild(opt);
  }
  const minuteSel = document.getElementById("notif-minute");
  if (minuteSel && saved) {
    minuteSel.value = saved.minute === 30 ? "30" : "0";
  }
}

function getSelectedDays() {
  return Array.from(document.querySelectorAll(".day-btn.selected")).map((btn) =>
    parseInt(btn.textContent, 10),
  );
}

// ── Xin quyền notification ─────────────────────────────────────────────────
async function requestPushPermission() {
  if (!("Notification" in window)) {
    showToast(
      "Không hỗ trợ",
      "Thiết bị này không hỗ trợ Web Notification.",
      "info",
    );
    return;
  }
  const result = await Notification.requestPermission();
  updatePermissionStatus();
  if (result === "granted") {
    showToast(
      "Đã cấp quyền",
      "Bạn có thể chọn ngày và lên lịch thông báo.",
      "success",
    );
  } else {
    showToast(
      "Chưa cấp quyền",
      "Vào Cài đặt → Safari → Thông báo để bật lại.",
      "info",
    );
  }
}

function updatePermissionStatus() {
  const el = document.getElementById("notif-permission-status");
  const btn = document.getElementById("btn-request-permission");
  if (!el || !("Notification" in window)) return;
  const p = Notification.permission;
  if (p === "granted") {
    el.textContent = "✅ Đã cấp quyền";
    btn.textContent = "Đã cấp";
    btn.disabled = true;
  } else if (p === "denied") {
    el.textContent = "❌ Bị từ chối — vào Cài đặt để bật lại";
    btn.textContent = "Cấp quyền";
  } else {
    el.textContent = "⏳ Chưa cấp quyền";
    btn.textContent = "Cấp quyền";
    btn.disabled = false;
  }
}

// ── Lên lịch thông báo ────────────────────────────────────────────────────
function saveAndSchedule() {
  const days = getSelectedDays();
  if (days.length === 0) {
    showToast(
      "Chưa chọn ngày",
      "Hãy chọn ít nhất 1 ngày để nhận thông báo.",
      "info",
    );
    return;
  }
  if (!("Notification" in window) || Notification.permission !== "granted") {
    showToast("Cần cấp quyền trước", "Hãy bấm Cấp quyền rồi thử lại.", "info");
    return;
  }

  const hour = parseInt(document.getElementById("notif-hour").value, 10);
  const minute = parseInt(document.getElementById("notif-minute").value, 10);
  const config = { days, hour, minute };

  // Lưu vào localStorage
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(config));

  // Gửi lệnh xuống Service Worker
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SCHEDULE_NOTIFICATIONS",
      days,
      hour,
      minute,
    });
  }

  updateScheduleStatusBox(config);
  showToast(
    "Đã lên lịch",
    `Thông báo sẽ gửi ngày ${days.join(", ")} lúc ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} hằng tháng.`,
    "success",
  );
}

function cancelSchedule() {
  localStorage.removeItem(NOTIF_STORAGE_KEY);
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CANCEL_NOTIFICATIONS",
    });
  }
  document.getElementById("schedule-status-box").hidden = true;
  // Reset day picker về mặc định
  document.querySelectorAll(".day-btn").forEach((btn) => {
    const d = parseInt(btn.textContent, 10);
    btn.classList.toggle("selected", [7, 8, 9, 10].includes(d));
  });
  showToast("Đã hủy lịch", "Không còn thông báo nào được lên lịch.", "info");
}

function sendTestNotification() {
  if (!("Notification" in window)) {
    showToast(
      "Không hỗ trợ",
      "Thiết bị không hỗ trợ Notification API.",
      "info",
    );
    return;
  }
  if (Notification.permission !== "granted") {
    showToast("Cần cấp quyền", "Hãy cấp quyền thông báo trước.", "info");
    return;
  }

  // Thử qua Service Worker trước (iOS PWA)
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "TEST_NOTIFICATION",
    });
    showToast("Đã gửi thử", "Thông báo sẽ xuất hiện ngay bây giờ.", "success");
    return;
  }

  // Fallback: Notification API trực tiếp
  new Notification("M10 Thu Nợ", {
    body: "Mở APP Ngay",
    icon: "./assets/icons/icon-192.png",
    tag: "m10-test",
  });
  showToast("Đã gửi thử", "Thông báo xuất hiện trên thiết bị.", "success");
}

function loadScheduleConfig() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadScheduleState() {
  const config = loadScheduleConfig();
  if (config) updateScheduleStatusBox(config);
}

function updateScheduleStatusBox(config) {
  const box = document.getElementById("schedule-status-box");
  const text = document.getElementById("schedule-status-text");
  if (!box || !text) return;
  const h = String(config.hour).padStart(2, "0");
  const m = String(config.minute).padStart(2, "0");
  text.textContent = `Ngày ${config.days.join(", ")} hằng tháng lúc ${h}:${m}`;
  box.hidden = false;
}

// ── iOS Banner Logic ────────────────────────────────────────────────────────
function initIosBanner() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = window.navigator.standalone === true;
  const wasDismissed = localStorage.getItem("m10_ios_banner_dismissed");

  if (isIos && !isInStandaloneMode && !wasDismissed) {
    const banner = document.getElementById("ios-install-banner");
    if (banner) banner.hidden = false;
  }

  const closeBtn = document.getElementById("ios-install-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("ios-install-banner").hidden = true;
      localStorage.setItem("m10_ios_banner_dismissed", "1");
    });
  }

  // Ẩn iOS guide card nếu đang chạy standalone (đã cài rồi)
  const guideCard = document.getElementById("ios-guide-card");
  if (guideCard && isInStandaloneMode) guideCard.hidden = true;
}

// ── Hook vào save-settings để lên lịch luôn ─────────────────────────────────
const _origSaveSettings = saveSettings;
// Override saveSettings để tích hợp luôn lên lịch thông báo
document
  .getElementById("save-settings")
  .removeEventListener("click", saveSettings);
document.getElementById("save-settings").addEventListener("click", () => {
  _origSaveSettings();
  saveAndSchedule();
});

// ── Khởi chạy ─────────────────────────────────────────────────────────────────
initNotificationScheduler();
initIosBanner();

// Khi SW đăng ký xong, re-gửi lịch nếu đã có config (SW vừa được cài mới)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    const config = loadScheduleConfig();
    if (config && reg.active) {
      reg.active.postMessage({
        type: "SCHEDULE_NOTIFICATIONS",
        days: config.days,
        hour: config.hour,
        minute: config.minute,
      });
    }
  });
}
