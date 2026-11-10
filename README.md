# Hebrew Practice — עברית בשכונה

A static website for practicing everyday (Tel Aviv street) Hebrew:

- **Spaced repetition** with the FSRS algorithm (the same one modern Anki uses): Again / Hard / Good / Easy.
- **Reading cards** (Hebrew → meaning) and **writing cards** (English → type it in Hebrew with your Hebrew keyboard). Typed answers are checked automatically; vowel points are never required, final letters and spelling slips get "Almost".
- **Verb drills** for pa'al and pi'el (present, past, future, commands).
- **Grammar explainers**: reading & niqqud, roots & binyanim, pa'al, pi'el, and how people actually talk.
- **Slang-first vocabulary** with register tags (slang / casual / neutral / formal), notes and example sentences, plus a deck for your own words.
- Optional text-to-speech using the browser's Hebrew voice.

Progress is stored in your browser's localStorage. Use **Settings → Download backup** regularly.

## Running locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Adding content

- Vocabulary/sentence decks: `data/decks/*.json`, listed in `data/decks/index.json`. Each item: `id`, `he` (full spelling + niqqud), `en`, optional `alt` (other accepted answers), `hint`, `reg`, `note`, `ex` (`[[hebrew, english], …]`).
- Verb drills: `data/decks/paal.json` / `piel.json` (full conjugation tables).
- Grammar pages: `data/grammar/*.html`, listed in `data/grammar/index.json`.

Keep item `id`s stable — review history is keyed by them.
