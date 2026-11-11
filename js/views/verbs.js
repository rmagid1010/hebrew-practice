// Verb course overview (#/verbs) and the table-check page for human review (#/verbs/check).
import { getCatalog, getDeck, itemKey } from '../decks.js';
import { verbProgress, STAGES, PERSON_EN } from '../verbs.js';
import { checkVerb, SHAPES, shapeBlanks } from '../verbcheck.js';
import { counts } from '../session.js';
import { stripNiqqud } from '../hebrew.js';
import * as store from '../store.js';
import { esc, he, heb, toast } from '../ui.js';
import { loadIndex } from './grammar.js';

const verbDecks = () => getCatalog().filter((d) => d.kind === 'conjugation');
const first = (f) => (Array.isArray(f) ? f[0] : f);

export async function renderVerbs(app) {
  const gidx = await loadIndex();
  const explainers = gidx.sections.filter((s) => s.area === 'verbs').flatMap((s) => s.pages);
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
      <div class="section-title"><h2>Drills: your verb course</h2></div>
      <div class="stage-legend">${STAGES.map((s) => `<span><b>${s.n}</b> ${esc(s.label)}</span>`).join('')}</div>
      ${verbDecks().map((d) => deckBlock(d, st)).join('')}
      <div class="notice notice-info" style="margin-top:20px">
        <b>How you're tested.</b> New cards show you the binyan's shape. Reviews rotate between four formats — conjugate from the infinitive,
        build from the root alone, fill the gap in a sentence, and transform a form you already know into another tense — so you have to
        produce the form, not recognize a prompt. Due verb cards are mixed across tenses, and the <a href="#/practice">verb workout</a>
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
      ${shapes ? `<div class="shape-strip">${['inf', 'present', 'past', 'future'].map((t) => `<div><small>${t === 'inf' ? 'infinitive' : t}</small><b>${esc(shapes[t].say)}</b><span class="he" lang="he">${esc(shapeBlanks(shapes[t].spell))}</span></div>`).join('')}</div>` : ''}
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
  draw();
  return () => app.removeEventListener('change', onChange);
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
