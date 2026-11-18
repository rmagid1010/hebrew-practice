"""Scenarios: one realistic conversation per course lesson, built from that lesson's words (and earlier ones).

Run from the repo root:  python3 tools/scenarios/scenarios.py .   → data/scenarios.json
tools/validate-scenarios.mjs checks every model reply (as a man and as a woman) against its checklist and for gender agreement.

Templates: {masculine|feminine} picks the form for YOUR gender (you choose ♂ / ♀ before playing).
Characters have a fixed gender, so lines to them are written in that gender.

N(who, hebrew, english)       a character speaks
X(english)                    stage direction
Y(cue, checklist, model, to)  your turn: checklist = [(label, [accepted words / phrases]), ...]
                              `to` = who you're talking to (default: the last character who spoke)
"""
import json, os, sys

def N(who, he, en): return {'t': 'npc', 'who': who, 'he': he, 'en': en}
def X(en): return {'t': 'narr', 'en': en}
def Y(cue, els, model, to=None):
    d = {'t': 'you', 'cue': cue, 'elements': [{'label': l, 'any': a} for l, a in els], 'model': model}
    if to: d['to'] = to
    return d
def C(name_en, name_he, g, role): return {'name': name_en, 'he': name_he, 'g': g, 'role': role}

THANKS = ('thanks', ['תודה'])
S = []
def scenario(id_, lesson, title, he, setting, cast, turns):
    S.append({'id': id_, 'lesson': lesson, 'title': title, 'he': he, 'setting': setting, 'cast': cast, 'turns': turns})

scenario('s01', 'a1-01', 'The new neighbour', 'הַשְּׁכֵנָה הַחֲדָשָׁה',
  "You're carrying shopping up the stairs when someone from upstairs stops to say hello.",
  {'noa': C('Noa', 'נוֹעָה', 'f', 'your neighbour from upstairs')}, [
  N('noa', 'הַיי! שָׁלוֹם!', 'Hi! Hello!'),
  Y('Say hello back.', [('hello', ['שלום', 'היי', 'הי'])], 'שָׁלוֹם!'),
  N('noa', 'אֲנִי נוֹעָה, מִלְּמַעְלָה. מָה נִשְׁמָע?', "I'm Noa, from upstairs. How's it going?"),
  Y("Say everything's good, thanks.", [('all good / fine', ['הכול טוב', 'בסדר', 'טוב']), THANKS], 'הַכּוֹל טוֹב, תּוֹדָה.'),
  N('noa', 'אֵיךְ קוֹרְאִים {לְךָ|לָךְ}?', "What's your name?"),
  Y('Tell her your name.', [('my name is…', ['קוראים לי', 'אני'])], 'קוֹרְאִים לִי {דָּנִי|דָּנָה}.'),
  N('noa', 'נָעִים מְאוֹד!', 'Nice to meet you!'),
  Y('Say nice to meet you, and thank you very much (she held the door).', [('nice to meet you', ['נעים מאוד']), ('thank you very much', ['תודה רבה', 'תודה'])],
    'נָעִים מְאוֹד, תּוֹדָה רַבָּה!'),
  N('noa', 'בְּבַקָּשָׁה! טוֹב, שָׁלוֹם!', "You're welcome! OK, bye!"),
  Y('Say goodbye.', [('goodbye', ['שלום', 'ביי', 'להתראות'])], 'שָׁלוֹם!'),
])

scenario('s02', 'a1-02', 'Who is who at the party', 'מִי זֶה?',
  'Your friend Yoni drags you into a party where you know nobody.',
  {'yoni': C('Yoni', 'יוֹנִי', 'm', 'your friend')}, [
  N('yoni', 'הַיי! זֶה הֶחָבֵר שֶׁלִּי, אָבִי. וְזֹאת מָאיָה.', 'Hey! This is my friend Avi. And this is Maya.'),
  Y('A man by the door waves at you. Ask Yoni who that is.', [('who', ['מי']), ('that (a man)', ['זה'])], 'וּמִי זֶה?'),
  N('yoni', 'זֶה דָּנִי. הוּא חָבֵר שֶׁל מָאיָה.', "That's Dani. He's a friend of Maya's."),
  Y('Yoni is holding a strange-looking cup. Ask what it is.', [('what is this?', ['מה זה'])], 'מָה זֶה?'),
  N('yoni', 'זֶה קָפֶה קַר. וְזֶה?', "It's iced coffee. And this?"),
  Y("Say this is your coffee.", [('this is', ['זה']), ('my coffee', ['קפה שלי', 'הקפה שלי'])], 'זֶה הַקָּפֶה שֶׁלִּי.'),
  N('yoni', 'וְאֵלֶּה? אֵלֶּה הַחֲבֵרִים {שֶׁלְּךָ|שֶׁלָּךְ}?', 'And these? Are these your friends?'),
  Y('Say yes, these are your friends.', [('yes', ['כן']), ('these are', ['אלה', 'אלו']), ('my friends', ['חברים שלי', 'החברים שלי'])],
    'כֵּן, אֵלֶּה הַחֲבֵרִים שֶׁלִּי.'),
  N('yoni', 'טוֹב, אֲנִי הוֹלֵךְ. עֶרֶב טוֹב!', "OK, I'm off. Good evening!"),
  Y('Wish him good evening too.', [('good evening', ['ערב טוב', 'לילה טוב'])], 'עֶרֶב טוֹב, גַּם לְךָ!'),
])

scenario('s03', 'a1-03', 'Beach plans', 'יַאלְלָה לַיָּם',
  "Your friend Tal calls on a hot afternoon. Answer like a local.",
  {'tal': C('Tal', 'טַל', 'f', 'your friend')}, [
  N('tal', 'יַאלְלָה, בָּאִים לַיָּם?', 'Come on, are you coming to the beach?'),
  Y('Say: cool, of course!', [('cool / OK', ['סבבה', 'אחלה', 'אוקיי', 'יאללה']), ('of course', ['ברור', 'בטח', 'בכיף'])], 'סַבָּבָה, בָּרוּר!'),
  N('tal', 'אַחְלָה! עוֹד עֶשֶׂר דַּקּוֹת?', 'Great! In ten minutes?'),
  Y('Say: no problem, happily.', [('no problem', ['אין בעיה', 'בקטנה']), ('happily', ['בכיף'])], 'אֵין בְּעָיָה, בְּכֵיף.'),
  N('tal', 'רֶגַע… גַּם דָּנִי בָּא!', "Wait… Dani's coming too!"),
  Y('React: really? Wow!', [('really?', ['באמת', 'ואללה'])], 'בֶּאֱמֶת? וַאלְלָה!'),
  N('tal', 'מָתַי הוּא מַגִּיעַ? אֵין לִי מוּשָּׂג.', "When is he arriving? I have no idea."),
  Y("Say you have no idea either — wait a sec, you'll ask him.", [('I have no idea', ['אין לי מושג']), ('wait a sec', ['רגע', 'שנייה'])],
    'אֵין לִי מוּשָּׂג. רֶגַע…'),
  N('tal', 'אוֹקֵיי, בַּיי!', 'OK, bye!'),
  Y('Say: see you, bye!', [('see you / bye', ['ביי', 'להתראות', 'נתראה'])], 'יַאלְלָה, בַּיי! לְהִתְרָאוֹת!'),
])

scenario('s04', 'a1-04', "At Avi's place", 'אֵצֶל אָבִי',
  "You've come round to your friend Avi's flat for the first time.",
  {'avi': C('Avi', 'אָבִי', 'm', 'your friend')}, [
  N('avi', '{אַתָּה רוֹצֶה|אַתְּ רוֹצָה} קָפֶה? אוֹ תֵּה?', 'Do you want coffee? Or tea?'),
  Y('Say you want tea, please.', [('I want', ['רוצה', 'בא לי']), ('tea', ['תה']), ('please', ['בבקשה'])],
    'אֲנִי {רוֹצֶה|רוֹצָה} תֵּה, בְּבַקָּשָׁה.'),
  N('avi', 'אוּף, אֵין לִי תֵּה… יֵשׁ קָפֶה וּבִירָה.', "Ugh, I don't have tea… there's coffee and beer."),
  Y('Say no problem — you feel like a beer.', [('no problem', ['אין בעיה']), ('I feel like', ['בא לי', 'רוצה']), ('beer', ['בירה'])],
    'אֵין בְּעָיָה, בָּא לִי בִּירָה.'),
  N('avi', '{אַתָּה אוֹהֵב|אַתְּ אוֹהֶבֶת} בִּירָה?', 'You like beer?'),
  Y("Say yes, you like beer a lot — but not coffee.", [('I like', ['אוהב', 'אוהבת']), ('a lot', ['מאוד']), ('but', ['אבל'])],
    'כֵּן, אֲנִי מְאוֹד {אוֹהֵב|אוֹהֶבֶת} בִּירָה, אֲבָל לֹא קָפֶה.'),
  N('avi', 'יֵשׁ {לְךָ|לָךְ} חֲבֵרִים בְּתֵל אָבִיב?', 'Do you have friends in Tel Aviv?'),
  Y('Say yes, you have friends — and one good friend: him!', [('I have', ['יש לי']), ('friend(s)', ['חבר', 'חברים']), ('good', ['טוב'])],
    'כֵּן, יֵשׁ לִי חֲבֵרִים. וְיֵשׁ לִי חָבֵר טוֹב: אַתָּה!'),
  N('avi', 'חַחַח, תּוֹדָה! לְחַיִּים!', 'Haha, thanks! Cheers!'),
])

scenario('s05', 'a1-05', 'The chatty taxi driver', 'נֶהָג מוֹנִית',
  'Every Tel Aviv taxi driver wants to know your life story. This one is no exception.',
  {'moshe': C('Moshe', 'מֹשֶׁה', 'm', 'taxi driver')}, [
  N('moshe', 'מֵאֵיפֹה {אַתָּה|אַתְּ}? יֵשׁ {לְךָ|לָךְ} מִבְטָא.', 'Where are you from? You have an accent.'),
  Y("Say where you're from (e.g. London — מִלּוֹנְדוֹן).", [('from + a place', ['מ'])], 'אֲנִי מִלּוֹנְדוֹן.'),
  N('moshe', 'וְאֵיפֹה {אַתָּה גָּר|אַתְּ גָּרָה}?', 'And where do you live?'),
  Y('Say you live in Tel Aviv.', [('I live', ['גר', 'גרה']), ('in Tel Aviv', ['תל אביב'])], 'אֲנִי {גָּר|גָּרָה} בְּתֵל אָבִיב.'),
  N('moshe', '{אַתָּה מְדַבֵּר|אַתְּ מְדַבֶּרֶת} עִבְרִית מְצוּיָּן!', 'You speak excellent Hebrew!'),
  Y("Say thanks — you're learning Hebrew, but slowly.", [THANKS, ("I'm learning Hebrew", ['לומד עברית', 'לומדת עברית']), ('slowly', ['לאט'])],
    'תּוֹדָה! אֲנִי {לוֹמֵד|לוֹמֶדֶת} עִבְרִית, אֲבָל לְאַט.'),
  N('moshe', 'אָז מָה {אַתָּה עוֹשֶׂה|אַתְּ עוֹשָׂה} בָּאָרֶץ? {עוֹבֵד|עוֹבֶדֶת}, {לוֹמֵד|לוֹמֶדֶת}, מָה?', "So what are you doing in Israel? Working, studying, what?"),
  Y("He talks too fast. Say you don't understand, and ask him to speak slowly.", [("I don't understand", ['לא מבין', 'לא מבינה', 'לא הבנתי']), ('slowly', ['לאט'])],
    'סְלִיחָה, אֲנִי לֹא {מֵבִין|מְבִינָה}. לְאַט, בְּבַקָּשָׁה.'),
  N('moshe', 'סְלִיחָה! {אַתָּה סְטוּדֶנְט|אַתְּ סְטוּדֶנְטִית}?', 'Sorry! Are you a student?'),
  Y("Say you don't know that word — how do you say it in English? (Ask what it means.)", [("I don't know", ['לא יודע', 'לא יודעת']), ('what does it mean', ['מה זה אומר', 'איך אומרים'])],
    'אֲנִי לֹא {יוֹדֵעַ|יוֹדַעַת}. מָה זֶה אוֹמֵר?'),
  N('moshe', '{סְטוּדֶנְט|סְטוּדֶנְטִית}… student! חַחַח. בְּהַצְלָחָה!', 'Student! Haha. Good luck!'),
])

scenario('s06', 'a1-06', 'Breakfast at a café', 'אֲרוּחַת בּוֹקֶר בְּבֵית קָפֶה',
  'Saturday morning on Dizengoff. You walk into a busy café.',
  {'lior': C('Lior', 'לִיאוֹר', 'f', 'waitress')}, [
  N('lior', 'הַיי, לָשֶׁבֶת אוֹ לָקַחַת?', 'Hi — for here or to go?'),
  Y('Say for here — and ask if you can sit outside.', [('to sit (here)', ['לשבת']), ('can I…?', ['אפשר']), ('outside', ['בחוץ'])],
    'לָשֶׁבֶת. אֶפְשָׁר בַּחוּץ?'),
  N('lior', 'בָּרוּר. הִנֵּה הַתַּפְרִיט. מָה {תִּרְצֶה|תִּרְצִי}?', "Sure. Here's the menu. What would you like?"),
  Y('Order a latte without sugar.', [('can I get…', ['אפשר', 'אפשר לקבל', 'רוצה']), ('a latte', ['הפוך']), ('without sugar', ['בלי סוכר'])],
    'אֶפְשָׁר הָפוּךְ בְּלִי סוּכָּר?'),
  N('lior', 'וּמַשֶּׁהוּ לֶאֱכוֹל?', 'And something to eat?'),
  Y('Order a shakshuka, and water too.', [('shakshuka', ['שקשוקה']), ('water', ['מים'])], 'כֵּן, שַׁקְשׁוּקָה, וְגַם מַיִם בְּבַקָּשָׁה.'),
  X('Twenty minutes later…'),
  N('lior', 'נוּ, אֵיךְ הַשַּׁקְשׁוּקָה?', "So, how's the shakshuka?"),
  Y("Say the shakshuka is very tasty! (Careful: שַׁקְשׁוּקָה is feminine.)", [('tasty (feminine)', ['טעימה'])], 'הַשַּׁקְשׁוּקָה טְעִימָה מְאוֹד!'),
  N('lior', 'יוֹפִי! עוֹד מַשֶּׁהוּ?', 'Great! Anything else?'),
  Y('Say no thanks — can you have the bill?', [('no thanks', ['לא תודה']), ('the bill', ['חשבון'])], 'לֹא, תּוֹדָה. אֶפְשָׁר אֶת הַחֶשְׁבּוֹן?'),
])

scenario('s07', 'a1-07', 'Lost near the shuk', 'אֵיךְ מַגִּיעִים?',
  "You're on Allenby Street and want to get to the Carmel market, then to the beach.",
  {'yossi': C('Yossi', 'יוֹסִי', 'm', 'a man on the street'), 'tamar': C('Tamar', 'תָּמָר', 'f', 'a woman at the bus stop')}, [
  X('You stop a man on the street.'),
  Y('Excuse me — how do you get to the market?', [('excuse me', ['סליחה']), ('how do you get to', ['איך מגיעים']), ('the market', ['שוק'])],
    'סְלִיחָה, אֵיךְ מַגִּיעִים לַשּׁוּק?', to='yossi'),
  N('yossi', 'הַשּׁוּק? זֶה קָרוֹב. יָשָׁר, וְאָז יָמִינָה.', "The market? It's close. Straight on, then right."),
  Y('Check: straight and then right? Is it far?', [('straight', ['ישר']), ('right', ['ימינה']), ('far', ['רחוק'])],
    'יָשָׁר וְאָז יָמִינָה? זֶה רָחוֹק?'),
  N('yossi', 'לֹא, חָמֵשׁ דַּקּוֹת. {אַתָּה הוֹלֵךְ|אַתְּ הוֹלֶכֶת} אוֹ {נוֹסֵעַ|נוֹסַעַת}?', 'No, five minutes. Are you walking or taking the bus?'),
  Y("Say you're walking, and thank him very much.", [("I'm walking", ['הולך', 'הולכת', 'ברגל']), THANKS],
    'אֲנִי {הוֹלֵךְ|הוֹלֶכֶת}. תּוֹדָה רַבָּה!'),
  X('Later, at a bus stop. You want to get to the sea. A woman is waiting.'),
  Y('Ask her which (bus) line goes to the sea.', [('which line / bus', ['איזה קו', 'איזה אוטובוס']), ('to the sea', ['לים'])],
    'סְלִיחָה, אֵיזֶה קַו נוֹסֵעַ לַיָּם?', to='tamar'),
  N('tamar', 'קַו 4. אֲבָל הַתַּחֲנָה לֹא פֹּה, הִיא שָׁם, לְיַד הַשּׁוּק.', "Line 4. But the stop isn't here, it's there, next to the market."),
  Y('Check: there, next to the market?', [('there', ['שם']), ('next to', ['ליד'])], 'שָׁם, לְיַד הַשּׁוּק?'),
  N('tamar', 'כֵּן, בְּדִיּוּק. בְּהַצְלָחָה!', 'Yes, exactly. Good luck!'),
])

scenario('s08', 'a1-08', 'The kiosk', 'בַּפִּיצוּצִיָּה',
  "Late evening. You stop at the 24-hour kiosk on the corner for drinks.",
  {'kobi': C('Kobi', 'קוֹבִי', 'm', 'kiosk owner')}, [
  N('kobi', 'כֵּן, {אָחִי|אֲחוֹתִי}, מָה {תִּרְצֶה|תִּרְצִי}?', 'Yes, bro/sis, what would you like?'),
  Y('Ask how much a beer costs.', [('how much', ['כמה']), ('costs', ['עולה']), ('beer', ['בירה'])], 'כַּמָּה עוֹלָה בִּירָה?'),
  N('kobi', 'עֶשְׂרִים שֶׁקֶל.', 'Twenty shekels.'),
  Y("Say: twenty?! That's expensive!", [('twenty', ['עשרים', '20']), ('expensive', ['יקר'])], 'עֶשְׂרִים? זֶה יָקָר!'),
  N('kobi', 'טוֹב, {בִּשְׁבִילְךָ|בִּשְׁבִילֵךְ} — עֶשֶׂר.', 'OK, for you — ten.'),
  Y("Say that's cheap — you want two beers.", [('cheap', ['זול']), ('two', ['שתי', 'שתיים', 'שניים', '2']), ('beers', ['בירות', 'בירה'])],
    'זֶה זוֹל! אֲנִי {רוֹצֶה|רוֹצָה} שְׁתֵּי בִּירוֹת.'),
  N('kobi', 'עֶשְׂרִים שֶׁקֶל. וְ{תִּרְצֶה|תִּרְצִי} גַּם מַיִם?', 'Twenty shekels. And would you like water too?'),
  Y('Ask how much the water costs. (מַיִם is plural!)', [('how much', ['כמה']), ('cost (plural)', ['עולים'])], 'כַּמָּה עוֹלִים הַמַּיִם?'),
  N('kobi', 'חָמֵשׁ.', 'Five.'),
  Y("Say OK, here's twenty-five shekels.", [('twenty-five', ['עשרים וחמש', 'עשרים וחמישה', '25']), ('shekel(s)', ['שקל', 'שקלים'])],
    'אוֹקֵיי, הִנֵּה עֶשְׂרִים וְחָמֵשׁ שֶׁקֶל.'),
  N('kobi', 'תּוֹדָה, {אָחִי|אֲחוֹתִי}. לַיְלָה טוֹב!', 'Thanks! Good night!'),
])

scenario('s09', 'a1-09', 'Making plans', 'קוֹבְעִים',
  'Your friend Maya messages you to meet up.',
  {'maya': C('Maya', 'מָאיָה', 'f', 'your friend')}, [
  N('maya', 'הַיי! יֵשׁ {לְךָ|לָךְ} זְמַן הַיּוֹם?', 'Hey! Do you have time today?'),
  Y('Say not today — but tomorrow, yes.', [('not today', ['לא היום', 'היום לא']), ('tomorrow', ['מחר'])], 'הַיּוֹם לֹא, אֲבָל מָחָר כֵּן.'),
  N('maya', 'סַבָּבָה. מָתַי? בַּבּוֹקֶר?', 'Cool. When? In the morning?'),
  Y("Say in the evening — let's go out tomorrow evening. (Talk to her!)", [('in the evening', ['בערב']), ("let's", ['בואי', 'בוא']), ('go out', ['נצא', 'לצאת'])],
    'בָּעֶרֶב. בּוֹאִי נֵצֵא מָחָר בָּעֶרֶב.'),
  N('maya', 'אַחְלָה. בִּשְׁמוֹנֶה?', 'Great. At eight?'),
  Y("Agree: at eight — it's a date!", [('eight', ['שמונה', '8']), ("it's a date", ['קבענו'])], 'בִּשְׁמוֹנֶה, קָבַעְנוּ!'),
  X('The next evening, 19:55. Your phone buzzes.'),
  N('maya', '{אַתָּה|אַתְּ} כְּבָר בַּדֶּרֶךְ?', 'Are you on your way already?'),
  Y("Say not yet — you're coming in a bit.", [('not yet', ['עוד לא']), ("I'm coming", ['בא', 'באה', 'מגיע', 'מגיעה']), ('soon', ['עוד מעט', 'תכף', 'אחר כך'])],
    'עוֹד לֹא… אֲנִי {בָּא|בָּאָה} עוֹד מְעַט!'),
  N('maya', 'יַאלְלָה, אֲנִי מְחַכָּה.', "Come on, I'm waiting."),
])

scenario('s10', 'a1-10', 'Small talk at a party', 'שִׂיחַת חֻלִּין',
  'A friend of a friend sits down next to you on the balcony.',
  {'itay': C('Itay', 'אִיתַי', 'm', 'a guy at the party')}, [
  N('itay', '{תַּגִּיד|תַּגִּידִי}… מָה {אַתָּה עוֹשֶׂה|אַתְּ עוֹשָׂה} בַּחַיִּים?', 'So tell me… what do you do?'),
  Y('Say you work in Tel Aviv, and ask what he does.', [('I work', ['עובד', 'עובדת']), ('and you? / what do you do?', ['ואתה', 'מה אתה עושה'])],
    'אֲנִי {עוֹבֵד|עוֹבֶדֶת} בְּתֵל אָבִיב. וּמָה אַתָּה עוֹשֶׂה?'),
  N('itay', 'אֲנִי? סְתָם, אֲנִי עוֹבֵד בְּבָר. תַּכְלֶס, זֹאת לֹא עֲבוֹדָה, זֶה כֵּיף.', "Me? Nothing special, I work in a bar. Honestly, it's not work, it's fun."),
  Y("React: really? That's totally great.", [('really', ['באמת', 'ואללה', 'ממש']), ('great', ['אחלה', 'סבבה', 'יופי'])], 'בֶּאֱמֶת? מַמָּשׁ אַחְלָה.'),
  N('itay', '{אַתָּה מַכִּיר|אַתְּ מַכִּירָה} פֹּה הַרְבֵּה אֲנָשִׁים?', 'Do you know lots of people here?'),
  Y("Say not really — just the guys from work.", [('not really', ['לא ממש', 'לא']), ('the guys / gang', ['חבר׳ה', 'חברה']), ('work', ['עבודה'])],
    "לֹא מַמָּשׁ, רַק הַחֶבְרֶ'ה מֵהָעֲבוֹדָה."),
  N('itay', 'טוֹב, אֲנִי זָז. נִתְרָאֶה!', "OK, I'm off. See you!"),
  Y("Say: see you, we'll talk!", [('see you', ['נתראה', 'להתראות', 'ביי']), ("we'll talk", ['נדבר'])], 'נִתְרָאֶה, נְדַבֵּר!'),
])

scenario('s11', 'a1-11', 'Monday morning', 'יוֹם רִאשׁוֹן בַּבּוֹקֶר',
  "It's Sunday morning (the start of the Israeli week). A colleague asks about your weekend.",
  {'dana': C('Dana', 'דָּנָה', 'f', 'a colleague')}, [
  N('dana', 'בֹּקֶר טוֹב! מָה {עָשִׂיתָ|עָשִׂית} בַּסּוֹפָ״שׁ?', 'Good morning! What did you do at the weekend?'),
  Y('Say you saw friends and you ate together.', [('I saw', ['ראיתי']), ('friends', ['חברים']), ('ate', ['אכלתי', 'אכלנו'])],
    'רָאִיתִי חֲבֵרִים, וְאָכַלְנוּ בְּיַחַד.'),
  N('dana', 'נֶחְמָד! וּמָה שְׁתִיתֶם?', 'Nice! And what did you drink?'),
  Y('Say you drank beer, and then you were tired.', [('I drank', ['שתיתי', 'שתינו']), ('beer', ['בירה']), ('tired', ['עייף', 'עייפה'])],
    'שָׁתִיתִי בִּירָה, וְאָז הָיִיתִי {עָיֵיף|עֲיֵיפָה}.'),
  N('dana', '{שָׁמַעְתָּ|שָׁמַעְתְּ} מָה קָרָה לְיוֹנִי?', 'Did you hear what happened to Yoni?'),
  Y("Say no — what?", [('no', ['לא']), ('what', ['מה'])], 'לֹא, מָה?'),
  N('dana', 'הוּא קָנָה דִּירָה!', 'He bought an apartment!'),
  Y('React: wow, really? Where?', [('really?', ['באמת', 'ואללה']), ('where', ['איפה'])], 'וַאלְלָה, בֶּאֱמֶת? אֵיפֹה?'),
  N('dana', 'בְּיָפוֹ. הוּא גָּר שָׁם כְּבָר שָׁבוּעַ.', "In Jaffa. He's been living there a week already."),
])

scenario('s12', 'a1-12', 'News from Gal', 'חֲדָשׁוֹת מִגַּל',
  'Your friend Gal has news, good and bad. React like a Tel Avivi.',
  {'gal': C('Gal', 'גַּל', 'm', 'your friend')}, [
  N('gal', '{אָחִי|אֲחוֹתִי}, {שָׁמַעְתָּ|שָׁמַעְתְּ}? הַהוֹפָעָה מָחָר בּוּטְלָה.', "Did you hear? Tomorrow's concert is cancelled."),
  Y('React: what a bummer!', [('bummer / shame', ['באסה', 'חבל'])], 'אֵיזוֹ בַּאסָה!'),
  N('gal', 'אֲבָל… יֵשׁ לִי כַּרְטִיסִים לְמַכַּבִּי בְּשַׁבָּת!', 'But… I have tickets for Maccabi on Saturday!'),
  Y('React: no way! Amazing!', [('no way!', ['אין מצב', 'מה פתאום', 'באמת']), ('amazing', ['חבל על הזמן', 'אש', 'יופי', 'אחלה'])],
    'אֵין מַצָּב! חֲבָל עַל הַזְּמַן!'),
  N('gal', 'אֲבָל הַמְּקוֹמוֹת עַל הַפָּנִים.', 'But the seats are terrible.'),
  Y("Say: too bad, it doesn't matter.", [('too bad', ['חבל']), ("doesn't matter", ['לא משנה'])], 'חֲבָל, לֹא מְשַׁנֶּה.'),
  N('gal', 'וְאֶצְלִי בַּדִּירָה בָּלָגָן. נִיפָּגֵשׁ {אֶצְלְךָ|אֶצְלֵךְ}?', "And my place is a mess. Shall we meet at yours?"),
  Y("Say: no way! …Just kidding, of course.", [('no way', ['מה פתאום', 'אין מצב']), ('just kidding', ['סתם']), ('of course', ['ברור', 'בטח'])],
    'מָה פִּתְאוֹם! סְתָם, בָּרוּר.'),
  N('gal', '{כַּפָּרָה עָלֶיךָ|כַּפָּרָה עָלַיִךְ}!', "You're the best!"),
])

scenario('s13', 'a2-13', 'Viewing an apartment', 'רוֹאִים דִּירָה',
  "You're looking at a flat in Florentin. The landlady shows you round.",
  {'rina': C('Rina', 'רִינָה', 'f', 'the landlady')}, [
  N('rina', 'שָׁלוֹם, {תִּיכָּנֵס|תִּיכָּנְסִי}. זֶה הַסָּלוֹן.', 'Hello, come in. This is the living room.'),
  Y("Say it's a big living room — and ask how many rooms there are.", [('big', ['גדול']), ('how many rooms', ['כמה חדרים'])],
    'זֶה סָלוֹן גָּדוֹל! כַּמָּה חֲדָרִים יֵשׁ?'),
  N('rina', 'שְׁלוֹשָׁה חֲדָרִים, מִטְבָּח וּמִרְפֶּסֶת.', 'Three rooms, a kitchen and a balcony.'),
  Y("Say the kitchen is small, but the balcony is big.", [('kitchen', ['מטבח']), ('small (m)', ['קטן']), ('balcony', ['מרפסת']), ('big (f)', ['גדולה'])],
    'הַמִּטְבָּח קָטָן, אֲבָל הַמִּרְפֶּסֶת גְּדוֹלָה.'),
  N('rina', 'כֵּן. וְיֵשׁ מַזְגָן בְּכָל חֶדֶר.', "Yes. And there's an air conditioner in every room."),
  Y('Ask if the neighbours are noisy at night.', [('the neighbours', ['שכנים']), ('noisy (plural)', ['רועשים']), ('at night', ['בלילה'])],
    'הַשְּׁכֵנִים רוֹעֲשִׁים בַּלַּיְלָה?'),
  N('rina', 'מָה פִּתְאוֹם! הֵם זְקֵנִים וּשְׁקֵטִים.', "Not at all! They're old and quiet."),
  Y('Ask how much the rent is.', [('how much', ['כמה']), ('the rent', ['שכר דירה', 'שכר הדירה', 'שכירות'])], 'כַּמָּה שְׂכַר הַדִּירָה?'),
  N('rina', 'שִׁשָּׁה אֲלָפִים לְחוֹדֶשׁ.', '6,000 a month.'),
  Y("Say the apartment is great, but expensive. (דִּירָה is feminine.)", [('the apartment', ['דירה']), ('expensive (f)', ['יקרה'])],
    'הַדִּירָה אַחְלָה, אֲבָל הִיא יְקָרָה.'),
  N('rina', '{תַּחְשֹׁב|תַּחְשְׁבִי} עַל זֶה. יֵשׁ עוֹד אֲנָשִׁים שֶׁרוֹצִים אוֹתָהּ…', "Think about it. There are other people who want it…"),
])

scenario('s14', 'a2-14', 'Buying a shirt', 'קוֹנִים חוּלְצָה',
  "You're in a clothes shop on Sheinkin. The salesman is keen.",
  {'ofir': C('Ofir', 'אוֹפִיר', 'm', 'salesman')}, [
  N('ofir', 'הַיי! {אַתָּה צָרִיךְ|אַתְּ צְרִיכָה} עֶזְרָה?', 'Hi! Do you need help?'),
  Y("Say you're just looking, thanks.", [('just looking', ['רק מסתכל', 'רק מסתכלת']), THANKS], 'רַק {מִסְתַּכֵּל|מִסְתַּכֶּלֶת}, תּוֹדָה.'),
  N('ofir', 'יֵשׁ מִבְצָע הַיּוֹם: שְׁתֵּי חוּלְצוֹת בְּמֵאָה.', "There's a sale today: two shirts for 100."),
  Y('Ask if you can try on this shirt.', [('can I', ['אפשר']), ('try on', ['למדוד']), ('this shirt', ['החולצה הזאת', 'החולצה הזו', 'חולצה'])],
    'אֶפְשָׁר לִמְדּוֹד אֶת הַחוּלְצָה הַזֹּאת?'),
  N('ofir', 'בָּרוּר. אֵיזוֹ מִידָּה?', 'Sure. What size?'),
  X('You try it on…'),
  Y("Say it's too small — is there a bigger size?", [('small (f)', ['קטנה']), ('size', ['מידה'])],
    'הִיא קְטַנָּה מִדַּי. יֵשׁ מִידָּה גְּדוֹלָה?'),
  N('ofir', 'הִנֵּה. זֶה מֵאָה וְעֶשְׂרִים.', "Here you go. That's 120."),
  Y('Ask if you can pay by card, or only cash.', [('pay', ['לשלם']), ('card', ['אשראי', 'כרטיס']), ('cash', ['מזומן'])],
    'אֶפְשָׁר לְשַׁלֵּם בְּאַשְׁרַאי, אוֹ רַק בִּמְזוּמָּן?'),
  N('ofir', 'אַשְׁרַאי זֶה בְּסֵדֶר. {רוֹצֶה|רוֹצָה} שַׂקִּית?', 'Card is fine. Want a bag?'),
  Y("Say no thanks — and ask if you can return it later.", [('no thanks', ['לא תודה']), ('return', ['להחזיר'])],
    'לֹא, תּוֹדָה. אֶפְשָׁר לְהַחְזִיר אַחַר כָּךְ?'),
  N('ofir', 'עַד שְׁבוּעַיִים, עִם קַבָּלָה. {תִּתְחַדֵּשׁ|תִּתְחַדְּשִׁי}!', 'Up to two weeks, with a receipt. Enjoy it!'),
])

scenario('s15', 'a2-15', 'The corner shop', 'בַּמַּכּוֹלֶת',
  'You pop into the makolet for groceries, then get home to a hungry roommate.',
  {'moshe': C('Moshe', 'מֹשֶׁה', 'm', 'shopkeeper'), 'shir': C('Shir', 'שִׁיר', 'f', 'your roommate')}, [
  N('moshe', 'בֹּקֶר טוֹב! מָה צָרִיךְ?', 'Good morning! What do you need?'),
  Y('Ask for bread and milk.', [('bread', ['לחם']), ('milk', ['חלב'])], 'אֶפְשָׁר לֶחֶם וְחָלָב?'),
  N('moshe', 'יֵשׁ. עוֹד מַשֶּׁהוּ?', 'Got it. Anything else?'),
  Y('Ask if he has eggs and cheese.', [('do you have', ['יש לך', 'יש']), ('eggs', ['ביצים']), ('cheese', ['גבינה'])],
    'יֵשׁ לְךָ בֵּיצִים וּגְבִינָה?'),
  N('moshe', "בֵּיצִים כֵּן. גְּבִינָה נִגְמְרָה, יֵשׁ קוֹטֶג'.", "Eggs, yes. The cheese is finished — there's cottage cheese."),
  Y('Ask if the vegetables are good today. (יְרָקוֹת is masculine plural.)', [('vegetables', ['ירקות']), ('good (m. pl.)', ['טובים'])],
    'וְהַיְּרָקוֹת טוֹבִים הַיּוֹם?'),
  N('moshe', 'מְעוּלִים! וְגַם הַפֵּירוֹת.', 'Excellent! And the fruit too.'),
  X('Back home. Your roommate Shir is staring into the fridge.'),
  N('shir', 'אֲנִי רְעֵבָה… {אַתָּה מְבַשֵּׁל|אַתְּ מְבַשֶּׁלֶת} הָעֶרֶב?', "I'm hungry… are you cooking tonight?"),
  Y("Say you're full — but let's order her a delivery.", [('full (after eating)', ['שבע', 'שבעה']), ("let's", ['בואי', 'בוא']), ('order', ['נזמין', 'להזמין']), ('delivery', ['משלוח'])],
    'אֲנִי {שָׂבֵעַ|שְׂבֵעָה}, אֲבָל בּוֹאִי נַזְמִין לָךְ מִשְׁלוֹחַ.', to='shir'),
  N('shir', 'אַחְלָה. אֲרוּחַת עֶרֶב בַּסָּלוֹן!', 'Great. Dinner in the living room!'),
])

scenario('s16', 'a2-16', "Friday dinner at the parents'", 'אֲרוּחַת שִׁישִּׁי',
  "Your partner takes you to their family's Friday-night dinner. Their mother has questions.",
  {'orna': C('Orna', 'אוֹרְנָה', 'f', "your partner's mother")}, [
  N('orna', '{בָּרוּךְ הַבָּא|בְּרוּכָה הַבָּאָה}! שַׁבַּת שָׁלוֹם!', 'Welcome! Shabbat shalom!'),
  Y('Say Shabbat shalom — and nice to meet her.', [('Shabbat shalom', ['שבת שלום']), ('nice to meet you', ['נעים מאוד'])],
    'שַׁבַּת שָׁלוֹם! נָעִים מְאוֹד.'),
  N('orna', '{תְּסַפֵּר|תְּסַפְּרִי} לִי, יֵשׁ {לְךָ|לָךְ} אַחִים?', 'Tell me, do you have brothers and sisters?'),
  Y('Say you have a brother and a sister.', [('a brother', ['אח']), ('a sister', ['אחות'])], 'יֵשׁ לִי אָח וְאָחוֹת.'),
  N('orna', 'וְהַהוֹרִים {שֶׁלְּךָ|שֶׁלָּךְ}? אֵיפֹה הֵם גָּרִים?', 'And your parents? Where do they live?'),
  Y('Say your parents live in London — but your sister lives in Tel Aviv.', [('my parents', ['ההורים שלי', 'הורים']), ('live (pl.)', ['גרים']), ('sister', ['אחות']), ('lives (f)', ['גרה'])],
    'הַהוֹרִים שֶׁלִּי גָּרִים בְּלוֹנְדוֹן, אֲבָל הָאָחוֹת שֶׁלִּי גָּרָה בְּתֵל אָבִיב.'),
  N('orna', '{אַתָּה נָשׂוּי|אַתְּ נְשׂוּאָה}? יֵשׁ יְלָדִים?', 'Are you married? Any kids?'),
  Y("Say: not yet! You don't have kids.", [('not yet', ['עוד לא']), ("I don't have", ['אין לי']), ('kids', ['ילדים'])],
    'עוֹד לֹא! אֵין לִי יְלָדִים.'),
  N('orna', 'טוֹב, טוֹב… {תֹּאכַל|תֹּאכְלִי}, {תֹּאכַל|תֹּאכְלִי}! יֵשׁ עוֹף.', "All right… eat, eat! There's chicken."),
  Y("Say it's really tasty — and her family is really nice. (מִשְׁפָּחָה is feminine.)", [('tasty', ['טעים']), ('family', ['משפחה']), ('nice (f)', ['נחמדה'])],
    'זֶה מַמָּשׁ טָעִים. וְהַמִּשְׁפָּחָה שֶׁלָּךְ מַמָּשׁ נֶחְמָדָה!'),
  N('orna', '{אַתָּה מָתוֹק|אַתְּ מְתוּקָה}! עוֹד קְצָת?', "You're sweet! A bit more?"),
])

scenario('s17', 'a2-17', 'A friend having a bad day', 'יוֹם רַע',
  'Your friend Noam is sitting alone on a bench, looking down.',
  {'noam': C('Noam', 'נֹעַם', 'm', 'your friend')}, [
  Y("Ask him why he's sad.", [('why', ['למה']), ('sad (m)', ['עצוב'])], 'לָמָּה אַתָּה עָצוּב?', to='noam'),
  N('noam', 'נִמְאַס לִי. הַבּוֹס שֶׁלִּי מְעַצְבֵּן, וַאֲנִי כָּל הַזְּמַן דּוֹאֵג.', "I'm fed up. My boss is annoying, and I worry all the time."),
  Y("Tell him: don't worry, it'll work out.", [("don't worry", ['אל תדאג', 'אל תדאגי']), ("it'll work out / be OK", ['יסתדר', 'יהיה בסדר'])],
    'אַל תִּדְאַג, זֶה יִסְתַּדֵּר.'),
  N('noam', 'וְ{אַתָּה|אַתְּ}? {אַתָּה שָׂמֵחַ|אַתְּ שְׂמֵחָה} פֹּה?', 'And you? Are you happy here?'),
  Y("Say you're happy, but sometimes it's hard for you.", [('happy', ['שמח', 'שמחה']), ("it's hard for me", ['קשה לי'])],
    'אֲנִי {שָׂמֵחַ|שְׂמֵחָה}, אֲבָל לִפְעָמִים קָשֶׁה לִי.'),
  N('noam', 'לָמָּה?', 'Why?'),
  Y("Say you're excited, because tomorrow is your first day at work.", [('excited', ['מתרגש', 'מתרגשת']), ('because', ['כי'])],
    'אֲנִי {מִתְרַגֵּשׁ|מִתְרַגֶּשֶׁת}, כִּי מָחָר יֵשׁ לִי יוֹם רִאשׁוֹן בָּעֲבוֹדָה.'),
  N('noam', 'וַאלְלָה, בְּהַצְלָחָה! {תִּתְקַשֵּׁר|תִּתְקַשְּׁרִי} אֵלַיי אַחַר כָּךְ.', 'Wow, good luck! Call me afterwards.'),
  Y("Say of course — we'll talk tomorrow.", [('of course', ['ברור', 'בטח']), ("we'll talk", ['נדבר'])], 'בָּרוּר, נְדַבֵּר מָחָר.'),
])

scenario('s18', 'a2-18', 'At the doctor', 'אֵצֶל הָרוֹפְאָה',
  "You feel awful. You've got an appointment at the kupat cholim.",
  {'levi': C('Dr Levi', 'דּוֹקְטוֹר לֵוִי', 'f', 'your doctor')}, [
  N('levi', 'שָׁלוֹם, {שֵׁב|שְׁבִי}. מָה קָרָה?', 'Hello, sit down. What happened?'),
  Y("Say you're sick: you have a fever and your head hurts.", [('sick', ['חולה']), ('fever', ['חום']), ('head hurts', ['כואב לי הראש', 'כואב לי ראש', 'הראש כואב'])],
    'אֲנִי {חוֹלֶה|חוֹלָה}. יֵשׁ לִי חוֹם וְכוֹאֵב לִי הָרֹאשׁ.'),
  N('levi', 'מִמָּתַי?', 'Since when?'),
  Y('Say since yesterday — you caught a cold.', [('yesterday', ['אתמול']), ('I caught a cold', ['הצטננתי'])], 'מֵאֶתְמוֹל. הִצְטַנַּנְתִּי.'),
  N('levi', 'גַּם הַבֶּטֶן כּוֹאֶבֶת?', 'Does your stomach hurt too?'),
  Y("Say no, your stomach is fine.", [('no', ['לא']), ('stomach', ['בטן'])], 'לֹא, הַבֶּטֶן בְּסֵדֶר.'),
  N('levi', 'טוֹב. זֹאת שַׁפַעַת. הִנֵּה תְּרוּפָה. {תִּישַׁן|תִּישְׁנִי} הַרְבֵּה וְ{תִּשְׁתֶּה|תִּשְׁתִּי} מַיִם.', "OK. It's the flu. Here's some medicine. Sleep a lot and drink water."),
  Y('Ask if you can get a sick note for work.', [('can I get', ['אפשר']), ('a sick note', ['אישור מחלה'])], 'אֶפְשָׁר לְקַבֵּל אִישּׁוּר מַחֲלָה לָעֲבוֹדָה?'),
  N('levi', 'בָּרוּר. {תַּרְגִּישׁ|תַּרְגִּישִׁי} טוֹב!', 'Of course. Feel better!'),
  Y('Thank her very much.', [THANKS], 'תּוֹדָה רַבָּה!'),
])

scenario('s19', 'a2-19', 'Weekend weather', 'מָה עוֹשִׂים בְּשַׁבָּת?',
  'Your friend Roni is planning Saturday. The forecast is not helping.',
  {'roni': C('Roni', 'רוֹנִי', 'm', 'your friend')}, [
  N('roni', 'מָה הַתּוֹכְנִית לְשַׁבָּת? {בָּא לְךָ|בָּא לָךְ} טִיּוּל?', "What's the plan for Saturday? Fancy a trip?"),
  Y("Say: if it's hot, you want to go to the sea.", [('if', ['אם']), ('hot', ['חם']), ('to the sea', ['לים'])],
    'אִם יִהְיֶה חַם, אֲנִי {רוֹצֶה|רוֹצָה} לָלֶכֶת לַיָּם.'),
  N('roni', 'אֲבָל אוֹמְרִים שֶׁיֵּרֵד גֶּשֶׁם בְּשַׁבָּת…', "But they say it'll rain on Saturday…"),
  Y("Say: rain in summer?! It's always hot here in summer.", [('rain', ['גשם']), ('summer', ['קיץ']), ('hot', ['חם'])],
    'גֶּשֶׁם בַּקַּיִץ? בַּקַּיִץ תָּמִיד חַם פֹּה!'),
  N('roni', 'סְתָם! זֶה חוֹרֶף עַכְשָׁיו… עֶשֶׂר מַעֲלוֹת.', "Kidding! It's winter now… ten degrees."),
  Y("Say: that's cold! Let's stay home.", [('cold', ['קר']), ("let's", ['בוא']), ('stay', ['נישאר', 'נשאר', 'להישאר'])],
    'קַר! בּוֹא נִישָּׁאֵר בַּבַּיִת.'),
  N('roni', 'טוֹב. אֲנִי בָּא אֵלֶיךָ… {תַּדְלִיק|תַּדְלִיקִי} אֶת הַמַּזְגָן!', "OK. I'm coming over… turn on the air conditioning!"),
  Y('Say OK — and tell him to bring an umbrella!', [('OK', ['סבבה', 'אוקיי', 'בסדר', 'טוב']), ('bring', ['תביא']), ('umbrella', ['מטריה', 'מטרייה'])],
    'סַבָּבָה, וְתָבִיא מִטְרִיָּה!'),
])

scenario('s20', 'a2-20', 'Late for the meeting', 'מְאַחֲרִים לַפְּגִישָׁה',
  "You're stuck in traffic on the Ayalon. Your manager calls.",
  {'efrat': C('Efrat', 'אֶפְרָת', 'f', 'your manager')}, [
  N('efrat', 'הַלוֹ? אֵיפֹה {אַתָּה|אַתְּ}? הַפְּגִישָׁה מַתְחִילָה!', 'Hello? Where are you? The meeting is starting!'),
  Y("Say sorry, you're late because of the traffic jam.", [('sorry', ['סליחה', 'מצטער', 'מצטערת']), ("I'm late", ['מאחר', 'מאחרת']), ('because of the traffic', ['בגלל הפקק', 'פקק'])],
    'סְלִיחָה, אֲנִי {מְאַחֵר|מְאַחֶרֶת} בִּגְלַל הַפְּקָק.'),
  N('efrat', 'טוֹב. מָתַי {אַתָּה מַגִּיעַ|אַתְּ מַגִּיעָה}?', 'OK. When are you getting here?'),
  Y('Say in twenty minutes.', [('twenty', ['עשרים', '20']), ('minutes', ['דקות'])], 'עוֹד עֶשְׂרִים דַּקּוֹת.'),
  N('efrat', 'וְהַדֶּדְלַיין? זֶה מָחָר.', "And the deadline? It's tomorrow."),
  Y("Say you know — you're swamped and stressed, but it'll be fine.", [('I know', ['יודע', 'יודעת']), ('swamped', ['עמוס', 'עמוסה']), ('stressed', ['לחוץ', 'לחוצה'])],
    'אֲנִי {יוֹדֵעַ|יוֹדַעַת}. אֲנִי {עָמוּס|עֲמוּסָה} וְ{לָחוּץ|לְחוּצָה}, אֲבָל יִהְיֶה בְּסֵדֶר.'),
  N('efrat', 'וְאַל {תִּשְׁכַּח|תִּשְׁכְּחִי}: צָרִיךְ לְבַקֵּשׁ חוּפְשָׁה לְפֶסַח עַד הַיּוֹם.', "And don't forget: you need to ask for Passover vacation by today."),
  Y("Thank her — you'll send her an email today.", [THANKS, ('email', ['מייל']), ('today', ['היום'])],
    'תּוֹדָה, אֲנִי אֶשְׁלַח לָךְ מֵייל הַיּוֹם.'),
])

scenario('s21', 'a2-21', 'Finding each other at the port', 'נִפְגָּשִׁים בַּנָּמָל',
  "You're meeting your friend Yael at the Tel Aviv port at sunset. It's crowded.",
  {'yael': C('Yael', 'יָעֵל', 'f', 'your friend')}, [
  N('yael', '{אַתָּה|אַתְּ} כְּבָר שָׁם? אֲנִי לֹא רוֹאָה {אוֹתְךָ|אוֹתָךְ}.', "Are you there already? I can't see you."),
  Y('Tell her to send you her location.', [('send me', ['תשלחי לי', 'שלחי לי', 'תשלחי']), ('location', ['מיקום'])], 'תִּשְׁלְחִי לִי מִיקוּם.'),
  N('yael', 'שָׁלַחְתִּי בַּוָּואטְסְאַפּ. {קִיבַּלְתָּ|קִיבַּלְתְּ}?', 'I sent it on WhatsApp. Did you get it?'),
  Y("Say no — you have no battery. Tell her to call you!", [('battery', ['סוללה']), ('call me', ['תתקשרי'])],
    'לֹא, אֵין לִי סוֹלְלָה. תִּתְקַשְּׁרִי אֵלַיי!'),
  X('Your phone rings.'),
  N('yael', 'הַלוֹ? נוּ, אֵיפֹה {אַתָּה|אַתְּ}?', 'Hello? So where are you?'),
  Y("Say you're next to the bar, by the sea.", [('next to', ['ליד']), ('the sea', ['ים'])], 'אֲנִי לְיַד הַבָּר, לְיַד הַיָּם.'),
  N('yael', 'אָה, אֲנִי רוֹאָה {אוֹתְךָ|אוֹתָךְ}! רֶגַע, {תְּצַלֵּם|תְּצַלְּמִי} אוֹתִי עִם הַשְּׁקִיעָה?', 'Oh, I see you! Wait, take a photo of me with the sunset?'),
  Y("Say sure — and you'll send the photo to the group.", [('sure', ['ברור', 'בטח', 'בכיף']), ('the photo', ['תמונה']), ('the group', ['קבוצה'])],
    'בָּרוּר! אֲנִי אֶשְׁלַח אֶת הַתְּמוּנָה בַּקְּבוּצָה.'),
])

scenario('s22', 'a2-22', 'Weekend plans', 'תּוֹכְנִיּוֹת לַסּוֹפָ״שׁ',
  'Your friend Ido always knows where the good shows are.',
  {'ido': C('Ido', 'עִידוֹ', 'm', 'your friend')}, [
  N('ido', 'מָה {אַתָּה עוֹשֶׂה|אַתְּ עוֹשָׂה} בַּסּוֹפָ״שׁ?', 'What are you doing this weekend?'),
  Y("Say you don't have plans — and ask what he's doing.", [("I don't have", ['אין לי']), ('plans', ['תוכניות', 'תוכנית']), ('and you?', ['ואתה', 'מה אתה עושה'])],
    'אֵין לִי תּוֹכְנִיּוֹת. וְאַתָּה?'),
  N('ido', 'יֵשׁ הוֹפָעָה בַּבָּארְבִּי בְּשִׁישִּׁי. {רוֹצֶה|רוֹצָה} לְהִצְטָרֵף?', "There's a gig at the Barby on Friday. Want to join?"),
  Y("Say yes, happily — you'll book the tickets.", [('yes / happily', ['כן', 'בכיף']), ('book / order', ['אזמין', 'להזמין']), ('tickets', ['כרטיסים'])],
    'כֵּן, בְּכֵיף! אֲנִי אַזְמִין כַּרְטִיסִים.'),
  N('ido', 'אַחְלָה. וּבְשַׁבָּת: מַטְקוֹת בַּחוֹף וְעַל הָאֵשׁ?', 'Great. And Saturday: matkot on the beach and a barbecue?'),
  Y("Say you don't know how to play matkot — but a barbecue, always!", [("I don't know", ['לא יודע', 'לא יודעת']), ('to play', ['לשחק']), ('barbecue', ['על האש'])],
    'אֲנִי לֹא {יוֹדֵעַ|יוֹדַעַת} לְשַׂחֵק מַטְקוֹת, אֲבָל עַל הָאֵשׁ — תָּמִיד!'),
  N('ido', '{רָאִיתָ|רָאִית} אֶת הַסִּדְרָה הַחֲדָשָׁה?', 'Did you see the new series?'),
  Y("Say yes — the series is interesting, but the ending is weird. (סִדְרָה is feminine.)", [('series', ['סדרה']), ('interesting (f)', ['מעניינת']), ('weird', ['מוזר', 'מוזרה'])],
    'כֵּן! הַסִּדְרָה מְעַנְיֶינֶת, אֲבָל הַסּוֹף מוּזָר.'),
  N('ido', 'בְּדִיּוּק מָה שֶׁאֲנִי חוֹשֵׁב!', "Exactly what I think!"),
])

scenario('s23', 'a2-23', 'Language exchange', 'חִילּוּפֵי שָׂפוֹת',
  "You meet Hila for coffee: she practises her English, you practise your Hebrew. Today it's Hebrew's turn.",
  {'hila': C('Hila', 'הִילָה', 'f', 'your language partner')}, [
  N('hila', 'אָז כַּמָּה זְמַן {אַתָּה|אַתְּ} בָּאָרֶץ?', 'So how long have you been in Israel?'),
  Y("Say you've been here a year already, and you still don't understand everything.", [('a year', ['שנה']), ('still', ['עדיין']), ("don't understand", ['לא מבין', 'לא מבינה'])],
    'אֲנִי פֹּה כְּבָר שָׁנָה, וַאֲנִי עֲדַיִין לֹא {מֵבִין|מְבִינָה} הַכּוֹל.'),
  N('hila', 'בֶּאֱמֶת? {אַתָּה מְדַבֵּר|אַתְּ מְדַבֶּרֶת} מְצוּיָּן!', 'Really? You speak brilliantly!'),
  Y("Say: actually, people speak too fast, and that's the hardest thing.", [('actually', ['בעצם']), ('fast', ['מהר']), ('the hardest / most', ['הכי'])],
    'בְּעֶצֶם, אֲנָשִׁים מְדַבְּרִים מַהֵר מִדַּי, וְזֶה הֲכִי קָשֶׁה.'),
  N('hila', 'וּמָה {אַתָּה עוֹשֶׂה|אַתְּ עוֹשָׂה} אַחֲרֵי הָעֲבוֹדָה?', 'And what do you do after work?'),
  Y("Say usually you go to the gym, and then you're free.", [('gym', ['חדר כושר']), ('free', ['פנוי', 'פנויה'])],
    'בְּדֶרֶךְ כְּלָל אֲנִי {הוֹלֵךְ|הוֹלֶכֶת} לַחֲדַר כּוֹשֶׁר, וְאָז אֲנִי {פָּנוּי|פְּנוּיָה}.'),
  N('hila', 'שָׁמַעְתִּי שֶׁ{אַתָּה עוֹבֵר|אַתְּ עוֹבֶרֶת} דִּירָה?', "I heard you're moving?"),
  Y("Say: long story short — yes, you're moving before Passover.", [('long story short', ['בקיצור']), ('moving (flat)', ['עובר דירה', 'עוברת דירה', 'לעבור דירה']), ('before', ['לפני'])],
    'בְּקִיצּוּר, כֵּן. אֲנִי {עוֹבֵר|עוֹבֶרֶת} דִּירָה לִפְנֵי פֶּסַח.'),
  N('hila', 'אִם {אַתָּה צָרִיךְ|אַתְּ צְרִיכָה} עֶזְרָה, {תַּגִּיד|תַּגִּידִי}!', 'If you need help, say so!'),
  Y("Thank her — you'll tell her.", [THANKS, ("I'll tell (you)", ['אגיד', 'אגיד לך'])], 'תּוֹדָה, אֲנִי אַגִּיד לָךְ!'),
])

scenario('s24', 'a2-24', 'Life in the building', 'הַחַיִּים בַּבִּנְיָן',
  "You've just moved into a shared flat. First the building committee knocks, then your roommate wants your opinion.",
  {'ronit': C('Ronit', 'רוֹנִית', 'f', 'head of the building committee'), 'tom': C('Tom', 'תּוֹם', 'm', 'your roommate')}, [
  N('ronit', 'שָׁלוֹם, אֲנִי רוֹנִית מִוַּעַד הַבַּיִת. {אַתָּה הַשּׁוּתָּף הֶחָדָשׁ|אַתְּ הַשּׁוּתָּפָה הַחֲדָשָׁה}?', "Hello, I'm Ronit from the building committee. Are you the new roommate?"),
  Y("Say yes, you're the new roommate in apartment 6.", [('yes', ['כן']), ('roommate', ['שותף', 'שותפה']), ('new', ['חדש', 'חדשה'])],
    'כֵּן, אֲנִי {הַשּׁוּתָּף הֶחָדָשׁ|הַשּׁוּתָּפָה הַחֲדָשָׁה} בְּדִירָה שֵׁשׁ.'),
  N('ronit', 'יוֹפִי. וַעַד הַבַּיִת זֶה מֵאָה שֶׁקֶל לְחוֹדֶשׁ, בְּבִּיט אוֹ בִּמְזוּמָּן.', "Lovely. The building fee is 100 shekels a month, by Bit or cash."),
  Y("Say you'll pay by Bit — and ask where the safe room is.", [('Bit', ['ביט']), ('where', ['איפה']), ('safe room', ['ממד', 'ממ״ד', 'מקלט'])],
    'אֲנִי אֲשַׁלֵּם בְּבִּיט. אֵיפֹה הַמַּמָּ״ד?'),
  N('ronit', 'בַּקּוֹמָה הָרִאשׁוֹנָה. וּבְשִׁישִּׁי כֻּלָּם מְנַקִּים אֶת הַבִּנְיָן בְּיַחַד.', "On the first floor. And on Friday everyone cleans the building together."),
  Y("Say no problem — you'll come and clean.", [('no problem', ['אין בעיה']), ('to clean', ['לנקות'])], 'אֵין בְּעָיָה, אֲנִי אָבוֹא לְנַקּוֹת.'),
  X('Upstairs, your roommate Tom shows off a box.'),
  N('tom', '{תִּרְאֶה|תִּרְאִי}! קָנִיתִי נַעֲלַיִים חֲדָשׁוֹת. שֵׁשׁ מֵאוֹת שֶׁקֶל, בְּתַשְׁלוּמִים.', 'Look! I bought new shoes. 600 shekels, in installments.'),
  Y("Say 'enjoy them!' — but 600? What nerve! He's a sucker!", [('enjoy (your new thing)', ['תתחדש']), ('nerve', ['חוצפה']), ('sucker', ['פראייר', 'פרייר'])],
    'תִּתְחַדֵּשׁ! אֲבָל שֵׁשׁ מֵאוֹת? אֵיזוֹ חוּצְפָּה, אַתָּה פְרַאיֶיר!', to='tom'),
  N('tom', 'חַחַח… וְ{אַתָּה בָּא|אַתְּ בָּאָה} לַחֲתוּנָה שֶׁל אָחִי בְּיוּנִי?', "Haha… and are you coming to my brother's wedding in June?"),
  Y("Say of course — you're excited!", [('of course', ['ברור', 'בטח']), ('excited', ['מתרגש', 'מתרגשת'])],
    'בָּרוּר! אֲנִי {מִתְרַגֵּשׁ|מִתְרַגֶּשֶׁת}!'),
  N('tom', 'יֵשׁ! בְּרוּכִים הַבָּאִים לַבִּנְיָן!', 'Yes!! Welcome to the building!'),
])

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    out = {'_note': 'Generated by tools/scenarios/scenarios.py — edit that file, not this one.', 'scenarios': S}
    json.dump(out, open(os.path.join(root, 'data', 'scenarios.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{len(S)} scenarios, {sum(1 for s in S for t in s["turns"] if t["t"] == "you")} turns to answer')
