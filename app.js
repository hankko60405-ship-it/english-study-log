/* 英文進程：單字（扇貝式）＋機考閱讀（雅思哥式）＋錯題本（刷題式）＋AI 助理 */
(() => {
'use strict';

// ---------- 工具 ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const dstr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => dstr(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return dstr(d); };
const DF_SHORT = new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric' });
const DF_FULL = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
const fmtDate = (str, full) => { const d = new Date(str + 'T00:00:00'); return isNaN(d) ? str : (full ? DF_FULL : DF_SHORT).format(d); };
const uid = () => Math.random().toString(36).slice(2, 10);
const LETTERS = 'ABCDEFGH';
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), Math.max(2200, msg.length * 110));
}
// 朗讀：macOS 內建許多特效語音（Albert、Bells、Zarvox…），預設可能選到它們，所以明確挑選自然的英語語音
const VOICE_PREF = ['Samantha', 'Ava', 'Allison', 'Evan', 'Nicky', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Guy', 'Alex', 'Karen', 'Daniel', 'Google UK English Female', 'Google UK English Male'];
const VOICE_BAD = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Kathy|Deranged|Hysterical|Pipe|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley/i;
let VOICE = null;
function pickVoice() {
  const vs = (speechSynthesis.getVoices() || []).filter(v => /^en[-_]/i.test(v.lang) && !VOICE_BAD.test(v.name));
  if (!vs.length) return null;
  if (S.voice) { const v = vs.find(v => v.name === S.voice); if (v) return v; }
  for (const n of VOICE_PREF) { const v = vs.find(v => v.name.startsWith(n) && /en[-_]US/i.test(v.lang)) || vs.find(v => v.name.startsWith(n)); if (v) return v; }
  return vs.find(v => /en[-_]US/i.test(v.lang) && v.localService) || vs.find(v => /en[-_]US/i.test(v.lang)) || vs[0];
}
try { speechSynthesis.addEventListener('voiceschanged', () => { VOICE = pickVoice(); }); } catch (e) {}
function speak(text) {
  try {
    const clean = String(text).replace(/\s*\.\.\.\s*/g, ', ').replace(/[()]/g, '').replace(/\s*\/\s*/g, ' or ').replace(/\s+/g, ' ').trim();
    const u = new SpeechSynthesisUtterance(clean);
    VOICE = VOICE || pickVoice();
    if (VOICE) { u.voice = VOICE; u.lang = VOICE.lang; } else u.lang = 'en-US';
    u.rate = clean.includes(' ') ? .92 : .85; u.pitch = 1;
    speechSynthesis.cancel();
    setTimeout(() => speechSynthesis.speak(u), 60);
  } catch (e) { toast('這個瀏覽器不支援朗讀'); }
}

// ---------- 資料 ----------
const KEY = 'eng-progress.v1';
let S;
function blankState() {
  const t = today();
  return {
    words: SEED_WORDS.map(w => ({ id: uid(), ...w, added: t, due: t, ivl: 0, ease: 2.5, reps: 0, lapses: 0, isNew: true })),
    attempts: [], scores: [{ id: uid(), date: t, exam: '多益', kind: 'total', value: 440, note: '起點' }],
    days: [], intro: { date: t, count: 0 }, newPerDay: 10, chat: [], apiKey: '', seeded: null,
  };
}
function load() {
  try { const raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : blankState(); }
  catch (e) { S = blankState(); }
  S = Object.assign(blankState(), S);
  if (S.intro.date !== today()) S.intro = { date: today(), count: 0 };
  // 內容更新後，把新的內建單字補進既有紀錄（已刪除的不會重複加回）
  S.seeded = S.seeded || S.words.map(w => w.en);
  const t0 = today();
  SEED_WORDS.forEach(w => { if (!S.seeded.includes(w.en)) { S.seeded.push(w.en); if (!S.words.some(x => x.en === w.en)) S.words.push({ id: uid(), ...w, added: t0, due: t0, ivl: 0, ease: 2.5, reps: 0, lapses: 0, isNew: true }); } });
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('無法儲存：瀏覽器封鎖了本機儲存'); } }
function markDay() { const t = today(); if (!S.days.includes(t)) { S.days.push(t); save(); } }
function streak() {
  const set = new Set(S.days); let d = today(), n = 0;
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
const dueCards = () => S.words.filter(w => !w.isNew && w.due <= today()).sort((a, b) => a.due < b.due ? -1 : 1);
const newLeft = () => Math.max(0, S.newPerDay - S.intro.count);
const newCards = () => S.words.filter(w => w.isNew).slice(0, newLeft());
const learned = () => S.words.filter(w => w.reps > 0).length;

// ---------- 間隔重複 ----------
function grade(card, g) {
  const t = today();
  if (card.isNew) { card.isNew = false; S.intro.count++; }
  if (g === 0) { card.lapses++; card.reps = 0; card.ivl = 0; card.ease = Math.max(1.3, card.ease - .2); card.due = t; }
  else if (g === 1) { card.ivl = Math.max(1, Math.round(card.ivl * 1.2)); card.ease = Math.max(1.3, card.ease - .15); card.reps++; card.due = addDays(t, card.ivl); }
  else { card.ivl = card.reps === 0 ? 1 : card.reps === 1 ? 3 : Math.round(Math.max(1, card.ivl) * card.ease); card.ease = Math.min(3, card.ease + .05); card.reps++; card.due = addDays(t, card.ivl); }
  markDay(); save();
}

// ---------- 路由 ----------
let timerId = null, ROUTE_Q = new URLSearchParams();
function route() {
  clearInterval(timerId); hideWordbar(); closeWalk();
  const [pathStr, qs] = (location.hash.replace(/^#\/?/, '') || 'today').split('?');
  ROUTE_Q = new URLSearchParams(qs || '');
  const parts = pathStr.split('/');
  const r = parts[0]; document.body.dataset.r = r;
  $$('#nav a').forEach(a => { const on = a.dataset.r === (r === 'study' ? 'words' : r); a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  const views = { today: vToday, study: vStudy, words: vWords, read: parts[1] ? () => vExam(parts[1], parts[2] === 'wrong') : vReadList, review: vReview, ai: vAI };
  (views[r] || vToday)();
  window.scrollTo(0, 0);
  motion();
}
// ---------- 動態細節：數字跳動、游標光 ----------
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
function motion() {
  if (REDUCE.matches) return;
  $$('.stat .n').forEach((el, i) => {
    const t = el.firstChild; if (!t || t.nodeType !== 3) return;
    const raw = t.nodeValue.trim(); if (!/^[0-9]+$/.test(raw)) return;
    const end = Number(raw); if (end <= 0) return;
    const t0 = performance.now() + i * 80, dur = 900;
    t.nodeValue = '0';
    const id = setInterval(() => {
      const k = Math.min(1, Math.max(0, (performance.now() - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      t.nodeValue = String(Math.round(end * e));
      if (k >= 1 || !el.isConnected) { clearInterval(id); if (el.isConnected) t.nodeValue = String(end); }
    }, 30);
  });
  const poster = null;
  if (poster) poster.addEventListener('pointermove', e => {
    const r = poster.getBoundingClientRect();
    poster.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
    poster.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
  }, { passive: true });
  const hero = $('.hero');
  if (hero) hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
}
const app = () => $('#app');

// ---------- 今日單字海報 ----------
function posterWord() {
  const ok = w => /^[A-Za-z]{3,9}$/.test(w.en);
  const pools = [dueCards(), newCards(), S.words.filter(w => w.isNew), S.words];
  for (const pool of pools) { const c = pool.filter(ok); if (c.length) return c[(Number(today().replace(/\D/g, '')) || 0) % c.length]; }
  return null;
}
function posterHTML() {
  const w = posterWord(); if (!w) return '';
  const letters = [...w.en.toUpperCase()];
  const row = cls => `<div class="ps-row ${cls}" aria-hidden="true">${letters.map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join('')}</div>`;
  const total = S.words.length, done = learned();
  const pad = n => String(n).padStart(2, '0');
  const st = pad(Math.min(99, streak()));
  const ticks = 40, on = total ? Math.round(done / total * ticks) : 0;
  return `<a class="poster" href="#/study" style="--n:${letters.length}" aria-label="今日單字 ${esc(w.en)}：${esc(w.zh)}。開始複習">
    <div class="ps-ruler" aria-hidden="true"><span>${pad(done)}</span><i class="ps-box"></i><span>${total}</span><span class="ps-ticks">${Array.from({ length: ticks }, (_, i) => `<i class="${i < on ? 'on' : ''}" style="--i:${i}"></i>`).join('')}</span></div>
    <div class="ps-stage" aria-hidden="true">
      <div class="ps-panel"><i class="ps-disc"></i><i class="ps-leg"></i><i class="ps-bar"></i></div>
      ${row('r1')}${row('r2')}
    </div>
    <div class="ps-num" aria-hidden="true"><span>${st[0]}</span><i></i><span>${st[1]}</span></div>
    <div class="ps-meta"><span>今日單字</span><span>${esc(w.en)} ${esc(w.pos || '')}</span><span>${esc(w.zh)}</span><span>連續 ${streak()} 天</span></div>
  </a>`;
}

// ---------- 設計閱讀：連到英文設計刊物的真實文章（清單由 update_design.py 更新） ----------
const dayNum = () => Number(today().replace(/\D/g, '')) || 0;
let DZ_SHIFT = 0;
const DZ_PUBS = [["It's Nice That", 'https://www.itsnicethat.com/'], ['Eye Magazine', 'https://www.eyemagazine.com/'], ['Creative Review', 'https://www.creativereview.co.uk/'], ['PRINT', 'https://www.printmag.com/'],
  ['Gurafiku', 'https://gurafiku.tumblr.com/'], ['Slanted', 'https://slanted.de/'], ['People of Print', 'https://www.peopleofprint.com/'], ['BP&O', 'https://bpando.org/'], ['Creative Boom', 'https://www.creativeboom.com/'], ['Typographic Posters', 'https://www.typographicposters.com/'], ['Design360°（中文）', 'https://www.design360.cn/']];
const DZ_GUIDE = [
  [['What problem was this design made to solve?', '這個設計要解決什麼問題？'], ['Which decision stands out most: colour, type, layout or image?', '最突出的決定是哪一個：顏色、字體、版面還是圖像？'], ['Find two adjectives the writer uses to describe the work.', '找出作者用來形容作品的兩個形容詞。']],
  [['Who is the audience for this work?', '這件作品是做給誰看的？'], ['How does the layout guide your eye from start to finish?', '版面怎麼引導你的視線從頭走到尾？'], ['Copy one sentence you would like to be able to say yourself.', '抄下一句你希望自己也說得出來的句子。']],
  [['What is the first thing you notice in the images?', '看圖時最先注意到什麼？'], ['Which words does the designer use to explain the idea?', '設計師用哪些字解釋這個概念？'], ['Would you change anything? Say why in one sentence.', '你會改哪裡？用一句話說明原因。']],
];
function dzItem(off) {
  const f = window.DESIGN_FEED; if (!f || !f.items || !f.items.length) return null;
  const r = S.dzRegion || 'all', items = r === 'all' ? f.items : f.items.filter(x => x.region === r);
  const list = items.length ? items : f.items, n = list.length;
  return list[(((dayNum() + off * 3 + DZ_SHIFT) % n) + n) % n];
}
function designHTML(off, lead) {
  const x = dzItem(off);
  const hasImg = x && x.image;
  if (!x) return lead ? `<section class="dz dz-lead"><p class="eyebrow"><b></b>設計閱讀</p><p class="lead">還沒有文章清單。在網站資料夾執行 python3 update_design.py 之後重新整理。</p></section>` : '';
  const g = DZ_GUIDE[(dayNum() + off) % DZ_GUIDE.length];
  const mine = (S.designNotes || []).find(n => n.link === x.link);
  return `<section class="dz ${lead ? 'dz-lead' : ''} ${hasImg ? '' : 'noimg'}" data-dz="${off}" aria-label="設計閱讀">
    ${x.image ? `<a class="dz-fig" href="${esc(x.link)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img src="${esc(x.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.dz').classList.add('noimg');this.parentNode.remove()"><span>圖片來源：${esc(x.source)}</span></a>` : ''}
    <div class="dz-main">
    <p class="eyebrow"><b></b>設計閱讀 · ${esc(x.source)} · ${esc(x.topic)}${x.date ? ' · ' + esc(x.date) : ''}</p>
    <${lead ? 'h1' : 'p'} class="dz-title" lang="en"><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a></${lead ? 'h1' : 'p'}>
    ${lead ? `<div class="row dz-region" role="group" aria-label="文章地區">${[['all', '全部'], ['jp', '日本平面設計'], ['west', '歐美刊物']].map(([v, t]) => `<button type="button" class="btn ${(S.dzRegion || 'all') === v ? 'primary' : ''}" data-dz-region="${v}" aria-pressed="${(S.dzRegion || 'all') === v}">${t}</button>`).join('')}</div>` : ''}
    <div class="row dz-act"><a class="btn primary" href="${esc(x.link)}" target="_blank" rel="noopener">到原站閱讀</a>
      <button type="button" class="btn" data-dz-say>朗讀標題</button><button type="button" class="btn cyan" data-dz-next>換一篇</button></div>
    <ol class="dz-guide">${g.map(([en, zh]) => `<li><span lang="en">${esc(en)}</span><small>${esc(zh)}</small></li>`).join('')}</ol>
    <label class="field dz-note"><span class="label">讀完後，用一句英文寫下你注意到的設計手法</span>
      <textarea data-dz-note placeholder="例：The poster uses a strict grid, so the long text is still easy to read.">${esc(mine ? mine.text : '')}</textarea></label>
    <div class="row"><button type="button" class="btn" data-dz-save>儲存筆記</button><span class="label" data-dz-saved>${mine ? '已儲存於 ' + esc(mine.date) : ''}</span></div>
    </div>
    ${lead ? `<p class="dz-pubs"><span class="label">刊物</span>${DZ_PUBS.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join('')}</p>
    ${(S.designNotes || []).length ? `<details class="dz-mine"><summary>我的設計筆記（${S.designNotes.length}）</summary><ul class="list">${S.designNotes.slice(-8).reverse().map(n => `<li><span class="grow"><span lang="en">${esc(n.text)}</span><br><a class="muted" href="${esc(n.link)}" target="_blank" rel="noopener" style="font-size:14px">${esc(n.source)} · ${esc(n.title)}</a></span><span class="label">${esc(n.date)}</span></li>`).join('')}</ul></details>` : ''}` : ''}
  </section>`;
}
const interHTML = n => designHTML(n + 1, false);
document.addEventListener('click', e => {
  const box = e.target.closest('.dz'); if (!box) return;
  const off = +box.dataset.dz, x = dzItem(off); if (!x) return;
  const rg = e.target.closest('[data-dz-region]');
  if (rg) { S.dzRegion = rg.dataset.dzRegion; DZ_SHIFT = 0; save(); $$('.dz').forEach(b => { b.outerHTML = designHTML(+b.dataset.dz, b.classList.contains('dz-lead')); }); return; }
  if (e.target.closest('[data-dz-say]')) { speak(x.title); return; }
  if (e.target.closest('[data-dz-next]')) { DZ_SHIFT++; const lead = box.classList.contains('dz-lead'); box.outerHTML = designHTML(off, lead); return; }
  if (e.target.closest('[data-dz-save]')) {
    const t = $('[data-dz-note]', box).value.trim(); if (!t) { toast('先寫一句再儲存'); return; }
    S.designNotes = (S.designNotes || []).filter(n => n.link !== x.link);
    S.designNotes.push({ date: today(), link: x.link, title: x.title, source: x.source, text: t }); save(); markDay();
    toast('已儲存設計筆記'); $('[data-dz-saved]', box).textContent = '已儲存於 ' + today();
  }
});

// ---------- 今日 ----------
function stageIndex() {
  const last = k => [...S.scores].reverse().find(k);
  const ielts = last(s => s.exam === '雅思' && s.kind !== 'total-reading');
  const toeic = last(s => s.exam === '多益');
  const band = ielts ? (ielts.kind === 'raw' ? rawToBand(ielts.value) : ielts.value) : 0;
  const t = toeic ? toeic.value : 0;
  if (band >= 9 || t >= 990) return 5;
  if (band >= 7.5 || t >= 860) return 5;
  if (band >= 6.5) return 4;
  if (band >= 5.5) return 3;
  if (band >= 5 || t >= 650) return 2;
  if (t >= 550) return 1;
  return 0;
}
function vToday() {
  const due = dueCards().length, nw = newCards().length;
  const next = PASSAGES.find(p => !S.attempts.some(a => a.pid === p.id)) || PASSAGES[0];
  const si = stageIndex();
  app().innerHTML = designHTML(0, true) + `
  <section class="hero">
    <p class="eyebrow"><b></b>今日概況 · ${fmtDate(today(), true)}</p>
    <h1>單字 <span class="hl">${due + nw}</span> 個，閱讀 1 篇</h1>
    <p class="lead">目前階段：${esc(ROADMAP[si].title)}。本階段指標：${esc(ROADMAP[si].goal)}。</p>
    <div class="stats">
      <a class="stat pk" href="#/study"><div class="label">待複習 →</div><div class="n">${due}<small>字</small></div></a>
      <a class="stat" href="#/study"><div class="label">今日新字 →</div><div class="n">${nw}<small>字</small></div></a>
      <a class="stat" href="#/review"><div class="label">連續天數 →</div><div class="n">${streak()}<small>天</small></div></a>
      <a class="stat" href="#/words"><div class="label">已學單字 →</div><div class="n">${learned()}<small>／${S.words.length}</small></div></a>
    </div>
    <div class="row" style="margin-top:20px">
      <a class="btn primary" href="#/study">開始複習單字</a>
      <a class="btn" href="#/read/${next.id}">閱讀測驗：${esc(next.title)}</a>
      <a class="btn cyan" href="#/ai">AI 助理</a>
    </div>
  </section>
  <section class="sec">
    <h2>路線圖 · 440 → 990 ／ 9.0</h2>
    <ul class="list road">${ROADMAP.map((r, i) => `
      <li class="${i === si ? 'now' : ''}"><span class="st">${r.stage}</span>
        <span class="grow"><b>${esc(r.title)}</b>${i === si ? '　<span class="tag pk">你在這裡</span>' : ''}<br><span class="muted">${esc(r.goal)}</span></span>
        <span class="label">${esc(r.weeks)}</span></li>`).join('')}
    </ul>
    <p class="muted" style="font-size:13px">階段依「錯題本」中最新的模考成績判定。</p>
  </section>`;
}

// ---------- 背單字（扇貝式） ----------
let queue = [], qTotal = 0, current = null, pending = null;
function vStudy() {
  if (!current) { queue = [...dueCards(), ...newCards()]; qTotal = queue.length; }
  showCard();
}
function showCard() {
  if (!current) current = queue.shift() || null;
  pending = null;
  if (!current) {
    markDay();
    app().innerHTML = `<section class="hero"><p class="eyebrow"><b></b>單字複習</p>
      <h1>本輪已完成</h1>
      <p class="lead">本輪 ${qTotal} 張 · 連續天數 ${streak()} 天 · 已學 ${learned()} 字。下一次到期的單字會在到期日出現。</p>
      <div class="row" style="margin-top:20px"><a class="btn primary" href="#/read">閱讀測驗</a><a class="btn" href="#/words">單字本</a></div></section><section class="sec">${interHTML(dayNum() + 5)}</section>`;
    qTotal = 0; return;
  }
  const c = current, done = qTotal - queue.length - 1;
  app().innerHTML = `
  <div class="progress" aria-label="進度"><i style="width:${qTotal ? Math.round(done / qTotal * 100) : 0}%"></i></div>
  <p class="label" style="margin-top:10px">${done + 1} ／ ${qTotal}　${c.isNew ? '<span class="tag pk">新字</span>' : '<span class="tag">複習</span>'}　<span class="tag mid">${esc(c.tag)}</span></p>
  <div class="card">
    <div class="word">${esc(c.en)}</div>
    <div class="pos">${esc(c.pos || '')}　<button class="btn cyan" id="say" type="button">發音</button><button class="btn cyan" id="mute" type="button" aria-pressed="${!S.mute}">自動發音：${S.mute ? '關' : '開'}</button></div>
    <div id="area">
      <p class="muted" style="margin-top:28px">回想中文意思後選擇：</p>
      <div class="grade">
        <button class="btn g-ok" data-g="2" type="button">認識</button>
        <button class="btn g-mid" data-g="1" type="button">模糊</button>
        <button class="btn g-bad" data-g="0" type="button">不認識</button>
      </div>
      <p class="kbd">鍵盤：1 認識 · 2 模糊 · 3 不認識 · Enter 下一個</p>
    </div>
  </div>`;
  $('#say').onclick = () => speak(c.en);
  $$('[data-g]').forEach(b => b.onclick = () => reveal(+b.dataset.g));
  $('#mute').onclick = e => { S.mute = !S.mute; save(); e.currentTarget.textContent = '自動發音：' + (S.mute ? '關' : '開'); e.currentTarget.setAttribute('aria-pressed', !S.mute); if (S.mute) speechSynthesis.cancel(); };
  if (!S.mute) speak(c.en);
}
function reveal(g) {
  pending = g; const c = current;
  $('#area').innerHTML = `
    <div class="ans">
      <div class="zh">${esc(c.zh)}</div>
      ${c.ex ? `<div class="ex">${esc(c.ex)}　<button class="btn cyan" id="sayEx" type="button">例句發音</button></div>` : ''}
    </div>
    <div class="grade">
      <button class="btn primary" id="nextBtn" type="button">下一個</button>
      ${g === 2 ? '<button class="btn" id="oops" type="button">其實記錯了</button>' : ''}
    </div>`;
  if ($('#sayEx')) $('#sayEx').onclick = () => speak(c.ex);
  $('#nextBtn').onclick = next;
  if ($('#oops')) $('#oops').onclick = () => { pending = 0; next(); };
  $('#nextBtn').focus();
}
function next() {
  grade(current, pending);
  if (pending === 0) queue.push(current); // 不認識的字本輪最後再出現一次
  current = null; showCard();
}

// ---------- 單字本 ----------
let wordFilter = '全部', wordSearch = '';
function setWordsURL() {
  const q = new URLSearchParams(); if (wordFilter !== '全部') q.set('tag', wordFilter); if (wordSearch) q.set('q', wordSearch);
  ROUTE_Q = q; history.replaceState(null, '', '#/words' + (q.toString() ? '?' + q : ''));
}
function vWords() {
  wordFilter = ROUTE_Q.get('tag') || '全部'; wordSearch = ROUTE_Q.get('q') || '';
  const tags = ['全部', ...new Set(S.words.map(w => w.tag))];
  const list = S.words.filter(w => (wordFilter === '全部' || w.tag === wordFilter) &&
    (!wordSearch || (w.en + w.zh).toLowerCase().includes(wordSearch.toLowerCase())));
  app().innerHTML = `
  <section class="hero">
    <p class="eyebrow"><b></b>單字本</p>
    <h1>共 <span class="hl">${S.words.length}</span> 字</h1>
    <div class="stats">${tags.slice(1).map(t => `<div class="stat"><div class="label">${esc(t)}</div><div class="n">${S.words.filter(w => w.tag === t).length}</div></div>`).join('')}
      <div class="stat pk"><div class="label">已學會</div><div class="n">${learned()}</div></div></div>
    <div class="row" style="margin-top:20px"><a class="btn primary" href="#/study">開始背（${dueCards().length + newCards().length}）</a>
      <label class="row label">每日新字<input type="number" id="npd" name="newPerDay" inputmode="numeric" autocomplete="off" min="0" max="50" value="${S.newPerDay}" style="width:5em"></label></div>
  </section>
  <section class="sec em">
    <h2>新增單字</h2>
    <form id="addForm" class="row" style="align-items:flex-end">
      <label class="field"><span class="label">英文 *</span><input type="text" name="en" required autocomplete="off" spellcheck="false" placeholder="例：reimburse…"></label>
      <label class="field"><span class="label">中文 *</span><input type="text" name="zh" required autocomplete="off" placeholder="例：核銷…"></label>
      <label class="field" style="flex:0 1 110px"><span class="label">詞性</span><input type="text" name="pos" autocomplete="off" placeholder="n. / v.…"></label>
      <label class="field" style="flex:2 1 280px"><span class="label">例句</span><input type="text" name="ex" autocomplete="off" placeholder="例：The company will reimburse…"></label>
      <label class="field" style="flex:0 1 140px"><span class="label">分類</span><select name="tag">${['我的錯題', '多益', '雅思', '閱讀生字'].map(t => `<option>${t}</option>`).join('')}</select></label>
      <button class="btn primary" type="submit">加入</button>
    </form>
  </section>
  <section class="sec">
    <div class="row" style="justify-content:space-between">
      <div class="row">${tags.map(t => `<button class="btn ${t === wordFilter ? 'primary' : ''}" data-f="${esc(t)}" aria-pressed="${t === wordFilter}" type="button">${esc(t)}</button>`).join('')}</div>
      <label class="field" style="flex:0 1 240px"><input type="search" id="search" name="q" aria-label="搜尋單字" autocomplete="off" spellcheck="false" placeholder="搜尋英文或中文…" value="${esc(wordSearch)}"></label>
    </div>
    <ul class="list" style="margin-top:12px">${list.map(w => `
      <li><span class="grow"><b style="font-size:20px">${esc(w.en)}</b> <span class="muted">${esc(w.pos || '')}</span>　${esc(w.zh)}
        ${w.ex ? `<br><span class="muted" style="font-size:14px">${esc(w.ex)}</span>` : ''}</span>
        <span class="tag ${w.tag === '我的錯題' ? 'pk' : ''}">${esc(w.tag)}</span>
        <span class="label">${w.isNew ? '未學' : '下次 ' + fmtDate(w.due)}${w.lapses ? ' · 忘 ' + w.lapses : ''}</span>
        <button class="btn cyan" data-say="${esc(w.id)}" type="button">發音</button>
        <button class="btn" data-del="${esc(w.id)}" type="button">刪除</button></li>`).join('') || '<li class="muted">沒有符合的單字</li>'}
    </ul>
  </section>`;
  $('#addForm').onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target); const t = today();
    S.words.unshift({ id: uid(), en: f.get('en').trim(), zh: f.get('zh').trim(), pos: f.get('pos').trim(), ex: f.get('ex').trim(), tag: f.get('tag'), added: t, due: t, ivl: 0, ease: 2.5, reps: 0, lapses: 0, isNew: true });
    save(); toast('已加入'); vWords();
  };
  $('#npd').onchange = e => { S.newPerDay = Math.max(0, Math.min(50, +e.target.value || 0)); save(); };
  $$('[data-f]').forEach(b => b.onclick = () => { wordFilter = b.dataset.f; setWordsURL(); vWords(); });
  $('#search').oninput = e => { wordSearch = e.target.value; clearTimeout(vWords.t); vWords.t = setTimeout(() => { setWordsURL(); vWords(); const s = $('#search'); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }, 250); };
  $$('[data-say]').forEach(b => b.onclick = () => speak(S.words.find(w => w.id === b.dataset.say).en));
  $$('[data-del]').forEach(b => b.onclick = () => {
    const w = S.words.find(x => x.id === b.dataset.del);
    if (confirm(`刪除「${w.en}」？`)) { S.words = S.words.filter(x => x !== w); save(); vWords(); }
  });
}

// ---------- 閱讀清單 ----------
function vReadList() {
  app().innerHTML = `
  <section class="hero"><p class="eyebrow"><b></b>閱讀測驗</p>
    <h1>計時作答，交卷後逐題檢討</h1>
    <p class="lead">左側文章、右側題目。作答時會顯示進度是否落後；單題超過建議時間會提示先跳過。交卷後顯示正解、出處句與每題用時。點文章中的單字可加入單字本。</p></section>
  <section class="sec"><ul class="list">${PASSAGES.map((p, pi) => {
    const at = S.attempts.filter(a => a.pid === p.id); const last = at[at.length - 1];
    return `<li><span class="tag ${p.exam === '多益' ? '' : 'pk'}">${esc(p.exam)}</span>
      <span class="grow"><b style="font-size:20px">${esc(p.title)}</b><br><span class="muted">${esc(p.part)} · ${p.questions.length} 題 · 建議 ${p.minutes} 分鐘</span></span>
      <span class="label">${last ? `上次 ${last.correct.filter(Boolean).length}/${last.correct.length} · 做過 ${at.length} 次` : '未作答'}</span>
      <a class="btn primary" href="#/read/${p.id}">${last ? '再做一次' : '開始'}</a>
      ${last && last.correct.some(c => !c) ? `<a class="btn" href="#/read/${p.id}/wrong">只做錯題</a>` : ''}</li>${pi % 2 === 1 && pi < PASSAGES.length - 1 ? `<li class="inter-li">${interHTML(dayNum() + (pi >> 1))}</li>` : ''}`;
  }).join('')}</ul></section>`;
}

// ---------- 機考作答（左文右題＋配速） ----------
let EX = null;
const SMOOTH = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
window.addEventListener('beforeunload', e => { if (EX && !EX.done && Object.keys(EX.ans).length && location.hash.startsWith('#/read/')) { e.preventDefault(); e.returnValue = ''; } });
function renderPassage(p) {
  return p.paras.map((para, pi) => `<p><span class="pl">${p.exam === '雅思' ? LETTERS[pi] || pi + 1 : ''}</span>${para.map((s, si) =>
    `<span class="s" data-s="${pi}-${si}">${esc(s).replace(/([A-Za-z][A-Za-z'’-]*)/g, '<span class="w">$1</span>')}</span> `).join('')}</p>`).join('');
}
const fmtTime = s => pad(Math.floor(s / 60)) + ':' + pad(Math.round(s % 60));
function vExam(pid, onlyWrong) {
  const p = PASSAGES.find(x => x.id === pid); if (!p) return vReadList();
  let idx = p.questions.map((_, i) => i);
  if (onlyWrong) {
    const last = [...S.attempts].reverse().find(a => a.pid === pid);
    if (last) idx = last.qidx.filter((q, k) => !last.correct[k]);
  }
  const target = Math.round(p.minutes * 60 / p.questions.length); // 每題建議秒數（含讀文時間）
  const limit = target * idx.length;
  EX = { p, idx, ans: {}, start: Date.now(), last: Date.now(), qsecs: {}, flags: new Set(), done: false, attempt: null, target, limit };
  app().innerHTML = `
  <div class="exam">
    <div class="exambar">
      <span class="row"><span class="tag ${p.exam === '多益' ? '' : 'pk'}">${esc(p.exam)}</span><b>${esc(p.title)}</b>${onlyWrong ? '<span class="tag bad">錯題重做</span>' : ''}</span>
      <div class="pace"><div class="track"><i id="paceDone"></i><b id="paceNow"></b></div><span class="msg" id="paceMsg"></span></div>
      <span class="timer" id="timer" aria-label="剩餘時間">--:--</span>
      <span class="row"><a class="btn cyan" href="#/read">離開</a><button class="btn primary" id="submit" type="button">交卷</button></span>
    </div>
    <div class="panes" role="group" aria-label="切換顯示"><button type="button" class="btn primary" data-pane="p" aria-pressed="true">文章</button><button type="button" class="btn" data-pane="q" aria-pressed="false">題目</button></div>
    <div class="split" data-pane="p">
      <div class="passage" id="passage"><h1>${esc(p.title)}</h1>${p.header ? `<div class="hdr">${esc(p.header)}</div>` : ''}${renderPassage(p)}</div>
      <div id="qs"><p class="label" style="margin:0 0 4px">建議每題 ${target} 秒（含讀文）· 共 ${fmtTime(limit)}</p>${idx.map((qi, k) => renderQ(p.questions[qi], qi, k)).join('')}</div>
    </div>
    <div class="qnav" id="qnav">${idx.map((qi, k) => `<button type="button" data-jump="${qi}" aria-label="第 ${k + 1} 題">${k + 1}</button>`).join('')}</div>
  </div>`;
  const tick = () => {
    if (!$('#timer')) return clearInterval(timerId);
    const el = $('#timer'), used = (Date.now() - EX.start) / 1000, left = Math.round(limit - used), a = Math.abs(left);
    el.textContent = (left < 0 ? '+' : '') + fmtTime(a);
    el.classList.toggle('warn', left < 60);
    const answered = Object.keys(EX.ans).length, n = idx.length;
    const expected = Math.min(n, Math.floor(used / target));
    $('#paceDone').style.width = (answered / n * 100) + '%';
    $('#paceNow').style.left = Math.min(100, used / limit * 100) + '%';
    const onThis = (Date.now() - EX.last) / 1000, msg = $('#paceMsg');
    let text = `已答 ${answered}/${n} · 依時間應答 ${expected} 題`, behind = false;
    if (expected > answered) { text += ` · 落後 ${expected - answered} 題`; behind = true; }
    if (answered < n && onThis > target * 1.5) { text += ` · 目前這題已 ${Math.round(onThis)} 秒，建議先跳過`; behind = true; }
    msg.textContent = text; msg.classList.toggle('behind', behind);
  };
  tick(); timerId = setInterval(tick, 1000);
  $('#qs').addEventListener('click', e => {
    if (EX.done) return;
    const f = e.target.closest('.flagbtn');
    if (f) return toggleFlag(+f.dataset.flag);
    const b = e.target.closest('.opt'); if (!b) return;
    const qi = +b.dataset.q;
    if (EX.ans[qi] == null) { EX.qsecs[qi] = (EX.qsecs[qi] || 0) + (Date.now() - EX.last) / 1000; EX.last = Date.now(); }
    EX.ans[qi] = b.dataset.v;
    $$(`.opt[data-q="${qi}"]`).forEach(o => { o.classList.toggle('sel', o === b); o.setAttribute('aria-pressed', o === b); });
    $(`#qnav [data-jump="${qi}"]`).classList.add('done');
    if (EX.flags.has(qi)) toggleFlag(qi);
  });
  $('#qnav').addEventListener('click', e => { const b = e.target.closest('[data-jump]'); if (b) { EX.setPane('q'); $('#q' + b.dataset.jump).scrollIntoView({ behavior: SMOOTH, block: 'center' }); } });
  $('#passage').addEventListener('click', e => { const w = e.target.closest('.w'); if (w) { w.classList.add('mark'); showWordbar(w.textContent, w.closest('.s').textContent.trim()); } });
  const setPane = v => { $('.split').dataset.pane = v; $$('.panes [data-pane]').forEach(b => { const on = b.dataset.pane === v; b.classList.toggle('primary', on); b.setAttribute('aria-pressed', on); }); };
  EX.setPane = setPane;
  $$('.panes [data-pane]').forEach(b => b.onclick = () => setPane(b.dataset.pane));
  $('#submit').onclick = submitExam;
}
function toggleFlag(qi) {
  const on = !EX.flags.has(qi);
  if (on) { EX.flags.add(qi); EX.qsecs[qi] = (EX.qsecs[qi] || 0) + (Date.now() - EX.last) / 1000; EX.last = Date.now(); }
  else EX.flags.delete(qi);
  $('#q' + qi).classList.toggle('flag', on);
  $(`#qnav [data-jump="${qi}"]`).classList.toggle('flag', on);
  $(`.flagbtn[data-flag="${qi}"]`).textContent = on ? '取消標記' : '先跳過';
  if (on) { // 跳到下一題未作答的題目
    const nextQ = EX.idx.find(x => x !== qi && EX.ans[x] == null && !EX.flags.has(x));
    if (nextQ != null) $('#q' + nextQ).scrollIntoView({ behavior: SMOOTH, block: 'center' });
  }
}
function renderQ(q, qi, k) {
  const opts = q.type === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'].map(v => [v, v]) : q.options.map((o, i) => [String(i), o, LETTERS[i]]);
  return `<div class="q" id="q${qi}"><div class="qhead"><div><span class="qn">${pad(k + 1)}</span><span class="qt">${esc(q.q)}</span></div>
    <button type="button" class="btn cyan flagbtn" data-flag="${qi}">先跳過</button></div>
    <div class="opts ${q.type === 'tfng' ? 'tf' : ''}">${opts.map(([v, t, k]) => `<button type="button" class="opt" data-q="${qi}" data-v="${esc(v)}">${k ? `<span class="k" aria-hidden="true">${k}</span><span class="sr">${k}. </span>` : ''}<span class="tx">${esc(t)}</span></button>`).join('')}</div>
    <div class="fb"></div></div>`;
}
function submitExam() {
  if (EX.done) return;
  const unanswered = EX.idx.filter(qi => EX.ans[qi] == null).length;
  if (unanswered && !confirm(`尚有 ${unanswered} 題未作答，確定交卷？`)) return;
  clearInterval(timerId); EX.done = true;
  const p = EX.p, secs = Math.round((Date.now() - EX.start) / 1000);
  const correct = EX.idx.map(qi => String(EX.ans[qi]) === String(p.questions[qi].answer));
  EX.attempt = { id: uid(), pid: p.id, date: today(), secs, limit: EX.limit, target: EX.target, qidx: EX.idx, answers: EX.idx.map(qi => EX.ans[qi] ?? null),
    qsecs: EX.idx.map(qi => Math.round(EX.qsecs[qi] || 0)), flagged: EX.idx.filter(qi => EX.flags.has(qi)), correct, reasons: {}, notes: {} };
  S.attempts.push(EX.attempt); markDay(); save();
  const n = correct.filter(Boolean).length, over = secs > EX.limit;
  $('#submit').outerHTML = `<b class="mono">${n}/${correct.length} · ${fmtTime(secs)}${over ? ` <span class="tag bad">超時 ${fmtTime(secs - EX.limit)}</span>` : ''}</b>`;
  $$('.flagbtn').forEach(b => b.remove());
  EX.idx.forEach((qi, k) => {
    const q = p.questions[qi], box = $('#q' + qi), ok = correct[k], t = EX.attempt.qsecs[k];
    $$('.opt', box).forEach(o => {
      if (o.dataset.v === String(q.answer)) o.classList.add('right');
      else if (o.classList.contains('sel')) { o.classList.remove('sel'); o.classList.add('wrong'); }
    });
    q.evidence.forEach(id => { const s = $(`[data-s="${id}"]`); if (s) s.classList.add('ev'); });
    const nb = $(`#qnav [data-jump="${qi}"]`); nb.classList.remove('done', 'flag'); nb.classList.add(ok ? 'ok' : 'bad');
    $('.fb', box).innerHTML = `<div class="why"><span class="${ok ? 'ok' : 'bad'}">${ok ? '正確' : EX.attempt.answers[k] == null ? '未作答' : '錯誤'}</span>
      · 正解 ${q.type === 'tfng' ? q.answer : LETTERS[q.answer]} · 用時 ${t} 秒（建議 ${EX.target}）${t > EX.target * 1.5 ? ' <span class="tag bad">超時</span>' : ''} · 出處句已標示於文章<br>${esc(q.why)}</div>
      ${ok ? '' : `<div class="label" style="margin-top:10px">錯誤原因（可複選）</div>
      <div class="reasons">${ERROR_TYPES.map(r => `<button type="button" class="opt" data-r="${qi}" data-t="${esc(r)}">${esc(r)}</button>`).join('')}</div>
      <textarea data-note="${qi}" aria-label="第 ${k + 1} 題檢討筆記" placeholder="檢討筆記：下次判斷時要注意的地方…" style="margin-top:8px"></textarea>`}`;
    $('.fb', box).insertAdjacentHTML('beforeend', `<div class="row" style="margin-top:12px"><button type="button" class="btn ${ok ? '' : 'primary'}" data-walk="${qi}">帶我走讀（語音）</button></div>`);
    if (!ok && t > EX.target * 1.5) { const r = $(`[data-r="${qi}"][data-t="時間不夠"]`); if (r) { r.classList.add('sel'); r.setAttribute('aria-pressed', 'true'); } }
  });
  $('#qs').insertAdjacentHTML('beforeend', `<div class="row" style="margin-top:18px"><button class="btn primary" id="saveReview" type="button">儲存到錯題本</button><a class="btn" href="#/read">回清單</a></div>${interHTML(dayNum() + S.attempts.length + 3)}`);
  $('#qs').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) b.setAttribute('aria-pressed', b.classList.toggle('sel')); });
  $('#saveReview').onclick = () => {
    EX.idx.forEach(qi => {
      const r = $$(`[data-r="${qi}"].sel`).map(b => b.dataset.t); if (r.length) EX.attempt.reasons[qi] = r;
      const nt = $(`[data-note="${qi}"]`); if (nt && nt.value.trim()) EX.attempt.notes[qi] = nt.value.trim();
    });
    save(); toast('已儲存'); location.hash = '#/review';
  };
  toast(`交卷：${n}/${correct.length}`);
}

// ---------- 點字加入單字本 ----------
function showWordbar(word, sentence) {
  const bar = $('#wordbar'); const w = word.replace(/[’']s$/, '');
  const exists = S.words.some(x => x.en.toLowerCase() === w.toLowerCase());
  bar.hidden = false;
  bar.innerHTML = `<b>${esc(w)}</b>
    ${exists ? '<span>已在單字本裡</span>' : `<input type="text" id="wbZh" name="zh" aria-label="中文意思" autocomplete="off" placeholder="輸入中文意思…">
    <button class="btn primary" id="wbAdd" type="button">加入單字本</button>`}
    <button class="btn" id="wbSay" type="button">發音</button>
    <a class="btn" href="https://dictionary.cambridge.org/dictionary/english-chinese-traditional/${encodeURIComponent(w.toLowerCase())}" target="_blank" rel="noopener">查劍橋</a>
    <button class="btn" id="wbClose" type="button">關閉</button>`;
  $('#wbSay').onclick = () => speak(w);
  $('#wbClose').onclick = hideWordbar;
  if (!exists) {
    const add = () => {
      const zh = $('#wbZh').value.trim(); if (!zh) return $('#wbZh').focus();
      const t = today();
      S.words.unshift({ id: uid(), en: w, zh, pos: '', ex: sentence, tag: '閱讀生字', added: t, due: t, ivl: 0, ease: 2.5, reps: 0, lapses: 0, isNew: true });
      save(); toast(`已加入：${w}`); hideWordbar();
    };
    $('#wbAdd').onclick = add; $('#wbZh').onkeydown = e => { if (e.key === 'Enter') add(); };
    if (matchMedia('(pointer: fine)').matches) $('#wbZh').focus();
  }
}
function hideWordbar() { const b = $('#wordbar'); b.hidden = true; b.innerHTML = ''; }

// ---------- 錯題走讀（語音） ----------
// 內建步驟不需要網路；有 API 金鑰時可改由 Claude 產生逐句講解。朗讀使用瀏覽器內建語音（英文與中文各一個）。
let ZH_VOICE = null, SPK = 0, WK = null;
function pickZh() {
  const all = speechSynthesis.getVoices() || [], ok = v => !VOICE_BAD.test(v.name);
  const tw = all.filter(v => /^zh[-_](TW|Hant)/i.test(v.lang) && ok(v));
  return tw.find(v => /Mei-?Jia|美佳/i.test(v.name)) || tw[0] || all.find(v => /^zh/i.test(v.lang) && ok(v)) || null;
}
function speakSeq(parts, rate) {
  const my = ++SPK; try { speechSynthesis.cancel(); } catch (e) { return; }
  const list = parts.filter(x => x && x.t);
  const run = i => {
    if (my !== SPK || i >= list.length) return;
    const x = list[i], u = new SpeechSynthesisUtterance(String(x.t).replace(/\s*\.\.\.\s*/g, ', ').replace(/[()（）]/g, ' ').replace(/\s+/g, ' ').trim());
    if (x.lang === 'zh') { ZH_VOICE = ZH_VOICE || pickZh(); if (ZH_VOICE) { u.voice = ZH_VOICE; u.lang = ZH_VOICE.lang; } else u.lang = 'zh-TW'; u.rate = 1 * rate; }
    else { VOICE = VOICE || pickVoice(); if (VOICE) { u.voice = VOICE; u.lang = VOICE.lang; } else u.lang = 'en-US'; u.rate = (x.slow ? .72 : .9) * rate; }
    u.onend = () => setTimeout(() => run(i + 1), 280); u.onerror = () => run(i + 1);
    speechSynthesis.speak(u);
  };
  setTimeout(() => run(0), 80);
}
function stopSpeak() { SPK++; try { speechSynthesis.cancel(); } catch (e) {} }

function walkSteps(qi) {
  const p = EX.p, q = p.questions[qi], k = EX.idx.indexOf(qi), mine = EX.attempt.answers[k], ok = EX.attempt.correct[k];
  const txt = v => q.type === 'tfng' ? String(v) : q.options[+v], lab = v => q.type === 'tfng' ? String(v) : LETTERS[+v];
  const sent = id => { const [a, b] = id.split('-').map(Number); return (p.paras[a] || [])[b] || ''; };
  const ev = (q.evidence || []).filter(sent), first = ev[0];
  const steps = [{ title: '讀題', en: q.q, zh: '先看題目在問什麼，找出題目裡的關鍵字，再回文章找對應的句子。' }];
  ev.forEach(id => { const [a, b] = id.split('-').map(Number); steps.push({ title: '定位出處', ref: id, en: sent(id), zh: `答案的依據在第 ${a + 1} 段第 ${b + 1} 句，文章中已經標示。` }); });
  steps.push({ title: '對照正解', ref: first, en: q.type === 'tfng' ? `The answer is ${q.answer}.` : `${lab(q.answer)}. ${txt(q.answer)}`, zh: q.why });
  if (!ok) steps.push(mine == null
    ? { title: '你的作答', ref: first, zh: '這題沒有作答。時間不夠時，先依出處句選一個最接近的答案，不要留白。' }
    : { title: '你的答案', ref: first, en: txt(mine), zh: `你選的是 ${lab(mine)}。回到出處句比對：這個選項的內容在句子裡找不到對應，或與句子的意思不同。` });
  if (first) steps.push({ title: '跟讀', ref: first, en: sent(first), slow: true, zh: '最後跟著唸一次出處句，速度已放慢。' });
  return steps;
}
function openWalk(qi) {
  if (!EX || !EX.done) return;
  closeWalk(); hideWordbar();
  WK = { qi, steps: walkSteps(qi), i: 0, rate: S.walkRate || 1, ai: false, busy: false, stream: null };
  const el = document.createElement('div'); el.id = 'walk'; el.className = 'walk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '錯題走讀');
  document.body.appendChild(el); document.body.classList.add('walking');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-wk]'); if (!b) return; const a = b.dataset.wk;
    if (a === 'prev') walkGo(WK.i - 1); else if (a === 'next') walkGo(WK.i + 1); else if (a === 'say') walkSay();
    else if (a === 'close') closeWalk(); else if (a === 'ai') walkAI(); else if (a === 'nextq') walkNextQ();
    else if (a === 'rate') { const r = [0.8, 1, 1.2]; WK.rate = r[(r.indexOf(WK.rate) + 1) % r.length]; S.walkRate = WK.rate; save(); walkRender(); walkSay(); }
    else if (a === 'dot') walkGo(+b.dataset.i);
  });
  walkGo(0);
}
function closeWalk() {
  if (!WK) return; stopSpeak(); if (WK.stream) { try { WK.stream.abort(); } catch (e) {} }
  WK = null; const el = $('#walk'); if (el) el.remove(); document.body.classList.remove('walking');
  $$('.s.walk-on').forEach(x => x.classList.remove('walk-on'));
}
function walkGo(i) {
  if (!WK) return; WK.i = Math.max(0, Math.min(WK.steps.length - 1, i));
  const st = WK.steps[WK.i];
  $$('.s.walk-on').forEach(x => x.classList.remove('walk-on'));
  if (st.ref) { const sp = $(`[data-s="${st.ref}"]`); if (sp) { sp.classList.add('walk-on'); if (EX.setPane) EX.setPane('p'); sp.scrollIntoView({ behavior: SMOOTH, block: matchMedia('(max-width:820px)').matches ? 'start' : 'center' }); } }
  else { if (EX.setPane) EX.setPane('q'); const qb = $('#q' + WK.qi); if (qb) qb.scrollIntoView({ behavior: SMOOTH, block: 'center' }); }
  walkRender(); walkSay();
}
function walkSay() { if (!WK) return; const st = WK.steps[WK.i]; speakSeq([{ t: st.en, lang: 'en', slow: st.slow }, { t: st.zh, lang: 'zh' }], WK.rate); }
function walkNextQ() {
  const wrong = EX.idx.filter((qi, k) => !EX.attempt.correct[k]); if (!wrong.length) return;
  const at = wrong.indexOf(WK.qi); openWalk(wrong[(at + 1) % wrong.length]);
}
function walkRender() {
  const el = $('#walk'); if (!el || !WK) return; const st = WK.steps[WK.i], n = WK.steps.length, k = EX.idx.indexOf(WK.qi);
  const wrongN = EX.attempt.correct.filter(c => !c).length;
  el.innerHTML = `<div class="wk-head"><span class="label">走讀 · 第 ${k + 1} 題 · 步驟 ${WK.i + 1}／${n}${WK.ai ? ' · AI 講解' : ''}</span>
      <button type="button" class="btn cyan" data-wk="close" aria-label="關閉走讀">關閉</button></div>
    <div class="wk-dots" role="group" aria-label="步驟">${WK.steps.map((x, i) => `<button type="button" data-wk="dot" data-i="${i}" class="${i === WK.i ? 'on' : i < WK.i ? 'done' : ''}" aria-label="步驟 ${i + 1}：${esc(x.title)}" ${i === WK.i ? 'aria-current="step"' : ''}></button>`).join('')}</div>
    <div class="wk-body" aria-live="polite"><b class="wk-title">${esc(st.title)}</b>
      ${st.en ? `<p class="wk-en" lang="en">${esc(st.en)}</p>` : ''}${st.zh ? `<p class="wk-zh">${esc(st.zh)}</p>` : ''}
      ${WK.busy ? `<p class="wk-zh">AI 正在產生講解…${WK.got ? `（已收到 ${WK.got} 字）` : ''}</p>` : ''}</div>
    <div class="row wk-ctl">
      <button type="button" class="btn" data-wk="prev" ${WK.i === 0 ? 'disabled' : ''}>上一步</button>
      <button type="button" class="btn" data-wk="say">重聽</button>
      <button type="button" class="btn primary" data-wk="next" ${WK.i === n - 1 ? 'disabled' : ''}>下一步</button>
      <button type="button" class="btn cyan" data-wk="rate" aria-label="語速，目前 ${WK.rate} 倍">語速 ${WK.rate}×</button>
      <button type="button" class="btn" data-wk="ai" ${WK.busy ? 'disabled' : ''}>${WK.ai ? '重新產生 AI 講解' : 'AI 逐句講解'}</button>
      ${wrongN > 1 ? '<button type="button" class="btn cyan" data-wk="nextq">下一題錯題</button>' : ''}
    </div>`;
}
const WALK_SYSTEM = `你是英文閱讀家教，帶一位台灣大學生（多益約 440 分，目標雅思 6.5）逐步走讀一題閱讀測驗。內容會被語音朗讀，所以要短、口語、一步只講一件事。
輸出 4 到 6 個步驟。每個步驟嚴格使用以下格式，除此之外不要輸出任何文字：
## 步驟標題（中文，8 個字以內）
EN: 要朗讀的英文（直接引用文章或題目的原句或片語，不改寫，最多一句；沒有就寫 -）
ZH: 中文講解（兩到三句，70 個字以內）
REF: 這一步要標示的文章句子編號（例如 0-2；沒有就寫 -）
步驟順序：題目的關鍵字 → 在文章定位 → 拆解出處句的句構（主詞、動詞、修飾語） → 出處句與正解之間的同義改寫 → 學生選的答案為什麼不對（答對則改講另一個最容易誤選的選項） → 下次遇到同類題可以用的一個判斷方法。
語氣客觀，不要稱讚或鼓勵。中文講解裡提到英文單字時直接寫英文。`;
function parseWalk(text, p) {
  return text.split(/^##\s*/m).map(b => b.trim()).filter(Boolean).map(b => {
    const title = b.split('\n')[0].trim().slice(0, 16);
    const get = k => { const m = b.match(new RegExp('^' + k + '[:：]\\s*(.*)$', 'm')); const v = m ? m[1].trim() : ''; return v === '-' ? '' : v; };
    let ref = get('REF'); if (!/^\d+-\d+$/.test(ref)) ref = ''; else { const [a, c] = ref.split('-').map(Number); if (!(p.paras[a] || [])[c]) ref = ''; }
    return { title, en: get('EN'), zh: get('ZH'), ref };
  }).filter(x => x.title && (x.en || x.zh));
}
async function walkAI() {
  if (!WK || WK.busy) return;
  if (!S.apiKey) { toast('「AI 逐句講解」要連到 Claude，需要先在「AI 助理」頁填入 API 金鑰。不填也可以繼續用目前的內建走讀。'); return; }
  const my = WK, p = EX.p, q = p.questions[WK.qi], k = EX.idx.indexOf(WK.qi), mine = EX.attempt.answers[k];
  const lab = v => v == null ? '未作答' : q.type === 'tfng' ? String(v) : `${LETTERS[+v]}. ${q.options[+v]}`;
  const user = `【文章】${p.title}\n${p.paras.map((ss, a) => ss.map((t, b) => `[${a}-${b}] ${t}`).join('\n')).join('\n')}\n\n【題目】${q.q}\n【選項】${q.type === 'tfng' ? 'TRUE / FALSE / NOT GIVEN' : q.options.map((o, i) => `${LETTERS[i]}. ${o}`).join('\n')}\n【正解】${lab(q.answer)}\n【學生的答案】${lab(mine)}（${EX.attempt.correct[k] ? '答對' : '答錯'}）\n【出處句編號】${(q.evidence || []).join('、') || '無'}`;
  stopSpeak(); my.busy = true; my.got = 0; walkRender();
  let text = '';
  try {
    const { default: Anthropic } = await import('https://esm.sh/@anthropic-ai/sdk@1.8.0');
    const client = new Anthropic({ apiKey: S.apiKey, dangerouslyAllowBrowser: true });
    if (WK !== my) return;
    const stream = my.stream = client.beta.messages.stream({
      model: 'claude-opus-5-5', max_tokens: 4000, system: WALK_SYSTEM,
      messages: [{ role: 'user', content: user }],
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    });
    stream.on('text', t => { text += t; my.got = text.length; if (WK === my) { const z = $('#walk .wk-body p:last-child'); if (z) z.textContent = `AI 正在產生講解…（已收到 ${my.got} 字）`; } });
    const msg = await stream.finalMessage();
    if (WK !== my) return;
    const steps = msg.stop_reason === 'refusal' ? [] : parseWalk(text, p);
    my.busy = false; my.stream = null;
    if (steps.length < 2) { toast('AI 的回覆格式無法使用，保留內建步驟'); walkRender(); return; }
    my.steps = steps; my.ai = true; walkGo(0);
  } catch (e) {
    if (WK !== my) return;
    my.busy = false; my.stream = null; walkRender();
    const st = e && e.status;
    toast(st === 401 ? 'API 金鑰無效，請到「AI 助理」頁檢查' : st === 429 ? '請求太頻繁，稍後再試' : 'AI 講解失敗：' + ((e && e.message) || '連線問題'));
  }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-walk]'); if (b) openWalk(+b.dataset.walk); });
document.addEventListener('keydown', e => {
  if (!WK || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); walkGo(WK.i + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); walkGo(WK.i - 1); }
  else if (e.key === 'Escape') closeWalk();
});

// ---------- 錯題本＋成績 ----------
function rawToBand(raw) { return (IELTS_BANDS.find(([r]) => raw >= r) || [0, 0])[1]; }
function wrongItems() {
  const out = [];
  S.attempts.forEach(a => {
    const p = PASSAGES.find(x => x.id === a.pid); if (!p) return;
    a.qidx.forEach((qi, k) => { if (!a.correct[k]) out.push({ a, p, q: p.questions[qi], qi, given: a.answers[k] }); });
  });
  return out.reverse();
}
// 時間分配：哪一類題目最花時間、超時題的正確率
function timingSection() {
  const rows = { 'TRUE / FALSE / NOT GIVEN': [], '選擇題': [] }; let over = 0, overRight = 0, n = 0, overAttempts = 0, timed = 0;
  S.attempts.forEach(a => {
    const p = PASSAGES.find(x => x.id === a.pid); if (!p || !a.qsecs) return;
    timed++; if (a.secs > a.limit) overAttempts++;
    a.qidx.forEach((qi, k) => {
      const t = a.qsecs[k]; if (!t) return; n++;
      rows[p.questions[qi].type === 'tfng' ? 'TRUE / FALSE / NOT GIVEN' : '選擇題'].push(t / a.target);
      if (t > a.target * 1.5) { over++; if (a.correct[k]) overRight++; }
    });
  });
  const avg = arr => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0;
  return `<section class="sec grid">
    <div><h2>時間分配（相對建議時間）</h2>
      ${n ? `<div class="bars">${Object.entries(rows).map(([k, arr]) => { const r = avg(arr); return `<div class="bar"><span>${esc(k)}</span><span class="t"><i class="${r > 1.2 ? 'bad' : 'c'}" style="width:${Math.min(100, r / 2 * 100)}%"></i><u style="left:50%"></u></span><span class="v">${arr.length ? Math.round(r * 100) + '%' : '—'}</span></div>`; }).join('')}</div>
      <p class="muted" style="font-size:13px">中線 = 建議時間（100%）。超過 120% 以紅色顯示。</p>
      <ul class="list"><li><span class="grow">超時作答（交卷時超過總時限）</span><b class="mono">${overAttempts}/${timed} 次</b></li>
        <li><span class="grow">單題超過建議 1.5 倍</span><b class="mono">${over} 題，答對 ${over ? Math.round(overRight / over * 100) : 0}%</b></li></ul>`
      : '<p class="muted">完成一次閱讀測驗後顯示每題用時。</p>'}
    </div>
    <div><h2>時間不夠時的調整方式</h2>
      <ul class="list" style="font-size:14px">
        <li><span class="grow"><b>先看題目，再找答案。</b>先讀題目並圈出關鍵字（人名、數字、專有名詞），再回文章定位，不要從頭精讀全文。</span></li>
        <li><span class="grow"><b>單題設停損點。</b>超過建議時間 1.5 倍就按「先跳過」，答完其他題再回來。卡在一題通常比放掉一題損失更多分數。</span></li>
        <li><span class="grow"><b>不留空白。</b>多益、雅思答錯都不倒扣。時間剩 1 分鐘時，未作答的題目全部先填一個答案。</span></li>
        <li><span class="grow"><b>NOT GIVEN 不要找太久。</b>找了 60 秒仍找不到對應敘述，多半是 NOT GIVEN。</span></li>
        <li><span class="grow"><b>分段加壓練習。</b>先用建議時間的 120% 練到正確率穩定，再降到 100%，最後用 90% 練習，保留檢查時間。</span></li>
        <li><span class="grow"><b>速度瓶頸常是字彙。</b>錯誤原因若常勾「單字不認識」，先增加每日新字量，比練速讀更有效。</span></li>
      </ul></div>
  </section>`;
}
function vReview() {
  const total = S.attempts.reduce((n, a) => n + a.correct.length, 0);
  const right = S.attempts.reduce((n, a) => n + a.correct.filter(Boolean).length, 0);
  const secs = S.attempts.reduce((n, a) => n + a.secs, 0);
  const reasonCount = {}; ERROR_TYPES.forEach(t => reasonCount[t] = 0);
  S.attempts.forEach(a => Object.values(a.reasons).flat().forEach(t => reasonCount[t] = (reasonCount[t] || 0) + 1));
  const maxR = Math.max(1, ...Object.values(reasonCount));
  const byType = { 'TRUE / FALSE / NOT GIVEN': [0, 0], '選擇題': [0, 0] };
  S.attempts.forEach(a => { const p = PASSAGES.find(x => x.id === a.pid); if (!p) return;
    a.qidx.forEach((qi, k) => { const key = p.questions[qi].type === 'tfng' ? 'TRUE / FALSE / NOT GIVEN' : '選擇題'; byType[key][1]++; if (a.correct[k]) byType[key][0]++; }); });
  const wrong = wrongItems();
  const fmtAns = (q, v) => v == null ? '未作答' : q.type === 'tfng' ? v : LETTERS[v];
  app().innerHTML = `
  <section class="hero"><p class="eyebrow"><b></b>錯題本</p>
    <h1>錯題統計與時間分配</h1>
    <div class="stats">
      <div class="stat"><div class="label">作答次數</div><div class="n">${S.attempts.length}</div></div>
      <div class="stat pk"><div class="label">正確率</div><div class="n">${total ? Math.round(right / total * 100) : 0}<small>%</small></div></div>
      <div class="stat"><div class="label">每題平均</div><div class="n">${total ? Math.round(secs / total) : 0}<small>秒</small></div></div>
      <div class="stat"><div class="label">錯題</div><div class="n">${wrong.length}</div></div>
    </div></section>
  ${timingSection()}
  <section class="sec grid">
    <div><h2>錯誤原因</h2><div class="bars">${ERROR_TYPES.map(t => `<div class="bar"><span>${esc(t)}</span><span class="t"><i style="width:${reasonCount[t] / maxR * 100}%"></i></span><span class="v">${reasonCount[t]}</span></div>`).join('')}</div></div>
    <div><h2>題型正確率</h2><div class="bars">${Object.entries(byType).map(([k, [r, n]]) => `<div class="bar"><span>${esc(k)}</span><span class="t"><i class="c" style="width:${n ? r / n * 100 : 0}%"></i></span><span class="v">${n ? Math.round(r / n * 100) + '%' : '—'}</span></div>`).join('')}</div>
      <p class="muted" style="font-size:13px">雅思 6.5 約需整份閱讀答對 27／40（約 68%）。</p></div>
  </section>
  <section class="sec">
    <h2>錯題清單</h2>
    <ul class="list">${wrong.slice(0, 40).map(w => `
      <li><span class="tag ${w.p.exam === '多益' ? '' : 'pk'}">${esc(w.p.exam)}</span>
        <span class="grow"><b>${esc(w.q.q)}</b><br>
          <span class="muted">你選 ${esc(fmtAns(w.q, w.given))} → 正解 ${esc(fmtAns(w.q, w.q.answer))}　·　${esc(w.p.title)}　·　${fmtDate(w.a.date)}</span><br>
          ${(w.a.reasons[w.qi] || []).map(r => `<span class="tag pk">${esc(r)}</span>`).join(' ')}
          ${w.a.notes[w.qi] ? `<span>　${esc(w.a.notes[w.qi])}</span>` : ''}</span>
        <a class="btn" href="#/read/${w.p.id}/wrong">重做</a></li>`).join('') || '<li class="muted">目前沒有錯題紀錄。</li>'}
    </ul>
  </section>
  <section class="sec em">
    <h2>模考成績紀錄</h2>
    <form id="scoreForm" class="row" style="align-items:flex-end">
      <label class="field" style="flex:0 1 160px"><span class="label">日期</span><input type="date" name="date" autocomplete="off" value="${today()}"></label>
      <label class="field"><span class="label">類型</span><select name="type">
        <option value="多益|total">多益總分（10–990）</option>
        <option value="雅思|raw">雅思閱讀答對題數（0–40）</option>
        <option value="雅思|band">雅思總分（0–9）</option></select></label>
      <label class="field" style="flex:0 1 120px"><span class="label">分數</span><input type="number" name="value" inputmode="decimal" autocomplete="off" step="0.5" min="0" max="990" required></label>
      <label class="field"><span class="label">備註</span><input type="text" name="note" autocomplete="off" placeholder="例：官方模考 Test 1…"></label>
      <button class="btn primary" type="submit">記錄</button>
    </form>
    <ul class="list" style="margin-top:16px">${[...S.scores].reverse().map(s => `
      <li><span class="tag ${s.exam === '多益' ? '' : 'pk'}">${esc(s.exam)}</span>
        <span class="grow"><b style="font-size:24px">${s.kind === 'raw' ? `${s.value}/40 → ${rawToBand(s.value)}` : s.value}</b>　<span class="muted">${s.kind === 'raw' ? '閱讀分數' : s.kind === 'band' ? '總分' : ''} ${esc(s.note || '')}</span></span>
        <span class="label">${fmtDate(s.date, true)}</span><button class="btn" data-ds="${s.id}" type="button">刪除</button></li>`).join('')}</ul>
  </section>`;
  $('#scoreForm').onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target); const [exam, kind] = f.get('type').split('|');
    const v = +f.get('value');
    if (kind === 'raw' && (v > 40)) return toast('雅思閱讀最多 40 題');
    if (kind === 'band' && (v > 9)) return toast('雅思總分最高 9');
    S.scores.push({ id: uid(), date: f.get('date'), exam, kind, value: v, note: f.get('note') });
    S.scores.sort((a, b) => a.date < b.date ? -1 : 1); save(); toast('已記錄'); vReview();
  };
  $$('[data-ds]').forEach(b => b.onclick = () => { if (confirm('刪除這筆成績？')) { S.scores = S.scores.filter(s => s.id !== b.dataset.ds); save(); vReview(); } });
}

// ---------- AI 助理 ----------
const SYSTEM = `你是使用者專屬的英文家教。使用者是台灣的大學生，母語中文，目前多益約 440 分，第一個考試目標是雅思 6.5，長期目標是多益 990 和雅思 9.0。
你會收到使用者的學習紀錄（錯題、錯誤原因、常忘的單字、模考成績）。請依照這些紀錄回答，不要給泛泛的建議。
規則：
- 用繁體中文解釋，英文例句與題目用英文。
- 程度貼近使用者現況：先把基礎打穩，必要時解釋文法術語。
- 出題時要原創，題型仿多益 Part 5/7 或雅思 Academic Reading，並在最後附答案與逐題解析（說明出處與同義改寫）。
- 批改寫作時：先給雅思 Task 評分預估，再列出最重要的 3 個錯誤與改法，最後給一個改寫版本。
- 回答精簡，用短段落與清單，不要客套話。`;
function profileText() {
  const wrong = wrongItems().slice(0, 12);
  const rc = {}; S.attempts.forEach(a => Object.values(a.reasons).flat().forEach(t => rc[t] = (rc[t] || 0) + 1));
  const hard = [...S.words].filter(w => w.lapses > 0).sort((a, b) => b.lapses - a.lapses).slice(0, 15);
  const tags = {}; S.words.forEach(w => tags[w.tag] = (tags[w.tag] || 0) + 1);
  const fmt = (q, v) => v == null ? '未作答' : q.type === 'tfng' ? v : LETTERS[v] + ' ' + q.options[v];
  return `【我的學習紀錄　${today()}】
目前階段：${ROADMAP[stageIndex()].title}
模考成績：${S.scores.map(s => `${s.date} ${s.exam}${s.kind === 'raw' ? `閱讀 ${s.value}/40（約 ${rawToBand(s.value)}）` : ' ' + s.value}`).join('；')}
單字本：共 ${S.words.length} 字，已學 ${learned()} 字（${Object.entries(tags).map(([k, v]) => k + ' ' + v).join('、')}）；連續打卡 ${streak()} 天
常忘的字：${hard.map(w => `${w.en}（${w.zh}，忘 ${w.lapses} 次）`).join('、') || '尚無'}
我的錯題標記：${['我的錯題'].map(t => S.words.filter(w => w.tag === t).map(w => w.en).join('、')).join('') || '尚無'}
作答時間：${S.attempts.filter(a => a.qsecs).map(a => `${a.date} ${a.pid} 用時 ${a.secs} 秒／時限 ${a.limit} 秒，每題 ${a.qsecs.join('/')} 秒（建議 ${a.target}）`).slice(-5).join('；') || '尚無'}
錯誤原因統計：${Object.entries(rc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} 次`).join('、') || '尚無紀錄'}
最近錯題：
${wrong.map((w, i) => `${i + 1}. [${w.p.exam}] ${w.q.q}\n   我選：${fmt(w.q, w.given)}；正解：${fmt(w.q, w.q.answer)}；原因：${(w.a.reasons[w.qi] || []).join('、') || '未標'}；我的檢討：${w.a.notes[w.qi] || '無'}`).join('\n') || '尚無'}`;
}
const TASKS = [
  ['plan', '分析弱點，排這週計畫', '根據我的學習紀錄，指出我目前最需要補強的 3 件事，並排一份 7 天、每天 45 分鐘的計畫（單字、閱讀、檢討各多少時間）。'],
  ['quiz', '依我的錯題出 5 題新題', '根據我最常犯的錯誤類型和最近的錯題，出 5 題新的原創練習題（混合多益 Part 5 和雅思 TRUE/FALSE/NOT GIVEN），先只給題目，等我回答後再給答案與解析。'],
  ['story', '用我常忘的字寫短文', '用我「常忘的字」和「我的錯題」裡的字寫一篇 180 字左右、雅思學術風格的短文，把用到的字標成 **粗體**，最後附 3 題閱讀理解題（答案放最後）。'],
  ['pace', '分析我的作答時間', '根據我的作答時間紀錄，指出我在哪一類題目花太多時間、可能原因，並給我一套具體的作答順序與每題停損秒數，以及兩週的計時訓練計畫。'],
  ['explain', '解釋我最近的錯題', '逐題解釋我最近的錯題：我為什麼會選錯、正確的判斷步驟、以及下次遇到同類題的檢查口訣。'],
  ['write', '批改我的英文寫作', '請批改下面這段英文寫作：\n\n'],
];
function vAI() {
  app().innerHTML = `
  <section class="hero"><p class="eyebrow"><b></b>AI 助理</p>
    <h1>依學習紀錄回答的英文助理</h1>
    <p class="lead">每次提問會附上目前的學習紀錄：錯題、錯誤原因、各題用時、常忘的單字和模考成績。</p></section>
  <section class="sec">
    <h2>選一個任務</h2>
    <div class="row">${TASKS.map(([k, t]) => `<button class="btn" data-task="${k}" aria-pressed="false" type="button">${t}</button>`).join('')}</div>
    <label class="field" style="margin-top:14px"><span class="label">你的問題或要批改的文字</span><textarea id="ask" name="ask" placeholder="例：NOT GIVEN 和 FALSE 怎麼分…"></textarea></label>
    <div class="row" style="margin-top:10px">
      <button class="btn primary" id="send" type="button">直接問 AI</button>
      <button class="btn" id="copy" type="button">複製提示詞（貼到 Claude 使用）</button>
      ${S.chat.length ? '<button class="btn" id="clear" type="button">清除對話</button>' : ''}
    </div>
    <div class="chat" id="chat">${S.chat.map(m => msgHTML(m.role, m.content)).join('')}</div>
  </section>
  <section class="sec grid">
    <div><h2>API 金鑰（選填）</h2>
      <p class="muted" style="font-size:14px">沒有金鑰也能用：按「複製提示詞」，貼到 claude.ai 就好。要在網站內直接對話，請填入你自己的 Anthropic API 金鑰。金鑰只存在這台電腦的瀏覽器裡，但任何能打開這個瀏覽器的人都看得到，所以請只在自己的電腦使用，不要把網站和金鑰一起部署到公開網址。</p>
      <div class="row"><label class="field"><input type="password" id="key" name="apiKey" aria-label="Anthropic API 金鑰" spellcheck="false" placeholder="sk-ant-…" value="${esc(S.apiKey)}" autocomplete="off"></label>
      <button class="btn" id="saveKey" type="button">儲存</button></div></div>
    <div><h2>它會看到的紀錄</h2><div class="prompt-out" id="profile">${esc(profileText())}</div></div>
  </section>`;
  let task = null;
  $$('[data-task]').forEach(b => b.onclick = () => {
    task = TASKS.find(t => t[0] === b.dataset.task);
    $$('[data-task]').forEach(x => { x.classList.toggle('primary', x === b); x.setAttribute('aria-pressed', x === b); });
    if (task[0] === 'write') { $('#ask').placeholder = '把英文段落貼在這裡…'; $('#ask').focus(); }
  });
  const build = () => {
    const extra = $('#ask').value.trim();
    if (!task && !extra) return null;
    return (task ? task[2] : '') + (extra ? (task ? '' : '') + extra : '');
  };
  $('#copy').onclick = async () => {
    const q = build(); if (!q) return toast('先選任務或輸入問題');
    const text = `${SYSTEM}\n\n${profileText()}\n\n【我的需求】\n${q}`;
    try { await navigator.clipboard.writeText(text); toast('已複製，可以貼到 Claude'); }
    catch (e) { $('#profile').textContent = text; toast('無法自動複製，請從右下框手動複製'); }
  };
  $('#saveKey').onclick = () => { S.apiKey = $('#key').value.trim(); save(); toast(S.apiKey ? '已儲存在這台電腦' : '已清除金鑰'); };
  if ($('#clear')) $('#clear').onclick = () => { S.chat = []; save(); vAI(); };
  $('#send').onclick = async () => {
    if (AI.busy) { AI.aborted = true; if (AI.stream) AI.stream.abort(); return; }
    const q = build(); if (!q) return toast('先選任務或輸入問題');
    if (!S.apiKey) return toast('沒有金鑰：請改用「複製提示詞」，或先填入 API 金鑰');
    await askClaude(q);
    $('#ask').value = '';
  };
}
function msgHTML(role, content) {
  return `<div class="msg ${role === 'user' ? 'me' : 'ai'}"><span class="who">${role === 'user' ? '我' : 'AI 助理'}</span>${esc(content)}</div>`;
}
const AI = { busy: false, aborted: false, stream: null };
async function askClaude(q) {
  const btn = $('#send'); AI.busy = true; AI.aborted = false; AI.stream = null; btn.textContent = '停止';
  const chat = $('#chat');
  // 每次提問都附上最新紀錄；畫面只顯示問題本身
  const userContent = `${profileText()}\n\n【我的需求】\n${q}`;
  const history = S.chat.slice(-10).map(m => ({ role: m.role, content: m.content }));
  chat.insertAdjacentHTML('beforeend', msgHTML('user', q) + msgHTML('assistant', ''));
  const out = chat.lastElementChild; let text = '';
  try {
    const { default: Anthropic } = await import('https://esm.sh/@anthropic-ai/sdk@1.8.0');
    const client = new Anthropic({ apiKey: S.apiKey, dangerouslyAllowBrowser: true });
    if (AI.aborted) throw new Error('aborted');
    const stream = AI.stream = client.beta.messages.stream({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      system: SYSTEM,
      messages: [...history, { role: 'user', content: userContent }],
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    stream.on('text', t => { text += t; out.innerHTML = '<span class="who">AI 助理</span>' + esc(text); });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') text = text || '這個問題 AI 無法回答，請換個方式問。';
    if (msg.stop_reason === 'max_tokens') text += '\n\n（回答太長被截斷，可以請它「繼續」。）';
    out.innerHTML = '<span class="who">AI 助理</span>' + esc(text);
    S.chat.push({ role: 'user', content: q }, { role: 'assistant', content: text });
    S.chat = S.chat.slice(-30); save();
  } catch (e) {
    if (AI.aborted) {
      out.innerHTML = '<span class="who">AI 助理</span>' + esc(text + (text ? '\n\n' : '') + '（已停止）');
      if (text) { S.chat.push({ role: 'user', content: q }, { role: 'assistant', content: text }); S.chat = S.chat.slice(-30); save(); }
      return;
    }
    const s = e && e.status;
    const msg = s === 401 ? '金鑰無效，請檢查 API 金鑰。' : s === 429 ? '請求太頻繁或額度用完，稍後再試。' : s >= 500 ? 'AI 服務暫時忙碌，稍後再試。' : '連線失敗：' + (e && e.message || e);
    out.innerHTML = '<span class="who">AI 助理</span>' + esc(msg);
  } finally { AI.busy = false; AI.stream = null; btn.textContent = '直接問 AI'; }
}

// ---------- 外觀（自動／淺色／深色） ----------
const THEMES = ['auto', 'light', 'dark'], THEME_LABEL = { auto: '自動', light: '淺色', dark: '深色' };
function applyTheme() {
  let t = 'auto'; try { t = localStorage.getItem('eng-theme') || 'auto'; } catch (e) {}
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').content = dark ? '#131417' : '#E9EAEC';
  $('#themeBtn').textContent = '外觀：' + THEME_LABEL[t];
  return t;
}
$('#themeBtn').onclick = () => { const t = THEMES[(THEMES.indexOf(applyTheme()) + 1) % 3]; try { localStorage.setItem('eng-theme', t); } catch (e) {} applyTheme(); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
applyTheme();

// ---------- 備份 ----------
$('#exportBtn').onclick = () => {
  const data = { ...S, apiKey: '' };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  a.download = `英文進程備份-${today()}.json`; a.click(); URL.revokeObjectURL(a.href);
};
$('#importBtn').onclick = () => $('#importFile').click();
$('#importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!Array.isArray(d.words)) throw new Error('格式不符');
    if (!confirm(`匯入會取代目前的紀錄（${d.words.length} 個單字、${(d.attempts || []).length} 次作答），確定？`)) return;
    const key = S.apiKey; S = Object.assign(blankState(), d, { apiKey: key }); save(); toast('已匯入'); route();
  } catch (err) { toast('匯入失敗：' + err.message); }
  e.target.value = '';
};

// ---------- 跑馬燈：新字與新文法 ----------
function renderTicker() {
  const track = $('#tkTrack'); if (!track) return;
  const pool = S.words.filter(w => w.isNew); const src = pool.length ? pool : S.words;
  const seed = Number(today().replace(/\D/g, '')) || 1;
  const pick = (arr, n, k) => { const out = []; for (let i = 0; i < Math.min(n, arr.length); i++) out.push(arr[(seed * k + i * 7) % arr.length]); return [...new Set(out)]; };
  const ws = pick(src, 8, 3), gs = pick(window.GRAMMAR || [], 8, 5);
  const items = [];
  for (let i = 0; i < Math.max(ws.length, gs.length); i++) {
    if (ws[i]) items.push(`<a class="tk-item" href="#/words?q=${encodeURIComponent(ws[i].en)}"><b class="tk-tag">新字</b><span class="tk-en">${esc(ws[i].en)}</span><span class="tk-zh">${esc(ws[i].zh)}</span></a>`);
    if (gs[i]) items.push(`<span class="tk-item"><b class="tk-tag g">新文法</b><span class="tk-en">${esc(gs[i].p)}</span><span class="tk-zh">${esc(gs[i].zh)}</span></span>`);
  }
  const html = items.join('');
  track.innerHTML = `<div class="tk-set">${html}</div><div class="tk-set" aria-hidden="true">${html.replace(/<a /g, '<a tabindex="-1" ')}</div>`;
  track.style.animationDuration = Math.max(40, items.length * 7) + 's';
  const el = $('#ticker'), btn = $('#tkBtn');
  const set = off => { el.classList.toggle('paused', off); btn.textContent = off ? '播放' : '暫停'; btn.setAttribute('aria-pressed', off); };
  set(!!S.tickerOff);
  btn.onclick = () => { S.tickerOff = !S.tickerOff; save(); set(S.tickerOff); };
}

// ---------- 啟動 ----------
document.addEventListener('keydown', e => {
  if (!location.hash.startsWith('#/study') || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (pending == null && current) { const m = { '1': 2, '2': 1, '3': 0 }[e.key]; if (m != null) reveal(m); }
  else if (pending != null && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
});
load();
renderTicker();
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/study')) current = null; route(); });
route();
})();
