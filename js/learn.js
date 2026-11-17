/* =============================================================
 * ATINO TA HUB — PHA 4: HỌC (bài + quiz) · HƯỚNG DẪN LUỒNG · PHÁP LÝ CHUNG · TIỆN ÍCH
 * ============================================================= */
"use strict";

const LEARN_KEY = "atino_learn_v1";
const UI4 = { open: null };
const quizState = () => LocalDB.get(LEARN_KEY, {});
function lessonProgress(l) {
  const s = quizState()[l.id] || {};
  const answered = l.quiz.filter((_, i) => s[i] !== undefined).length;
  const correct = l.quiz.filter((q, i) => s[i] === q.a).length;
  return { answered, correct, done: answered === l.quiz.length };
}

/* ---------------- MÀN HỌC ---------------- */
function viewLearn() {
  const doneCount = LEARN.filter(l => lessonProgress(l).done).length;
  let html = pageHead("📘 Học", "ôn kiến thức tuyển dụng theo <b>6 bước</b>. Mỗi bài ~3 phút: vì sao cần → câu cần nhớ → ý chính → ví dụ → 3 câu đố. Học xong bấm <b>“Làm ngay”</b> để thực hành.");

  html += `<div class="card"><p>${LEARN_INTRO}</p>
    <div class="facts">${ATINO_FACTS.map(f => `<div><b>${esc(f.so)}</b><span>${esc(f.t)}</span></div>`).join("")}</div>
    <div class="learn-progress"><span>Đã hoàn thành <b>${doneCount}/${LEARN.length}</b> bài</span>
      <span class="bar"><i style="width:${(doneCount / LEARN.length) * 100}%"></i></span></div></div>`;

  html += LEARN.map((l, i) => lessonHtml(l, i)).join("");

  const tips = Object.values(TIPS);
  html += `<details class="card"><summary><b>📖 Từ điển nhanh</b> <span class="muted small">(${tips.length} thuật ngữ)</span></summary>
    <div class="glossary">${tips.map(t => `<div>${t}</div>`).join("")}</div></details>`;
  return html;
}
function lessonHtml(l, i) {
  const p = lessonProgress(l);
  const open = UI4.open === l.id;
  const badge = p.done
    ? `<span class="badge" style="--c:var(--ok)">✓ ${p.correct}/${l.quiz.length} đúng</span>`
    : p.answered ? `<span class="badge" style="--c:var(--warn)">${p.answered}/${l.quiz.length} câu</span>` : "";
  let html = `<div class="card lesson ${open ? "open" : ""}" id="lesson-${l.id}">
    <button class="lesson-head" data-act="lessonToggle" data-id="${l.id}" type="button" aria-expanded="${open}">
      <span class="lesson-ico">${l.ico}</span>
      <span class="lesson-title"><span class="muted small">Bước ${i + 1}</span><b>${esc(l.ten)}</b></span>
      <span class="lesson-meta">${badge}<span class="chev">${open ? "▴" : "▾"}</span></span></button>`;
  if (!open) return html + `</div>`;
  const s = quizState()[l.id] || {};
  html += `<div class="lesson-body">
    <div class="ls why"><div class="ls-h">🤔 Vì sao cần</div><p>${l.viSao}</p></div>
    <div class="ls remember"><div class="ls-h">📌 Câu cần nhớ</div><p class="big-quote">“${esc(l.nho)}”</p></div>
    <div class="ls"><div class="ls-h">💡 Ý chính</div><ul class="tight">${l.y.map(x => `<li>${x}</li>`).join("")}</ul></div>
    <div class="ls example"><div class="ls-h">🧪 Ví dụ</div><p>${l.viDu}</p></div>
    <div class="ls"><div class="ls-h">✅ Đố nhanh (${l.quiz.length} câu)</div>
      ${l.quiz.map((q, qi) => {
        const ans = s[qi];
        const answered = ans !== undefined;
        return `<div class="quiz"><div class="quiz-q">${qi + 1}. ${esc(q.q)}</div>
          <div class="quiz-opts">${q.o.map((o, oi) => {
            const cls = !answered ? "" : oi === q.a ? "right" : oi === ans ? "wrong" : "dim";
            return `<button class="quiz-opt ${cls}" data-act="quizAnswer" data-l="${l.id}" data-q="${qi}" data-o="${oi}" type="button" ${answered ? "disabled" : ""}>${answered && oi === q.a ? "✓ " : answered && oi === ans ? "✕ " : ""}${esc(o)}</button>`;
          }).join("")}</div>
          ${answered ? `<div class="quiz-exp ${ans === q.a ? "ok" : "bad"}">${ans === q.a ? "🎉 Đúng rồi!" : "Chưa đúng."} ${esc(q.g)}</div>` : ""}</div>`;
      }).join("")}
      ${p.answered ? `<button class="btn sm ghost" data-act="quizReset" data-l="${l.id}" type="button">↺ Làm lại câu đố</button>` : ""}</div>
    <div class="btn-row"><a class="btn primary" href="${l.link}">👉 Làm ngay: ${esc(l.linkLabel)}</a>
      ${i < LEARN.length - 1 ? `<button class="btn" data-act="lessonToggle" data-id="${LEARN[i + 1].id}" type="button">Bài tiếp →</button>` : ""}</div>
  </div></div>`;
  return html;
}

/* ---------------- HƯỚNG DẪN LUỒNG (Trang chủ) ---------------- */
function flowSteps() {
  const P = Store.positions, C = Store.candidates;
  const posWithSC = P.find(hasScorecard);
  const q = posWithSC ? "?pos=" + encodeURIComponent(posWithSC.posId) : "";
  return [
    { t: "Tạo vị trí + phiếu điểm", d: "Chân dung ứng viên, loại cứng, tiêu chí CWC", done: !!posWithSC, href: P.length ? "#/positions" : "#/position/new", learn: "b1" },
    { t: "Viết tin đăng", d: "AIDA, ra 3 bản để đăng", done: P.some(p => !!p.jd), href: "#/tools/jd" + q, learn: "b2" },
    { t: "Lập kế hoạch nguồn", d: "Chọn kênh, đặt mục tiêu CV/tuần", done: P.some(p => (asObj(p.nguon).kenh || []).length), href: "#/tools/nguon" + q, learn: "b3" },
    { t: "Thêm ứng viên", d: "Chỉ cần tên hoặc mã hồ sơ", done: C.length > 0, href: "#/candidates", act: "newCandidate", learn: "b6" },
    { t: "Lọc CV", d: "Chấm theo phiếu điểm, có AI đối chiếu", done: C.some(c => toNum(c.diemCV) !== null), href: "#/tools/loc-cv", learn: "b4" },
    { t: "Sơ vấn", d: "Gọi sơ bộ 6 phần, ghi bằng chứng STAR", done: C.some(c => toNum(c.diemSoVan) !== null), href: "#/tools/so-van", learn: "b5" },
    { t: "Chuyển HM", d: "So sánh, gửi tóm tắt có bằng chứng", done: C.some(c => MAIN_STAGES.indexOf(stageOf(c)) >= 3), href: "#/tools/so-sanh" + q, learn: "b6" }
  ];
}
function onboardingCard() {
  const steps = flowSteps();
  const done = steps.filter(s => s.done).length;
  const next = steps.findIndex(s => !s.done);
  const body = `<ol class="flow">${steps.map((s, i) => `<li class="${s.done ? "done" : i === next ? "next" : ""}">
      <span class="flow-dot">${s.done ? "✓" : i + 1}</span>
      <span class="flow-txt"><b>${esc(s.t)}</b><span class="small muted">${esc(s.d)}</span>
        ${i === next ? `<span class="btn-row" style="margin-top:8px"><a class="btn sm primary" href="${s.href}" ${s.act ? `data-act="${s.act}"` : ""}>Làm bước này →</a>
          <a class="btn sm" href="#/learn" data-act="openLesson" data-id="${s.learn}">📘 Học trước 3 phút</a></span>` : ""}</span></li>`).join("")}</ol>`;
  if (next < 0) return `<details class="card"><summary><b>🎉 Bạn đã đi trọn luồng tuyển dụng</b> <span class="muted small">(xem lại các bước)</span></summary>${body}</details>`;
  return `<div class="card"><div class="card-head"><h2>🧭 Bắt đầu từ đâu?</h2><span class="muted small">${done}/${steps.length} bước</span></div>
    <p class="small muted" style="margin-bottom:10px">Làm lần lượt từ trên xuống. Bước đang sáng là việc nên làm tiếp.</p>${body}</div>`;
}

/* ---------------- TIỆN ÍCH CHUNG ---------------- */
/** Ô chặn pháp lý cho các ô nhập thường (không gắn bản nháp) */
function legalSlot(id, value) { return `<div id="${id}-legal">${legalHtml(value || "")}</div>`; }
function backupBtn() { return `<button class="btn sm ghost" data-act="downloadJSON" type="button" title="Tải toàn bộ dữ liệu về máy phòng khi mất mạng">⬇ Tải JSON dự phòng</button>`; }

Object.assign(ACTIONS, {
  lessonToggle: (el) => {
    UI4.open = UI4.open === el.dataset.id ? null : el.dataset.id;
    render();
    if (UI4.open) { const c = $("#lesson-" + UI4.open); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); }
  },
  openLesson: (el, ev) => { ev.preventDefault(); UI4.open = el.dataset.id; go("#/learn"); setTimeout(() => { const c = $("#lesson-" + UI4.open); if (c) c.scrollIntoView({ block: "start" }); }, 50); },
  quizAnswer: (el) => {
    const st = quizState();
    const l = el.dataset.l;
    st[l] = st[l] || {};
    if (st[l][el.dataset.q] !== undefined) return;
    st[l][el.dataset.q] = +el.dataset.o;
    LocalDB.set(LEARN_KEY, st);
    render();
    const lesson = LEARN.find(x => x.id === l);
    const p = lessonProgress(lesson);
    if (p.done) toast(p.correct === lesson.quiz.length ? "🎉 Đúng hết! Giỏi quá" : `Xong bài: đúng ${p.correct}/${lesson.quiz.length}`);
  },
  quizReset: (el) => { const st = quizState(); delete st[el.dataset.l]; LocalDB.set(LEARN_KEY, st); render(); }
});

document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.legalCheck !== undefined && el.id) {
    const slot = document.getElementById(el.id + "-legal");
    if (slot) slot.innerHTML = legalHtml(el.value);
  }
});
