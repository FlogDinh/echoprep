# EchoPrep

Luyện IELTS Listening và Reading bằng tiếng Việt. Vol 9 hiện có Listening Test 1, Listening Test 2 và Reading Test 1. Website công khai: https://flogdinh.github.io/echoprep/.

## Lịch sử chung, không đăng nhập

Ứng dụng không còn yêu cầu account. GitHub Pages phục vụ giao diện; Supabase lưu lịch sử chung. Mỗi lần nộp là một record riêng, gồm thời gian làm, đáp án, kết quả và highlight. Mọi máy mở cùng link đọc được các lượt đã đồng bộ. Người mở link có thể thêm lượt làm; frontend không có quyền sửa hoặc xoá lượt cũ.

**Cần cấu hình Supabase trước khi lịch sử đồng bộ qua Internet.** Nếu chưa cấu hình, giao diện ghi rõ lịch sử đang tạm lưu trên trình duyệt. Bản máy chủ local chỉ chia sẻ dữ liệu của máy chủ đó, chưa tự trở thành kho Internet.

### Kết nối Supabase (một lần)

1. Tạo project Free tại https://supabase.com/dashboard.
2. Trong SQL Editor, chạy toàn bộ [supabase/shared-history.sql](supabase/shared-history.sql). SQL tạo bảng `echoprep_attempts`, bật Row Level Security, chỉ cấp SELECT và INSERT cho khách không đăng nhập; không cấp UPDATE/DELETE.
3. Lấy Project URL và Publishable key tại Project Settings / API Keys. Legacy `anon` key cũng được hỗ trợ. **Không dùng Secret key hoặc `service_role`.** URL và Publishable key được thiết kế để xuất hiện trong frontend; quyền truy cập do RLS và grants trong SQL kiểm soát.
4. Chạy `node scripts/configure-shared-history.mjs`, nhập hai giá trị trên. Script tạo cấu hình tại `dist/shared-history-config.js`.
5. Triển khai `dist` lên GitHub Pages theo hướng dẫn bên dưới.
6. Mở trang bằng trình duyệt cũ trên máy đã làm bài: các lượt trong localStorage tự đưa vào hàng chờ và gửi lên kho chung. Kiểm tra trạng thái **Đã đồng bộ**, rồi mở cùng link trên máy khác hoặc cửa sổ ẩn danh để xác nhận lịch sử hiện đầy đủ.

Nguồn: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Free plan](https://supabase.com/pricing). Gói Free có thể tạm dừng project sau một tuần không hoạt động; khi đó khôi phục trong Dashboard để đồng bộ tiếp.

Mất mạng hoặc kho dữ liệu chưa sẵn sàng: lượt mới giữ trong hàng chờ trên trình duyệt, không giả báo đã đồng bộ. Kết nối trở lại sẽ tự thử gửi lại; có nút **Đồng bộ lại** trong lịch sử. Mở lại trang cũng phục hồi hàng chờ. Retry dùng cùng ID nên không tạo bản sao; làm lại và nộp lần nữa tạo ID mới. Không xoá bộ nhớ trình duyệt trước khi các lượt chờ đã đồng bộ. Nếu trình duyệt không cho lưu, ứng dụng cảnh báo lượt chỉ đang ở bộ nhớ.

## Chạy local

Node.js 24 trở lên:

```sh
node server/server.mjs
```

Mở http://127.0.0.1:8080 trực tiếp, không cần đăng nhập. Khi Supabase chưa cấu hình, máy chủ lưu lịch sử chung trong `.private/history.sqlite`. Các bảng account/lịch sử cũ được giữ nguyên; các lượt hợp lệ được sao chép sang lịch sử chung mà không mang theo username/account. Mật khẩu cũ không được đưa vào frontend hoặc Git. Khi cấu hình Supabase, giao diện ưu tiên kho chung trên Internet.

Bản tĩnh không cần Node:

```sh
python3 -m http.server 8080 --directory dist
```

Mở http://localhost:8080. Dữ liệu lịch sử cũ của mỗi địa chỉ web/trình duyệt nằm riêng; phải mở đúng địa chỉ cũ để chuyển chúng lên kho chung.

## Làm bài

Menu Listening / Reading → Vol 9 → Test. Chọn bài chỉ mở màn hình chuẩn bị; bấm **Bắt đầu làm bài** mới chạy giờ. Quay lại / Huỷ bài cần xác nhận trước khi bỏ lượt chưa nộp; huỷ không tạo record và không xoá lượt đã nộp. Đáp án và highlight giữ khi đổi section/passage trong phiên; tải lại trang sẽ mất lượt chưa nộp. Kéo chuột chọn chữ để bôi vàng; mỗi lượt làm lại bắt đầu trống, highlight của lượt đã nộp vẫn giữ.

### Listening

Chọn bốn file `T1-S1.mp3` … `T1-S4.mp3` hoặc `T2-S1.mp3` … `T2-S4.mp3` từ máy. Audio không gửi lên server; từng section nhớ vị trí nghe trong phiên. Tên khác thì chọn từng file tại section tương ứng.

Test 1: câu 1–17 điền từ; 18–20 kéo/chọn A–G trên sơ đồ gốc; 21–24 chọn một đáp án; 25–30 chọn hai đáp án, chấm không phụ thuộc thứ tự và không tính trùng; 31–40 điền một từ. Test 2: 1–10 và 31–40 điền từ; 11–15 và 21–24 chọn một đáp án; 16–20 kéo/chọn A–I trên lưu đồ; 25–30 ghép ý A–H.

Sau khi nộp: transcript trái, câu hỏi phải, hai cột cuộn riêng. Xem giải thích mở bottom sheet và cuộn đến bằng chứng. Test 1 có lời giải riêng câu 1–20; các câu còn lại và Test 2 hiện đáp án/đoạn transcript nguồn, ghi rõ chưa có lời giải riêng.

### Reading

Reading Test 1 có ba passage (1–13, 14–26, 27–40), đủ 40 lời giải nguồn. Bài đọc trái, câu hỏi phải. Các dạng: TRUE/FALSE/NOT GIVEN, heading, ghép đoạn, điền từ và trắc nghiệm. Heading kéo/chọn được ngay trên đoạn đọc và đồng bộ với lựa chọn bên phải.

Mặc định đếm xuôi không giới hạn; có tuỳ chọn đếm ngược 60 phút. Hết giờ hiện thời gian vượt, không tự nộp hay xoá đáp án. Sau khi nộp, sai đỏ / đúng xanh; bottom sheet hiển thị lời giải và đánh dấu đoạn đọc chứa đáp án. Highlight ở cả bài đọc và câu hỏi lưu theo lượt.

## Kiểm tra

```sh
node scripts/check.cjs
node scripts/check-test2.cjs
node scripts/check-reading.cjs
node scripts/check-shared-history.cjs
node server/check.mjs
node server/browser-check.mjs
```

Kiểm tra dùng dữ liệu tạm, không sửa lịch sử thật. Browser check yêu cầu Chrome trên macOS. Kiểm tra shared history mô phỏng REST API: hai bộ nhớ độc lập, chuyển lịch sử cũ, hàng chờ offline/reload, chống trùng, refresh đồng thời nộp, chuyển backend, phân trang và highlight. Kết nối Supabase thật cần kiểm tra sau khi cung cấp cấu hình/chạy SQL.

## GitHub Pages

Mã nguồn trên `main`; trang triển khai từ `gh-pages` / root:

```sh
git add dist scripts server supabase README.md
git commit -m 'Update EchoPrep'
git subtree split --prefix dist -b pages-update
git push origin main pages-update:gh-pages
gh api --method POST repos/FlogDinh/echoprep/pages/builds
```

Đổi tên branch tạm `pages-update` cho các lần sau. Kiểm tra trạng thái triển khai bằng `gh api repos/FlogDinh/echoprep/pages/builds/latest`.

## Nhập lại đề nguồn

```sh
python3 scripts/import-test.py
python3 scripts/import-test2.py
python3 scripts/import-reading.py
```

Listening nguồn: `../Reference/VOL 9 LISTENING/LIS TEST 1/` và Test 2 tương ứng. Reading nguồn: `Reference/VOL 9 READING/[VOL 9] Reading Test 1.docx`. Không sửa file nguồn; DOCX/audio không đưa vào Git. Nội dung/chữ đậm/nghiêng/sơ đồ được giữ, bố cục điều chỉnh cho web và màn hình nhỏ; không mô phỏng phân trang Word. Đây là ứng dụng tự luyện, đáp án nằm trong dữ liệu frontend.
