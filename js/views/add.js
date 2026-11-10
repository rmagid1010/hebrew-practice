import * as store from '../store.js';
import { rebuildCustom } from '../decks.js';
import { hasHebrew } from '../hebrew.js';
import { esc, he, toast } from '../ui.js';

export function renderAdd(app) {
  const draw = () => {
    const mine = store.get().custom;
    app.innerHTML = `
      <h1>Add your own words</h1>
      <p class="muted">Heard something at the shuk or from a friend? Add it here — it goes into the <b>My Words</b> deck and gets scheduled like everything else.</p>
      <form class="card stack" id="add-form" autocomplete="off">
        <div class="grid grid-2">
          <label class="field"><span>Hebrew</span><input type="text" name="he" lang="he" dir="rtl" required placeholder="למשל: חבל על הזמן"><div class="field-hint">Vowel points optional. This is the answer you'll be tested on.</div></label>
          <label class="field"><span>English meaning</span><input type="text" name="en" required placeholder="e.g. amazing (lit. a waste of time)"></label>
        </div>
        <div class="grid grid-2">
          <label class="field"><span>Other accepted spellings / forms</span><input type="text" name="alt" lang="he" dir="rtl" placeholder="separate with commas"></label>
          <label class="field"><span>Register</span><select name="reg"><option value="slang">Slang</option><option value="casual" selected>Casual</option><option value="neutral">Neutral</option><option value="formal">Formal</option></select></label>
        </div>
        <label class="field"><span>Hint shown with the English prompt (optional)</span><input type="text" name="hint" placeholder="e.g. (to a woman)"></label>
        <label class="field"><span>Note (optional)</span><textarea name="note" placeholder="When do people say it? Who said it to you?"></textarea></label>
        <div class="grid grid-2">
          <label class="field"><span>Example sentence (Hebrew, optional)</span><input type="text" name="exhe" lang="he" dir="rtl"></label>
          <label class="field"><span>Example translation</span><input type="text" name="exen"></label>
        </div>
        <div class="row"><span class="spacer"></span><button class="btn btn-primary" type="submit">Add to My Words</button></div>
      </form>
      <div class="section-title"><h2>My words (${mine.length})</h2>${mine.length ? '<a class="small" href="#/review/mine">Study them →</a>' : ''}</div>
      ${mine.length ? `<div class="card">${mine.slice().reverse().map((it) => `<div class="word">
        <div class="word-he">${he(it.he)}</div><div><div class="word-en">${esc(it.en)}</div>${it.note ? `<div class="word-sub">${esc(it.note)}</div>` : ''}</div>
        <div class="word-actions"><button class="btn btn-sm btn-ghost btn-danger" data-del="${esc(it.id)}">Delete</button></div></div>`).join('')}</div>` : '<p class="muted">Nothing yet.</p>'}
    `;
  };

  function onSubmit(e) {
    if (e.target.id !== 'add-form') return;
    e.preventDefault();
    const f = e.target;
    const heVal = f.he.value.trim();
    if (!hasHebrew(heVal)) { toast('The Hebrew field needs Hebrew letters'); return; }
    const item = {
      id: 'c' + Date.now().toString(36),
      he: heVal,
      en: f.en.value.trim(),
      alt: f.alt.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      reg: f.reg.value,
      hint: f.hint.value.trim() || undefined,
      note: f.note.value.trim() || undefined,
      ex: f.exhe.value.trim() ? [[f.exhe.value.trim(), f.exen.value.trim()]] : undefined,
    };
    const st = store.get();
    st.custom.push(item);
    if (!st.enabledDecks.includes('mine')) st.enabledDecks.push('mine');
    store.save();
    rebuildCustom();
    toast('Added!');
    draw();
    app.querySelector('input[name="he"]').focus();
  }

  function onClick(e) {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    if (!confirm('Delete this word and its review history?')) return;
    const st = store.get();
    const id = b.dataset.del;
    st.custom = st.custom.filter((x) => x.id !== id);
    for (const t of ['r', 'w']) delete st.cards[`mine/${id}:${t}`];
    store.save();
    rebuildCustom();
    draw();
  }

  app.addEventListener('submit', onSubmit);
  app.addEventListener('click', onClick);
  draw();
  return () => { app.removeEventListener('submit', onSubmit); app.removeEventListener('click', onClick); };
}
