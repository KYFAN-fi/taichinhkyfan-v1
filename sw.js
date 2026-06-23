const CACHE_NAME = "m10-thu-no-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

// ─── Cài đặt & Cache ───────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type === "opaque"
          )
            return response;
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy));
          return response;
        }),
    ),
  );
});

// ─── Nhận message từ app.js để lưu lịch thông báo ────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_NOTIFICATIONS") {
    const { days, hour, minute } = event.data;
    scheduleMonthlyNotifications(days, hour, minute);
  }
  if (event.data && event.data.type === "CANCEL_NOTIFICATIONS") {
    cancelAllScheduled();
  }
  if (event.data && event.data.type === "TEST_NOTIFICATION") {
    self.registration.showNotification("M10 Thu Nợ · Thử nghiệm", {
      body: "Mở APP Ngay",
      icon: "./assets/icons/icon-192.png",
      badge: "./assets/icons/favicon-32.png",
      tag: "m10-test",
      requireInteraction: false,
      data: { url: "./" },
    });
  }
});

// ─── Lên lịch thông báo cho các ngày đã chọn trong tháng ─────────────────────
function scheduleMonthlyNotifications(days, hour = 8, minute = 0) {
  // Lưu cấu hình vào IndexedDB (dùng Cache API như key-value đơn giản)
  const config = JSON.stringify({
    days,
    hour,
    minute,
    scheduledAt: Date.now(),
  });
  caches.open("m10-schedule-config").then((cache) => {
    cache.put("./schedule", new Response(config));
  });

  // Tính thời gian tới gần nhất và đặt alarm
  const now = new Date();
  let nearest = null;
  let nearestMs = Infinity;

  for (const day of days) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      day,
      hour,
      minute,
      0,
      0,
    );
    // Nếu ngày này trong tháng hiện tại đã qua thì tính sang tháng sau
    if (candidate <= now) {
      candidate.setMonth(candidate.getMonth() + 1);
    }
    const ms = candidate - now;
    if (ms < nearestMs) {
      nearestMs = ms;
      nearest = candidate;
    }
  }

  if (nearest) {
    // Dùng setTimeout trong SW — hoạt động khi SW đang chạy
    // Trên iOS PWA, SW sống trong khi app đang mở (Add to Home Screen)
    setTimeout(() => fireScheduledNotification(days, hour, minute), nearestMs);
  }
}

function fireScheduledNotification(days, hour, minute) {
  const now = new Date();
  const dayNum = now.getDate();

  // Kiểm tra xem hôm nay có phải ngày được lên lịch không
  if (days.includes(dayNum)) {
    // Lấy key để tránh gửi 2 lần trong cùng 1 ngày
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${dayNum}`;
    caches.open("m10-sent-log").then((cache) => {
      cache.match(`./sent/${todayKey}`).then((existing) => {
        if (!existing) {
          self.registration.showNotification("M10 Thu Nợ", {
            body: "Mở APP Ngay",
            icon: "./assets/icons/icon-192.png",
            badge: "./assets/icons/favicon-32.png",
            tag: `m10-reminder-${todayKey}`,
            requireInteraction: true,
            silent: false,
            data: { url: "./" },
          });
          // Ghi lại đã gửi hôm nay
          cache.put(`./sent/${todayKey}`, new Response("sent"));
        }
      });
    });
  }

  // Lên lịch lần tiếp theo
  scheduleMonthlyNotifications(days, hour, minute);
}

function cancelAllScheduled() {
  caches.delete("m10-schedule-config");
  caches.delete("m10-sent-log");
}

// ─── Khi SW khởi động lại (thiết bị restart, SW reload) ─────────────────────
// Đọc cấu hình đã lưu và tự lên lịch lại
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const configCache = await caches.open("m10-schedule-config");
        const response = await configCache.match("./schedule");
        if (response) {
          const config = JSON.parse(await response.text());
          if (config && config.days && config.days.length > 0) {
            scheduleMonthlyNotifications(
              config.days,
              config.hour,
              config.minute,
            );
          }
        }
      } catch (e) {
        // Không có cấu hình — bình thường
      }
    })(),
  );
});

// ─── Xử lý khi người dùng bấm vào thông báo ─────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
