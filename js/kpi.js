/* =============================================================
 * ATINO TA HUB — MODULE 8: KPI TỪNG TA (theo tháng) — BỘ KPI TỰ TUỲ CHỈNH
 *
 * - Bộ KPI (tên, đơn vị, chiều tốt, trọng số, nguồn tự động, các tỷ lệ) do quản lý
 *   tự xây trong app (nút "⚙️ Tuỳ chỉnh bộ KPI"), lưu chung trên tab "Kpi" của Sheet
 *   ở dòng có kpiId = "__CONFIG__".
 * - Số liệu từng TA/tháng lưu ở các dòng kpiId = "<tên TA>|<YYYY_MM>".
 * ============================================================= */
"use strict";

const KPI_CONFIG_ID = "__CONFIG__";

/* Nguồn số "app tự ghi nhận" (đếm từ nhật ký hoạt động của TA trong tháng) */
const AUTO_SOURCES = {
  "":        { t: "Không — nhập tay" },
  themUV:    { t: "Số ứng viên thêm vào app", test: l => l.hanhDong === "Thêm ứng viên" },
  locCV:     { t: "Số lần lọc CV", test: l => l.hanhDong === "Lọc CV" },
  soVan:     { t: "Số lần sơ vấn", test: l => l.hanhDong === "Sơ vấn" },
  chuyenHM:  { t: "Số ứng viên chuyển HM", test: l => /→ Chuyển HM/.test(str(l.chiTiet)) },
  offer:     { t: "Số ứng viên chuyển Offer", test: l => /→ Offer/.test(str(l.chiTiet)) },
  nhanViec:  { t: "Số ứng viên Nhận việc", test: l => /→ Nhận việc/.test(str(l.chiTiet)) },
  chanDung:  { t: "Số chân dung đã lưu", test: l => /chân dung/i.test(l.hanhDong) },
  scorecard: { t: "Số scorecard đã lưu", test: l => /scorecard|phiếu điểm/i.test(l.hanhDong) },
  jd:        { t: "Số tin đăng (JD) đã lưu", test: l => l.hanhDong === "Lưu tin đăng" },
  tatCa:     { t: "Tổng thao tác trên app", test: () => true }
};

/* Bộ KPI mặc định (dùng khi chưa tuỳ chỉnh) */
const DEFAULT_KPI_CONFIG = {
  defs: [
    { k: "giao",      t: "Vị trí được giao",    unit: "vị trí", d: "Số vị trí / người cần tuyển TA nhận trong tháng.", lower: false, w: 0,  auto: "" },
    { k: "lapDay",    t: "Đã lấp đầy (đi làm)", unit: "người",  d: "Số người đã nhận việc, đi làm thật.",           lower: false, w: 40, auto: "nhanViec" },
    { k: "cv",        t: "CV thu được",         unit: "CV",     d: "Tổng hồ sơ nhận được từ mọi kênh.",             lower: false, w: 10, auto: "themUV" },
    { k: "soVan",     t: "Đã sơ vấn",           unit: "người",  d: "Số ứng viên TA đã gọi sơ vấn.",                 lower: false, w: 10, auto: "soVan" },
    { k: "chuyenHM",  t: "Chuyển HM",           unit: "người",  d: "Số ứng viên gửi quản lý phỏng vấn.",            lower: false, w: 0,  auto: "chuyenHM" },
    { k: "offer",     t: "Offer đã gửi",        unit: "người",  d: "Số lời mời nhận việc đã gửi.",                  lower: false, w: 0,  auto: "offer" },
    { k: "nhanOffer", t: "Nhận offer",          unit: "người",  d: "Số người đồng ý lời mời nhận việc.",            lower: false, w: 20, auto: "" },
    { k: "ngayTuyen", t: "Thời gian tuyển TB",  unit: "ngày",   d: "Trung bình số ngày từ lúc nhận yêu cầu tới khi người mới đi làm.", lower: true, w: 20, auto: "" }
  ],
  rates: [
    { k: "fill",  t: "Tỷ lệ lấp đầy",    num: "lapDay",    den: "giao",  moc: 56.5, muc: 80, d: "Đã lấp đầy ÷ Vị trí được giao." },
    { k: "offer", t: "Tỷ lệ nhận offer", num: "nhanOffer", den: "offer", moc: 66.7, muc: 85, d: "Nhận offer ÷ Offer đã gửi." },
    { k: "conv",  t: "CV → đi làm",      num: "lapDay",    den: "cv",    moc: null, muc: null, d: "Bao nhiêu % CV thành người đi làm." }
  ]
};
/* KPI gợi ý để thêm nhanh khi xây bộ mới */
const KPI_SUGGEST = [
  { t: "Ứng viên đạt sơ vấn", unit: "người", d: "Số ứng viên qua vòng sơ vấn của TA." },
  { t: "Tỷ lệ qua thử việc", unit: "%", d: "% người mới qua thử việc 1 tháng." },
  { t: "Thời gian HM phản hồi", unit: "ngày", d: "Số ngày trung bình HM trả lời sau khi nhận hồ sơ.", lower: true },
  { t: "Chi phí tuyển / người", unit: "đ", d: "Tổng chi phí kênh ÷ số người đi làm.", lower: true },
  { t: "Ứng viên từ referral", unit: "người", d: "Số ứng viên do nhân viên giới thiệu." },
  { t: "Điểm hài lòng của HM", unit: "điểm", d: "HM chấm 1–5 cho chất lượng ứng viên TA gửi." },
  { t: "Nghỉ việc trong 30 ngày", unit: "người", d: "Số người mới nghỉ trong tháng đầu.", lower: true },
  { t: "Ứng viên đưa vào Talent Pool", unit: "người", d: "Số hồ sơ tốt được giữ lại cho lần sau." }
];

const UI6 = { month: null, ta: null, edit: false, cfg: null };
const monthKey = d => `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;
function kpiMonthLabel(k) { const [y, m] = String(k || "").split("_"); return y && m ? `Tháng ${+m}/${y}` : String(k || ""); }
function shiftMonth(k, n) { const [y, m] = k.split("_").map(Number); return monthKey(new Date(y, m - 1 + n, 1)); }
const inMonth = (l, k) => { const d = new Date(l.thoiGian); return !isNaN(d) && monthKey(d) === k; };
const kpiId = (ta, m) => `${ta}|${m}`;
const kpiRec = (ta, m) => Store.kpi.find(x => String(x.kpiId) === kpiId(ta, m)) || null;
const numOrNull = v => (v === "" || v === null || v === undefined || isNaN(+v)) ? null : +v;
const fmtNum = v => v === null ? "—" : String(Math.round(v * 10) / 10).replace(".", ",");
const fmtPct = v => v === null ? "—" : fmtNum(v) + "%";

/** Bộ KPI đang dùng: bản đã tuỳ chỉnh trên Sheet, nếu chưa có thì dùng mặc định */
function kpiConfig() {
  const rec = Store.kpi.find(x => String(x.kpiId) === KPI_CONFIG_ID);
  const c = rec && asObj(rec.chiTieu);
  return c && Array.isArray(c.defs) && c.defs.length ? { defs: c.defs, rates: Array.isArray(c.rates) ? c.rates : [], custom: true, by: rec.nguoiCapNhat, at: rec.ngayCapNhat } : clone(DEFAULT_KPI_CONFIG);
}
const taRecords = () => Store.kpi.filter(x => String(x.kpiId) !== KPI_CONFIG_ID);
/** Chỉ số áp dụng cho TA nào: apply rỗng = cả team, có tên = chỉ những người đó */
const appliesTo = (def, ta) => !Array.isArray(def.apply) || !def.apply.length || def.apply.includes(ta);
const defsFor = (defs, ta) => defs.filter(d => appliesTo(d, ta));
const rateFor = (rate, defs, ta) => { const a = defs.find(d => d.k === rate.num), b = defs.find(d => d.k === rate.den); return !!a && !!b && appliesTo(a, ta) && appliesTo(b, ta); };
const allTAs = () => Array.from(new Set([...TA_NAMES, ...taRecords().map(x => str(x.ta)), getUser()].filter(Boolean)));
const applyLabel = def => !Array.isArray(def.apply) || !def.apply.length ? "Cả team" : "Riêng: " + def.apply.join(", ");
function autoCount(ta, m, def) {
  const src = AUTO_SOURCES[def.auto || ""];
  return src && src.test ? Store.logs.filter(l => str(l.ta) === ta && inMonth(l, m) && src.test(l)).length : null;
}
/** % hoàn thành 1 KPI so với chỉ tiêu */
function kpiAchieve(actual, target, lower) {
  if (actual === null || target === null || !target) return null;
  return lower ? (actual ? (target / actual) * 100 : 100) : (actual / target) * 100;
}
const achieveCls = p => p === null ? "" : p >= 100 ? "ok" : p >= 70 ? "warn" : "bad";
function rateOf(rec, rate) {
  const t = asObj(rec && rec.thucTe);
  const n = numOrNull(t[rate.num]), d = numOrNull(t[rate.den]);
  return n !== null && d ? (n / d) * 100 : null;
}
function rateCls(v, rate) {
  if (v === null) return "";
  const muc = numOrNull(rate.muc), moc = numOrNull(rate.moc);
  if (muc !== null) return v >= muc ? "ok" : moc !== null && v >= moc ? "warn" : "bad";
  return moc !== null ? (v >= moc ? "ok" : "bad") : "";
}
/** Điểm KPI tổng = Σ(trọng số × % hoàn thành, tối đa 120%) ÷ Σ trọng số các KPI có đủ số */
function kpiScore(rec, defs, ta) {
  const ct = asObj(rec && rec.chiTieu), tt = asObj(rec && rec.thucTe);
  let s = 0, w = 0;
  defs.filter(d => !ta || appliesTo(d, ta)).forEach(d => {
    const wt = +d.w || 0; if (!wt) return;
    const p = kpiAchieve(numOrNull(tt[d.k]), numOrNull(ct[d.k]), d.lower);
    if (p === null) return;
    s += wt * Math.min(p, 120); w += wt;
  });
  return w ? s / w : null;
}

function kpiBackendBanner() {
  if (!isConnected() || Store.state.kpiSupported !== false) return "";
  return `<div class="banner" style="margin:0 0 14px;display:block"><b>⚙️ Cần cập nhật backend 1 lần để lưu KPI chung cho cả team.</b>
    <ol class="tight small" style="margin-top:6px"><li>Mở Google Sheet → <b>Tiện ích mở rộng → Apps Script</b>.</li>
    <li>Xoá hết code cũ, dán toàn bộ file <b>Code.gs mới</b> → Lưu.</li>
    <li><b>Triển khai → Quản lý triển khai → ✏ Chỉnh sửa → Phiên bản mới → Triển khai</b>.</li><li>Tải lại trang này.</li></ol></div>`;
}

/* =============================================================
 * MÀN KPI
 * ============================================================= */
function viewKpi() {
  if (UI6.edit) return viewKpiEditor();
  if (!UI6.month) UI6.month = monthKey(new Date());
  if (!UI6.ta) UI6.ta = getUser() || TA_NAMES[0];
  const m = UI6.month, cfg = kpiConfig(), defs = cfg.defs, rates = cfg.rates;
  const hasW = defs.some(d => +d.w > 0);
  const tas = allTAs();
  const nPrivate = defs.filter(d => Array.isArray(d.apply) && d.apply.length).length;
  let html = pageHead("📊 Module 8 · KPI từng TA", "đặt <b>chỉ tiêu</b> và theo dõi <b>kết quả thực tế</b> theo tháng cho từng TA. Xanh = đạt, cam = gần đạt (≥70%), đỏ = chưa đạt. Bộ KPI do bạn tự xây ở nút <b>⚙️ Tuỳ chỉnh bộ KPI</b>.");
  html += kpiBackendBanner();
  if (!Store.state.hasData && isConnected()) return html + loadingBlock();

  html += `<div class="month-bar"><button class="btn sm" data-act="kpiMonth" data-d="-1" type="button">‹</button>
    <b>${kpiMonthLabel(m)}</b><button class="btn sm" data-act="kpiMonth" data-d="1" type="button">›</button>
    ${m !== monthKey(new Date()) ? `<button class="btn sm ghost" data-act="kpiMonth" data-d="0" type="button">Tháng này</button>` : ""}
    <button class="btn sm" style="margin-left:auto" data-act="kpiEdit" type="button">⚙️ Tuỳ chỉnh bộ KPI</button></div>
    <p class="small muted" style="margin:-6px 0 12px">Bộ KPI: <b>${defs.length} chỉ số</b>${nPrivate ? ` (${defs.length - nPrivate} cả team · ${nPrivate} riêng từng người)` : ""}${rates.length ? `, ${rates.length} tỷ lệ` : ""} · ${cfg.custom ? `đã tuỳ chỉnh${cfg.by ? " bởi " + esc(cfg.by) : ""}` : "đang dùng bộ mặc định"}</p>`;

  // Tổng quan cả team
  html += `<div class="card"><div class="card-head"><h2>Tổng quan team</h2><button class="btn sm" data-act="kpiCopy" type="button">📋 Copy báo cáo</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th class="sticky">TA</th>${hasW ? `<th>Điểm KPI</th>` : ""}
      ${rates.map(r => `<th><span class="th-name">${esc(r.t)}</span></th>`).join("")}
      ${defs.map(d => `<th><span class="th-name">${esc(d.t)}</span><span class="th-sub">${Array.isArray(d.apply) && d.apply.length ? "🔸 riêng" : "thực tế/chỉ tiêu"}</span></th>`).join("")}</tr></thead><tbody>
    ${tas.map(t => {
      const r = kpiRec(t, m), tt = asObj(r && r.thucTe), ct = asObj(r && r.chiTieu);
      const sc = kpiScore(r, defs, t);
      return `<tr class="${UI6.ta === t ? "row-on" : ""}"><td class="sticky"><a href="#" data-act="kpiTA" data-val="${esc(t)}"><b>${esc(t)}</b></a>${r ? "" : `<div class="small muted">chưa nhập</div>`}</td>
        ${hasW ? `<td class="cell-kpi ${achieveCls(sc)}">${sc === null ? "—" : fmtPct(sc)}</td>` : ""}
        ${rates.map(rt => { if (!rateFor(rt, defs, t)) return `<td class="na" title="Không áp dụng cho ${esc(t)}">·</td>`; const v = rateOf(r, rt); return `<td class="cell-kpi ${rateCls(v, rt)}">${fmtPct(v)}</td>`; }).join("")}
        ${defs.map(d => { if (!appliesTo(d, t)) return `<td class="na" title="Không áp dụng cho ${esc(t)}">·</td>`; const a = numOrNull(tt[d.k]), g = numOrNull(ct[d.k]); return `<td class="cell-kpi ${achieveCls(kpiAchieve(a, g, d.lower))}">${fmtNum(a)}${g !== null ? `<span class="muted">/${fmtNum(g)}</span>` : ""}</td>`; }).join("")}</tr>`;
    }).join("")}</tbody></table></div>
    <p class="small muted" style="margin-top:8px">${hasW ? "Điểm KPI = trung bình có trọng số của % hoàn thành các chỉ số <b>áp dụng cho người đó</b> (tối đa 120%/chỉ số). " : ""}“·” = chỉ số không áp dụng cho người này. Bấm tên TA để xem/nhập chi tiết.</p></div>`;

  // Chi tiết 1 TA — chỉ các chỉ số áp dụng cho người đó
  const ta = UI6.ta, rec = kpiRec(ta, m), ct = asObj(rec && rec.chiTieu), tt = asObj(rec && rec.thucTe);
  const myDefs = defsFor(defs, ta), myRates = rates.filter(r => rateFor(r, defs, ta));
  const myHasW = myDefs.some(d => +d.w > 0);
  const myW = myDefs.reduce((s, d) => s + (+d.w || 0), 0);
  const score = kpiScore(rec, defs, ta);
  html += `<div class="card"><div class="card-head"><h2>Chi tiết: ${esc(ta)} · ${kpiMonthLabel(m)}</h2>
      <button class="btn sm" data-act="kcfgAddFor" data-ta="${esc(ta)}" type="button">＋ KPI riêng cho ${esc(ta)}</button></div>
    <div class="chips scroll" style="margin-bottom:12px">${tas.map(t => `<button class="chip ${t === ta ? "on" : ""}" data-act="kpiTA" data-val="${esc(t)}" type="button">${esc(t)}</button>`).join("")}</div>
    <p class="small muted" style="margin-bottom:10px">${esc(ta)} có <b>${myDefs.length}</b> chỉ số (${myDefs.filter(d => !(Array.isArray(d.apply) && d.apply.length)).length} chung · ${myDefs.filter(d => Array.isArray(d.apply) && d.apply.length).length} riêng)${myHasW ? ` · tổng trọng số <b class="${myW === 100 ? "verdict ok" : "verdict warn"}">${myW}%</b>` : ""}.</p>
    ${myHasW || myRates.length ? `<div class="kpi-rates">${myHasW ? `<div><span class="lbl">Điểm KPI tổng</span><b class="verdict ${achieveCls(score)}">${score === null ? "—" : fmtPct(score)}</b><span class="small muted">theo trọng số</span></div>` : ""}
      ${myRates.map(r => { const v = rateOf(rec, r); return `<div><span class="lbl">${esc(r.t)}</span><b class="verdict ${rateCls(v, r)}">${fmtPct(v)}</b><span class="small muted">${numOrNull(r.muc) !== null ? "mục tiêu " + fmtNum(+r.muc) + "%" : ""}${numOrNull(r.moc) !== null ? " · mốc " + fmtNum(+r.moc) + "%" : ""}</span></div>`; }).join("")}</div>` : ""}
    <div class="kpi-head"><span>Chỉ số</span><span>Chỉ tiêu</span><span>Thực tế</span></div>
    ${myDefs.map(def => {
      const a = numOrNull(tt[def.k]), tg = numOrNull(ct[def.k]);
      const p = kpiAchieve(a, tg, def.lower);
      const auto = autoCount(ta, m, def);
      return `<div class="kpi-row"><div class="kpi-name"><b>${esc(def.t)}</b>${Array.isArray(def.apply) && def.apply.length ? ` <span class="badge" style="--c:var(--warn)">riêng</span>` : ""} <span class="small muted">(${esc(def.unit || "")}${def.lower ? " · càng thấp càng tốt" : ""}${+def.w ? " · trọng số " + def.w + "%" : ""})</span>
          ${str(def.d) ? `<div class="small muted">${esc(def.d)}</div>` : ""}
          ${auto ? `<div class="small">📱 App ghi nhận: <b>${auto}</b> <button class="btn sm ghost" data-act="kpiUseAuto" data-k="${esc(def.k)}" data-v="${auto}" type="button">Dùng số này</button></div>` : ""}</div>
        <input class="input" type="number" step="any" min="0" data-kpi="chiTieu.${esc(def.k)}" data-keep="kpi:${esc(ta)}:${m}:ct:${esc(def.k)}" value="${tg ?? ""}" placeholder="—" aria-label="Chỉ tiêu ${esc(def.t)}">
        <input class="input" type="number" step="any" min="0" data-kpi="thucTe.${esc(def.k)}" data-keep="kpi:${esc(ta)}:${m}:tt:${esc(def.k)}" value="${a ?? ""}" placeholder="—" aria-label="Thực tế ${esc(def.t)}">
        ${p !== null ? `<div class="kpi-bar ${achieveCls(p)}"><i style="width:${Math.min(100, p)}%"></i><span>${fmtNum(p)}%</span></div>` : ""}</div>`;
    }).join("")}
    <label class="field" style="margin-top:12px"><span>Ghi chú tháng</span><textarea class="input" id="kpiNote" data-keep="kpi:${esc(ta)}:${m}:note" rows="2" placeholder="VD: 2 vị trí kho khó tuyển vì khu vực xa; đã thử thêm kênh Zalo.">${esc(rec ? rec.ghiChu : "")}</textarea></label>
    <div class="btn-row"><button class="btn primary" data-act="kpiSave" type="button">💾 Lưu KPI ${esc(ta)} · ${kpiMonthLabel(m)}</button>${backupBtn()}</div>
    ${rec && rec.nguoiCapNhat ? `<p class="small muted" style="margin-top:8px">Cập nhật lần cuối: ${esc(rec.nguoiCapNhat)}${rec.ngayCapNhat ? " · " + esc(fmtDate(rec.ngayCapNhat, true)) : ""}</p>` : ""}</div>`;

  // Hoạt động trên app
  const acts = ["chanDung", "scorecard", "jd"];
  html += `<div class="card"><div class="card-head"><h2>📱 Hoạt động trên app · ${kpiMonthLabel(m)}</h2></div>
    <p class="small muted" style="margin-bottom:8px">Tự động từ nhật ký: số lần mỗi TA lưu từng bước quy trình.</p>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>TA</th>${acts.map(a => `<th>${esc(AUTO_SOURCES[a].t.replace("Số ", "").replace(" đã lưu", ""))}</th>`).join("")}<th>Tổng thao tác</th></tr></thead><tbody>
    ${tas.map(t => { const ls = Store.logs.filter(l => str(l.ta) === t && inMonth(l, m));
      return `<tr><td>${esc(t)}</td>${acts.map(a => `<td>${ls.filter(AUTO_SOURCES[a].test).length}</td>`).join("")}<td><b>${ls.length}</b></td></tr>`; }).join("")}
    </tbody></table></div></div>`;
  return html;
}

/* =============================================================
 * MÀN TUỲ CHỈNH BỘ KPI
 * ============================================================= */
function viewKpiEditor() {
  if (!UI6.cfg) { const c = kpiConfig(); UI6.cfg = { defs: clone(c.defs), rates: clone(c.rates) }; }
  const c = UI6.cfg;
  const tasAll = allTAs();
  const kpiOpts = sel => `<option value="">— chọn —</option>` + c.defs.map(d => `<option value="${esc(d.k)}" ${d.k === sel ? "selected" : ""}>${esc(d.t || "(chưa đặt tên)")}</option>`).join("");
  const inp = (path, val, ph, type = "text") => `<input class="input" type="${type}" ${type === "number" ? 'step="any"' : ""} data-kcfg="${path}" value="${esc(val ?? "")}" placeholder="${esc(ph)}" autocomplete="off">`;
  let html = `<a class="back" href="#/kpi" data-act="kcfgCancel">← KPI</a>` + pageHead("⚙️ Tuỳ chỉnh bộ KPI",
    "tự xây bộ KPI cho team: thêm/xoá/sửa chỉ số, đơn vị, chiều tốt, <b>trọng số</b>, nguồn số tự động, và các <b>tỷ lệ</b>. Bấm <b>Lưu bộ KPI</b> để áp dụng cho cả team.");
  html += `<div class="banner" style="margin:0 0 14px;display:block;font-size:13.5px">💡 Đổi tên/đơn vị không làm mất số liệu cũ. <b>Xoá</b> 1 chỉ số chỉ ẩn nó khỏi bảng — số liệu cũ vẫn nằm trên Sheet, thêm lại sẽ không hiện lại (vì là chỉ số mới).</div>`;

  // Chỉ số
  html += `<div class="card"><div class="card-head"><h2>Chỉ số KPI (${c.defs.length})</h2></div>
    <p class="small muted" style="margin-bottom:8px">Trọng số dùng để tính <b>Điểm KPI tổng</b> của từng người (chỉ tính các chỉ số áp dụng cho người đó). Để 0 nếu chỉ để theo dõi. Mỗi người nên có tổng = 100%:</p>
    <div id="kcfgW">${kcfgWeightsHtml()}</div>
    ${c.defs.map((d, i) => `<div class="item-card ${Array.isArray(d.apply) && d.apply.length ? "private" : ""}">
      <div class="item-head"><b>${i + 1}. ${esc(d.t || "Chỉ số mới")}</b><span class="btn-row" style="flex:0 0 auto;gap:2px">
        <button class="icon-btn" data-act="kcfgMove" data-i="${i}" data-d="-1" type="button" aria-label="Lên" ${i === 0 ? "disabled" : ""}>↑</button>
        <button class="icon-btn" data-act="kcfgMove" data-i="${i}" data-d="1" type="button" aria-label="Xuống" ${i === c.defs.length - 1 ? "disabled" : ""}>↓</button>
        <button class="icon-btn" data-act="kcfgDel" data-i="${i}" type="button" aria-label="Xoá">🗑</button></span></div>
      <div class="kcfg-grid">
        <label class="field"><span class="small">Tên chỉ số</span>${inp(`defs.${i}.t`, d.t, "VD: Số người đi làm")}</label>
        <label class="field"><span class="small">Đơn vị</span>${inp(`defs.${i}.unit`, d.unit, "VD: người, %, ngày, đ")}</label>
        <label class="field"><span class="small">Trọng số %</span>${inp(`defs.${i}.w`, d.w || 0, "0", "number")}</label>
      </div>
      <label class="field"><span class="small">Mô tả / cách tính</span>${inp(`defs.${i}.d`, d.d, "VD: Số người mới đi làm trong tháng")}</label>
      <div class="field"><span class="field-label small">Áp dụng cho</span><div class="chips">
        <button class="chip ${!(Array.isArray(d.apply) && d.apply.length) ? "on" : ""}" data-act="kcfgApply" data-i="${i}" data-val="" type="button">👥 Cả team</button>
        ${tasAll.map(t => `<button class="chip ${Array.isArray(d.apply) && d.apply.includes(t) ? "on" : ""}" data-act="kcfgApply" data-i="${i}" data-val="${esc(t)}" type="button">${esc(t)}</button>`).join("")}</div>
        <div class="small muted" style="margin-top:4px">Chọn 1 hoặc vài người = KPI riêng của họ. Bấm “Cả team” để áp dụng cho tất cả.</div></div>
      <div class="field"><span class="field-label small">Chiều tốt</span><div class="chips">
        <button class="chip ${!d.lower ? "on" : ""}" data-act="kcfgLower" data-i="${i}" data-val="0" type="button">⬆ Càng cao càng tốt</button>
        <button class="chip ${d.lower ? "on" : ""}" data-act="kcfgLower" data-i="${i}" data-val="1" type="button">⬇ Càng thấp càng tốt</button></div></div>
      <label class="field" style="margin-bottom:0"><span class="small">Số app tự ghi nhận (gợi ý cho ô “thực tế”)</span>
        <select class="input" data-kcfg="defs.${i}.auto">${Object.keys(AUTO_SOURCES).map(k => `<option value="${k}" ${(d.auto || "") === k ? "selected" : ""}>${esc(AUTO_SOURCES[k].t)}</option>`).join("")}</select></label>
    </div>`).join("")}
    <button class="btn block" data-act="kcfgAdd" type="button">＋ Thêm chỉ số</button>
    <div class="field-label small" style="margin-top:12px">Hoặc thêm nhanh từ gợi ý:</div>
    <div class="chips small-chips">${KPI_SUGGEST.filter(s => !c.defs.some(d => d.t === s.t)).map((s, i) => `<button class="chip" data-act="kcfgSuggest" data-i="${KPI_SUGGEST.indexOf(s)}" type="button">＋ ${esc(s.t)}</button>`).join("")}</div></div>`;

  // Tỷ lệ
  html += `<div class="card"><div class="card-head"><h2>Tỷ lệ (${c.rates.length})</h2></div>
    <p class="small muted" style="margin-bottom:10px">Tỷ lệ = Chỉ số A ÷ Chỉ số B (tính từ số thực tế). <b>Mục tiêu</b> = đạt thì xanh. <b>Mốc</b> = mức hiện tại để so sánh.</p>
    ${c.rates.map((r, i) => `<div class="item-card">
      <div class="item-head"><b>${esc(r.t || "Tỷ lệ mới")}</b><button class="icon-btn" data-act="kcfgRateDel" data-i="${i}" type="button" aria-label="Xoá">🗑</button></div>
      <label class="field"><span class="small">Tên tỷ lệ</span>${inp(`rates.${i}.t`, r.t, "VD: Tỷ lệ lấp đầy")}</label>
      <div class="kcfg-grid two">
        <label class="field"><span class="small">Tử số (A)</span><select class="input" data-kcfg="rates.${i}.num">${kpiOpts(r.num)}</select></label>
        <label class="field"><span class="small">Mẫu số (B)</span><select class="input" data-kcfg="rates.${i}.den">${kpiOpts(r.den)}</select></label>
        <label class="field" style="margin-bottom:0"><span class="small">Mục tiêu %</span>${inp(`rates.${i}.muc`, r.muc, "VD: 80", "number")}</label>
        <label class="field" style="margin-bottom:0"><span class="small">Mốc hiện tại %</span>${inp(`rates.${i}.moc`, r.moc, "VD: 56,5", "number")}</label>
      </div></div>`).join("")}
    <button class="btn block" data-act="kcfgRateAdd" type="button">＋ Thêm tỷ lệ</button></div>`;

  html += `<div class="card"><div class="btn-row">
      <button class="btn" data-act="kcfgCancel" type="button">Huỷ</button>
      <button class="btn primary" data-act="kcfgSave" type="button">💾 Lưu bộ KPI cho cả team</button></div>
    <div style="text-align:center;margin-top:10px"><button class="btn ghost sm" data-act="kcfgReset" type="button">↺ Khôi phục bộ KPI mặc định</button></div></div>`;
  return html;
}

/** Tổng trọng số theo từng người (chung + riêng) */
function kcfgWeightsHtml() {
  const c = UI6.cfg;
  return `<div class="chips" style="margin-bottom:12px">${allTAs().map(t => {
    const w = c.defs.filter(d => appliesTo(d, t)).reduce((s, d) => s + (+d.w || 0), 0);
    return `<span class="badge" style="--c:${w === 100 || w === 0 ? "var(--ok)" : "var(--warn)"}">${esc(t)}: ${w}%</span>`;
  }).join("")}</div>`;
}

function kpiReportText() {
  const m = UI6.month, { defs, rates } = kpiConfig();
  const tas = allTAs();
  const lines = [`📊 BÁO CÁO KPI TUYỂN DỤNG — ${kpiMonthLabel(m).toUpperCase()}`, ``];
  tas.forEach(t => {
    const r = kpiRec(t, m);
    if (!r) { lines.push(`• ${t}: chưa nhập`); return; }
    const tt = asObj(r.thucTe), ct = asObj(r.chiTieu);
    const hasW = defsFor(defs, t).some(d => +d.w > 0);
    const head = [hasW ? `điểm KPI ${fmtPct(kpiScore(r, defs, t))}` : "", ...rates.filter(rt => rateFor(rt, defs, t)).map(rt => `${rt.t.toLowerCase()} ${fmtPct(rateOf(r, rt))}`)].filter(Boolean).join(", ");
    lines.push(`• ${t}${head ? " — " + head : ""}`);
    const parts = defsFor(defs, t).map(d => { const a = numOrNull(tt[d.k]), g = numOrNull(ct[d.k]); return a === null && g === null ? null : `${d.t}: ${fmtNum(a)}${g !== null ? "/" + fmtNum(g) : ""}${d.unit ? " " + d.unit : ""}`; }).filter(Boolean);
    if (parts.length) lines.push(`   ${parts.join(" · ")}`);
    if (str(r.ghiChu)) lines.push(`   Ghi chú: ${str(r.ghiChu)}`);
  });
  lines.push(``, `(thực tế/chỉ tiêu)`);
  return lines.join("\n");
}

const newKpiKey = () => "k" + Date.now().toString(36) + Math.floor(Math.random() * 100);
function kpiBlocked() {
  if (isConnected() && Store.state.kpiSupported === false) { toast("Cần cập nhật Code.gs trước (xem khung hướng dẫn ở đầu trang)"); window.scrollTo(0, 0); return true; }
  return false;
}

Object.assign(ACTIONS, {
  kpiMonth: (el) => { const d = +el.dataset.d; UI6.month = d === 0 ? monthKey(new Date()) : shiftMonth(UI6.month, d); render(); },
  kpiTA: (el, ev) => { if (ev) ev.preventDefault(); UI6.ta = el.dataset.val; render(); },
  kpiUseAuto: (el) => { const inp = $(`[data-kpi="thucTe.${el.dataset.k}"]`); if (inp) { inp.value = el.dataset.v; toast("Đã điền số app ghi nhận — nhớ bấm Lưu"); } },
  kpiCopy: () => copyText(kpiReportText()),
  kpiSave: () => {
    if (kpiBlocked()) return;
    const ta = UI6.ta, m = UI6.month;
    const rec = kpiRec(ta, m);
    // Giữ số của các chỉ số không còn trong bộ hiện tại (không làm mất dữ liệu cũ)
    const chiTieu = Object.assign({}, asObj(rec && rec.chiTieu)), thucTe = Object.assign({}, asObj(rec && rec.thucTe));
    $$("[data-kpi]").forEach(inp => {
      const [grp, k] = inp.dataset.kpi.split(".");
      const target = grp === "chiTieu" ? chiTieu : thucTe;
      const v = numOrNull(inp.value);
      if (v === null) delete target[k]; else target[k] = v;
    });
    Store.save({ action: "saveKpi", kpi: { kpiId: kpiId(ta, m), ta, thang: m, chiTieu, thucTe, ghiChu: str($("#kpiNote").value), nguoiCapNhat: getUser() } });
    toast(`Đã lưu KPI ${ta} · ${kpiMonthLabel(m)} ✓`);
  },

  /* --- tuỳ chỉnh bộ KPI --- */
  kpiEdit: () => { UI6.edit = true; UI6.cfg = null; render(); window.scrollTo(0, 0); },
  kcfgCancel: (el, ev) => { if (ev) ev.preventDefault(); UI6.edit = false; UI6.cfg = null; render(); },
  kcfgAdd: () => { UI6.cfg.defs.push({ k: newKpiKey(), t: "", unit: "", d: "", lower: false, w: 0, auto: "" }); render(); },
  kcfgSuggest: (el) => { const s = KPI_SUGGEST[+el.dataset.i]; UI6.cfg.defs.push({ k: newKpiKey(), t: s.t, unit: s.unit, d: s.d, lower: !!s.lower, w: 0, auto: "" }); render(); toast(`Đã thêm “${s.t}”`); },
  kcfgDel: (el) => {
    const i = +el.dataset.i, d = UI6.cfg.defs[i];
    const used = UI6.cfg.rates.filter(r => r.num === d.k || r.den === d.k);
    if (!confirm(`Xoá chỉ số “${d.t || "chưa đặt tên"}” khỏi bộ KPI?${used.length ? `\n\n⚠️ Đang dùng trong tỷ lệ: ${used.map(r => r.t).join(", ")} — tỷ lệ đó sẽ bị xoá theo.` : ""}`)) return;
    UI6.cfg.defs.splice(i, 1);
    UI6.cfg.rates = UI6.cfg.rates.filter(r => r.num !== d.k && r.den !== d.k);
    render();
  },
  kcfgMove: (el) => {
    const i = +el.dataset.i, j = i + (+el.dataset.d), a = UI6.cfg.defs;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; render();
  },
  kcfgApply: (el) => {
    const d = UI6.cfg.defs[+el.dataset.i], t = el.dataset.val;
    if (!t) d.apply = [];
    else {
      const cur = Array.isArray(d.apply) ? d.apply.slice() : [];
      d.apply = cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t];
    }
    render();
  },
  /* Từ màn chi tiết 1 TA: mở tuỳ chỉnh và thêm sẵn 1 chỉ số riêng cho người đó */
  kcfgAddFor: (el) => {
    const ta = el.dataset.ta;
    UI6.edit = true;
    const c = kpiConfig(); UI6.cfg = { defs: clone(c.defs), rates: clone(c.rates) };
    UI6.cfg.defs.push({ k: newKpiKey(), t: "", unit: "", d: "", lower: false, w: 0, auto: "", apply: [ta] });
    render();
    setTimeout(() => { const cards = $$(".item-card"); const last = cards[UI6.cfg.defs.length - 1]; if (last) { last.scrollIntoView({ block: "center" }); const f = last.querySelector("input"); if (f) f.focus(); } }, 60);
    toast(`Đã thêm 1 chỉ số riêng cho ${ta} — đặt tên rồi bấm Lưu`);
  },
  kcfgLower: (el) => { UI6.cfg.defs[+el.dataset.i].lower = el.dataset.val === "1"; render(); },
  kcfgRateAdd: () => { UI6.cfg.rates.push({ k: newKpiKey(), t: "", num: "", den: "", muc: null, moc: null, d: "" }); render(); },
  kcfgRateDel: (el) => { UI6.cfg.rates.splice(+el.dataset.i, 1); render(); },
  kcfgReset: () => {
    if (!confirm("Thay bộ đang sửa bằng bộ KPI mặc định? (Chưa lưu cho tới khi bấm “Lưu bộ KPI”.)")) return;
    UI6.cfg = clone({ defs: DEFAULT_KPI_CONFIG.defs, rates: DEFAULT_KPI_CONFIG.rates }); render();
  },
  kcfgSave: () => {
    if (kpiBlocked()) return;
    const c = UI6.cfg;
    c.defs.forEach(d => { d.t = str(d.t); d.unit = str(d.unit); d.d = str(d.d); d.w = Math.max(0, +d.w || 0); });
    if (!c.defs.length) { toast("Bộ KPI cần ít nhất 1 chỉ số"); return; }
    const noName = c.defs.findIndex(d => !d.t);
    if (noName >= 0) { toast(`Chỉ số số ${noName + 1} chưa có tên`); return; }
    const badRate = c.rates.find(r => !str(r.t) || !r.num || !r.den || r.num === r.den);
    if (badRate) { toast(`Tỷ lệ “${str(badRate.t) || "chưa đặt tên"}” cần tên, tử số và mẫu số khác nhau`); return; }
    c.rates.forEach(r => { r.t = str(r.t); r.muc = numOrNull(r.muc); r.moc = numOrNull(r.moc); });
    c.defs.forEach(d => { if (!Array.isArray(d.apply)) d.apply = []; });
    const off = allTAs().map(t => ({ t, w: c.defs.filter(d => appliesTo(d, t)).reduce((s, d) => s + d.w, 0) })).filter(x => x.w && x.w !== 100);
    if (off.length && !confirm(`Tổng trọng số chưa = 100% với: ${off.map(x => `${x.t} (${x.w}%)`).join(", ")}.\nVẫn lưu?`)) return;
    Store.save({ action: "saveKpi", kpi: { kpiId: KPI_CONFIG_ID, ta: "", thang: "", chiTieu: { defs: c.defs, rates: c.rates }, thucTe: {}, ghiChu: "Bộ KPI của team", nguoiCapNhat: getUser() } });
    UI6.edit = false; UI6.cfg = null;
    toast("Đã lưu bộ KPI cho cả team ✓");
    render(); window.scrollTo(0, 0);
  }
});

/* Gõ trong màn tuỳ chỉnh → cập nhật bản đang sửa (chưa lưu) */
function kcfgInput(ev) {
  const el = ev.target;
  if (!el.dataset || !el.dataset.kcfg || !UI6.cfg) return;
  let v = el.value;
  if (el.type === "number") v = v === "" ? null : Number(v);
  setPath(UI6.cfg, el.dataset.kcfg, v);
  if (/^defs\.\d+\.w$/.test(el.dataset.kcfg)) { const b = $("#kcfgW"); if (b) b.innerHTML = kcfgWeightsHtml(); }
}
document.addEventListener("input", kcfgInput);
document.addEventListener("change", (ev) => { if (ev.target.tagName === "SELECT") kcfgInput(ev); });
