"""Agreement drills: one card per item, rotating between a masculine, a feminine and a plural noun,
so the adjective (or verb) has to change with it. Each version is (English, Hebrew[, alternatives])."""

AGREE = {
 'a1-04': [('ag04', ['basics/ze', 'basics/zot', 'basics/kafe', 'cafe/bira', 'adjectives/tov'], [
    ("This is good coffee.", 'זֶה קָפֶה טוֹב.'),
    ("This is a good beer.", 'זֹאת בִּירָה טוֹבָה.')])],
 'a1-06': [('ag06', ['cafe/hafuch', 'cafe/shakshuka', 'cafe/taim'], [
    ("The latte is tasty.", 'הַהָפוּךְ טָעִים.'),
    ("The shakshuka is tasty.", 'הַשַּׁקְשׁוּקָה טְעִימָה.')])],
 'a1-07': [('ag07', ['around/shuk', 'around/tachana', 'around/yam', 'around/karov', 'around/rachok'], [
    ("The market is close.", 'הַשּׁוּק קָרוֹב.'),
    ("The (bus) stop is close.", 'הַתַּחֲנָה קְרוֹבָה.'),
    ("The (bus) stop is far.", 'הַתַּחֲנָה רְחוֹקָה.'),
    ("The sea is far.", 'הַיָּם רָחוֹק.')])],
 'a1-08': [('ag08', ['cafe/hafuch', 'cafe/bira', 'cafe/shakshuka', 'around/yakar', 'around/zol'], [
    ("The latte is expensive.", 'הַהָפוּךְ יָקָר.'),
    ("The beer is cheap.", 'הַבִּירָה זוֹלָה.'),
    ("The shakshuka is expensive.", 'הַשַּׁקְשׁוּקָה יְקָרָה.')])],
 'a1-11': [('ag11', ['basics/hu', 'basics/hi', 'basics/hem', 'health/ayef'], [
    ("He's tired.", 'הוּא עָיֵף.'),
    ("She's tired.", 'הִיא עֲיֵפָה.'),
    ("They're tired.", 'הֵם עֲיֵפִים.')])],
 'a2-13': [('ag13a', ['basics/ze', 'basics/zot', 'basics/ele', 'home/cheder', 'around/dira', 'adjectives/katan'], [
    ("This is a small room.", 'זֶה חֶדֶר קָטָן.'),
    ("This is a small apartment.", 'זֹאת דִּירָה קְטַנָּה.'),
    ("These are small rooms.", 'אֵלֶּה חֲדָרִים קְטַנִּים.')]),
           ('ag13b', ['home/mita', 'home/shulchan', 'home/mirpeset', 'adjectives/gadol'], [
    ("The bed is big.", 'הַמִּיטָּה גְּדוֹלָה.'),
    ("The table is big.", 'הַשּׁוּלְחָן גָּדוֹל.'),
    ("The balcony is big.", 'הַמִּרְפֶּסֶת גְּדוֹלָה.')]),
           ('ag13c', ['home/mazgan', 'home/shchenim', 'around/dira', 'adjectives/roesh'], [
    ("The air conditioner is noisy.", 'הַמַּזְגָן רוֹעֵשׁ.'),
    ("The neighbors are noisy.", 'הַשְּׁכֵנִים רוֹעֲשִׁים.'),
    ("The apartment is noisy.", 'הַדִּירָה רוֹעֶשֶׁת.')])],
 'a2-14': [('ag14', ['basics/ze', 'basics/zot', 'basics/ele', 'clothes/chultza', 'shopping/mechir', 'around/yakar', 'adjectives/tov'], [
    ("This is an expensive shirt.", 'זֹאת חוּלְצָה יְקָרָה.'),
    ("This is a good price.", 'זֶה מְחִיר טוֹב.'),
    ("These are good prices.", 'אֵלֶּה מְחִירִים טוֹבִים.')])],
 'a2-15': [('ag15', ['food/lechem', 'food/gvina', 'food/peirot', 'food/beitzim', 'cafe/taim'], [
    ("The bread is tasty.", 'הַלֶּחֶם טָעִים.'),
    ("The cheese is tasty.", 'הַגְּבִינָה טְעִימָה.'),
    ("The fruit is tasty.", 'הַפֵּירוֹת טְעִימִים.'),
    ("The eggs are tasty.", 'הַבֵּיצִים טְעִימוֹת.')])],
 'a2-16': [('ag16', ['family/ach', 'family/achot', 'family/horim', 'feelings/nechmad', 'basics/sheli'], [
    ("My brother is nice.", 'הָאָח שֶׁלִּי נֶחְמָד.'),
    ("My sister is nice.", 'הָאָחוֹת שֶׁלִּי נֶחְמָדָה.'),
    ("My parents are nice.", 'הַהוֹרִים שֶׁלִּי נֶחְמָדִים.')])],
 'a2-17': [('ag17', ['family/aba', 'family/ima', 'family/yeladim', 'feelings/sameach', 'feelings/atzuv'], [
    ("Dad is happy.", 'אַבָּא שָׂמֵחַ.'),
    ("Mom is sad.", 'אִמָּא עֲצוּבָה.'),
    ("The kids are happy.", 'הַיְּלָדִים שְׂמֵחִים.'),
    ("Mom is happy.", 'אִמָּא שְׂמֵחָה.')])],
 'a2-18': [('ag18', ['health/rofe', 'feelings/nechmad', 'family/yeladim', 'health/chole'], [
    ("The doctor (a man) is nice.", 'הָרוֹפֵא נֶחְמָד.'),
    ("The doctor (a woman) is nice.", 'הָרוֹפְאָה נֶחְמָדָה.'),
    ("The children are sick.", 'הַיְּלָדִים חוֹלִים.')])],
 'a2-19': [('ag19', ['weather/kayitz', 'around/yam', 'weather/shemesh', 'weather/cham', 'weather/kar'], [
    ("The summer is hot.", 'הַקַּיִץ חַם.'),
    ("The sun is hot.", 'הַשֶּׁמֶשׁ חַמָּה.'),
    ("The sea is cold.", 'הַיָּם קַר.')])],
 'a2-20': [('ag20', ['work/menahel', 'work/amus', 'work/lachutz'], [
    ("The manager (a man) is swamped.", 'הַמְּנַהֵל עָמוּס.'),
    ("The manager (a woman) is stressed.", 'הַמְּנַהֶלֶת לְחוּצָה.'),
    ("The manager (a woman) is swamped.", 'הַמְּנַהֶלֶת עֲמוּסָה.')])],
 'a2-21': [('ag21', ['basics/ze', 'basics/zot', 'basics/ele', 'tech/tmuna', 'tech/mitan', 'adjectives/tov', 'around/yakar'], [
    ("This is a good photo.", 'זֹאת תְּמוּנָה טוֹבָה.'),
    ("This is an expensive charger.", 'זֶה מִטְעָן יָקָר.'),
    ("These are good photos.", 'אֵלֶּה תְּמוּנוֹת טוֹבוֹת.')])],
 'a2-22': [('ag22', ['basics/ze', 'basics/zot', 'freetime/seret', 'freetime/sidra', 'freetime/hofaa', 'adjectives/meanyen', 'adjectives/muzar'], [
    ("This is an interesting movie.", 'זֶה סֶרֶט מְעַנְיֵין.'),
    ("This is an interesting series.", 'זֹאת סִדְרָה מְעַנְיֶינֶת.'),
    ("The show is weird.", 'הַהוֹפָעָה מוּזָרָה.')])],
 'a2-23': [('ag23', ['around/otobus', 'adjectives/mahir', 'adjectives/ragil', 'around/dira', 'shopping/mechir', 'basics/zot', 'basics/ele'], [
    ("The bus is fast.", 'הָאוֹטוֹבּוּס מָהִיר.'),
    ("This is a normal apartment.", 'זֹאת דִּירָה רְגִילָה.'),
    ("These are normal prices.", 'אֵלֶּה מְחִירִים רְגִילִים.')])],
 'a2-24': [('ag24', ['family/chatuna', 'adjectives/gadol', 'home/mamad', 'adjectives/katan', 'smalltalk/shutaf', 'feelings/nechmad'], [
    ("The wedding is big.", 'הַחֲתוּנָה גְּדוֹלָה.'),
    ("The safe room is small.", 'הַמַּמָּ״ד קָטָן.'),
    ("The roommates are nice.", 'הַשּׁוּתָּפִים נֶחְמָדִים.')])],
}
