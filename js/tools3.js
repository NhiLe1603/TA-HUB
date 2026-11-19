/* =============================================================
 * ATINO TA HUB — PHA 3: VIẾT JD & TIN ĐĂNG (AIDA) · TẠO NGUỒN · SO SÁNH ỨNG VIÊN
 * ============================================================= */
"use strict";

// Thêm kênh vào danh sách "Nguồn" của ứng viên (trước "Khác")
["Threads", "Zalo", "LinkedIn", "Headhunt", "Network/quen biết"].forEach(s => {
  if (!SOURCES.includes(s)) SOURCES.splice(Math.max(0, SOURCES.indexOf("Khác")), 0, s);
});
Object.assign(TIPS, {
  aida: "<b>AIDA</b> = 4 bước giữ chân người đọc:<br><b>A</b>ttention – câu đầu chặn tay lướt<br><b>I</b>nterest – vì sao chọn ATINO<br><b>D</b>esire – việc làm & quyền lợi<br><b>A</b>ction – 1 lời kêu gọi duy nhất",
  jdVsPost: "<b>JD</b> (mô tả công việc) là tài liệu nội bộ. <b>Tin đăng</b> là bản “phiên dịch” JD cho ứng viên đọc — viết như quảng cáo, ngắn, hấp dẫn.",
  usp: "<b>USP</b> = điểm mạnh riêng khiến ứng viên chọn ATINO thay vì chỗ khác: thử việc 1 tháng, phụ cấp nhiều lớp, phỏng vấn 1 vòng, thương hiệu 13 năm.",
  hieuQua: "Đo kênh theo <b>số người đi làm thật</b>, không theo số CV. Kênh ra 100 CV mà 0 người đi làm là kênh tệ.",
  soSanh: "Bảng chỉ <b>xếp lại điểm đã chấm theo phiếu</b>. Đừng so người với người theo cảm giác (bẫy so sánh) — so ai sát phiếu điểm hơn."
});

const posAndPortrait = id => { const p = findPos(id); return { p, cd: p ? asObj(p.chanDung) : {} }; };
function parseJD(p) {
  if (!p || !p.jd) return null;
  if (typeof p.jd === "object") return p.jd;
  try { return JSON.parse(p.jd); } catch (e) { return { raw: String(p.jd) }; }
}
function posPickerHtml(tool, posId, note) {
  const list = Store.positions.slice().sort((a, b) => str(a.tenViTri).localeCompare(str(b.tenViTri), "vi"));
  return `<div class="card"><div class="field-label">Vị trí</div>
    <select class="input" data-change="pickPosTool" data-tool="${tool}" aria-label="Chọn vị trí"><option value="">— Chọn vị trí —</option>
    ${list.map(p => `<option value="${esc(p.posId)}" ${String(p.posId) === String(posId) ? "selected" : ""}>${esc(p.tenViTri)}</option>`).join("")}</select>
    ${note || ""}</div>`;
}
function noPosBlock() {
  return Store.positions.length
    ? `<div class="card">${emptyBlock("👆", "Chọn vị trí để bắt đầu", "Chọn ở ô phía trên.")}</div>`
    : `<div class="card">${emptyBlock("💼", "Chưa có vị trí nào", "Tạo vị trí trước, rồi quay lại đây.", `<a class="btn primary" href="#/position/new">＋ Tạo vị trí</a>`)}</div>`;
}
function initScope(scope, key, makeFresh) {
  if (D[scope + "Key"] === key && D[scope]) return;
  D[scope + "Key"] = key;
  D[scope] = loadDraft(key) || makeFresh();
}
function slugTag(s) {
  return str(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").slice(0, 4).map(w => w.toLowerCase()).join("");
}
const cleanLines = arr => (arr || []).map(str).filter(Boolean);
const joinBlocks = lines => lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

/* =============================================================
 * A. VIẾT JD & TIN ĐĂNG (AIDA)
 * ============================================================= */
function freshJD(p, cd) {
  const saved = parseJD(p);
  if (saved && saved.aida) return Object.assign({ tab: "fb" }, clone(saved.aida), { posId: p.posId });
  const def = JD_DEFAULTS[p.nhom] || JD_DEFAULTS.Mass;
  return { posId: p.posId, tab: "fb", diaDiem: str(cd.khuVuc), thuNhap: "", hook: "", ly: BRAND.usp.slice(0, 3), viec: def.viec.slice(), quyenLoi: def.quyenLoi.slice(), cta: "" };
}
function buildVersions(p, cd, d) {
  const vt = str(p.tenViTri), dd = str(d.diaDiem), tn = str(d.thuNhap), hook = str(d.hook), cta = str(d.cta);
  const ly = cleanLines(d.ly), viec = cleanLines(d.viec), ql = cleanLines(d.quyenLoi);
  const b = (arr, ic) => arr.map(x => `${ic} ${x}`).join("\n");
  const yc = (cd.mustHave || []).map(m => str(m.ten)).filter(t => t && !/(lương|thu nhập)/i.test(t));
  const fb = joinBlocks([
    `Mình đang tìm bạn đồng hành cho ATINO${dd ? " " + dd : ""} nè 👋`, "", hook, "",
    ly.length ? "💙 Vì sao nên chọn ATINO?" : "", b(ly, "✅"), "",
    viec.length ? `🧥 Công việc ${vt}:` : "", b(viec, "•"), "",
    ql.length || tn ? "🎁 Quyền lợi:" : "", b(ql, "•"), tn ? `💰 Tổng thu nhập: ${tn}` : "", dd ? `📍 Làm tại: ${dd}` : "", "",
    cta ? `👉 ${cta}` : "", "", "(Link ứng tuyển mình để ở bình luận đầu tiên nha)"
  ]);
  const fanpage = joinBlocks([
    `ATINO tuyển ${vt}${dd ? " – " + dd : ""} ✨`, "", hook, "", `${BRAND.slogan} — ${BRAND.evp}!`, "",
    ly.length ? "Vì sao chọn ATINO:" : "", b(ly, "✅"), "",
    viec.length ? "Bạn sẽ làm:" : "", b(viec, "🔹"), "",
    ql.length || tn ? "Bạn nhận được:" : "", b(ql, "🎁"), tn ? `💰 Tổng thu nhập: ${tn}` : "", dd ? `📍 ${dd}` : "", "",
    cta ? `👉 ${cta}` : "", "", `#ATINO #AlwaysBeCasual #tuyendung${slugTag(vt) ? " #" + slugTag(vt) : ""}`
  ]);
  const jobsite = joinBlocks([
    `Tiêu đề: ${vt}${dd ? " – " + dd : ""}${tn ? " – Thu nhập " + tn : ""}`, "",
    "Về ATINO", BRAND.gioiThieu, `Giá trị cốt lõi: ${CORE_VALUES.join(" · ")}.`, "",
    hook, "",
    viec.length ? "Mô tả công việc" : "", b(viec, "-"), "",
    yc.length ? "Yêu cầu" : "", b(yc, "-"), "",
    ql.length || tn ? "Quyền lợi" : "", b(ql, "-"), tn ? `- Tổng thu nhập: ${tn}` : "", "",
    ly.length ? "Vì sao chọn ATINO" : "", b(ly, "-"), "",
    cta ? "Cách ứng tuyển" : "", cta
  ]);
  return { fb, fanpage, jobsite };
}
const JD_TABS = { fb: "Facebook cá nhân", fanpage: "Fanpage ATINO", jobsite: "Trang tuyển dụng (Jobsite)" };
function jdRulesHtml(p, cd) {
  const rules = postRules(D.jd, buildVersions(p, cd, D.jd));
  const bad = rules.filter(r => !r.ok).length;
  return `<div class="rules ${bad ? "bad" : "ok"}"><b>${bad ? `⚠️ ${bad} điều cần sửa trước khi đăng` : "✅ Đạt đủ quy tắc đăng tin"}</b>
    <ul class="rule-list">${rules.map(r => `<li class="${r.ok ? "ok" : "bad"}">${r.ok ? "✓" : "✕"} ${r.t}</li>`).join("")}</ul></div>`;
}
function jdPreviewHtml(p, cd) {
  const v = buildVersions(p, cd, D.jd);
  const tab = D.jd.tab || "fb";
  return `<div class="chips scroll" style="margin-bottom:10px">${Object.keys(JD_TABS).map(k => `<button class="chip ${tab === k ? "on" : ""}" data-act="jdTab" data-val="${k}" type="button">${JD_TABS[k]}</button>`).join("")}</div>
    <pre class="post">${esc(v[tab])}</pre>
    <div class="btn-row" style="margin-top:10px"><button class="btn primary" data-act="jdCopy" data-val="${tab}" type="button">📋 Copy bản ${esc(JD_TABS[tab])}</button></div>`;
}
function listEditor(scope, field, ph, max, ideas) {
  const arr = D[scope][field] || [];
  return `${arr.map((_, i) => `<div class="list-item">${bound(scope, `${field}.${i}`, { ph, lint: "legal" })}
      <button class="icon-btn" data-act="listDel" data-scope="${scope}" data-field="${field}" data-i="${i}" type="button" aria-label="Xoá">✕</button></div>`).join("")}
    ${arr.length < max ? `<button class="btn sm ghost" style="padding-left:0" data-act="listAdd" data-scope="${scope}" data-field="${field}" type="button">＋ Thêm dòng</button>` : ""}
    ${ideas ? `<div class="chips small-chips">${ideas.filter(x => !arr.includes(x)).map(x => `<button class="chip" data-act="listIdea" data-scope="${scope}" data-field="${field}" data-val="${esc(x)}" type="button">＋ ${esc(x)}</button>`).join("")}</div>` : ""}`;
}
function ideaChips(field, ideas) {
  return `<div class="chips small-chips">${ideas.map(x => `<button class="chip" data-act="jdIdea" data-field="${field}" data-val="${esc(x)}" type="button">${esc(x)}</button>`).join("")}</div>`;
}

function viewJD(query) {
  const posId = query.get("pos");
  const { p, cd } = posAndPortrait(posId);
  let html = p ? workflowBar(p, "m2") + fromBanner(query, p, "m2") : "";
  html += pageHead(`✍️ Bước 2 · JD & tin đăng ${tip("aida")}`,
    "điền 4 phần theo <b>AIDA</b> (phần lớn bấm chọn) → app ghép sẵn <b>3 bản</b> cho Facebook cá nhân, Fanpage, trang tuyển dụng. Bấm Copy là đăng.");
  html += posPickerHtml("jd", posId);
  if (!p) return html + (posId && !Store.state.hasData && isConnected() ? loadingBlock() : noPosBlock());
  initScope("jd", "jd_" + p.posId, () => freshJD(p, cd));
  const d = D.jd;
  const saved = parseJD(p);
  if (loadDraft(D.jdKey)) html += `<div class="banner" style="margin:0 0 14px"><span>📝 Bản nháp trên máy — <b>chưa lưu lên Sheet</b>.</span><button class="btn sm" data-act="discardDraft" data-scope="jd" type="button">Bỏ nháp</button></div>`;
  if (saved && saved.raw) html += `<details class="card"><summary><b>Tin cũ đã lưu (dạng chữ)</b></summary><pre class="post">${esc(saved.raw)}</pre></details>`;

  html += `<div class="card"><div class="card-head"><h2>⚡ Bắt đầu nhanh</h2></div>
    <p class="small muted" style="margin-bottom:10px">Phần lớn đã điền sẵn theo vị trí. Muốn AI viết hay hơn thì bấm nút dưới. ${tip("jdVsPost")}</p>
    <button class="btn primary" data-act="jdAI" type="button">🤖 Nhờ AI viết</button></div>`;

  html += `<div class="card"><div class="card-head"><h2>📌 Thông tin chung</h2></div>
    <label class="field"><span>Địa điểm làm việc</span>${bound("jd", "diaDiem", { ph: "VD: ATINO 123 Lê Lợi, Q.1, TP.HCM" })}</label>
    <label class="field" style="margin-bottom:0"><span>Tổng thu nhập <span class="req">*</span></span>${bound("jd", "thuNhap", { ph: "VD: 8–10 triệu/tháng (ghi con số, đừng ghi “thoả thuận”)" })}</label></div>`;

  html += `<div class="card"><div class="card-head"><h2><span class="snum">A</span> Câu mở đầu (hook)</h2></div>
    <p class="small muted" style="margin-bottom:8px">1 câu chặn tay người đang lướt. Dùng điểm mạnh nhất (USP ${tip("usp")}). Bấm 1 gợi ý rồi sửa:</p>
    ${ideaChips("hook", HOOK_IDEAS)}
    ${bound("jd", "hook", { area: true, ph: "VD: Thử việc chỉ 1 tháng — đi làm là có đủ phụ cấp.", lint: "legal" })}</div>`;

  html += `<div class="card"><div class="card-head"><h2><span class="snum">I</span> Vì sao chọn ATINO?</h2></div>
    <p class="small muted" style="margin-bottom:8px">2–4 lý do khiến ứng viên chọn ATINO thay vì chỗ khác.</p>
    ${listEditor("jd", "ly", "VD: Phỏng vấn gọn 1 vòng", 4, WHY_IDEAS)}</div>`;

  html += `<div class="card"><div class="card-head"><h2><span class="snum">D</span> Việc làm & quyền lợi</h2></div>
    <div class="field-label">3–4 việc chính</div>${listEditor("jd", "viec", "VD: Tư vấn, giúp khách chọn đồ", 4)}
    <div class="divider"></div>
    <div class="field-label">3–4 quyền lợi (có con số càng tốt)</div>${listEditor("jd", "quyenLoi", "VD: Phụ cấp ăn ca 30.000đ/ca", 4)}</div>`;

  html += `<div class="card"><div class="card-head"><h2><span class="snum">A</span> Lời kêu gọi (CTA) — chỉ 1</h2></div>
    ${ideaChips("cta", CTA_IDEAS)}
    ${bound("jd", "cta", { ph: "VD: Nhắn Zalo 09xx xxx xxx để được hẹn phỏng vấn", lint: "legal" })}</div>`;

  html += `<div class="card"><div class="card-head"><h2>✅ Kiểm tra quy tắc đăng</h2></div><div id="jdRules">${jdRulesHtml(p, cd)}</div>
    <ul class="tight small" style="margin-top:10px">${POST_TIPS.map(t => `<li>${t}</li>`).join("")}</ul></div>`;
  html += `<div class="card"><div class="card-head"><h2>👀 3 bản tin đăng</h2></div><div id="jdPreview">${jdPreviewHtml(p, cd)}</div>
    <div class="divider"></div>
    <div class="btn-row"><button class="btn primary" data-act="jdSave" type="button">💾 Lưu tin đăng vào vị trí</button>${backupBtn()}</div>
    ${saved && saved.capNhat ? `<p class="small muted" style="margin-top:8px">Lần lưu trước: ${esc(fmtDate(saved.capNhat, true))}${saved.by ? " · " + esc(saved.by) : ""}</p>` : ""}</div>`;
  if (p.jd) html += nextStepCard(p, "m2");
  return html;
}

/* =============================================================
 * B. TẠO NGUỒN (SOURCING)
 * ============================================================= */
function freshSourcing(p, cd) {
  const n = asObj(p.nguon);
  if (n.kenh || n.research) return Object.assign({ research: {}, kenh: [], ghiChu: "" }, clone(n), { posId: p.posId });
  return { posId: p.posId, khuVuc: str(cd.khuVuc), research: {}, kenh: [], ghiChu: "" };
}
const funnelIdx = c => MAIN_STAGES.indexOf(stageOf(c));
function channelStats(posId) {
  const map = {};
  Store.candidates.filter(c => String(c.posId) === String(posId)).forEach(c => {
    const k = str(c.nguon) || "(chưa ghi nguồn)";
    const m = map[k] || (map[k] = { cv: 0, sv: 0, join: 0 });
    m.cv++;
    if (funnelIdx(c) >= 2) m.sv++;
    if (stageOf(c) === "Nhận việc") m.join++;
  });
  return map;
}
const fmtMoney = n => (+n || 0).toLocaleString("vi-VN") + "đ";
function planTotalsHtml() {
  const k = D.sg.kenh || [];
  const budget = k.reduce((s, x) => s + (+x.nganSach || 0), 0);
  const target = k.reduce((s, x) => s + (+x.mucTieu || 0), 0);
  return `<div class="compare"><div><span class="lbl">Số kênh</span><b>${k.length}</b></div>
    <div><span class="lbl">Tổng ngân sách</span><b class="small-b">${fmtMoney(budget)}</b></div>
    <div><span class="lbl">Mục tiêu CV/tuần</span><b>${target}</b></div></div>`;
}
function viewSourcing(query) {
  const posId = query.get("pos");
  let html = `<a class="back" href="#/tools">← Công cụ</a>` + pageHead("📣 Tạo nguồn",
    "đừng “đăng rồi đợi”. Tìm hiểu thị trường → chọn kênh đúng chỗ ứng viên đang ở → đặt mục tiêu → đo bằng <b>số người đi làm thật</b>.");
  html += posPickerHtml("nguon", posId);
  const { p, cd } = posAndPortrait(posId);
  if (!p) return html + (posId && !Store.state.hasData && isConnected() ? loadingBlock() : noPosBlock());
  initScope("sg", "sg_" + p.posId, () => freshSourcing(p, cd));
  const d = D.sg;
  d.research = d.research || {};
  if (loadDraft(D.sgKey)) html += `<div class="banner" style="margin:0 0 14px"><span>📝 Bản nháp trên máy — <b>chưa lưu lên Sheet</b>.</span><button class="btn sm" data-act="discardDraft" data-scope="sg" type="button">Bỏ nháp</button></div>`;

  // 1. Market research
  html += `<div class="card"><div class="card-head"><h2><span class="snum">1</span> Tìm hiểu thị trường (Market Research)</h2></div>
    <p class="small muted" style="margin-bottom:10px">Biết lương thị trường, đối thủ, tên gọi vị trí → tin đăng trúng hơn. Làm 5 phút với AI:</p>
    <label class="field"><span>Khu vực tuyển</span>${bound("sg", "khuVuc", { ph: "VD: Quận 1, TP.HCM" })}</label>
    <ol class="ai-steps">
      <li><button class="btn sm primary" data-act="copyMarketPrompt" type="button">📋 Copy prompt Market Research</button> → dán vào <b>ChatGPT</b>/<b>Claude</b> (nên bật tìm web nếu có).</li>
      <li>Dán kết quả AI vào đây:<textarea class="input" id="aiPaste" rows="3" placeholder='Dán kết quả AI (dạng {"tuKhoa": …})'></textarea>
        <div class="field-error" id="aiErr"></div>
        <button class="btn sm primary" style="margin-top:8px" data-act="fillMarket" type="button">✨ Tự điền</button></li>
    </ol>
    <div class="divider"></div>
    <div class="field-label">Tóm tắt (sửa tay được)</div>
    <label class="field"><span class="small">Từ khoá ứng viên hay tìm</span>${bound("sg", "research.tuKhoa", { ph: "VD: tuyển nhân viên bán hàng quận 1, việc làm bán quần áo" })}</label>
    <label class="field"><span class="small">Lương thị trường (benchmark)</span>${bound("sg", "research.luongBenchmark", { ph: "VD: 7–9 triệu/tháng" })}</label>
    <label class="field"><span class="small">Đối thủ đang tuyển & họ mời gọi gì</span>${bound("sg", "research.doiThu", { area: true, ph: "VD: Routine – lương 8tr + thưởng; Biluxury – thử việc 2 tháng" })}</label>
    <label class="field"><span class="small">USP nên đưa lên đầu tin ${tip("usp")}</span>${bound("sg", "research.usp", { area: true, ph: "VD: Thử việc chỉ 1 tháng (đối thủ 2 tháng)" })}</label>
    <div class="field"><span class="field-label small">Độ khó tuyển ở khu vực</span>
      <div class="chips">${["Dễ", "Trung bình", "Khó"].map(k => `<button class="chip ${d.research.doKho === k ? "on" : ""}" data-act="sgKho" data-val="${k}" type="button">${k}</button>`).join("")}</div></div>
    ${str(d.research.kenhDeXuat) ? `<p class="small"><b>AI đề xuất kênh:</b> ${esc(d.research.kenhDeXuat)}</p>` : ""}
    <details class="guide-inline" style="margin-top:10px"><summary>🕵️ Tự kiểm tra kênh bằng trình duyệt ẩn danh</summary>
      <ol class="tight small">${INCOGNITO_STEPS.map(s => `<li>${s}</li>`).join("")}</ol></details></div>`;

  // 2. Nguồn có sẵn trong nhà
  const pool = Store.candidates.filter(c => stageOf(c) === "Talent Pool").length;
  html += `<div class="card"><div class="card-head"><h2><span class="snum">2</span> Nguồn có sẵn trong nhà — làm trước tiên</h2></div>
    <div class="grid">${IN_HOUSE.map(x => `<div class="inhouse"><b>🏠 ${x.t}</b><div class="small">${x.d}</div></div>`).join("")}</div>
    <a class="btn sm" style="margin-top:10px" href="#/candidates?stage=${encodeURIComponent("Talent Pool")}">⭐ Xem Talent Pool (${pool} người)</a></div>`;

  // 3. Chọn kênh + kế hoạch
  const sug = CHANNEL_SUGGEST[p.nhom] || CHANNEL_SUGGEST.Mass;
  const chosen = (d.kenh || []).map(k => k.ten);
  const all = Array.from(new Set([...sug, ...SOURCES.filter(s => s !== "Khác")]));
  html += `<div class="card"><div class="card-head"><h2><span class="snum">3</span> Chọn kênh & lập kế hoạch</h2></div>
    <p class="small muted" style="margin-bottom:8px">⭐ = gợi ý cho nhóm <b>${esc((GROUPS[p.nhom] || GROUPS.Mass).label)}</b>. Bấm để thêm/bỏ kênh.</p>
    <div class="chips" style="margin-bottom:14px">${all.map(s => `<button class="chip ${chosen.includes(s) ? "on" : ""}" data-act="sgToggle" data-val="${esc(s)}" type="button">${sug.includes(s) ? "⭐ " : ""}${esc(s)}</button>`).join("")}</div>
    ${(d.kenh || []).length ? `<div class="plan">
      <div class="plan-row plan-head"><span>Kênh</span><span>Ngân sách/tháng (đ)</span><span>CV/tuần</span><span></span></div>
      ${d.kenh.map((k, i) => `<div class="plan-row"><span class="plan-name">${esc(k.ten)}</span>
        ${bound("sg", `kenh.${i}.nganSach`, { type: "number", ph: "0 = miễn phí" })}
        ${bound("sg", `kenh.${i}.mucTieu`, { type: "number", ph: "VD: 10" })}
        <button class="icon-btn" data-act="sgToggle" data-val="${esc(k.ten)}" type="button" aria-label="Bỏ kênh">✕</button></div>`).join("")}
      </div><div id="sgTotals">${planTotalsHtml()}</div>
      ${str(d.research.mucTieuCVTuan) ? `<p class="small muted">AI gợi ý mục tiêu: <b>${esc(d.research.mucTieuCVTuan)} CV/tuần</b>.</p>` : ""}`
    : `<p class="muted small">Chưa chọn kênh nào.</p>`}
    <label class="field" style="margin-top:12px"><span>Ghi chú kế hoạch</span>${bound("sg", "ghiChu", { area: true, ph: "VD: Tuần 1 đăng 3 group FB, nhờ cửa hàng trưởng giới thiệu; tuần 2 xem lại kênh nào ra người." })}</label>
    <div class="btn-row"><button class="btn primary" data-act="sgSave" type="button">💾 Lưu kế hoạch nguồn</button>${backupBtn()}</div></div>`;

  // 4. Hiệu quả kênh
  const stats = channelStats(p.posId);
  const rows = Array.from(new Set([...chosen, ...Object.keys(stats)]));
  html += `<div class="card"><div class="card-head"><h2><span class="snum">4</span> Hiệu quả kênh ${tip("hieuQua")}</h2></div>
    <p class="small muted" style="margin-bottom:10px">Lấy tự động từ ô “Nguồn” của ứng viên vị trí này. Nhớ ghi đúng nguồn khi thêm ứng viên.</p>
    ${rows.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Kênh</th><th>CV</th><th>Qua sơ vấn</th><th>Đi làm</th><th>Chi phí / người đi làm</th></tr></thead><tbody>
      ${rows.map(r => { const s = stats[r] || { cv: 0, sv: 0, join: 0 }; const k = (d.kenh || []).find(x => x.ten === r); const cost = k && +k.nganSach && s.join ? fmtMoney(Math.round(+k.nganSach / s.join)) : "—";
        return `<tr><td>${esc(r)}</td><td>${s.cv}</td><td>${s.sv}</td><td><b>${s.join}</b></td><td>${cost}</td></tr>`; }).join("")}
      </tbody></table></div>` : `<p class="muted small">Chưa có ứng viên nào cho vị trí này.</p>`}</div>`;
  return html;
}

/* =============================================================
 * C. SO SÁNH ỨNG VIÊN
 * ============================================================= */
const UI3 = { hideOut: true };
function evalCandidate(c, p) {
  const sc = asObj(p.scorecard);
  const ct = asObj(c.chiTiet);
  const sv = asObj(ct.soVan), lc = asObj(ct.locCV);
  const svOk = String(sv.posId) === String(p.posId) ? sv : {};
  const lcOk = String(lc.posId) === String(p.posId) ? lc : {};
  const cells = (sc.tieuChi || []).map(t => {
    const a = asObj((svOk.diem || {})[t.id]), b = asObj((lcOk.diem || {})[t.id]);
    if (typeof a.s === "number") return { s: a.s, src: "SV" };
    if (typeof b.s === "number") return { s: b.s, src: "CV" };
    return { s: a.s === "?" || b.s === "?" ? "?" : null };
  });
  let mustFail = 0, mustUnknown = 0;
  (sc.mustHave || []).forEach(m => {
    const k = asObj((svOk.must || {})[m.id]).k || asObj((lcOk.must || {})[m.id]).k;
    if (k === "khong" || k === "truot") mustFail++;
    else if (k !== "co" && k !== "dat") mustUnknown++;
  });
  const svScore = toNum(c.diemSoVan), cvScore = toNum(c.diemCV);
  const total = svScore !== null ? svScore : cvScore;
  const src = svScore !== null ? "Sơ vấn" : cvScore !== null ? "Lọc CV" : "";
  const wants = (sc.tieuChi || []).map((t, i) => t.nhom === "want" && typeof cells[i].s === "number" ? cells[i].s : null).filter(x => x !== null);
  const want = wants.length ? wants.reduce((a, b) => a + b, 0) / wants.length : 0;
  const rec = mustFail ? "Loại" : total === null ? "Chưa chấm" : total >= THRESHOLD.dat ? "Nên chọn" : total >= THRESHOLD.loai ? "Cân nhắc" : "Loại";
  return { c, cells, total, src, mustFail, mustUnknown, want, rec };
}
const REC_CLS = { "Nên chọn": "ok", "Cân nhắc": "warn", "Loại": "bad", "Chưa chấm": "" };
function rankRows(p) {
  const rows = Store.candidates.filter(c => String(c.posId) === String(p.posId)).map(c => evalCandidate(c, p));
  const scored = rows.filter(r => r.total !== null);
  scored.sort((a, b) => (a.mustFail ? 1 : 0) - (b.mustFail ? 1 : 0) || b.total - a.total || b.want - a.want || a.mustUnknown - b.mustUnknown);
  return { scored, unscored: rows.filter(r => r.total === null) };
}
function compareText(p, list) {
  const sc = asObj(p.scorecard);
  const lines = [`⚖️ SO SÁNH ỨNG VIÊN — ${str(p.tenViTri).toUpperCase()}`, `(Điểm theo phiếu, thang 1–4. Ưu tiên điểm sơ vấn nếu có.)`, ``];
  list.forEach((r, i) => {
    lines.push(`${i + 1}. ${candName(r.c)} — ${r.total !== null ? fmtScore(r.total) : "—"}/4 (${r.src}) → ${r.rec}${r.mustFail ? " · trượt loại cứng" : r.mustUnknown ? ` · ${r.mustUnknown} loại cứng chưa rõ` : ""}`);
    lines.push(`   ` + (sc.tieuChi || []).map((t, j) => `${t.ten}: ${r.cells[j].s ?? "—"}`).join(" | "));
  });
  const top = list.filter(r => r.rec === "Nên chọn");
  lines.push(``, top.length ? `👉 Đề xuất mời phỏng vấn vòng quản lý: ${top.map(r => candName(r.c)).join(", ")}.` : `👉 Chưa có ứng viên đạt — cần thêm nguồn.`,
    `Nhờ anh/chị phản hồi giúp em trong 2 ngày ạ.`, ``, `TA: ${getUser()}`);
  return lines.join("\n");
}
function viewCompare(query) {
  const posId = query.get("pos");
  let html = `<a class="back" href="#/tools">← Công cụ</a>` + pageHead(`⚖️ So sánh ứng viên ${tip("soSanh")}`,
    "xem tất cả ứng viên của 1 vị trí trên cùng 1 bảng điểm → biết ai nên mời gặp quản lý trước.");
  html += posPickerHtml("so-sanh", posId);
  const p = findPos(posId);
  if (!p) return html + (posId && !Store.state.hasData && isConnected() ? loadingBlock() : noPosBlock());
  if (!hasScorecard(p)) return html + `<div class="card">${emptyBlock("📐", "Vị trí chưa có phiếu điểm", "Cần phiếu điểm để chấm và so sánh.", `<a class="btn primary" href="#/position/${encodeURIComponent(p.posId)}">Tạo phiếu điểm</a>`)}</div>`;
  const sc = p.scorecard;
  const { scored, unscored } = rankRows(p);
  const list = UI3.hideOut ? scored.filter(r => !["Loại", "Talent Pool"].includes(stageOf(r.c))) : scored;
  const hidden = scored.length - list.length;
  html += `<div class="card"><div class="card-head"><h2>Bảng xếp hạng</h2><span class="muted small">${list.length} ứng viên</span></div>
    <label class="check small" style="padding-top:0"><input type="checkbox" data-act="cmpHide" ${UI3.hideOut ? "checked" : ""}> Ẩn người đã Loại / Talent Pool${hidden ? ` (${hidden})` : ""}</label>`;
  if (!list.length) {
    html += emptyBlock("📊", "Chưa có ứng viên có điểm", "Lọc CV hoặc sơ vấn ứng viên của vị trí này trước.", `<a class="btn primary" href="#/tools/loc-cv">📄 Lọc CV</a>`);
  } else {
    html += `<div class="table-wrap"><table class="tbl cmp"><thead><tr><th class="sticky">#&nbsp;Ứng viên</th>
      ${(sc.tieuChi || []).map(t => `<th title="${esc(t.ten)}"><span class="th-name">${esc(t.ten)}</span><span class="th-sub" style="color:${(CWC[t.nhom] || {}).color}">${esc((CWC[t.nhom] || {}).label || "")} · ${t.trongSo}%</span></th>`).join("")}
      <th>Loại cứng</th><th>Tổng</th><th>Gợi ý</th></tr></thead><tbody>
      ${list.map((r, i) => `<tr><td class="sticky"><a href="#/candidate/${encodeURIComponent(r.c.candId)}"><b>${i + 1}. ${esc(candName(r.c))}</b></a>
          <div class="small"><b>${fmtScore(r.total)}</b> · <span class="verdict ${REC_CLS[r.rec]}" style="font-weight:600">${i === 0 && r.rec === "Nên chọn" ? "⭐ " : ""}${esc(r.rec)}</span></div>
          <div class="small muted">${esc(stageOf(r.c))}</div></td>
        ${r.cells.map(x => `<td class="cell s${typeof x.s === "number" ? x.s : "n"}">${x.s ?? "—"}${x.src === "CV" ? '<sup title="điểm từ lọc CV">cv</sup>' : ""}</td>`).join("")}
        <td>${r.mustFail ? `<span class="verdict bad">✕ ${r.mustFail} trượt</span>` : r.mustUnknown ? `<span class="muted">? ${r.mustUnknown} chưa rõ</span>` : `<span class="verdict ok">✓ Đạt</span>`}</td>
        <td><b>${fmtScore(r.total)}</b><div class="small muted">${esc(r.src)}</div></td>
        <td><span class="verdict-pill ${REC_CLS[r.rec]}">${i === 0 && r.rec === "Nên chọn" ? "⭐ " : ""}${esc(r.rec)}</span></td></tr>`).join("")}
      </tbody></table></div>
      <p class="small muted" style="margin-top:8px">Xếp theo: qua loại cứng → điểm tổng → điểm Want to. Ô có chữ <sup>cv</sup> = điểm từ lọc CV (chưa sơ vấn). “—” = chưa chấm, “?” = chưa có bằng chứng.</p>
      <div class="btn-row" style="margin-top:10px"><button class="btn primary" data-act="cmpCopy" type="button">📋 Copy bảng trình HM</button></div>`;
  }
  html += `</div>`;
  if (unscored.length) html += `<div class="card"><div class="card-head"><h2>Chưa chấm (${unscored.length})</h2></div><div class="list">${unscored.map(r => `<a class="row" href="#/tools/loc-cv?cand=${encodeURIComponent(r.c.candId)}"><span class="avatar">${esc(initials(candName(r.c)))}</span><span style="min-width:0"><div class="title">${esc(candName(r.c))}</div><div class="sub">${esc(stageOf(r.c))}</div></span><span class="meta"><span class="btn sm">Lọc CV →</span></span></a>`).join("")}</div></div>`;
  return html;
}

/* =============================================================
 * SỰ KIỆN PHA 3
 * ============================================================= */
Object.assign(ACTIONS, {
  /* JD */
  jdTab: (el) => { D.jd.tab = el.dataset.val; persistDraft("jd"); const { p, cd } = posAndPortrait(D.jd.posId); $("#jdPreview").innerHTML = jdPreviewHtml(p, cd); },
  jdCopy: (el) => { const { p, cd } = posAndPortrait(D.jd.posId); copyText(buildVersions(p, cd, D.jd)[el.dataset.val]); },
  jdIdea: (el) => { D.jd[el.dataset.field] = el.dataset.val; persistDraft("jd"); render(); },
  listAdd: (el) => { const d = D[el.dataset.scope]; (d[el.dataset.field] = d[el.dataset.field] || []).push(""); persistDraft(el.dataset.scope); render(); },
  listDel: (el) => { D[el.dataset.scope][el.dataset.field].splice(+el.dataset.i, 1); persistDraft(el.dataset.scope); render(); },
  listIdea: (el) => {
    const arr = D[el.dataset.scope][el.dataset.field] || (D[el.dataset.scope][el.dataset.field] = []);
    const empty = arr.findIndex(x => !str(x));
    if (empty >= 0) arr[empty] = el.dataset.val; else if (arr.length < 4) arr.push(el.dataset.val); else { toast("Tối đa 4 dòng — xoá bớt 1 dòng trước"); return; }
    persistDraft(el.dataset.scope); render();
  },
  jdAI: () => {
    openModal("🤖 Nhờ AI viết tin đăng", `
      <p class="howto" style="margin:0 0 12px"><span>AI viết nháp theo AIDA, <b>bạn đọc lại</b> rồi sửa cho đúng cửa hàng.</span></p>
      <ol class="ai-steps">
        <li>Điền trước <b>tổng thu nhập</b> và <b>địa điểm</b> ở form (AI sẽ dùng).</li>
        <li><button class="btn sm primary" data-act="copyJDPrompt" type="button">📋 Copy prompt</button> → dán vào <b>ChatGPT</b>/<b>Claude</b> → gửi.</li>
        <li>Dán kết quả AI vào đây:<textarea class="input" id="aiPaste" rows="5" placeholder='Dán kết quả AI (dạng {"hook": …})'></textarea>
          <div class="field-error" id="aiErr"></div>
          <button class="btn primary block" style="margin-top:10px" data-act="fillJDAI" type="button">✨ Tự điền vào form</button></li>
      </ol>`);
  },
  copyJDPrompt: () => { const { p, cd } = posAndPortrait(D.jd.posId); copyText(aiPromptJD({ pos: p, cd, d: D.jd })); },
  fillJDAI: () => {
    try {
      const j = parseAIJson($("#aiPaste").value);
      if (!j.hook && !j.viec) throw new Error("Kết quả thiếu “hook”/“viec”. Bảo AI trả đúng mẫu JSON rồi dán lại.");
      const d = D.jd;
      if (str(j.hook)) d.hook = str(j.hook);
      if (Array.isArray(j.ly) && j.ly.length) d.ly = cleanLines(j.ly).slice(0, 4);
      if (Array.isArray(j.viec) && j.viec.length) d.viec = cleanLines(j.viec).slice(0, 4);
      if (Array.isArray(j.quyenLoi) && j.quyenLoi.length) d.quyenLoi = cleanLines(j.quyenLoi).slice(0, 4);
      if (str(j.thuNhap) && !str(d.thuNhap)) d.thuNhap = str(j.thuNhap);
      if (str(j.cta)) d.cta = str(j.cta);
      persistDraft("jd"); closeModal(); render();
      toast("Đã điền từ AI ✓ — xem phần “Kiểm tra quy tắc”");
    } catch (e) { $("#aiErr").textContent = e.message; }
  },
  jdSave: () => {
    const d = D.jd, { p, cd } = posAndPortrait(d.posId);
    const rules = postRules(d, buildVersions(p, cd, d)).filter(r => !r.ok);
    if (rules.length && !confirm(`Tin còn ${rules.length} điều chưa đúng quy tắc đăng. Vẫn lưu?`)) return;
    const v = buildVersions(p, cd, d);
    const aida = { diaDiem: str(d.diaDiem), thuNhap: str(d.thuNhap), hook: str(d.hook), ly: cleanLines(d.ly), viec: cleanLines(d.viec), quyenLoi: cleanLines(d.quyenLoi), cta: str(d.cta) };
    const jd = JSON.stringify({ aida, banFB: v.fb, banFanpage: v.fanpage, banJobsite: v.jobsite, capNhat: new Date().toISOString(), by: getUser() });
    Store.save({ action: "savePosition", position: { posId: p.posId, jd, nguoiCapNhat: getUser() } });
    clearDraft(D.jdKey); D.jd = null; D.jdKey = null;
    toast("Đã lưu tin đăng vào vị trí ✓");
    goNextAfter(p.posId, "m2", `#/tools/jd?pos=${encodeURIComponent(p.posId)}`);
  },

  /* Sourcing */
  copyMarketPrompt: () => {
    const { p } = posAndPortrait(D.sg.posId); const jd = parseJD(p);
    copyText(aiPromptMarket({ pos: p, khuVuc: str(D.sg.khuVuc), jdText: jd ? (jd.banJobsite || jd.raw || "") : "" }));
  },
  fillMarket: () => {
    try {
      const j = parseAIJson($("#aiPaste").value);
      const r = D.sg.research = D.sg.research || {};
      const lines = a => Array.isArray(a) ? a.map(x => typeof x === "object" ? Object.values(x).filter(Boolean).join(" – ") : str(x)).filter(Boolean).join("; ") : str(a);
      r.tuKhoa = lines(j.tuKhoa) || r.tuKhoa;
      r.luongBenchmark = str(j.luongBenchmark) || r.luongBenchmark;
      r.doiThu = lines(j.doiThu) || r.doiThu;
      r.usp = lines(j.uspNenDua) || r.usp;
      r.kenhDeXuat = lines(j.kenhDeXuat) || r.kenhDeXuat;
      if (["Dễ", "Trung bình", "Khó"].includes(str(j.doKho))) r.doKho = str(j.doKho);
      if (j.mucTieuCVTuan) r.mucTieuCVTuan = str(j.mucTieuCVTuan);
      // Tự thêm kênh AI đề xuất nếu khớp danh sách
      (Array.isArray(j.kenhDeXuat) ? j.kenhDeXuat : []).forEach(k => {
        const name = str(typeof k === "object" ? k.kenh : k).toLowerCase();
        const match = SOURCES.find(s => name && (s.toLowerCase().includes(name) || name.includes(s.toLowerCase().split(" (")[0])));
        if (match && !(D.sg.kenh || []).some(x => x.ten === match)) (D.sg.kenh = D.sg.kenh || []).push({ ten: match, nganSach: "", mucTieu: "" });
      });
      persistDraft("sg"); render();
      toast("Đã điền kết quả nghiên cứu ✓");
    } catch (e) { $("#aiErr").textContent = e.message; }
  },
  sgKho: (el) => { D.sg.research.doKho = el.dataset.val; persistDraft("sg"); render(); },
  sgToggle: (el) => {
    const k = D.sg.kenh = D.sg.kenh || [];
    const i = k.findIndex(x => x.ten === el.dataset.val);
    if (i >= 0) k.splice(i, 1); else k.push({ ten: el.dataset.val, nganSach: "", mucTieu: "" });
    persistDraft("sg"); render();
  },
  sgSave: () => {
    const d = D.sg;
    const nguon = { khuVuc: str(d.khuVuc), research: d.research || {}, kenh: (d.kenh || []).map(k => ({ ten: k.ten, nganSach: +k.nganSach || 0, mucTieu: +k.mucTieu || 0 })), ghiChu: str(d.ghiChu), capNhat: new Date().toISOString(), by: getUser() };
    if (!nguon.kenh.length && !confirm("Chưa chọn kênh nào. Vẫn lưu?")) return;
    Store.save({ action: "savePosition", position: { posId: d.posId, nguon, nguoiCapNhat: getUser() } });
    const pid = d.posId;
    clearDraft(D.sgKey); D.sg = null; D.sgKey = null;
    toast("Đã lưu kế hoạch nguồn ✓");
    goNextAfter(pid, "m3", `#/tools/nguon?pos=${encodeURIComponent(pid)}`);
  },

  /* So sánh */
  cmpHide: (el) => { UI3.hideOut = el.checked; render(); },
  cmpCopy: () => {
    const { query } = parseHash(); const p = findPos(query.get("pos"));
    const { scored } = rankRows(p);
    const list = UI3.hideOut ? scored.filter(r => !["Loại", "Talent Pool"].includes(stageOf(r.c))) : scored;
    copyText(compareText(p, list));
  }
});

document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.change === "pickPosTool") go(`#/tools/${el.dataset.tool}${el.value ? "?pos=" + encodeURIComponent(el.value) : ""}`);
});
document.addEventListener("input", (ev) => {
  const s = ev.target.dataset && ev.target.dataset.scope;
  if (s === "jd" && D.jd) {
    const { p, cd } = posAndPortrait(D.jd.posId);
    const r = $("#jdRules"), v = $("#jdPreview");
    if (r) r.innerHTML = jdRulesHtml(p, cd);
    if (v) v.innerHTML = jdPreviewHtml(p, cd);
  }
  if (s === "sg" && D.sg) { const t = $("#sgTotals"); if (t) t.innerHTML = planTotalsHtml(); }
});
