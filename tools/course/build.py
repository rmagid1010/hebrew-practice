"""Builds data/course.json, data/decks/basics.json, course-phrases.json and course-write.json.
Run from the repo root: python3 tools/course/build.py .   (regenerates the course data files)
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from basics import BASICS

ROOT = sys.argv[1]
D = lambda f: os.path.join(ROOT, 'data', 'decks', f)

ALTS = {'zot': ['זו'], 'bye': ['ביי'], 'okay': ['אוקי', 'אוקיי'], 'ze': [], 'hine': []}
basics = {'items': []}
for id_, he, en, reg, note in BASICS:
    it = {'id': id_, 'he': he, 'en': en, 'reg': reg}
    if ALTS.get(id_): it['alt'] = ALTS[id_]
    if note: it['note'] = note
    basics['items'].append(it)

# ---------------- course phrases (new sentences, with the words they build on) ----------------
CP = {}
def cp(id_, he, en, req, alt=None, hint=None, note=None):
    it = {'id': id_, 'he': he, 'en': en, 'req': req, 'reg': 'casual'}
    if alt: it['alt'] = alt
    if hint: it['hint'] = hint
    if note: it['note'] = note
    CP[id_] = it
    return f'course-phrases/{id_}'

# ---------------- writing tasks ----------------
WT = {}
def wt(id_, en, elements, models, req, hint=None):
    it = {'id': id_, 'en': en, 'he': models[0], 'models': models, 'elements': [{'label': l, 'any': a} for l, a in elements], 'req': req, 'covers': list(req)}
    if hint: it['hint'] = hint
    WT[id_] = it
    return f'course-write/{id_}'

# ---------------- deck data, for building writing-task checklists from item keys ----------------
import re
MARKS = re.compile('[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]')
plain = lambda s: MARKS.sub('', s)
_INDEX = json.load(open(D('index.json')))
_DECKS = {}
for _d in _INDEX:
    if _d['id'] in ('course-phrases', 'course-write'): continue
    _DECKS[_d['id']] = json.load(open(D(_d['id'] + '.json'))) if _d['id'] != 'basics' else basics
_CONJ = {d['id'] for d in _INDEX if d.get('kind') == 'conjugation'}
_CONJ_RE = re.compile(r'^(?P<v>.+?)-(?P<t>inf|present|past|future|imp)(?:-(?P<p>\w+))?$')

def _first(f): return f[0] if isinstance(f, list) else f
def _all(f): return f if isinstance(f, list) else [f]

def element_for(key, override=None):
    deck, iid = key.split('/', 1)
    if deck in _CONJ:
        m = _CONJ_RE.match(iid)
        v = next(x for x in _DECKS[deck]['verbs'] if x['id'] == m['v'])
        t = m['t']
        if t == 'inf':
            anys, label = [plain(v['inf'])], f"{v['inf']} (to {v['en']})"
        else:
            anys = [plain(x) for f in v['forms'][t].values() for x in _all(f)]
            label = f"{v['inf']} — {'command' if t == 'imp' else t}"
    else:
        it = next(x for x in _DECKS[deck]['items'] if x['id'] == iid)
        anys = [plain(it['he'])] + it.get('alt', [])
        label = re.split(r' / |\(|—', it['en'])[0].strip() or it['en']
    if override: anys = override
    anys = [re.sub(r'[?!.,]', '', a).strip() for a in anys]
    return (label, list(dict.fromkeys(a for a in anys if a)))

def ut(id_, en, uses, model, forms=None, hint=None, models=None):
    """A writing task that tests exactly the items in `uses` (and must reuse something from an earlier lesson)."""
    forms = forms or {}
    it = {'id': id_, 'en': en, 'he': model, 'models': [model] + (models or []),
          'elements': [{'label': l, 'any': a} for l, a in (element_for(k, forms.get(k)) for k in uses)],
          'req': list(uses), 'covers': list(uses), 'needsPrior': True}
    if hint: it['hint'] = hint
    WT[id_] = it
    return f'course-write/{id_}'

B = lambda *ids: [f'basics/{i}' for i in ids]
S = lambda deck, *ids: [f'{deck}/{i}' for i in ids]

LESSONS = []
def lesson(id_, level, title, he, intro, items, verbs=(), phrases=(), write=(), links=()):
    LESSONS.append({'id': id_, 'level': level, 'title': title, 'he': he, 'intro': intro, 'items': list(items),
                    'verbs': list(verbs), 'phrases': list(phrases), 'write': list(write), 'links': list(links)})

# ===================== A1 =====================
lesson('a1-01', 'A1', 'Hello!', 'שָׁלוֹם',
  "<p>Your first words. <b>שָׁלוֹם</b> means hello, goodbye and peace. Israelis are informal: a quick <b>מָה נִשְׁמָע?</b> (what's up?) is the normal greeting, and <b>בְּסֵדֶר</b> or <b>הַכּוֹל טוֹב</b> is the normal answer.</p><p>Hebrew has no word for \"is\" or \"am\" in the present: <b>אֲנִי דָּנָה</b> = I (am) Dana.</p>",
  B('shalom', 'ken', 'lo', 'ani') + S('smalltalk', 'toda-raba', 'bevakasha', 'slicha', 'korim-li', 'naim-meod') + S('street', 'ma-nishma', 'hakol-tov', 'beseder'),
  phrases=[
    cp('cp01', 'שָׁלוֹם! קוֹרְאִים לִי דָּנִי.', 'Hi! My name is Dani.', ['basics/shalom', 'smalltalk/korim-li']),
    cp('cp02', 'מָה נִשְׁמָע? — הַכּוֹל בְּסֵדֶר, תּוֹדָה.', "What's up? — Everything's fine, thanks.", ['street/ma-nishma', 'street/beseder', 'smalltalk/toda-raba'], alt=['מה נשמע הכל בסדר תודה', 'מה נשמע הכול טוב תודה']),
    cp('cp03', 'נָעִים מְאוֹד, אֲנִי דָּנָה.', "Nice to meet you, I'm Dana.", ['smalltalk/naim-meod', 'basics/ani']),
  ],
  write=[
    wt('w01', 'Greet someone, tell them your name, and ask how they are.',
       [('a greeting', ['שלום', 'היי', 'הי']), ('your name', ['קוראים לי', 'אני']), ('how are you?', ['מה נשמע', 'מה שלומך', 'מה קורה', 'מה העניינים'])],
       ['שָׁלוֹם, קוֹרְאִים לִי דָּנִי. מָה נִשְׁמָע?', 'הַיי, אֲנִי מִיכַל. מָה שְׁלוֹמְךָ?'], ['basics/shalom', 'smalltalk/korim-li', 'street/ma-nishma']),
    wt('w02', 'Someone thanks you for your help. Answer politely, and say it was nice to meet them.',
       [("you're welcome", ['בבקשה', 'בכיף', 'אין בעד מה', 'בקטנה']), ('nice to meet you', ['נעים מאוד'])],
       ['בְּבַקָּשָׁה! נָעִים מְאוֹד.'], ['smalltalk/bevakasha', 'smalltalk/naim-meod']),
  ])

lesson('a1-02', 'A1', 'Me, you, them', 'אֲנִי, אַתָּה, הִיא',
  "<p>Hebrew pronouns have gender: <b>אַתָּה</b> to a man, <b>אַתְּ</b> to a woman. <b>זֶה</b> (this/that/it) is the most useful word you'll learn this week.</p><p>\"My\" comes <i>after</i> the noun: <b>חָבֵר שֶׁלִּי</b> = a friend of mine. More in <a href=\"#/grammar/spoken\">How people actually talk</a>.</p>",
  B('ata', 'at', 'hu', 'hi', 'anachnu', 'atem', 'hem', 'hen', 'ze', 'zot', 'sheli', 'kafe', 'boker-tov', 'erev-tov', 'laila-tov') + S('connectors', 'mi', 'ma') + S('smalltalk', 'chaver', 'gam-ani'),
  phrases=[
    cp('cp04', 'מִי זֶה? — זֶה חָבֵר שֶׁלִּי.', "Who's that? — That's a friend of mine.", ['connectors/mi', 'basics/ze', 'smalltalk/chaver', 'basics/sheli']),
    cp('cp05', 'אֲנִי דָּנִי, וְהִיא מִיכַל.', "I'm Dani, and she's Michal.", ['basics/ani', 'basics/hi']),
    cp('cp06', 'מָה זֶה? — זֶה קָפֶה.', "What's this? — It's coffee.", ['connectors/ma', 'basics/ze', 'basics/kafe']),
  ],
  write=[
    wt('w03', 'Introduce a friend: say who he is (a friend of yours) and his name.',
       [('this / he', ['זה', 'הוא']), ('a friend of mine', ['חבר שלי', 'החבר שלי'])],
       ['זֶה דָּנִי, הוּא חָבֵר שֶׁלִּי.'], ['basics/ze', 'smalltalk/chaver', 'basics/sheli']),
    wt('w04', 'Ask what something is. Then answer: it\'s coffee.',
       [('what is this?', ['מה זה']), ('coffee', ['קפה'])], ['מָה זֶה? — זֶה קָפֶה.'], ['connectors/ma', 'basics/kafe']),
  ])

lesson('a1-03', 'A1', 'Street talk', 'סַבָּבָה, יַאלְלָה',
  "<p>The words that make you sound like you live here. <b>סַבָּבָה</b> (cool), <b>יַאלְלָה</b> (come on / let's go) and <b>וַאלְלָה</b> (really? / honestly) are in every conversation.</p><p>Each word on this site is tagged <i>slang, casual, neutral</i> or <i>formal</i> so you know where it fits.</p>",
  S('street', 'sababa', 'yalla', 'achla', 'walla', 'ein-baaya', 'bekef', 'barur', 'rega', 'beemet', 'ein-li-musag') + B('bye', 'lehitraot', 'okay'),
  phrases=[
    cp('cp07', 'סַבָּבָה, אֵין בְּעָיָה.', 'Cool, no problem.', ['street/sababa', 'street/ein-baaya'], alt=['סבבא אין בעיה']),
    cp('cp08', 'רֶגַע, בֶּאֱמֶת? וַאלְלָה!', 'Wait, really? Wow!', ['street/rega', 'street/beemet', 'street/walla']),
    cp('cp09', 'אַחְלָה, יַאלְלָה בַּיי!', 'Great, OK bye!', ['street/achla', 'street/yalla', 'basics/bye'], alt=['אחלה יאלה ביי']),
  ],
  write=[
    wt('w05', 'A friend asks if you can help them move tomorrow. Say of course, no problem.',
       [('of course / sure', ['ברור', 'בטח', 'סבבה', 'כן']), ('no problem / happily', ['אין בעיה', 'בכיף'])],
       ['בָּרוּר, אֵין בְּעָיָה!', 'סַבָּבָה, בְּכֵיף.'], ['street/barur', 'street/ein-baaya']),
    wt('w06', 'Someone tells you surprising news. React: wait — really? You had no idea.',
       [('wait', ['רגע']), ('really?', ['באמת', 'ואללה']), ('I have no idea', ['אין לי מושג'])],
       ['רֶגַע, בֶּאֱמֶת? אֵין לִי מוּשָּׂג!'], ['street/rega', 'street/beemet', 'street/ein-li-musag']),
  ])

lesson('a1-04', 'A1', 'I want, I like, I have', 'רוֹצֶה, אוֹהֵב, יֵשׁ לִי',
  "<p>Your first verbs. In the present tense a verb has <b>four forms</b> — like an adjective: <b>רוֹצֶה / רוֹצָה / רוֹצִים / רוֹצוֹת</b>. Pick by who's speaking or being talked about.</p><p>\"I have\" is <b>יֵשׁ לִי</b> (lit. there is to me), and the casual \"I feel like…\" is <b>בָּא לִי</b>.</p><p>You also meet the first two verbs of the <a href=\"#/verbs\">verb course</a>: <b>לִקְנוֹת</b> (to buy) and <b>לָגוּר</b> (to live).</p>",
  S('verbs', 'lirtzot', 'leehov') + B('yesh', 'ein', 'yesh-li', 'ein-li', 'te', 'meod') + S('time', 'ba-li') + S('cafe', 'bira') + S('adjectives', 'tov') + S('connectors', 'aval'),
  verbs=['paal/kana@inf', 'paal/gar@inf'],
  phrases=[
    'phrases/p07',
    cp('cp10', 'אֲנִי רוֹצֶה קָפֶה, בְּבַקָּשָׁה.', "I'd like a coffee, please.", ['verbs/lirtzot', 'basics/kafe', 'smalltalk/bevakasha']),
    cp('cp11', 'אֲנִי אוֹהֵב קָפֶה, אֲבָל לֹא תֵּה.', "I like coffee, but not tea.", ['verbs/leehov', 'basics/kafe', 'connectors/aval', 'basics/te'], alt=['אני אוהבת קפה אבל לא תה'], hint='(male or female speaker)'),
  ],
  write=[
    wt('w07', 'Say what you feel like drinking right now — coffee, tea, beer or water.',
       [('I feel like / I want', ['בא לי', 'אני רוצה', 'רוצה']), ('a drink', ['קפה', 'תה', 'בירה', 'מים'])],
       ['בָּא לִי בִּירָה.', 'אֲנִי רוֹצֶה תֵּה.'], ['time/ba-li', 'verbs/lirtzot', 'cafe/bira']),
    wt('w08', 'Say one thing you like and one thing you don\'t like.',
       [('I like', ['אוהב', 'אוהבת']), ("I don't like", ['לא אוהב', 'לא אוהבת'])],
       ['אֲנִי אוֹהֵב קָפֶה, אֲבָל אֲנִי לֹא אוֹהֵב תֵּה.'], ['verbs/leehov', 'basics/lo']),
  ])

lesson('a1-05', 'A1', 'Where are you from?', 'מֵאֵיפֹה אַתָּה?',
  "<p>Small talk survival kit: where you live, that you're learning Hebrew, and how to ask people to slow down or repeat.</p><p>Verb course: meet <b>roots and binyanim</b>. Almost every verb is three root letters poured into a pattern — <b>לָגוּר</b> and <b>לִקְנוֹת</b> are both in <i>pa'al</i>. Read <a href=\"#/verbs/learn/binyanim\">Roots &amp; binyanim</a> (10 minutes).</p>",
  S('smalltalk', 'meeifo', 'eifo-gar', 'gar-tlv', 'lomed-ivrit', 'lo-mevin', 'lo-yodea', 'eich-omrim', 'ma-ze-omer', 'leat-bevakasha', 'lachzor') + B('od-paam'),
  verbs=['paal/gar@binyan', 'paal/kana@binyan', 'paal/katav@inf'],
  phrases=['phrases/p02', 'phrases/p03', 'phrases/p28'],
  write=[
    wt('w09', "Tell someone where you live and that you're learning Hebrew.",
       [('I live', ['גר', 'גרה']), ("I'm learning Hebrew", ['לומד עברית', 'לומדת עברית'])],
       ['אֲנִי גָּר בְּתֵל אָבִיב וַאֲנִי לוֹמֵד עִבְרִית.'], ['smalltalk/gar-tlv', 'smalltalk/lomed-ivrit']),
    wt('w10', "You didn't understand. Say so, and ask the person to speak slowly or repeat.",
       [("I didn't understand", ['לא הבנתי', 'לא מבין', 'לא מבינה']), ('slowly / repeat', ['לאט', 'לחזור', 'עוד פעם'])],
       ['סְלִיחָה, אֲנִי לֹא מֵבִין. אֶפְשָׁר לְאַט?', 'לֹא הֵבַנְתִּי, אֶפְשָׁר עוֹד פַּעַם?'], ['smalltalk/lo-mevin', 'smalltalk/lachzor']),
  ])

lesson('a1-06', 'A1', 'At the café', 'בְּבֵית קָפֶה',
  "<p><b>אֶפְשָׁר…?</b> (is it possible…?) is the magic word for ordering: <b>אֶפְשָׁר הָפוּךְ?</b> Add <b>בְּלִי</b> (without) and <b>עִם</b> (with) and you can order anything.</p><p>Verb course: the <b>present tense</b> of לָגוּר and לִקְנוֹת — four forms each.</p>",
  S('cafe', 'efshar-lekabel', 'hafuch', 'mayim', 'tafrit', 'cheshbon', 'taim', 'bli', 'im', 'shakshuka', 'lashevet-o-lakachat', 'bachutz') + S('food', 'sukar'),
  verbs=['paal/gar@present', 'paal/kana@present'],
  phrases=['phrases/p04', 'phrases/p05', 'phrases/p39', 'phrases/p44',
           cp('cp12', 'אֲנִי קוֹנֶה קָפֶה כָּל בּוֹקֶר.', 'I buy a coffee every morning.', ['paal/kana-present-ms', 'basics/kafe'], alt=['אני קונה קפה כל בוקר'], hint='(male or female speaker)')],
  write=[
    wt('w11', 'Order a latte without sugar, and ask if you can sit outside.',
       [('can I…?', ['אפשר']), ('a latte', ['הפוך']), ('without sugar', ['בלי סוכר']), ('outside', ['בחוץ'])],
       ['אֶפְשָׁר הָפוּךְ בְּלִי סוּכָּר? וְאֶפְשָׁר לָשֶׁבֶת בַּחוּץ?'], ['cafe/efshar-lekabel', 'cafe/hafuch', 'cafe/bli', 'food/sukar', 'cafe/bachutz']),
    wt('w12', 'You\'ve finished eating. Say it was really tasty, and ask for the bill.',
       [('tasty', ['טעים']), ('the bill', ['חשבון'])],
       ['הָיָה מַמָּשׁ טָעִים! אֶפְשָׁר אֶת הַחֶשְׁבּוֹן?'], ['cafe/taim', 'cafe/cheshbon']),
  ])

lesson('a1-07', 'A1', 'Getting around', 'בָּעִיר',
  "<p>Two verbs of movement: <b>לָלֶכֶת</b> (to go on foot / to go) and <b>לִנְסוֹעַ</b> (to go by bus, car or train). Directions are easy: <b>יָמִינָה, שְׂמֹאלָה, יָשָׁר</b>.</p><p>Verb course: <b>לִכְתּוֹב</b> — your model regular pa'al verb. Find its root and binyan.</p>",
  S('around', 'otobus', 'tachana', 'kav', 'yamina', 'smola', 'yashar', 'karov', 'rachok', 'leyad', 'po', 'sham', 'eich-magiim', 'yam', 'shuk') + S('verbs', 'lalechet', 'lavo', 'linsoa'),
  verbs=['paal/katav@binyan', 'paal/gamar@inf'],
  phrases=['phrases/p10', 'phrases/p11', 'phrases/p12', 'challenge/c06'],
  write=[
    wt('w13', 'Ask how to get to the beach and whether it\'s far from here.',
       [('how do I get to', ['איך מגיעים']), ('the beach / sea', ['לים', 'לחוף']), ('far', ['רחוק'])],
       ['סְלִיחָה, אֵיךְ מַגִּיעִים לַיָּם? זֶה רָחוֹק?'], ['around/eich-magiim', 'around/yam', 'around/rachok']),
    wt('w14', 'Give directions: straight, then right — it\'s next to the market.',
       [('straight', ['ישר']), ('right', ['ימינה']), ('next to (the market)', ['ליד'])],
       ['יָשָׁר וְאָז יָמִינָה, זֶה לְיַד הַשּׁוּק.'], ['around/yashar', 'around/yamina', 'around/leyad', 'around/shuk']),
  ])

lesson('a1-08', 'A1', 'Numbers & prices', 'כַּמָּה זֶה עוֹלֶה?',
  "<p>For counting, prices and the time, people use the <b>feminine</b> numbers: אַחַת, שְׁתַּיִים, שָׁלוֹשׁ… And money stays singular: <b>עֶשְׂרִים שֶׁקֶל</b>. Details in <a href=\"#/grammar/numbers\">Numbers &amp; time</a>.</p><p>Verb course: present tense of <b>לִכְתּוֹב</b> — see the pa'al present shape <b>1o·2e3</b> (כּוֹתֵב).</p>",
  S('numbers', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '20', '100') + S('shopping', 'shekel') + S('around', 'kama-ole', 'yakar', 'zol'),
  verbs=['paal/katav@present', 'paal/gamar@binyan'],
  phrases=['phrases/p13', 'phrases/p14',
           cp('cp13', 'מָה אַתָּה כּוֹתֵב? — אֲנִי כּוֹתֵב מֵייל.', "What are you writing? — I'm writing an email.", ['paal/katav-present-ms', 'connectors/ma'], alt=['מה את כותבת אני כותבת מייל', 'מה אתה כותב אני כותב מייל'], hint='(to a man)')],
  write=[
    wt('w15', 'Ask how much something costs, and say it\'s too expensive.',
       [('how much does it cost?', ['כמה זה עולה', 'כמה עולה', 'כמה זה']), ('(too) expensive', ['יקר'])],
       ['כַּמָּה זֶה עוֹלֶה? זֶה יָקָר מִדַּי!'], ['around/kama-ole', 'around/yakar']),
    wt('w16', 'Say the beer costs 20 shekels and the coffee costs 10.',
       [('twenty', ['עשרים']), ('ten', ['עשר', 'עשרה']), ('shekels', ['שקל', 'שקלים'])],
       ['הַבִּירָה עוֹלָה עֶשְׂרִים שֶׁקֶל, וְהַקָּפֶה עֶשֶׂר.'], ['numbers/20', 'numbers/10', 'shopping/shekel', 'cafe/bira']),
  ])

lesson('a1-09', 'A1', 'Time & plans', 'מָתַי נִיפָּגֵשׁ?',
  "<p>Time words go anywhere in the sentence: <b>מָחָר בָּעֶרֶב</b> (tomorrow evening). To suggest something, use <b>בּוֹא / בּוֹאִי</b> + the \"we\" future: <b>בּוֹא נִיפָּגֵשׁ</b> (let's meet).</p><p>Verb course: <b>לִגְמוֹר</b> in the present, and two pi'el infinitives: <b>לְדַבֵּר</b> (to speak) and <b>לְשַׁלֵּם</b> (to pay).</p>",
  S('time', 'hayom', 'machar', 'etmol', 'achshav', 'achar-kach', 'baboker', 'baerev', 'matai', 'kvar', 'od-lo', 'ein-li-koach', 'kavanu', 'yesh-lecha-zman') + S('verbs', 'latzet'),
  verbs=['paal/gamar@present', 'piel/diber@inf', 'piel/shilem@inf'],
  phrases=['phrases/p08', 'phrases/p09', 'phrases/p15', 'phrases/p16', 'challenge/c02'],
  write=[
    wt('w17', 'Suggest meeting tomorrow evening, and ask if they have time.',
       [('tomorrow', ['מחר']), ('in the evening', ['בערב']), ('do you have time?', ['יש לך זמן']), ("let's meet", ['ניפגש', 'נפגש', 'נתראה', 'נקבע'])],
       ['יֵשׁ לְךָ זְמַן מָחָר בָּעֶרֶב? בּוֹא נִיפָּגֵשׁ.'], ['time/machar', 'time/baerev', 'time/yesh-lecha-zman']),
    wt('w18', "Say you can't be bothered to go out today — maybe tomorrow.",
       [("I can't be bothered", ['אין לי כוח', 'אין לי כח']), ('to go out', ['לצאת']), ('today', ['היום']), ('tomorrow', ['מחר'])],
       ['אֵין לִי כּוֹחַ לָצֵאת הַיּוֹם, אוּלַי מָחָר.'], ['time/ein-li-koach', 'verbs/latzet', 'time/hayom', 'time/machar']),
  ])

lesson('a1-10', 'A1', 'Small talk', 'מָה אַתָּה עוֹשֶׂה בַּחַיִּים?',
  "<p>The questions every new friend asks — and the fillers (<b>תַּכְלֶס, סְתָם, מַמָּשׁ</b>) that make your answers sound natural.</p><p>Verb course: the <b>past tense</b>. It's built with endings, so you don't need the pronoun: <b>כָּתַבְתִּי</b> = I wrote. Pa'al past shape: <b>1a·2a3</b>.</p>",
  S('smalltalk', 'ma-ata-ose', 'avoda', 'tagid', 'tishma', 'nitraeh', 'nedaber', 'chevre') + S('street', 'tachles', 'stam', 'mamash', 'legamrei', 'lo-meshane') + S('verbs', 'laavod'),
  verbs=['paal/katav@past', 'paal/gamar@past'],
  phrases=['phrases/p24', 'phrases/p25', 'phrases/p32', 'phrases/p33', 'phrases/p35',
           cp('cp14', 'גָּמַרְתִּי! אֶפְשָׁר אֶת הַחֶשְׁבּוֹן?', "I'm done! Can I have the bill?", ['paal/gamar-past-1s', 'cafe/cheshbon'])],
  write=[
    wt('w19', 'Tell someone you work in Tel Aviv and you really like it.',
       [('I work', ['עובד', 'עובדת']), ('in Tel Aviv', ['בתל אביב']), ('really', ['ממש', 'מאוד']), ('like / love', ['אוהב', 'אוהבת'])],
       ['אֲנִי עוֹבֵד בְּתֵל אָבִיב וַאֲנִי מַמָּשׁ אוֹהֵב אֶת זֶה.'], ['verbs/laavod', 'street/mamash', 'verbs/leehov']),
    wt('w20', "End a chat: say we'll talk later, bye.",
       [("we'll talk", ['נדבר']), ('later', ['אחר כך']), ('bye', ['ביי', 'להתראות', 'נתראה'])],
       ['נְדַבֵּר אַחַר כָּךְ, יַאלְלָה בַּיי!'], ['smalltalk/nedaber', 'time/achar-kach', 'basics/bye']),
  ])

lesson('a1-11', 'A1', 'What did you do?', 'מָה עָשִׂיתָ?',
  "<p>Talking about yesterday. Common past forms to recognize: <b>הָיִיתִי</b> (I was), <b>עָשִׂיתִי</b> (I did), <b>אָכַלְתִּי</b> (I ate), <b>רָאִיתִי</b> (I saw), <b>הָלַכְתִּי</b> (I went). Join sentences with <b>כִּי</b> (because) and <b>אָז</b> (so).</p><p>Verb course: past tense of the weak verbs לִקְנוֹת (<b>קָנִיתִי</b>) and לָגוּר (<b>גַּרְתִּי</b>).</p>",
  S('verbs', 'laasot', 'leechol', 'lishtot', 'lirot', 'lishmoa', 'lihyot') + S('connectors', 'ki', 'az') + S('health', 'ayef'),
  verbs=['paal/kana@past', 'paal/gar@past', 'paal/pagash@inf', 'paal/sagar@inf'],
  phrases=['phrases2/q01', 'phrases2/q02', 'phrases2/q03', 'phrases/p37', 'phrases/p38',
           cp('cp15', 'אֶתְמוֹל קָנִיתִי נַעֲלַיִים, אֲבָל הֵן קְטַנּוֹת.', "Yesterday I bought shoes, but they're small.", ['paal/kana-past-1s', 'time/etmol', 'connectors/aval'], alt=['קניתי נעליים אתמול אבל הן קטנות'])],
  write=[
    wt('w21', 'Write two sentences about what you did yesterday.',
       [('yesterday', ['אתמול']), ('a past-tense verb', ['הייתי', 'עשיתי', 'אכלתי', 'ראיתי', 'קניתי', 'הלכתי', 'נסעתי', 'שתיתי', 'כתבתי', 'גמרתי', 'פגשתי', 'עבדתי', 'יצאתי'])],
       ['אֶתְמוֹל הָיִיתִי בַּיָּם. אַחַר כָּךְ אָכַלְתִּי שַׁקְשׁוּקָה עִם חֲבֵרִים.'], ['time/etmol', 'verbs/laasot', 'paal/kana-past-1s']),
    wt('w22', "Say you didn't come because you were tired.",
       [("I didn't come", ['לא באתי', 'לא הגעתי']), ('because', ['כי']), ('tired', ['עייף', 'עייפה'])],
       ['לֹא בָּאתִי כִּי הָיִיתִי עָיֵיף.'], ['verbs/lavo', 'connectors/ki', 'health/ayef']),
  ])

lesson('a1-12', 'A1', 'Street talk 2 · A1 review', 'אֵין מַצָּב!',
  "<p>Reactions for good news and bad, plus a review of the whole A1 level: the challenge sentences here combine words from all the earlier lessons.</p><p>Verb course: your first <b>future</b> — pa'al future shape <b>yi·12o3</b> (יִכְתּוֹב).</p>",
  S('street', 'ein-matzav', 'haval-al-hazman', 'al-hapanim', 'basa', 'ma-pitom', 'achi', 'yofi', 'balagan', 'chaval', 'kapara'),
  verbs=['paal/katav@future'],
  phrases=['phrases/p18', 'phrases/p19', 'phrases/p20', 'phrases/p21', 'challenge/c01', 'challenge/c03', 'challenge/c05',
           cp('cp16', 'מָחָר אֲנִי אֶכְתּוֹב לְךָ.', "I'll write to you tomorrow.", ['paal/katav-future-1s', 'time/machar'], alt=['אני אכתוב לך מחר', 'מחר אכתוב לך'])],
  write=[
    wt('w23', 'Tell a friend about last night: it was amazing — or terrible!',
       [('last night / yesterday', ['אתמול', 'בערב', 'בלילה']), ('it was', ['היה']), ('amazing / terrible', ['חבל על הזמן', 'על הפנים', 'אש', 'מדהים', 'אחלה'])],
       ['אֶתְמוֹל בָּעֶרֶב הָיָה חֲבָל עַל הַזְּמַן!'], ['street/haval-al-hazman', 'street/al-hapanim', 'verbs/lihyot']),
    wt('w24', "React to bad news with 'what a bummer', and to good news with 'no way, really?'",
       [('bummer', ['באסה']), ('no way', ['אין מצב']), ('really?', ['באמת', 'ואללה'])],
       ['אֵיזוֹ בַּאסָה! … אֵין מַצָּב, בֶּאֱמֶת?'], ['street/basa', 'street/ein-matzav', 'street/beemet']),
  ])

# ===================== A2 =====================
lesson('a2-13', 'A2', 'Home', 'הַבַּיִת',
  "<p>Adjectives come <b>after</b> the noun and agree with it: <b>דִּירָה קְטַנָּה</b>, <b>חֶדֶר גָּדוֹל</b>. See <a href=\"#/grammar/adjectives\">Adjectives</a>.</p><p>Verb course: future of לִגְמוֹר and לִקְנוֹת, and the root and binyan of the pi'el verbs לְדַבֵּר and לְשַׁלֵּם.</p>",
  S('home', 'bayit', 'cheder', 'salon', 'mitbach', 'mita', 'shulchan', 'mirpeset', 'schar-dira', 'shchenim', 'mazgan', 'koma') + S('around', 'dira') + S('adjectives', 'gadol', 'katan', 'roesh') + S('time', 'balayla'),
  verbs=['paal/gamar@future', 'paal/kana@future', 'piel/diber@binyan', 'piel/shilem@binyan'],
  phrases=['challenge/c16', 'challenge/c17',
           cp('cp17', 'הֵם גָּרִים בְּדִירָה קְטַנָּה עִם מִרְפֶּסֶת.', 'They live in a small apartment with a balcony.', ['paal/gar-present-mp', 'around/dira', 'adjectives/katan', 'home/mirpeset'])],
  write=[
    wt('w25', 'Describe your apartment: how many rooms, and one thing you like about it.',
       [('apartment', ['דירה', 'הדירה']), ('rooms', ['חדרים', 'חדר']), ('there is / it has', ['יש'])],
       ['יֵשׁ לִי דִּירָה קְטַנָּה עִם שְׁנֵי חֲדָרִים. אֲנִי אוֹהֵב אֶת הַמִּרְפֶּסֶת.'], ['home/cheder', 'around/dira', 'basics/yesh']),
    wt('w26', 'Complain about your neighbors: they\'re really noisy at night.',
       [('the neighbors', ['שכנים', 'השכנים']), ('noisy', ['רועשים', 'רועש']), ('at night', ['בלילה'])],
       ['הַשְּׁכֵנִים שֶׁלִּי מַמָּשׁ רוֹעֲשִׁים בַּלַּיְלָה.'], ['home/shchenim', 'adjectives/roesh', 'time/balayla']),
  ])

lesson('a2-14', 'A2', 'Shopping', 'קְנִיּוֹת',
  "<p>Paying, sizes, sales and returns. Remember: <b>אֶפְשָׁר</b> + infinitive = \"can I…?\": <b>אֶפְשָׁר לִמְדּוֹד?</b> (can I try it on?).</p><p>Verb course: pi'el <b>present</b> — shape <b>me·1a·2e3</b>: מְדַבֵּר, מְשַׁלֵּם. And your first <b>commands</b> with לִכְתּוֹב.</p>",
  S('shopping', 'kesef', 'mechir', 'ashrai', 'mezuman', 'hanacha', 'mivtza', 'super', 'chanut', 'lehachzir', 'mida', 'limdod') + S('clothes', 'chultza') + S('connectors', 'rak', 'o') + S('verbs', 'leshalem', 'liknot'),
  verbs=['piel/diber@present', 'piel/shilem@present', 'paal/katav@imp'],
  phrases=['challenge/c14', 'challenge/c15', 'phrases2/q21',
           cp('cp18', 'אֲנִי מְדַבֵּר עִבְרִית, אֲבָל לְאַט.', 'I speak Hebrew, but slowly.', ['piel/diber-present-ms', 'connectors/aval'], alt=['אני מדברת עברית אבל לאט'], hint='(male or female speaker)')],
  write=[
    wt('w27', "In a shop: say you want to return a shirt because it's too small.",
       [('to return', ['להחזיר']), ('the shirt', ['חולצה', 'החולצה']), ('because', ['כי']), ('small', ['קטנה', 'קטן'])],
       ['אֲנִי רוֹצֶה לְהַחְזִיר אֶת הַחוּלְצָה, כִּי הִיא קְטַנָּה מִדַּי.'], ['shopping/lehachzir', 'clothes/chultza', 'adjectives/katan', 'connectors/ki']),
    wt('w28', 'Ask if you can pay by card, or only in cash.',
       [('to pay', ['לשלם']), ('card', ['אשראי', 'כרטיס']), ('cash', ['מזומן'])],
       ['אֶפְשָׁר לְשַׁלֵּם בְּאַשְׁרַאי, אוֹ רַק בִּמְזוּמָּן?'], ['verbs/leshalem', 'shopping/ashrai', 'shopping/mezuman']),
  ])

lesson('a2-15', 'A2', 'Food & cooking', 'אוֹכֶל',
  "<p>Groceries and cooking. Lots of verbs this week — and four new infinitives in the verb course from two new binyanim: <b>לְהַזְמִין</b> and <b>לְהַתְחִיל</b> (hif'il), <b>לְסַדֵּר</b> and <b>לְחַפֵּשׂ</b> (pi'el).</p>",
  S('food', 'lechem', 'chalav', 'beitzim', 'gvina', 'yerakot', 'of', 'peirot', 'levashel', 'aruchat-erev', 'save') + S('cafe', 'raev', 'lehazmin') + S('shopping', 'mishloach'),
  verbs=['piel/sider@inf', 'piel/chipes@inf', 'hifil/hizmin@inf', 'hifil/hitchil@inf'],
  phrases=['challenge/c20', 'phrases2/q27'],
  write=[
    wt('w29', 'Message your roommate: we need milk, bread and eggs.',
       [('we need', ['צריך', 'צריכים', 'חסר', 'אין']), ('milk', ['חלב']), ('bread', ['לחם']), ('eggs', ['ביצים'])],
       ['צָרִיךְ לִקְנוֹת חָלָב, לֶחֶם וּבֵיצִים.'], ['food/chalav', 'food/lechem', 'food/beitzim']),
    wt('w30', "Say you're hungry and suggest ordering delivery.",
       [('hungry', ['רעב', 'רעבה']), ('order', ['להזמין', 'נזמין']), ('delivery', ['משלוח'])],
       ['אֲנִי רָעֵב, בּוֹא נַזְמִין מִשְׁלוֹחַ.'], ['cafe/raev', 'cafe/lehazmin', 'shopping/mishloach']),
  ])

lesson('a2-16', 'A2', 'Family', 'מִשְׁפָּחָה',
  "<p>Family words and Friday dinner. \"My\" is usually <b>שֶׁלִּי</b> after the noun (<b>הַהוֹרִים שֶׁלִּי</b>), except a few words like <b>אִשְׁתִּי, בַּעְלִי</b>.</p><p>Verb course: pi'el <b>past</b> — shape <b>1i·2e3</b>, spelled with an extra י: <b>דִּיבֵּר, שִׁילֵּם</b>. Plus two nif'al infinitives.</p>",
  S('family', 'ima', 'aba', 'horim', 'ach', 'achot', 'yeladim', 'chaverim', 'lehakir', 'nasui', 'ben-zug', 'aruchat-shishi') + S('time', 'shishi') + S('connectors', 'acharei') + S('feelings', 'nechmad'),
  verbs=['piel/diber@past', 'piel/shilem@past', 'nifal/nichnas@inf', 'nifal/nifgash@inf'],
  phrases=['challenge/c09', 'challenge/c29',
           cp('cp19', 'דִּיבַּרְנוּ עִם הַהוֹרִים שֶׁלִּי אֶתְמוֹל.', 'We talked with my parents yesterday.', ['piel/diber-past-1p', 'family/horim', 'basics/sheli'], alt=['אתמול דיברנו עם ההורים שלי'])],
  write=[
    wt('w31', 'Describe your family: brothers or sisters, parents, where they live.',
       [('brother / sister', ['אח', 'אחות', 'אחים', 'אחיות']), ('parents / mom / dad', ['הורים', 'ההורים', 'אמא', 'אבא']), ('live', ['גר', 'גרה', 'גרים'])],
       ['יֵשׁ לִי אָח וְאָחוֹת. הַהוֹרִים שֶׁלִּי גָּרִים בְּחֵיפָה.'], ['family/ach', 'family/horim', 'smalltalk/gar-tlv']),
    wt('w32', "Tell someone you're eating at your parents' on Friday.",
       [("at (someone's place)", ['אצל']), ('parents', ['הורים', 'ההורים']), ('Friday', ['שישי'])],
       ['בְּשִׁישִּׁי אֲנִי אוֹכֵל אֵצֶל הַהוֹרִים.'], ['family/horim', 'time/shishi']),
  ])

lesson('a2-17', 'A2', 'Feelings', 'רְגָשׁוֹת',
  "<p>Many feelings are \"X to me\": <b>קָשֶׁה לִי, נִמְאַס לִי, אִכְפַּת לִי</b>. Change the ending to change the person: <b>אִכְפַּת לְךָ?</b></p><p>Verb course: pi'el <b>future</b> (<b>אֲדַבֵּר, נְדַבֵּר</b>), and two hitpa'el infinitives: <b>לְהִתְקַשֵּׁר, לְהִתְרַגֵּשׁ</b>.</p>",
  S('feelings', 'sameach', 'atzuv', 'koes', 'mitragesh', 'nimas-li', 'ichpat-li', 'lo-ichpat-li', 'kashe-li', 'doeg', 'mevuas', 'meatzben') + S('connectors', 'lama') + S('verbs', 'lehistader'),
  verbs=['piel/diber@future', 'hitpael/hitragesh@inf', 'hitpael/hitkasher@inf'],
  phrases=['challenge/c30', 'challenge/c34', 'challenge/c41',
           cp('cp20', 'אֲנִי אֲדַבֵּר עִם דָּנִי מָחָר.', "I'll talk to Dani tomorrow.", ['piel/diber-future-1s', 'time/machar'], alt=['מחר אני אדבר עם דני', 'מחר אדבר עם דני'])],
  write=[
    wt('w33', 'Tell a friend how you feel today, and why (use כי).',
       [('a feeling', ['שמח', 'שמחה', 'עצוב', 'עצובה', 'עייף', 'עייפה', 'מבואס', 'מבואסת', 'כועס', 'כועסת', 'לחוץ', 'לחוצה', 'מתרגש', 'מתרגשת', 'נמאס לי', 'קשה לי']), ('because', ['כי'])],
       ['הַיּוֹם אֲנִי מַמָּשׁ שָׂמֵחַ, כִּי מָחָר יֵשׁ לִי חוֹפֶשׁ.'], ['feelings/sameach', 'connectors/ki']),
    wt('w34', "Comfort a friend: don't worry, it'll be fine, it'll work out.",
       [("don't worry", ['אל תדאג', 'אל תדאגי']), ("it'll be fine / work out", ['יהיה בסדר', 'יסתדר'])],
       ['אַל תִּדְאַג, יִהְיֶה בְּסֵדֶר. זֶה יִסְתַּדֵּר.'], ['feelings/doeg', 'verbs/lehistader']),
  ])

lesson('a2-18', 'A2', 'Health', 'בְּרִיאוּת',
  "<p><b>כּוֹאֵב לִי</b> (it hurts me) agrees with the body part: <b>כּוֹאֵב לִי הָרֹאשׁ</b>, <b>כּוֹאֶבֶת לִי הַבֶּטֶן</b>. Sick days need an <b>אִישּׁוּר מַחֲלָה</b> from the קופת חולים.</p><p>Verb course: root and binyan of the hif'il verbs — shape <b>leha·12i3</b>.</p>",
  S('health', 'rosh', 'beten', 'koev-li', 'chole', 'chom', 'rofe', 'kupat-cholim', 'trufa', 'ishur-machala', 'hitztanani', 'targish-tov') + S('verbs', 'lishon'),
  verbs=['hifil/hizmin@binyan', 'hifil/hitchil@binyan', 'piel/sider@binyan'],
  phrases=['challenge/c11', 'challenge/c26', 'challenge/c27'],
  write=[
    wt('w35', "Message your boss: you're sick, you have a fever, and you're not coming in today.",
       [('sick', ['חולה']), ('fever', ['חום']), ('not coming', ['לא בא', 'לא באה', 'לא אגיע', 'לא אבוא', 'לא מגיע', 'לא מגיעה']), ('today', ['היום'])],
       ['אֲנִי חוֹלֶה, יֵשׁ לִי חוֹם. אֲנִי לֹא בָּא הַיּוֹם.'], ['health/chole', 'health/chom', 'time/hayom']),
    wt('w36', 'Tell the doctor what hurts.',
       [('it hurts', ['כואב לי', 'כואבת לי', 'כואבים לי', 'כואבות לי']), ('a body part', ['ראש', 'הראש', 'בטן', 'הבטן', 'גב', 'הגב', 'גרון', 'הגרון'])],
       ['כּוֹאֵב לִי הָרֹאשׁ וְכוֹאֶבֶת לִי הַבֶּטֶן.'], ['health/koev-li', 'health/rosh', 'health/beten']),
  ])

lesson('a2-19', 'A2', 'Weather & weekends', 'מֶזֶג אֲוִויר',
  "<p>Real conditions use <b>אִם</b> + future: <b>אִם יִהְיֶה חַם, נֵלֵךְ לַיָּם</b>. Weather talk is a national hobby (especially <b>לַח</b> — humid).</p><p>Verb course: hif'il <b>present</b> — shape <b>ma·12i3</b>: מַזְמִין, מַתְחִיל. And meet nif'al: root and binyan of <b>לְהִיכָּנֵס</b>.</p>",
  S('weather', 'cham', 'kar', 'lach', 'geshem', 'yored-geshem', 'shemesh', 'kayitz', 'choref', 'mitriya', 'tiyul', 'maalot') + S('connectors', 'im') + S('time', 'shabat') + S('home', 'lehadlik'),
  verbs=['hifil/hizmin@present', 'hifil/hitchil@present', 'nifal/nichnas@binyan', 'nifal/nishar@inf'],
  phrases=['challenge/c21', 'challenge/c32', 'challenge/c13',
           cp('cp21', 'הֵם מַזְמִינִים מִשְׁלוֹחַ כָּל עֶרֶב.', 'They order delivery every evening.', ['hifil/hizmin-present-mp', 'shopping/mishloach'])],
  write=[
    wt('w37', "Make a weekend plan: if it's hot we'll go to the beach; if it rains we'll stay home.",
       [('if', ['אם']), ('hot', ['חם']), ('the beach', ['לים', 'לחוף']), ('rain', ['גשם']), ('at home', ['בבית'])],
       ['אִם יִהְיֶה חַם, נֵלֵךְ לַיָּם. אִם יֵרֵד גֶּשֶׁם, נִישָּׁאֵר בַּבַּיִת.'], ['connectors/im', 'weather/cham', 'around/yam', 'weather/geshem']),
    wt('w38', 'Complain about today\'s weather.',
       [('weather word', ['חם', 'קר', 'לח', 'גשם', 'חמסין']), ('today', ['היום'])],
       ['אֵיזֶה חוֹם הַיּוֹם! וְגַם מַמָּשׁ לַח.'], ['weather/cham', 'weather/lach', 'time/hayom']),
  ])

lesson('a2-20', 'A2', 'Work & study', 'עֲבוֹדָה',
  "<p>Office life and the language of being busy: <b>עָמוּס, לָחוּץ, דֶּדְלַיין</b>. Join reasons with <b>בִּגְלַל</b> (because of + noun) and <b>כְּשֶׁ־</b> (when).</p><p>Verb course: hif'il <b>past</b> (<b>הִזְמַנְתִּי, הִתְחַלְנוּ</b>), pi'el commands, and hitpa'el's root and binyan.</p>",
  S('work', 'misrad', 'pgisha', 'menahel', 'maskoret', 'amus', 'lachutz', 'deadline', 'hightech', 'ulpan', 'mivchan', 'chufsha') + S('connectors', 'kshe', 'biglal') + S('around', 'pkak') + S('time', 'meuchar', 'meacher'),
  verbs=['hifil/hizmin@past', 'hifil/hitchil@past', 'hitpael/hitkasher@binyan', 'piel/diber@imp'],
  phrases=['challenge/c18', 'challenge/c19', 'challenge/c36',
           cp('cp22', 'הִזְמַנְתִּי לָנוּ שׁוּלְחָן לִשְׁמוֹנֶה.', 'I booked us a table for eight.', ['hifil/hizmin-past-1s', 'home/shulchan', 'numbers/8'])],
  write=[
    wt('w39', "Message a colleague: you're late to the meeting because of traffic.",
       [('late', ['מאחר', 'מאחרת', 'מאוחר', 'איחרתי', 'אאחר']), ('meeting', ['פגישה', 'לפגישה']), ('because of', ['בגלל']), ('traffic', ['פקק', 'הפקק', 'פקקים', 'הפקקים'])],
       ['אֲנִי מְאַחֵר לַפְּגִישָׁה בִּגְלַל הַפְּקָק.'], ['time/meacher', 'work/pgisha', 'connectors/biglal', 'around/pkak']),
    wt('w40', "Say you're swamped this week and have a deadline tomorrow.",
       [('swamped', ['עמוס', 'עמוסה']), ('deadline', ['דדליין']), ('tomorrow', ['מחר'])],
       ['אֲנִי עָמוּס הַשָּׁבוּעַ, יֵשׁ לִי דֶּדְלַיין מָחָר.'], ['work/amus', 'work/deadline', 'time/machar']),
  ])

lesson('a2-21', 'A2', 'Phone & messages', 'וַואטְסְאַפּ',
  "<p>Israel runs on WhatsApp. Commands in messages use the future: <b>תִּשְׁלַח לִי מִיקוּם</b>, <b>תְּעַדְכֵּן אוֹתִי</b>, <b>תִּתְקַשֵּׁר אֵלַיי</b>.</p><p>Verb course: hitpa'el <b>present</b> — shape <b>mit·1a·2e3</b> (מִתְקַשֵּׁר) — and nif'al present (נִכְנָס).</p>",
  S('tech', 'hodaa', 'whatsapp', 'solela', 'mitan', 'tmuna', 'letzalem', 'lishloach-mikum', 'teadken', 'kvutza', 'haklata') + S('verbs', 'lehitkasher') + S('time', 'daka', 'ma-hatochnit', 'beintayim'),
  verbs=['hitpael/hitkasher@present', 'nifal/nichnas@present'],
  phrases=['challenge/c12', 'challenge/c24', 'challenge/c42', 'challenge/c47', 'phrases2/q12',
           cp('cp23', 'מִי מִתְקַשֵּׁר עַכְשָׁיו?', "Who's calling now?", ['hitpael/hitkasher-present-ms', 'connectors/mi', 'time/achshav'])],
  write=[
    wt('w41', 'Text a friend: send me your location, and call me when you arrive.',
       [('location', ['מיקום']), ('call me', ['תתקשר', 'תתקשרי']), ('when', ['כש'])],
       ['תִּשְׁלַח לִי מִיקוּם, וְתִתְקַשֵּׁר אֵלַיי כְּשֶׁאַתָּה מַגִּיעַ.'], ['tech/lishloach-mikum', 'verbs/lehitkasher', 'connectors/kshe']),
    wt('w42', 'Your phone is dying. Ask if anyone has a charger.',
       [('charger', ['מטען']), ('does anyone / do you have', ['יש למישהו', 'יש לך', 'יש לכם'])],
       ['אֵין לִי סוֹלְלָה. יֵשׁ לְמִישֶׁהוּ מִטְעָן?'], ['tech/mitan', 'tech/solela']),
  ])

lesson('a2-22', 'A2', 'Free time', 'פְּנַאי',
  "<p>Going out, staying in, the beach and the BBQ. <b>לְבַלּוֹת</b> (to have a good time) is the verb you'll hear most: <b>בִּילִּינוּ!</b></p><p>Verb course: hif'il <b>future</b> (<b>אַזְמִין, נַתְחִיל</b>) and hitpa'el <b>past</b> (<b>הִתְקַשַּׁרְתִּי</b>).</p>",
  S('freetime', 'seret', 'sidra', 'hofaa', 'levalot', 'al-haesh', 'matkot', 'kaduregel', 'lehitarev', 'lehazmin-kartisim', 'larutz', 'lesachek', 'bar') + S('connectors', 'kol') + S('time', 'sofash') + S('adjectives', 'meanyen', 'muzar'),
  verbs=['hifil/hizmin@future', 'hifil/hitchil@future', 'hitpael/hitkasher@past'],
  phrases=['challenge/c22', 'challenge/c23', 'challenge/c28', 'challenge/c39', 'challenge/c48',
           cp('cp24', 'מָתַי הַסֶּרֶט יַתְחִיל?', 'When will the movie start?', ['hifil/hitchil-future-3ms', 'time/matai', 'freetime/seret'], alt=['מתי יתחיל הסרט'])],
  write=[
    wt('w43', 'Invite a friend to a concert on Saturday — you already bought tickets.',
       [('concert', ['הופעה', 'להופעה']), ('Saturday', ['שבת', 'בשבת']), ('I bought', ['קניתי']), ('tickets', ['כרטיסים'])],
       ['קָנִיתִי כַּרְטִיסִים לְהוֹפָעָה בְּשַׁבָּת. רוֹצֶה לָבוֹא?'], ['freetime/hofaa', 'time/shabat', 'freetime/lehazmin-kartisim']),
    wt('w44', 'Recommend a TV series and say why you like it.',
       [('series', ['סדרה', 'הסדרה']), ('because', ['כי']), ('a reason', ['אוהב', 'אוהבת', 'מעניינת', 'מצחיקה', 'מדהימה', 'טובה'])],
       ['אַתָּה חַיָּיב לִרְאוֹת אֶת הַסִּדְרָה הַזֹּאת, כִּי הִיא מַמָּשׁ מְעַנְיֶינֶת.'], ['freetime/sidra', 'connectors/ki', 'adjectives/meanyen']),
  ])

lesson('a2-23', 'A2', 'Longer sentences', 'מִשְׁפָּטִים אֲרוּכִּים',
  "<p>Time to join everything together: <b>כְּשֶׁ־</b> (when), <b>אַחֲרֵי</b> (after), <b>לִפְנֵי</b> (before), <b>בִּגְלַל</b> (because of), and comparisons with <b>יוֹתֵר</b> and <b>הֲכִי</b>. See <a href=\"#/grammar/questions\">Questions &amp; connectors</a>.</p><p>Verb course: nif'al <b>past</b> (נִכְנַסְנוּ) and hitpa'el <b>future</b> (אֶתְקַשֵּׁר).</p>",
  S('connectors', 'adayin', 'bichlal', 'afilu', 'lifnei', 'beetzem', 'bekitzur', 'eize', 'harbe', 'ktzat', 'yoter', 'hachi') + S('adjectives', 'ragil', 'mahir') + S('verbs', 'lehavin', 'lehagid', 'ledaber') + S('health', 'chadar-kosher') + S('family', 'panui') + S('home', 'laavor-dira'),
  verbs=['nifal/nichnas@past', 'hitpael/hitkasher@future', 'nifal/nishar@binyan'],
  phrases=['phrases2/q06', 'phrases2/q10', 'phrases2/q30', 'challenge/c43', 'challenge/c33', 'challenge/c45', 'challenge/c31',
           cp('cp25', 'נִכְנַסְנוּ לְבָר קָטָן לְיַד הַיָּם.', 'We went into a small bar near the beach.', ['nifal/nichnas-past-1p', 'freetime/bar', 'adjectives/katan', 'around/leyad'])],
  write=[
    wt('w45', 'Tell a short story about yesterday using כש, אחרי and בגלל.',
       [('when', ['כש']), ('after', ['אחרי']), ('because of', ['בגלל'])],
       ['אֶתְמוֹל, כְּשֶׁיָּצָאתִי מֵהָעֲבוֹדָה, הָיָה פְּקָק. בִּגְלַל הַפְּקָק הִגַּעְתִּי מְאוּחָר, וְאַחֲרֵי זֶה הָלַכְנוּ לַיָּם.'], ['connectors/kshe', 'connectors/acharei', 'connectors/biglal']),
    wt('w46', 'Compare two places in the city — use יותר and הכי.',
       [('more', ['יותר']), ('the most', ['הכי'])],
       ['פְלוֹרֶנְטִין יוֹתֵר רוֹעֶשֶׁת מִיָּפוֹ, אֲבָל הַבָּרִים שָׁם הֲכִי טוֹבִים.'], ['connectors/yoter', 'connectors/hachi']),
  ])

lesson('a2-24', 'A2', 'Life in Tel Aviv · A2 review', 'הַחַיִּים בְּתֵל אָבִיב',
  "<p>The final lesson pulls everything together: the very Israeli words (<b>פְרַאיֶיר, בִּיט, וַעַד בַּיִת, מַמָּ״ד</b>) and long challenge sentences that use vocabulary from across the whole course.</p><p>Verb course: nif'al <b>future</b>, nif'al present of לְהִישָּׁאֵר, hif'il commands, and hitpa'el's root and binyan of לְהִתְרַגֵּשׁ.</p>",
  S('shopping', 'freier', 'bit', 'tashlumim') + S('feelings', 'chutzpa') + S('street', 'titchadesh') + S('home', 'vaad-bayit', 'mamad', 'lenakot') + S('family', 'lehitchaten', 'chatuna') + S('smalltalk', 'shutaf') + S('numbers', '1000'),
  verbs=['nifal/nichnas@future', 'nifal/nishar@present', 'hifil/hizmin@imp', 'hitpael/hitragesh@binyan'],
  phrases=['challenge/c49', 'challenge/c40', 'challenge/c50', 'challenge/c46', 'challenge/c44',
           cp('cp26', 'אֲנִי אֶכָּנֵס רַק לְדַקָּה.', "I'll just pop in for a minute.", ['nifal/nichnas-future-1s', 'connectors/rak', 'time/daka'], alt=['אני איכנס רק לדקה', 'אכנס רק לדקה'])],
  write=[
    wt('w47', 'WhatsApp your roommate: the rent is due — send it to me on Bit.',
       [('rent', ['שכר דירה', 'שכר הדירה']), ('Bit', ['ביט', 'בביט']), ('send / pay', ['תעביר', 'תעבירי', 'תשלם', 'תשלמי', 'תשלח', 'תשלחי'])],
       ['הַיי, צָרִיךְ לְשַׁלֵּם שְׂכַר דִּירָה. תַּעֲבִיר לִי בְּבִּיט?'], ['home/schar-dira', 'shopping/bit']),
    wt('w48', 'Write 3–4 sentences about your life in Tel Aviv: where you live, what you do, what you love and what annoys you.',
       [('where you live', ['גר', 'גרה']), ('what you do', ['עובד', 'עובדת', 'לומד', 'לומדת']), ('what you love', ['אוהב', 'אוהבת']), ('what annoys you', ['מעצבן', 'מעצבנים', 'נמאס לי', 'על הפנים'])],
       ['אֲנִי גָּר בִּפְלוֹרֶנְטִין וְעוֹבֵד בְּהַיְיטֶק. אֲנִי אוֹהֵב אֶת הַיָּם וְאֶת הָאוֹכֶל. מָה שֶׁמְּעַצְבֵּן זֶה שְׂכַר הַדִּירָה.'], ['smalltalk/gar-tlv', 'verbs/leehov', 'feelings/meatzben', 'feelings/nimas-li']),
  ])

# ---------------- extra writing tasks: every word of every lesson gets written at least once ----------------
from write_extra import EXTRA
for _l in LESSONS:
    _l['write'] += [ut(**t) for t in EXTRA.get(_l['id'], [])]

json.dump(basics, open(D('basics.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'items': list(CP.values())}, open(D('course-phrases.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'items': list(WT.values())}, open(D('course-write.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'lessons': LESSONS}, open(os.path.join(ROOT, 'data', 'course.json'), 'w'), ensure_ascii=False, indent=1)
print('lessons', len(LESSONS), 'basics', len(basics['items']), 'course phrases', len(CP), 'writing tasks', len(WT))
