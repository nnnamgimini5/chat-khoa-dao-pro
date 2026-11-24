/* Cấu hình app Chat Khóa Đạo Pro.
   - FIREBASE: dán cấu hình web của project Firebase vào đây (Project settings > Your apps > Web app).
     Để null thì app chạy "chế độ thử trên máy" (dữ liệu chỉ nằm trên điện thoại này).
     Cũng có thể dán trong app: Cài đặt > Kết nối máy chủ, không cần build lại.
   - APP_URL: địa chỉ bản web (GitHub Pages). Dùng cho nút chia sẻ và kiểm tra cập nhật trong bản APK. */
window.DAO_CONFIG = {
  VERSION: '1.2.0',
  VERSION_CODE: 4,
  FIREBASE: {
    apiKey: 'AIzaSyCDn86Fmzvhf-OiXxMq43Lq2pPVhwXCavk',
    authDomain: 'striking-domain-477206-d5.firebaseapp.com',
    projectId: 'striking-domain-477206-d5',
    storageBucket: 'striking-domain-477206-d5.firebasestorage.app',
    messagingSenderId: '328904707427',
    appId: '1:328904707427:web:6364c116f962c55026d756'
  },
  APP_URL: ''
};
