# EchoPrep

Trang luyện IELTS Listening bằng tiếng Việt. Listening - Vol 9 → Test 1 có 40 câu, 4 sections; đề và đáp án được nhập từ file DOCX của người dùng.

## Chạy trên máy

Mở Terminal trong thư mục này và chạy:

```sh
python3 -m http.server 8080 --directory dist
```

Mở http://localhost:8080. Có thể mở `dist/index.html` trực tiếp để sử dụng offline.

Chọn cùng lúc bốn file `T1-S1.mp3` đến `T1-S4.mp3` từ thư mục nguồn. Audio phát trực tiếp trên thiết bị, không được gửi lên server. Nếu tên khác, chọn từng file trong section tương ứng. Mỗi section nhớ vị trí audio khi chuyển tab trong phiên hiện tại.

- Câu 1–17: điền từ, tối đa ba từ và/hoặc một số.
- Câu 18–20: kéo thả nhãn A–G lên ảnh gốc; cũng có thể chạm/chọn bằng bàn phím.
- Câu 21–24: chọn một đáp án A–C.
- Câu 25–30: ba nhóm chọn hai đáp án A–E; chấm không phụ thuộc thứ tự, không tính hai lần đáp án trùng.
- Câu 31–40: điền một từ.

Nộp bài để xem số câu đúng/sai/bỏ qua, thời gian và đối chiếu từng đáp án. Giữ nguyên nội dung, chữ đậm/nghiêng và ảnh sơ đồ; khoảng cách và cỡ chữ được điều chỉnh cho trình duyệt và màn hình nhỏ. Không mô phỏng chính xác phân trang của Word. Phiên làm bài chỉ ở bộ nhớ, tải lại trang sẽ bắt đầu lại. Đáp án có trong mã nguồn của ứng dụng tự luyện; đây không phải hệ thống thi có bảo mật đáp án.

## Kiểm tra

```sh
node scripts/check.cjs
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
```

Script dùng file `../VOL 9 LISTENING/LIS TEST 1/[VOL 9] Listening Test 1.docx`, không sửa file nguồn. Audio và file DOCX gốc không được đưa vào repository.
