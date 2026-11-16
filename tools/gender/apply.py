"""Write noun genders into the deck files and build data/agree.json (the agreement checker's lexicon).

Run from the repo root:  python3 tools/gender/apply.py .   (tools/course/build.py runs it too)
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from lexicon import NOUNS, FEM, EXTRA_NOUNS, ADJ, VERBS, IMP
from variants import SENT, WRITE, WRITE_EN, ELEMENT_ADD

MARKS = re.compile('[֑-ׇֽֿׁׂׅׄ]')
FINALS = str.maketrans('ךםןףץ', 'כמנפצ')
def plain(s): return re.sub(r'\s+', ' ', re.sub(r'[?!.,־-]', ' ', re.sub('[״"׳\'’]', '', MARKS.sub('', s)))).strip()
def key(s): return plain(s).translate(FINALS)

PEOPLE_EXTRA = [('חבר', 'חברה'), ('ילד', 'ילדה'), ('בחור', 'בחורה'), ('שותף', 'שותפה'), ('ישראלי', 'ישראלית'), ('תייר', 'תיירת'),
                ('עולה חדש', 'עולה חדשה'), ('נהג', 'נהגת'), ('מתכנת', 'מתכנתת'), ('מעצב', 'מעצבת'), ('עורך דין', 'עורכת דין')]

def write_fields(path, data):
    """Insert/refresh "g" and "fem" right after each item's id, keeping the file's hand formatting."""
    txt = open(path).read()
    txt = re.sub(r' "g": "\w+",', '', txt)
    txt = re.sub(r' "fem": \{[^{}]*\},', '', txt)
    for it in data['items']:
        if 'g' not in it: continue
        extra = f' "g": "{it["g"]}",'
        if 'fem' in it: extra += ' "fem": ' + json.dumps(it['fem'], ensure_ascii=False) + ','
        pat = re.compile(r'("id": ' + re.escape(json.dumps(it['id'], ensure_ascii=False)) + r',)')
        txt, n = pat.subn(lambda m: m.group(1) + extra, txt, count=1)
        if n != 1: raise SystemExit(f'{path}: could not place gender for {it["id"]}')
    json.loads(txt)
    open(path, 'w').write(txt)

GENERATED = ('course-phrases', 'course-write', 'basics')

def set_field(path, iid, field, value):
    """Insert/replace one top-level field of an item in a hand-formatted deck file (value=None removes it)."""
    txt = open(path).read()
    m = re.search(r'"id": ' + re.escape(json.dumps(iid, ensure_ascii=False)) + r',', txt)
    if not m: raise SystemExit(f'{path}: no item {iid}')
    # find the end of this item's object: the next '"id": ' or end of file
    nxt = txt.find('"id": ', m.end())
    seg_end = nxt if nxt != -1 else len(txt)
    seg = txt[m.end():seg_end]
    f = seg.find(f' "{field}": ')
    if f != -1:
        start = m.end() + f
        _, end = json.JSONDecoder().raw_decode(txt, start + len(f' "{field}": '))
        if txt[end] == ',': end += 1
        txt = txt[:start] + txt[end:]
    if value is not None:
        txt = txt[:m.end()] + f' "{field}": ' + json.dumps(value, ensure_ascii=False) + ',' + txt[m.end():]
    json.loads(txt)
    open(path, 'w').write(txt)

def variant(t):
    w, he = t[0], t[1]
    v = {'w': w, 'he': he}
    if len(t) > 2 and t[2] is not None: v['alt'] = t[2]
    if len(t) > 3: v['en'] = t[3]
    return v

def apply_variants(root):
    D = lambda f: os.path.join(root, 'data', 'decks', f + '.json')
    gen = {d: json.load(open(D(d))) for d in ('course-phrases', 'course-write')}
    for k, vs in SENT.items():
        deck, iid = k.split('/', 1)
        value = [variant(t) for t in vs]
        if deck in gen:
            it = next(i for i in gen[deck]['items'] if i['id'] == iid)
            it['v'] = value; it.pop('hint', None)
        else:
            set_field(D(deck), iid, 'v', value)
            set_field(D(deck), iid, 'hint', None)
    for it in gen['course-write']['items']:
        if it['id'] in WRITE_EN: it['en'] = WRITE_EN[it['id']]
        for label, extra in ELEMENT_ADD.get(it['id'], {}).items():
            el = next(e for e in it['elements'] if e['label'] == label)
            el['any'] = list(dict.fromkeys(el['any'] + extra))
        spec = WRITE.get(it['id'], [('m', None), ('f', None)])
        out = []
        for w, models in spec:
            ws = w.split()
            if not ({'m', 'f'} & set(ws)):   # every writer has a gender: add the opposite of the listener
                ws.insert(0, 'f' if 'tm' in ws else 'm')
            out.append({'w': ' '.join(ws), **({'models': models} if models else {})})
        it['v'] = out
    for d, data in gen.items():
        json.dump(data, open(D(d), 'w'), ensure_ascii=False, indent=1)
    print(f'variants: {len(SENT)} sentences/phrases, {len(gen["course-write"]["items"])} writing tasks')

def main(root):
    D = lambda f: os.path.join(root, 'data', 'decks', f)
    nouns, people = {}, []
    for deck, spec in NOUNS.items():
        data = json.load(open(D(deck + '.json')))
        by_id = {i['id']: i for i in data['items']}
        genders = dict(x.split(':') for x in spec.split())
        for iid, g in genders.items():
            if iid not in by_id: raise SystemExit(f'{deck}/{iid}: no such item')
            assert g in ('m', 'f', 'mp', 'fp'), (deck, iid, g)
        for it in data['items']:
            if it['id'] in genders:
                it['g'] = genders[it['id']]
                fem = FEM.get(f"{deck}/{it['id']}")
                if fem: it['fem'] = {'he': fem[0], 'en': fem[1]}
                else: it.pop('fem', None)
                for form in [it['he']] + it.get('alt', []):
                    k = key(form)
                    if k.startswith('ה') and len(k) > 3 and it['id'] in ('cheshbon', 'hatachana-haba'): continue
                    nouns[k] = it['g']
                if fem:
                    nouns[key(fem[0])] = 'f'
                    people.append([key(it['he']), key(fem[0])])
            else:
                it.pop('g', None); it.pop('fem', None)
        write_fields(D(deck + '.json'), data)
    for w in EXTRA_NOUNS.split():
        k, g = w.split(':')
        nouns.setdefault(key(k.replace('_', ' ')), g)
    for m, f in PEOPLE_EXTRA:
        people.append([key(m), key(f)])
        nouns.setdefault(key(m), 'm'); nouns.setdefault(key(f), 'f')
    rows = lambda txt: [[[key(v) for v in col.split('|')] for col in line.split()] for line in txt.strip().splitlines()]
    adj, verbs, imp = rows(ADJ), rows(VERBS), rows(IMP)
    for r in adj + verbs: assert len(r) == 4, r
    for r in imp: assert len(r) == 2, r
    out = {'_note': 'Generated by tools/gender/apply.py from tools/gender/lexicon.py — edit that file, not this one.',
           'nouns': dict(sorted(nouns.items())), 'people': people, 'adj': adj, 'verbs': verbs, 'imp': imp}
    json.dump(out, open(os.path.join(root, 'data', 'agree.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'genders: {len(nouns)} noun forms, {len(adj)} adjectives, {len(verbs)} verbs, {len(imp)} commands')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
    apply_variants(sys.argv[1] if len(sys.argv) > 1 else '.')
