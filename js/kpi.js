/* =============================================================
 * ATINO TA HUB — MODULE 8: KPI TỪNG TA (theo tháng)
 * Lưu ở tab "Kpi" trên Google Sheet. Chỉ tiêu do quản lý đặt, thực tế TA nhập
 * (hoặc bấm "Dùng số app ghi nhận" khi đã dùng app để quản lý ứng viên).
 * ============================================================= */
"use strict";

const KPI_DEFS = [
  { k: "giao",      t: "Vị trí được giao",     unit: "vị trí", d: "Số vị trí / người cần tuyển TA nhận trong tháng." },
  { k: "lapDay",    t: "Đã lấp đầy (đi làm)",  unit: "người",  d: "Số người đã nhận việc, đi làm thật.", auto: l => /→ Nhận việc/.test(str(l.chiTiet)) },
  { k: "cv",        t: "CV thu được",          unit: "CV",     d: "Tổng hồ sơ nhận được từ mọi kênh.", auto: l => l.hanhDong === "Thêm ứng viên" },
  { k: "soVan",     t: "Đã sơ vấn",            unit: "người",  d: "Số ứng viên TA đã gọi sơ vấn.", auto: l => l.hanhDong === "Sơ vấn" },
  { k: "chuyenHM",  t: "Chuyển HM",            unit: "người",  d: "Số ứng viên gửi quản lý phỏng vấn.", auto: l => /→ Chuyển HM/.test(str(l.chiTiet)) },
  { k: "offer",     t: "Offer đã gửi",         unit: "người",  d: "Số lời mời nhận việc đã gửi.", auto: l => /→ Offer/.test(str(l.chiTiet)) },
  { k: "nhanOffer", t: "Nhận offer",           unit: "người",  d: "Số người đồng ý lời mời nhận việc." },
  { k: "ngayTuyen", t: "Thời gian tuyển TB",   unit: "ngày",   d: "Trung bình số ngày từ lúc nhận yêu cầu đến khi người mới đi làm. Càng thấp càng tốt.", lower: true }
];
const KPI_RATES = [
  { k: "fill",  t: "Tỷ lệ lấp đầy",     num: "lapDay",    den: "giao",  moc: 56.5, d: "Đã lấp đầy ÷ Vị trí được giao. Mốc ATINO hiện tại: 56,5%." },
  { k: "offer", t: "Tỷ lệ nhận offer",  num: "nhanOffer", den: "offer", moc: 66.7, d: "Nhận offer ÷ Offer đã gửi. Mốc ATINO hiện tại: 66,7%." },
  { k: "conv",  t: "CV → đi làm",       num: "lapDay",    den: "cv",    d: "Bao nhiêu % CV thành người đi làm — đo chất lượng nguồn." }
];
/* Hoạt động trên app (tự động từ nhật ký) — đo việc học & làm theo quy trình */
const APP_ACTS = [
  { t: "Chân dung", test: l => /chân dung/i.test(l.hanhDong) },
  { t: "Scorecard", test: l => /scorecard|phiếu điểm/i.test(l.hanhDong) },
  { t: "Tin đăng (JD)", test: l => l.hanhDong === "Lưu tin đăng" }
];

const UI6 = { month: null, ta: null };
const monthKey = d => `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;
function kpiMonthLabel(k) { const [y, m] = String(k || "").split("_"); return y && m ? `Tháng ${+m}/${y}` : String(k || ""); }
function shiftMonth(k, n) { const [y, m] = k.split("_").map(Number); return monthKey(new Date(y, m - 1 + n, 1)); }
const inMonth = (l, k) => { const d = new Date(l.thoiGian); return !isNaN(d) && monthKey(d) === k; };
const kpiId = (ta, m) => `${ta}|${m}`;
const kpiRec = (ta, m) => Store.kpi.find(x => String(x.kpiId) === kpiId(ta, m)) || null;
const numOrNull = v => (v === "" || v === null || v === undefined || isNaN(+v)) ? null : +v;
function autoCount(ta, m, def) { return def.auto ? Store.logs.filter(l => str(l.ta) === ta && inMonth(l, m) && def.auto(l)).length : null; }
function kpiStatus(actual, target, lower) {
  if (actual === null || target === null || !target) return { cls: "", pct: null };
  const r = lower ? (actual ? target / actual : 1) : actual / target;
  return { cls: r >= 1 ? "ok" : r >= 0.7 ? "warn" : "bad", pct: Math.round((lower ? r : actual / target) * 100) };
}
function rateOf(rec, rate) {
  const t = asObj(rec && rec.thucTe);
  const n = numOrNull(t[rate.num]), d = numOrNull(t[rate.den]);
  return n !== null && d ? Math.round((n / d) * 1000) / 10 : null;
}
const fmtPct = v => v === null ? "—" : String(v).replace(".", ",") + "%";

function kpiBackendBanner() {
  if (!isConnected() || Store.state.kpiSupported !== false) return "";
  return `<div class="banner" style="margin:0 0 14px;display:block"><b>⚙️ Cần cập nhật backend 1 lần để lưu KPI chung cho cả team.</b>
    <ol class="tight small" style="margin-top:6px"><li>Mở Google Sheet → <b>Tiện ích mở rộng → Apps Script</b>.</li>
    <li>Xoá hết code cũ, dán toàn bộ file <b>Code.gs mới</b> → Lưu.</li>
    <li><b>Triển khai → Quản lý triển khai → ✏ Chỉnh sửa → Phiên bản mới → Triển khai</b>.</li><li>Tải lại trang này.</li></ol></div>`;
}

function viewKpi(_, query) {
  if (!UI6.month) UI6.month = monthKey(new Date());
  if (!UI6.ta) UI6.ta = getUser() || TA_NAMES[0];
  const m = UI6.month;
  const tas = Array.from(new Set([...TA_NAMES, ...Store.kpi.map(x => str(x.ta)), getUser()].filter(Boolean)));
  let html = pageHead("📊 Module 8 · KPI từng TA", "đặt <b>chỉ tiêu</b> và theo dõi <b>kết quả thực tế</b> theo tháng cho từng TA. Xanh = đạt, cam = gần đạt (≥70%), đỏ = chưa đạt.");
  html += kpiBackendBanner();
  if (!Store.state.hasData && isConnected()) return html + loadingBlock();

  html += `<div class="month-bar"><button class="btn sm" data-act="kpiMonth" data-d="-1" type="button">‹</button>
    <b>${kpiMonthLabel(m)}</b><button class="btn sm" data-act="kpiMonth" data-d="1" type="button">›</button>
    ${m !== monthKey(new Date()) ? `<button class="btn sm ghost" data-act="kpiMonth" data-d="0" type="button">Tháng này</button>` : ""}</div>`;

  // Tổng quan cả team
  html += `<div class="card"><div class="card-head"><h2>Tổng quan team</h2><button class="btn sm" data-act="kpiCopy" type="button">📋 Copy báo cáo</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>TA</th><th>Lấp đầy</th><th>Tỷ lệ lấp đầy</th><th>Nhận offer</th><th>CV</th><th>Thời gian TB</th></tr></thead><tbody>
    ${tas.map(t => {
      const r = kpiRec(t, m), tt = asObj(r && r.thucTe), ct = asObj(r && r.chiTieu);
      const fill = rateOf(r, KPI_RATES[0]), off = rateOf(r, KPI_RATES[1]);
      const st = kpiStatus(numOrNull(tt.lapDay), numOrNull(ct.lapDay) ?? numOrNull(tt.giao), false);
      const days = kpiStatus(numOrNull(tt.ngayTuyen), numOrNull(ct.ngayTuyen), true);
      return `<tr class="${UI6.ta === t ? "row-on" : ""}"><td><a href="#" data-act="kpiTA" data-val="${esc(t)}"><b>${esc(t)}</b></a>${r ? "" : `<div class="small muted">chưa nhập</div>`}</td>
        <td class="cell-kpi ${st.cls}">${numOrNull(tt.lapDay) ?? "—"}/${numOrNull(tt.giao) ?? "—"}</td>
        <td class="cell-kpi ${fill === null ? "" : fill >= 80 ? "ok" : fill >= 56.5 ? "warn" : "bad"}">${fmtPct(fill)}</td>
        <td class="cell-kpi ${off === null ? "" : off >= 85 ? "ok" : off >= 66.7 ? "warn" : "bad"}">${fmtPct(off)}</td>
        <td>${numOrNull(tt.cv) ?? "—"}</td>
        <td class="cell-kpi ${days.cls}">${numOrNull(tt.ngayTuyen) !== null ? numOrNull(tt.ngayTuyen) + " ngày" : "—"}</td></tr>`;
    }).join("")}</tbody></table></div>
    <p class="small muted" style="margin-top:8px">Mốc so sánh: tỷ lệ lấp đầy ATINO hiện tại <b>56,5%</b> · nhận offer <b>66,7%</b>. Bấm tên TA để xem/nhập chi tiết.</p></div>`;

  // Chi tiết 1 TA
  const ta = UI6.ta, rec = kpiRec(ta, m), ct = asObj(rec && rec.chiTieu), tt = asObj(rec && rec.thucTe);
  html += `<div class="card"><div class="card-head"><h2>Chi tiết: ${esc(ta)} · ${kpiMonthLabel(m)}</h2></div>
    <div class="chips scroll" style="margin-bottom:12px">${tas.map(t => `<button class="chip ${t === ta ? "on" : ""}" data-act="kpiTA" data-val="${esc(t)}" type="button">${esc(t)}</button>`).join("")}</div>
    <div class="kpi-rates">${KPI_RATES.map(r => { const v = rateOf(rec, r); return `<div><span class="lbl">${esc(r.t)}</span><b>${fmtPct(v)}</b>${r.moc ? `<span class="small muted">mốc ${String(r.moc).replace(".", ",")}%</span>` : ""}</div>`; }).join("")}</div>
    <div class="kpi-head"><span>Chỉ số</span><span>Chỉ tiêu</span><span>Thực tế</span></div>
    ${KPI_DEFS.map(def => {
      const a = numOrNull(tt[def.k]), tg = numOrNull(ct[def.k]);
      const st = kpiStatus(a, tg, def.lower);
      const auto = autoCount(ta, m, def);
      return `<div class="kpi-row"><div class="kpi-name"><b>${esc(def.t)}</b> <span class="small muted">(${esc(def.unit)})</span>
          <div class="small muted">${esc(def.d)}</div>
          ${auto ? `<div class="small">📱 App ghi nhận: <b>${auto}</b> <button class="btn sm ghost" data-act="kpiUseAuto" data-k="${def.k}" data-v="${auto}" type="button">Dùng số này</button></div>` : ""}</div>
        <input class="input" type="number" min="0" data-kpi="chiTieu.${def.k}" data-keep="kpi:${esc(ta)}:${m}:ct:${def.k}" value="${tg ?? ""}" placeholder="—" aria-label="Chỉ tiêu ${esc(def.t)}">
        <input class="input" type="number" min="0" data-kpi="thucTe.${def.k}" data-keep="kpi:${esc(ta)}:${m}:tt:${def.k}" value="${a ?? ""}" placeholder="—" aria-label="Thực tế ${esc(def.t)}">
        ${st.pct !== null ? `<div class="kpi-bar ${st.cls}"><i style="width:${Math.min(100, st.pct)}%"></i><span>${st.pct}%${def.lower ? " (thấp hơn = tốt)" : ""}</span></div>` : ""}</div>`;
    }).join("")}
    <label class="field" style="margin-top:12px"><span>Ghi chú tháng</span><textarea class="input" id="kpiNote" data-keep="kpi:${esc(ta)}:${m}:note" rows="2" placeholder="VD: 2 vị trí kho khó tuyển vì khu vực xa; đã thử thêm kênh Zalo.">${esc(rec ? rec.ghiChu : "")}</textarea></label>
    <div class="btn-row"><button class="btn primary" data-act="kpiSave" type="button">💾 Lưu KPI ${esc(ta)} · ${kpiMonthLabel(m)}</button>${backupBtn()}</div>
    ${rec && rec.nguoiCapNhat ? `<p class="small muted" style="margin-top:8px">Cập nhật lần cuối: ${esc(rec.nguoiCapNhat)}${rec.ngayCapNhat ? " · " + esc(fmtDate(rec.ngayCapNhat, true)) : ""}</p>` : ""}</div>`;

  // Hoạt động trên app
  html += `<div class="card"><div class="card-head"><h2>📱 Hoạt động trên app · ${kpiMonthLabel(m)}</h2></div>
    <p class="small muted" style="margin-bottom:8px">Tự động từ nhật ký: số lần mỗi TA lưu từng bước quy trình.</p>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>TA</th>${APP_ACTS.map(a => `<th>${esc(a.t)}</th>`).join("")}<th>Tổng thao tác</th></tr></thead><tbody>
    ${tas.map(t => { const ls = Store.logs.filter(l => str(l.ta) === t && inMonth(l, m));
      return `<tr><td>${esc(t)}</td>${APP_ACTS.map(a => `<td>${ls.filter(a.test).length}</td>`).join("")}<td><b>${ls.length}</b></td></tr>`; }).join("")}
    </tbody></table></div></div>`;
  return html;
}

function kpiReportText() {
  const m = UI6.month;
  const tas = Array.from(new Set([...TA_NAMES, ...Store.kpi.map(x => str(x.ta))]));
  const lines = [`📊 BÁO CÁO KPI TUYỂN DỤNG — ${kpiMonthLabel(m).toUpperCase()}`, ``];
  tas.forEach(t => {
    const r = kpiRec(t, m);
    if (!r) { lines.push(`• ${t}: chưa nhập`); return; }
    const tt = asObj(r.thucTe), ct = asObj(r.chiTieu);
    const part = def => { const a = numOrNull(tt[def.k]), g = numOrNull(ct[def.k]); return a === null && g === null ? null : `${def.t}: ${a ?? "—"}${g !== null ? "/" + g : ""}`; };
    lines.push(`• ${t} — lấp đầy ${fmtPct(rateOf(r, KPI_RATES[0]))}, nhận offer ${fmtPct(rateOf(r, KPI_RATES[1]))}`);
    lines.push(`   ${KPI_DEFS.map(part).filter(Boolean).join(" · ")}`);
    if (str(r.ghiChu)) lines.push(`   Ghi chú: ${str(r.ghiChu)}`);
  });
  lines.push(``, `(thực tế/chỉ tiêu · mốc ATINO: lấp đầy 56,5%, nhận offer 66,7%)`);
  return lines.join("\n");
}

Object.assign(ACTIONS, {
  kpiMonth: (el) => { const d = +el.dataset.d; UI6.month = d === 0 ? monthKey(new Date()) : shiftMonth(UI6.month, d); render(); },
  kpiTA: (el, ev) => { if (ev) ev.preventDefault(); UI6.ta = el.dataset.val; render(); },
  kpiUseAuto: (el) => { const inp = $(`[data-kpi="thucTe.${el.dataset.k}"]`); if (inp) { inp.value = el.dataset.v; toast("Đã điền số app ghi nhận — nhớ bấm Lưu"); } },
  kpiCopy: () => copyText(kpiReportText()),
  kpiSave: () => {
    if (isConnected() && Store.state.kpiSupported === false) { toast("Cần cập nhật Code.gs trước (xem khung hướng dẫn ở đầu trang)"); window.scrollTo(0, 0); return; }
    const ta = UI6.ta, m = UI6.month;
    const chiTieu = {}, thucTe = {};
    $$("[data-kpi]").forEach(inp => {
      const [grp, k] = inp.dataset.kpi.split(".");
      const v = numOrNull(inp.value);
      if (v !== null) (grp === "chiTieu" ? chiTieu : thucTe)[k] = v;
    });
    if (thucTe.lapDay !== undefined && thucTe.giao !== undefined && thucTe.lapDay > thucTe.giao) {
      if (!confirm("Số “đã lấp đầy” đang lớn hơn số “vị trí được giao”. Vẫn lưu?")) return;
    }
    Store.save({ action: "saveKpi", kpi: { kpiId: kpiId(ta, m), ta, thang: m, chiTieu, thucTe, ghiChu: str($("#kpiNote").value), nguoiCapNhat: getUser() } });
    toast(`Đã lưu KPI ${ta} · ${kpiMonthLabel(m)} ✓`);
  }
});
