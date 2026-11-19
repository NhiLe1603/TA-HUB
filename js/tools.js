/* =============================================================
 * ATINO TA HUB — PHA 2: VỊ TRÍ (chân dung + phiếu điểm) · LỌC CV · SƠ VẤN
 * ============================================================= */
"use strict";

Object.assign(TIPS, {
  cwc: "<b>CWC</b> = 3 nhóm tiêu chí:<br>• <b>Can do</b> – làm được việc (kỹ năng, kinh nghiệm)<br>• <b>Want to</b> – muốn làm & gắn bó<br>• <b>Culture fit</b> – hợp 5 giá trị ATINO<br>Thiếu 1 nhóm là dễ tuyển nhầm.",
  trongSo: "<b>Trọng số %</b> = tiêu chí này quan trọng cỡ nào. Tổng các tiêu chí = 100%. Mỗi tiêu chí từ 10% đến 40%.",
  hanhVi: "<b>Hành vi nhìn/nghe thấy được</b> = điều mình thấy trong CV hoặc nghe ứng viên kể. VD: “Từng làm 1 nơi trên 1 năm” thay vì “có tính gắn bó”.",
  qtypes: "<b>H</b> = câu hành vi “Kể về một lần…” (tốt nhất). <b>Đ</b> = câu động lực “Vì sao…”. Tránh câu giả định “Nếu… bạn sẽ…?” — ai cũng trả lời hay.",
  neo: "<b>Mô tả neo</b> = mỗi mức điểm trông như thế nào. Có neo thì 2 người chấm cùng 1 ứng viên sẽ ra điểm giống nhau.",
  hmAsk: "HM bận? Hỏi <b>2 câu cốt lõi</b>:<br>1. Ứng viên thế nào thì anh/chị <b>CHẤM ĐẬU ngay</b>?<br>2. Dính điều gì thì <b>LOẠI ngay</b>?<br>Hỏi tiếp “Cụ thể hơn được không?” (bóc vỏ hành).",
  mucTieu: "<b>Kết quả 30/60/90 ngày</b> = người giỏi vào làm sẽ đạt được gì. Từ đây mới suy ra cần tiêu chí gì.",
  mustHave: "<b>Loại cứng (must-have)</b> = điều kiện bắt buộc, thiếu 1 là loại dù điểm cao. Chỉ đặt 3–4 cái: ca/giờ, khu vực, ngày bắt đầu, lương.",
  star: "<b>STAR</b> = cách hỏi & ghi bằng chứng:<br><b>S</b>ituation – tình huống<br><b>T</b>ask – nhiệm vụ<br><b>A</b>ction – bạn ấy đã LÀM gì<br><b>R</b>esult – kết quả<br>Hỏi việc <b>ĐÃ xảy ra</b>, để ứng viên nói 70% trở lên."
});

/* ---------------- BẢN NHÁP (giữ chữ đang gõ, kể cả khi tắt app) ---------------- */
const DRAFT_PREFIX = "atino_draft_";
const D = { pd: null, pdKey: null, lc: null, lcKey: null, sv: null, svKey: null };
// Bản nháp gắn với TÊN người dùng → mỗi TA có nháp riêng, kể cả khi dùng chung 1 máy
const draftK = key => DRAFT_PREFIX + userSlug() + "_" + key;
const loadDraft = key => LocalDB.get(draftK(key), null);
const clearDraft = key => LocalDB.remove(draftK(key));
const draftTimers = {};
function persistDraft(scope) {
  clearTimeout(draftTimers[scope]);
  const obj = D[scope], key = D[scope + "Key"], full = draftK(key);
  // Chỉ ghi nếu vẫn đang sửa đúng bản nháp đó (tránh ghi lại nháp ngay sau khi vừa lưu lên Sheet)
  draftTimers[scope] = setTimeout(() => { if (obj && D[scope] === obj && D[scope + "Key"] === key) LocalDB.set(full, obj); }, 300);
}
/** Đổi người dùng → bỏ bản nháp đang mở trong bộ nhớ */
function resetDrafts() { Object.keys(D).forEach(k => { D[k] = null; }); Object.keys(draftTimers).forEach(k => clearTimeout(draftTimers[k])); }
const clone = o => JSON.parse(JSON.stringify(o));
const uid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 100);
function getPath(obj, path) { return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function setPath(obj, path, val) {
  const ks = path.split(".");
  let o = obj;
  for (let i = 0; i < ks.length - 1; i++) {
    if (o[ks[i]] == null || typeof o[ks[i]] !== "object") o[ks[i]] = {};
    o = o[ks[i]];
  }
  o[ks[ks.length - 1]] = val;
}

/** Ô nhập gắn với bản nháp. lint: "legal" | "q" (câu hỏi) | "" */
function bound(scope, path, { ph = "", area = false, lint = "", type = "text", rows = 2, cls = "input" } = {}) {
  const v = getPath(D[scope], path);
  const val = v === undefined || v === null ? "" : v;
  const common = `class="${cls}" data-scope="${scope}" data-bind="${esc(path)}" data-keep="${scope}:${esc(path)}" ${lint ? `data-lint="${lint}"` : ""} placeholder="${esc(ph)}"`;
  const field = area
    ? `<textarea ${common} rows="${rows}">${esc(val)}</textarea>`
    : `<input ${common} type="${type}" value="${esc(val)}" autocomplete="off">`;
  return field + (lint ? `<div data-lint-for="${scope}:${esc(path)}">${lintHtml(val, lint)}</div>` : "");
}
function lintHtml(text, kind) {
  let html = legalHtml(text);
  if (kind === "q" && text) {
    if (/(nếu|giả sử|giả như)/i.test(text)) html += `<div class="lint-box">❓ Đây là câu <b>giả định (G)</b> — ai cũng trả lời hay. Đổi thành: “<b>Kể về một lần</b> bạn…”.</div>`;
    else if (/(đúng không|phải không|chắc là)/i.test(text)) html += `<div class="lint-box">❓ Câu <b>dẫn dắt (D)</b> — gợi sẵn đáp án. Hỏi mở: “Kể về…”, “Vì sao…”.</div>`;
  }
  return html;
}

/* ---------------- TÍNH ĐIỂM ---------------- */
const round1 = n => Math.round(n * 10) / 10;
function calcScore(tieuChi, diem) {
  let s = 0, w = 0, n = 0;
  (tieuChi || []).forEach(t => {
    const v = (diem[t.id] || {}).s;
    if (typeof v === "number") { s += v * (+t.trongSo || 0); w += (+t.trongSo || 0); n++; }
  });
  return { score: w ? round1(s / w) : null, n, total: (tieuChi || []).length };
}
function verdictOf(score, mustFail) {
  if (mustFail) return "Loại";
  if (score === null) return "";
  if (score < THRESHOLD.loai) return "Loại";
  if (score < THRESHOLD.dat) return "Chờ/Cân nhắc";
  return "Đạt";
}
function evalDraft(d, sc) {
  const must = sc.mustHave || [];
  const ks = must.map(m => ((d.must || {})[m.id] || {}).k);
  const mustFail = ks.some(k => k === "truot" || k === "khong");
  const mustUnknown = ks.filter(k => !k || k === "?").length;
  const { score, n, total } = calcScore(sc.tieuChi, d.diem || {});
  const strengths = (sc.tieuChi || []).filter(t => ((d.diem || {})[t.id] || {}).s >= 3).map(t => t.ten);
  return { score, n, total, mustFail, mustUnknown, verdict: verdictOf(score, mustFail), strengths };
}

/* ---------------- PHIẾU ĐIỂM ---------------- */
function blankPortrait() {
  return { posId: null, tenViTri: "", nhom: "Mass", khuVuc: "", moTaHM: "", mucTieu: { d30: "", d60: "", d90: "" }, mustHave: [], tieuChi: [] };
}
function withIds(cd) {
  cd.mustHave = (cd.mustHave || []).map((m, i) => Object.assign({ id: "m" + (i + 1) }, m, { id: m.id || uid("m") }));
  cd.tieuChi = (cd.tieuChi || []).map(t => Object.assign({ neo: {} }, t, { id: t.id || uid("t"), trongSo: +t.trongSo || 0 }));
  return cd;
}
function buildScorecard(cd) {
  return {
    mustHave: cd.mustHave.map(m => ({ id: m.id, ten: str(m.ten), cauHoi: str(m.cauHoi) })),
    tieuChi: cd.tieuChi.map(t => ({
      id: t.id, ten: str(t.ten), nhom: t.nhom, trongSo: +t.trongSo || 0,
      hanhVi: str(t.hanhVi), cauHoi: str(t.cauHoi), loaiCauHoi: t.loaiCauHoi || "H",
      neo: { 1: str((t.neo || {})[1]) || DEFAULT_ANCHORS[1], 2: str((t.neo || {})[2]) || DEFAULT_ANCHORS[2], 3: str((t.neo || {})[3]) || DEFAULT_ANCHORS[3], 4: str((t.neo || {})[4]) || DEFAULT_ANCHORS[4] }
    })),
    nguong: { loai: THRESHOLD.loai, dat: THRESHOLD.dat },
    capNhat: new Date().toISOString(),
    by: getUser()
  };
}
const hasScorecard = p => p && asObj(p.scorecard).tieuChi && asObj(p.scorecard).tieuChi.length > 0;
function weightCheck(tc) {
  const total = tc.reduce((s, t) => s + (+t.trongSo || 0), 0);
  const bad = tc.filter(t => (+t.trongSo || 0) < 10 || (+t.trongSo || 0) > 40);
  const missing = CWC_KEYS.filter(k => !tc.some(t => t.nhom === k));
  return { total, bad, missing, ok: tc.length > 0 && total === 100 && !bad.length };
}
/** Tự chia lại trọng số: giữ tỷ lệ, tổng 100, mỗi cái 10–40 */
function autoBalance(tc) {
  const n = tc.length;
  if (!n) return;
  if (n < 3 || n > 10) { tc.forEach(t => { t.trongSo = Math.round(100 / n); }); return; }
  let w = tc.map(t => Math.max(1, +t.trongSo || 0));
  const sum = w.reduce((a, b) => a + b, 0);
  w = w.map(x => Math.min(40, Math.max(10, Math.round((x / sum) * 100))));
  let diff = 100 - w.reduce((a, b) => a + b, 0);
  let guard = 500;
  while (diff !== 0 && guard--) {
    const step = diff > 0 ? 1 : -1;
    const order = w.map((x, i) => i).sort((a, b) => step > 0 ? w[a] - w[b] : w[b] - w[a]);
    const i = order.find(j => step > 0 ? w[j] < 40 : w[j] > 10);
    if (i === undefined) break;
    w[i] += step; diff -= step;
  }
  tc.forEach((t, i) => { t.trongSo = w[i]; });
}
function portraitText(p, cd) {
  const g = n => CWC[n] ? CWC[n].label : n;
  const lines = [`📋 CHÂN DUNG ỨNG VIÊN — ${str(p.tenViTri).toUpperCase()}${str(cd.khuVuc) ? " (" + str(cd.khuVuc) + ")" : ""}`, ``];
  const mt = cd.mucTieu || {};
  if (str(mt.d30) || str(mt.d60) || str(mt.d90)) {
    lines.push(`🎯 Người giỏi sẽ làm được:`);
    if (str(mt.d30)) lines.push(`  • Sau 30 ngày: ${mt.d30}`);
    if (str(mt.d60)) lines.push(`  • Sau 60 ngày: ${mt.d60}`);
    if (str(mt.d90)) lines.push(`  • Sau 90 ngày: ${mt.d90}`);
    lines.push(``);
  }
  lines.push(`⛔ LOẠI CỨNG (thiếu 1 là loại):`);
  (cd.mustHave || []).forEach((m, i) => lines.push(`  ${i + 1}. ${m.ten}`));
  const tc = (cd.tieuChi || []).filter(t => str(t.ten));
  if (tc.length) {
    lines.push(``, `✅ TIÊU CHÍ CHẤM (thang 1–4):`);
    tc.forEach(t => lines.push(`  • ${t.ten} [${g(t.nhom)} · ${t.trongSo}%]${str(t.hanhVi) ? " — " + t.hanhVi : ""}`));
    lines.push(``, `Ngưỡng: dưới 2,5 Loại · 2,5–2,9 Cân nhắc · từ 3,0 Đạt.`);
  }
  lines.push(``,
    `👉 Anh/chị xem giúp em chân dung này đã đúng ý chưa, cần thêm/bớt gì không ạ? Em sẽ dùng đúng bản này để lọc CV và sơ vấn.`);
  return lines.join("\n");
}

/* =============================================================
 * MÀN VỊ TRÍ — DANH SÁCH
 * ============================================================= */
/** Danh sách vị trí — dùng cho Module 1 (Chân dung) và Module 4 (Scorecard) */
function positionListHtml(mode) {
  const mineIds = new Set(myPositions().map(p => String(p.posId)));
  const list = Store.positions.slice().sort((a, b) => (mineIds.has(String(b.posId)) - mineIds.has(String(a.posId))) || new Date(b.ngayCapNhat || 0) - new Date(a.ngayCapNhat || 0));
  if (!Store.state.hasData && isConnected()) return `<div class="card"><div class="skeleton"></div><div class="skeleton"></div></div>`;
  if (!list.length) return `<div class="card">${emptyBlock("💼", "Chưa có vị trí nào", "Bắt đầu từ <b>Bước 1 · Chân dung ứng viên</b> — bấm <b>Dùng mẫu</b> là có sẵn chân dung nhân viên bán hàng, chỉ cần sửa lại.",
    `<a class="btn primary" href="#/position/new">＋ Tạo vị trí (Bước 1)</a>`)}</div>`;
  const row = p => {
    const g = GROUPS[p.nhom];
    const href = `#/position/${encodeURIComponent(p.posId)}?tab=${mode}`;
    const status = mode === "scorecard"
      ? (hasScorecard(p) ? `<span class="badge" style="--c:var(--ok)">Có scorecard · ${(asObj(p.scorecard).tieuChi || []).length} tiêu chí</span>` : `<span class="badge" style="--c:var(--warn)">Chưa có scorecard</span>`)
      : miniSteps(p);
    return `<a class="row" href="${href}"><span class="avatar">💼</span>
      <span style="min-width:0"><div class="title">${esc(p.tenViTri)}</div>
      <div class="sub">${esc(g ? g.label : "Chưa chọn nhóm")}${str(p.nguoiCapNhat) ? " · " + esc(p.nguoiCapNhat) : ""}</div></span>
      <span class="meta">${status}</span></a>`;
  };
  const mine = list.filter(p => mineIds.has(String(p.posId))), team = list.filter(p => !mineIds.has(String(p.posId)));
  let html = "";
  if (mine.length) html += `<div class="card"><div class="card-head"><h2>Vị trí của bạn (${mine.length})</h2></div><div class="list">${mine.map(row).join("")}</div></div>`;
  if (team.length) html += `<details class="card" ${mine.length ? "" : "open"}><summary><b>Vị trí của cả team (${team.length})</b> <span class="muted small">— xem, dùng lại làm mẫu</span></summary><div class="list" style="margin-top:8px">${team.map(row).join("")}</div></details>`;
  return html;
}
function viewPositions() {
  return pageHead("🎯 Module 1 · Chân dung ứng viên", "mô tả <b>người cần tuyển</b> cho từng vị trí: hỏi HM, viết loại cứng và kết quả 30/60/90 ngày. Xong chân dung, app tự đưa bạn sang bước viết JD.",
    `<div style="margin-top:10px"><a class="btn primary" href="#/position/new">＋ Tạo vị trí mới</a></div>`) + positionListHtml("chandung");
}
function viewScorecardList() {
  return pageHead("📐 Module 4 · Xây dựng Scorecard", "chọn vị trí để làm <b>scorecard</b> (tiêu chí CWC, trọng số, mô tả 4 mức). Đây là thước đo chung cho lọc CV và phỏng vấn.") + positionListHtml("scorecard");
}

/* =============================================================
 * MÀN VỊ TRÍ — FORM CHÂN DUNG
 * ============================================================= */
function initPortrait(id) {
  const key = "pos_" + (id || "new");
  if (D.pdKey === key && D.pd) return;
  D.pdKey = key;
  const draft = loadDraft(key);
  if (draft) { D.pd = draft; return; }
  const p = id && id !== "new" ? findPos(id) : null;
  const cd = p ? asObj(p.chanDung) : {};
  D.pd = withIds(Object.assign(blankPortrait(), clone(cd), {
    posId: p ? p.posId : null, tenViTri: p ? str(p.tenViTri) : "", nhom: p && GROUPS[p.nhom] ? p.nhom : "Mass",
    mucTieu: Object.assign({ d30: "", d60: "", d90: "" }, cd.mucTieu || {})
  }));
}

function weightBoxHtml() {
  const tc = D.pd.tieuChi;
  if (!tc.length) return "";
  const w = weightCheck(tc);
  const bar = tc.map(t => `<i style="width:${Math.max(0, +t.trongSo || 0)}%;background:${(CWC[t.nhom] || {}).color || "#999"}" title="${esc(t.ten)}"></i>`).join("");
  const msgs = [];
  if (w.total !== 100) msgs.push(`Tổng đang là <b>${w.total}%</b> — cần đúng <b>100%</b>.`);
  w.bad.forEach(t => msgs.push(`“${esc(t.ten || "(chưa đặt tên)")}” ${+t.trongSo || 0}% — mỗi tiêu chí phải từ 10% đến 40%.`));
  if (w.missing.length) msgs.push(`Gợi ý: nên có ít nhất 1 tiêu chí <b>${w.missing.map(k => CWC[k].label).join(", ")}</b>.`);
  const byGroup = CWC_KEYS.map(k => `<span class="wleg"><span class="sw" style="background:${CWC[k].color}"></span>${CWC[k].label} ${tc.filter(t => t.nhom === k).reduce((s, t) => s + (+t.trongSo || 0), 0)}%</span>`).join("");
  return `<div class="wbox ${w.ok ? "ok" : "bad"}"><div class="whead"><b>Tổng trọng số: ${w.total}%</b> ${w.ok ? "✓" : ""}
    ${w.ok ? "" : `<button class="btn sm" data-act="pdBalance" type="button">⚖️ Tự cân lại</button>`}</div>
    <div class="wbar">${bar}</div><div class="wlegend">${byGroup}</div>
    ${msgs.length ? `<div class="small" style="margin-top:6px">${msgs.join("<br>")}</div>` : ""}</div>`;
}

function mustRowHtml(m, i) {
  return `<div class="item-card"><div class="item-head"><b>Loại cứng ${i + 1}</b>
      <button class="icon-btn" data-act="pdDel" data-list="mustHave" data-i="${i}" type="button" aria-label="Xoá">🗑</button></div>
    <label class="field"><span>Điều kiện</span>${bound("pd", `mustHave.${i}.ten`, { ph: "VD: Nhận ca xoay, có ca tối đến 22h", lint: "legal" })}</label>
    <label class="field" style="margin-bottom:0"><span>Câu hỏi xác minh (đóng, Có/Không) <span class="qtag good">K</span></span>${bound("pd", `mustHave.${i}.cauHoi`, { ph: "VD: Công việc có ca tối tới 22h. Bạn làm được không?", lint: "legal" })}</label></div>`;
}

function critEditHtml(t, i) {
  return `<div class="item-card" style="border-left:4px solid ${(CWC[t.nhom] || {}).color || "var(--line)"}">
    <div class="item-head"><b>Tiêu chí ${i + 1}</b><button class="icon-btn" data-act="pdDel" data-list="tieuChi" data-i="${i}" type="button" aria-label="Xoá">🗑</button></div>
    <label class="field"><span>Tên tiêu chí</span>${bound("pd", `tieuChi.${i}.ten`, { ph: "VD: Xử lý tình huống với khách", lint: "legal" })}</label>
    <div class="field"><span class="field-label">Nhóm CWC ${tip("cwc")}</span>
      <div class="chips">${CWC_KEYS.map(k => `<button class="chip ${t.nhom === k ? "on" : ""}" data-act="pdCritNhom" data-i="${i}" data-val="${k}" type="button">${CWC[k].label} · ${CWC[k].vi}</button>`).join("")}</div></div>
    <div class="field"><span class="field-label">Trọng số % ${tip("trongSo")}</span>
      <div class="stepper-input"><button class="btn sm" data-act="pdW" data-i="${i}" data-d="-5" type="button">−5</button>
      ${bound("pd", `tieuChi.${i}.trongSo`, { type: "number", cls: "input w-num" })}
      <button class="btn sm" data-act="pdW" data-i="${i}" data-d="5" type="button">+5</button></div></div>
    <label class="field"><span>Hành vi nhìn/nghe thấy được ${tip("hanhVi")}</span>${bound("pd", `tieuChi.${i}.hanhVi`, { ph: "VD: Đã từng xử lý khách khiếu nại mà vẫn giữ được khách (đừng viết “nhanh nhẹn, tốt”)", area: true, lint: "legal" })}</label>
    <label class="field"><span>Câu hỏi gợi ý</span>${bound("pd", `tieuChi.${i}.cauHoi`, { ph: "VD: Kể về một lần bạn gặp khách khó tính. Bạn đã làm gì?", area: true, lint: "q" })}</label>
    <div class="field"><span class="field-label">Loại câu hỏi ${tip("qtypes")}</span>
      <div class="chips">${["H", "Đ"].map(k => `<button class="chip ${(t.loaiCauHoi || "H") === k ? "on" : ""}" data-act="pdCritQ" data-i="${i}" data-val="${k}" type="button">${k} · ${QUESTION_TYPES[k].label}</button>`).join("")}</div></div>
    <details class="neo"><summary>Mô tả 4 mức (neo) ${tip("neo")} <span class="muted small">— để trống sẽ dùng mô tả chung</span></summary>
      ${[1, 2, 3, 4].map(k => `<label class="field"><span>${k} · ${SCALE[k].label}</span>${bound("pd", `tieuChi.${i}.neo.${k}`, { ph: DEFAULT_ANCHORS[k], lint: "legal" })}</label>`).join("")}
    </details></div>`;
}

function viewPosition(id, query) {
  const tab = query && query.get("tab") === "scorecard" ? "scorecard" : "chandung";
  const back = tab === "scorecard" ? `<a class="back" href="#/scorecard">← Module 4 · Scorecard</a>` : `<a class="back" href="#/positions">← Module 1 · Chân dung</a>`;
  if (id !== "new" && !findPos(id)) {
    if (!Store.state.hasData && isConnected()) return loadingBlock();
    return back + `<div class="card">${emptyBlock("🤷", "Không tìm thấy vị trí", "Có thể vị trí đã bị xoá.", `<a class="btn primary" href="#/positions">Về danh sách</a>`)}</div>`;
  }
  initPortrait(id);
  const d = D.pd;
  const isNew = !d.posId;
  const p = isNew ? null : findPos(d.posId);
  const hasDraft = !!loadDraft(D.pdKey);
  let html = back;
  if (tab === "scorecard" && isNew) return html + `<div class="card">${emptyBlock("🎯", "Làm chân dung trước", "Scorecard được xây từ chân dung. Hãy làm Bước 1 trước.", `<a class="btn primary" href="#/position/new">Bước 1 · Chân dung</a>`)}</div>`;
  html += p ? workflowBar(p, tab === "scorecard" ? "m4" : "m1") : "";
  html += fromBanner(query, p, tab === "scorecard" ? "m4" : "m1");
  html += tab === "scorecard"
    ? pageHead(`📐 Bước 4 · Scorecard — ${esc(d.tenViTri)}`, "đặt <b>tiêu chí chấm điểm (CWC)</b>, trọng số và mô tả 4 mức. Đây là thước đo dùng cho lọc CV và phỏng vấn — ai chấm cũng ra gần giống nhau.")
    : pageHead(isNew ? "🎯 Bước 1 · Chân dung ứng viên" : `🎯 Bước 1 · Chân dung — ${esc(d.tenViTri || "Vị trí")}`,
      "mô tả <b>người mình cần</b>: thông tin vị trí, kết quả mong muốn, loại cứng. Không biết bắt đầu? Bấm <b>Dùng mẫu</b> rồi sửa lại.");
  if (hasDraft) html += `<div class="banner" style="margin:0 0 14px"><span>📝 Bản nháp của bạn trên máy này — <b>chưa lưu lên Sheet</b>.</span><button class="btn sm" data-act="discardDraft" data-scope="pd" type="button">Bỏ nháp</button></div>`;

  html += `<div class="card"><div class="card-head"><h2>⚡ Bắt đầu nhanh</h2></div>
    <p class="small muted" style="margin-bottom:10px">Dùng mẫu có sẵn theo nhóm, hoặc nhờ AI soạn rồi dán kết quả về.${tab === "chandung" ? " Mẫu/AI điền luôn cả tiêu chí cho Bước 4." : ""}</p>
    <div class="btn-row">${Object.keys(TEMPLATES).map(k => `<button class="btn" data-act="pdTemplate" data-val="${k}" data-tab="${tab}" type="button">📋 Mẫu ${esc(GROUPS[k].label.split(" – ")[0])}</button>`).join("")}
    <button class="btn primary" data-act="pdAI" type="button">🤖 Nhờ AI soạn</button></div></div>`;

  if (tab === "scorecard") return html + scorecardSectionHtml(d, p);

  // Bước 1
  html += `<div class="card"><div class="card-head"><h2><span class="snum">1</span> Thông tin & kết quả mong muốn</h2></div>
    <label class="field"><span>Tên vị trí <span class="req">*</span></span>${bound("pd", "tenViTri", { ph: "VD: Tư vấn bán hàng – ATINO Q.1", lint: "legal" })}</label>
    <div class="field"><span class="field-label">Nhóm ${tip("nhom")}</span>
      <div class="chips">${Object.keys(GROUPS).map(k => `<button class="chip ${d.nhom === k ? "on" : ""}" data-act="pdNhom" data-val="${k}" type="button">${esc(GROUPS[k].label)}</button>`).join("")}</div></div>
    <label class="field"><span>Khu vực</span>${bound("pd", "khuVuc", { ph: "VD: TP.HCM – Quận 1 / Hà Nội – Cầu Giấy" })}</label>
    <label class="field"><span>Quản lý (HM) nói gì về người cần tuyển? ${tip("hmAsk")}</span>${bound("pd", "moTaHM", { ph: "VD: Cần người chịu được ca tối, từng bán quần áo, nói chuyện lễ phép với khách lớn tuổi…", area: true, rows: 3, lint: "legal" })}</label>
    <div class="field-label">Người giỏi sẽ làm được gì sau… ${tip("mucTieu")}</div>
    <div class="grid three">
      <label class="field"><span class="muted small">30 ngày</span>${bound("pd", "mucTieu.d30", { ph: "VD: Thuộc 80% sản phẩm", area: true })}</label>
      <label class="field"><span class="muted small">60 ngày</span>${bound("pd", "mucTieu.d60", { ph: "VD: Đạt 80% doanh số", area: true })}</label>
      <label class="field"><span class="muted small">90 ngày</span>${bound("pd", "mucTieu.d90", { ph: "VD: Đạt 100% doanh số", area: true })}</label></div></div>`;

  // Loại cứng
  const mh = d.mustHave;
  html += `<div class="card"><div class="card-head"><h2><span class="snum">2</span> Loại cứng (must-have) ${tip("mustHave")}</h2><span class="muted small">${mh.length} điều kiện</span></div>
    <p class="howto" style="margin:0 0 12px"><span><b>Thiếu 1 là loại.</b> Chỉ đặt <b>3–4</b> điều kiện thật sự bắt buộc (ca/giờ, khu vực, ngày bắt đầu, lương). Còn lại để vào tiêu chí chấm điểm.</span></p>
    ${mh.length > 4 ? `<div class="lint-box">⚠️ Đang có ${mh.length} loại cứng — nhiều quá sẽ loại oan người tốt. Nên giữ 3–4 cái.</div>` : ""}
    ${mh.map(mustRowHtml).join("")}
    <button class="btn block" data-act="pdAdd" data-list="mustHave" type="button">＋ Thêm loại cứng</button></div>`;

  // Lưu chân dung
  html += `<div class="card"><div class="card-head"><h2><span class="snum">3</span> Gửi HM xác nhận & lưu</h2></div>
    <p class="small muted" style="margin-bottom:10px">Gửi chân dung cho HM <b>xác nhận bằng văn bản</b> (copy dán Lark) trước khi tuyển.</p>
    <div class="btn-row">
      <button class="btn" data-act="pdCopyHM" type="button">📋 Copy gửi HM xác nhận</button>
      <button class="btn primary" data-act="pdSave" data-mode="chandung" type="button">💾 Lưu & sang bước tiếp →</button></div>
    <div style="text-align:right;margin-top:6px">${backupBtn()}</div>
    ${!isNew ? `<div style="text-align:center;margin-top:12px"><button class="btn ghost" style="color:var(--bad)" data-act="pdDelete" type="button">🗑 Xoá vị trí này</button></div>` : ""}</div>`;
  if (p && WORKFLOW[0].done(p)) html += nextStepCard(p, "m1");
  return html;
}

/** Bước 4 · Scorecard (tiêu chí CWC + trọng số + neo) */
function scorecardSectionHtml(d, p) {
  let html = `<details class="card guide"><summary><b>📐 Scorecard làm theo 7 bước</b> <span class="muted small">(bấm để xem)</span></summary>
    <ol class="steps7">${SCORECARD_STEPS.map(s => `<li>${s}</li>`).join("")}</ol></details>`;
  const mh = d.mustHave || [];
  html += `<div class="card"><div class="card-head"><h2>⛔ Loại cứng (từ Bước 1)</h2><a class="btn sm" href="#/position/${encodeURIComponent(d.posId)}?tab=chandung">Sửa ở Bước 1</a></div>
    ${mh.length ? `<ul class="tight small">${mh.map(m => `<li>${esc(m.ten)}</li>`).join("")}</ul>` : `<p class="small muted">Chưa có loại cứng — nên thêm 3–4 cái ở Bước 1.</p>`}</div>`;
  html += `<div class="card"><div class="card-head"><h2><span class="snum">A</span> Tiêu chí chấm điểm (CWC) ${tip("cwc")}</h2><span class="muted small">${d.tieuChi.length} tiêu chí</span></div>
    <div class="cwc-explain">${CWC_KEYS.map(k => `<div style="--c:${CWC[k].color}"><b>${CWC[k].label}</b><span>${CWC[k].vi}</span></div>`).join("")}</div>
    <p class="small muted" style="margin:10px 0">Nên có <b>4–6 tiêu chí</b>, mỗi nhóm ít nhất 1. Mỗi tiêu chí chấm 1–4 điểm.</p>
    <div id="pdWeight">${weightBoxHtml()}</div>
    ${d.tieuChi.length ? d.tieuChi.map(critEditHtml).join("") : `<div class="empty" style="padding:12px"><p>Chưa có tiêu chí. Bấm <b>Dùng mẫu</b> ở trên cho nhanh, hoặc thêm từng cái.</p></div>`}
    <button class="btn block" data-act="pdAdd" data-list="tieuChi" type="button">＋ Thêm tiêu chí</button></div>`;
  html += `<div class="card"><div class="card-head"><h2><span class="snum">B</span> Lưu scorecard</h2></div>
    <p class="small muted" style="margin-bottom:10px">Ngưỡng kết luận: dưới 2,5 Loại · 2,5–2,9 Cân nhắc · từ 3,0 Đạt.</p>
    <div class="btn-row"><button class="btn" data-act="pdCopyHM" type="button">📋 Copy chân dung + scorecard gửi HM</button>
      <button class="btn primary" data-act="pdSave" data-mode="scorecard" type="button">💾 Lưu scorecard</button></div>
    <div style="text-align:right;margin-top:6px">${backupBtn()}</div></div>`;
  if (p && hasScorecard(p)) html += nextStepCard(p, "m4");
  return html;
}

/* =============================================================
 * CÔNG CỤ — TRANG CHUNG
 * ============================================================= */
function viewTools(id, query) {
  if (id === "loc-cv") return viewLocCV(query);
  if (id === "so-van") return viewSoVan(query);
  if (id === "jd") return viewJD(query);
  if (id === "nguon") return viewSourcing(query);
  if (id === "so-sanh") return viewCompare(query);
  return viewProcess();
}

/** Trang "Quy trình tuyển dụng": dàn ý 8 module, tính năng nào mở thì bấm được, khoá thì có 🔒 */
function viewProcess() {
  let html = pageHead("🧭 Quy trình tuyển dụng", "toàn bộ tính năng của app, xếp theo <b>8 module</b>. Tính năng có 🔒 đang tạm khoá và <b>sẽ mở sau</b>.");
  html += MODULES.map(m => `<div class="card mod-card"><div class="mod-h"><span class="mnum big">${m.so}</span><b>${esc(m.ten)}</b></div>
    <div class="tool-grid" style="margin:10px 0 0">${m.features.map(x => {
      const F = FEATURES[x.f];
      return isOpen(x.f)
        ? `<a class="tool-card" href="${x.href}"><span class="ico">${F.ico}</span><span><b>${esc(F.t)}</b><span class="d">${esc(F.d)}</span></span><span class="go">→</span></a>`
        : `<div class="tool-card soon-card" data-act="lockedFeature" data-f="${x.f}"><span class="ico">🔒</span><span><b>${esc(F.t)}</b><span class="d">${esc(F.d)}</span></span><span class="badge">Sắp mở</span></div>`;
    }).join("")}</div>
    <a class="small" style="display:inline-block;margin-top:8px" href="#/learn" data-act="openLesson" data-id="m${m.so}">📘 Học Module ${m.so}</a></div>`).join("");
  return html;
}

/* --- Chọn ứng viên + vị trí (dùng chung cho Lọc CV & Sơ vấn) --- */
function pickerHtml(tool, c, posId, scope) {
  const list = sortRecent(Store.candidates);
  const pos = findPos(posId);
  return `<div class="card"><div class="grid two">
    <div><div class="field-label">Ứng viên</div><div class="picker">
      <select class="input" data-change="pickCand" data-tool="${tool}" aria-label="Chọn ứng viên"><option value="">— Chọn ứng viên —</option>
      ${list.map(x => `<option value="${esc(x.candId)}" ${c && x.candId === c.candId ? "selected" : ""}>${esc(candName(x))} · ${esc(stageOf(x))}</option>`).join("")}</select>
      <button class="btn" data-act="toolNewCand" data-tool="${tool}" type="button">＋ Mới</button></div></div>
    ${c ? `<div><div class="field-label">Vị trí (lấy phiếu điểm)</div>
      <select class="input" data-change="pickPos" data-scope="${scope}" aria-label="Chọn vị trí"><option value="">— Chọn vị trí —</option>
      ${Store.positions.map(p => `<option value="${esc(p.posId)}" ${String(p.posId) === String(posId) ? "selected" : ""}>${esc(p.tenViTri)}${hasScorecard(p) ? "" : " (chưa có phiếu điểm)"}</option>`).join("")}</select></div>` : ""}
  </div>${c && pos && !hasScorecard(pos) ? `<div class="banner" style="margin:12px 0 0"><span>⚠️ Vị trí <b>${esc(pos.tenViTri)}</b> chưa có phiếu điểm.</span><a class="btn sm primary" href="#/position/${encodeURIComponent(pos.posId)}">Tạo phiếu điểm</a></div>` : ""}</div>`;
}

/* --- Thẻ chấm 1 tiêu chí (dùng chung) --- */
function scoreButtons(scope, id, cur) {
  return `<div class="sbtns">${[1, 2, 3, 4, "?"].map(v => `<button class="sbtn s${v === "?" ? "q" : v} ${cur === v ? "on" : ""}" data-act="setScore" data-scope="${scope}" data-crit="${id}" data-val="${v}" type="button" title="${esc(SCALE[v].label)}">${v}</button>`).join("")}</div>`;
}
function anchorText(t, v) {
  if (v === undefined || v === null || v === "") return `<span class="muted">Bấm 1–4, hoặc <b>?</b> nếu chưa có bằng chứng. Mô tả mức sẽ hiện ở đây.</span>`;
  if (v === "?") return `<b>?</b> Chưa có bằng chứng — <b>không tính điểm</b>, nhớ hỏi thêm.`;
  return `<b>${v} · ${SCALE[v].label}:</b> ${esc((t.neo || {})[v] || DEFAULT_ANCHORS[v])}`;
}
function critScoreHtml(scope, t, opts = {}) {
  const e = (D[scope].diem || {})[t.id] || {};
  const ai = opts.ai ? (opts.ai.diem || {})[t.id] : null;
  let aiLine = "";
  if (ai) {
    const diff = typeof ai.s === "number" && typeof e.s === "number" && Math.abs(ai.s - e.s) >= 2;
    aiLine = `<div class="ai-line ${diff ? "diff" : ""}">🤖 AI chấm <b>${esc(ai.s)}</b>${ai.bc ? ` — “${esc(ai.bc)}”` : ""}
      ${diff ? `<div class="small"><b>Lệch ${Math.abs(ai.s - e.s)} điểm</b> — đọc lại bằng chứng, ai đúng hơn?</div>` : ""}
      ${ai.s !== e.s ? `<button class="btn sm" data-act="useAI" data-scope="${scope}" data-crit="${t.id}" type="button">Dùng điểm AI</button>` : ""}</div>`;
  }
  return `<div class="crit" style="--c:${(CWC[t.nhom] || {}).color || "var(--line)"}">
    <div class="crit-head"><b>${esc(t.ten)}</b><span class="badge" style="--c:${(CWC[t.nhom] || {}).color}">${esc((CWC[t.nhom] || {}).label || "")} · ${esc(t.trongSo)}%</span></div>
    ${opts.role || ""}
    ${t.hanhVi ? `<div class="small muted" style="margin-bottom:8px">Tìm: ${esc(t.hanhVi)}</div>` : ""}
    ${opts.top || ""}
    ${scoreButtons(scope, t.id, e.s)}
    <div class="anchor" id="anc-${scope}-${t.id}">${anchorText(t, e.s)}</div>
    <details class="neo"><summary>Xem mô tả cả 4 mức</summary><ol class="neo-list">${[1, 2, 3, 4].map(k => `<li><b>${k} · ${SCALE[k].label}:</b> ${esc((t.neo || {})[k] || DEFAULT_ANCHORS[k])}</li>`).join("")}</ol></details>
    <label class="field" style="margin:10px 0 0"><span class="small">${opts.evLabel || "Bằng chứng"}</span>${bound(scope, `diem.${t.id}.bc`, { ph: opts.evPh || "", area: true, rows: opts.rows || 2, lint: "legal" })}</label>
    ${opts.after || ""}${aiLine}</div>`;
}

/* --- Kết quả + lưu (dùng chung) --- */
const TARGETS = {
  lc: ["Giữ nguyên", "Đã lọc CV", "Loại", "Talent Pool"],
  sv: ["Giữ nguyên", "Đạt sơ vấn", "Loại", "Talent Pool"]
};
function defaultTarget(scope, r, c) {
  const stage = stageOf(c), idx = MAIN_STAGES.indexOf(stage);
  if (r.verdict === "Loại") return r.strengths.length && !r.mustFail ? "Talent Pool" : "Loại";
  if (scope === "lc") return r.verdict && stage === "Mới" ? "Đã lọc CV" : "Giữ nguyên";
  if (r.verdict === "Đạt") return idx >= 0 && idx < 2 ? "Đạt sơ vấn" : "Giữ nguyên";
  return "Giữ nguyên";
}
function resultHtml(scope) {
  const d = D[scope];
  const c = findCand(d.candId), pos = findPos(d.posId);
  if (!c || !hasScorecard(pos)) return "";
  const r = evalDraft(d, pos.scorecard);
  if (!d.targetManual) d.target = defaultTarget(scope, r, c);
  const cls = verdictClass(r.verdict, r.score);
  const notes = [];
  if (r.mustFail) notes.push(`⛔ <b>Trượt loại cứng</b> → kết luận <b>Loại</b> (dù điểm cao).`);
  if (scope === "lc" && r.mustUnknown && !r.mustFail) notes.push(`❓ Còn <b>${r.mustUnknown}</b> loại cứng chưa rõ → hỏi khi sơ vấn, <b>đừng loại vội</b>.`);
  if (r.n < r.total) notes.push(`Ô <b>?</b>/chưa chấm không tính điểm (${r.total - r.n} tiêu chí)${scope === "lc" ? " — hỏi thêm ở sơ vấn" : ""}.`);
  if (r.verdict === "Loại" && r.strengths.length && !r.mustFail) notes.push(`💡 Loại nhưng có điểm mạnh: <b>${esc(r.strengths.join(", "))}</b> → nên đưa vào <b>Talent Pool</b>.`);
  const cur = stageOf(c);
  return `<div class="result ${cls}">
    <div class="result-top"><div><div class="lbl">Điểm ${scope === "lc" ? "lọc CV" : "sơ vấn"}</div>
      <div class="big">${r.score !== null ? fmtScore(r.score) : "—"}<span class="small muted"> / 4</span></div></div>
      <div class="verdict-pill ${cls}">${esc(r.verdict || "Chưa chấm")}</div></div>
    <div class="small muted">Đã chấm ${r.n}/${r.total} tiêu chí · ngưỡng: dưới 2,5 Loại · 2,5–2,9 Cân nhắc · từ 3,0 Đạt</div>
    ${notes.length ? `<div class="result-notes">${notes.map(n => `<div>${n}</div>`).join("")}</div>` : ""}
    <div class="field-label" style="margin-top:12px">Sau khi lưu, chuyển ứng viên sang:</div>
    <div class="chips">${TARGETS[scope].map(t => `<button class="chip ${d.target === t ? "on" : ""}" data-act="setTarget" data-scope="${scope}" data-val="${esc(t)}" type="button">${t === "Giữ nguyên" ? `Giữ nguyên (${esc(cur)})` : esc(t)}</button>`).join("")}</div>
    <div class="btn-row" style="margin-top:12px">
      ${scope === "sv" ? `<button class="btn" data-act="svSave" data-hm="1" type="button">💾 Lưu & tạo tóm tắt gửi HM</button>` : ""}
      <button class="btn primary" data-act="${scope}Save" type="button">💾 Lưu kết quả</button></div>
    <div style="text-align:right;margin-top:6px">${backupBtn()}</div></div>`;
}
function miniScoreHtml(scope) {
  const d = D[scope], pos = findPos(d.posId);
  if (!hasScorecard(pos)) return "";
  const r = evalDraft(d, pos.scorecard);
  return `<a class="mini-score ${verdictClass(r.verdict, r.score)}" href="#" data-act="scrollResult">${r.score !== null ? fmtScore(r.score) : "—"} · ${esc(r.verdict || "Chưa chấm")} <span class="muted">(${r.n}/${r.total})</span></a>`;
}
function updateLive(scope) {
  const box = $("#live-" + scope);
  if (box) box.innerHTML = resultHtml(scope);
  const mini = $("#mini-" + scope);
  if (mini) mini.innerHTML = miniScoreHtml(scope);
}

function saveResult(scope, extraChiTiet) {
  const d = D[scope];
  const c = findCand(d.candId), pos = findPos(d.posId);
  if (!c || !hasScorecard(pos)) return null;
  const sc = pos.scorecard;
  const r = evalDraft(d, sc);
  if (!r.n && !r.mustFail) { toast("Chấm ít nhất 1 tiêu chí rồi mới lưu nhé"); return null; }
  const chiTiet = Object.assign({}, asObj(c.chiTiet));
  const bangChung = Object.assign({}, asObj(chiTiet.bangChung));
  (sc.tieuChi || []).forEach(t => {
    const e = (d.diem || {})[t.id];
    if (e && str(e.bc)) bangChung[t.ten] = `${scope === "lc" ? "CV" : "Sơ vấn"} (${typeof e.s === "number" ? e.s + "/4" : "chưa rõ"}): ${str(e.bc)}`;
  });
  chiTiet.bangChung = bangChung;
  Object.assign(chiTiet, extraChiTiet(r));
  const cand = { candId: c.candId, posId: d.posId, chiTiet };
  const target = d.target && d.target !== "Giữ nguyên" && d.target !== stageOf(c) ? d.target : null;
  if (target) {
    cand.trangThai = target;
    chiTiet.lichSu = [...(Array.isArray(chiTiet.lichSu) ? chiTiet.lichSu : []),
      { t: new Date().toISOString(), tu: stageOf(c), den: target, by: getUser(), note: `${scope === "lc" ? "Lọc CV" : "Sơ vấn"}: ${r.score !== null ? fmtScore(r.score) : "—"} · ${r.verdict}` }];
  }
  return { cand, r, target };
}

/* =============================================================
 * CÔNG CỤ — LỌC CV
 * ============================================================= */
function initDraft(scope, prefix, c, posId, fromSaved) {
  const key = prefix + c.candId;
  if (D[scope + "Key"] === key && D[scope] && D[scope].posId === posId) return;
  D[scope + "Key"] = key;
  const draft = loadDraft(key);
  if (draft && draft.posId === posId) { D[scope] = draft; return; }
  const saved = asObj(asObj(c.chiTiet)[fromSaved]);
  D[scope] = saved.posId && String(saved.posId) === String(posId)
    ? Object.assign({ must: {}, diem: {} }, clone(saved), { candId: c.candId, posId, target: null, targetManual: false })
    : { candId: c.candId, posId, must: {}, diem: {}, target: null, targetManual: false };
}
function draftBanner(scope) {
  return loadDraft(D[scope + "Key"]) ? `<div class="banner" style="margin:0 0 14px"><span>📝 Đang chấm dở — bản nháp trên máy, <b>chưa lưu lên Sheet</b>.</span><button class="btn sm" data-act="discardDraft" data-scope="${scope}" type="button">Bỏ nháp</button></div>` : "";
}

function viewLocCV(query) {
  const c = query.get("cand") ? findCand(query.get("cand")) : null;
  let html = `<a class="back" href="#/tools">← Công cụ</a>` + pageHead("📄 Lọc CV",
    "chấm từng tiêu chí theo <b>phiếu điểm</b> của vị trí: bấm 1–4 (hoặc <b>?</b> nếu CV không nói tới) + chép bằng chứng từ CV. App tự tính điểm.");
  if (!c) {
    if (query.get("cand") && !Store.state.hasData && isConnected()) return html + loadingBlock();
    return html + pickerHtml("loc-cv", null, null, "lc") + `<div class="card">${emptyBlock("👆", "Chọn ứng viên để bắt đầu", "Chọn ở ô trên, hoặc bấm <b>＋ Mới</b> để thêm nhanh ứng viên.")}</div>`;
  }
  const posId = (D.lc && D.lc.candId === c.candId && D.lcKey === "loc_" + c.candId ? D.lc.posId : null) || str(c.posId);
  const pos = findPos(posId);
  html += pickerHtml("loc-cv", c, posId, "lc");
  if (!pos) return html + `<div class="card">${emptyBlock("💼", "Chọn vị trí", "Ứng viên chưa gắn vị trí. Chọn vị trí ở trên để lấy phiếu điểm.")}</div>`;
  if (!hasScorecard(pos)) return html;
  initDraft("lc", "loc_", c, posId, "locCV");
  const d = D.lc, sc = pos.scorecard;
  html += draftBanner("lc");

  html += `<details class="card guide"><summary><b>🧠 5 tư duy & 4 bẫy khi lọc CV</b> <span class="muted small">(đọc 1 phút)</span></summary>
    <div class="grid two" style="margin-top:10px"><div><b>Nên nghĩ:</b><ul class="tight">${CV_MINDSETS.map(x => `<li>${x}</li>`).join("")}</ul></div>
    <div><b>Coi chừng bẫy:</b><ul class="tight">${CV_TRAPS.map(x => `<li>${x}</li>`).join("")}</ul></div></div></details>`;

  // Loại cứng
  html += `<div class="card"><div class="card-head"><h2><span class="snum">1</span> Loại cứng ${tip("mustHave")}</h2></div>
    <p class="small muted" style="margin-bottom:10px">CV thường không ghi rõ → để <b>?</b> và hỏi khi sơ vấn. Chỉ bấm <b>Trượt</b> khi CV ghi rõ là không đáp ứng.</p>
    ${(sc.mustHave || []).map(m => mustRowLC(m)).join("") || `<p class="muted small">Vị trí này không có loại cứng.</p>`}</div>`;

  // Tiêu chí
  html += `<div class="card"><div class="card-head"><h2><span class="snum">2</span> Chấm tiêu chí</h2>${tip("locCV")}</div>
    ${(sc.tieuChi || []).map(t => critScoreHtml("lc", t, { ai: d.ai, evLabel: "Bằng chứng trích từ CV", evPh: "VD: “Bán hàng tại Routine Q.3, 01/2023–06/2024, đạt 110% KPI” — chép đúng chữ trong CV" })).join("")}</div>`;

  // AI
  html += aiCVCardHtml(d, pos);

  // Kết quả
  html += `<div class="card" id="resultCard"><div class="card-head"><h2><span class="snum">4</span> Kết quả</h2></div><div id="live-lc">${resultHtml("lc")}</div></div>`;
  html += `<div id="mini-lc">${miniScoreHtml("lc")}</div>`;
  return html;
}
function mustRowLC(m) {
  const cur = ((D.lc.must || {})[m.id] || {}).k;
  const ai = D.lc.ai && (D.lc.ai.must || {})[m.id];
  const opt = [["dat", "✓ Đạt"], ["truot", "✕ Trượt"], ["?", "? Chưa rõ"]];
  return `<div class="must-row"><div class="must-q"><b>${esc(m.ten)}</b></div>
    <div class="chips">${opt.map(([k, l]) => `<button class="chip must-${k === "?" ? "q" : k} ${cur === k ? "on" : ""}" data-act="setMust" data-scope="lc" data-m="${m.id}" data-val="${k}" type="button">${l}</button>`).join("")}</div>
    ${ai ? `<div class="ai-line small">🤖 AI: <b>${esc({ dat: "Đạt", truot: "Trượt" }[ai.k] || "Chưa rõ")}</b>${ai.bc ? ` — “${esc(ai.bc)}”` : ""}</div>` : ""}</div>`;
}
function aiCVCardHtml(d, pos) {
  let compare = "";
  if (d.ai) {
    const ai = calcScore(pos.scorecard.tieuChi, d.ai.diem || {});
    const ta = calcScore(pos.scorecard.tieuChi, d.diem || {});
    const lech = (pos.scorecard.tieuChi || []).filter(t => {
      const a = ((d.ai.diem || {})[t.id] || {}).s, b = ((d.diem || {})[t.id] || {}).s;
      return typeof a === "number" && typeof b === "number" && Math.abs(a - b) >= 2;
    }).length;
    compare = `<div class="compare"><div><span class="lbl">Bạn chấm</span><b>${ta.score !== null ? fmtScore(ta.score) : "—"}</b></div>
      <div><span class="lbl">AI chấm</span><b>${ai.score !== null ? fmtScore(ai.score) : "—"}</b></div>
      <div><span class="lbl">Lệch ≥2 điểm</span><b>${lech}</b></div></div>
      ${d.ai.diemManh ? `<p class="small"><b>AI thấy điểm mạnh:</b> ${esc(d.ai.diemManh)}</p>` : ""}
      ${d.ai.canHoiThem ? `<p class="small"><b>AI gợi ý hỏi thêm khi sơ vấn:</b> ${esc(d.ai.canHoiThem)}</p>` : ""}
      <div class="btn-row" style="margin-top:8px"><button class="btn sm" data-act="useAIAll" type="button">Dùng điểm AI cho ô bạn chưa chấm</button>
      <button class="btn sm ghost" data-act="clearAI" type="button">Xoá kết quả AI</button></div>`;
  }
  return `<details class="card" ${d.ai ? "open" : ""}><summary class="card-head" style="margin:0"><h2><span class="snum">3</span> 🤖 Chấm bằng AI để đối chiếu <span class="muted small">(tuỳ chọn)</span></h2></summary>
    <div style="margin-top:12px">
    <p class="howto" style="margin:0 0 12px"><span>Tự chấm trước, rồi nhờ AI chấm để <b>so lại</b>. Chỗ nào lệch nhiều → đọc kỹ lại CV. AI chỉ để tham khảo, <b>bạn là người quyết định</b>.</span></p>
    <ol class="ai-steps">
      <li><b>Dán nội dung CV</b> vào ô dưới (copy chữ trong file CV). <span class="muted">Nên xoá SĐT, email trước khi dán.</span>
        ${bound("lc", "cvText", { area: true, rows: 4, ph: "Dán chữ trong CV vào đây…" })}</li>
      <li><button class="btn sm primary" data-act="copyCVPrompt" type="button">📋 Copy prompt</button> → mở <b>ChatGPT</b> hoặc <b>Claude</b> → dán → gửi.</li>
      <li><b>Copy kết quả AI</b> trả về, dán vào đây rồi bấm <b>Tự điền</b>:
        <textarea class="input" id="aiPaste" rows="3" placeholder='Dán kết quả AI (dạng {"mustHave": …})'></textarea>
        <div class="field-error" id="aiErr"></div>
        <button class="btn sm primary" style="margin-top:8px" data-act="fillCVAI" type="button">✨ Tự điền</button></li>
    </ol>${compare}</div></details>`;
}

/* =============================================================
 * CÔNG CỤ — SƠ VẤN
 * ============================================================= */
function viewSoVan(query) {
  const c = query.get("cand") ? findCand(query.get("cand")) : null;
  let html = `<a class="back" href="#/tools">← Công cụ</a>` + pageHead("📞 Sơ vấn",
    "phiếu gọi sơ bộ <b>trước vòng quản lý (HM)</b>. Đi lần lượt 6 phần, mỗi phần có câu gợi ý — vừa gọi vừa bấm.");
  if (!c) {
    if (query.get("cand") && !Store.state.hasData && isConnected()) return html + loadingBlock();
    return html + pickerHtml("so-van", null, null, "sv") + `<div class="card">${emptyBlock("👆", "Chọn ứng viên để bắt đầu", "Thường là người đã qua <b>Lọc CV</b>.")}</div>`;
  }
  const posId = (D.sv && D.sv.candId === c.candId && D.svKey === "sv_" + c.candId ? D.sv.posId : null) || str(c.posId);
  const pos = findPos(posId);
  html += pickerHtml("so-van", c, posId, "sv");
  if (!pos) return html + `<div class="card">${emptyBlock("💼", "Chọn vị trí", "Ứng viên chưa gắn vị trí. Chọn vị trí ở trên để lấy phiếu điểm.")}</div>`;
  if (!hasScorecard(pos)) return html;
  initDraft("sv", "sv_", c, posId, "soVan");
  const d = D.sv, sc = pos.scorecard;
  d.prep = d.prep || {};
  if (!d.hen) d.hen = "2";
  html += draftBanner("sv");
  const ten = str(c.hoTen) ? givenName(c.hoTen) : "bạn";
  const lc = asObj(asObj(c.chiTiet).locCV);
  const part = n => `<span class="snum">${n}</span> ${SOVAN_PARTS[n - 1].t}`;
  const partHint = n => `<p class="small muted" style="margin-bottom:10px">${SOVAN_PARTS[n - 1].d}</p>`;

  // 1. Chuẩn bị
  const ask = [];
  if (lc.posId) {
    (sc.mustHave || []).forEach(m => { const k = ((lc.must || {})[m.id] || {}).k; if (!k || k === "?") ask.push(`Loại cứng: ${m.ten}`); });
    (sc.tieuChi || []).forEach(t => { const s = ((lc.diem || {})[t.id] || {}).s; if (s === "?" || s === undefined) ask.push(`Tiêu chí: ${t.ten}`); });
  }
  html += `<div class="card"><div class="card-head"><h2>${part(1)}</h2></div>${partHint(1)}
    <div class="score-line">Điểm lọc CV: ${toNum(c.diemCV) !== null ? `<b class="verdict ${verdictClass(c.ketLuanCV, toNum(c.diemCV))}">${fmtScore(toNum(c.diemCV))} · ${esc(c.ketLuanCV)}</b>` : `<span class="muted">chưa lọc CV</span> · <a href="#/tools/loc-cv?cand=${encodeURIComponent(c.candId)}">Lọc CV trước</a>`}</div>
    ${ask.length ? `<div class="lint-box" style="margin-top:8px">❓ <b>Cần hỏi thêm</b> (lọc CV để “?”):<br>• ${ask.map(esc).join("<br>• ")}</div>` : ""}
    ${lc.ai && lc.ai.canHoiThem ? `<p class="small" style="margin-top:6px">🤖 AI gợi ý hỏi: ${esc(lc.ai.canHoiThem)}</p>` : ""}
    <div style="margin-top:10px">${SOVAN_PREP.map((p, i) => `<label class="check"><input type="checkbox" data-act="svCheck" data-k="${i}" ${d.prep[i] ? "checked" : ""}> ${esc(p)}</label>`).join("")}</div></div>`;

  // 2. Mở đầu
  const opening = `Chào ${ten}, mình là ${getUser() || "[tên]"} bên tuyển dụng ATINO. Cảm ơn bạn đã ứng tuyển vị trí ${pos.tenViTri}. Cuộc trò chuyện khoảng 15–20 phút để hai bên hiểu nhau hơn. Mình xin phép ghi chú trong lúc nói chuyện nhé?`;
  html += `<div class="card"><div class="card-head"><h2>${part(2)}</h2></div>${partHint(2)}
    <div class="script">🗣️ “${esc(opening)}”</div>
    <div class="btn-row" style="margin-top:8px"><button class="btn sm" data-act="copyStr" data-text="${esc(opening)}" type="button">📋 Copy lời mở đầu</button></div></div>`;

  // 3. Loại cứng
  html += `<div class="card"><div class="card-head"><h2>${part(3)} ${tip("mustHave")}</h2></div>${partHint(3)}
    ${(sc.mustHave || []).map(m => {
      const e = (d.must || {})[m.id] || {};
      const fromCV = ((lc.must || {})[m.id] || {}).k;
      return `<div class="must-row"><div class="must-q"><span class="qtag good">K</span> <b>${esc(m.ten)}</b>
        ${m.cauHoi ? `<div class="script small">🗣️ “${esc(m.cauHoi)}”</div>` : ""}${fromCV === "dat" ? `<div class="small muted">Lọc CV: đã thấy Đạt — xác nhận lại.</div>` : ""}</div>
        <div class="chips">${[["co", "✓ Có"], ["khong", "✕ Không"], ["?", "? Chưa rõ"]].map(([k, l]) => `<button class="chip must-${k === "co" ? "dat" : k === "khong" ? "truot" : "q"} ${e.k === k ? "on" : ""}" data-act="setMust" data-scope="sv" data-m="${m.id}" data-val="${k}" type="button">${l}</button>`).join("")}</div>
        ${bound("sv", `must.${m.id}.note`, { ph: "Ghi chú, VD: làm được ca tối trừ thứ 7", lint: "legal" })}</div>`;
    }).join("") || `<p class="muted small">Vị trí không có loại cứng.</p>`}
    ${Object.values(d.must || {}).some(e => e.k === "khong") ? `<div class="lint-box">⛔ Ứng viên <b>không đáp ứng loại cứng</b> → có thể kết thúc nhẹ nhàng sớm: cảm ơn, hẹn báo kết quả.</div>` : ""}</div>`;

  // 4. Thân
  const order = { want: 0, can: 1, culture: 2 };
  const crits = (sc.tieuChi || []).slice().sort((a, b) => (order[a.nhom] ?? 3) - (order[b.nhom] ?? 3));
  html += `<div class="card"><div class="card-head"><h2>${part(4)} ${tip("star")}</h2></div>${partHint(4)}
    <details class="guide-inline"><summary>📚 7 loại câu hỏi — câu nào nên/không nên</summary>
      <div class="qtypes">${Object.keys(QUESTION_TYPES).map(k => { const q = QUESTION_TYPES[k]; return `<div><span class="qtag ${q.ok}">${k}</span> <b>${q.label}</b> ${q.ok === "good" ? "✅" : q.ok === "bad" ? "❌" : "⛔"}<div class="small muted">${q.ex}</div></div>`; }).join("")}</div></details>
    <div class="star-probes"><b class="small">Đào sâu STAR (hỏi tiếp khi câu trả lời chung chung):</b>
      ${STAR_PROBES.map(p => `<div class="small"><span class="qtag good">${p.k}</span> ${esc(p.q)}</div>`).join("")}</div>
    ${crits.map(t => {
      const qs = [{ q: t.cauHoi, t: t.loaiCauHoi || "H" }, ...(QUESTION_BANK[t.nhom] || [])].filter(x => str(x.q)).slice(0, 3);
      const role = t.nhom === "want"
        ? `<div class="role main">⭐ <b>CHÍNH</b> — TA chấm kỹ phần này</div>`
        : `<div class="role signal">📡 <b>Tín hiệu</b> — chấm nếu nghe được, HM sẽ kiểm sâu</div>`;
      const top = `<div class="qlist">${qs.map(x => `<div class="small">🗣️ <span class="qtag good">${esc(x.t)}</span> ${esc(x.q)}</div>`).join("")}</div>`;
      return critScoreHtml("sv", t, { role, top, evLabel: "Bằng chứng STAR", rows: 3,
        evPh: "S: tình huống… T: nhiệm vụ… A: bạn ấy đã làm gì… R: kết quả, con số…",
        after: `<button class="btn sm ghost" style="padding-left:0" data-act="insertStar" data-crit="${t.id}" type="button">＋ Chèn khung S/T/A/R</button>` });
    }).join("")}</div>`;

  // 5. Ứng viên hỏi + đóng
  const days = d.hen || "2";
  const closing = `Cảm ơn ${ten} đã dành thời gian. Trong vòng ${days} ngày làm việc, mình sẽ báo kết quả qua Zalo/điện thoại. Nếu phù hợp, bước tiếp theo là gặp quản lý cửa hàng — phỏng vấn gọn 1 vòng. Bạn có câu hỏi gì cho mình không?`;
  html += `<div class="card"><div class="card-head"><h2>${part(5)}</h2></div>${partHint(5)}
    <label class="field"><span>Ứng viên hỏi gì / mình trả lời gì</span>${bound("sv", "hoi", { area: true, ph: "VD: Hỏi lương thử việc → đã báo 100% lương, thử việc 1 tháng", lint: "legal" })}</label>
    <div class="field-label">Hẹn báo kết quả trong</div>
    <div class="chips" style="margin-bottom:10px">${["1", "2", "3"].map(n => `<button class="chip ${days === n ? "on" : ""}" data-act="svHen" data-val="${n}" type="button">${n} ngày</button>`).join("")}</div>
    <div class="script">🗣️ “${esc(closing)}”</div></div>`;

  // 6. Chấm ngay
  html += `<div class="card" id="resultCard"><div class="card-head"><h2>${part(6)}</h2></div>${partHint(6)}<div id="live-sv">${resultHtml("sv")}</div></div>`;
  html += `<div id="mini-sv">${miniScoreHtml("sv")}</div>`;
  return html;
}

/* =============================================================
 * HỘP THOẠI AI CHÂN DUNG
 * ============================================================= */
function openPortraitAI() {
  const d = D.pd;
  openModal("🤖 Nhờ AI soạn chân dung", `
    <p class="howto" style="margin:0 0 12px"><span>AI soạn nháp, <b>bạn sửa lại</b> cho đúng ý HM. Làm 3 bước:</span></p>
    <ol class="ai-steps">
      <li>Kiểm tra thông tin (lấy từ form): <b>${esc(d.tenViTri || "(chưa có tên vị trí)")}</b> · ${esc(GROUPS[d.nhom].label)}${d.khuVuc ? " · " + esc(d.khuVuc) : ""}.
        <div class="small muted">Ghi càng rõ “HM nói gì” ở bước 1 thì AI soạn càng sát.</div></li>
      <li><button class="btn sm primary" data-act="copyPortraitPrompt" type="button">📋 Copy prompt</button> → mở <b>ChatGPT</b> hoặc <b>Claude</b> → dán → gửi.</li>
      <li>Copy kết quả AI, dán vào đây:
        <textarea class="input" id="aiPaste" rows="5" placeholder='Dán kết quả AI (dạng {"mucTieu": …})'></textarea>
        <div class="field-error" id="aiErr"></div>
        <button class="btn primary block" style="margin-top:10px" data-act="fillPortraitAI" type="button">✨ Tự điền vào form</button></li>
    </ol>`);
}

/* =============================================================
 * XỬ LÝ SỰ KIỆN PHA 2
 * ============================================================= */
Object.assign(ACTIONS, {
  /* --- chung --- */
  discardDraft: (el) => {
    const s = el.dataset.scope;
    if (!confirm("Bỏ bản nháp chưa lưu? Những gì bạn vừa gõ sẽ mất.")) return;
    clearDraft(D[s + "Key"]); D[s] = null; D[s + "Key"] = null;
    render();
  },
  copyStr: (el) => copyText(el.dataset.text),
  scrollResult: (el, ev) => { ev.preventDefault(); const r = $("#resultCard"); if (r) r.scrollIntoView({ behavior: "smooth", block: "start" }); },
  toolNewCand: (el) => {
    const tool = el.dataset.tool;
    openCandidateForm(null, id => go(`#/tools/${tool}?cand=${encodeURIComponent(id)}`));
  },

  /* --- chân dung --- */
  pdNhom: (el) => { D.pd.nhom = el.dataset.val; persistDraft("pd"); $$('[data-act="pdNhom"]').forEach(b => b.classList.toggle("on", b === el)); },
  pdTemplate: (el) => {
    const k = el.dataset.val, tpl = TEMPLATES[k];
    const d = D.pd;
    const t = withIds(clone({ mustHave: tpl.mustHave, tieuChi: tpl.tieuChi }));
    if (el.dataset.tab === "scorecard") {
      // Bước 4: chỉ thay tiêu chí chấm điểm
      if (d.tieuChi.length && !confirm(`Dùng mẫu “${tpl.ten}” sẽ THAY các tiêu chí đang có. Tiếp tục?`)) return;
      d.tieuChi = t.tieuChi;
    } else {
      // Bước 1: thay loại cứng + mục tiêu; tiêu chí chỉ điền nếu đang trống (để dành cho Bước 4)
      if ((d.mustHave.length || str(d.mucTieu.d30)) && !confirm(`Dùng mẫu “${tpl.ten}” sẽ THAY loại cứng và mục tiêu đang có. Tiếp tục?`)) return;
      d.mustHave = t.mustHave; d.mucTieu = clone(tpl.mucTieu); d.nhom = k;
      if (!d.tieuChi.length) d.tieuChi = t.tieuChi;
    }
    persistDraft("pd"); render();
    toast("Đã điền mẫu ✓ — nhớ sửa [chỗ trong ngoặc] cho đúng cửa hàng");
  },
  pdAdd: (el) => {
    const list = el.dataset.list;
    if (list === "mustHave") D.pd.mustHave.push({ id: uid("m"), ten: "", cauHoi: "" });
    else D.pd.tieuChi.push({ id: uid("t"), ten: "", nhom: "can", trongSo: 15, hanhVi: "", cauHoi: "", loaiCauHoi: "H", neo: {} });
    persistDraft("pd"); render();
  },
  pdDel: (el) => {
    const list = el.dataset.list, i = +el.dataset.i;
    const item = D.pd[list][i];
    if ((str(item.ten) || str(item.cauHoi)) && !confirm(`Xoá “${str(item.ten) || "mục này"}”?`)) return;
    D.pd[list].splice(i, 1);
    persistDraft("pd"); render();
  },
  pdCritNhom: (el) => { D.pd.tieuChi[+el.dataset.i].nhom = el.dataset.val; persistDraft("pd"); render(); },
  pdCritQ: (el) => {
    D.pd.tieuChi[+el.dataset.i].loaiCauHoi = el.dataset.val; persistDraft("pd");
    $$(`[data-act="pdCritQ"][data-i="${el.dataset.i}"]`).forEach(b => b.classList.toggle("on", b === el));
  },
  pdW: (el) => {
    const t = D.pd.tieuChi[+el.dataset.i];
    t.trongSo = Math.max(0, Math.min(100, (+t.trongSo || 0) + (+el.dataset.d)));
    const inp = $(`[data-bind="tieuChi.${el.dataset.i}.trongSo"]`);
    if (inp) inp.value = t.trongSo;
    persistDraft("pd"); $("#pdWeight").innerHTML = weightBoxHtml();
  },
  pdBalance: () => { autoBalance(D.pd.tieuChi); persistDraft("pd"); render(); toast("Đã cân lại trọng số ✓"); },
  pdAI: () => openPortraitAI(),
  copyPortraitPrompt: () => {
    const d = D.pd;
    copyText(aiPromptPortrait({ tenViTri: d.tenViTri, nhom: d.nhom, khuVuc: d.khuVuc, moTa: d.moTaHM }));
  },
  fillPortraitAI: () => {
    const err = $("#aiErr");
    try {
      const j = parseAIJson($("#aiPaste").value);
      if (!Array.isArray(j.tieuChi) || !j.tieuChi.length) throw new Error("Kết quả thiếu phần “tieuChi”. Bảo AI trả đúng mẫu JSON rồi dán lại.");
      const d = D.pd;
      if ((d.mustHave.length || d.tieuChi.length) && !confirm("Kết quả AI sẽ THAY loại cứng, tiêu chí và mục tiêu đang có. Tiếp tục?")) return;
      const normNhom = s => { s = str(s).toLowerCase(); return s.includes("want") ? "want" : s.includes("cult") || s.includes("văn hoá") || s.includes("văn hóa") ? "culture" : "can"; };
      const t = withIds({
        mustHave: (j.mustHave || []).map(m => ({ ten: str(m.ten), cauHoi: str(m.cauHoi) })),
        tieuChi: j.tieuChi.map(x => ({ ten: str(x.ten), nhom: normNhom(x.nhom), trongSo: Math.round(+x.trongSo || 0), hanhVi: str(x.hanhVi), cauHoi: str(x.cauHoi),
          loaiCauHoi: x.loaiCauHoi === "Đ" ? "Đ" : "H", neo: { 1: str((x.neo || {})[1]), 2: str((x.neo || {})[2]), 3: str((x.neo || {})[3]), 4: str((x.neo || {})[4]) } }))
      });
      d.mustHave = t.mustHave; d.tieuChi = t.tieuChi;
      if (j.mucTieu) d.mucTieu = { d30: str(j.mucTieu.d30), d60: str(j.mucTieu.d60), d90: str(j.mucTieu.d90) };
      if (!weightCheck(d.tieuChi).ok) autoBalance(d.tieuChi);
      persistDraft("pd");
      closeModal(); render();
      const allText = JSON.stringify(j);
      toast(legalCheck(allText).length ? "Đã điền ✓ — có chỗ AI dùng từ nhạy cảm, xem cảnh báo đỏ" : "Đã điền từ AI ✓ — đọc lại và sửa cho đúng ý HM");
    } catch (e) { err.textContent = e.message; }
  },
  pdCopyHM: () => {
    const d = D.pd;
    if (!d.mustHave.length && !d.tieuChi.length) { toast("Chưa có loại cứng / tiêu chí nào để gửi"); return; }
    copyText(portraitText(d, d));
  },
  pdSave: (el) => {
    const mode = el.dataset.mode === "scorecard" ? "scorecard" : "chandung";
    const d = D.pd;
    if (!str(d.tenViTri)) { toast("Nhập tên vị trí trước nhé"); const f = $('[data-bind="tenViTri"]'); if (f) { f.focus(); f.scrollIntoView({ block: "center" }); } return; }
    d.mustHave = d.mustHave.filter(m => str(m.ten));
    const named = d.tieuChi.filter(t => str(t.ten));
    if (mode === "scorecard") {
      d.tieuChi = named;
      if (!d.tieuChi.length) { render(); toast("Cần ít nhất 1 tiêu chí chấm điểm"); return; }
      if (!weightCheck(d.tieuChi).ok) {
        render();
        const box = $("#pdWeight"); if (box) box.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("Trọng số chưa đúng (tổng 100, mỗi cái 10–40%). Bấm “Tự cân lại”.");
        return;
      }
    }
    const allText = JSON.stringify(mode === "scorecard" ? [d.tieuChi] : [d.tenViTri, d.moTaHM, d.mucTieu, d.mustHave]);
    const hits = legalCheck(allText);
    if (hits.length && !confirm(`⚖️ Có từ thuộc nhóm cấm: ${hits.map(h => h.key).join(", ")}.\nKhông được dùng để đánh giá/loại ứng viên (Điều 3 khoản 8, BLLĐ 2019).\n\nBấm Huỷ để sửa (khuyên dùng), hoặc OK để vẫn lưu.`)) { render(); return; }
    const posId = d.posId || genId("P");
    const old = findPos(posId);
    const chanDung = { khuVuc: str(d.khuVuc), moTaHM: str(d.moTaHM), mucTieu: d.mucTieu, mustHave: d.mustHave, tieuChi: (mode === "scorecard" ? d.tieuChi : d.tieuChi).map(t => Object.assign({}, t, { trongSo: +t.trongSo || 0 })) };
    const position = { posId, tenViTri: str(d.tenViTri), nhom: d.nhom, chanDung, nguoiCapNhat: getUser() };
    // Scorecard: lưu khi ở Bước 4, hoặc cập nhật lại (loại cứng mới) nếu vị trí đã có scorecard hợp lệ
    if (mode === "scorecard" || (old && hasScorecard(old) && weightCheck(chanDung.tieuChi.filter(t => str(t.ten))).ok)) {
      chanDung.tieuChi = chanDung.tieuChi.filter(t => str(t.ten));
      position.scorecard = buildScorecard(chanDung);
    }
    Store.save({ action: "savePosition", step: mode, position });
    clearDraft(D.pdKey); D.pd = null; D.pdKey = null;
    toast(mode === "scorecard" ? "Đã lưu scorecard ✓" : "Đã lưu chân dung ✓");
    goNextAfter(posId, mode === "scorecard" ? "m4" : "m1", `#/position/${encodeURIComponent(posId)}?tab=${mode}`);
  },
  pdDelete: () => {
    const d = D.pd;
    const n = Store.candidates.filter(c => String(c.posId) === String(d.posId)).length;
    if (!confirm(`Xoá hẳn vị trí “${d.tenViTri}” khỏi Google Sheet?${n ? `\n\n⚠️ Đang có ${n} ứng viên gắn với vị trí này — họ sẽ hiện “(vị trí đã xoá)”.` : ""}\n\nKhông khôi phục được.`)) return;
    Store.save({ action: "deletePosition", posId: d.posId });
    clearDraft(D.pdKey); D.pd = null; D.pdKey = null;
    toast("Đã xoá vị trí"); go("#/positions");
  },

  /* --- chấm điểm (Lọc CV & Sơ vấn) --- */
  setScore: (el) => {
    const s = el.dataset.scope, id = el.dataset.crit, v = el.dataset.val === "?" ? "?" : +el.dataset.val;
    const d = D[s]; d.diem = d.diem || {};
    const e = d.diem[id] || (d.diem[id] = {});
    e.s = e.s === v ? undefined : v; // bấm lại để bỏ chọn
    persistDraft(s);
    $$(`[data-act="setScore"][data-scope="${s}"][data-crit="${id}"]`).forEach(b => b.classList.toggle("on", String(e.s) === b.dataset.val));
    const pos = findPos(d.posId);
    const t = (pos.scorecard.tieuChi || []).find(x => x.id === id);
    const anc = $(`#anc-${s}-${id}`); if (anc && t) anc.innerHTML = anchorText(t, e.s);
    updateLive(s);
  },
  setMust: (el) => {
    const s = el.dataset.scope, m = el.dataset.m, v = el.dataset.val;
    const d = D[s]; d.must = d.must || {};
    const e = d.must[m] || (d.must[m] = {});
    e.k = e.k === v ? undefined : v;
    persistDraft(s);
    render();
  },
  setTarget: (el) => { const s = el.dataset.scope; D[s].target = el.dataset.val; D[s].targetManual = true; persistDraft(s); updateLive(s); },
  useAI: (el) => {
    const s = el.dataset.scope, id = el.dataset.crit, ai = D[s].ai.diem[id];
    const e = D[s].diem[id] || (D[s].diem[id] = {});
    e.s = ai.s;
    if (!str(e.bc) && ai.bc) e.bc = ai.bc;
    persistDraft(s); render();
  },
  useAIAll: () => {
    const d = D.lc; let n = 0;
    Object.keys((d.ai || {}).diem || {}).forEach(id => {
      const e = d.diem[id] || (d.diem[id] = {});
      if (e.s === undefined || e.s === null) { e.s = d.ai.diem[id].s; if (!str(e.bc)) e.bc = d.ai.diem[id].bc || ""; n++; }
    });
    Object.keys((d.ai || {}).must || {}).forEach(id => {
      const e = d.must[id] || (d.must[id] = {});
      if (!e.k) { e.k = d.ai.must[id].k; n++; }
    });
    persistDraft("lc"); render();
    toast(n ? `Đã điền ${n} ô từ AI ✓` : "Bạn đã chấm hết rồi — không có ô trống");
  },
  clearAI: () => { D.lc.ai = null; persistDraft("lc"); render(); },
  copyCVPrompt: () => {
    const d = D.lc, pos = findPos(d.posId);
    if (!str(d.cvText)) toast("Nhớ dán CV vào ô ở bước 1 trước nhé");
    copyText(aiPromptCV({ tenViTri: pos.tenViTri, scorecard: pos.scorecard, cvText: d.cvText }));
  },
  fillCVAI: () => {
    const err = $("#aiErr");
    try {
      const j = parseAIJson($("#aiPaste").value);
      const d = D.lc, sc = findPos(d.posId).scorecard;
      const byIdOrName = (arr, item, i) => {
        const raw = (j[arr] || []);
        return raw.find(x => str(x.id) === item.id) || raw.find(x => str(x.ten).toLowerCase() === str(item.ten).toLowerCase()) || raw[i];
      };
      const ai = { must: {}, diem: {}, diemManh: str(j.diemManh), canHoiThem: str(j.canHoiThem) };
      (sc.tieuChi || []).forEach((t, i) => {
        const x = byIdOrName("tieuChi", t, i); if (!x) return;
        const n = parseInt(x.diem, 10);
        ai.diem[t.id] = { s: n >= 1 && n <= 4 ? n : "?", bc: str(x.bangChung) };
      });
      (sc.mustHave || []).forEach((m, i) => {
        const x = byIdOrName("mustHave", m, i); if (!x) return;
        const k = str(x.ketQua).toLowerCase();
        ai.must[m.id] = { k: k.startsWith("dat") || k.startsWith("đạt") ? "dat" : k.startsWith("truot") || k.startsWith("trượt") ? "truot" : "?", bc: str(x.bangChung) };
      });
      if (!Object.keys(ai.diem).length) throw new Error("Không đọc được điểm tiêu chí nào. Bảo AI trả đúng mẫu JSON (giữ nguyên id) rồi dán lại.");
      d.ai = ai;
      persistDraft("lc"); render();
      toast("Đã điền điểm AI ✓ — xem dòng 🤖 dưới mỗi tiêu chí");
    } catch (e) { err.textContent = e.message; }
  },
  lcSave: () => {
    const res = saveResult("lc", r => ({
      locCV: { posId: D.lc.posId, must: D.lc.must, diem: D.lc.diem, ai: D.lc.ai || null, score: r.score, ketLuan: r.verdict, ngay: new Date().toISOString(), by: getUser() }
    }));
    if (!res) return;
    res.cand.diemCV = res.r.score ?? "";
    res.cand.ketLuanCV = res.r.verdict;
    Store.save({ action: "saveCandidate", candidate: res.cand });
    const id = D.lc.candId;
    clearDraft(D.lcKey); D.lc = null; D.lcKey = null;
    toast(`Đã lưu điểm CV ✓${res.target ? " · chuyển → " + res.target : ""}`);
    go("#/candidate/" + encodeURIComponent(id));
  },

  /* --- sơ vấn --- */
  svCheck: (el) => { D.sv.prep[el.dataset.k] = el.checked; persistDraft("sv"); },
  svHen: (el) => { D.sv.hen = el.dataset.val; persistDraft("sv"); render(); },
  insertStar: (el) => {
    const id = el.dataset.crit;
    const e = D.sv.diem[id] || (D.sv.diem[id] = {});
    const frame = "S: \nT: \nA: \nR: ";
    e.bc = str(e.bc) ? str(e.bc) + "\n" + frame : frame;
    persistDraft("sv");
    const ta = $(`[data-scope="sv"][data-bind="diem.${id}.bc"]`);
    if (ta) { ta.value = e.bc; ta.focus(); ta.setSelectionRange(ta.value.indexOf("S: ") + 3, ta.value.indexOf("S: ") + 3); }
  },
  svSave: (el) => {
    const withHM = el.dataset.hm === "1";
    const res = saveResult("sv", r => ({
      soVan: { posId: D.sv.posId, must: D.sv.must, diem: D.sv.diem, hoi: str(D.sv.hoi), hen: D.sv.hen, score: r.score, ketLuan: r.verdict, ngay: new Date().toISOString(), by: getUser() }
    }));
    if (!res) return;
    res.cand.diemSoVan = res.r.score ?? "";
    res.cand.ketLuanSoVan = res.r.verdict;
    Store.save({ action: "saveCandidate", candidate: res.cand });
    const id = D.sv.candId;
    clearDraft(D.svKey); D.sv = null; D.svKey = null;
    toast(`Đã lưu sơ vấn ✓${res.target ? " · chuyển → " + res.target : ""}`);
    go("#/candidate/" + encodeURIComponent(id));
    if (withHM) setTimeout(() => openHM(id), 300);
  }
});

/* Chọn ứng viên / vị trí trong công cụ */
document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (!el.dataset) return;
  if (el.dataset.change === "pickCand") {
    go(`#/tools/${el.dataset.tool}${el.value ? "?cand=" + encodeURIComponent(el.value) : ""}`);
  } else if (el.dataset.change === "pickPos") {
    const s = el.dataset.scope, { query } = parseHash();
    const c = findCand(query.get("cand"));
    if (!c) return;
    const prefix = s === "lc" ? "loc_" : "sv_";
    D[s + "Key"] = prefix + c.candId;
    D[s] = { candId: c.candId, posId: el.value, must: {}, diem: {}, target: null, targetManual: false };
    clearDraft(D[s + "Key"]);
    render();
  }
});

/* Gõ vào ô gắn bản nháp */
document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (!el.dataset || !el.dataset.bind || !el.dataset.scope) return;
  const s = el.dataset.scope;
  if (!D[s]) return;
  let v = el.value;
  if (el.type === "number") v = v === "" ? "" : Number(v);
  setPath(D[s], el.dataset.bind, v);
  persistDraft(s);
  if (el.dataset.lint) {
    const box = document.querySelector(`[data-lint-for="${s}:${el.dataset.bind}"]`);
    if (box) box.innerHTML = lintHtml(el.value, el.dataset.lint);
  }
  if (s === "pd" && /trongSo$/.test(el.dataset.bind)) $("#pdWeight").innerHTML = weightBoxHtml();
  if (s === "lc" || s === "sv") updateLive(s);
});
