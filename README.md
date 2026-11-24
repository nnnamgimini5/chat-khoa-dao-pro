# Chat Khóa Đạo Pro

App chat cho nhóm dự án xây dựng, **khóa riêng từng cuộc trò chuyện** (không khóa / PIN chung + vân tay / mật khẩu riêng).
Một mã nguồn web chạy 2 dạng: **PWA** (cài từ Chrome) và **APK Android**.

## Tính năng
| Nhóm | Có gì |
|---|---|
| Bảo mật | PIN chung, mật khẩu riêng từng chat, vân tay, tự khóa khi thoát/tắt màn hình, khóa tất cả 1 chạm, tạm khóa 30 giây khi sai 5 lần, che nội dung thông báo, chặn chụp màn hình (APK) |
| Nhắn tin | Thời gian thực, chat riêng, nhóm, đánh dấu dự án, số tin chưa đọc, gửi ảnh (tự nén) và file, xóa tin, sao chép, lưu file, tìm tin cũ, chạy khi mất mạng |
| Danh bạ | Thêm bằng email, mã QR của tôi, quét QR |
| Tiện ích | Chế độ tối, nhạc nền nhẹ (tắt mặc định), cài lên màn hình, kiểm tra cập nhật, chia sẻ app, hướng dẫn sử dụng |
| Trạng thái | Đang tải (skeleton), trống, lỗi có nút thử lại, toast thành công |

## Cấu trúc
```
www/            App web (index.html, app.js, store.js, security.js, styles.css, sw.js…)
android/        Vỏ Android (WebView + vân tay, thông báo, lưu file, chia sẻ)
firestore.rules Luật bảo mật Firestore
.github/workflows/build.yml  Tự build APK + đăng bản web lên GitHub Pages
```

## Lấy file cài APK
Mỗi lần đẩy code lên nhánh `main`, GitHub Actions tự build:
- Tab **Releases** → tải `ChatKhoa.apk` → mở trên điện thoại → cho phép "Cài app không rõ nguồn".
- Hoặc tab **Actions** → lần chạy mới nhất → mục Artifacts.

Lần đầu cần thêm 4 secret khóa ký (xem file hướng dẫn đi kèm khóa ký), nếu không APK sẽ ký bằng khóa tạm và bản sau không cài đè được.

## Bản web / PWA
Bật **Settings → Pages → Source: GitHub Actions**. Địa chỉ: `https://<tên-github>.github.io/<tên-repo>/`
(GitHub Pages với repo riêng tư cần gói GitHub Pro.)

## Kết nối máy chủ
Xem `HUONG-DAN-FIREBASE.md`.

## Phát hành bản mới
Sửa `version` và `versionCode` trong `www/version.json`, `VERSION`/`VERSION_CODE` trong `www/config.js`, `VERSION` trong `www/sw.js`, rồi đẩy lên `main`.

## Giới hạn cần biết
- Khóa trong app chặn người cầm máy; tin nhắn **không mã hóa đầu cuối** (máy chủ Firebase đọc được).
- Mọi tài khoản đã đăng nhập đều tìm được người khác qua email (để kết bạn).
- Chưa có: gọi thoại/video, thông báo khi app đã đóng hẳn.
