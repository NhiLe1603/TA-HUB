/* =============================================================
 * ATINO TA HUB — GIAO DIỆN (Pha 1: khung app + Trang chủ + Ứng viên)
 * ============================================================= */
"use strict";

/* ---------------- HẰNG SỐ ---------------- */
const TA_NAMES = ["Kim Anh", "Ánh Dương", "Mỹ Hạnh", "Diệu Anh"];
const MAIN_STAGES = ["Mới", "Đã lọc CV", "Đạt sơ vấn", "Chuyển HM", "Offer", "Nhận việc"];
const SIDE_STAGES = ["Loại", "Talent Pool"];
const ALL_STAGES = [...MAIN_STAGES, ...SIDE_STAGES];
const STAGE_META = {
  "Mới":        { color: "#7C8591", desc: "Vừa nhận hồ sơ, chưa xem kỹ.", next: "Đọc CV và chấm theo phiếu (Lọc CV)." },
  "Đã lọc CV":  { color: "#2E6BE6", desc: "Đã đọc & chấm CV, hồ sơ ổn.", next: "Gọi sơ vấn (phỏng vấn sơ bộ qua điện thoại)." },
  "Đạt sơ vấn": { color: "#0E8FA3", desc: "Đã gọi sơ vấn và ứng viên đạt.", next: "Gửi tóm tắt cho quản lý (HM) để hẹn phỏng vấn." },
  "Chuyển HM":  { color: "#7A4FD6", desc: "Đã chuyển hồ sơ cho quản lý trực tiếp (HM).", next: "Nhắc HM phản hồi trong 2 ngày để giữ ứng viên." },
  "Offer":      { color: "#C77700", desc: "Đã mời nhận việc (offer = lời mời làm việc).", next: "Chốt ngày đi làm + gửi hướng dẫn ngày đầu." },
  "Nhận việc":  { color: "#1A9E62", desc: "Ứng viên đã đi làm. Chúc mừng! 🎉", next: "" },
  "Loại":       { color: "#D54941", desc: "Không phù hợp. Nhớ gửi tin từ chối tử tế.", next: "" },
  "Talent Pool":{ color: "#9A5BC2", desc: "Kho ứng viên tiềm năng: chưa hợp lúc này nhưng có điểm mạnh, giữ để liên hệ sau.", next: "" }
};
const SOURCES = ["Facebook cá nhân", "Fanpage ATINO", "Group Facebook", "TikTok", "TopCV", "VietnamWorks",
  "Vieclam24h", "Giới thiệu (referral)", "Ứng viên cũ", "Nội bộ", "Khác"];
const GROUPS = {
  Mass:       { label: "Mass – Cửa hàng", hint: "Tuyển số lượng nhiều: tư vấn bán hàng, thu ngân, kho." },
  BackOffice: { label: "Back Office – Văn phòng", hint: "Vị trí văn phòng: kế toán, marketing, nhân sự…" },
  QuanLy:     { label: "Quản lý", hint: "Cửa hàng trưởng, quản lý khu vực…" }
};
const TIPS = {
  pipeline: "<b>Pipeline (phễu tuyển dụng)</b> = các bước ứng viên đi qua: Mới → Đã lọc CV → Đạt sơ vấn → Chuyển HM → Offer → Nhận việc. Càng xuống dưới càng ít người — bình thường.",
  hm: "<b>HM (Hiring Manager)</b> = người quản lý trực tiếp của vị trí, vd cửa hàng trưởng. HM là người phỏng vấn vòng cuối và quyết định nhận.",
  talentPool: "<b>Talent Pool (kho ứng viên)</b> = người chưa phù hợp lúc này nhưng có điểm mạnh. Giữ lại để gọi khi có vị trí khác — đỡ phải tìm từ đầu.",
  maHoSo: "<b>Mã hồ sơ</b> = mã trên trang tuyển dụng (vd TopCV) hoặc mã tự đặt. Không có tên thì nhập mã cũng được.",
  nguon: "<b>Nguồn</b> = ứng viên đến từ đâu. Ghi đúng để biết kênh nào ra <b>người đi làm thật</b>, không chỉ ra nhiều CV.",
  soVan: "<b>Sơ vấn</b> = cuộc gọi/phỏng vấn ngắn của TA <b>trước</b> vòng quản lý, để kiểm tra điều kiện bắt buộc (ca, khu vực, lương…) và thái độ.",
  locCV: "<b>Lọc CV</b> = đọc hồ sơ và chấm theo phiếu điểm (scorecard). Thang 1–4: dưới 2,5 Loại · 2,5–2,9 Cân nhắc · từ 3,0 Đạt.",
  ta: "<b>TA phụ trách</b> = bạn TA chịu trách nhiệm theo ứng viên này từ đầu tới khi nhận việc.",
  nhom: "<b>Nhóm vị trí</b> giúp app gợi ý mẫu phù hợp ở các pha sau (mẫu chân dung, kênh đăng tin…)."
};
const NAV = [
  { id: "home", label: "Trang chủ", ico: "🏠" },
  { id: "learn", label: "Học", ico: "📘" },
  { id: "positions", label: "Vị trí", ico: "💼" },
  { id: "tools", label: "Công cụ", ico: "🧰" },
  { id: "candidates", label: "Ứng viên", ico: "👥" }
];

/* ---------------- TIỆN ÍCH ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
const str = v => (v === null || v === undefined ? "" : String(v)).trim();
function fmtDate(v, withTime) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  const p = n => String(n).padStart(2, "0");
  const s = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  return withTime ? `${p(d.getHours())}:${p(d.getMinutes())} · ${s}` : s;
}
function initials(name) {
  const parts = str(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function givenName(name) {
  const parts = str(name).split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "bạn";
}
function toNum(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}
const fmtScore = n => n.toFixed(1).replace(".", ",");
function verdictClass(text, score) {
  const t = str(text).toLowerCase();
  if (t.includes("loại")) return "bad";
  if (t.includes("chờ") || t.includes("cân nhắc")) return "warn";
  if (t.includes("đạt")) return "ok";
  if (score === null) return "";
  return score >= 3 ? "ok" : score >= 2.5 ? "warn" : "bad";
}
function tip(key) {
  return `<button class="tip" type="button" data-act="tip" data-tip="${key}" aria-label="Giải thích">?</button>`;
}
function stageBadge(stage) {
  const m = STAGE_META[stage] || { color: "#7C8591" };
  return `<span class="badge" style="--c:${m.color}">${esc(stage || "Mới")}</span>`;
}
function asObj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }

function getUser() { return LocalDB.get(LS_KEYS.user, ""); }
function setUser(name) { LocalDB.set(LS_KEYS.user, name); }

const findCand = id => Store.candidates.find(c => String(c.candId) === String(id));
const findPos = id => Store.positions.find(p => String(p.posId) === String(id));
const posName = id => { const p = findPos(id); return p ? str(p.tenViTri) : (id ? "(vị trí đã xoá)" : "Chưa chọn vị trí"); };
const candName = c => str(c.hoTen) || (str(c.maHoSo) ? "Mã " + str(c.maHoSo) : "(chưa có tên)");
const stageOf = c => ALL_STAGES.includes(str(c.trangThai)) ? str(c.trangThai) : "Mới";
const sortRecent = list => list.slice().sort((a, b) => new Date(b.ngayCapNhat || b.ngayTao || 0) - new Date(a.ngayCapNhat || a.ngayTao || 0));

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e2) { /* bỏ qua */ }
    ta.remove();
  }
  toast("Đã copy ✓ — dán vào Lark/Zalo là xong");
}

function downloadJSON() {
  const data = Store.exportJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = `atino-ta-hub-du-phong-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("Đã tải file dự phòng JSON");
}

/* ---------------- ĐIỀU HƯỚNG ---------------- */
const UI = { filters: { q: "", posId: "", stage: "", ta: "" } };

function parseHash() {
  const h = location.hash.replace(/^#/, "") || "/home";
  const [path, qs] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  return { route: parts[0] || "home", id: parts[1] ? decodeURIComponent(parts[1]) : null, query: new URLSearchParams(qs || "") };
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

function renderNav(route, id) {
  const active = route === "candidate" ? "candidates" : route === "position" ? "positions" : route;
  const html = NAV.map(n => `<a href="#/${n.id}" class="${n.id === active ? "active" : ""}"><span class="ico">${n.ico}</span><span>${n.label}</span></a>`).join("");
  $("#sideNav").innerHTML = html;
  $("#bottomNav").innerHTML = html;
  const cur = NAV.find(n => n.id === active);
  const sub = { candidate: "Hồ sơ ứng viên", position: "Chân dung & phiếu điểm", activity: "Nhật ký hoạt động" }[route]
    || (route === "tools" ? ({ "loc-cv": "Lọc CV", "so-van": "Sơ vấn", jd: "Viết JD & tin đăng", nguon: "Tạo nguồn", "so-sanh": "So sánh ứng viên" }[id] || "") : "");
  $("#topTitle").textContent = sub || (cur ? cur.label : "");
}

function renderUserChip() {
  const u = getUser();
  $("#userChip").innerHTML = u
    ? `<span class="avatar">${esc(initials(u))}</span><span class="name">${esc(u)}</span>`
    : `<span class="avatar">?</span><span class="name">Chọn tên</span>`;
}

function renderBanner() {
  const b = $("#banner");
  if (!isConnected()) {
    b.innerHTML = `<div class="banner"><span>⚠️ <b>Chế độ thử:</b> chưa kết nối Google Sheet — dữ liệu chỉ lưu trên máy này.</span>
      <button class="btn sm" data-act="openSettings" type="button">Kết nối</button></div>`;
  } else if (Store.state.outbox.length) {
    b.innerHTML = `<div class="banner"><span>⏳ Còn <b>${Store.state.outbox.length}</b> thay đổi chưa lưu lên Sheet (vẫn giữ trên máy).</span>
      <span class="btn-row"><button class="btn sm primary" data-act="retrySave" type="button">Thử lại</button>
      <button class="btn sm" data-act="downloadJSON" type="button">Tải JSON</button></span></div>`;
  } else b.innerHTML = "";
}

function renderSavePill() {
  const pill = $("#savePill");
  const { status, statusMsg } = Store.state;
  const map = {
    loading: "⟳ Đang tải…",
    saving: "⟳ Đang lưu…",
    saved: "✓ Đã lưu",
    error: "⚠ Chưa lưu · Thử lại",
    local: "Chế độ thử"
  };
  pill.className = "save-pill" + (map[status] ? " show " + status : "");
  pill.textContent = map[status] || "";
  pill.title = statusMsg || "";
  if (status === "saved") {
    clearTimeout(renderSavePill._t);
    renderSavePill._t = setTimeout(() => { if (Store.state.status === "saved") pill.classList.remove("show"); }, 3000);
  }
}

/** Vẽ lại màn hình hiện tại, giữ nguyên chữ đang gõ & con trỏ */
function render() {
  const { route, id, query } = parseHash();
  const keep = {};
  $$("[data-keep]").forEach(el => { keep[el.dataset.keep] = el.value; });
  const focused = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.keep : null;
  const scrollY = window.scrollY;
  const sameView = render._last === location.hash;

  renderNav(route, id);
  renderUserChip();
  renderBanner();
  const view = $("#view");
  const views = { home: viewHome, learn: viewLearn, positions: viewPositions, position: viewPosition, tools: viewTools, candidates: viewCandidates, candidate: viewCandidate, activity: viewActivity };
  view.innerHTML = (views[route] || viewHome)(id, query);

  if (sameView) {
    Object.keys(keep).forEach(k => { const el = $(`[data-keep="${k}"]`); if (el && el.value !== keep[k]) el.value = keep[k]; });
    if (focused) { const el = $(`[data-keep="${focused}"]`); if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* select */ } } }
    window.scrollTo(0, scrollY);
  } else window.scrollTo(0, 0);
  render._last = location.hash;
}

/* ---------------- KHỐI DÙNG CHUNG ---------------- */
function pageHead(title, howto, extra = "") {
  return `<div class="page-head"><h1>${title}</h1>${extra}<p class="howto"><span><b>Làm gì ở đây:</b> ${howto}</span></p></div>`;
}
function loadingBlock() {
  return `<div class="card"><div class="skeleton" style="width:40%"></div><div class="skeleton"></div><div class="skeleton" style="width:80%"></div><p class="muted small" style="text-align:center">Đang tải dữ liệu từ Google Sheet…</p></div>`;
}
function emptyBlock(ico, title, text, btn = "") {
  return `<div class="empty"><div class="ico">${ico}</div><h3>${title}</h3><p>${text}</p>${btn}</div>`;
}
function candRow(c, opts = {}) {
  const cv = toNum(c.diemCV), sv = toNum(c.diemSoVan);
  const score = sv !== null ? `<span class="score ${verdictClass(c.ketLuanSoVan, sv)}">Sơ vấn ${fmtScore(sv)}</span>`
    : cv !== null ? `<span class="score ${verdictClass(c.ketLuanCV, cv)}">CV ${fmtScore(cv)}</span>` : "";
  const sub = [posName(c.posId), opts.showTA !== false ? str(c.taPhuTrach) : "", str(c.nguon)].filter(Boolean).join(" · ");
  return `<a class="row" href="#/candidate/${encodeURIComponent(c.candId)}">
    <span class="avatar">${esc(initials(candName(c)))}</span>
    <span style="min-width:0"><div class="title">${esc(candName(c))}${str(c.maHoSo) && str(c.hoTen) ? ` <span class="muted small">· ${esc(c.maHoSo)}</span>` : ""}</div>
      <div class="sub">${esc(sub)}</div></span>
    <span class="meta">${stageBadge(stageOf(c))}${score}</span></a>`;
}

/* ---------------- TRANG CHỦ ---------------- */
function viewHome() {
  const user = getUser();
  const cands = Store.candidates;
  let html = pageHead(`Chào ${esc(user || "bạn")} 👋`, "xem nhanh tình hình tuyển dụng của cả team và những ứng viên <b>bạn</b> cần xử lý tiếp.");

  html += `<div class="quick">
    <a class="main" href="#/candidates" data-act="newCandidate"><span class="ico">＋</span>Ứng viên</a>
    <a href="#/positions"><span class="ico">💼</span>Vị trí</a>
    <a href="#/learn"><span class="ico">📘</span>Học</a></div>`;

  if (!Store.state.hasData && isConnected()) return html + loadingBlock();

  html += onboardingCard();

  // Phễu
  const count = s => cands.filter(c => stageOf(c) === s).length;
  const max = Math.max(1, ...MAIN_STAGES.map(count));
  html += `<div class="card"><div class="card-head"><h2>Phễu tuyển dụng ${tip("pipeline")}</h2><span class="muted small">${cands.length} ứng viên</span></div>`;
  if (!cands.length) {
    html += emptyBlock("🌱", "Chưa có ứng viên nào", "Bắt đầu bằng cách thêm ứng viên đầu tiên — chỉ cần tên hoặc mã hồ sơ.",
      `<button class="btn primary" data-act="newCandidate" type="button">＋ Thêm ứng viên</button>`);
  } else {
    html += `<div class="funnel">` + MAIN_STAGES.map(s => {
      const n = count(s);
      return `<a class="funnel-row" href="#/candidates?stage=${encodeURIComponent(s)}">
        <span class="name">${esc(s)}</span><span class="bar"><i style="width:${(n / max) * 100}%;background:${STAGE_META[s].color}"></i></span><span class="num">${n}</span></a>`;
    }).join("") + `</div><div class="side-stats">` + SIDE_STAGES.map(s =>
      `<a class="stat" href="#/candidates?stage=${encodeURIComponent(s)}">${stageBadge(s)}<b>${count(s)}</b></a>`).join("") + `</div>`;
  }
  html += `</div>`;

  // Việc của tôi
  const mine = cands.filter(c => str(c.taPhuTrach) === user);
  const todoStages = MAIN_STAGES.filter(s => STAGE_META[s].next);
  const todo = todoStages.map(s => ({ s, list: sortRecent(mine.filter(c => stageOf(c) === s)) })).filter(g => g.list.length);
  html += `<div class="card"><div class="card-head"><h2>Việc của tôi</h2><span class="muted small">${mine.length} người bạn phụ trách</span></div>`;
  if (!todo.length) {
    html += mine.length
      ? emptyBlock("✅", "Hết việc cần làm!", "Các ứng viên của bạn đều đã xong (nhận việc / loại / talent pool).")
      : emptyBlock("🙋", "Bạn chưa phụ trách ứng viên nào", "Khi thêm ứng viên, app tự ghi bạn là TA phụ trách.",
        `<button class="btn primary" data-act="newCandidate" type="button">＋ Thêm ứng viên</button>`);
  } else {
    html += todo.map(g => `<div class="group-title"><span>${stageBadge(g.s)} <b>${g.list.length}</b></span></div>
      <p class="next-hint">👉 Việc tiếp theo: <b>${esc(STAGE_META[g.s].next)}</b></p>
      <div class="list">${g.list.map(c => candRow(c, { showTA: false })).join("")}</div>`).join("");
  }
  html += `</div>`;
  html += recentActivityCard();
  return html;
}

/* ---------------- HỌC / VỊ TRÍ / CÔNG CỤ (chờ pha sau) ---------------- */
function soonBlock(ico, title, items) {
  return `<div class="card soon"><div class="ico">${ico}</div><h2>Đang phát triển — sẽ có ở pha sau</h2>
    <p class="muted" style="margin-top:6px">${title}</p>
    <div class="soon-list">${items.map(i => `<div>${i}</div>`).join("")}</div></div>`;
}
/* viewLearn: xem js/learn.js (Pha 4) · viewTools, viewPositions, viewPosition: xem js/tools.js (Pha 2) */

/* ---------------- DANH SÁCH ỨNG VIÊN ---------------- */
function filteredCandidates() {
  const f = UI.filters;
  const q = f.q.toLowerCase().trim();
  return sortRecent(Store.candidates.filter(c => {
    if (f.posId && String(c.posId) !== f.posId) return false;
    if (f.stage && stageOf(c) !== f.stage) return false;
    if (f.ta && str(c.taPhuTrach) !== f.ta) return false;
    if (q && !(str(c.hoTen).toLowerCase().includes(q) || str(c.maHoSo).toLowerCase().includes(q))) return false;
    return true;
  }));
}
function viewCandidates(_, query) {
  // Lọc từ link (vd bấm phễu ở Trang chủ)
  if (query.has("stage")) UI.filters.stage = query.get("stage");
  if (query.has("posId")) UI.filters.posId = query.get("posId");
  if (query.has("stage") || query.has("posId")) { history.replaceState(null, "", "#/candidates"); render._last = "#/candidates"; }

  const f = UI.filters;
  const all = Store.candidates;
  const tas = Array.from(new Set([...TA_NAMES, ...all.map(c => str(c.taPhuTrach)).filter(Boolean)]));
  let html = pageHead("👥 Ứng viên", "tìm, lọc và mở hồ sơ ứng viên. Bấm vào 1 người để chuyển trạng thái, gửi HM hoặc từ chối.",
    `<div style="margin-top:10px"><button class="btn primary" data-act="newCandidate" type="button">＋ Thêm ứng viên</button></div>`);

  const stageCount = s => all.filter(c => stageOf(c) === s
    && (!f.posId || String(c.posId) === f.posId) && (!f.ta || str(c.taPhuTrach) === f.ta)).length;
  html += `<div class="filters">
    <div class="search"><input class="input" type="search" data-keep="q" data-filter="q" value="${esc(f.q)}" placeholder="Tìm theo tên hoặc mã hồ sơ…" aria-label="Tìm kiếm"></div>
    <div class="two">
      <select class="input" data-filter="posId" aria-label="Lọc theo vị trí"><option value="">Tất cả vị trí</option>
        ${Store.positions.map(p => `<option value="${esc(p.posId)}" ${String(p.posId) === f.posId ? "selected" : ""}>${esc(p.tenViTri)}</option>`).join("")}</select>
      <select class="input" data-filter="ta" aria-label="Lọc theo TA"><option value="">Tất cả TA</option>
        ${tas.map(t => `<option ${t === f.ta ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
    </div>
    <div class="chips scroll">
      <button class="chip ${!f.stage ? "on" : ""}" data-act="filterStage" data-val="" type="button">Tất cả</button>
      ${ALL_STAGES.map(s => `<button class="chip ${f.stage === s ? "on" : ""}" data-act="filterStage" data-val="${esc(s)}" type="button">${esc(s)} <span class="count">${stageCount(s)}</span></button>`).join("")}
    </div></div>`;

  if (!Store.state.hasData && isConnected()) return html + loadingBlock();

  const list = filteredCandidates();
  const anyFilter = f.q || f.posId || f.stage || f.ta;
  html += `<div class="card">`;
  if (!all.length) {
    html += emptyBlock("🌱", "Chưa có ứng viên nào", "Thêm ứng viên đầu tiên — chỉ cần tên hoặc mã hồ sơ, các ô khác bấm chọn.",
      `<button class="btn primary" data-act="newCandidate" type="button">＋ Thêm ứng viên</button>`);
  } else if (!list.length) {
    html += emptyBlock("🔍", "Không tìm thấy ai", "Thử bỏ bớt bộ lọc hoặc gõ ít chữ hơn.",
      `<button class="btn" data-act="clearFilters" type="button">Bỏ hết bộ lọc</button>`);
  } else {
    html += `<div class="result-count">${list.length} ứng viên${anyFilter ? ` · <a href="#" data-act="clearFilters">bỏ lọc</a>` : ""}</div>
      <div class="list">${list.map(c => candRow(c)).join("")}</div>`;
  }
  return html + `</div>`;
}

/* ---------------- HỒ SƠ ỨNG VIÊN ---------------- */
function scoreBox(label, scoreRaw, verdict, tipKey, pendingText, link, linkLabel) {
  const n = toNum(scoreRaw);
  const btn = `<a class="btn sm" style="margin-top:8px" href="${link}">${linkLabel}</a>`;
  if (n === null) return `<div class="score-box"><div class="lbl">${label} ${tip(tipKey)}</div><div class="big muted">—</div><div class="small muted">${pendingText}</div>${btn.replace("btn sm", "btn sm primary")}</div>`;
  const cls = verdictClass(verdict, n);
  return `<div class="score-box"><div class="lbl">${label} ${tip(tipKey)}</div>
    <div class="big verdict ${cls}">${fmtScore(n)}<span class="small muted"> / 4</span></div>
    <div class="verdict ${cls}" style="font-weight:600">${esc(verdict || "")}</div>${btn}</div>`;
}
function viewCandidate(id) {
  const c = findCand(id);
  if (!c) {
    if (!Store.state.hasData && isConnected()) return loadingBlock();
    return `<a class="back" href="#/candidates">← Danh sách ứng viên</a>` +
      `<div class="card">${emptyBlock("🤷", "Không tìm thấy ứng viên này", "Có thể ứng viên đã bị xoá, hoặc dữ liệu chưa tải xong.", `<a class="btn primary" href="#/candidates">Về danh sách</a>`)}</div>`;
  }
  const stage = stageOf(c);
  const meta = STAGE_META[stage];
  const idx = MAIN_STAGES.indexOf(stage);
  const nextStage = idx >= 0 && idx < MAIN_STAGES.length - 1 ? MAIN_STAGES[idx + 1] : null;
  const history = Array.isArray(asObj(c.chiTiet).lichSu) ? asObj(c.chiTiet).lichSu : [];

  let html = `<a class="back" href="#/candidates">← Danh sách ứng viên</a>`;
  html += `<p class="howto" style="margin:0 0 12px"><span><b>Làm gì ở đây:</b> xem điểm & bằng chứng, chuyển ứng viên sang bước tiếp, gửi HM hoặc từ chối tử tế. Mọi thay đổi tự lưu lên Sheet.</span></p>`;
  html += `<div class="card"><div class="profile-head"><span class="avatar">${esc(initials(candName(c)))}</span>
    <div style="min-width:0"><h1>${esc(candName(c))}</h1><div class="muted">${esc(posName(c.posId))}</div><div style="margin-top:4px">${stageBadge(stage)}</div></div></div>`;

  // Thanh tiến trình
  html += `<div class="stepper">` + MAIN_STAGES.map((s, i) => {
    const cls = idx < 0 ? "" : i < idx ? "done" : i === idx ? "cur" : "";
    return `<div class="step ${cls}"><span class="dot">${cls === "done" ? "✓" : i + 1}</span><span class="lbl">${esc(s)}</span></div>`;
  }).join("") + `</div>`;
  if (idx < 0) html += `<div class="side-state" style="--c:${meta.color}">${stageBadge(stage)} ${esc(meta.desc)}</div>`;
  else if (meta.next) html += `<p class="next-hint" style="margin-top:8px">👉 Việc tiếp theo: <b>${esc(meta.next)}</b></p>`;

  const cid = encodeURIComponent(c.candId);
  html += `<div class="btn-row" style="margin-top:14px">
    ${stage === "Mới" ? `<a class="btn primary" href="#/tools/loc-cv?cand=${cid}">📄 Lọc CV ngay</a>` : ""}
    ${stage === "Đã lọc CV" ? `<a class="btn primary" href="#/tools/so-van?cand=${cid}">📞 Sơ vấn ngay</a>` : ""}
    ${nextStage ? `<button class="btn primary" data-act="nextStage" data-id="${esc(c.candId)}" data-val="${esc(nextStage)}" type="button">Chuyển sang: ${esc(nextStage)} →</button>` : ""}
    <button class="btn" data-act="openStage" data-id="${esc(c.candId)}" type="button">Đổi trạng thái…</button></div></div>`;

  // Thao tác
  html += `<div class="card"><div class="card-head"><h2>Thao tác nhanh</h2></div><div class="actions">
    <button class="action" data-act="openHM" data-id="${esc(c.candId)}" type="button"><span class="t">📤 Chuyển HM</span><span class="d">Soạn sẵn tóm tắt để gửi quản lý</span></button>
    <button class="action" data-act="openPool" data-id="${esc(c.candId)}" type="button"><span class="t">⭐ Talent Pool</span><span class="d">Giữ lại người có điểm mạnh</span></button>
    <button class="action" data-act="openReject" data-id="${esc(c.candId)}" type="button"><span class="t">💌 Từ chối tử tế</span><span class="d">Mẫu tin nhắn lịch sự, copy là gửi</span></button>
    <button class="action" data-act="editCandidate" data-id="${esc(c.candId)}" type="button"><span class="t">✏️ Sửa thông tin</span><span class="d">Tên, mã, vị trí, nguồn, TA</span></button>
  </div></div>`;

  // Điểm
  html += `<div class="card"><div class="card-head"><h2>Điểm đánh giá</h2></div><div class="grid two">
    ${scoreBox("Điểm lọc CV", c.diemCV, c.ketLuanCV, "locCV", "Chưa chấm CV.", `#/tools/loc-cv?cand=${cid}`, toNum(c.diemCV) === null ? "📄 Lọc CV" : "Xem / chấm lại")}
    ${scoreBox("Điểm sơ vấn", c.diemSoVan, c.ketLuanSoVan, "soVan", "Chưa sơ vấn.", `#/tools/so-van?cand=${cid}`, toNum(c.diemSoVan) === null ? "📞 Sơ vấn" : "Xem / sửa")}
  </div>`;
  const ev = asObj(asObj(c.chiTiet).bangChung);
  if (Object.keys(ev).length) html += `<details class="neo" style="margin-top:12px"><summary><b>Bằng chứng theo tiêu chí</b> (${Object.keys(ev).length})</summary>
    <dl class="kv" style="margin-top:8px">${Object.keys(ev).map(k => `<dt>${esc(k)}</dt><dd style="white-space:pre-line">${esc(ev[k])}</dd>`).join("")}</dl></details>`;
  html += `</div>`;

  // Thông tin
  html += `<div class="card"><div class="card-head"><h2>Thông tin</h2></div><dl class="kv">
    <dt>Mã hồ sơ</dt><dd>${esc(str(c.maHoSo) || "—")}</dd>
    <dt>Vị trí</dt><dd>${esc(posName(c.posId))}</dd>
    <dt>Nguồn</dt><dd>${esc(str(c.nguon) || "—")}</dd>
    <dt>TA phụ trách</dt><dd>${esc(str(c.taPhuTrach) || "—")}</dd>
    <dt>Ngày tạo</dt><dd>${esc(fmtDate(c.ngayTao) || "—")}</dd>
    <dt>Cập nhật</dt><dd>${esc(fmtDate(c.ngayCapNhat, true) || "—")}</dd></dl></div>`;

  // Ghi chú
  html += `<div class="card"><div class="card-head"><h2>Ghi chú</h2></div>
    <textarea class="input" id="noteInput" data-legal-check data-keep="note-${esc(c.candId)}" placeholder="VD: 2 năm bán hàng thời trang, đi làm được ngay từ 01/12, làm được ca tối. (Ghi sự việc, con số — đừng ghi “tốt/đẹp”.)">${esc(c.ghiChu)}</textarea>${legalSlot("noteInput", c.ghiChu)}
    <div class="btn-row" style="margin-top:10px"><button class="btn primary" data-act="saveNote" data-id="${esc(c.candId)}" type="button">Lưu ghi chú</button></div></div>`;

  // Lịch sử
  html += `<div class="card"><div class="card-head"><h2>Lịch sử trạng thái</h2></div>`;
  html += history.length
    ? `<ul class="timeline">${history.slice().reverse().map(h => `<li><b>${esc(h.den)}</b>${h.tu ? ` <span class="muted">(từ ${esc(h.tu)})</span>` : ""}
        <div class="small muted">${esc(fmtDate(h.t, true))}${h.by ? " · " + esc(h.by) : ""}</div>${h.note ? `<div class="small">“${esc(h.note)}”</div>` : ""}</li>`).join("")}</ul>`
    : `<p class="muted small">Chưa có lịch sử. Mỗi lần đổi trạng thái, app sẽ ghi lại ở đây.</p>`;
  html += candidateLogsHtml(c.candId) + `</div>`;

  html += `<div style="text-align:center;margin:8px 0 4px"><button class="btn ghost" style="color:var(--bad)" data-act="deleteCandidate" data-id="${esc(c.candId)}" type="button">🗑 Xoá ứng viên này</button></div>`;
  return html;
}

/* ---------------- HỘP THOẠI ---------------- */
let M = {}; // trạng thái của hộp thoại đang mở
function openModal(title, html, { locked = false } = {}) {
  const root = $("#modal");
  root.innerHTML = `<div class="modal-backdrop" ${locked ? "" : 'data-act="closeModal"'}></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h2>${title}</h2>${locked ? "" : `<button class="icon-btn" data-act="closeModal" type="button" aria-label="Đóng">✕</button>`}</div>
      <div class="modal-body">${html}</div></div>`;
  root.hidden = false;
  root.dataset.locked = locked ? "1" : "";
  document.body.classList.add("no-scroll");
  return root;
}
function closeModal() {
  const root = $("#modal");
  if (root.dataset.locked === "1") return;
  root.hidden = true; root.innerHTML = ""; M = {};
  document.body.classList.remove("no-scroll");
}
function forceCloseModal() { $("#modal").dataset.locked = ""; closeModal(); }

/* --- Đăng nhập nhẹ --- */
function openLogin() {
  const cur = getUser();
  const locked = !cur;
  M = { user: cur };
  const custom = cur && !TA_NAMES.includes(cur) ? cur : "";
  openModal(locked ? "Chào bạn! Bạn là ai? 👋" : "Đổi người dùng", `
    <p class="muted" style="margin-bottom:14px">Chọn tên của bạn. App sẽ ghi tên này vào mỗi ứng viên bạn phụ trách. Không cần mật khẩu.</p>
    <div class="chips" style="margin-bottom:14px">${TA_NAMES.map(n => `<button class="chip ${n === cur ? "on" : ""}" data-act="pickUser" data-val="${esc(n)}" type="button">${esc(n)}</button>`).join("")}</div>
    <label class="field"><span>Hoặc gõ tên khác</span><input id="userCustom" value="${esc(custom)}" placeholder="VD: Thu Trang" autocomplete="off"></label>
    <div class="field-error hidden" id="userErr">Bạn chọn 1 tên hoặc gõ tên nhé.</div>
    <button class="btn primary block" data-act="confirmUser" type="button">${locked ? "Bắt đầu dùng" : "Lưu"}</button>`, { locked });
}

/* --- Cài đặt --- */
function openSettings() {
  const st = Store.state;
  const inCode = !!String(API_URL).trim();
  openModal("⚙ Cài đặt & dữ liệu", `
    <h3 style="margin-bottom:6px">Kết nối Google Sheet</h3>
    <p class="small muted" style="margin-bottom:10px">${isConnected()
      ? `✅ Đang kết nối${inCode && !LocalDB.get(LS_KEYS.apiOverride, "") ? " (URL cài sẵn trong code)" : " (URL dán trên máy này)"}. Lần đồng bộ cuối: <b>${esc(fmtDate(st.lastSync, true) || "chưa có")}</b>.`
      : `⚠️ Chưa kết nối — đang chạy <b>chế độ thử</b> (lưu trên máy này). Dán URL Web App (kết thúc bằng <b>/exec</b>) để lưu chung cho cả team.`}</p>
    <label class="field"><span>URL Web App</span><input id="apiInput" value="${esc(LocalDB.get(LS_KEYS.apiOverride, "") || API_URL)}" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off"></label>
    <div class="field-hint" id="apiMsg" style="margin:-6px 0 10px"></div>
    <div class="btn-row"><button class="btn primary" data-act="saveApi" type="button">Lưu & kiểm tra</button>
      ${LocalDB.get(LS_KEYS.apiOverride, "") ? `<button class="btn" data-act="clearApi" type="button">Dùng URL trong code</button>` : ""}</div>
    <div class="divider"></div>
    <h3 style="margin-bottom:6px">Dữ liệu</h3>
    <p class="small muted" style="margin-bottom:10px">${Store.positions.length} vị trí · ${Store.candidates.length} ứng viên${st.outbox.length ? ` · <b style="color:var(--bad)">${st.outbox.length} thay đổi chưa lưu lên Sheet</b>` : ""}.</p>
    <div class="btn-row">
      <button class="btn" data-act="syncNow" type="button">⟳ Tải lại từ Sheet</button>
      <button class="btn" data-act="downloadJSON" type="button">⬇ Tải JSON dự phòng</button></div>
    <div class="divider"></div>
    <h3 style="margin-bottom:6px">Người dùng</h3>
    <p class="small muted" style="margin-bottom:10px">Đang dùng tên: <b>${esc(getUser())}</b></p>
    <div class="btn-row"><button class="btn" data-act="openLogin" type="button">Đổi tên</button>
      <button class="btn" data-act="goActivity" type="button">📜 Nhật ký hoạt động</button></div>`);
}

/* --- Thêm / sửa ứng viên --- */
function positionOptions(selected) {
  return `<option value="">— Chọn vị trí —</option>` + Store.positions.slice()
    .sort((a, b) => str(a.tenViTri).localeCompare(str(b.tenViTri), "vi"))
    .map(p => `<option value="${esc(p.posId)}" ${String(p.posId) === String(selected) ? "selected" : ""}>${esc(p.tenViTri)}</option>`).join("");
}
function openCandidateForm(c, onSaved) {
  const isNew = !c;
  const user = getUser();
  M = { kind: "cand", editId: c ? c.candId : null, nguon: c ? str(c.nguon) : "", ta: c ? str(c.taPhuTrach) || user : user, nhom: "Mass", onSaved };
  const tas = Array.from(new Set([...TA_NAMES, user, M.ta].filter(Boolean)));
  openModal(isNew ? "＋ Thêm ứng viên" : "✏️ Sửa thông tin", `
    <p class="howto" style="margin:0 0 14px"><span>Chỉ cần <b>tên</b> hoặc <b>mã hồ sơ</b> là lưu được. Các ô còn lại bấm chọn.</span></p>
    <label class="field"><span>Họ tên ứng viên</span><input id="f_hoTen" value="${esc(c ? c.hoTen : "")}" placeholder="VD: Nguyễn Văn An" autocomplete="off"></label>
    <div class="field"><span class="field-label">Mã hồ sơ ${tip("maHoSo")}</span><input class="input" id="f_maHoSo" value="${esc(c ? c.maHoSo : "")}" placeholder="VD: TOPCV-12345" autocomplete="off"></div>
    <div class="field-error hidden" id="f_err" style="margin:-8px 0 12px">Cần nhập ít nhất <b>họ tên</b> hoặc <b>mã hồ sơ</b>.</div>
    <div class="field"><span class="field-label">Vị trí ứng tuyển</span>
      <select class="input" id="f_posId">${positionOptions(c ? c.posId : UI.filters.posId)}</select>
      <button class="btn ghost sm" style="padding-left:0;margin-top:4px" data-act="toggleQuickPos" type="button">＋ Chưa có vị trí? Tạo nhanh</button>
      <div class="qpos hidden" id="qpos">
        <input class="input" id="q_ten" placeholder="VD: Tư vấn bán hàng – ATINO Q.1" autocomplete="off" style="margin-bottom:10px">
        <div class="field-label">Nhóm ${tip("nhom")}</div>
        <div class="chips" style="margin-bottom:10px">${Object.keys(GROUPS).map(k => `<button class="chip ${k === "Mass" ? "on" : ""}" data-act="pickChip" data-group="nhom" data-val="${k}" type="button">${esc(GROUPS[k].label)}</button>`).join("")}</div>
        <button class="btn primary sm" data-act="createQuickPos" type="button">Tạo vị trí</button></div></div>
    <div class="field"><span class="field-label">Nguồn ${tip("nguon")}</span>
      <div class="chips">${SOURCES.map(s => `<button class="chip ${s === M.nguon ? "on" : ""}" data-act="pickChip" data-group="nguon" data-val="${esc(s)}" type="button">${esc(s)}</button>`).join("")}</div></div>
    <div class="field"><span class="field-label">TA phụ trách ${tip("ta")}</span>
      <div class="chips">${tas.map(t => `<button class="chip ${t === M.ta ? "on" : ""}" data-act="pickChip" data-group="ta" data-val="${esc(t)}" type="button">${esc(t)}</button>`).join("")}</div></div>
    ${isNew ? `<label class="field"><span>Ghi chú (tuỳ chọn)</span><textarea id="f_ghiChu" data-legal-check placeholder="VD: 1 năm bán hàng ở cửa hàng giày, làm được ca tối. (Ghi sự việc, con số.)"></textarea></label>${legalSlot("f_ghiChu", "")}` : ""}
    <div class="btn-row"><button class="btn" data-act="closeModal" type="button">Huỷ</button>
      <button class="btn primary" data-act="saveCandidateForm" type="button">${isNew ? "Lưu ứng viên" : "Lưu thay đổi"}</button></div>`);
  setTimeout(() => { const el = $("#f_hoTen"); if (el && window.innerWidth >= 700) el.focus(); }, 50);
}

/* --- Tạo vị trí nhanh (từ trang Vị trí) --- */
function openQuickPosition() {
  M = { kind: "pos", nhom: "Mass" };
  openModal("＋ Tạo vị trí nhanh", `
    <p class="howto" style="margin:0 0 14px"><span>Chỉ cần tên + nhóm. Muốn lọc CV/sơ vấn thì cần thêm phiếu điểm: vào <b>Vị trí</b> → bấm tên vị trí.</span></p>
    <label class="field"><span>Tên vị trí</span><input id="q_ten" placeholder="VD: Tư vấn bán hàng – ATINO Q.1" autocomplete="off"></label>
    <div class="field"><span class="field-label">Nhóm ${tip("nhom")}</span>
      <div class="chips">${Object.keys(GROUPS).map(k => `<button class="chip ${k === "Mass" ? "on" : ""}" data-act="pickChip" data-group="nhom" data-val="${k}" type="button">${esc(GROUPS[k].label)}</button>`).join("")}</div>
      <div class="field-hint" id="nhomHint">${esc(GROUPS.Mass.hint)}</div></div>
    <div class="btn-row"><button class="btn" data-act="closeModal" type="button">Huỷ</button>
      <button class="btn primary" data-act="createQuickPos" type="button">Tạo vị trí</button></div>`);
}

/* --- Đổi trạng thái --- */
function openStageModal(id) {
  const c = findCand(id); if (!c) return;
  const cur = stageOf(c);
  M = { candId: id };
  openModal("Đổi trạng thái", `
    <p class="muted" style="margin-bottom:12px">${esc(candName(c))} đang ở: ${stageBadge(cur)}. Bấm trạng thái mới:</p>
    ${ALL_STAGES.map((s, i) => `${i === MAIN_STAGES.length ? `<div class="field-label" style="margin:14px 0 8px">Nhánh phụ</div>` : ""}
      <button class="stage-option ${s === cur ? "cur" : ""}" style="--c:${STAGE_META[s].color}" data-act="pickStage" data-val="${esc(s)}" type="button">
        <span class="sw"></span><span><div class="t">${esc(s)}${s === cur ? " (hiện tại)" : ""}</div><div class="d">${esc(STAGE_META[s].desc)}</div></span></button>`).join("")}
    <label class="field" style="margin-top:10px"><span>Lý do / ghi chú (tuỳ chọn)</span><input id="stageNote" data-legal-check placeholder="VD: HM hẹn phỏng vấn 9h sáng thứ 5" autocomplete="off"></label>${legalSlot("stageNote", "")}`);
}
function changeStage(id, newStage, note = "") {
  const c = findCand(id); if (!c) return;
  const old = stageOf(c);
  if (old === newStage) { toast("Ứng viên đã ở trạng thái này rồi"); return; }
  const chiTiet = Object.assign({}, asObj(c.chiTiet));
  chiTiet.lichSu = [...(Array.isArray(chiTiet.lichSu) ? chiTiet.lichSu : []),
    { t: new Date().toISOString(), tu: old, den: newStage, by: getUser(), note: note || "" }];
  Store.save({ action: "saveCandidate", candidate: { candId: c.candId, trangThai: newStage, chiTiet } });
  toast(`Đã chuyển → ${newStage}`);
}

/* --- Chuyển HM --- */
function hmSummary(c) {
  const cv = toNum(c.diemCV), sv = toNum(c.diemSoVan);
  const ct = asObj(c.chiTiet);
  const pos = findPos(c.posId);
  const sc = pos ? asObj(pos.scorecard) : {};
  const soVan = asObj(ct.soVan), locCV = asObj(ct.locCV);
  const lines = [
    `📋 TÓM TẮT ỨNG VIÊN — VỊ TRÍ ${posName(c.posId).toUpperCase()}`,
    ``,
    `• Họ tên: ${str(c.hoTen) || "(chưa có)"}${str(c.maHoSo) ? `  |  Mã hồ sơ: ${c.maHoSo}` : ""}`,
    `• Nguồn: ${str(c.nguon) || "—"}`,
    `• Điểm lọc CV: ${cv !== null ? fmtScore(cv) + "/4" + (str(c.ketLuanCV) ? " — " + c.ketLuanCV : "") : "chưa chấm"}`,
    `• Điểm sơ vấn: ${sv !== null ? fmtScore(sv) + "/4" + (str(c.ketLuanSoVan) ? " — " + c.ketLuanSoVan : "") : "chưa sơ vấn"}`
  ];
  // Loại cứng (ưu tiên kết quả sơ vấn vì đã hỏi trực tiếp)
  const must = sc.mustHave || [];
  if (must.length && (soVan.must || locCV.must)) {
    lines.push(``, `⛔ Loại cứng:`);
    must.forEach(m => {
      const s = asObj((soVan.must || {})[m.id]), l = asObj((locCV.must || {})[m.id]);
      const k = s.k || l.k;
      const label = { co: "✓ Có", dat: "✓ Đạt", khong: "✕ Không", truot: "✕ Trượt" }[k] || "? Chưa rõ";
      lines.push(`  ${label} — ${m.ten}${str(s.note) ? " (" + str(s.note) + ")" : ""}`);
    });
  }
  // Điểm từng tiêu chí + bằng chứng
  const crit = sc.tieuChi || [];
  const src = soVan.diem ? soVan : locCV.diem ? locCV : null;
  if (crit.length && src) {
    lines.push(``, `🔎 Điểm & bằng chứng (${src === soVan ? "sơ vấn" : "lọc CV"}):`);
    crit.forEach(t => {
      const e = asObj((src.diem || {})[t.id]);
      const label = (typeof CWC !== "undefined" && CWC[t.nhom]) ? CWC[t.nhom].label : "";
      lines.push(`  • ${t.ten}${label ? " [" + label + "]" : ""}: ${e.s ?? "—"}/4${str(e.bc) ? " — " + str(e.bc).replace(/\n+/g, " | ") : ""}`);
    });
  } else {
    const ev = asObj(ct.bangChung);
    const items = Object.keys(ev).filter(k => str(ev[k])).slice(0, 5);
    if (items.length) { lines.push(``, `🔎 Bằng chứng nổi bật:`); items.forEach(k => lines.push(`  - ${k}: ${ev[k]}`)); }
  }
  if (str(soVan.hoi)) lines.push(``, `💬 Ứng viên hỏi: ${str(soVan.hoi)}`);
  if (str(c.ghiChu)) lines.push(``, `📝 Ghi chú của TA: ${str(c.ghiChu)}`);
  const v = str(c.ketLuanSoVan) || str(c.ketLuanCV);
  const de = v === "Đạt" ? "mời ứng viên phỏng vấn vòng quản lý."
    : v.toLowerCase().includes("chờ") ? "cân nhắc — nhờ anh/chị kiểm tra kỹ phần Can do / Culture fit khi phỏng vấn."
    : "mời ứng viên phỏng vấn vòng quản lý.";
  lines.push(``, `👉 Đề xuất: ${de}`,
    `Nhờ anh/chị phản hồi giúp em trong 2 ngày (đồng ý hẹn / không phù hợp) để em giữ ứng viên ạ.`,
    ``, `TA phụ trách: ${str(c.taPhuTrach) || getUser()}`);
  return lines.join("\n");
}
function openHM(id) {
  const c = findCand(id); if (!c) return;
  M = { candId: id };
  const stage = stageOf(c);
  openModal("📤 Chuyển HM", `
    <p class="howto" style="margin:0 0 12px"><span><b>HM</b> (quản lý trực tiếp) rất bận → gửi tóm tắt ngắn, có điểm & bằng chứng, kèm hạn phản hồi. Có thể sửa chữ trước khi copy.</span></p>
    <textarea class="preview" id="hmText" data-legal-check>${esc(hmSummary(c))}</textarea>${legalSlot("hmText", hmSummary(c))}
    <div class="btn-row" style="margin-top:12px">
      <button class="btn" data-act="copyFrom" data-src="hmText" type="button">📋 Copy</button>
      ${stage !== "Chuyển HM" ? `<button class="btn primary" data-act="copyHMAndMove" type="button">📋 Copy & chuyển trạng thái → Chuyển HM</button>` : ""}</div>`);
}

/* --- Talent Pool --- */
const POOL_REASONS = ["Thái độ tốt, nhiệt tình", "Có kinh nghiệm bán hàng", "Hợp vị trí khác", "Chưa đủ điều kiện ca/giờ lúc này", "Vị trí đã đủ người"];
function openPool(id) {
  const c = findCand(id); if (!c) return;
  M = { candId: id, reasons: [] };
  openModal("⭐ Đưa vào Talent Pool", `
    <p class="howto" style="margin:0 0 12px"><span><b>Talent Pool</b> = kho ứng viên tiềm năng. Người chưa hợp lúc này nhưng có điểm mạnh → giữ lại để gọi khi có vị trí khác.</span></p>
    <div class="field-label">Vì sao giữ lại ${esc(candName(c))}? (chọn 1 hoặc nhiều)</div>
    <div class="chips" style="margin-bottom:14px">${POOL_REASONS.map(r => `<button class="chip" data-act="toggleReason" data-val="${esc(r)}" type="button">${esc(r)}</button>`).join("")}</div>
    <label class="field"><span>Ghi thêm (tuỳ chọn)</span><input id="poolNote" data-legal-check placeholder="VD: hợp vị trí kho ở Thủ Đức" autocomplete="off"></label>${legalSlot("poolNote", "")}
    <button class="btn primary block" data-act="confirmPool" type="button">⭐ Đưa vào Talent Pool</button>`);
}

/* --- Từ chối tử tế --- */
const REJECT_TYPES = {
  cv: "Sau khi xem CV",
  sv: "Sau khi sơ vấn / phỏng vấn",
  keep: "Giữ liên lạc (Talent Pool)"
};
const REJECT_REASONS = ["(Không nêu lý do)", "kinh nghiệm chưa khớp yêu cầu", "lịch làm việc / ca chưa phù hợp", "khu vực làm việc chưa thuận tiện", "mức thu nhập mong muốn chưa khớp", "vị trí đã đủ người"];
function rejectText(c, type, reason) {
  const ten = str(c.hoTen) ? givenName(c.hoTen) : "bạn";
  const vt = posName(c.posId);
  const why = reason && !reason.startsWith("(") ? ` vì ${reason}` : "";
  const sign = `${getUser() || str(c.taPhuTrach)} — Tuyển dụng ATINO`;
  if (type === "cv") return `Chào ${ten},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vị trí ${vt} tại ATINO.\n\nSau khi xem kỹ hồ sơ, ATINO rất tiếc lần này chưa thể mời bạn vào vòng tiếp theo${why}. Đây không phải là đánh giá về con người bạn — chỉ là chưa đúng vị trí và thời điểm.\n\nATINO xin phép lưu hồ sơ và sẽ chủ động liên hệ khi có cơ hội phù hợp hơn. Chúc bạn sớm tìm được công việc ưng ý!\n\n${sign}`;
  if (type === "sv") return `Chào ${ten},\n\nCảm ơn bạn đã dành thời gian trò chuyện với ATINO về vị trí ${vt}. ATINO rất trân trọng sự cởi mở và nhiệt tình của bạn.\n\nSau khi cân nhắc kỹ, lần này ATINO chưa thể đồng hành cùng bạn ở vị trí này${why}.\n\nHồ sơ của bạn vẫn được ATINO lưu lại, và nếu có vị trí phù hợp hơn, ATINO sẽ liên hệ bạn đầu tiên. Chúc bạn mọi điều tốt đẹp!\n\n${sign}`;
  return `Chào ${ten},\n\nCảm ơn bạn đã ứng tuyển vị trí ${vt} tại ATINO. Hiện tại vị trí này ATINO chưa thể nhận bạn${why}, nhưng ATINO rất ấn tượng với những điểm mạnh của bạn.\n\nATINO muốn giữ liên lạc và sẽ ưu tiên báo bạn khi có vị trí phù hợp. Bạn đồng ý để ATINO lưu thông tin và liên hệ lại nhé?\n\n${sign}`;
}
function openReject(id, presetType) {
  const c = findCand(id); if (!c) return;
  const stage = stageOf(c);
  const defType = presetType || (stage === "Talent Pool" ? "keep" : (toNum(c.diemSoVan) !== null || ["Đạt sơ vấn", "Chuyển HM", "Offer"].includes(stage)) ? "sv" : "cv");
  M = { candId: id, type: defType, reason: REJECT_REASONS[0] };
  openModal("💌 Từ chối tử tế", `
    <p class="howto" style="margin:0 0 12px"><span>Ứng viên được báo kết quả rõ ràng sẽ <b>nhớ tốt về ATINO</b> và giới thiệu bạn bè. Chọn tình huống → copy → gửi qua Zalo/SMS.</span></p>
    <div class="field-label">Tình huống</div>
    <div class="chips" style="margin-bottom:12px">${Object.keys(REJECT_TYPES).map(k => `<button class="chip ${k === defType ? "on" : ""}" data-act="pickReject" data-group="type" data-val="${k}" type="button">${esc(REJECT_TYPES[k])}</button>`).join("")}</div>
    <div class="field-label">Lý do (nói nhẹ nhàng, chỉ chọn nếu muốn nêu)</div>
    <div class="chips" style="margin-bottom:12px">${REJECT_REASONS.map((r, i) => `<button class="chip ${i === 0 ? "on" : ""}" data-act="pickReject" data-group="reason" data-val="${esc(r)}" type="button">${esc(r)}</button>`).join("")}</div>
    <p class="small muted" style="margin-bottom:8px">⚠️ Không nêu lý do về tuổi, giới tính, hôn nhân, ngoại hình, quê quán — trái luật lao động.</p>
    <textarea class="preview" id="rejectText" data-legal-check>${esc(rejectText(c, defType, M.reason))}</textarea>${legalSlot("rejectText", "")}
    <div class="btn-row" style="margin-top:12px" id="rejectBtns">${rejectButtons(c, defType)}</div>`);
}
function rejectButtons(c, type) {
  const stage = stageOf(c);
  const target = type === "keep" ? "Talent Pool" : "Loại";
  return `<button class="btn" data-act="copyFrom" data-src="rejectText" type="button">📋 Copy</button>` +
    (stage !== target ? `<button class="btn primary" data-act="copyRejectAndMove" data-val="${target}" type="button">📋 Copy & chuyển → ${target}</button>` : "");
}

/* ---------------- XỬ LÝ SỰ KIỆN ---------------- */
const ACTIONS = {
  closeModal: () => closeModal(),
  openLogin: () => openLogin(),
  openSettings: () => openSettings(),
  downloadJSON: () => downloadJSON(),
  retrySave: () => {
    if (Store.state.status === "error" || Store.state.outbox.length) {
      Store.flush().then(ok => toast(ok ? "Đã lưu ✓" : "Vẫn chưa lưu được — kiểm tra mạng rồi thử lại"));
    }
  },
  syncNow: async () => { const ok = await Store.refresh(); toast(ok ? "Đã tải dữ liệu mới nhất ✓" : (isConnected() ? "Không tải được — kiểm tra mạng" : "Chưa kết nối Google Sheet")); if ($("#modal").hidden === false) openSettings(); },

  tip: (el) => {
    const pop = $("#pop");
    if (!pop.hidden && pop.dataset.for === el.dataset.tip && pop._el === el) { pop.hidden = true; return; }
    pop.innerHTML = TIPS[el.dataset.tip] || "";
    pop.dataset.for = el.dataset.tip; pop._el = el;
    pop.hidden = false;
    const r = el.getBoundingClientRect();
    const w = Math.min(300, window.innerWidth - 24);
    pop.style.maxWidth = w + "px";
    const left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12));
    pop.style.left = left + "px";
    const below = r.bottom + 8;
    pop.style.top = below + "px";
    const ph = pop.offsetHeight;
    if (below + ph > window.innerHeight - 12) pop.style.top = Math.max(12, r.top - ph - 8) + "px";
  },

  pickUser: (el) => {
    M.user = el.dataset.val;
    $$('[data-act="pickUser"]').forEach(b => b.classList.toggle("on", b === el));
    $("#userCustom").value = "";
  },
  confirmUser: () => {
    const custom = str($("#userCustom").value);
    const name = custom || M.user;
    if (!name) { $("#userErr").classList.remove("hidden"); return; }
    setUser(name);
    forceCloseModal();
    toast(`Xin chào ${name}!`);
    render();
  },

  saveApi: async () => {
    const url = str($("#apiInput").value);
    const msg = $("#apiMsg");
    if (url && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) {
      msg.innerHTML = `<span style="color:var(--bad)">URL chưa đúng. Phải bắt đầu bằng <b>https://script.google.com/macros/s/</b> và kết thúc bằng <b>/exec</b>.</span>`;
      return;
    }
    const wasLocal = !isConnected();
    const trial = wasLocal ? { positions: Store.positions.slice(), candidates: Store.candidates.slice() } : null;
    LocalDB.set(LS_KEYS.apiOverride, url === String(API_URL).trim() ? "" : url);
    if (!isConnected()) { msg.textContent = "Đã bỏ URL — quay về chế độ thử."; Store.setStatus("local"); render(); return; }
    msg.textContent = "Đang kiểm tra kết nối…";
    try {
      await apiGet("ping");
      msg.innerHTML = `<span style="color:var(--ok)">✅ Kết nối thành công! Đang tải dữ liệu…</span>`;
      // Dữ liệu nhập ở chế độ thử → hỏi có đưa lên Sheet không
      if (trial && (trial.positions.length || trial.candidates.length) &&
        confirm(`Trên máy này có ${trial.candidates.length} ứng viên và ${trial.positions.length} vị trí nhập ở chế độ thử.\n\nĐưa lên Google Sheet luôn? (Bấm Huỷ nếu chỉ là dữ liệu tập.)`)) {
        trial.positions.forEach(p => Store.state.outbox.push({ id: genId("Q"), body: { action: "savePosition", position: p }, ts: Date.now() }));
        trial.candidates.forEach(c => Store.state.outbox.push({ id: genId("Q"), body: { action: "saveCandidate", candidate: c }, ts: Date.now() }));
      }
      await Store.refresh();
      if (Store.state.outbox.length) await Store.flush();
      render();
      toast("Đã kết nối Google Sheet ✓");
    } catch (e) {
      msg.innerHTML = `<span style="color:var(--bad)">Không kết nối được. Kiểm tra: đã Deploy dạng <b>Web app</b>, “Who has access” = <b>Anyone</b>, và copy đúng URL /exec.</span>`;
    }
  },
  clearApi: () => { LocalDB.remove(LS_KEYS.apiOverride); Store.refresh(); render(); openSettings(); },

  newCandidate: (el, ev) => { ev.preventDefault(); openCandidateForm(null); },
  editCandidate: (el) => openCandidateForm(findCand(el.dataset.id)),
  quickPosition: () => openQuickPosition(),

  pickChip: (el) => {
    const g = el.dataset.group;
    M[g] = el.dataset.val;
    $$(`[data-act="pickChip"][data-group="${g}"]`).forEach(b => b.classList.toggle("on", b === el));
    const hint = $("#nhomHint");
    if (g === "nhom" && hint) hint.textContent = GROUPS[M.nhom].hint;
  },
  toggleQuickPos: () => { $("#qpos").classList.toggle("hidden"); const el = $("#q_ten"); if (el && !$("#qpos").classList.contains("hidden")) el.focus(); },
  createQuickPos: () => {
    const input = $("#q_ten");
    const ten = str(input.value);
    if (!ten) { input.focus(); input.placeholder = "Nhập tên vị trí trước nhé — VD: Thu ngân ATINO Cầu Giấy"; return; }
    const dup = Store.positions.find(p => str(p.tenViTri).toLowerCase() === ten.toLowerCase());
    const posId = dup ? dup.posId : genId("P");
    if (!dup) Store.save({ action: "savePosition", position: { posId, tenViTri: ten, nhom: M.nhom || "Mass", nguoiCapNhat: getUser() } });
    if (M.kind === "cand") {
      $("#f_posId").innerHTML = positionOptions(posId);
      $("#qpos").classList.add("hidden");
      input.value = "";
      toast(dup ? "Vị trí này đã có — đã chọn sẵn" : "Đã tạo vị trí ✓");
    } else {
      closeModal();
      toast(dup ? "Vị trí này đã có rồi" : "Đã tạo vị trí ✓");
    }
  },

  saveCandidateForm: () => {
    const hoTen = str($("#f_hoTen").value), maHoSo = str($("#f_maHoSo").value);
    if (!hoTen && !maHoSo) { $("#f_err").classList.remove("hidden"); $("#f_hoTen").focus(); return; }
    const posId = $("#f_posId").value;
    const isNew = !M.editId;
    if (isNew) {
      const dup = Store.candidates.find(c => (maHoSo && str(c.maHoSo).toLowerCase() === maHoSo.toLowerCase())
        || (hoTen && str(c.hoTen).toLowerCase() === hoTen.toLowerCase() && String(c.posId) === String(posId)));
      if (dup && !confirm(`Có vẻ đã có ứng viên trùng: "${candName(dup)}" (${posName(dup.posId)}).\n\nVẫn thêm mới?`)) return;
    }
    const data = { hoTen, maHoSo, posId, nguon: M.nguon || "", taPhuTrach: M.ta || getUser() };
    if (isNew) {
      data.candId = genId("C");
      data.trangThai = "Mới";
      data.ghiChu = str($("#f_ghiChu").value);
      data.chiTiet = { lichSu: [{ t: new Date().toISOString(), tu: "", den: "Mới", by: getUser(), note: "Thêm ứng viên" }] };
    } else data.candId = M.editId;
    const onSaved = M.onSaved;
    Store.save({ action: "saveCandidate", candidate: data });
    closeModal();
    toast(isNew ? "Đã thêm ứng viên ✓" : "Đã lưu thay đổi ✓");
    if (onSaved) onSaved(data.candId);
    else go("#/candidate/" + encodeURIComponent(data.candId));
  },

  saveNote: (el) => {
    const c = findCand(el.dataset.id); if (!c) return;
    const val = $("#noteInput").value;
    Store.save({ action: "saveCandidate", candidate: { candId: c.candId, ghiChu: val } });
    toast("Đã lưu ghi chú ✓");
  },
  deleteCandidate: (el) => {
    const c = findCand(el.dataset.id); if (!c) return;
    if (!confirm(`Xoá hẳn "${candName(c)}" khỏi Google Sheet?\n\nKhông khôi phục được. Nếu chỉ là không phù hợp, nên chuyển sang "Loại" thay vì xoá.`)) return;
    Store.save({ action: "deleteCandidate", candId: c.candId });
    toast("Đã xoá ứng viên");
    go("#/candidates");
  },

  filterStage: (el) => { UI.filters.stage = el.dataset.val; render(); },
  clearFilters: (el, ev) => { ev.preventDefault(); UI.filters = { q: "", posId: "", stage: "", ta: "" }; render(); },

  nextStage: (el) => changeStage(el.dataset.id, el.dataset.val),
  openStage: (el) => openStageModal(el.dataset.id),
  pickStage: (el) => {
    const id = M.candId, s = el.dataset.val, note = str($("#stageNote").value);
    const c = findCand(id);
    if (c && stageOf(c) === s) { toast("Ứng viên đã ở trạng thái này rồi"); return; }
    closeModal();
    changeStage(id, s, note);
    if (s === "Loại") setTimeout(() => openReject(id), 250);
    if (s === "Chuyển HM") setTimeout(() => openHM(id), 250);
  },

  openHM: (el) => openHM(el.dataset.id),
  copyFrom: (el) => copyText($("#" + el.dataset.src).value),
  copyHMAndMove: () => {
    copyText($("#hmText").value);
    const id = M.candId;
    closeModal();
    changeStage(id, "Chuyển HM", "Đã gửi tóm tắt cho HM");
  },

  openPool: (el) => openPool(el.dataset.id),
  toggleReason: (el) => {
    el.classList.toggle("on");
    const r = el.dataset.val;
    M.reasons = el.classList.contains("on") ? [...M.reasons, r] : M.reasons.filter(x => x !== r);
  },
  confirmPool: () => {
    const id = M.candId;
    const note = [...M.reasons, str($("#poolNote").value)].filter(Boolean).join("; ");
    const c = findCand(id);
    if (c && note) {
      const ghiChu = [str(c.ghiChu), `[Talent Pool] ${note}`].filter(Boolean).join("\n");
      Store.save({ action: "saveCandidate", candidate: { candId: id, ghiChu } });
    }
    closeModal();
    if (c && stageOf(c) !== "Talent Pool") changeStage(id, "Talent Pool", note);
    setTimeout(() => openReject(id, "keep"), 250);
  },

  openReject: (el) => openReject(el.dataset.id),
  pickReject: (el) => {
    const g = el.dataset.group;
    M[g] = el.dataset.val;
    $$(`[data-act="pickReject"][data-group="${g}"]`).forEach(b => b.classList.toggle("on", b === el));
    const c = findCand(M.candId); if (!c) return;
    $("#rejectText").value = rejectText(c, M.type, M.reason);
    $("#rejectBtns").innerHTML = rejectButtons(c, M.type);
  },
  copyRejectAndMove: (el) => {
    copyText($("#rejectText").value);
    const id = M.candId, target = el.dataset.val;
    const reason = M.reason && !M.reason.startsWith("(") ? M.reason : "";
    closeModal();
    changeStage(id, target, "Đã gửi tin nhắn" + (reason ? ": " + reason : ""));
  }
};

document.addEventListener("click", (ev) => {
  const pop = $("#pop");
  const el = ev.target.closest("[data-act]");
  if (!pop.hidden && !(el && el.dataset.act === "tip")) pop.hidden = true;
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (!fn) return;
  if (el.tagName === "A" && el.dataset.act !== "newCandidate" && el.dataset.act !== "clearFilters") ev.preventDefault();
  fn(el, ev);
});

document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.filter) { UI.filters[el.dataset.filter] = el.value; if (el.dataset.filter === "q") render(); }
});
document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.filter && el.tagName === "SELECT") { UI.filters[el.dataset.filter] = el.value; render(); }
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") { $("#pop").hidden = true; closeModal(); }
  if (ev.key === "Enter" && ev.target.id === "userCustom") ACTIONS.confirmUser();
});
window.addEventListener("scroll", () => { $("#pop").hidden = true; }, { passive: true });
window.addEventListener("hashchange", render);

/* ---------------- KHỞI ĐỘNG ---------------- */
Store.onChange(() => render());
Store.onStatus(() => { renderSavePill(); renderBanner(); });

// Tự tải lại khi quay lại app (thấy thay đổi của đồng đội)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && isConnected()) {
    const last = Store.state.lastSync ? new Date(Store.state.lastSync).getTime() : 0;
    if (Date.now() - last > 30000) { if (Store.state.outbox.length) Store.flush(); else Store.refresh(); }
  }
});

// Khởi động sau khi mọi file js (kể cả tools.js) đã tải xong
document.addEventListener("DOMContentLoaded", function boot() {
  render();
  renderSavePill();
  if (!getUser()) openLogin();
  if (!isConnected()) Store.setStatus("local");
  else if (Store.state.outbox.length) Store.flush();
  else Store.refresh();
});
