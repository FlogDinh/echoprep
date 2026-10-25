# EchoPrep

Luyện IELTS Listening và Reading bằng tiếng Việt. Website: https://flogdinh.github.io/echoprep/.

Vol 9 hiện có **Listening Test 1–9** và **Reading Test 1–12**. Mỗi test có 40 câu; Listening chia bốn section, Reading chia ba passage. Chọn Listening / Reading → Vol 9 → Test, rồi bấm **Bắt đầu làm bài** mới chạy đồng hồ.

## Tài khoản và lịch sử

Không cần đăng nhập; không có đăng ký, phân quyền theo account, định danh thiết bị hoặc cấu hình Supabase. Các lượt đã lưu trước đây vẫn được giữ. Mỗi lần nộp tạo một lượt riêng, gồm đáp án, thời lượng, kết quả và highlight; có thể xem lại hoặc làm lại. Bản GitHub Pages lưu lịch sử bằng bộ nhớ trình duyệt; không có đồng bộ giữa các máy. Bản local dùng SQLite khi chạy máy chủ bên dưới. Không cần cấu hình dịch vụ ngoài để luyện bài.

## Làm bài và chữa bài

- Chọn số câu ở cuối trang để đổi section/passage; đáp án và highlight giữ nguyên khi đổi qua lại.
- Kéo chuột chọn chữ để bôi vàng. Highlight được lưu cùng lượt đã nộp; lượt mới/làm lại bắt đầu trống.
- Quay lại / Huỷ bài cần xác nhận trước khi bỏ lượt chưa nộp; huỷ không tạo record và không xoá các lượt đã nộp. Tải lại trang sẽ mất lượt chưa nộp.
- Reading: bài đọc trái, câu hỏi phải, cuộn riêng. Mặc định đếm xuôi không giới hạn; có tuỳ chọn đếm ngược 60 phút. Hết giờ mở hộp hỏi Nộp bài / Làm tiếp: Nộp bài chấm kết quả và lưu một lượt lịch sử; Làm tiếp chuyển sang đếm xuôi từ 60:00, giữ nguyên đáp án và highlight. Thời gian chờ chọn không tính vào thời lượng làm bài.
- Listening: chọn audio offline từ máy; không gửi audio lên mạng. Tên `T3-S1.mp3` … `T3-S4.mp3` tự gán theo section và tương tự các test khác. Nếu tên khác thì chọn từng file ở section đang làm. Vị trí nghe được giữ khi chuyển section trong phiên.
- Chọn một đáp án, nhóm chọn hai/ba đáp án, điền từ, heading, ghép đoạn/nhân vật, kết câu và sơ đồ đều có điều khiển tương ứng. Chọn nhiều đáp án được chấm không phụ thuộc thứ tự và không tính trùng. Heading có thể chọn ngay trên đoạn đọc hoặc kéo từ ngân hàng đáp án.
- Sau khi nộp: sai đỏ / đúng xanh. Chọn câu hoặc Xem giải thích để mở bottom sheet và cuộn đến bằng chứng nguồn. Giữ hình bản đồ gốc, bảng và chữ đậm/nghiêng; bố cục điều chỉnh cho trình duyệt, không mô phỏng phân trang Word.

## Đáp án và thiếu sót trong tài liệu nguồn

**Reading Test 12 có đủ đề nhưng bảng key của file nguồn trống cả 40 câu.** Bài này vẫn làm/nộp/xem lại được, nhưng hiện “Chưa có đáp án nguồn”; không tính đáp án đã nhập là sai hoặc đưa điểm 0/40. Cần bổ sung key gốc để bật chấm tự động. Các test còn lại chấm đủ 40 câu.

Reading Test 2–9 có phần chữa nguồn (Test 4 thiếu một lời giải riêng); Test 10 chỉ có lời giải riêng câu 1–6; Test 11 chưa có phần chữa chi tiết. Listening Test 3–9 có key và transcript nhưng chưa có lời giải riêng. Những câu không có chữa riêng hiển thị đáp án và đoạn nguồn liên quan. Các câu NOT GIVEN không xác định được bằng chứng cụ thể sẽ không tự đánh dấu một đoạn không liên quan.

Các lỗi nguồn được ghi chú trên bài và trong [báo cáo nhập liệu](scripts/import-vol9-report.json):

- Listening Test 3: nhãn cuối của ngân hàng A–G bị ghi D lần thứ hai; hiển thị G cho “unavailable”.
- Listening Test 7: key câu 32–39 lệch thứ tự so với câu hỏi. Đối chiếu transcript cho đáp án: gift, publicity, reputation, machines, toppings, mistake, contact, shape.
- Listening Test 8 câu 36: key ghi “glass”, transcript ghi “grass”; chấm “grass”.
- Reading Test 2: khôi phục phương án F bị thiếu từ chính phần chữa 24–26.
- Reading Test 5: khôi phục heading ix bị thiếu từ phần chữa câu 16.
- Reading Test 11 câu 13: key ghi “Varnis”; chấp nhận thêm “varnished” theo passage.

Các bản key ban đầu của test mới được giữ trong `sourceAnswerKey` để đối chiếu. Không tự tạo đáp án cho Reading Test 12.

## Chạy local

Node.js 24 trở lên:

```sh
node server/server.mjs
```

Mở http://127.0.0.1:8080, không cần đăng nhập. Lịch sử local lưu ở `.private/history.sqlite`. Lịch sử account cũ được sao chép sang bảng chung, bỏ username trong record; không xoá bảng cũ. Tài khoản/mật khẩu cũ không đưa vào frontend hoặc Git.

Bản tĩnh:

```sh
python3 -m http.server 8080 --directory dist
```

Mở http://localhost:8080. Lịch sử của mỗi địa chỉ web/trình duyệt nằm riêng; xoá dữ liệu trang sẽ xoá lịch sử tại đó.

## Kiểm tra

```sh
node scripts/check.cjs
node scripts/check-test2.cjs
node scripts/check-reading.cjs
node scripts/check-vol9.cjs
node scripts/check-shared-history.cjs
node server/check.mjs
node server/browser-check.mjs
```

Dùng dữ liệu tạm, không sửa lịch sử thật. Browser check yêu cầu Chrome trên macOS: kiểm tra đủ 21 test qua điều khiển thực, 40 câu mỗi bài, giữ lựa chọn khi đổi passage/section, tải ảnh, chấm key, chữa bài, lịch sử, highlight và trạng thái chưa chấm của Reading 12.

## Nhập lại đề nguồn

```sh
python3 scripts/import-test.py
python3 scripts/import-test2.py
python3 scripts/import-reading.py
python3 scripts/import-vol9.py
```

Test 1–2 dùng importer cũ; Test Listening 3–9 và Reading 2–12 dùng `import-vol9.py`. Thư mục nguồn hiện tại: `Reference/VOL 9 LISTENING/` và `Reference/VOL 9 READING/`. Listening Test 9 có key/transcript ở file riêng. Reading Test 11 lấy đề từ `VOL 9 TEST 11.docx`, key từ `[VOL 9] Reading Test 11.docx`; Reading 12 ghép Passage 1 của file `[VOL 9] Reading Test 12.docx` với Passage 2–3 của `VOL 9 TEST 12.docx`. Importer không sửa DOCX gốc. DOCX và audio không đưa vào Git.

## GitHub Pages

Mã nguồn `main`; website từ `gh-pages` / root. Sau khi commit thay đổi:

```sh
git subtree split --prefix dist -b pages-update
git push origin main pages-update:gh-pages
gh api --method POST repos/FlogDinh/echoprep/pages/builds
gh api repos/FlogDinh/echoprep/pages/builds/latest
```

Đổi tên branch tạm cho mỗi lần triển khai. Đây là ứng dụng tự luyện; đáp án nằm trong dữ liệu frontend.
