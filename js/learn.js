/* =============================================================
 * ATINO TA HUB — HỌC (E-LEARNING 8 MODULE) · TIỆN ÍCH CHUNG
 * Mỗi module: 📑 Bài giảng (tài liệu + bài đọc + câu đố) · 🤖 Bộ skill AI · 🗺️ Sơ đồ SOP
 * Tiến độ câu đố lưu RIÊNG theo tên người dùng.
 * ============================================================= */
"use strict";

const UI4 = { open: null, tab: "bai" };
const learnKey = () => "atino_learn_v1_" + userSlug();
const quizState = () => LocalDB.get(learnKey(), {});
const lessonById = id => LEARN.find(l => l.id === id);
function lessonProgress(l) {
  const s = quizState()[l.id] || {};
  const answered = l.quiz.filter((_, i) => s[i] !== undefined).length;
  const correct = l.quiz.filter((q, i) => s[i] === q.a).length;
  return { answered, correct, done: answered === l.quiz.length };
}
function moduleProgress(m) {
  const mc = MODULE_CONTENT[m.so] || {};
  const l = mc.lesson ? lessonById(mc.lesson) : null;
  return l ? Object.assign({ has: true }, lessonProgress(l), { total: l.quiz.length }) : { has: false };
}

/* ---------------- MÀN HỌC ---------------- */
function viewLearn() {
  const withLesson = MODULES.filter(m => moduleProgress(m).has);
  const done = withLesson.filter(m => moduleProgress(m).done).length;
  let html = pageHead("📘 Học · E-learning", "học theo <b>8 module</b> của chương trình đào tạo TA. Mỗi module có <b>bài giảng</b>, <b>bộ skill cho AI</b> và <b>sơ đồ SOP</b>. Tài liệu sẽ được bổ sung dần.");
  html += `<div class="card"><p>${LEARN_INTRO}</p>
    <div class="facts">${ATINO_FACTS.map(f => `<div><b>${esc(f.so)}</b><span>${esc(f.t)}</span></div>`).join("")}</div>
    <div class="learn-progress"><span><b>${esc(getUser() || "Bạn")}</b> đã xong <b>${done}/${withLesson.length}</b> bài</span>
      <span class="bar"><i style="width:${withLesson.length ? (done / withLesson.length) * 100 : 0}%"></i></span></div></div>`;
  html += MODULES.map(moduleCardHtml).join("");
  const tips = Object.values(TIPS);
  html += `<details class="card"><summary><b>📖 Từ điển nhanh</b> <span class="muted small">(${tips.length} thuật ngữ)</span></summary>
    <div class="glossary">${tips.map(t => `<div>${t}</div>`).join("")}</div></details>`;
  return html;
}

function moduleCardHtml(m) {
  const id = "m" + m.so;
  const mc = MODULE_CONTENT[m.so] || {};
  const pr = moduleProgress(m);
  const open = UI4.open === id;
  const empty = !pr.has && !(mc.taiLieu || []).length && !(mc.skills || []).length && !(mc.sop || []).length;
  const badge = empty ? `<span class="badge">Đang cập nhật</span>`
    : pr.done ? `<span class="badge" style="--c:var(--ok)">✓ ${pr.correct}/${pr.total} đúng</span>`
    : pr.answered ? `<span class="badge" style="--c:var(--warn)">${pr.answered}/${pr.total} câu</span>` : "";
  let html = `<div class="card lesson ${open ? "open" : ""}" id="lesson-${id}">
    <button class="lesson-head" data-act="lessonToggle" data-id="${id}" type="button" aria-expanded="${open}">
      <span class="mnum big">${m.so}</span>
      <span class="lesson-title"><span class="muted small">Module ${m.so}</span><b>${esc(m.ten)}</b></span>
      <span class="lesson-meta">${badge}<span class="chev">${open ? "▴" : "▾"}</span></span></button>`;
  if (!open) return html + `</div>`;
  const tabs = [["bai", "📑 Bài giảng"], ["skill", `🤖 Skill AI${(mc.skills || []).length ? " (" + mc.skills.length + ")" : ""}`], ["sop", "🗺️ Sơ đồ SOP"]];
  html += `<div class="lesson-body"><div class="chips scroll">${tabs.map(([k, t]) => `<button class="chip ${UI4.tab === k ? "on" : ""}" data-act="learnTab" data-val="${k}" type="button">${t}</button>`).join("")}</div>`;
  if (UI4.tab === "skill") html += skillsHtml(mc);
  else if (UI4.tab === "sop") html += sopHtml(mc);
  else html += lectureHtml(m, mc);
  const i = MODULES.indexOf(m);
  html += `<div class="btn-row">${practiceBtn(m)}${i < MODULES.length - 1 ? `<button class="btn" data-act="lessonToggle" data-id="m${MODULES[i + 1].so}" type="button">Module ${MODULES[i + 1].so} →</button>` : ""}</div>`;
  return html + `</div></div>`;
}
function practiceBtn(m) {
  const f = m.features.find(x => isOpen(x.f) && x.href);
  return f ? `<a class="btn primary" href="${f.href}">👉 Thực hành: ${esc(FEATURES[f.f].t)}</a>`
    : `<span class="btn" data-act="lockedFeature" data-f="${m.features[0].f}">🔒 Công cụ thực hành sẽ mở sau</span>`;
}
function docsHtml(mc) {
  const docs = mc.taiLieu || [];
  return `<div class="ls"><div class="ls-h">📂 Tài liệu bài giảng</div>${docs.length
    ? `<div class="docs">${docs.map(d => `<a class="doc" href="${esc(d.url)}" target="_blank" rel="noopener"><span>${DOC_ICON[d.loai] || "📄"}</span><span>${esc(d.ten)}</span><span class="go">↗</span></a>`).join("")}</div>`
    : `<p class="small muted">Slide / tài liệu bài giảng của module này <b>sẽ được cập nhật</b>.</p>`}</div>`;
}
function lectureHtml(m, mc) {
  let html = docsHtml(mc);
  const l = mc.lesson ? lessonById(mc.lesson) : null;
  if (!l) return html + `<div class="ls"><p class="small muted">Nội dung bài giảng module này đang được biên soạn.</p></div>`;
  const s = quizState()[l.id] || {};
  const p = lessonProgress(l);
  html += `<div class="ls why"><div class="ls-h">🤔 Vì sao cần</div><p>${l.viSao}</p></div>
    <div class="ls remember"><div class="ls-h">📌 Câu cần nhớ</div><p class="big-quote">“${esc(l.nho)}”</p></div>
    <div class="ls"><div class="ls-h">💡 Ý chính</div><ul class="tight">${l.y.map(x => `<li>${x}</li>`).join("")}</ul></div>
    <div class="ls example"><div class="ls-h">🧪 Ví dụ</div><p>${l.viDu}</p></div>
    <div class="ls"><div class="ls-h">✅ Đố nhanh (${l.quiz.length} câu)</div>
      ${l.quiz.map((q, qi) => {
        const ans = s[qi], answered = ans !== undefined;
        return `<div class="quiz"><div class="quiz-q">${qi + 1}. ${esc(q.q)}</div>
          <div class="quiz-opts">${q.o.map((o, oi) => {
            const cls = !answered ? "" : oi === q.a ? "right" : oi === ans ? "wrong" : "dim";
            return `<button class="quiz-opt ${cls}" data-act="quizAnswer" data-l="${l.id}" data-q="${qi}" data-o="${oi}" type="button" ${answered ? "disabled" : ""}>${answered && oi === q.a ? "✓ " : answered && oi === ans ? "✕ " : ""}${esc(o)}</button>`;
          }).join("")}</div>
          ${answered ? `<div class="quiz-exp ${ans === q.a ? "ok" : "bad"}">${ans === q.a ? "🎉 Đúng rồi!" : "Chưa đúng."} ${esc(q.g)}</div>` : ""}</div>`;
      }).join("")}
      ${p.answered ? `<button class="btn sm ghost" data-act="quizReset" data-l="${l.id}" type="button">↺ Làm lại câu đố</button>` : ""}</div>`;
  return html;
}
function skillsHtml(mc) {
  const sk = mc.skills || [];
  if (!sk.length) return `<div class="ls"><p class="small muted">Bộ skill cho AI của module này <b>đang được chuẩn bị</b>.</p></div>`;
  return `<p class="small muted">Copy prompt → dán vào <b>ChatGPT</b> hoặc <b>Claude</b> → điền chỗ [trong ngoặc]. Trong công cụ của app, prompt được điền sẵn thông tin vị trí.</p>
    ${sk.map((s, i) => `<div class="skill"><div><b>🤖 ${esc(s.ten)}</b><div class="small muted">${esc(s.moTa || "")}</div></div>
      <div class="btn-row" style="margin-top:8px">${s.prompt ? `<button class="btn sm primary" data-act="copySkill" data-i="${i}" type="button">📋 Copy prompt</button>` : ""}
        ${s.url ? `<a class="btn sm" href="${esc(s.url)}" target="_blank" rel="noopener">⬇ Tải skill</a>` : ""}</div>
      ${s.prompt ? `<details class="neo"><summary>Xem prompt</summary><pre class="post">${esc(s.prompt())}</pre></details>` : ""}</div>`).join("")}`;
}
function sopHtml(mc) {
  const steps = mc.sop || [];
  if (!steps.length) return `<div class="ls"><p class="small muted">Sơ đồ SOP của module này <b>sẽ được cập nhật</b>.</p></div>`;
  return `<div class="sop">${steps.map((s, i) => `<div class="sop-step"><span class="sop-n">${i + 1}</span><span>${esc(s)}</span></div>${i < steps.length - 1 ? `<div class="sop-arrow">↓</div>` : ""}`).join("")}</div>`;
}

/** Thẻ nhỏ ở Trang chủ: tiến độ học của riêng bạn */
function learnProgressCard() {
  const withLesson = MODULES.filter(m => moduleProgress(m).has);
  const done = withLesson.filter(m => moduleProgress(m).done).length;
  const next = withLesson.find(m => !moduleProgress(m).done);
  return `<div class="card"><div class="card-head"><h2>📘 Học của bạn</h2><span class="muted small">${done}/${withLesson.length} bài</span></div>
    <div class="learn-progress" style="grid-template-columns:1fr"><span class="bar"><i style="width:${withLesson.length ? (done / withLesson.length) * 100 : 0}%"></i></span></div>
    ${next ? `<a class="btn sm" style="margin-top:10px" href="#/learn" data-act="openLesson" data-id="m${next.so}">Học tiếp: Module ${next.so} · ${esc(next.ngan)} →</a>` : `<p class="small verdict ok" style="margin-top:8px">🎉 Bạn đã học xong các bài hiện có.</p>`}</div>`;
}

/* ---------------- TIỆN ÍCH CHUNG ---------------- */
/** Ô chặn pháp lý cho các ô nhập thường (không gắn bản nháp) */
function legalSlot(id, value) { return `<div id="${id}-legal">${legalHtml(value || "")}</div>`; }
function backupBtn() { return `<button class="btn sm ghost" data-act="downloadJSON" type="button" title="Tải toàn bộ dữ liệu về máy phòng khi mất mạng">⬇ Tải JSON dự phòng</button>`; }

Object.assign(ACTIONS, {
  lessonToggle: (el) => {
    UI4.open = UI4.open === el.dataset.id ? null : el.dataset.id;
    UI4.tab = "bai";
    render();
    if (UI4.open) { const c = $("#lesson-" + UI4.open); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); }
  },
  learnTab: (el) => { UI4.tab = el.dataset.val; render(); },
  openLesson: (el, ev) => {
    if (ev) ev.preventDefault();
    UI4.open = el.dataset.id; UI4.tab = "bai";
    go("#/learn");
    setTimeout(() => { const c = $("#lesson-" + UI4.open); if (c) c.scrollIntoView({ block: "start" }); }, 60);
  },
  copySkill: (el) => {
    const mc = MODULE_CONTENT[+String(UI4.open).slice(1)] || {};
    const s = (mc.skills || [])[+el.dataset.i];
    if (s && s.prompt) copyText(s.prompt());
  },
  quizAnswer: (el) => {
    const st = quizState();
    const l = el.dataset.l;
    st[l] = st[l] || {};
    if (st[l][el.dataset.q] !== undefined) return;
    st[l][el.dataset.q] = +el.dataset.o;
    LocalDB.set(learnKey(), st);
    render();
    const lesson = lessonById(l);
    const p = lessonProgress(lesson);
    if (p.done) toast(p.correct === lesson.quiz.length ? "🎉 Đúng hết! Giỏi quá" : `Xong bài: đúng ${p.correct}/${lesson.quiz.length}`);
  },
  quizReset: (el) => { const st = quizState(); delete st[el.dataset.l]; LocalDB.set(learnKey(), st); render(); }
});

document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.legalCheck !== undefined && el.id) {
    const slot = document.getElementById(el.id + "-legal");
    if (slot) slot.innerHTML = legalHtml(el.value);
  }
});
