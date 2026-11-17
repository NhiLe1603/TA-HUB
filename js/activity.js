/* =============================================================
 * ATINO TA HUB — NHẬT KÝ HOẠT ĐỘNG (ai làm gì, lúc nào)
 * Mỗi lần lưu, app tự mô tả thao tác và gửi kèm lên tab "Logs" của Google Sheet.
 * ============================================================= */
"use strict";

/* ---------- Tự mô tả thao tác (chạy TRƯỚC khi dữ liệu đổi) ---------- */
Store.describe = function (body) {
  const base = { logId: genId("L"), ta: getUser() || "(chưa chọn tên)" };
  const sc = (n, kl) => `${toNum(n) !== null ? fmtScore(toNum(n)) : "—"}${kl ? " · " + kl : ""}`;
  if (body.action === "saveCandidate" || body.action === "updateStage") {
    const c = body.candidate || { candId: body.candId, trangThai: body.trangThai };
    const old = findCand(c.candId);
    const ten = candName(Object.assign({}, old || {}, c));
    const moved = c.trangThai && old && c.trangThai !== stageOf(old) ? ` → ${c.trangThai}` : "";
    let hanhDong, chiTiet = "";
    if (!old) { hanhDong = "Thêm ứng viên"; chiTiet = [posName(c.posId), str(c.nguon)].filter(Boolean).join(" · "); }
    else if ("diemSoVan" in c) { hanhDong = "Sơ vấn"; chiTiet = sc(c.diemSoVan, c.ketLuanSoVan) + moved; }
    else if ("diemCV" in c) { hanhDong = "Lọc CV"; chiTiet = sc(c.diemCV, c.ketLuanCV) + moved; }
    else if (moved) {
      hanhDong = "Đổi trạng thái";
      const h = Array.isArray(asObj(c.chiTiet).lichSu) ? c.chiTiet.lichSu[c.chiTiet.lichSu.length - 1] : null;
      chiTiet = `${stageOf(old)}${moved}${h && str(h.note) ? " · " + str(h.note) : ""}`;
    }
    else if ("ghiChu" in c && Object.keys(c).length <= 2) { hanhDong = "Sửa ghi chú"; chiTiet = str(c.ghiChu).slice(0, 80); }
    else { hanhDong = "Sửa thông tin ứng viên"; }
    return Object.assign(base, { hanhDong, loai: "ung-vien", doiTuongId: c.candId, ten, chiTiet });
  }
  if (body.action === "deleteCandidate") {
    const old = findCand(body.candId);
    return Object.assign(base, { hanhDong: "Xoá ứng viên", loai: "ung-vien", doiTuongId: body.candId, ten: old ? candName(old) : body.candId, chiTiet: old ? posName(old.posId) : "" });
  }
  if (body.action === "savePosition") {
    const p = body.position, old = findPos(p.posId);
    const ten = str(p.tenViTri) || (old ? str(old.tenViTri) : "");
    let hanhDong, chiTiet = "";
    if (!old) { hanhDong = p.scorecard ? "Tạo vị trí + phiếu điểm" : "Tạo vị trí"; chiTiet = (GROUPS[p.nhom] || {}).label || ""; }
    else if (p.chanDung) { hanhDong = "Cập nhật chân dung & phiếu điểm"; chiTiet = `${(p.chanDung.tieuChi || []).length} tiêu chí · ${(p.chanDung.mustHave || []).length} loại cứng`; }
    else if (p.jd) { hanhDong = "Lưu tin đăng"; }
    else if (p.nguon) { hanhDong = "Lưu kế hoạch nguồn"; chiTiet = (p.nguon.kenh || []).map(k => k.ten).join(", "); }
    else { hanhDong = "Sửa vị trí"; }
    return Object.assign(base, { hanhDong, loai: "vi-tri", doiTuongId: p.posId, ten, chiTiet });
  }
  if (body.action === "deletePosition") {
    const old = findPos(body.posId);
    return Object.assign(base, { hanhDong: "Xoá vị trí", loai: "vi-tri", doiTuongId: body.posId, ten: old ? str(old.tenViTri) : body.posId });
  }
  return null;
};

/* ---------- Tiện ích ---------- */
const ACT_ICON = {
  "Thêm ứng viên": "➕", "Lọc CV": "📄", "Sơ vấn": "📞", "Đổi trạng thái": "🔀", "Sửa ghi chú": "📝",
  "Sửa thông tin ứng viên": "✏️", "Xoá ứng viên": "🗑", "Tạo vị trí": "💼", "Tạo vị trí + phiếu điểm": "💼",
  "Cập nhật chân dung & phiếu điểm": "📐", "Lưu tin đăng": "✍️", "Lưu kế hoạch nguồn": "📣", "Sửa vị trí": "✏️", "Xoá vị trí": "🗑"
};
const dayKey = d => { const x = new Date(d); return isNaN(x) ? "" : `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`; };
function dayLabel(d) {
  const x = new Date(d), now = new Date();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (dayKey(x) === dayKey(now)) return "Hôm nay";
  if (dayKey(x) === dayKey(y)) return "Hôm qua";
  const wd = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][x.getDay()];
  return `${wd}, ${fmtDate(x)}`;
}
const hhmm = d => { const x = new Date(d); return isNaN(x) ? "" : `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`; };
function logLink(l) {
  if (l.loai === "ung-vien" && findCand(l.doiTuongId)) return "#/candidate/" + encodeURIComponent(l.doiTuongId);
  if (l.loai === "vi-tri" && findPos(l.doiTuongId)) return "#/position/" + encodeURIComponent(l.doiTuongId);
  return "";
}
function logRow(l, { showTA = true } = {}) {
  const href = logLink(l);
  const name = esc(l.ten || "");
  return `<div class="log-row"><span class="log-time">${hhmm(l.thoiGian)}</span>
    <span class="log-ico">${ACT_ICON[l.hanhDong] || "•"}</span>
    <span class="log-main">${showTA ? `<b>${esc(l.ta)}</b> · ` : ""}${esc(l.hanhDong)}${name ? ` — ${href ? `<a href="${href}">${name}</a>` : name}` : ""}
      ${str(l.chiTiet) ? `<span class="small muted">${esc(l.chiTiet)}</span>` : ""}</span></div>`;
}
function logsBackendBanner() {
  if (!isConnected() || Store.state.logsSupported !== false) return "";
  return `<div class="banner" style="margin:0 0 14px;display:block"><b>⚙️ Cần cập nhật backend 1 lần để lưu nhật ký chung cho cả team.</b>
    <ol class="tight small" style="margin-top:6px">
      <li>Mở Google Sheet → <b>Tiện ích mở rộng → Apps Script</b>.</li>
      <li>Xoá hết code cũ, dán toàn bộ file <b>Code.gs mới</b> → Lưu.</li>
      <li><b>Triển khai → Quản lý triển khai → ✏ Chỉnh sửa → Phiên bản: Phiên bản mới → Triển khai</b> (URL giữ nguyên).</li>
      <li>Quay lại app, tải lại trang.</li></ol>
    <div class="small muted">Trong lúc chờ, nhật ký chỉ lưu tạm trên máy này.</div></div>`;
}

/* ---------- Màn Nhật ký ---------- */
const UI5 = { ta: "", period: "7", loai: "" };
function filteredLogs() {
  const since = UI5.period === "all" ? 0 : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (+UI5.period - 1)); return d.getTime(); })();
  return Store.logs.filter(l => {
    if (UI5.ta && str(l.ta) !== UI5.ta) return false;
    if (UI5.loai && l.loai !== UI5.loai) return false;
    if (since && new Date(l.thoiGian).getTime() < since) return false;
    return true;
  });
}
function viewActivity() {
  let html = pageHead("📜 Nhật ký hoạt động", "xem <b>ai đã làm gì, lúc nào</b> — cả team. Lọc theo người, theo ngày. Bấm tên ứng viên/vị trí để mở.");
  html += logsBackendBanner();
  if (!Store.state.hasData && isConnected()) return html + loadingBlock();

  // Hôm nay từng người làm bao nhiêu việc
  const today = dayKey(new Date());
  const tas = Array.from(new Set([...TA_NAMES, ...Store.logs.map(l => str(l.ta)).filter(Boolean)]));
  const todayCount = t => Store.logs.filter(l => str(l.ta) === t && dayKey(l.thoiGian) === today).length;
  html += `<div class="card"><div class="card-head"><h2>Hôm nay (${fmtDate(new Date())})</h2></div>
    <div class="ta-stats">${tas.map(t => { const n = todayCount(t); return `<button class="ta-stat ${UI5.ta === t ? "on" : ""}" data-act="logTA" data-val="${esc(t)}" type="button"><span class="avatar">${esc(initials(t))}</span><span><b>${n}</b><span class="small muted">${esc(t)}</span></span></button>`; }).join("")}</div></div>`;

  // Bộ lọc
  const periods = [["1", "Hôm nay"], ["7", "7 ngày"], ["30", "30 ngày"], ["all", "Tất cả"]];
  html += `<div class="filters">
    <div class="chips scroll"><button class="chip ${!UI5.ta ? "on" : ""}" data-act="logTA" data-val="" type="button">Cả team</button>
      ${tas.map(t => `<button class="chip ${UI5.ta === t ? "on" : ""}" data-act="logTA" data-val="${esc(t)}" type="button">${esc(t)}</button>`).join("")}</div>
    <div class="chips scroll">${periods.map(([k, l]) => `<button class="chip ${UI5.period === k ? "on" : ""}" data-act="logPeriod" data-val="${k}" type="button">${l}</button>`).join("")}
      <span style="width:8px"></span>
      ${[["", "Mọi loại"], ["ung-vien", "Ứng viên"], ["vi-tri", "Vị trí"]].map(([k, l]) => `<button class="chip ${UI5.loai === k ? "on" : ""}" data-act="logLoai" data-val="${k}" type="button">${l}</button>`).join("")}</div></div>`;

  const list = filteredLogs();
  html += `<div class="card">`;
  if (!Store.logs.length) {
    html += emptyBlock("📜", "Chưa có hoạt động nào", "Mỗi khi bạn thêm ứng viên, lọc CV, sơ vấn, đổi trạng thái… app sẽ tự ghi lại ở đây.");
  } else if (!list.length) {
    html += emptyBlock("🔍", "Không có hoạt động nào", "Thử chọn “Cả team” hoặc khoảng thời gian dài hơn.");
  } else {
    html += `<div class="card-head"><span class="muted small">${list.length} thao tác</span>
      <button class="btn sm" data-act="logCopy" type="button">📋 Copy báo cáo</button></div>`;
    let lastDay = "";
    list.forEach(l => {
      const k = dayKey(l.thoiGian);
      if (k !== lastDay) { html += `<div class="log-day">${esc(dayLabel(l.thoiGian))}</div>`; lastDay = k; }
      html += logRow(l, { showTA: !UI5.ta });
    });
  }
  html += `</div><p class="small muted" style="text-align:center">App hiện 500 thao tác gần nhất. Toàn bộ nằm ở tab <b>Logs</b> trên Google Sheet.</p>`;
  return html;
}
function logReportText(list) {
  const lines = [`📜 NHẬT KÝ HOẠT ĐỘNG TA${UI5.ta ? " — " + UI5.ta : ""}`];
  let lastDay = "";
  const byDay = {};
  list.forEach(l => { (byDay[dayKey(l.thoiGian)] = byDay[dayKey(l.thoiGian)] || []).push(l); });
  list.forEach(l => {
    const k = dayKey(l.thoiGian);
    if (k !== lastDay) {
      const items = byDay[k];
      const per = {};
      items.forEach(x => { per[x.ta] = (per[x.ta] || 0) + 1; });
      lines.push("", `📅 ${dayLabel(l.thoiGian)} — ${Object.keys(per).map(t => `${t}: ${per[t]}`).join(" · ")}`);
      lastDay = k;
    }
    lines.push(`  ${hhmm(l.thoiGian)} ${UI5.ta ? "" : l.ta + " · "}${l.hanhDong}${l.ten ? " — " + l.ten : ""}${str(l.chiTiet) ? " (" + str(l.chiTiet) + ")" : ""}`);
  });
  return lines.join("\n");
}

/* ---------- Khối nhỏ cho Trang chủ & Hồ sơ ---------- */
function recentActivityCard() {
  const list = Store.logs.slice(0, 5);
  return `<div class="card"><div class="card-head"><h2>📜 Hoạt động gần đây</h2><a class="btn sm" href="#/activity">Xem tất cả →</a></div>
    ${list.length ? list.map(l => logRow(l)).join("") : `<p class="muted small">Chưa có hoạt động. Mỗi thao tác của cả team sẽ hiện ở đây.</p>`}</div>`;
}
function candidateLogsHtml(candId) {
  const list = Store.logs.filter(l => l.loai === "ung-vien" && String(l.doiTuongId) === String(candId));
  if (!list.length) return "";
  return `<details class="neo" style="margin-top:10px"><summary><b>Nhật ký thao tác</b> (${list.length})</summary>
    ${list.map(l => `<div class="log-row"><span class="log-time">${hhmm(l.thoiGian)}<br><span class="small muted">${fmtDate(l.thoiGian)}</span></span><span class="log-ico">${ACT_ICON[l.hanhDong] || "•"}</span>
      <span class="log-main"><b>${esc(l.ta)}</b> · ${esc(l.hanhDong)}${str(l.chiTiet) ? `<span class="small muted">${esc(l.chiTiet)}</span>` : ""}</span></div>`).join("")}</details>`;
}

Object.assign(ACTIONS, {
  logTA: (el) => { UI5.ta = UI5.ta === el.dataset.val ? "" : el.dataset.val; render(); },
  logPeriod: (el) => { UI5.period = el.dataset.val; render(); },
  logLoai: (el) => { UI5.loai = el.dataset.val; render(); },
  logCopy: () => copyText(logReportText(filteredLogs())),
  goActivity: () => { closeModal(); go("#/activity"); }
});
