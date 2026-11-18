"""Gender data for nouns, adjectives and verbs.

NOUNS: deck -> "id:g ..." where g is m, f, mp (masculine plural) or fp (feminine plural).
       Nouns get זֶה / זֹאת / אֵלֶּה cards. A noun naming a person can have a female counterpart in FEM.
ADJ / VERBS: plain spelling (no niqqud) "ms fs mp fp" — used by the agreement checker.
IMP: second-person commands / futures "to-a-man to-a-woman" — used to check who you're talking to.
"""

NOUNS = {
  'basics': 'kafe:m te:m',
  'street': 'balagan:m charta:m fadicha:f',
  'smalltalk': 'chaver:m mishpacha:f shutaf:m avoda:f',
  'cafe': 'hafuch:m kafe-kar:m tafrit:m cheshbon:m shtiya:f mayim:mp bira:f kos-yayin:f chips:m shakshuka:f sabich:m '
          'hummus:m pita:f tor:m meltzar:m tip:m glida:f aruchat-boker:f mesiba:f ochel:m',
  'around': 'otobus:m tachana:f kav:m rakevet:f monit:f sherut:m rav-kav:m ofanayim:mp korkinet:m pkak:m '
            'hatachana-haba:f yam:m chof:m shuk:m rechov:m dira:f shchuna:f',
  'time': 'sofash:m shishi:m shabat:f shniya:f shaa:f daka:f',
  'home': 'bayit:m cheder:m salon:m chadar-sheina:m mitbach:m sherutim:mp miklachat:f mita:f shulchan:m kise:m sapa:f '
          'delet:f chalon:m mirpeset:f mekarer:m mazgan:m mafteach:m schar-dira:m baal-habayit:m shchenim:mp kvisa:f '
          'zevel:m or:m chashmal:m mamad:m maalit:f koma:f vaad-bayit:m',
  'shopping': 'kesef:m shekel:m mechir:m ashrai:m mezuman:m odef:m kabala:f hanacha:f mivtza:m super:m makolet:f '
              'kanyon:m chanut:f kupa:f sakit:f mida:f tashlumim:mp freier:m metziya:f mocher:m achrayut:f mishloach:m kartis:m',
  'food': 'lechem:m chalav:m beitzim:fp gvina:f cottage:m yerakot:mp salat:m agvaniya:f melafefon:m peirot:mp tapuach:m '
          'avatiach:m basar:m of:m dag:m orez:m shemen-zayit:m melach:m sukar:m tchina:f challa:f burekas:m '
          'aruchat-erev:f aruchat-tzohorayim:f matkon:m machavat:f tanur:m',
  'family': 'ima:f aba:m horim:mp ach:m achot:f yeladim:mp ben:m bat:f tinok:m saba:m savta:f dod:m ben-dod:m baal:m '
            'isha:f ben-zug:m chatuna:f date:m yom-huledet:m chag:m aruchat-shishi:f yeled:m anashim:mp chaverim:mp',
  'numbers': 'chetzi:m reva:m',
  'feelings': 'chutzpa:f savlanut:f',
  'health': 'guf:m rosh:m beten:f gav:m yad:f regel:f ayin:f ozen:f pe:m shen:f garon:m lev:m chom:m shapaat:f rofe:m '
            'kupat-cholim:f trufa:f kadur:m beit-merkachat:m beit-cholim:m miyun:m ishur-machala:m bchila:f chadar-kosher:m',
  'weather': 'mezeg-avir:m chamsin:m shemesh:f geshem:m ruach:f anan:m sheleg:m kayitz:m choref:m aviv:m stav:m '
             'maalot:fp mitriya:f krem-hagana:m magevet:f galim:mp chol:m shkia:f park:m etz:m perach:m tiyul:m '
             'midbar:m tzafon:m darom:m',
  'work': 'misrad:m menahel:m pgisha:f maskoret:f reayon:m korot-chayim:fp chufsha:f yom-chofesh:m hightech:m startup:m '
          'machshev:m mail:m deadline:m tzevet:m proyekt:m universita:f toar:m mivchan:m shiur:m shiurei-bayit:mp '
          'ulpan:m more:m student:m miluim:mp',
  'clothes': 'bgadim:mp chultza:f michnasayim:mp shorts:mp simla:f chatzait:f naalayim:fp kafkafim:mp sandalim:mp '
             'garbayim:mp kova:m meil:m sveder:m mishkefei-shemesh:mp beged-yam:m tik:m tzeva:m',
  'tech': 'pelefon:m hodaa:f kvutza:f haklata:f solela:f mitan:m klita:f sisma:f aplikatzya:f tmuna:f story:m like:m '
          'masach:m atar:m hatraa:f internet:m linok:m',
  'freetime': 'seret:m sidra:f kolnoa:m hofaa:f muzika:f shir:m kaduregel:m matkot:fp sefer:m muzeon:m taarucha:f bar:m '
              'moadon:m al-haesh:m chofesh:m tachbiv:m sport:m lehazmin-kartisim:mp piknik:m',
}

# Nouns for people: the female counterpart (Hebrew with niqqud, English).
FEM = {
  'cafe/meltzar': ('מֶלְצָרִית', 'waitress'),
  'health/rofe': ('רוֹפְאָה', 'doctor (a woman)'),
  'work/menahel': ('מְנַהֶלֶת', 'manager (a woman)'),
  'work/more': ('מוֹרָה', 'teacher (a woman)'),
  'work/student': ('סְטוּדֶנְטִית', 'student (a woman)'),
  'shopping/mocher': ('מוֹכֶרֶת', 'saleswoman'),
  'shopping/freier': ('פְרַאיֶירִית', 'sucker / pushover (a woman)'),
  'smalltalk/shutaf': ('שׁוּתָּפָה לְדִירָה', 'roommate (a woman)'),
  'home/baal-habayit': ('בַּעֲלַת הַבַּיִת', 'landlady'),
}

# English for noun cards where "this is a …" / "these are …" doesn't fit.
THIS = {
  'street/fadicha': 'this is an embarrassment', 'street/balagan': 'this is a mess',
  'cafe/mayim': 'this is water', 'around/ofanayim': 'this is a bicycle', 'home/sherutim': 'this is the toilet / restroom',
  'time/shniya': 'this is a second', 'time/shaa': 'this is an hour', 'around/yam': "this is the sea (also: 'the beach')",
  'weather/mezeg-avir': 'this is the weather', 'weather/shemesh': 'this is the sun', 'work/korot-chayim': 'this is a CV / résumé',
  'work/shiurei-bayit': 'this is homework', 'work/miluim': 'this is army reserve duty', 'work/universita': 'this is a university',
  'health/guf': 'this is a body', 'freetime/sidra': 'this is a TV series / show', 'work/hightech': 'this is the tech industry',
  'health/miyun': 'this is the ER / emergency room', 'tech/internet': 'this is the internet', 'freetime/kolnoa': 'this is a cinema',
  'family/ima': 'this is Mom', 'family/aba': 'this is Dad', 'health/chom': 'this is a fever (also: heat)', 'health/shapaat': 'this is the flu',
  'work/maskoret': 'this is a salary', 'smalltalk/mishpacha': 'this is a family', 'cafe/chips': 'these are fries / chips',
  'freetime/matkot': 'this is matkot (beach paddle ball)', 'cafe/cheshbon': 'this is the bill / the check',
}

# Extra nouns that appear in sentences but have no card of their own (plain spelling, gender).
EXTRA_NOUNS = '''תל_אביב:f ירושלים:f חיפה:f כוס:f פיצה:f בעיה:f מסעדה:f מקום:m עיר:f ארץ:f שבוע:m שנה:f יום:m לילה:m ערב:m בוקר:m שאלה:f עזרה:f כביש:m טלפון:m מפתחות:mp
חולצות:fp שולחנות:mp חדרים:mp דירות:fp מיטות:fp כיסאות:mp ספרים:mp סרטים:mp שירים:mp חנויות:fp מסעדה:f מסעדות:fp
חברה:f חברות:fp ילדה:f ילדות:fp אישה:f נשים:fp גבר:m גברים:mp בחור:m בחורה:f שותפים:mp שותפות:fp סוף:m אוטובוסים:mp
נעל:f סנדל:m מכונית:f אוטו:m רכב:m חתול:m כלב:m עבודות:fp פגישות:fp הודעות:fp תמונות:fp עגבניות:fp תפוחים:mp'''

# Adjectives: ms fs mp fp (plain spelling). A '|' joins accepted spelling variants.
ADJ = '''גדול גדולה גדולים גדולות
קטן קטנה קטנים קטנות
חדש חדשה חדשים חדשות
ישן ישנה ישנים ישנות
טוב טובה טובים טובות
רע רעה רעים רעות
יפה יפה יפים יפות
מכוער מכוערת מכוערים מכוערות
ארוך ארוכה ארוכים ארוכות
קצר קצרה קצרים קצרות
קשה קשה קשים קשות
קל קלה קלים קלות
מהיר מהירה מהירים מהירות
איטי איטית איטיים איטיות
חזק חזקה חזקים חזקות
חלש חלשה חלשים חלשות
נקי נקייה|נקיה נקיים נקיות
מלוכלך מלוכלכת מלוכלכים מלוכלכות
רועש רועשת רועשים רועשות
שקט שקטה שקטים שקטות
ריק ריקה ריקים ריקות
תפוס תפוסה תפוסים תפוסות
צעיר צעירה צעירים צעירות
זקן זקנה זקנים זקנות
עשיר עשירה עשירים עשירות
עני ענייה|עניה עניים עניות
חשוב חשובה חשובים חשובות
מעניין מעניינת מעניינים מעניינות
משעמם משעממת משעממים משעממות
מסובך מסובכת מסובכים מסובכות
נוח נוחה נוחים נוחות
מוזר מוזרה מוזרים מוזרות
רגיל רגילה רגילים רגילות
מסוכן מסוכנת מסוכנים מסוכנות
אמיתי אמיתית אמיתיים אמיתיות
שמח שמחה שמחים שמחות
עצוב עצובה עצובים עצובות
כועס כועסת כועסים כועסות
מבואס מבואסת מבואסים מבואסות
מתרגש מתרגשת מתרגשים מתרגשות
מפחד מפחדת מפחדים מפחדות
מתבייש מתביישת מתביישים מתביישות
דואג דואגת דואגים דואגות
בודד בודדה בודדים בודדות
גאה גאה גאים גאות
מאוהב מאוהבת מאוהבים מאוהבות
מעצבן מעצבנת מעצבנים מעצבנות
עצבני עצבנית עצבניים עצבניות
נחמד נחמדה נחמדים נחמדות
חמוד חמודה חמודים חמודות
מצחיק מצחיקה מצחיקים מצחיקות
חכם חכמה חכמים חכמות
מדהים מדהימה מדהימים מדהימות
מגעיל מגעילה מגעילים מגעילות
מסופק מסופקת מסופקים מסופקות
טבעוני טבעונית טבעוניים טבעוניות
צמחוני צמחונית צמחוניים צמחוניות
טעים טעימה טעימים טעימות
חריף חריפה חריפים חריפות
מלא מלאה מלאים מלאות
פתוח פתוחה פתוחים פתוחות
סגור סגורה סגורים סגורות
קרוב קרובה קרובים קרובות
רחוק רחוקה רחוקים רחוקות
יקר יקרה יקרים יקרות
זול זולה זולים זולות
מאוחר מאוחרת מאוחרים מאוחרות
מוקדם מוקדמת מוקדמים מוקדמות
צמא צמאה צמאים צמאות
שבע שבעה שבעים שבעות
מתוק מתוקה מתוקים מתוקות
מלוח מלוחה מלוחים מלוחות
בריא בריאה בריאים בריאות
חולה חולה חולים חולות
עייף עייפה עייפים עייפות
אלרגי אלרגית אלרגיים אלרגיות
חם חמה חמים חמות
קר קרה קרים קרות
לח לחה לחים לחות
לחוץ לחוצה לחוצים לחוצות
עמוס עמוסה עמוסים עמוסות
נשוי נשואה נשואים נשואות
פנוי פנויה פנויים פנויות
גרוש גרושה גרושים גרושות
מגניב מגניבה מגניבים מגניבות
שווה שווה שווים שוות
שחור שחורה שחורים שחורות
לבן לבנה לבנים לבנות
אדום אדומה אדומים אדומות
כחול כחולה כחולים כחולות
ירוק ירוקה ירוקים ירוקות
צהוב צהובה צהובים צהובות
ורוד ורודה ורודים ורודות
אפור אפורה אפורים אפורות
כתום כתומה כתומים כתומות
סגול סגולה סגולים סגולות
רעב רעבה רעבים רעבות
רטוב רטובה רטובים רטובות
מוזמן מוזמנת מוזמנים מוזמנות
מומלץ מומלצת מומלצים מומלצות
בטוח בטוחה בטוחים בטוחות
מוכן מוכנה מוכנים מוכנות
מאושר מאושרת מאושרים מאושרות
ער ערה ערים ערות
אחר אחרת אחרים אחרות
ראשון ראשונה ראשונים ראשונות
אחרון אחרונה אחרונים אחרונות
הבא הבאה הבאים הבאות
יחיד יחידה יחידים יחידות
ממושמע ממושמעת ממושמעים ממושמעות
מסודר מסודרת מסודרים מסודרות
מרוצה מרוצה מרוצים מרוצות
רציני רצינית רציניים רציניות
ישראלי ישראלית ישראלים ישראליות
אמריקאי אמריקאית אמריקאים אמריקאיות
בריטי בריטית בריטים בריטיות
חופשי חופשית חופשיים חופשיות'''

# Present-tense verbs: ms fs mp fp (plain spelling).
VERBS = '''הולך הולכת הולכים הולכות
בא באה באים באות
יודע יודעת יודעים יודעות
מבין מבינה מבינים מבינות
חושב חושבת חושבים חושבות
גר גרה גרים גרות
עובד עובדת עובדים עובדות
לומד לומדת לומדים לומדות
מדבר מדברת מדברים מדברות
אוכל אוכלת אוכלים אוכלות
משלם משלמת משלמים משלמות
מחפש מחפשת מחפשים מחפשות
נוסע נוסעת נוסעים נוסעות
יוצא יוצאת יוצאים יוצאות
חוזר חוזרת חוזרים חוזרות
נותן נותנת נותנים נותנות
לוקח לוקחת לוקחים לוקחות
שומע שומעת שומעים שומעות
מרגיש מרגישה מרגישים מרגישות
מתחיל מתחילה מתחילים מתחילות
גומר גומרת גומרים גומרות
יושב יושבת יושבים יושבות
ישן ישנה ישנים ישנות
אוהב אוהבת אוהבים אוהבות
מתקשר מתקשרת מתקשרים מתקשרות
שולח שולחת שולחים שולחות
פוגש פוגשת פוגשים פוגשות
מסתדר מסתדרת מסתדרים מסתדרות
מביא מביאה מביאים מביאות
מנסה מנסה מנסים מנסות
כותב כותבת כותבים כותבות
סוגר סוגרת סוגרים סוגרות
פותח פותחת פותחים פותחות
מגיע מגיעה מגיעים מגיעות
יכול יכולה יכולים יכולות
צריך צריכה צריכים צריכות
מכיר מכירה מכירים מכירות
מאחר מאחרת מאחרים מאחרות
יורד יורדת יורדים יורדות
עולה עולה עולים עולות
רוצה רוצה רוצים רוצות
קונה קונה קונים קונות
עושה עושה עושים עושות
שותה שותה שותים שותות
רואה רואה רואים רואות
מחכה מחכה מחכים מחכות
מצטער מצטערת מצטערים מצטערות
משחק משחקת משחקים משחקות
מתאמן מתאמנת מתאמנים מתאמנות
מבשל מבשלת מבשלים מבשלות
מנקה מנקה מנקים מנקות
מזמין מזמינה מזמינים מזמינות
מתחתן מתחתנת מתחתנים מתחתנות
מתלבש מתלבשת מתלבשים מתלבשות
נכנס נכנסת נכנסים נכנסות
נפגש נפגשת נפגשים נפגשות
נשאר נשארת נשארים נשארות
מתקלח מתקלחת מתקלחים מתקלחות
רוקד רוקדת רוקדים רוקדות
קורא קוראת קוראים קוראות
מצלם מצלמת מצלמים מצלמות
מטייל מטיילת מטיילים מטיילות
מבלה מבלה מבלים מבלות
שוחה שוחה שוחים שוחות
מתגעגע מתגעגעת מתגעגעים מתגעגעות
מחליט מחליטה מחליטים מחליטות
מסביר מסבירה מסבירים מסבירות
עוזר עוזרת עוזרים עוזרות
זוכר זוכרת זוכרים זוכרות
שוכח שוכחת שוכחים שוכחות
מתכוון מתכוונת מתכוונים מתכוונות
מקווה מקווה מקווים מקוות
מתעניין מתעניינת מתעניינים מתעניינות
נח נחה נחים נחות
קם קמה קמים קמות
מתלונן מתלוננת מתלוננים מתלוננות
מתגורר מתגוררת מתגוררים מתגוררות
טס טסה טסים טסות
מוכר מוכרת מוכרים מוכרות
מלמד מלמדת מלמדים מלמדות
מנהל מנהלת מנהלים מנהלות
מחזיר מחזירה מחזירים מחזירות
מחליף מחליפה מחליפים מחליפות
מודד מודדת מודדים מודדות
חוסך חוסכת חוסכים חוסכות
כואב כואבת כואבים כואבות'''

# Commands / 2nd-person futures: to a man, to a woman (plain spelling).
IMP = '''תגיד תגידי
בוא בואי
עזוב עזבי
תשמע תשמעי
תדאג תדאגי
תשלח תשלחי
תתקשר תתקשרי
תעדכן תעדכני
תסביר תסבירי
תשכח תשכחי
תיזהר|תזהר תיזהרי|תזהרי
תצטרך תצטרכי
תשאל תשאלי
תתחדש תתחדשי
תרגיש תרגישי
תראה תראי
תחכה תחכי
תבוא תבואי
תלך תלכי
תיקח|תקח תיקחי|תקחי
תן תני
קח קחי
תביא תביאי
תכתוב תכתבי
תעשה תעשי
תאכל תאכלי
תשתה תשתי
תקנה תקני
תזמין תזמיני
תנסה תנסי
תירגע|תרגע תירגעי|תרגעי
תמשיך תמשיכי
תחזור תחזרי|תחזרי
תיכנס|תכנס תיכנסי|תכנסי
שב שבי
סע סעי
תעזור תעזרי
תזכור תזכרי
תלמד תלמדי
תדבר תדברי
תיסע|תסע תיסעי|תסעי
תצא תצאי
תשב תשבי
תפגוש תפגשי
תספר תספרי
תחשוב תחשבי
תנוח תנוחי
תקום תקומי'''
