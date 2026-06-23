# M10 Thu Nợ

Giao diện quản lý công nợ viết hoàn toàn bằng HTML, CSS và JavaScript thuần.

## Chạy ứng dụng

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy một web server tĩnh:

```powershell
python -m http.server 8080
```

Sau đó truy cập `http://localhost:8080`.

## Thêm vào màn hình chính trên iPhone

Ứng dụng đã có biểu tượng iOS, manifest và chế độ mở độc lập như một app.

1. Đưa thư mục lên một địa chỉ web có HTTPS hoặc mở bằng máy chủ nội bộ.
2. Truy cập địa chỉ bằng Safari trên iPhone.
3. Nhấn nút **Chia sẻ**.
4. Chọn **Thêm vào Màn hình chính**.
5. Giữ tên **M10 Thu Nợ** và nhấn **Thêm**.

> Mở trực tiếp bằng đường dẫn `file://` sẽ không đăng ký được chế độ PWA hoặc lưu ngoại tuyến. Khi triển khai thật, nên sử dụng HTTPS.

## Chức năng

- Tổng quan công nợ và khách hàng cần xử lý.
- Danh sách, tìm kiếm, lọc và thêm khách hàng.
- Dropdown điều chỉnh trạng thái: Chưa nhắc, Đã nhắc, Sắp đến hạn, Quá hạn, Đã thanh toán và Tạm hoãn.
- Chi tiết công nợ, gọi điện, gửi nhắc và đánh dấu đã trả.
- Lịch thu nợ với ngày 10 được cố định mỗi tháng.
- Tự tạo nhắc nợ khi ứng dụng được mở vào ngày 10.
- Thông báo trình duyệt khi người dùng cấp quyền.
- Báo cáo tỷ lệ thu hồi và doanh thu.
- Lưu dữ liệu cục bộ bằng `localStorage`.
- Biểu tượng iOS/PWA và khả năng mở ở chế độ độc lập từ Màn hình chính.
- Lưu các tệp giao diện để có thể mở lại khi mất mạng sau lần truy cập đầu tiên.

> Với HTML/CSS/JS thuần, thông báo tự động chỉ có thể chạy khi trang đang mở. Muốn gửi thật khi trình duyệt đã đóng cần thêm máy chủ và dịch vụ push/SMS/Zalo.
