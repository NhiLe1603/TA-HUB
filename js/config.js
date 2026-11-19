/* =============================================================
 * ATINO TA HUB — CẤU HÌNH: 8 MODULE · KHOÁ/MỞ TÍNH NĂNG · LUỒNG BƯỚC TIẾP THEO
 *
 * 👉 MUỐN MỞ / KHOÁ 1 TÍNH NĂNG: đổi  open: true / false  trong FEATURES bên dưới,
 *    lưu file rồi upload lại lên GitHub. Không cần sửa chỗ nào khác.
 * ============================================================= */
"use strict";

const FEATURES = {
  chanDung:  { open: true,  ico: "🎯", t: "Chân dung ứng viên",            d: "Khai thác HM, viết loại cứng & kết quả 30/60/90 ngày cho từng vị trí." },
  jd:        { open: true,  ico: "✍️", t: "Viết JD & tin đăng",            d: "Ghép tin đăng theo AIDA, ra 3 bản cho Facebook, Fanpage, trang tuyển dụng." },
  nguon:     { open: false, ico: "📣", t: "Kế hoạch nguồn & Talent Pool",  d: "Nghiên cứu thị trường, chọn kênh, đặt mục tiêu CV/tuần, đo theo người đi làm." },
  scorecard: { open: true,  ico: "📐", t: "Xây dựng Scorecard",            d: "Tiêu chí CWC, trọng số, mô tả 4 mức — thước đo chung cho lọc CV và phỏng vấn." },
  locCV:     { open: false, ico: "📄", t: "Sàng lọc hồ sơ (Lọc CV)",       d: "Chấm CV theo scorecard, có AI đối chiếu." },
  ungVien:   { open: false, ico: "👥", t: "Quản lý ứng viên & pipeline",   d: "Danh sách ứng viên, chuyển trạng thái, bàn giao HM, từ chối tử tế, Talent Pool." },
  soVan:     { open: false, ico: "📞", t: "Phiếu sơ vấn (STAR)",           d: "Phiếu gọi sơ bộ 6 phần, câu hỏi gợi ý, chấm điểm ngay." },
  soSanh:    { open: false, ico: "⚖️", t: "So sánh ứng viên",              d: "Bảng điểm ứng viên × tiêu chí, xếp hạng, gợi ý chọn." },
  offer:     { open: false, ico: "🤝", t: "Offer & Onboarding",            d: "Thư mời nhận việc, checklist ngày đầu đi làm.", chuaCo: true },
  kpi:       { open: true,  ico: "📊", t: "KPI từng TA",                   d: "Đặt chỉ tiêu và theo dõi kết quả tuyển dụng theo tháng cho từng TA." },
  nhatKy:    { open: true,  ico: "📜", t: "Nhật ký hoạt động",             d: "Ai làm gì, lúc nào — cả team." },
  hoc:       { open: true,  ico: "📘", t: "Học (E-learning)",              d: "Bài giảng, bộ skill AI và sơ đồ SOP theo 8 module." }
};
const isOpen = f => !FEATURES[f] || FEATURES[f].open;

/* 8 module — tên & thứ tự đúng theo chương trình đào tạo */
const MODULES = [
  { so: 1, ten: "Kỹ năng phân tích & xử lý nhu cầu tuyển dụng (chân dung ứng viên)", ngan: "Chân dung ứng viên", features: [{ f: "chanDung", href: "#/positions" }] },
  { so: 2, ten: "Thiết kế mô tả công việc (JD & Job Posting) theo từng chân dung", ngan: "JD & tin đăng", features: [{ f: "jd", href: "#/tools/jd" }] },
  { so: 3, ten: "Quy hoạch & lựa chọn nguồn tuyển dụng; xây dựng Talent Pool & tuyển dụng chủ động", ngan: "Nguồn tuyển & Talent Pool", features: [{ f: "nguon", href: "#/tools/nguon" }] },
  { so: 4, ten: "Xây dựng Scorecard & kỹ năng sàng lọc hồ sơ", ngan: "Scorecard & sàng lọc", features: [{ f: "scorecard", href: "#/scorecard" }, { f: "locCV", href: "#/tools/loc-cv" }] },
  { so: 5, ten: "Thiết kế quy trình tuyển dụng & trải nghiệm ứng viên", ngan: "Quy trình & trải nghiệm ứng viên", features: [{ f: "ungVien", href: "#/candidates" }] },
  { so: 6, ten: "Kỹ thuật phỏng vấn & đánh giá ứng viên", ngan: "Phỏng vấn & đánh giá", features: [{ f: "soVan", href: "#/tools/so-van" }, { f: "soSanh", href: "#/tools/so-sanh" }] },
  { so: 7, ten: "Offer & Onboarding", ngan: "Offer & Onboarding", features: [{ f: "offer", href: "" }] },
  { so: 8, ten: "Đo lường & báo cáo tuyển dụng", ngan: "Đo lường & báo cáo", features: [{ f: "kpi", href: "#/kpi" }, { f: "nhatKy", href: "#/activity" }] }
];
const moduleOf = f => MODULES.find(m => m.features.some(x => x.f === f));

/* Màn hình nào thuộc tính năng nào (để chặn khi đang khoá) */
function featureForRoute(route, id, query) {
  if (route === "candidates" || route === "candidate") return "ungVien";
  if (route === "positions") return "chanDung";
  if (route === "scorecard") return "scorecard";
  if (route === "position") return query && query.get("tab") === "scorecard" ? "scorecard" : "chanDung";
  if (route === "kpi") return "kpi";
  if (route === "activity") return "nhatKy";
  if (route === "learn") return "hoc";
  if (route === "tools") return { "loc-cv": "locCV", "so-van": "soVan", jd: "jd", nguon: "nguon", "so-sanh": "soSanh" }[id] || null;
  return null;
}
function lockedView(f) {
  const x = FEATURES[f] || {}, m = moduleOf(f);
  return `<div class="card locked-page"><div class="lock-ico">🔒</div>
    <h2>${esc(x.t || "Tính năng")} — đang tạm khoá</h2>
    <p class="muted" style="margin:6px 0 12px">${x.chuaCo ? "Tính năng đang được xây dựng" : "Tính năng đã có nhưng đang tạm khoá"}, <b>sẽ mở sau</b>.</p>
    <p class="small" style="margin-bottom:14px">${esc(x.d || "")}</p>
    ${m ? `<p class="small muted" style="margin-bottom:14px">Thuộc Module ${m.so}: ${esc(m.ten)}</p>` : ""}
    <div class="btn-row" style="justify-content:center">
      ${m ? `<a class="btn primary" href="#/learn" data-act="openLesson" data-id="m${m.so}">📘 Học Module ${m.so} trong lúc chờ</a>` : ""}
      <a class="btn" href="#/home">🏠 Về trang chủ</a></div></div>`;
}

/* ---------- LUỒNG LÀM VIỆC THEO TỪNG VỊ TRÍ ---------- */
const WORKFLOW = [
  { id: "m1", so: 1, f: "chanDung", ten: "Chân dung ứng viên", href: p => `#/position/${encodeURIComponent(p)}?tab=chandung`,
    done: p => { const cd = asObj(p.chanDung); return (cd.mustHave || []).length > 0 || !!str((cd.mucTieu || {}).d30) || !!str(cd.moTaHM); } },
  { id: "m2", so: 2, f: "jd", ten: "JD & tin đăng", href: p => `#/tools/jd?pos=${encodeURIComponent(p)}`, done: p => !!p.jd },
  { id: "m3", so: 3, f: "nguon", ten: "Nguồn tuyển & Talent Pool", href: p => `#/tools/nguon?pos=${encodeURIComponent(p)}`, done: p => (asObj(p.nguon).kenh || []).length > 0 },
  { id: "m4", so: 4, f: "scorecard", ten: "Scorecard", href: p => `#/position/${encodeURIComponent(p)}?tab=scorecard`, done: p => hasScorecard(p) },
  { id: "m4b", so: 4, f: "locCV", ten: "Sàng lọc hồ sơ", href: () => `#/tools/loc-cv`, done: p => Store.candidates.some(c => String(c.posId) === String(p.posId) && toNum(c.diemCV) !== null) },
  { id: "m5", so: 5, f: "ungVien", ten: "Quy trình & trải nghiệm ứng viên", href: p => `#/candidates?posId=${encodeURIComponent(p)}`, done: p => Store.candidates.some(c => String(c.posId) === String(p.posId) && MAIN_STAGES.indexOf(stageOf(c)) >= 3) },
  { id: "m6", so: 6, f: "soVan", ten: "Phỏng vấn & đánh giá", href: () => `#/tools/so-van`, done: p => Store.candidates.some(c => String(c.posId) === String(p.posId) && toNum(c.diemSoVan) !== null) },
  { id: "m7", so: 7, f: "offer", ten: "Offer & Onboarding", href: () => "", done: p => Store.candidates.some(c => String(c.posId) === String(p.posId) && stageOf(c) === "Nhận việc") }
];
function stepsFor(p) { return WORKFLOW.map(s => ({ ...s, ok: !!p && s.done(p), open: isOpen(s.f) })); }
/** Bước nên làm tiếp cho 1 vị trí (bước đang mở, chưa xong, đứng sau `afterId` nếu có) */
function nextStep(p, afterId) {
  const steps = stepsFor(p);
  const start = afterId ? steps.findIndex(s => s.id === afterId) + 1 : 0;
  return steps.slice(start).find(s => s.open && !s.ok) || null;
}
/** Thanh tiến trình nhỏ của 1 vị trí: các ô theo số module, ✓ xong · 🔒 khoá */
function miniSteps(p, curId) {
  return `<span class="mini-steps">${stepsFor(p).filter(s => s.id !== "m4b").map(s =>
    `<span class="ms ${s.ok ? "ok" : ""} ${!s.open ? "lock" : ""} ${s.id === curId ? "cur" : ""}" title="${esc(s.so + " · " + s.ten)}${s.open ? "" : " (tạm khoá)"}">${s.ok ? "✓" : s.open ? s.so : "🔒"}</span>`).join("")}</span>`;
}
/** Thanh bước to ở đầu các màn làm việc của 1 vị trí */
function workflowBar(p, curId) {
  if (!p) return "";
  return `<div class="wf-bar">${stepsFor(p).filter(s => s.id !== "m4b").map(s => {
    const inner = `<span class="wf-dot">${s.ok ? "✓" : s.open ? s.so : "🔒"}</span><span class="wf-lbl">${esc(s.ten)}</span>`;
    const cls = `wf-step ${s.ok ? "ok" : ""} ${!s.open ? "lock" : ""} ${s.id === curId ? "cur" : ""}`;
    return s.open && s.href(p.posId) ? `<a class="${cls}" href="${s.href(p.posId)}">${inner}</a>` : `<span class="${cls}" data-act="lockedFeature" data-f="${s.f}">${inner}</span>`;
  }).join("")}</div>`;
}
/** Thẻ "Bước tiếp theo" — hiện sau khi làm xong 1 bước */
function nextStepCard(p, curId) {
  if (!p) return "";
  const nx = nextStep(p, curId) || nextStep(p);
  const skipped = (() => {
    const steps = stepsFor(p), i = steps.findIndex(s => s.id === curId), j = nx ? steps.findIndex(s => s.id === nx.id) : steps.length;
    return steps.slice(i + 1, j).filter(s => !s.open).map(s => s.so);
  })();
  if (!nx) {
    return `<div class="card next-card done"><div class="next-ico">🎉</div><div><b>Xong các bước đang mở cho vị trí “${esc(p.tenViTri)}”.</b>
      <div class="small muted">Các bước còn lại đang tạm khoá, sẽ mở sau. Trong lúc chờ, bạn có thể học các module tiếp theo hoặc tạo vị trí khác.</div>
      <div class="btn-row" style="margin-top:10px"><a class="btn primary" href="#/learn">📘 Học tiếp</a><a class="btn" href="#/position/new">＋ Vị trí mới</a></div></div></div>`;
  }
  return `<div class="card next-card"><div class="next-ico">➡️</div><div><div class="small muted">Bước tiếp theo</div>
    <b>Bước ${nx.so} · ${esc(nx.ten)}</b>
    ${skipped.length ? `<div class="small muted">(Bước ${skipped.join(", ")} đang tạm khoá — tạm bỏ qua)</div>` : ""}
    <div class="btn-row" style="margin-top:10px"><a class="btn primary" href="${nx.href(p.posId)}">Làm bước ${nx.so} ngay →</a></div></div></div>`;
}
/** Sau khi lưu xong 1 bước: chuyển thẳng sang bước tiếp theo đang mở */
function goNextAfter(posId, curId, stayHash) {
  const p = findPos(posId);
  const nx = p ? nextStep(p, curId) : null;
  if (nx) go(nx.href(posId) + (nx.href(posId).includes("?") ? "&" : "?") + "from=" + curId);
  else go(stayHash + (stayHash.includes("?") ? "&" : "?") + "from=" + curId);
}
/** Dải thông báo "Đã xong bước trước" ở đầu màn */
function fromBanner(query, p, curId) {
  const from = query && query.get("from");
  if (!from || !p) return "";
  const prev = WORKFLOW.find(s => s.id === from);
  if (!prev) return "";
  if (from === curId) return nextStepCard(p, curId);
  const cur = WORKFLOW.find(s => s.id === curId);
  const i = WORKFLOW.indexOf(prev), j = WORKFLOW.indexOf(cur);
  const skipped = WORKFLOW.slice(i + 1, j).filter(s => !isOpen(s.f)).map(s => s.so);
  return `<div class="from-banner">✅ Đã lưu <b>Bước ${prev.so} · ${esc(prev.ten)}</b>. Giờ làm <b>Bước ${cur.so} · ${esc(cur.ten)}</b> cho “${esc(p.tenViTri)}”.${skipped.length ? ` <span class="small muted">(Bước ${skipped.join(", ")} đang tạm khoá — tạm bỏ qua)</span>` : ""}</div>`;
}

/* ---------- RIÊNG TỪNG NGƯỜI ---------- */
const userSlug = () => str(getUser()).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^A-Za-z0-9]+/g, "").toLowerCase() || "khach";
/** Vị trí "của bạn": bạn tạo/sửa (theo nhật ký) hoặc bạn là người cập nhật gần nhất */
function myPositions() {
  const u = getUser();
  const touched = new Set(Store.logs.filter(l => str(l.ta) === u && l.loai === "vi-tri").map(l => String(l.doiTuongId)));
  return Store.positions.filter(p => touched.has(String(p.posId)) || str(p.nguoiCapNhat) === u)
    .sort((a, b) => new Date(b.ngayCapNhat || 0) - new Date(a.ngayCapNhat || 0));
}
