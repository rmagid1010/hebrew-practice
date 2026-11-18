// Scenarios (#/scenarios): realistic conversations, one per course lesson, unlocked by lesson progress.
import * as store from '../store.js';
import * as tts from '../tts.js';
import { esc, he, heb, sayBtn, mixed } from '../ui.js';
import { checkElements, stripNiqqud } from '../hebrew.js';
import { checkAgreement } from '../gender.js';
import { fill, personaFor, listenerOf } from '../scenariocore.js';
import { lessonStatuses, UNLOCK_SHARE } from '../course.js';

let data = null;
export async function loadScenarios() {
  if (!data) data = (await (await fetch('data/scenarios.json')).json()).scenarios;
  return data;
}

/** Each scenario with its lesson, whether it's open, and your record. */
export function scenarioStatuses() {
  const lessons = lessonStatuses();
  return (data || []).map((s) => {
    const i = lessons.findIndex((x) => x.lesson.id === s.lesson);
    const x = lessons[i];
    const open = !!x && (x.skipped || x.stats.share >= UNLOCK_SHARE);
    return { s, n: i + 1, lesson: x?.lesson, stats: x?.stats, open, rec: store.get().scenarios?.[s.id] || null };
  });
}

const youTurns = (s) => s.turns.filter((t) => t.t === 'you').length;
const genderName = { m: '♂ a man', f: '♀ a woman' };

export async function renderScenarios(app) {
  await loadScenarios();
  const draw = () => {
    const list = scenarioStatuses();
    const as = store.settings().scenarioAs || 'alt';
    const open = list.filter((x) => x.open).length;
    app.innerHTML = `
      <h1>Scenarios <span class="he muted" lang="he">סִימוּלַצְיוֹת</span></h1>
      <p class="lead muted">Real conversations on the streets of Tel Aviv. Someone talks to you, and you answer in your own words.
        A new scenario opens each time you've learnt ${Math.round(UNLOCK_SHARE * 100)}% of a course lesson, using that lesson's words and everything before it.
        Scenarios are optional and don't change your review schedule.</p>
      <section class="card scen-options">
        <div class="seg" role="radiogroup" aria-label="Play as">
          <span class="small muted">Play as</span>
          ${[['alt', 'Switch each time'], ['m', '♂ Man'], ['f', '♀ Woman']].map(([v, l]) => `<button class="seg-btn ${as === v ? 'on' : ''}" data-as="${v}" role="radio" aria-checked="${as === v}">${l}</button>`).join('')}
        </div>
        <label class="switch"><span>Show English translations<div class="field-hint">Off: tap “EN” on a line when you're stuck.</div></span>
          <input type="checkbox" data-set="scenarioEnglish" ${store.settings().scenarioEnglish ? 'checked' : ''}></label>
      </section>
      <p class="small muted">${open} of ${list.length} open.</p>
      ${['A1', 'A2'].map((lv) => `
        <div class="section-title"><h2>${lv === 'A1' ? 'A1 · Getting by' : 'A2 · Living here'}</h2></div>
        <div class="grid grid-2">
          ${list.filter((x) => x.lesson?.level === lv).map(tile).join('')}
        </div>`).join('')}`;
  };
  function tile(x) {
    const { s, n, open, rec, stats } = x;
    const total = youTurns(s);
    const status = !open
      ? `<span class="chip">🔒 Lesson ${n}: ${Math.round((stats?.share || 0) * 100)}% learnt, opens at ${Math.round(UNLOCK_SHARE * 100)}%</span>`
      : rec ? `<span class="chip chip-good">★ best ${rec.best}/${total}${rec.plays > 1 ? ` · played ${rec.plays}×` : ''}</span>` : '<span class="chip chip-casual">new</span>';
    const body = `<div class="card scen-tile ${open ? '' : 'locked'}">
        <div class="scen-head"><span class="lesson-n">${n}</span><div><h3>${esc(s.title)}</h3>${he(s.he, 'muted')}</div></div>
        <p class="small muted">${esc(s.setting)}</p>
        <div class="row">${status}<span class="spacer"></span>${open ? '<span class="btn btn-sm btn-primary">Play</span>' : `<span class="small"><u>Lesson ${n}</u></span>`}</div>
      </div>`;
    return `<a class="scen-link" href="${open ? `#/scenarios/${s.id}` : `#/course/${x.lesson?.id}`}">${body}</a>`;
  }
  const onClick = (e) => {
    const b = e.target.closest('[data-as]');
    if (b) { store.setSetting('scenarioAs', b.dataset.as); draw(); }
  };
  const onChange = (e) => {
    const t = e.target.closest('[data-set]');
    if (t) { store.setSetting(t.dataset.set, t.checked); draw(); }
  };
  app.addEventListener('click', onClick);
  app.addEventListener('change', onChange);
  draw();
  return () => { app.removeEventListener('click', onClick); app.removeEventListener('change', onChange); };
}

export async function renderScenario(app, id) {
  await loadScenarios();
  const x = scenarioStatuses().find((y) => y.s.id === id);
  if (!x) { app.innerHTML = '<div class="card"><h2>Scenario not found</h2><a href="#/scenarios">All scenarios</a></div>'; return; }
  if (!x.open) {
    app.innerHTML = `<div class="card"><h2>🔒 ${esc(x.s.title)}</h2><p class="muted">This scenario opens when ${Math.round(UNLOCK_SHARE * 100)}% of
      <a href="#/course/${x.lesson.id}">lesson ${x.n}: ${esc(x.lesson.title)}</a> is learnt (now ${Math.round(x.stats.share * 100)}%).</p><a class="btn" href="#/scenarios">All scenarios</a></div>`;
    return;
  }
  const s = x.s;
  const total = youTurns(s);
  const pref = store.settings().scenarioAs || 'alt';
  let g = pref === 'alt' ? ((x.rec?.lastAs === 'm') ? 'f' : x.rec?.lastAs === 'f' ? 'm' : 'm') : pref;
  let phase = 'intro';     // intro | ask | answered | end
  let idx = 0;             // next turn to process
  let log = [];            // rendered transcript entries
  let score = 0;
  let tries = 0;           // attempts at the current turn
  let current = null;      // the current 'you' turn index
  let result = null;       // last check result
  let hint = false;
  let showEn = !!store.settings().scenarioEnglish;
  const shownEn = new Set();

  const cast = (who) => s.cast[who] || { name: '?', he: '', g: '' };

  function advance() {
    const last = log[log.length - 1];
    if (last?.kind === 'you') last.final = true; // moving on: show the model answer
    let lastSpoken = null;
    while (idx < s.turns.length && s.turns[idx].t !== 'you') {
      const t = s.turns[idx];
      log.push({ kind: t.t, turn: idx });
      if (t.t === 'npc') lastSpoken = fill(t.he, g);
      idx++;
    }
    if (idx < s.turns.length) { current = idx; idx++; phase = 'ask'; tries = 0; hint = false; result = null; }
    else finish();
    draw();
    if (lastSpoken && store.settings().autoplay) tts.speak(lastSpoken);
  }

  function finish() {
    phase = 'end';
    const st = store.get();
    st.scenarios = st.scenarios || {};
    const rec = st.scenarios[s.id] || { plays: 0, best: 0 };
    st.scenarios[s.id] = { plays: rec.plays + 1, best: Math.max(rec.best, score), total, last: Date.now(), lastAs: g };
    store.save();
  }

  function check(text) {
    const t = s.turns[current];
    const results = checkElements(text, t.elements);
    const gender = checkAgreement(text, personaFor(s, current, g)).map((e) => e.msg);
    const ok = text.trim() && results.every((r) => r.ok) && !gender.length;
    tries++;
    if (ok && tries === 1) score++;
    result = { text, results, gender, ok, gaveUp: !text.trim() };
    log.push({ kind: 'you', turn: current, ...result });
    phase = 'answered';
    draw();
  }

  function npcHtml(e) {
    const t = s.turns[e.turn];
    const c = cast(t.who);
    const line = fill(t.he, g);
    const en = showEn || shownEn.has(e.turn);
    return `<div class="bubble npc who-${c.g}">
      <div class="bubble-name">${esc(c.name)} <span class="he" lang="he">${esc(c.he)}</span></div>
      <div class="bubble-row"><div class="bubble-he he" lang="he" dir="rtl">${esc(heb(line))}</div>${sayBtn(line)}</div>
      ${en ? `<div class="bubble-en">${esc(t.en)}</div>` : `<button class="btn btn-ghost btn-xs" data-en="${e.turn}">EN</button>`}
    </div>`;
  }
  function youHtml(e) {
    const t = s.turns[e.turn];
    const model = fill(t.model, g);
    const miss = e.results.filter((r) => !r.ok);
    const fb = e.gaveUp ? '<div class="small muted">You could say:</div>'
      : e.ok ? '<div class="fb ok">✓ Good answer</div>'
      : `<div class="fb bad">${e.gender.length ? `<ul class="gender-errors" dir="ltr">${e.gender.map((m) => `<li>⚥ ${mixed(m)}</li>`).join('')}</ul>` : ''}
          ${miss.length ? `<div class="small">Missing: ${miss.map((r) => `<b>${esc(r.label)}</b> (e.g. ${he(r.any[0])})`).join(' · ')}</div>` : ''}</div>`;
    return `<div class="bubble you ${e.ok ? 'ok' : e.gaveUp ? '' : 'bad'}">
      ${e.gaveUp ? '' : `<div class="bubble-he he" lang="he" dir="rtl">${esc(e.text)}</div>`}
      ${fb}
      ${e.ok || e.gaveUp || e.final ? `<div class="bubble-model"><span class="small muted">${e.ok ? 'A local might say' : 'Model answer'}</span>
        <div class="bubble-row"><div class="he" lang="he" dir="rtl">${esc(heb(model))}</div>${sayBtn(model)}</div></div>` : ''}
    </div>`;
  }
  function transcript() {
    return log.map((e) => e.kind === 'npc' ? npcHtml(e) : e.kind === 'narr' ? `<div class="narr">${esc(s.turns[e.turn].en)}</div>` : youHtml(e)).join('');
  }
  function askHtml() {
    const t = s.turns[current];
    const to = cast(listenerOf(s, current));
    return `<div class="scen-ask">
      <div class="scen-cue"><span class="who-mini who-${g}">${g === 'f' ? '♀' : '♂'} you</span>
        <span class="who-mini who-t${to.g}">→ ${esc(to.name)} ${to.g === 'f' ? '♀' : '♂'}</span> ${esc(t.cue)}</div>
      ${hint ? `<div class="scen-hint small">Include: ${t.elements.map((el) => `<span><b>${esc(el.label)}</b> ${he(el.any[0])}</span>`).join(' · ')}</div>` : ''}
      <form data-form="say" autocomplete="off">
        <textarea class="answer-input write-input" name="say" lang="he" dir="rtl" rows="2" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${g === 'f' ? 'מָה אַתְּ אוֹמֶרֶת?' : 'מָה אַתָּה אוֹמֵר?'}" aria-label="Your reply in Hebrew"></textarea>
        <div class="input-actions">
          ${hint ? '' : '<button type="button" class="btn btn-ghost btn-sm" data-act="hint">Hint</button>'}
          <button type="button" class="btn btn-ghost btn-sm" data-act="giveup">I don't know</button>
          <span class="kbd-hint"><kbd>Enter</kbd> to say it</span>
          <button class="btn btn-primary" type="submit">Say it</button>
        </div>
      </form>
    </div>`;
  }
  function answeredHtml() {
    return `<div class="scen-ask row" style="justify-content:center">
      ${result.ok ? '' : '<button class="btn" data-act="retry">Try again</button>'}
      <button class="btn btn-primary" data-act="next">${s.turns.slice(idx).some((t) => t.t === 'you') ? 'Continue' : 'Finish'} ↵</button></div>`;
  }

  function draw() {
    if (phase === 'intro') {
      app.innerHTML = `<div class="card scen-intro">
        <p><a href="#/scenarios" class="small">← All scenarios</a></p>
        <div class="small muted">Scenario ${x.n} · after lesson ${x.n}: ${esc(x.lesson.title)}</div>
        <h1>${esc(s.title)} ${he(s.he, 'muted')}</h1>
        <p class="lead">${esc(s.setting)}</p>
        <div class="scen-cast">${Object.values(s.cast).map((c) => `<div class="cast who-${c.g}"><b>${esc(c.name)}</b> <span class="he" lang="he">${esc(c.he)}</span>
          <span class="who-mini who-${c.g}">${c.g === 'f' ? '♀' : '♂'}</span><div class="small muted">${esc(c.role)}</div></div>`).join('')}</div>
        <div class="seg" role="radiogroup" aria-label="You are">
          <span class="small muted">You are</span>
          ${['m', 'f'].map((v) => `<button class="seg-btn ${g === v ? 'on' : ''}" data-g="${v}">${genderName[v]}</button>`).join('')}
        </div>
        <p class="small muted">${total} things to say. Answer in your own words: you need the key parts, and every verb and adjective has to match your gender and theirs.
          Your first try counts for the score, but you can always try again.</p>
        <div class="row" style="justify-content:center"><button class="btn btn-primary btn-lg" data-act="start">Start ↵</button></div>
      </div>`;
      return;
    }
    if (phase === 'end') {
      const next = scenarioStatuses().find((y) => y.n === x.n + 1);
      app.innerHTML = `<div class="card scen-chat">${transcript()}</div>
        <div class="card done"><div class="big">${score === total ? '🎉' : score >= total / 2 ? '👏' : '💪'}</div>
          <h1>${score}/${total} first time</h1>
          <p class="muted">${score === total ? 'Perfect — that sounded like a local.' : 'Play it again until it flows. Try it as the other gender too.'}</p>
          <div class="row" style="justify-content:center">
            <a class="btn" href="#/scenarios">All scenarios</a>
            <button class="btn" data-act="again" data-g="${g === 'm' ? 'f' : 'm'}">Play again as ${genderName[g === 'm' ? 'f' : 'm']}</button>
            ${next?.open ? `<a class="btn btn-primary" href="#/scenarios/${next.s.id}">Next: ${esc(next.s.title)} →</a>` : ''}
          </div></div>`;
      return;
    }
    app.innerHTML = `<div class="review-top"><a class="btn btn-ghost btn-sm" href="#/scenarios">← Scenarios</a>
        <span class="chip">${esc(s.title)}</span><span class="spacer"></span>
        <span class="small muted">reply ${s.turns.slice(0, current + 1).filter((t) => t.t === 'you').length} of ${total}</span>
        <button class="btn btn-ghost btn-sm" data-act="toggle-en">${showEn ? 'Hide' : 'Show'} English</button></div>
      <div class="card scen-chat">${transcript()}${phase === 'ask' ? askHtml() : answeredHtml()}</div>`;
    const ta = app.querySelector('textarea');
    if (ta) ta.focus();
    const end = app.querySelector('.scen-ask');
    if (end) end.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }

  function onClick(e) {
    const en = e.target.closest('[data-en]');
    if (en) { shownEn.add(Number(en.dataset.en)); draw(); return; }
    const gb = e.target.closest('[data-g]');
    if (gb && phase === 'intro') { g = gb.dataset.g; draw(); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'start') advance();
    else if (act === 'hint') { hint = true; draw(); }
    else if (act === 'giveup') { tries++; result = { text: '', results: [], gender: [], ok: false, gaveUp: true }; log.push({ kind: 'you', turn: current, ...result }); phase = 'answered'; draw(); }
    else if (act === 'retry') { phase = 'ask'; draw(); }
    else if (act === 'next') advance();
    else if (act === 'toggle-en') { showEn = !showEn; draw(); }
    else if (act === 'again') { g = b.dataset.g; idx = 0; log = []; score = 0; shownEn.clear(); phase = 'intro'; draw(); }
  }
  function onSubmit(e) {
    const f = e.target.closest('[data-form="say"]');
    if (!f) return;
    e.preventDefault();
    if (f.say.value.trim()) check(f.say.value);
  }
  function onKey(e) {
    if (e.target.matches('textarea') && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault(); if (e.target.value.trim()) check(e.target.value); return;
    }
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === 'Enter' && (phase === 'intro' || phase === 'answered')) { e.preventDefault(); advance(); }
  }
  app.addEventListener('click', onClick);
  app.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKey);
  draw();
  return () => { tts.stop(); app.removeEventListener('click', onClick); app.removeEventListener('submit', onSubmit); document.removeEventListener('keydown', onKey); };
}
