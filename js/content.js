/* =============================================================
 * ATINO TA HUB — NỘI DUNG CHUYÊN MÔN (mẫu, pháp lý, câu hỏi, prompt AI)
 * Sửa chữ ở file này là đổi nội dung trong app, không cần đụng code giao diện.
 * ============================================================= */
"use strict";

/* ---------- CWC ---------- */
const CWC = {
  can:     { label: "Can do",      vi: "Làm được việc",          color: "#2E6BE6", tip: "<b>Can do</b> = có kỹ năng/kinh nghiệm để làm được việc. VD: đã từng tư vấn bán hàng, xử lý được khách khó." },
  want:    { label: "Want to",     vi: "Muốn làm & gắn bó",      color: "#C77700", tip: "<b>Want to</b> = thật sự muốn làm việc này và ở lâu. VD: có lý do rõ khi chọn bán hàng, từng làm 1 nơi lâu." },
  culture: { label: "Culture fit", vi: "Hợp văn hoá ATINO",      color: "#1A9E62", tip: "<b>Culture fit</b> = thái độ hợp 5 giá trị ATINO: phục vụ khách, nhận trách nhiệm, trung thực, chủ động, thương đồng đội." }
};
const CWC_KEYS = ["can", "want", "culture"];

const CORE_VALUES = [
  "Đam mê phục vụ khách hàng",
  "Coi mình là gốc rễ của mọi vấn đề",
  "Luôn trung thực, trách nhiệm",
  "Chủ động, sáng tạo",
  "Yêu thương & hỗ trợ đồng đội"
];

/* ---------- Thang 4 mức ---------- */
const SCALE = {
  1: { label: "Chưa đạt", short: "1" },
  2: { label: "Cần xem thêm", short: "2" },
  3: { label: "Đạt", short: "3" },
  4: { label: "Nổi bật", short: "4" },
  "?": { label: "Chưa có bằng chứng", short: "?" }
};
const DEFAULT_ANCHORS = {
  1: "Không có ví dụ, hoặc ví dụ ngược với yêu cầu",
  2: "Có nhắc tới nhưng chung chung, thiếu bằng chứng cụ thể",
  3: "Có ví dụ cụ thể, đạt yêu cầu của vị trí",
  4: "Ví dụ cụ thể, có kết quả/con số, vượt yêu cầu"
};
const THRESHOLD = { loai: 2.5, dat: 3.0 };

/* ---------- 7 bước scorecard ---------- */
const SCORECARD_STEPS = [
  "Viết <b>kết quả mong muốn sau 30/60/90 ngày</b> (người giỏi sẽ làm được gì).",
  "Rút ra <b>tiêu chí theo CWC</b>: Can do · Want to · Culture fit.",
  "Định nghĩa mỗi tiêu chí bằng <b>hành vi nhìn/nghe thấy được</b> (không viết “nhanh nhẹn, tốt”).",
  "Tách <b>Loại cứng (must-have)</b> — thiếu là loại — khỏi tiêu chí chấm điểm.",
  "Thang <b>4 mức</b>, mỗi mức có <b>mô tả neo</b> để 2 người chấm ra giống nhau.",
  "Chia <b>trọng số %</b>: tổng 100, không tiêu chí nào trên 40% hay dưới 10%.",
  "Tính tổng & kết luận: <b>dưới 2,5 Loại · 2,5–2,9 Cân nhắc · từ 3,0 Đạt</b>."
];

/* ---------- MẪU CHÂN DUNG ---------- */
const TEMPLATES = {
  Mass: {
    ten: "Nhân viên bán hàng (Mass)",
    mucTieu: {
      d30: "Thuộc 80% sản phẩm, tự tư vấn & thu ngân không sai sót",
      d60: "Đạt 80% chỉ tiêu doanh số cá nhân, không đi trễ",
      d90: "Đạt 100% chỉ tiêu, có khách quen quay lại, không vi phạm nội quy"
    },
    mustHave: [
      { ten: "Nhận ca xoay (có ca tối đến 22h, cuối tuần)", cauHoi: "Công việc có ca xoay, có ca tối tới 22h và cuối tuần. Bạn làm được không?" },
      { ten: "Đi lại được tới cửa hàng", cauHoi: "Cửa hàng ở [địa chỉ]. Bạn đi lại tới đây hằng ngày được không, mất khoảng bao lâu?" },
      { ten: "Đi làm được trong 2 tuần tới", cauHoi: "Nếu đạt, sớm nhất ngày nào bạn đi làm được?" },
      { ten: "Thu nhập mong muốn nằm trong khung", cauHoi: "Tổng thu nhập vị trí này khoảng [X–Y] triệu/tháng. Mức này phù hợp với bạn không?" }
    ],
    tieuChi: [
      { ten: "Động lực chọn bán hàng", nhom: "want", trongSo: 25, loaiCauHoi: "Đ",
        hanhVi: "Nói được lý do cụ thể muốn bán hàng thời trang / làm ở ATINO, không chỉ “cần việc”",
        cauHoi: "Vì sao bạn chọn công việc bán hàng, và vì sao là ATINO?",
        neo: { 1: "Không nêu được lý do, hoặc chỉ vì “cần tiền gấp”", 2: "Lý do chung chung (“thích giao tiếp”)", 3: "Lý do cụ thể, liên quan công việc/ATINO", 4: "Lý do cụ thể + đã tự tìm hiểu ATINO/sản phẩm, có mục tiêu rõ" } },
      { ten: "Gắn bó lâu dài", nhom: "want", trongSo: 20, loaiCauHoi: "H",
        hanhVi: "Từng làm ổn định ở 1 nơi; kế hoạch 6–12 tháng tới khớp với công việc",
        cauHoi: "Kể về công việc bạn làm lâu nhất. Vì sao bạn nghỉ việc đó?",
        neo: { 1: "Nhảy việc liên tục dưới 3 tháng, không giải thích được", 2: "Lý do nghỉ hợp lý nhưng kế hoạch sắp tới chưa rõ", 3: "Từng làm 6 tháng trở lên 1 nơi, kế hoạch khớp công việc", 4: "Từng làm 1 năm trở lên, được giữ lại/thăng tiến, kế hoạch dài hạn" } },
      { ten: "Xử lý tình huống với khách", nhom: "can", trongSo: 20, loaiCauHoi: "H",
        hanhVi: "Đã từng xử lý khách khó/khiếu nại mà vẫn giữ được khách",
        cauHoi: "Kể về một lần bạn gặp khách khó tính. Lúc đó bạn đã làm gì? Kết quả ra sao?",
        neo: { 1: "Chưa từng, hoặc kể theo kiểu đổ lỗi cho khách", 2: "Có kể nhưng chung chung, không rõ mình làm gì", 3: "Kể rõ tình huống + hành động + kết quả ổn", 4: "Biến khách khó thành khách mua/quay lại, có con số" } },
      { ten: "Giao tiếp & tư vấn", nhom: "can", trongSo: 20, loaiCauHoi: "H",
        hanhVi: "Nói rõ ràng, lắng nghe, hỏi lại nhu cầu, trả lời đúng câu hỏi",
        cauHoi: "Kể về một lần bạn tư vấn giúp khách chọn được sản phẩm ưng ý.",
        neo: { 1: "Trả lời lạc đề, khó hiểu", 2: "Hiểu được nhưng cụt, ngập ngừng nhiều", 3: "Rõ ràng, đúng trọng tâm, có hỏi lại khách", 4: "Rõ ràng, cuốn hút, biết hỏi – gợi ý – chốt đơn" } },
      { ten: "Thái độ – trung thực", nhom: "culture", trongSo: 15, loaiCauHoi: "H",
        hanhVi: "Thừa nhận lỗi và nhận trách nhiệm (giá trị: Trung thực, trách nhiệm · Coi mình là gốc rễ)",
        cauHoi: "Kể về một lần bạn mắc lỗi trong công việc. Bạn đã xử lý thế nào?",
        neo: { 1: "Không nhận lỗi, đổ cho người khác", 2: "Nhận lỗi nhưng không nói đã sửa thế nào", 3: "Nhận lỗi + đã tự sửa", 4: "Nhận lỗi + sửa + đề xuất cách để không lặp lại" } }
    ]
  },
  BackOffice: {
    ten: "Nhân viên văn phòng (Back Office)",
    mucTieu: {
      d30: "Nắm quy trình, tự làm được các đầu việc hằng ngày không cần nhắc",
      d60: "Hoàn thành đúng hạn 90% đầu việc, không sai số liệu quan trọng",
      d90: "Tự đề xuất được ít nhất 1 cải tiến giúp tiết kiệm thời gian"
    },
    mustHave: [
      { ten: "Làm giờ hành chính (T2–T7)", cauHoi: "Công việc làm giờ hành chính từ thứ 2 đến thứ 7. Bạn làm được không?" },
      { ten: "Có kỹ năng chuyên môn bắt buộc (vd Excel cơ bản)", cauHoi: "Bạn đã dùng [Excel/phần mềm X] trong công việc chưa? Dùng để làm gì?" },
      { ten: "Đi làm được trong 30 ngày", cauHoi: "Nếu đạt, sớm nhất ngày nào bạn đi làm được?" },
      { ten: "Thu nhập mong muốn nằm trong khung", cauHoi: "Mức lương vị trí này khoảng [X–Y] triệu/tháng. Mức này phù hợp với bạn không?" }
    ],
    tieuChi: [
      { ten: "Chuyên môn đúng vị trí", nhom: "can", trongSo: 30, loaiCauHoi: "H",
        hanhVi: "Đã làm đúng loại việc của vị trí, kể được cách làm và kết quả",
        cauHoi: "Kể về một việc chuyên môn bạn làm tốt nhất ở chỗ cũ. Bạn làm từng bước thế nào?",
        neo: { 1: "Chưa làm việc tương tự", 2: "Có làm nhưng chỉ hỗ trợ, không tự làm", 3: "Tự làm được, kể rõ các bước", 4: "Tự làm tốt + có kết quả đo được / từng hướng dẫn người khác" } },
      { ten: "Tổ chức & chính xác", nhom: "can", trongSo: 20, loaiCauHoi: "H",
        hanhVi: "Có cách sắp xếp việc, kiểm tra lại số liệu trước khi gửi",
        cauHoi: "Kể về một lần bạn phải xử lý nhiều việc cùng hạn. Bạn sắp xếp thế nào?",
        neo: { 1: "Không có cách làm, hay trễ/sai", 2: "Có cố gắng nhưng không có cách cụ thể", 3: "Có cách sắp xếp rõ (danh sách, ưu tiên)", 4: "Có hệ thống riêng + kết quả không trễ, không sai" } },
      { ten: "Động lực & gắn bó", nhom: "want", trongSo: 25, loaiCauHoi: "Đ",
        hanhVi: "Lý do chọn vị trí/ATINO cụ thể, kế hoạch 1–2 năm khớp công việc",
        cauHoi: "Vì sao bạn muốn làm vị trí này ở ATINO? 1–2 năm tới bạn muốn mình làm được gì?",
        neo: { 1: "Không có lý do / chỉ tạm thời", 2: "Lý do chung chung", 3: "Lý do cụ thể, kế hoạch khớp", 4: "Lý do cụ thể, đã tìm hiểu kỹ ATINO, kế hoạch dài hạn rõ" } },
      { ten: "Chủ động, sáng tạo", nhom: "culture", trongSo: 15, loaiCauHoi: "H",
        hanhVi: "Từng tự đề xuất/cải tiến cách làm mà không cần ai giao",
        cauHoi: "Kể về một lần bạn tự đề xuất cách làm mới ở chỗ làm cũ.",
        neo: { 1: "Chưa từng, chỉ làm khi được giao", 2: "Có ý tưởng nhưng chưa làm", 3: "Đã đề xuất và làm thử", 4: "Đề xuất, làm và có kết quả rõ" } },
      { ten: "Phối hợp đồng đội", nhom: "culture", trongSo: 10, loaiCauHoi: "H",
        hanhVi: "Từng hỗ trợ đồng nghiệp / phòng ban khác khi cần",
        cauHoi: "Kể về một lần bạn giúp đồng nghiệp hoàn thành việc gấp.",
        neo: { 1: "Không có ví dụ, hay đổ lỗi đồng đội", 2: "Có giúp nhưng chung chung", 3: "Ví dụ rõ về việc hỗ trợ", 4: "Chủ động hỗ trợ, được đồng đội/sếp ghi nhận" } }
    ]
  },
  QuanLy: {
    ten: "Cửa hàng trưởng (Quản lý)",
    mucTieu: {
      d30: "Nắm đội ngũ, quy trình cửa hàng; lập được lịch ca hợp lý",
      d60: "Doanh số cửa hàng đạt 90% chỉ tiêu, không thiếu người đứng ca",
      d90: "Đạt 100% chỉ tiêu, nghỉ việc trong đội giảm, có 1 bạn được đào tạo kế cận"
    },
    mustHave: [
      { ten: "Đã quản lý nhóm từ 5 người trở lên", cauHoi: "Bạn đã từng quản lý trực tiếp nhóm bao nhiêu người, trong bao lâu?" },
      { ten: "Làm ca xoay, cuối tuần, ngày lễ", cauHoi: "Vị trí cần có mặt ca xoay, cuối tuần và ngày lễ. Bạn sắp xếp được không?" },
      { ten: "Nhận quản lý cửa hàng tại khu vực", cauHoi: "Cửa hàng ở [khu vực]. Bạn đi lại/nhận công tác ở đây được không?" },
      { ten: "Thu nhập mong muốn nằm trong khung", cauHoi: "Tổng thu nhập vị trí này khoảng [X–Y] triệu/tháng. Mức này phù hợp với bạn không?" }
    ],
    tieuChi: [
      { ten: "Quản lý doanh số", nhom: "can", trongSo: 25, loaiCauHoi: "H",
        hanhVi: "Từng chịu chỉ tiêu cửa hàng/nhóm, kể được cách kéo doanh số và con số",
        cauHoi: "Kể về một tháng cửa hàng/nhóm của bạn bị hụt doanh số. Bạn đã làm gì?",
        neo: { 1: "Chưa chịu chỉ tiêu", 2: "Có chỉ tiêu nhưng không nói được cách làm", 3: "Cách làm rõ + đạt chỉ tiêu", 4: "Vượt chỉ tiêu, có con số, cách làm lặp lại được" } },
      { ten: "Quản lý & phát triển đội", nhom: "can", trongSo: 25, loaiCauHoi: "H",
        hanhVi: "Từng tuyển, kèm cặp, giữ người; xử lý nhân viên yếu",
        cauHoi: "Kể về một nhân viên yếu bạn từng kèm. Bạn đã làm gì và kết quả ra sao?",
        neo: { 1: "Không có ví dụ, hay đổ lỗi nhân viên", 2: "Có kèm nhưng không rõ cách", 3: "Cách kèm rõ, nhân viên tiến bộ", 4: "Đào tạo được người kế cận / giảm nghỉ việc, có số liệu" } },
      { ten: "Động lực & gắn bó", nhom: "want", trongSo: 20, loaiCauHoi: "Đ",
        hanhVi: "Lý do chọn ATINO cụ thể, muốn phát triển lâu dài trong ngành bán lẻ",
        cauHoi: "Vì sao bạn muốn quản lý cửa hàng ATINO? 2 năm tới bạn muốn mình ở đâu?",
        neo: { 1: "Không có lý do rõ", 2: "Lý do chung chung", 3: "Lý do cụ thể, kế hoạch khớp", 4: "Đã tìm hiểu kỹ cửa hàng ATINO, kế hoạch dài hạn rõ" } },
      { ten: "Coi mình là gốc rễ – trách nhiệm", nhom: "culture", trongSo: 15, loaiCauHoi: "H",
        hanhVi: "Khi có sự cố, nhận trách nhiệm phần mình trước khi tìm lỗi người khác",
        cauHoi: "Kể về một sự cố ở cửa hàng mà bạn thấy mình có phần trách nhiệm.",
        neo: { 1: "Đổ lỗi hoàn toàn cho người khác", 2: "Nhận một phần nhưng không rõ hành động", 3: "Nhận trách nhiệm + đã sửa", 4: "Nhận trách nhiệm + sửa + thay đổi quy trình" } },
      { ten: "Đam mê phục vụ khách", nhom: "culture", trongSo: 15, loaiCauHoi: "H",
        hanhVi: "Đặt trải nghiệm khách lên trước, làm gương cho đội",
        cauHoi: "Kể về một lần bạn làm điều gì đó vượt mong đợi cho khách.",
        neo: { 1: "Không có ví dụ", 2: "Ví dụ bình thường, đúng quy trình", 3: "Ví dụ cụ thể, khách hài lòng", 4: "Khách quay lại/giới thiệu, đội học theo" } }
    ]
  }
};

/* ---------- PHÁP LÝ (Điều 3 khoản 8, BLLĐ 2019) ---------- */
const LEGAL_RULES = [
  { key: "tuổi", pattern: /(tuổi|sinh năm|gen z|trẻ trung|còn trẻ)/i,
    fix: "Viết thành năng lực: “Đứng ca 8 tiếng được”, “Làm được ca xoay”." },
  { key: "giới tính", pattern: /(giới tính|nam giới|nữ giới|phụ nữ|đàn ông|con trai|con gái|(tuyển|cần|nhận|ưu tiên|chỉ|là)\s+(nam|nữ)(?![\p{L}])|^\s*(nam|nữ)(?![\p{L}])|(?<![\p{L}])nữ(?![\p{L}])|(?<![\p{L}])(nam|nữ)(?![\p{L}])\s*(\/|hoặc|,)\s*(nam|nữ))/iu,
    fix: "Mô tả việc cần làm: “Bê được thùng hàng 15kg” (nếu thật sự cần)." },
  { key: "hôn nhân", pattern: /(hôn nhân|độc thân|kết hôn|lập gia đình|có gia đình|chồng con|vợ con|đã có con|có con nhỏ|có con chưa|con nhỏ|ly hôn)/i,
    fix: "Hỏi điều kiện công việc: “Bạn làm được ca tối, cuối tuần không?”" },
  { key: "thai sản", pattern: /(thai sản|mang thai|có bầu|sinh con|sinh em bé|nghỉ đẻ|kế hoạch sinh)/i,
    fix: "Không hỏi. Chỉ hỏi về ca làm và ngày bắt đầu." },
  { key: "quê quán", pattern: /((?<![\p{L}])quê(?![\p{L}])|người miền|dân miền|hộ khẩu|gốc (bắc|trung|nam)|người (bắc|trung|nam)(?![\p{L}])|dân tộc|xuất thân)/iu,
    fix: "Hỏi: “Bạn đi lại tới cửa hàng mất bao lâu?” thay vì hỏi quê." },
  { key: "tôn giáo", pattern: /(tôn giáo|theo đạo|đạo phật|công giáo|thiên chúa|ăn chay)/i,
    fix: "Không dùng. Nếu cần làm lễ/Tết → hỏi “Bạn làm được ca ngày lễ không?”" },
  { key: "ngoại hình", pattern: /(ngoại hình|ưa nhìn|xinh|đẹp trai|dễ thương|khuôn mặt|chiều cao|cao từ|cao trên|cân nặng|mập|béo|gầy|vóc dáng|body|\d(m|,)\d{1,2}\s*trở lên)/i,
    fix: "Viết thành hành vi: “Tác phong gọn gàng, mặc đúng đồng phục”." }
];
/** Trả về danh sách vi phạm trong 1 đoạn chữ */
function legalCheck(text) {
  const t = String(text || "");
  if (!t.trim()) return [];
  return LEGAL_RULES.filter(r => r.pattern.test(t)).map(r => ({ key: r.key, fix: r.fix }));
}
function legalHtml(text) {
  const hits = legalCheck(text);
  if (!hits.length) return "";
  return `<div class="legal-box">⚖️ <b>Có thể trái luật:</b> dính tiêu chí <b>${hits.map(h => esc(h.key)).join(", ")}</b> — không được dùng để đánh giá/loại (Điều 3 khoản 8, Bộ luật Lao động 2019).<br>👉 ${hits.map(h => esc(h.fix)).join("<br>👉 ")}</div>`;
}

/* ---------- 7 LOẠI CÂU HỎI ---------- */
const QUESTION_TYPES = {
  "H": { ok: "good", label: "Hành vi (STAR)", ex: "“Kể về một lần bạn…”" },
  "Đ": { ok: "good", label: "Động lực", ex: "“Vì sao bạn ứng tuyển…?”" },
  "K": { ok: "good", label: "Xác minh loại cứng", ex: "“Bạn làm được ca tối không?” (câu đóng Có/Không)" },
  "G": { ok: "bad", label: "Giả định", ex: "“Nếu gặp khách khó bạn sẽ…?” → ai cũng trả lời hay" },
  "T": { ok: "bad", label: "Tự thuật", ex: "“Bạn có chăm chỉ không?” → ai cũng nói có" },
  "D": { ok: "bad", label: "Dẫn dắt", ex: "“Bạn thích làm việc nhóm đúng không?” → gợi sẵn đáp án" },
  "N": { ok: "ban", label: "Nhạy cảm (cấm)", ex: "Tuổi, hôn nhân, có con, quê, tôn giáo, ngoại hình" }
};

/* Câu hỏi gợi ý thêm theo nhóm CWC (dùng ở sơ vấn) */
const QUESTION_BANK = {
  want: [
    { q: "Vì sao bạn ứng tuyển vị trí này ở ATINO?", t: "Đ" },
    { q: "Kể về công việc bạn gắn bó lâu nhất. Điều gì giữ bạn ở lại?", t: "H" },
    { q: "Lần gần nhất bạn nghỉ việc là vì sao?", t: "H" },
    { q: "6–12 tháng tới bạn muốn mình làm được điều gì?", t: "Đ" }
  ],
  can: [
    { q: "Kể về một lần bạn tư vấn giúp khách mua được hàng.", t: "H" },
    { q: "Kể về lần bạn gặp khách khó tính nhất. Bạn đã làm gì?", t: "H" },
    { q: "Ở chỗ cũ, một ngày làm việc của bạn gồm những việc gì?", t: "H" }
  ],
  culture: [
    { q: "Kể về một lần bạn mắc lỗi. Bạn đã xử lý thế nào?", t: "H" },
    { q: "Kể về một lần bạn giúp đồng nghiệp khi họ bận.", t: "H" },
    { q: "Kể về một lần bạn tự làm thêm việc không ai giao.", t: "H" }
  ]
};
const STAR_PROBES = [
  { k: "S", q: "Lúc đó là tình huống gì, ở đâu, khi nào?" },
  { k: "T", q: "Nhiệm vụ / việc của bạn lúc đó là gì?" },
  { k: "A", q: "Cụ thể BẠN đã làm gì? (không phải “cả nhóm”)" },
  { k: "R", q: "Kết quả ra sao? Có con số không?" }
];

/* ---------- Lọc CV: 5 tư duy + 4 bẫy ---------- */
const CV_MINDSETS = [
  "Lọc CV là <b>dự đoán</b> người này làm tốt không — không phải “thấy thích”.",
  "Chấm <b>từng tiêu chí nhỏ</b>, đừng chấm cả CV một cục.",
  "<b>Không có bằng chứng ≠ Không đạt</b> → bấm <b>?</b> rồi hỏi ở sơ vấn.",
  "<b>Xác minh trước khi loại</b>: chưa rõ loại cứng thì gọi hỏi, đừng loại vội.",
  "Bỏ định kiến: trường học, ảnh, cách trình bày CV không nói lên năng lực."
];
const CV_TRAPS = [
  "<b>Hào quang:</b> 1 điểm sáng (thương hiệu lớn) làm mình chấm cao mọi thứ.",
  "<b>Giống mình:</b> cùng trường/cùng sở thích → thấy thích hơn.",
  "<b>Ấn tượng đầu:</b> CV đẹp/xấu quyết định luôn kết quả.",
  "<b>So sánh:</b> chấm người này cao vì người trước quá tệ — hãy so với phiếu điểm."
];

/* ---------- Sơ vấn 6 phần ---------- */
const SOVAN_PARTS = [
  { n: 1, t: "Chuẩn bị", d: "Đọc CV + phiếu điểm, chọn câu hỏi. 5 phút trước khi gọi." },
  { n: 2, t: "Mở đầu", d: "Chào, nói mục đích + thời lượng, xin phép ghi chú." },
  { n: 3, t: "Loại cứng", d: "Câu đóng Có/Không: ca/giờ · khu vực · ngày bắt đầu · lương." },
  { n: 4, t: "Thân — hỏi hành vi", d: "Hỏi STAR theo CWC, đào sâu, ghi bằng chứng. Ứng viên nói 70% trở lên." },
  { n: 5, t: "Ứng viên hỏi + Đóng", d: "Trả lời câu hỏi, nói bước tiếp theo + khi nào báo kết quả." },
  { n: 6, t: "Chấm ngay", d: "Chấm khi còn nhớ rõ. Bấm Lưu." }
];
const SOVAN_PREP = [
  "Đã đọc CV và xem điểm lọc CV",
  "Đã xem phiếu điểm của vị trí",
  "Đã chọn 1–2 câu hỏi cho mỗi tiêu chí",
  "Chỗ ngồi yên tĩnh, có chỗ ghi chú"
];

/* ---------- PROMPT AI (copy ra Claude/ChatGPT) ---------- */
function aiPromptPortrait({ tenViTri, nhom, khuVuc, moTa }) {
  return `Bạn là chuyên gia tuyển dụng ngành bán lẻ thời trang tại Việt Nam, làm cho ATINO (chuỗi thời trang nam "Always Be Casual", ~13 năm, toàn quốc).
Hãy soạn CHÂN DUNG ỨNG VIÊN + PHIẾU ĐIỂM theo khung CWC (Can do / Want to / Culture fit) cho vị trí sau:
- Vị trí: ${tenViTri || "[tên vị trí]"}
- Nhóm: ${nhom || "Mass"} (Mass = cửa hàng tuyển số lượng; BackOffice = văn phòng; QuanLy = quản lý)
- Khu vực: ${khuVuc || "[không ghi]"}
- Quản lý (HM) mô tả thêm: ${moTa || "[không có]"}

5 giá trị cốt lõi ATINO (dùng cho Culture fit): ${CORE_VALUES.join("; ")}.

QUY TẮC BẮT BUỘC:
1. mustHave: 3–4 điều kiện "thiếu là loại", mỗi cái kèm 1 câu hỏi ĐÓNG Có/Không (ca/giờ, khu vực, ngày bắt đầu, lương...).
2. tieuChi: 4–6 tiêu chí; nhom chỉ là "can", "want" hoặc "culture"; có ít nhất 1 tiêu chí mỗi nhóm.
3. trongSo là số nguyên, TỔNG = 100, mỗi tiêu chí từ 10 đến 40.
4. hanhVi: hành vi NHÌN/NGHE THẤY ĐƯỢC, không dùng từ chung chung (nhanh nhẹn, tốt, năng động).
5. cauHoi: câu hỏi hành vi "Kể về một lần..." (loaiCauHoi "H") hoặc câu động lực (loaiCauHoi "Đ"). KHÔNG dùng câu giả định "nếu... sẽ...".
6. neo: mô tả 4 mức (1 Chưa đạt, 2 Cần xem thêm, 3 Đạt, 4 Nổi bật), ngắn gọn, cụ thể.
7. mucTieu: kết quả người giỏi làm được sau 30/60/90 ngày, có con số nếu được.
8. TUYỆT ĐỐI KHÔNG dùng tuổi, giới tính, hôn nhân, thai sản, quê quán, tôn giáo, ngoại hình (Điều 3 khoản 8 Bộ luật Lao động 2019). Nếu cần, viết thành năng lực công việc.
9. Viết tiếng Việt, ngắn gọn.

CHỈ TRẢ VỀ JSON đúng mẫu sau, không giải thích, không markdown:
{
  "mucTieu": {"d30": "", "d60": "", "d90": ""},
  "mustHave": [{"ten": "", "cauHoi": ""}],
  "tieuChi": [{"ten": "", "nhom": "want", "trongSo": 25, "hanhVi": "", "cauHoi": "", "loaiCauHoi": "H", "neo": {"1": "", "2": "", "3": "", "4": ""}}]
}`;
}

function aiPromptCV({ tenViTri, scorecard, cvText }) {
  const must = (scorecard.mustHave || []).map(m => ({ id: m.id, ten: m.ten }));
  const crit = (scorecard.tieuChi || []).map(t => ({ id: t.id, ten: t.ten, nhom: t.nhom, hanhVi: t.hanhVi, neo: t.neo }));
  return `Bạn là chuyên viên tuyển dụng của ATINO. Hãy chấm CV dưới đây cho vị trí "${tenViTri}" theo đúng phiếu điểm.

QUY TẮC:
- Chỉ dựa vào chữ CÓ TRONG CV. Không suy đoán.
- Mỗi tiêu chí cho điểm 1–4 theo mô tả "neo"; nếu CV KHÔNG có thông tin thì cho "?" (không có bằng chứng ≠ không đạt).
- bangChung: trích NGUYÊN VĂN câu/ý trong CV làm căn cứ (ngắn). Nếu "?" thì ghi điều cần hỏi thêm khi gọi.
- Loại cứng: "dat" nếu CV thể hiện rõ đáp ứng, "truot" nếu CV thể hiện rõ KHÔNG đáp ứng, "?" nếu không rõ.
- TUYỆT ĐỐI không đánh giá theo tuổi, giới tính, hôn nhân, quê quán, tôn giáo, ngoại hình, trường học.

LOẠI CỨNG:
${JSON.stringify(must, null, 1)}

TIÊU CHÍ CHẤM:
${JSON.stringify(crit, null, 1)}

CV:
"""
${cvText || "[dán CV vào đây]"}
"""

CHỈ TRẢ VỀ JSON đúng mẫu, giữ nguyên "id", không giải thích, không markdown:
{
  "mustHave": [{"id": "m1", "ketQua": "dat", "bangChung": ""}],
  "tieuChi": [{"id": "t1", "diem": 3, "bangChung": ""}],
  "diemManh": "",
  "canHoiThem": ""
}`;
}

/** Đọc JSON AI trả về một cách dễ dãi: bỏ ```json, lấy từ { đầu tiên đến } cuối cùng */
function parseAIJson(text) {
  let t = String(text || "").trim();
  if (!t) throw new Error("Bạn chưa dán kết quả AI vào ô.");
  t = t.replace(/```(json)?/gi, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("Không thấy dữ liệu JSON. Bảo AI: “Chỉ trả về JSON đúng mẫu” rồi dán lại.");
  t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch (e) { /* thử sửa lỗi nhỏ */ }
  try { return JSON.parse(t.replace(/,\s*([}\]])/g, "$1")); }
  catch (e) { throw new Error("JSON bị lỗi định dạng. Bảo AI: “Chỉ trả về JSON đúng mẫu, không thêm chữ nào” rồi dán lại."); }
}

/* =============================================================
 * PHA 3 — THƯƠNG HIỆU · JD/TIN ĐĂNG · TẠO NGUỒN
 * ============================================================= */
const BRAND = {
  ten: "ATINO",
  slogan: "Always Be Casual",
  evp: "We Are A Team – Come Join Us",
  gioiThieu: "ATINO là chuỗi thời trang nam với khoảng 13 năm phát triển, có cửa hàng trên toàn quốc. Tinh thần “Always Be Casual”: thoải mái, tự tin, đúng chất.",
  usp: [
    "Thử việc chỉ 1 tháng",
    "Phụ cấp nhiều lớp: ăn ca, chuyên cần, thâm niên",
    "Phỏng vấn gọn 1 vòng",
    "Thương hiệu uy tín ~13 năm, chuỗi toàn quốc"
  ]
};

/* Câu mở đầu (hook) gợi ý — chọn 1 rồi sửa */
const HOOK_IDEAS = [
  "Thử việc chỉ 1 tháng — đi làm là có đủ phụ cấp, không chờ lâu.",
  "Phỏng vấn gọn 1 vòng, có kết quả trong 2 ngày.",
  "Thu nhập [X–Y] triệu/tháng + phụ cấp ăn ca, chuyên cần, thâm niên.",
  "Bạn mê thời trang nam và thích nói chuyện với khách? Chỗ này dành cho bạn.",
  "Làm ở chuỗi thời trang nam 13 năm — Always Be Casual."
];
const WHY_IDEAS = [
  ...BRAND.usp,
  "Đội nhóm thân thiện — We Are A Team",
  "Được đào tạo sản phẩm & kỹ năng bán hàng từ đầu",
  "Lộ trình lên trưởng ca / cửa hàng trưởng rõ ràng",
  "Văn hoá: phục vụ khách bằng cả trái tim, thương đồng đội"
];
const CTA_IDEAS = [
  "Nhắn Zalo [SĐT] — ghi “Ứng tuyển + tên cửa hàng” để được hẹn phỏng vấn.",
  "Bình luận “Quan tâm”, mình gửi link ứng tuyển ngay.",
  "Bấm vào link ở bình luận đầu tiên để ứng tuyển (chỉ 2 phút).",
  "Nộp hồ sơ ngay trên trang này — ATINO phản hồi trong 2 ngày."
];
/* Việc chính & quyền lợi mặc định theo nhóm (chỉ là gợi ý để sửa) */
const JD_DEFAULTS = {
  Mass: {
    viec: ["Đón khách, tư vấn và giúp khách chọn đồ phù hợp", "Thu ngân, gói hàng, hướng dẫn đổi trả", "Sắp xếp, trưng bày hàng hoá gọn đẹp", "Kiểm kho, nhận hàng theo ca"],
    quyenLoi: ["Tổng thu nhập [X–Y] triệu/tháng (lương + thưởng doanh số)", "Phụ cấp ăn ca, chuyên cần, thâm niên", "Thử việc 1 tháng, được đào tạo từ đầu", "Đóng BHXH đầy đủ khi chính thức, giảm giá khi mua hàng"]
  },
  BackOffice: {
    viec: ["[Việc chuyên môn chính 1]", "[Việc chuyên môn chính 2]", "Phối hợp với cửa hàng và các phòng ban", "Báo cáo định kỳ cho quản lý"],
    quyenLoi: ["Lương [X–Y] triệu/tháng + thưởng", "Làm giờ hành chính, môi trường thân thiện", "BHXH đầy đủ, nghỉ phép năm", "Được đào tạo, có lộ trình phát triển"]
  },
  QuanLy: {
    viec: ["Quản lý doanh số và vận hành cửa hàng", "Tuyển, đào tạo và xếp ca cho đội ngũ", "Đảm bảo trải nghiệm khách hàng theo chuẩn ATINO", "Báo cáo kết quả kinh doanh cho quản lý khu vực"],
    quyenLoi: ["Tổng thu nhập [X–Y] triệu/tháng + thưởng doanh số cửa hàng", "Phụ cấp trách nhiệm, thâm niên", "Lộ trình lên quản lý khu vực", "BHXH đầy đủ, chế độ phúc lợi"]
  }
};
const POST_TIPS = [
  "Ưu tiên <b>ảnh thật</b> của cửa hàng / đồng nghiệp ATINO. Tránh ảnh AI vẽ người — ứng viên mất tin tưởng.",
  "Đăng FB: để <b>link ở bình luận đầu tiên</b>, đừng để trong bài (FB giảm hiển thị bài có link).",
  "Chỉ <b>1 lời kêu gọi (CTA)</b> — nhiều lựa chọn quá ứng viên không làm gì cả."
];

/** Kiểm tra quy tắc đăng tin. Trả về [{ok, t}] */
function postRules(d, versions) {
  const all = [d.hook, d.thuNhap, ...(d.ly || []), ...(d.viec || []), ...(d.quyenLoi || []), d.cta].join("\n");
  const lines = Object.values(versions).join("\n").split("\n");
  const caps = lines.filter(l => { const letters = l.replace(/[^\p{L}]/gu, ""); return letters.length >= 6 && letters === letters.toUpperCase() && letters !== letters.toLowerCase(); });
  const ctaWords = /(inbox|nhắn tin|nhắn zalo|(?<![\p{L}])ib(?![\p{L}])|liên hệ|đăng ký|nộp cv|nộp hồ sơ|apply|bình luận|comment|gọi ngay)/iu;
  const extraCTA = [d.hook, ...(d.ly || []), ...(d.viec || []), ...(d.quyenLoi || [])].filter(x => ctaWords.test(String(x || ""))).length;
  const fbText = [d.hook, d.cta, ...(d.ly || []), ...(d.viec || []), ...(d.quyenLoi || [])].join(" ");
  const banned = all.match(/(khoá học|khóa học|đa cấp|kinh doanh theo mạng|việc nhẹ lương cao|thu nhập khủng|làm giàu)/i);
  const tn = String(d.thuNhap || "").trim();
  return [
    { ok: !caps.length, t: caps.length ? `Có dòng VIẾT HOA TOÀN BỘ: “${caps[0].trim().slice(0, 40)}…” — viết thường cho dễ đọc, FB không bóp tương tác.` : "Không viết HOA toàn bộ" },
    { ok: !!str(d.cta) && !extraCTA, t: !str(d.cta) ? "Chưa có lời kêu gọi (CTA) — điền ở phần A cuối." : extraCTA ? "Đang có lời kêu gọi lẫn trong các phần khác — chỉ giữ <b>1 CTA</b> ở cuối." : "Chỉ 1 lời kêu gọi (CTA)" },
    { ok: !/(https?:\/\/|www\.|\.com|\.vn)/i.test(fbText), t: /(https?:\/\/|www\.|\.com|\.vn)/i.test(fbText) ? "Có link trong bài FB — để link ở <b>bình luận</b> nhé." : "Không để link trong bài FB (link ở bình luận)" },
    { ok: !banned, t: banned ? `Có từ dễ bị chặn/mất tin tưởng: “${banned[0]}” — bỏ đi.` : "Không có từ “khoá học / đa cấp / việc nhẹ lương cao”" },
    { ok: !!tn && !/(thoả thuận|thỏa thuận|cạnh tranh|hấp dẫn)$/i.test(tn) && /\d/.test(tn), t: !tn ? "Chưa ghi <b>tổng thu nhập</b>." : /\d/.test(tn) ? "Có ghi tổng thu nhập bằng con số" : "Ghi <b>con số</b> tổng thu nhập, đừng ghi “thoả thuận/cạnh tranh”." },
    { ok: !legalCheck(all).length, t: legalCheck(all).length ? `Có tiêu chí cấm (${legalCheck(all).map(h => h.key).join(", ")}) — xoá khỏi tin đăng.` : "Không có tiêu chí cấm (tuổi, giới, ngoại hình…)" }
  ];
}

/* Kênh tuyển & gợi ý theo nhóm */
const CHANNEL_SUGGEST = {
  Mass: ["Group Facebook", "Threads", "Zalo", "Giới thiệu (referral)", "Ứng viên cũ", "Fanpage ATINO"],
  BackOffice: ["TopCV", "VietnamWorks", "Group Facebook", "LinkedIn", "Network/quen biết"],
  QuanLy: ["TopCV", "VietnamWorks", "LinkedIn", "Headhunt", "Giới thiệu (referral)"]
};
const IN_HOUSE = [
  { t: "Giới thiệu (referral)", d: "Nhờ nhân viên giới thiệu bạn bè. Thưởng <b>chia giai đoạn</b> (vd 30% khi đi làm, 70% khi qua thử việc) để giới thiệu đúng người. Làm <b>bảng xếp hạng</b> người giới thiệu nhiều nhất cho vui." },
  { t: "Ứng viên cũ (Talent Pool)", d: "Gọi lại người từng có điểm mạnh nhưng chưa hợp lúc trước — nhanh và rẻ nhất." },
  { t: "Luân chuyển nội bộ", d: "Hỏi cửa hàng gần đó có bạn nào muốn chuyển ca/chuyển chỗ không." }
];
const INCOGNITO_STEPS = [
  "Mở <b>trình duyệt ẩn danh</b> (Chrome: Ctrl+Shift+N) để Google không gợi ý theo lịch sử của bạn.",
  "Gõ đúng chữ ứng viên hay tìm, vd “tuyển nhân viên bán hàng quận 1”.",
  "Xem <b>5 kết quả đầu</b>: trang nào/nhóm nào hiện lên → đó là kênh ứng viên đang thấy.",
  "Làm tương tự trên Facebook, TikTok: xem nhóm nào đông, đăng nhiều tin tuyển."
];

function aiPromptJD({ pos, cd, d }) {
  return `Bạn là chuyên gia Marketing tuyển dụng ngành bán lẻ thời trang tại Việt Nam, viết tin tuyển cho ATINO.
Thương hiệu: ${BRAND.gioiThieu} Slogan "${BRAND.slogan}". EVP: "${BRAND.evp}".
5 giá trị cốt lõi: ${CORE_VALUES.join("; ")}.
USP (lợi thế khi tuyển): ${BRAND.usp.join("; ")}.

Vị trí: ${pos.tenViTri} · Khu vực: ${str(d.diaDiem) || str(cd.khuVuc) || "[chưa ghi]"} · Tổng thu nhập: ${str(d.thuNhap) || "[chưa ghi]"}
Kết quả mong muốn: ${JSON.stringify(cd.mucTieu || {})}
Điều kiện bắt buộc: ${(cd.mustHave || []).map(m => m.ten).join("; ") || "[không có]"}

Viết theo khung AIDA:
- hook (A): 1 câu chặn tay người đang lướt, dùng USP mạnh nhất, tối đa 20 chữ.
- ly (I): 3 lý do "vì sao chọn ATINO thay vì chỗ khác", mỗi lý do 1 dòng ngắn.
- viec (D): 3–4 việc chính, động từ đầu câu, dễ hiểu.
- quyenLoi (D): 3–4 quyền lợi, có con số nếu được.
- cta (A): ĐÚNG 1 lời kêu gọi hành động.
QUY TẮC: không viết HOA toàn bộ; không để link; không dùng từ "khoá học", "đa cấp", "việc nhẹ lương cao"; ghi tổng thu nhập bằng con số (không "thoả thuận"); TUYỆT ĐỐI không nêu tuổi, giới tính, hôn nhân, quê quán, tôn giáo, ngoại hình. Tiếng Việt, giọng gần gũi.

CHỈ TRẢ VỀ JSON đúng mẫu, không giải thích, không markdown:
{"hook": "", "ly": ["", "", ""], "viec": ["", "", ""], "quyenLoi": ["", "", ""], "thuNhap": "", "cta": ""}`;
}

function aiPromptMarket({ pos, khuVuc, jdText }) {
  return `Bạn là chuyên viên nghiên cứu thị trường tuyển dụng ngành bán lẻ thời trang tại Việt Nam.
Hãy nghiên cứu nhanh (có thể tìm trên web nếu được) cho vị trí sau của ATINO (chuỗi thời trang nam ~13 năm, toàn quốc):
- Chức danh: ${pos.tenViTri}
- Khu vực: ${khuVuc || "[ghi khu vực]"}
- Nhóm: ${pos.nhom} (Mass = cửa hàng tuyển số lượng; BackOffice = văn phòng; QuanLy = quản lý)
- Tin tuyển hiện tại: ${jdText ? "\n" + jdText.slice(0, 1500) : "[chưa có]"}

Cần trả lời:
1. Thị trường thường gọi tên vị trí này là gì (từ khoá ứng viên hay tìm).
2. Mức lương/thu nhập phổ biến tại khu vực (benchmark), ghi khoảng số.
3. 3–5 đối thủ tuyển cùng vị trí trong khu vực (thời trang/bán lẻ) và họ đang mời gọi gì.
4. USP của ATINO nên đưa lên đầu tin để thắng đối thủ.
5. 3–5 kênh nên đăng (kèm lý do ngắn). Ưu tiên kênh miễn phí/nội bộ nếu phù hợp.
6. Độ khó tuyển ở khu vực (Dễ / Trung bình / Khó) và mục tiêu số CV/tuần hợp lý.
Không đưa ra tiêu chí về tuổi, giới tính, ngoại hình, quê quán.

CHỈ TRẢ VỀ JSON đúng mẫu, không giải thích, không markdown:
{"tuKhoa": ["", ""], "luongBenchmark": "", "doiThu": [{"ten": "", "moiGoi": ""}], "uspNenDua": ["", ""], "kenhDeXuat": [{"kenh": "", "lyDo": ""}], "doKho": "Trung bình", "mucTieuCVTuan": 20}`;
}
