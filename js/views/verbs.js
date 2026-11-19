// Verb course overview (#/verbs) and the table-check page for human review (#/verbs/check).
import { getCatalog, getDeck, itemKey } from '../decks.js';
import { verbProgress, STAGES, PERSON_EN } from '../verbs.js';
import { checkVerb, SHAPES, SHAPE_SLOT, fillShape, withFinal, rootLetters, skeleton } from '../verbcheck.js';
import { shapeSlots } from './verbcard.js';
import { counts } from '../session.js';
import { stripNiqqud } from '../hebrew.js';
import * as store from '../store.js';
import { esc, he, heb, toast, sayBtn } from '../ui.js';
import { loadIndex } from './grammar.js';

const verbDecks = () => getCatalog().filter((d) => d.kind === 'conjugation');
const first = (f) => (Array.isArray(f) ? f[0] : f);

export async function renderVerbs(app) {
  const gidx = await loadIndex();
  const explainers = gidx.sections.filter((s) => s.area === 'verbs').flatMap((s) => s.pages);
  const allVerbs = verbDecks().flatMap((d) => [...new Set(getDeck(d.id).items.map((i) => i.verb))]);
  const labRoots = [];
  for (const v of allVerbs) {
    const r = rootLetters(v.root).join('');
    if (r.length === 3 && !labRoots.includes(r)) labRoots.push(r);
  }
  const lab = { root: [...(labRoots[0] || 'כתב')], binyan: "pa'al", tense: 'inf' };

  function labHtml() {
    const shape = SHAPES[lab.binyan][lab.tense];
    const root = lab.root;
    const full = root.every(Boolean);
    const last = shape.spell.length - 1;
    const cells = [...shape.spell].map((ch, i) => (/[123]/.test(ch)
      ? `<span class="box-cell"><span class="box-root ${root[ch - 1] ? '' : 'empty'}">${esc(root[ch - 1] ? (i === last ? withFinal(root[ch - 1]) : root[ch - 1]) : '?')}</span><span class="box-num">${ch}</span></span>`
      : `<span class="box-cell"><span class="box-fixed">${esc(ch)}</span></span>`)).join('');
    const built = full ? withFinal(fillShape(shape.spell, root.join(''), lab.binyan)) : '';
    const plainBuilt = full ? fillShape(shape.spell, root.join(''), lab.binyan) : '';
    const real = full ? allVerbs.find((v) => v.binyanName === lab.binyan && skeleton(v.root) === root.join('')) : null;
    const realForm = real ? (lab.tense === 'inf' ? real.inf : first(real.forms[lab.tense]?.[SHAPE_SLOT[lab.tense]])) : null;
    const swapped = full && plainBuilt !== [...shape.spell].map((ch) => (/[123]/.test(ch) ? root[ch - 1] : ch)).join('');
    return `<section class="card lab">
      <div class="lab-head"><h2 style="margin:0">Binyan lab</h2><span class="small muted">pick a root and a pattern — watch the word build itself</span></div>
      <div class="lab-controls">
        <div class="lab-row"><span class="small muted">Root</span>
          <div class="seg">${labRoots.map((r) => `<button type="button" class="seg-btn ${r === root.join('') ? 'on' : ''}" data-lab-root="${esc(r)}" lang="he">${esc([...r].map((c, i) => (i === 2 ? withFinal(c) : c)).join('־'))}</button>`).join('')}</div>
          <span class="small muted">or type one:</span>
          <span class="lab-own" dir="rtl">${[0, 1, 2].map((i) => `<input class="box-in sm" data-lab-box="${i}" maxlength="2" value="${esc(root[i] || '')}" lang="he" dir="rtl" aria-label="root letter ${i + 1}">`).join('')}</span></div>
        <div class="lab-row"><span class="small muted">Pattern</span>
          <div class="seg">${Object.keys(SHAPES).map((b) => `<button type="button" class="seg-btn ${b === lab.binyan ? 'on' : ''}" data-lab-binyan="${esc(b)}">${esc(b)}</button>`).join('')}</div></div>
        <div class="lab-row"><span class="small muted">Form</span>
          <div class="seg">${['inf', 'present', 'past', 'future'].map((t) => `<button type="button" class="seg-btn ${t === lab.tense ? 'on' : ''}" data-lab-tense="${t}">${t === 'inf' ? 'infinitive' : `${t} (${SHAPES[lab.binyan][t].form.split(' /')[0]})`}</button>`).join('')}</div></div>
      </div>
      <div class="lab-out">
        <div class="box-row" dir="rtl">${cells}</div>
        <div class="lab-say">sounds like <b class="say">${esc(shape.say)}</b></div>
        ${full ? `<div class="lab-word">= ${he(built)}</div>` : '<div class="small muted">Fill all three root letters.</div>'}
        ${swapped ? '<p class="small">In hitpa\'el, a root starting with ס / שׁ / צ / ז swaps places with the ת (and ת becomes ט / ד after צ / ז).</p>' : ''}
        ${realForm ? `<div class="lab-real">Real verb: ${he(realForm)} ${sayBtn(realForm)} <span class="small muted">— to ${esc(real.en)}${real.weak ? ` · weak root (${esc(real.weak)}), so it bends the shape` : ''}</span></div>`
          : full ? '<p class="small muted">No verb in your decks uses this root in this pattern — not every root lives in every binyan, but this is the shape it would take.</p>' : ''}
      </div>
    </section>`;
  }
  function redrawLab() {
    const el = app.querySelector('.lab');
    if (el) el.outerHTML = labHtml();
  }

  const draw = () => {
    const st = store.get();
    const strict = store.settings().verbUnlock !== 'fast';
    app.innerHTML = `
      <div class="row" style="margin-bottom:6px"><h1 style="margin:0">Verb course</h1><span class="spacer"></span>
        <a class="btn btn-sm" href="#/verbs/check">Check the tables</a>
        <a class="btn btn-sm" href="#/practice">Verb workout</a></div>
      <p class="muted">Each verb moves through six stages. A stage unlocks only when every card in the one before is
        ${strict ? '<b>learnt and has survived a later review</b>' : '<b>learnt</b>'} — so you can't skip ahead, and if an earlier form slips,
        the verb waits for you to fix it before adding new forms.</p>
      <div class="section-title"><h2>Learn: how verbs work</h2><span class="small muted">read these alongside the drills</span></div>
      <div class="grid grid-2 grammar-list explainers">
        ${explainers.map((p) => `<a href="#/verbs/learn/${esc(p.id)}"><div class="card"><h3>${esc(p.title)} ${p.he ? he(p.he) : ''}</h3>
          <p class="muted small" style="margin:0">${esc(p.summary)}</p></div></a>`).join('')}
      </div>
      ${labHtml()}
      <div class="section-title"><h2>Drills: your verb course</h2></div>
      <div class="stage-legend">${STAGES.map((s) => `<span><b>${s.n}</b> ${esc(s.label)}</span>`).join('')}</div>
      ${verbDecks().map((d) => deckBlock(d, st)).join('')}
      <div class="notice notice-info" style="margin-top:20px">
        <b>How you're tested.</b> A new form starts as a multiple choice between real forms of the same verb (so you have to notice the
        person and gender), then you build it from letter tiles, and only then type it. Root and shape cards use letter boxes; the binyan
        card is a choice between the five patterns. Reviews rotate between four typed formats — conjugate from the infinitive,
        build from the root alone, fill the gap in a sentence, and transform a form you already know into another tense. Due verb cards are mixed across tenses, and the <a href="#/practice">verb workout</a>
        drills everything you've learnt without touching your schedule.
      </div>`;
  };

  function deckBlock(d, st) {
    const deck = getDeck(d.id);
    const verbs = [...new Set(deck.items.map((i) => i.verb))];
    const on = st.enabledDecks.includes(d.id);
    const c = counts(d.id);
    const binyan = deck.items[0]?.verb.binyanName;
    const shapes = SHAPES[binyan];
    return `<section class="card verb-deck">
      <div class="deck-head"><div><div class="deck-title">${esc(d.title)}</div>
        <div class="small muted">${c.due + c.learning} due · ${c.newAvail} new available · ${c.locked} locked</div></div>
        ${d.he ? he(d.he, 'deck-he') : ''}</div>
      ${shapes ? `<div class="shape-strip">${['inf', 'present', 'past', 'future'].map((t) => `<div><small>${t === 'inf' ? 'infinitive' : t}</small><b>${esc(shapes[t].say)}</b>${shapeSlots(shapes[t].spell)}</div>`).join('')}</div>` : ''}
      <table class="verb-progress"><tbody>
        ${verbs.map((v) => verbRow(deck.items, v)).join('')}
      </tbody></table>
      <div class="row">
        <label class="toggle"><input type="checkbox" data-toggle="${esc(d.id)}" ${on ? 'checked' : ''}> In daily mix</label>
        <span class="spacer"></span>
        ${d.grammar ? `<a class="btn btn-sm" href="#/verbs/learn/${esc(d.grammar)}">Explainer</a>` : ''}
        <a class="btn btn-sm" href="#/practice/${esc(d.id)}">Workout</a>
        <a class="btn btn-sm btn-primary" href="#/review/${esc(d.id)}">Study</a>
      </div>
    </section>`;
  }

  function verbRow(items, v) {
    const p = verbProgress(items, v);
    const cells = STAGES.map((s) => {
      const stg = p.stages.find((x) => x.n === s.n);
      if (!stg) return '<td class="stg na" title="Not used for this verb">–</td>';
      let cls = 'locked', txt = '🔒', title = 'Locked — finish the earlier stage first';
      if (stg.done === stg.total) { cls = 'done'; txt = '✓'; title = 'Done'; }
      else if (s.n <= p.current) { cls = stg.started ? 'active' : 'open'; txt = `${stg.done}/${stg.total}`; title = stg.started ? 'In progress (proven / total)' : 'Unlocked — new cards will appear in your reviews'; }
      return `<td class="stg ${cls}" title="${esc(s.label)}: ${esc(title)}">${txt}</td>`;
    }).join('');
    return `<tr><td class="vname">${he(v.inf)} <span class="muted small">to ${esc(v.en)}</span>
      ${v.weak ? `<span class="chip" title="Weak root">${esc(v.weak)}</span>` : ''}
      ${v.review?.status === 'checked' ? '<span class="chip chip-casual" title="Checked by a native speaker">✓</span>' : ''}</td>${cells}</tr>`;
  }

  function onLabClick(e) {
    const b = e.target.closest('[data-lab-root], [data-lab-binyan], [data-lab-tense]');
    if (!b) return;
    if (b.dataset.labRoot) lab.root = [...b.dataset.labRoot];
    if (b.dataset.labBinyan) lab.binyan = b.dataset.labBinyan;
    if (b.dataset.labTense) lab.tense = b.dataset.labTense;
    redrawLab();
  }
  function onLabInput(e) {
    const t = e.target.closest('[data-lab-box]');
    if (!t) return;
    const k = Number(t.dataset.labBox);
    const ch = [...stripNiqqud(t.value).replace(/[^א-ת]/g, '')].pop() || '';
    lab.root[k] = skeleton(ch);
    redrawLab();
    const next = app.querySelector(`[data-lab-box="${ch ? Math.min(k + 1, 2) : k}"]`);
    if (next) { next.focus(); next.select(); }
  }

  function onChange(e) {
    const t = e.target.closest('[data-toggle]');
    if (!t) return;
    const st = store.get();
    const id = t.dataset.toggle;
    st.enabledDecks = t.checked ? [...new Set([...st.enabledDecks, id])] : st.enabledDecks.filter((x) => x !== id);
    store.save();
    draw();
  }
  app.addEventListener('change', onChange);
  app.addEventListener('click', onLabClick);
  app.addEventListener('input', onLabInput);
  draw();
  return () => { app.removeEventListener('change', onChange); app.removeEventListener('click', onLabClick); app.removeEventListener('input', onLabInput); };
}

/** Every table on one page, with the automatic check results — made to hand to a teacher or native speaker. */
export function renderVerbCheck(app) {
  const st = store.get();
  let plain = '';
  let errors = 0, warns = 0;
  const blocks = verbDecks().map((d) => {
    const deck = getDeck(d.id);
    const verbs = [...new Set(deck.items.map((i) => i.verb))];
    return `<h2>${esc(d.title)}</h2>` + verbs.map((v) => {
      const issues = checkVerb(v, v.binyanName).filter((i) => i.where !== 'review');
      errors += issues.filter((i) => i.level === 'error').length;
      warns += issues.filter((i) => i.level === 'warn').length;
      plain += `\n${stripNiqqud(v.inf)} (${v.binyanName}, root ${v.root}) — to ${v.en}\n`;
      const flaggedHere = Object.keys(st.flagged).filter((k) => k.startsWith(`${d.id}/${v.id}-`));
      const tables = Object.entries(v.forms).map(([tense, forms]) => {
        plain += `  ${tense}: ${Object.entries(forms).map(([p, f]) => `${p} ${first(f)}`).join(' · ')}\n`;
        return `<div class="check-tense"><h4>${esc(tense === 'imp' ? 'commands' : tense)}</h4><table>${Object.entries(forms).map(([p, f]) => {
          const key = `${d.id}/${v.id}-${tense}-${p}`;
          const fl = st.flagged[key];
          return `<tr class="${fl ? 'flag-row' : ''}"><td>${esc(PERSON_EN[tense === 'imp' ? `imp-${p}` : p])}</td><td lang="he" class="he">${esc(heb(first(f)))}</td>
            <td class="small muted">${Array.isArray(f) && f.length > 1 ? 'also: ' + esc(f.slice(1).join(', ')) : ''}${fl ? ' <b class="flagged">⚑ flagged</b>' : ''}</td></tr>`;
        }).join('')}</table></div>`;
      }).join('');
      return `<section class="card check-verb">
        <div class="deck-head"><div><span class="conj-verb">${he(v.inf)}</span> <span class="muted">to ${esc(v.en)} · ${esc(v.binyanName)} · root ${he(v.root)}</span></div>
          ${v.review?.status === 'checked' ? `<span class="chip chip-casual">✓ checked${v.review.by ? ' by ' + esc(v.review.by) : ''}</span>` : '<span class="chip">⚠ not yet checked</span>'}</div>
        ${v.weak ? `<p class="small">Weak root: <b>${esc(v.weak)}</b> — shape-based cards are switched off for this verb.</p>` : ''}
        ${issues.length ? `<ul class="issues">${issues.map((i) => `<li class="${i.level}"><b>${i.level === 'error' ? 'Error' : 'Check'}</b> [${esc(i.where)}] ${esc(i.msg)}</li>`).join('')}</ul>` : '<p class="small ok">✓ Passed the automatic checks (vowel points, final letters, root letters, person prefixes/endings, binyan shape).</p>'}
        ${flaggedHere.length ? `<p class="small flagged">${flaggedHere.length} form(s) flagged by you.</p>` : ''}
        <div class="check-grid">${tables}</div>
      </section>`;
    }).join('');
  }).join('');

  app.innerHTML = `
    <p><a href="#/verbs" class="small">← Verb course</a></p>
    <h1>Check the verb tables</h1>
    <p class="muted">Wrong conjugations are worse than none, so every table goes through three layers of checking:</p>
    <ol class="muted">
      <li><b>Automatic checks</b> (on this page, and on every change to the site): vowel points present, final letters in the right place, root letters in order, the right prefix or ending for each person, "you (m)" = "she" in the future, and the binyan's signature shape for regular verbs.</li>
      <li><b>Your flags</b> — the "This looks wrong" button on any verb card, highlighted below.</li>
      <li><b>A human review</b> — each verb shows "not yet checked" until a native speaker or teacher signs it off. Copy the tables below and send them to your tutor; corrections and sign-offs go into the data files (<code>review.status: "checked"</code>).</li>
    </ol>
    <div class="row" style="margin:12px 0"><span class="chip ${errors ? 'chip-slang' : 'chip-casual'}">${errors} error(s)</span><span class="chip">${warns} to look at</span>
      <span class="spacer"></span><button class="btn btn-sm" data-act="copy">Copy all tables as text</button></div>
    ${blocks}`;

  app.querySelector('[data-act="copy"]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(plain.trim()); toast('Copied — paste it into a message to your tutor'); }
    catch { const w = window.open('', '_blank'); if (w) { w.document.body.innerText = plain; } }
  });
}
