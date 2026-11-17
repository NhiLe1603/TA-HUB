/* =============================================================
 * ATINO TA HUB — NỘI DUNG MỤC "HỌC" (6 bước + quiz)
 * Sửa chữ ở đây là đổi nội dung bài học. a = vị trí đáp án đúng (đếm từ 0).
 * ============================================================= */
"use strict";

const ATINO_FACTS = [
  { so: "56,5%", t: "vị trí được lấp đầy" },
  { so: "66,7%", t: "người được mời nhận việc" },
  { so: "0/3", t: "nhóm từng có phiếu chấm" },
  { so: "1–15 ngày", t: "HM mới phản hồi" },
  { so: "~70%", t: "thời gian tuyển nằm ngoài tầm TA" },
  { so: ">60%", t: "hồ sơ đến từ kênh miễn phí" }
];
const LEARN_INTRO = "Team mình <b>thao tác rất chăm</b> nhưng hay quyết định theo <b>cảm giác</b>. App này giúp bạn <b>vừa học vừa làm</b>, mỗi quyết định đều có <b>bằng chứng</b>. Mỗi bài đọc khoảng 3 phút.";

const LEARN = [
  {
    id: "b1", ico: "🎯", ten: "Chân dung ứng viên & khai thác HM",
    link: "#/position/new", linkLabel: "Tạo chân dung ngay",
    viSao: "Trước giờ <b>0/3</b> nhóm có phiếu chấm — mỗi người tuyển theo cảm giác riêng, nên tỷ lệ lấp đầy chỉ <b>56,5%</b>. Không rõ cần ai thì lọc kiểu gì cũng trượt.",
    nho: "Chưa hỏi rõ HM cần ai thì chưa lọc CV.",
    y: [
      "<b>Loại cứng (must-have)</b> = thiếu là rớt. Chỉ đặt <b>3–4 cái</b>: ca/giờ, khu vực, ngày bắt đầu, lương.",
      "<b>Nice-to-have</b> = có thì cộng điểm, không có vẫn xét tiếp.",
      "<b>Bóc vỏ hành:</b> HM nói chung chung → hỏi “Cụ thể hơn được không? Như thế nào ạ?” tới khi ra việc nhìn thấy được.",
      "HM bận → hỏi đúng <b>2 câu</b>: “Thế nào thì anh/chị <b>CHẤM ĐẬU</b> ngay?” và “Dính gì thì <b>LOẠI</b> ngay?”",
      "Gửi chân dung cho HM <b>xác nhận bằng tin nhắn</b> (Lark) trước khi lọc — sau này không bị đổi ý."
    ],
    viDu: "HM: “Cần bạn nhanh nhẹn.”<br>TA: “Nhanh nhẹn là làm được gì ạ?”<br>HM: “Giờ cao điểm 1 mình lo được 3 khách, không để khách chờ quá 2 phút.”<br>👉 Câu cuối mới là tiêu chí chấm được.",
    quiz: [
      { q: "HM nói “cần người nhanh nhẹn”. Bạn làm gì?", o: ["Ghi luôn “nhanh nhẹn” vào tiêu chí", "Hỏi tiếp: “Nhanh nhẹn là làm được gì ạ?”", "Tự đoán ý HM cho nhanh"], a: 1, g: "Bóc vỏ hành: hỏi tới khi ra hành vi nhìn thấy được." },
      { q: "Loại cứng nên có khoảng bao nhiêu điều kiện?", o: ["3–4 cái", "8–10 cái", "Càng nhiều càng chắc"], a: 0, g: "Nhiều loại cứng quá sẽ loại oan người tốt." },
      { q: "Điều nào KHÔNG được dùng làm tiêu chí?", o: ["Làm được ca tối", "Đi lại tới cửa hàng được", "Dưới 25 tuổi"], a: 2, g: "Tuổi là tiêu chí cấm (Điều 3 khoản 8, BLLĐ 2019). Viết thành năng lực, vd “đứng ca 8 tiếng được”." }
    ]
  },
  {
    id: "b2", ico: "✍️", ten: "Viết JD & tin đăng (AIDA)",
    link: "#/tools/jd", linkLabel: "Viết tin đăng",
    viSao: "Hơn <b>60%</b> hồ sơ đến từ kênh miễn phí, mỗi tin trả phí tốn ~<b>3 triệu</b>. Tin nhạt thì người ta lướt qua — tốn tiền mà ít người ứng tuyển.",
    nho: "JD để nội bộ đọc. Tin đăng để ứng viên muốn bấm.",
    y: [
      "<b>JD</b> = mô tả công việc nội bộ. <b>Tin đăng</b> = bản “phiên dịch” JD cho ứng viên, viết như quảng cáo.",
      "<b>AIDA:</b> A – câu đầu chặn tay lướt · I – vì sao chọn ATINO · D – 3–4 việc + 3–4 quyền lợi · A – <b>1</b> lời kêu gọi.",
      "Ghi <b>tổng thu nhập bằng con số</b>. Không ghi “lương thoả thuận” cho vị trí phổ thông.",
      "Không viết HOA toàn bộ · để link ở <b>bình luận</b> · tránh từ “khoá học”, “đa cấp”.",
      "Dùng <b>ảnh thật</b> cửa hàng, đồng nghiệp. Tránh ảnh AI vẽ người."
    ],
    viDu: "❌ “TUYỂN GẤP NV BÁN HÀNG LƯƠNG THỎA THUẬN, IB NGAY, LINK: …”<br>✅ “Thử việc chỉ 1 tháng – thu nhập 8–10 triệu + phụ cấp ăn ca. Nhắn Zalo 09xx để hẹn phỏng vấn.”",
    quiz: [
      { q: "Câu mở đầu (hook) nào tốt nhất?", o: ["TUYỂN GẤP NHÂN VIÊN", "Thử việc chỉ 1 tháng, thu nhập 8–10 triệu", "Công ty mình đang cần người"], a: 1, g: "Hook dùng điểm mạnh nhất (USP), có con số, không viết hoa toàn bộ." },
      { q: "Một tin đăng nên có mấy lời kêu gọi (CTA)?", o: ["1", "3 cho chắc", "Không cần"], a: 0, g: "Nhiều lựa chọn quá, ứng viên không làm gì cả." },
      { q: "Đăng Facebook, link ứng tuyển nên để ở đâu?", o: ["Trong bài, dòng đầu", "Ở bình luận đầu tiên", "Không cần link"], a: 1, g: "Facebook giảm hiển thị bài có link — để ở bình luận." }
    ]
  },
  {
    id: "b3", ico: "📣", ten: "Tạo nguồn & nghiên cứu thị trường",
    link: "#/tools/nguon", linkLabel: "Lập kế hoạch nguồn",
    viSao: "Khoảng <b>70%</b> thời gian tuyển nằm ngoài tầm TA (chờ HM, chờ ứng viên). Phần trong tầm tay lớn nhất là <b>chọn đúng nguồn</b>.",
    nho: "Đi tìm ứng viên ở nơi họ đang ở — đừng đăng rồi ngồi đợi.",
    y: [
      "<b>Tuyển chủ động:</b> làm marketing tuyển dụng, đi tìm người — thay vì đăng 1 tin rồi chờ.",
      "<b>Market research</b> trước khi đăng: thị trường gọi tên vị trí là gì, lương bao nhiêu, đối thủ mời gì, khu vực khó hay dễ.",
      "Chọn kênh bằng <b>trình duyệt ẩn danh</b>: gõ đúng chữ ứng viên hay tìm, xem 5 kết quả đầu.",
      "Làm <b>nguồn trong nhà</b> trước: giới thiệu (referral), ứng viên cũ (Talent Pool), luân chuyển nội bộ.",
      "Đo kênh theo <b>số người đi làm</b>, không theo số CV."
    ],
    viDu: "Group Facebook ra 50 CV → 1 người đi làm.<br>Nhân viên giới thiệu ra 5 CV → 3 người đi làm.<br>👉 Referral là kênh tốt hơn, dù ít CV hơn.",
    quiz: [
      { q: "Kênh nào hiệu quả hơn?", o: ["Kênh A: 100 CV, 1 người đi làm", "Kênh B: 10 CV, 4 người đi làm", "Bằng nhau"], a: 1, g: "Đo theo người đi làm thật, không theo CV thô." },
      { q: "Vì sao chọn kênh bằng trình duyệt ẩn danh?", o: ["Để Google không gợi ý theo lịch sử của mình", "Cho nhanh hơn", "Để không ai biết"], a: 0, g: "Kết quả ẩn danh giống thứ ứng viên thật sự nhìn thấy." },
      { q: "Nên làm nguồn nào TRƯỚC?", o: ["Chạy quảng cáo trả phí", "Nguồn trong nhà: giới thiệu, ứng viên cũ", "Chờ ứng viên tự nộp"], a: 1, g: "Nhanh, rẻ và người được giới thiệu thường gắn bó hơn." }
    ]
  },
  {
    id: "b4", ico: "📄", ten: "Phiếu điểm & lọc CV (CWC)",
    link: "#/tools/loc-cv", linkLabel: "Lọc CV thử",
    viSao: "Không có phiếu chấm thì 2 người đọc cùng 1 CV ra 2 kết luận khác nhau. Phiếu điểm giúp <b>ai chấm cũng ra gần giống nhau</b>.",
    nho: "Không có bằng chứng ≠ Không đạt → bấm “?” rồi hỏi khi sơ vấn.",
    y: [
      "<b>CWC:</b> Can do (làm được việc) · Want to (muốn làm & gắn bó) · Culture fit (hợp văn hoá ATINO).",
      "Thang <b>4 mức</b>: 1 Chưa đạt · 2 Cần xem thêm · 3 Đạt · 4 Nổi bật. Mỗi mức có mô tả neo.",
      "Trọng số tổng 100%, mỗi tiêu chí 10–40%. Điểm: dưới 2,5 Loại · 2,5–2,9 Cân nhắc · từ 3,0 Đạt.",
      "Chưa rõ loại cứng → <b>xác minh trước khi loại</b>, đừng loại vội.",
      "<b>4 bẫy:</b> Hào quang (1 điểm sáng che hết) · Giống mình · Ấn tượng đầu · So sánh với người trước."
    ],
    viDu: "CV không ghi có làm ca tối được không → để <b>?</b>, gọi hỏi.<br>CV từng làm ở thương hiệu lớn → đừng tự cho điểm cao mọi thứ (bẫy hào quang). Chấm từng tiêu chí theo bằng chứng.",
    quiz: [
      { q: "CV không nói gì về khả năng xử lý khách khó. Bạn chấm?", o: ["1 – Chưa đạt", "? – chưa có bằng chứng, hỏi ở sơ vấn", "3 cho công bằng"], a: 1, g: "Không có bằng chứng không có nghĩa là không đạt." },
      { q: "Điểm tổng 2,7 thì kết luận là?", o: ["Loại", "Cân nhắc", "Đạt"], a: 1, g: "2,5–2,9 là vùng Cân nhắc → kiểm tra thêm ở sơ vấn." },
      { q: "Thấy ứng viên từng làm ở thương hiệu nổi tiếng nên chấm cao hết. Đó là bẫy gì?", o: ["Hào quang", "Giống mình", "So sánh"], a: 0, g: "1 điểm sáng làm lu mờ việc chấm từng tiêu chí." }
    ]
  },
  {
    id: "b5", ico: "📞", ten: "Sơ vấn & phỏng vấn (STAR)",
    link: "#/tools/so-van", linkLabel: "Mở phiếu sơ vấn",
    viSao: "Chỉ <b>66,7%</b> người được mời nhận việc — cứ 3 người đậu thì 1 người không đến. Sơ vấn tốt kiểm tra <b>Want to</b> sớm: người thật sự muốn làm mới nhận việc.",
    nho: "Hỏi việc ĐÃ xảy ra (“Kể về một lần…”), đừng hỏi “Nếu… thì sao?”.",
    y: [
      "<b>Sơ vấn</b> = cuộc gọi ngắn của TA, <b>trước</b> vòng HM. 6 phần: Chuẩn bị → Mở đầu → Loại cứng → Hỏi hành vi → Ứng viên hỏi & Đóng → Chấm ngay.",
      "<b>STAR:</b> Tình huống – Nhiệm vụ – Hành động – Kết quả. Ứng viên nói <b>70%</b> trở lên.",
      "Nên hỏi: <b>H</b> hành vi · <b>Đ</b> động lực · <b>K</b> xác minh loại cứng. Tránh: G giả định · T tự thuật · D dẫn dắt. Cấm: N nhạy cảm.",
      "<b>TA</b> chấm kỹ Loại cứng + <b>Want to</b>. <b>HM</b> kiểm sâu Can do + Culture fit.",
      "Muốn biết đi lại được không → hỏi “Bạn đi tới cửa hàng mất bao lâu?”, <b>không hỏi quê</b>."
    ],
    viDu: "❌ “Nếu gặp khách khó em sẽ làm gì?” (ai cũng trả lời hay)<br>✅ “Kể về lần em gặp khách khó nhất. Lúc đó em đã làm gì? Kết quả ra sao?”",
    quiz: [
      { q: "Câu nào là câu hỏi hành vi (STAR)?", o: ["Nếu khách la mắng em sẽ làm gì?", "Kể về một lần em làm khách không vui. Em đã làm gì?", "Em có kiên nhẫn không?"], a: 1, g: "Hỏi việc đã xảy ra mới có bằng chứng thật." },
      { q: "Khi sơ vấn, TA chấm kỹ nhất nhóm nào?", o: ["Want to (muốn làm & gắn bó)", "Can do", "Ngoại hình"], a: 0, g: "Can do và Culture fit chỉ là tín hiệu — HM sẽ kiểm sâu." },
      { q: "“Em có gia đình chưa?” thuộc loại câu nào?", o: ["Động lực", "Nhạy cảm – cấm hỏi", "Xác minh loại cứng"], a: 1, g: "Muốn biết lịch làm việc → hỏi “Em làm được ca tối, cuối tuần không?”" }
    ]
  },
  {
    id: "b6", ico: "📤", ten: "Quản lý ứng viên & bàn giao HM",
    link: "#/candidates", linkLabel: "Xem ứng viên",
    viSao: "HM mất <b>1–15 ngày</b> mới phản hồi → ứng viên tốt bị đối thủ lấy mất. Gửi HM bản tóm tắt <b>có điểm, có bằng chứng, có hạn trả lời</b> thì HM quyết nhanh hơn.",
    nho: "Ứng viên nào cũng ở đúng 1 trạng thái, và luôn có “việc tiếp theo”.",
    y: [
      "Phễu: Mới → Đã lọc CV → Đạt sơ vấn → Chuyển HM → Offer → Nhận việc · nhánh phụ: Loại, Talent Pool.",
      "Cập nhật trạng thái <b>ngay khi có kết quả</b> — cả team nhìn chung 1 bảng.",
      "Chuyển HM: gửi tóm tắt + nhờ phản hồi trong <b>2 ngày</b>. Quá hạn thì nhắc lại.",
      "Không đạt → <b>từ chối tử tế</b> (ứng viên nhớ tốt về ATINO). Có điểm mạnh → <b>Talent Pool</b>.",
      "Cuối tuần xem phễu: rơi nhiều ở bước nào thì sửa bước đó."
    ],
    viDu: "Tóm tắt gửi HM: “Ứng viên An – sơ vấn 3,5/4 – Đạt. Loại cứng: đủ. Động lực: 4/4 – tự tìm hiểu sản phẩm ATINO trước khi gọi… Nhờ anh/chị phản hồi trong 2 ngày ạ.”",
    quiz: [
      { q: "Đã gửi HM 2 ngày mà chưa thấy trả lời. Bạn làm gì?", o: ["Chờ tiếp", "Nhắc HM kèm tóm tắt, hỏi giờ hẹn cụ thể", "Báo ứng viên là trượt"], a: 1, g: "Chủ động nhắc để giữ ứng viên." },
      { q: "Ứng viên không hợp vị trí này nhưng thái độ rất tốt. Bạn làm gì?", o: ["Xoá hồ sơ", "Đưa vào Talent Pool + gửi tin giữ liên lạc", "Không báo gì"], a: 1, g: "Kho ứng viên giúp lần sau tuyển nhanh hơn." },
      { q: "Vì sao phải gửi tin từ chối?", o: ["Không cần thiết", "Để ứng viên nhớ tốt về ATINO và giới thiệu bạn bè", "Cho đủ thủ tục"], a: 1, g: "Trải nghiệm ứng viên tốt = thương hiệu tuyển dụng tốt." }
    ]
  }
];
