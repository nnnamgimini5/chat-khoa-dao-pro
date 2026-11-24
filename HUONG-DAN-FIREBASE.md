# Kết nối máy chủ Firebase (miễn phí, khoảng 10 phút)

Chưa kết nối thì app chạy **chế độ thử trên máy**: có dữ liệu mẫu, khóa chat vẫn dùng được, nhưng không nhắn được cho người khác.

## 1. Tạo dự án
1. Vào https://console.firebase.google.com, đăng nhập Gmail.
2. **Add project** → đặt tên `chat-khoa-dao-pro` → tắt Google Analytics → **Create**.

## 2. Bật đăng nhập bằng email
1. Menu trái **Build → Authentication → Get started**.
2. Tab **Sign-in method** → **Email/Password** → bật dòng đầu → **Save**.

## 3. Bật cơ sở dữ liệu
1. **Build → Firestore Database → Create database**.
2. Vị trí: `asia-southeast1 (Singapore)` → chọn **Start in production mode** → **Create**.
3. Tab **Rules**: xóa hết, dán toàn bộ nội dung file `firestore.rules` trong repo → **Publish**.

## 4. Lấy cấu hình web
1. Bánh răng cạnh **Project Overview → Project settings**.
2. Kéo xuống **Your apps** → bấm biểu tượng **</>** (Web) → đặt tên `chatkhoa-web` → **Register app**.
3. Copy khối `const firebaseConfig = { ... };`

## 5. Dán vào app
Có 2 cách, chọn 1:
- **Trong app (không cần build lại):** Cài đặt → Máy chủ → dán khối vừa copy → **Lưu và khởi động lại**. Mỗi máy dán 1 lần.
- **Cho mọi người dùng chung:** mở `www/config.js`, thay `FIREBASE: null` bằng nội dung trong ngoặc `{ ... }`, đẩy lên GitHub. Bản APK và bản web mới sẽ tự có cấu hình.

> Cấu hình web Firebase không phải mật khẩu, đưa vào app là bình thường. Dữ liệu được bảo vệ bởi luật trong `firestore.rules`.

## 6. Thử
- Máy 1: Đăng ký bằng email A. Máy 2: Đăng ký bằng email B.
- Máy 1: Danh bạ → Thêm email → nhập email B → Nhắn tin.

## Giới hạn gói miễn phí (Spark)
- 50.000 lượt đọc, 20.000 lượt ghi mỗi ngày; 1 GB dữ liệu. Nhóm vài chục người dùng thoải mái.
- Ảnh và file lưu thẳng trong tin nhắn, tối đa khoảng 680 KB mỗi file (ảnh tự nén). Cần gửi file lớn thì phải nâng gói Blaze để dùng Cloud Storage.
- Thông báo khi app đã đóng hẳn cần Cloud Functions + FCM (gói Blaze), chưa có trong bản này.
