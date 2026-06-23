# M10 Thu Nợ

Giao diện quản lý công nợ viết hoàn toàn bằng HTML, CSS và JavaScript thuần.

## Chạy ứng dụng

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy một web server tĩnh:

```powershell
python -m http.server 8080
```

Sau đó truy cập `http://localhost:8080`.

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

> Với HTML/CSS/JS thuần, thông báo tự động chỉ có thể chạy khi trang đang mở. Muốn gửi thật khi trình duyệt đã đóng cần thêm máy chủ và dịch vụ push/SMS/Zalo.
