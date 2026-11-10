import * as store from '../store.js';
import * as tts from '../tts.js';
import { cards } from '../decks.js';
import { esc, he, toast } from '../ui.js';

export function renderSettings(app) {
  const draw = () => {
    const s = store.settings();
    const st = store.get();
    const flagged = Object.keys(st.flagged);
    const cardMap = cards();
    const flaggedItems = flagged.map((k) => cardMap.get(`${k}:w`)?.item || cardMap.get(`${k}:r`)?.item).filter(Boolean);
    const voiceNote = !tts.supported()
      ? 'This browser has no speech support.'
      : tts.hasHebrewVoice() ? 'A Hebrew voice is available.' : 'No Hebrew voice found yet. On iPhone/Mac, add “Carmit” under Settings → Accessibility → Spoken Content → Voices. On Windows, add the Hebrew language pack.';

    app.innerHTML = `
      <h1>Settings</h1>
      <div class="grid grid-2">
        <section class="card">
          <h2>Daily study</h2>
          <label class="switch"><span>New cards per day<div class="field-hint">10 is a comfortable pace. Each new card adds future reviews.</div></span><input type="number" min="0" max="100" data-set="newPerDay" value="${s.newPerDay}"></label>
          <label class="switch"><span>Maximum reviews per day</span><input type="number" min="10" max="2000" data-set="maxReviews" value="${s.maxReviews}"></label>
          <label class="switch"><span>Target retention<div class="field-hint">How sure you want to be of remembering when a card comes back. Higher = more reviews.</div></span>
            <select data-set="retention">${[0.8, 0.85, 0.9, 0.93, 0.95].map((r) => `<option value="${r}" ${s.retention === r ? 'selected' : ''}>${Math.round(r * 100)}%</option>`).join('')}</select></label>
        </section>
        <section class="card">
          <h2>Display &amp; audio</h2>
          <label class="switch"><span>Show vowel points (niqqud)<div class="field-hint">Shown on prompts and answers. You never need to type them.</div></span><input type="checkbox" data-set="niqqud" ${s.niqqud ? 'checked' : ''}></label>
          <label class="switch"><span>Show reading cards in cursive<div class="field-hint">Handwriting practice on every reading card. You can also flip a single card with the ✍ button or the C key.</div></span><input type="checkbox" data-set="cursiveReading" ${s.cursiveReading ? 'checked' : ''}></label>
          <label class="switch"><span>Audio (text-to-speech)<div class="field-hint">${esc(voiceNote)}</div></span><input type="checkbox" data-set="audio" ${s.audio ? 'checked' : ''} ${tts.supported() ? '' : 'disabled'}></label>
          <label class="switch"><span>Play audio automatically</span><input type="checkbox" data-set="autoplay" ${s.autoplay ? 'checked' : ''}></label>
          <label class="switch"><span>Speech speed</span><select data-set="rate">${[[0.7, 'Slow'], [0.9, 'Relaxed'], [1, 'Normal']].map(([r, l]) => `<option value="${r}" ${s.rate === r ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <div class="row" style="padding-top:12px"><button class="btn btn-sm" data-act="test-voice" ${tts.enabled() ? '' : 'disabled'}>Test voice: ${he('מָה נִשְׁמָע?')}</button></div>
          <label class="switch"><span>Theme</span><select data-set="theme">${['auto', 'light', 'dark'].map((t) => `<option ${s.theme === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        </section>
      </div>

      <section class="card" style="margin-top:16px">
        <h2>Backup</h2>
        <p class="muted">Your progress lives only in this browser. If you clear your browsing data or switch devices, it's gone unless you have a backup file.</p>
        <div class="row">
          <button class="btn btn-primary" data-act="export">Download backup</button>
          <label class="btn">Restore from backup<input type="file" accept="application/json,.json" data-act="import" hidden></label>
          <span class="spacer"></span>
          <span class="small muted">${st.lastExport ? 'Last backup: ' + new Date(st.lastExport).toLocaleDateString() : 'No backup yet'}</span>
        </div>
      </section>

      <section class="card" style="margin-top:16px">
        <h2>Flagged items (${flaggedItems.length})</h2>
        ${flaggedItems.length ? `<p class="muted small">Things you marked as wrong or unnatural. Copy this list into a GitHub issue so the content can be fixed.</p>
          <textarea readonly rows="${Math.min(10, flaggedItems.length + 1)}" style="font-family:var(--font-he)">${esc(flaggedItems.map((i) => `${i.deck}/${i.id}: ${i.he} = ${i.en}`).join('\n'))}</textarea>`
          : '<p class="muted small" style="margin:0">Nothing flagged. Use the flag button on the Words page.</p>'}
      </section>

      <section class="card" style="margin-top:16px">
        <h2>Danger zone</h2>
        <div class="row"><button class="btn btn-danger" data-act="reset">Erase all progress</button></div>
      </section>
    `;
  };

  function onChange(e) {
    const t = e.target;
    if (t.dataset.set) {
      const k = t.dataset.set;
      let v = t.type === 'checkbox' ? t.checked : t.value;
      if (['newPerDay', 'maxReviews'].includes(k)) v = Math.max(0, parseInt(v, 10) || 0);
      if (['retention', 'rate'].includes(k)) v = parseFloat(v);
      store.setSetting(k, v);
      if (k === 'theme') {
        if (v === 'auto') delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = v;
      }
      if (t.type !== 'number') draw();
      return;
    }
    if (t.dataset.act === 'import' && t.files?.[0]) {
      const r = new FileReader();
      r.onload = () => {
        try {
          if (!confirm('Replace your current progress with this backup?')) return;
          store.importJSON(r.result);
          toast('Backup restored');
          setTimeout(() => location.reload(), 600);
        } catch (err) { alert(err.message); }
      };
      r.readAsText(t.files[0]);
    }
  }

  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'test-voice') tts.speak('מה נשמע? הכול טוב, תודה.');
    if (act === 'export') {
      store.get().lastExport = Date.now();
      store.flushSave();
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `hebrew-practice-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      draw();
    }
    if (act === 'reset') {
      if (confirm('Erase ALL progress, settings and your own words? This cannot be undone.') && confirm('Really erase everything?')) {
        store.resetAll();
        toast('Everything erased');
        draw();
      }
    }
  }

  app.addEventListener('change', onChange);
  app.addEventListener('click', onClick);
  draw();
  return () => { app.removeEventListener('change', onChange); app.removeEventListener('click', onClick); };
}
