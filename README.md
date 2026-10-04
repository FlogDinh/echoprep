# EchoPrep

Trang luyện IELTS Listening bằng tiếng Việt. Listening - Vol 9 có Test 1 và Test 2, mỗi test 40 câu / 4 sections; đề và đáp án được nhập từ file DOCX của người dùng.

## Đăng nhập và lịch sử theo tài khoản (bản máy chủ local)

Yêu cầu Node.js 24 trở lên. Chạy:

```sh
node server/server.mjs
```

Mở http://127.0.0.1:8080. Dùng tài khoản đã cấu hình riêng trên máy. Mật khẩu chỉ được lưu dưới dạng scrypt hash có salt trong `.private/accounts.json`, không có trong mã nguồn hoặc frontend. Máy chủ kiểm tra cookie phiên HttpOnly / SameSite; đăng xuất thu hồi phiên. Lịch sử lưu trong `.private/history.sqlite` và truy vấn theo tài khoản từ phiên, không lấy tên tài khoản trong request. Không có đăng ký công khai. `.private` bị loại khỏi Git.

Kiểm tra:

```sh
node server/check.mjs
node server/browser-check.mjs
```

Các kiểm tra dùng tài khoản thử nghiệm và dữ liệu trong thư mục tạm; không thay đổi tài khoản/lịch sử thật. Kiểm tra trình duyệt yêu cầu Chrome trên macOS. Bản GitHub Pages vẫn là bản tĩnh, không có đăng nhập máy chủ. Lịch sử cũ trên GitHub Pages thuộc trình duyệt của trang đó và chưa được chuyển vào cơ sở dữ liệu local.

## Bản tĩnh chạy trên máy

Mở Terminal trong thư mục này và chạy:

```sh
python3 -m http.server 8080 --directory dist
```

Mở http://localhost:8080. Có thể mở `dist/index.html` trực tiếp để sử dụng offline.

Chọn Test 1 hoặc Test 2 trong thư viện. Chọn cùng lúc bốn file `T1-S1.mp3` đến `T1-S4.mp3` hoặc `T2-S1.mp3` đến `T2-S4.mp3` tương ứng từ thư mục nguồn. Audio phát trực tiếp trên thiết bị, không được gửi lên server. Nếu tên khác, chọn từng file trong section tương ứng. Mỗi section nhớ vị trí audio khi chuyển tab trong phiên hiện tại.

- Câu 1–17: điền từ, tối đa ba từ và/hoặc một số.
- Câu 18–20: kéo thả nhãn A–G lên ảnh gốc; cũng có thể chạm/chọn bằng bàn phím.
- Câu 21–24: chọn một đáp án A–C.
- Câu 25–30: ba nhóm chọn hai đáp án A–E; chấm không phụ thuộc thứ tự, không tính hai lần đáp án trùng.
- Câu 31–40: điền một từ.

Nộp bài để xem số câu đúng/sai/bỏ qua, thời gian và đối chiếu từng đáp án. Sau khi nộp, màn hình chia hai cột: transcript gốc bên trái, câu hỏi kèm đáp án bên phải. Chọn câu hoặc Xem giải thích để mở bottom sheet dưới câu hỏi và tự cuộn/đánh dấu đoạn transcript chứa đáp án. Hai cột cuộn độc lập, thanh nghe và các nhóm số câu luôn hiện. Điện thoại xếp transcript trên câu hỏi. Bảng kết quả vẫn mở được bằng nút riêng. File gốc có giải thích chi tiết câu 1–20; câu 21–40 hiện đáp án và transcript gốc với ghi chú rõ chưa có lời giải riêng. Chuyển section và chọn câu dùng chung dãy số câu ở cuối trang. Giữ nguyên nội dung, chữ đậm/nghiêng và ảnh sơ đồ; khoảng cách và cỡ chữ được điều chỉnh cho trình duyệt và màn hình nhỏ. Không mô phỏng chính xác phân trang của Word. Lượt đang làm chưa nộp chỉ ở bộ nhớ. Mỗi lần nộp lưu một record riêng trong localStorage của trình duyệt: thời gian nộp, thời lượng, đáp án và kết quả chấm tại thời điểm nộp. Có thể xem lại hoặc làm lại mà vẫn giữ lượt cũ. Lịch sử không đồng bộ giữa thiết bị/trình duyệt; xoá dữ liệu trang sẽ xoá lịch sử. Đáp án có trong mã nguồn của ứng dụng tự luyện; đây không phải hệ thống thi có bảo mật đáp án.

## Kiểm tra

```sh
node scripts/check.cjs
node scripts/check-test2.cjs
```

## GitHub Pages

Trang được triển khai từ nhánh `gh-pages`; mã nguồn nằm trên nhánh `main`.

Sau khi cập nhật, chạy:

```sh
node scripts/check.cjs
git push origin main
git subtree split --prefix dist -b pages-update
git push origin pages-update:gh-pages
```

Trong Settings → Pages chọn Deploy from a branch, nhánh `gh-pages`, thư mục `/ (root)`.

## Nhập lại đề gốc

```sh
python3 scripts/import-test.py
python3 scripts/import-test2.py
```

Script dùng file `../Reference/VOL 9 LISTENING/LIS TEST 1/[VOL 9] Listening Test 1.docx` và file Test 2 tương ứng, không sửa file nguồn. Audio và file DOCX gốc không được đưa vào repository.

## Huỷ bài và Test 2

Quay lại / Huỷ bài mở xác nhận trước khi bỏ lượt chưa nộp. Huỷ sẽ dừng audio, bỏ đáp án trong bộ nhớ và trở về thư viện; không tạo record lịch sử và không xoá các lượt đã nộp. Quay lại từ lượt đã nộp chỉ rời màn hình xem lại.

Test 2: câu 1–10 và 31–40 điền từ; 11–15 và 21–24 chọn một đáp án; 16–20 kéo/chọn A–I trong lưu đồ; 25–30 kéo/chọn A–H để ghép ý. Giữ bảng và nội dung lưu đồ gốc. File Test 2 chưa có chữa chi tiết riêng; bottom sheet hiện đáp án và đoạn transcript gốc liên quan. Mỗi record lịch sử có testId; dữ liệu Test 1 đã lưu trước đây được giữ và mặc định testId=1.

## Bắt đầu lượt làm

Chọn test chỉ mở màn hình chuẩn bị, giữ đồng hồ ở 00:00:00. Có thể chọn audio trước. Bấm Bắt đầu làm bài mới hiển thị câu hỏi, cho phát audio và bắt đầu đếm giờ. Làm lại bài từ lịch sử cũng quay về màn hình chuẩn bị.
