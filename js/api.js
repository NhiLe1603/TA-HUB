/* =============================================================
 * ATINO TA HUB — LỚP DỮ LIỆU (API + cache + hàng chờ lưu)
 * ============================================================= */

// ⬇⬇⬇ DÁN URL WEB APP (kết thúc bằng /exec) VÀO GIỮA 2 DẤU NHÁY ⬇⬇⬇
const API_URL = "https://script.google.com/macros/s/AKfycbyDvILbB0puQpFPN4n8GOkF36v5gGS_Sw3pJ3cMF1AI9ZG3sWCd3PNqQjBA6CACpzZiOw/exec";
// ⬆⬆⬆ Ví dụ: "https://script.google.com/macros/s/AKfy.../exec"  ⬆⬆⬆
// (Để trống = "chế độ thử": dữ liệu chỉ lưu trên máy này, chưa về Google Sheet.)

const LS_KEYS = {
  cache: "atino_cache_v1",     // bản sao dữ liệu gần nhất (phòng mất mạng)
  outbox: "atino_outbox_v1",   // các thay đổi chưa gửi được lên Sheet
  user: "atino_user",          // tên TA đang dùng máy này
  apiOverride: "atino_api_url" // URL dán trong phần Cài đặt (nếu không sửa code)
};

/* ---------- localStorage an toàn (không bao giờ làm sập app) ---------- */
const LocalDB = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* bỏ qua */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* bỏ qua */ }
  }
};

function getApiUrl() {
  const override = LocalDB.get(LS_KEYS.apiOverride, "");
  return String(override || API_URL || "").trim();
}
function isConnected() { return /^https:\/\/script\.google(usercontent)?\.com\//.test(getApiUrl()); }

/** Tự sinh id phía máy: 'C' cho ứng viên, 'P' cho vị trí */
function genId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

class ServerError extends Error {}

/* ---------- GỌI API THÔ ---------- */

/** ĐỌC: GET ?action=...  → trả object JSON {ok, ...} */
async function apiGet(action, params = {}) {
  const url = new URL(getApiUrl());
  url.searchParams.set("action", action);
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== "") url.searchParams.set(k, params[k]);
  });
  url.searchParams.set("_", Date.now()); // tránh cache trình duyệt
  const res = await fetch(url.toString(), { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error("Máy chủ trả lỗi " + res.status);
  const json = await res.json();
  if (!json.ok) throw new ServerError(json.error || "Máy chủ báo lỗi");
  return json;
}

/** GHI: POST text/plain (simple request, không bị chặn CORS preflight) */
async function apiPost(body) {
  try {
    const res = await fetch(getApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow"
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* không đọc được phản hồi cũng không sao */ }
    if (json && json.ok === false) throw new ServerError(json.error || "Máy chủ báo lỗi");
    return true;
  } catch (err) {
    if (err instanceof ServerError) throw err;
    // Có thể đã ghi thành công nhưng trình duyệt không đọc được phản hồi → kiểm tra lại bằng GET
    if (await verifyWrite(body)) return true;
    throw err;
  }
}

/** Kiểm tra bằng GET xem lệnh ghi đã vào Sheet chưa */
async function verifyWrite(body) {
  try {
    if (body.action === "saveCandidate" || body.action === "updateStage") {
      const sent = body.candidate || { candId: body.candId, trangThai: body.trangThai };
      const r = await apiGet("getCandidate", { candId: sent.candId });
      return sameFields(sent, r.data);
    }
    if (body.action === "savePosition") {
      const r = await apiGet("getPosition", { posId: body.position.posId });
      return sameFields(body.position, r.data);
    }
    if (body.action === "deleteCandidate") {
      const r = await apiGet("getCandidate", { candId: body.candId });
      return !r.data;
    }
    if (body.action === "deletePosition") {
      const r = await apiGet("getPosition", { posId: body.posId });
      return !r.data;
    }
  } catch (e) { /* mạng vẫn lỗi */ }
  return false;
}
function sameFields(sent, onServer) {
  if (!onServer) return false;
  return Object.keys(sent).every(k => {
    const a = sent[k], b = onServer[k];
    if (a && typeof a === "object") return JSON.stringify(a) === JSON.stringify(b);
    return String(a ?? "") === String(b ?? "");
  });
}

/* =============================================================
 * STORE — dữ liệu dùng trong app
 *  - Ghi: cập nhật ngay trên màn hình (optimistic) → lưu cache → gửi lên Sheet
 *  - Lỗi mạng: thay đổi nằm trong "hàng chờ" (outbox), bấm Thử lại để gửi tiếp
 *  - Sau khi gửi xong: tải lại toàn bộ từ Sheet (thấy cả thay đổi của đồng đội)
 * ============================================================= */
const Store = (() => {
  const cached = LocalDB.get(LS_KEYS.cache, null);
  const state = {
    positions: cached ? cached.positions || [] : [],
    candidates: cached ? cached.candidates || [] : [],
    logs: cached ? cached.logs || [] : [],
    logsSupported: cached ? cached.logsSupported : undefined, // false = backend cũ chưa có tab Logs
    lastSync: cached ? cached.lastSync || null : null,
    hasData: !!cached,
    outbox: LocalDB.get(LS_KEYS.outbox, []),
    status: "idle",       // idle | loading | saving | saved | error | local
    statusMsg: ""
  };
  const changeListeners = [];
  const statusListeners = [];
  let flushing = null;

  function emitChange() { changeListeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  function setStatus(status, msg = "") {
    state.status = status; state.statusMsg = msg;
    statusListeners.forEach(f => { try { f(status, msg); } catch (e) { console.error(e); } });
  }
  function persist() {
    LocalDB.set(LS_KEYS.cache, { positions: state.positions, candidates: state.candidates, logs: state.logs.slice(0, 500), logsSupported: state.logsSupported, lastSync: state.lastSync });
    LocalDB.set(LS_KEYS.outbox, state.outbox);
  }

  /** Áp 1 lệnh ghi lên dữ liệu trên máy (giống logic MERGE của Code.gs) */
  function applyLocal(body) {
    const now = new Date().toISOString();
    const upsert = (list, idKey, incoming) => {
      const i = list.findIndex(x => String(x[idKey]) === String(incoming[idKey]));
      if (i >= 0) list[i] = Object.assign({}, list[i], incoming, { ngayCapNhat: now });
      else list.push(Object.assign({ ngayTao: now }, incoming, { ngayCapNhat: now }));
    };
    switch (body.action) {
      case "saveCandidate": upsert(state.candidates, "candId", body.candidate); break;
      case "updateStage": upsert(state.candidates, "candId", { candId: body.candId, trangThai: body.trangThai }); break;
      case "savePosition": upsert(state.positions, "posId", body.position); break;
      case "deleteCandidate": state.candidates = state.candidates.filter(c => String(c.candId) !== String(body.candId)); break;
      case "deletePosition": state.positions = state.positions.filter(p => String(p.posId) !== String(body.posId)); break;
    }
    if (body.log && !state.logs.some(l => l.logId === body.log.logId)) state.logs.unshift(Object.assign({ thoiGian: now }, body.log));
  }

  /** Tải toàn bộ dữ liệu từ Sheet */
  async function refresh() {
    if (!isConnected()) { setStatus("local"); return false; }
    if (state.status !== "saving") setStatus("loading");
    try {
      const json = await apiGet("all");
      state.positions = json.positions || [];
      state.candidates = json.candidates || [];
      state.logsSupported = Array.isArray(json.logs);
      if (state.logsSupported) state.logs = json.logs;
      state.outbox.forEach(item => applyLocal(item.body)); // giữ các thay đổi chưa gửi
      state.lastSync = new Date().toISOString();
      state.hasData = true;
      persist();
      emitChange();
      if (state.outbox.length) setStatus("error", "Còn " + state.outbox.length + " thay đổi chưa lưu");
      else setStatus("saved");
      return true;
    } catch (err) {
      setStatus("error", "Không tải được dữ liệu — đang xem bản lưu trên máy");
      console.warn(err);
      return false;
    }
  }

  /** Gửi lần lượt các thay đổi trong hàng chờ lên Sheet */
  async function flush() {
    if (!isConnected()) { setStatus("local"); return true; }
    if (flushing) return flushing;
    flushing = (async () => {
      setStatus("saving");
      while (state.outbox.length) {
        const item = state.outbox[0];
        try {
          await apiPost(item.body);
          state.outbox.shift();
          persist();
        } catch (err) {
          if (err instanceof ServerError) {
            // Máy chủ từ chối hẳn → bỏ lệnh này để không kẹt hàng chờ
            state.outbox.shift();
            persist();
            setStatus("error", "Máy chủ báo lỗi: " + err.message);
            continue;
          }
          setStatus("error", "Mất mạng — chưa lưu được. Dữ liệu vẫn giữ trên máy.");
          return false;
        }
      }
      await refresh();
      return true;
    })();
    try { return await flushing; } finally { flushing = null; }
  }

  /** Lưu 1 thay đổi: hiện ngay + gửi lên Sheet */
  function save(body) {
    // Tự ghi nhật ký: mô tả thao tác dựa trên dữ liệu TRƯỚC khi thay đổi
    if (!body.log && typeof api.describe === "function") {
      try { body.log = api.describe(body) || undefined; } catch (e) { console.warn(e); }
    }
    applyLocal(body);
    state.hasData = true;
    if (isConnected()) state.outbox.push({ id: genId("Q"), body, ts: Date.now() });
    persist();
    emitChange();
    if (!isConnected()) { setStatus("local"); return Promise.resolve(true); }
    return flush();
  }

  function exportJSON() {
    return {
      exportedAt: new Date().toISOString(),
      positions: state.positions,
      candidates: state.candidates,
      chuaLuuLenSheet: state.outbox.map(x => x.body)
    };
  }

  const api = {
    state,
    get positions() { return state.positions; },
    get candidates() { return state.candidates; },
    get logs() { return state.logs; },
    describe: null, // gán ở js/activity.js
    onChange(f) { changeListeners.push(f); },
    onStatus(f) { statusListeners.push(f); },
    setStatus, refresh, flush, save, exportJSON
  };
  return api;
})();
