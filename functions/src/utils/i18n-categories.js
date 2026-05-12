/**
 * I18N Category Mappings
 *
 * Translates affinity category names and subcategories into 10 major world languages
 * selected during user onboarding.
 *
 * Languages (by number of speakers):
 * - en: English (~1.5 billion)
 * - zh: Mandarin Chinese
 * - hi: Hindi
 * - es: Spanish
 * - fr: French
 * - ar: Standard Arabic
 * - bn: Bengali
 * - pt: Portuguese
 * - ru: Russian
 * - ur: Urdu
 *
 * NOTE: Translations should be reviewed by native speakers for accuracy.
 * Currently using de/ja/it as placeholders for bn/ru/ur - TODO: Get proper translations
 */

const CATEGORY_TRANSLATIONS = {
  // Events & Entertainment
  events: {
    en: { name: 'Events & Concerts', subcategories: ['concerts', 'theater', 'comedy', 'performances'] },
    es: { name: 'Eventos y Conciertos', subcategories: ['conciertos', 'teatro', 'comedia', 'actuaciones'] },
    zh: { name: '活动与音乐会', subcategories: ['音乐会', '剧院', '喜剧', '表演'] },
    fr: { name: 'Événements et Concerts', subcategories: ['concerts', 'théâtre', 'comédie', 'spectacles'] },
    ar: { name: 'فعاليات وحفلات موسيقية', subcategories: ['حفلات موسيقية', 'مسرح', 'كوميديا', 'عروض'] },
    pt: { name: 'Eventos e Concertos', subcategories: ['concertos', 'teatro', 'comédia', 'apresentações'] },
    de: { name: 'Veranstaltungen und Konzerte', subcategories: ['konzerte', 'theater', 'komödie', 'aufführungen'] },
    ja: { name: 'イベントとコンサート', subcategories: ['コンサート', '劇場', 'コメディ', '公演'] },
    hi: { name: 'कार्यक्रम और संगीत कार्यक्रम', subcategories: ['संगीत कार्यक्रम', 'रंगमंच', 'कॉमेडी', 'प्रदर्शन'] },
    it: { name: 'Eventi e Concerti', subcategories: ['concerti', 'teatro', 'commedia', 'spettacoli'] },
  },

  nightlife: {
    en: { name: 'Nightlife & Clubs', subcategories: ['nightclubs', 'bars', 'lounges', 'dance clubs'] },
    es: { name: 'Vida Nocturna y Clubes', subcategories: ['discotecas', 'bares', 'salones', 'clubes de baile'] },
    zh: { name: '夜生活与俱乐部', subcategories: ['夜总会', '酒吧', '休息室', '舞厅'] },
    fr: { name: 'Vie Nocturne et Clubs', subcategories: ['boîtes de nuit', 'bars', 'salons', 'clubs de danse'] },
    ar: { name: 'الحياة الليلية والنوادي', subcategories: ['نوادي ليلية', 'حانات', 'صالات', 'نوادي رقص'] },
    pt: { name: 'Vida Noturna e Clubes', subcategories: ['boates', 'bares', 'lounges', 'clubes de dança'] },
    de: { name: 'Nachtleben und Clubs', subcategories: ['nachtclubs', 'bars', 'lounges', 'tanzclubs'] },
    ja: { name: 'ナイトライフとクラブ', subcategories: ['ナイトクラブ', 'バー', 'ラウンジ', 'ダンスクラブ'] },
    hi: { name: 'नाइटलाइफ और क्लब', subcategories: ['नाइट क्लब', 'बार', 'लाउंज', 'डांस क्लब'] },
    it: { name: 'Vita Notturna e Club', subcategories: ['locali notturni', 'bar', 'lounge', 'club di ballo'] },
  },

  festivals: {
    en: { name: 'Festivals & Fairs', subcategories: ['festivals', 'fairs', 'street fairs', 'carnivals'] },
    es: { name: 'Festivales y Ferias', subcategories: ['festivales', 'ferias', 'ferias callejeras', 'carnavales'] },
    zh: { name: '节日与集市', subcategories: ['节日', '集市', '街头集市', '嘉年华'] },
    fr: { name: 'Festivals et Foires', subcategories: ['festivals', 'foires', 'foires de rue', 'carnavals'] },
    ar: { name: 'مهرجانات ومعارض', subcategories: ['مهرجانات', 'معارض', 'معارض الشوارع', 'كرنفالات'] },
    pt: { name: 'Festivais e Feiras', subcategories: ['festivais', 'feiras', 'feiras de rua', 'carnavais'] },
    de: { name: 'Festivals und Messen', subcategories: ['festivals', 'messen', 'straßenfeste', 'karnevals'] },
    ja: { name: 'フェスティバルと祭り', subcategories: ['フェスティバル', '祭り', 'ストリートフェア', 'カーニバル'] },
    hi: { name: 'त्योहार और मेले', subcategories: ['त्योहार', 'मेले', 'सड़क मेले', 'कार्निवल'] },
    it: { name: 'Festival e Fiere', subcategories: ['festival', 'fiere', 'fiere di strada', 'carnevali'] },
  },

  // Food & Dining
  dining: {
    en: { name: 'Restaurants & Dining', subcategories: ['restaurants', 'fine dining', 'casual dining'] },
    es: { name: 'Restaurantes y Comidas', subcategories: ['restaurantes', 'alta cocina', 'comida casual'] },
    zh: { name: '餐厅与用餐', subcategories: ['餐厅', '高级餐厅', '休闲餐厅'] },
    fr: { name: 'Restaurants et Restauration', subcategories: ['restaurants', 'gastronomie', 'restauration décontractée'] },
    ar: { name: 'مطاعم وتناول الطعام', subcategories: ['مطاعم', 'مطاعم فاخرة', 'مطاعم عادية'] },
    pt: { name: 'Restaurantes e Refeições', subcategories: ['restaurantes', 'alta gastronomia', 'refeições casuais'] },
    de: { name: 'Restaurants und Essen', subcategories: ['restaurants', 'gehobene küche', 'ungezwungenes essen'] },
    ja: { name: 'レストランと食事', subcategories: ['レストラン', '高級レストラン', 'カジュアルダイニング'] },
    hi: { name: 'रेस्तरां और भोजन', subcategories: ['रेस्तरां', 'उत्कृष्ट भोजन', 'आकस्मिक भोजन'] },
    it: { name: 'Ristoranti e Ristorazione', subcategories: ['ristoranti', 'alta cucina', 'ristorazione informale'] },
  },

  coffee: {
    en: { name: 'Coffee & Cafes', subcategories: ['coffee', 'cafes', 'tea', 'bakery'] },
    es: { name: 'Café y Cafeterías', subcategories: ['café', 'cafeterías', 'té', 'panadería'] },
    zh: { name: '咖啡与咖啡馆', subcategories: ['咖啡', '咖啡馆', '茶', '面包店'] },
    fr: { name: 'Café et Cafés', subcategories: ['café', 'cafés', 'thé', 'boulangerie'] },
    ar: { name: 'قهوة ومقاهي', subcategories: ['قهوة', 'مقاهي', 'شاي', 'مخبز'] },
    pt: { name: 'Café e Cafeterias', subcategories: ['café', 'cafeterias', 'chá', 'padaria'] },
    de: { name: 'Kaffee und Cafés', subcategories: ['kaffee', 'cafés', 'tee', 'bäckerei'] },
    ja: { name: 'コーヒーとカフェ', subcategories: ['コーヒー', 'カフェ', '紅茶', 'ベーカリー'] },
    hi: { name: 'कॉफी और कैफे', subcategories: ['कॉफी', 'कैफे', 'चाय', 'बेकरी'] },
    it: { name: 'Caffè e Caffetterie', subcategories: ['caffè', 'caffetterie', 'tè', 'panetteria'] },
  },

  food_trucks: {
    en: { name: 'Food Trucks & Street Food', subcategories: ['food trucks', 'street food', 'pop ups'] },
    es: { name: 'Food Trucks y Comida Callejera', subcategories: ['food trucks', 'comida callejera', 'pop ups'] },
    zh: { name: '餐车与街头美食', subcategories: ['餐车', '街头美食', '快闪店'] },
    fr: { name: 'Food Trucks et Street Food', subcategories: ['food trucks', 'street food', 'pop ups'] },
    ar: { name: 'عربات الطعام والطعام الشارع', subcategories: ['عربات الطعام', 'طعام الشارع', 'محلات مؤقتة'] },
    pt: { name: 'Food Trucks e Comida de Rua', subcategories: ['food trucks', 'comida de rua', 'pop ups'] },
    de: { name: 'Food Trucks und Street Food', subcategories: ['food trucks', 'street food', 'pop ups'] },
    ja: { name: 'フードトラックと屋台料理', subcategories: ['フードトラック', '屋台料理', 'ポップアップ'] },
    hi: { name: 'फूड ट्रक और स्ट्रीट फूड', subcategories: ['फूड ट्रक', 'स्ट्रीट फूड', 'पॉप अप'] },
    it: { name: 'Food Truck e Street Food', subcategories: ['food truck', 'street food', 'pop up'] },
  },

  happy_hour: {
    en: { name: 'Happy Hour & Specials', subcategories: ['happy hour', 'drink specials', 'bar deals'] },
    es: { name: 'Happy Hour y Ofertas', subcategories: ['happy hour', 'ofertas de bebidas', 'ofertas de bar'] },
    zh: { name: '欢乐时光与特价', subcategories: ['欢乐时光', '饮品特价', '酒吧优惠'] },
    fr: { name: 'Happy Hour et Promotions', subcategories: ['happy hour', 'promotions boissons', 'offres bar'] },
    ar: { name: 'ساعة سعيدة وعروض', subcategories: ['ساعة سعيدة', 'عروض المشروبات', 'عروض البار'] },
    pt: { name: 'Happy Hour e Promoções', subcategories: ['happy hour', 'promoções de bebidas', 'ofertas de bar'] },
    de: { name: 'Happy Hour und Angebote', subcategories: ['happy hour', 'getränkeangebote', 'bar-angebote'] },
    ja: { name: 'ハッピーアワーと特典', subcategories: ['ハッピーアワー', 'ドリンク特価', 'バーセール'] },
    hi: { name: 'हैप्पी आवर और विशेष', subcategories: ['हैप्पी आवर', 'ड्रिंक विशेष', 'बार सौदे'] },
    it: { name: 'Happy Hour e Offerte', subcategories: ['happy hour', 'offerte drink', 'offerte bar'] },
  },

  // Outdoor & Nature
  hiking: {
    en: { name: 'Hiking & Trails', subcategories: ['hiking', 'trails', 'nature walks', 'trekking'] },
    es: { name: 'Senderismo y Senderos', subcategories: ['senderismo', 'senderos', 'caminatas naturales', 'trekking'] },
    zh: { name: '徒步与步道', subcategories: ['徒步', '步道', '自然漫步', '远足'] },
    fr: { name: 'Randonnée et Sentiers', subcategories: ['randonnée', 'sentiers', 'promenades nature', 'trekking'] },
    ar: { name: 'المشي لمسافات طويلة والمسارات', subcategories: ['المشي', 'مسارات', 'نزهات طبيعية', 'رحلات'] },
    pt: { name: 'Trilhas e Caminhadas', subcategories: ['trilhas', 'caminhadas', 'passeios naturais', 'trekking'] },
    de: { name: 'Wandern und Pfade', subcategories: ['wandern', 'pfade', 'naturwanderungen', 'trekking'] },
    ja: { name: 'ハイキングとトレイル', subcategories: ['ハイキング', 'トレイル', '自然散策', 'トレッキング'] },
    hi: { name: 'लंबी पैदल यात्रा और पगडंडी', subcategories: ['लंबी पैदल यात्रा', 'पगडंडी', 'प्रकृति चलना', 'ट्रैकिंग'] },
    it: { name: 'Escursionismo e Sentieri', subcategories: ['escursionismo', 'sentieri', 'passeggiate natura', 'trekking'] },
  },

  parks: {
    en: { name: 'Parks & Gardens', subcategories: ['parks', 'gardens', 'green spaces', 'botanical'] },
    es: { name: 'Parques y Jardines', subcategories: ['parques', 'jardines', 'espacios verdes', 'botánico'] },
    zh: { name: '公园与花园', subcategories: ['公园', '花园', '绿地', '植物园'] },
    fr: { name: 'Parcs et Jardins', subcategories: ['parcs', 'jardins', 'espaces verts', 'botanique'] },
    ar: { name: 'حدائق ومتنزهات', subcategories: ['حدائق', 'متنزهات', 'مساحات خضراء', 'نباتي'] },
    pt: { name: 'Parques e Jardins', subcategories: ['parques', 'jardins', 'espaços verdes', 'botânico'] },
    de: { name: 'Parks und Gärten', subcategories: ['parks', 'gärten', 'grünflächen', 'botanisch'] },
    ja: { name: '公園と庭園', subcategories: ['公園', '庭園', '緑地', '植物園'] },
    hi: { name: 'पार्क और उद्यान', subcategories: ['पार्क', 'उद्यान', 'हरे स्थान', 'वनस्पति'] },
    it: { name: 'Parchi e Giardini', subcategories: ['parchi', 'giardini', 'spazi verdi', 'botanico'] },
  },

  beaches: {
    en: { name: 'Beaches & Waterfront', subcategories: ['beaches', 'waterfront', 'coastal', 'lakefront'] },
    es: { name: 'Playas y Frente Marítimo', subcategories: ['playas', 'frente marítimo', 'costero', 'lago'] },
    zh: { name: '海滩与海滨', subcategories: ['海滩', '海滨', '海岸', '湖滨'] },
    fr: { name: 'Plages et Front de Mer', subcategories: ['plages', 'front de mer', 'côtier', 'bord du lac'] },
    ar: { name: 'شواطئ والواجهة البحرية', subcategories: ['شواطئ', 'الواجهة البحرية', 'ساحلي', 'بحيرة'] },
    pt: { name: 'Praias e Orla', subcategories: ['praias', 'orla', 'costeira', 'beira do lago'] },
    de: { name: 'Strände und Uferpromenade', subcategories: ['strände', 'uferpromenade', 'küste', 'seeufer'] },
    ja: { name: 'ビーチとウォーターフロント', subcategories: ['ビーチ', 'ウォーターフロント', '海岸', '湖畔'] },
    hi: { name: 'समुद्र तट और वाटरफ्रंट', subcategories: ['समुद्र तट', 'वाटरफ्रंट', 'तटीय', 'झील'] },
    it: { name: 'Spiagge e Lungomare', subcategories: ['spiagge', 'lungomare', 'costiero', 'lago'] },
  },

  // Continue with remaining categories...
  geocaching: {
    en: { name: 'Geocaching', subcategories: ['geocaching', 'treasure hunt', 'caching', 'outdoor adventure'] },
    es: { name: 'Geocaching', subcategories: ['geocaching', 'búsqueda del tesoro', 'caching', 'aventura al aire libre'] },
    zh: { name: '地理寻宝', subcategories: ['地理寻宝', '寻宝', '缓存', '户外探险'] },
    fr: { name: 'Géocaching', subcategories: ['géocaching', 'chasse au trésor', 'caching', 'aventure plein air'] },
    ar: { name: 'الجيوكاشينغ', subcategories: ['الجيوكاشينغ', 'البحث عن الكنز', 'التخزين', 'مغامرة في الهواء الطلق'] },
    pt: { name: 'Geocaching', subcategories: ['geocaching', 'caça ao tesouro', 'caching', 'aventura ao ar livre'] },
    de: { name: 'Geocaching', subcategories: ['geocaching', 'schatzsuche', 'caching', 'outdoor-abenteuer'] },
    ja: { name: 'ジオキャッシング', subcategories: ['ジオキャッシング', '宝探し', 'キャッシング', 'アウトドア冒険'] },
    hi: { name: 'जियोकैशिंग', subcategories: ['जियोकैशिंग', 'खजाने की खोज', 'कैशिंग', 'आउटडोर साहसिक'] },
    it: { name: 'Geocaching', subcategories: ['geocaching', 'caccia al tesoro', 'caching', 'avventura outdoor'] },
  },

  disc_golf: {
    en: { name: 'Disc Golf', subcategories: ['disc golf', 'frisbee golf', 'disc sports'] },
    es: { name: 'Disc Golf', subcategories: ['disc golf', 'golf frisbee', 'deportes de disco'] },
    zh: { name: '飞盘高尔夫', subcategories: ['飞盘高尔夫', '飞盘运动'] },
    fr: { name: 'Disc Golf', subcategories: ['disc golf', 'golf frisbee', 'sports de disque'] },
    ar: { name: 'ديسك جولف', subcategories: ['ديسك جولف', 'فريسبي جولف', 'رياضات القرص'] },
    pt: { name: 'Disc Golf', subcategories: ['disc golf', 'golf frisbee', 'esportes de disco'] },
    de: { name: 'Disc Golf', subcategories: ['disc golf', 'frisbee golf', 'scheibensport'] },
    ja: { name: 'ディスクゴルフ', subcategories: ['ディスクゴルフ', 'フリスビーゴルフ', 'ディスクスポーツ'] },
    hi: { name: 'डिस्क गोल्फ', subcategories: ['डिस्क गोल्फ', 'फ्रिसबी गोल्फ', 'डिस्क खेल'] },
    it: { name: 'Disc Golf', subcategories: ['disc golf', 'golf frisbee', 'sport disco'] },
  },

  skate_parks: {
    en: { name: 'Skate Parks', subcategories: ['skate parks', 'skateboarding', 'bmx', 'roller skating'] },
    es: { name: 'Skate Parks', subcategories: ['skate parks', 'skateboarding', 'bmx', 'patinaje'] },
    zh: { name: '滑板公园', subcategories: ['滑板公园', '滑板', 'BMX', '滑冰'] },
    fr: { name: 'Skate Parks', subcategories: ['skate parks', 'skateboard', 'bmx', 'roller'] },
    ar: { name: 'حدائق التزلج', subcategories: ['حدائق التزلج', 'ركوب اللوح', 'BMX', 'التزلج على العجلات'] },
    pt: { name: 'Skate Parks', subcategories: ['skate parks', 'skate', 'bmx', 'patinação'] },
    de: { name: 'Skate Parks', subcategories: ['skate parks', 'skateboarding', 'bmx', 'rollschuh'] },
    ja: { name: 'スケートパーク', subcategories: ['スケートパーク', 'スケートボード', 'BMX', 'ローラースケート'] },
    hi: { name: 'स्केट पार्क', subcategories: ['स्केट पार्क', 'स्केटबोर्डिंग', 'BMX', 'रोलर स्केटिंग'] },
    it: { name: 'Skate Park', subcategories: ['skate park', 'skateboard', 'bmx', 'pattinaggio'] },
  },

  action_sports: {
    en: { name: 'Action Sports!', subcategories: ['rock climbing', 'zip line', 'parkour', 'extreme sports', 'bungee', 'motocross'] },
    es: { name: '¡Deportes de Acción!', subcategories: ['escalada en roca', 'tirolesa', 'parkour', 'deportes extremos', 'bungee', 'motocross'] },
    zh: { name: '极限运动!', subcategories: ['攀岩', '滑索', '跑酷', '极限运动', '蹦极', '越野摩托'] },
    fr: { name: 'Sports d\'Action!', subcategories: ['escalade', 'tyrolienne', 'parkour', 'sports extrêmes', 'saut à l\'élastique', 'motocross'] },
    ar: { name: 'رياضات الحركة!', subcategories: ['تسلق الصخور', 'حبل الانزلاق', 'باركور', 'رياضات متطرفة', 'بنجي', 'موتوكروس'] },
    pt: { name: 'Esportes de Ação!', subcategories: ['escalada', 'tirolesa', 'parkour', 'esportes radicais', 'bungee jump', 'motocross'] },
    de: { name: 'Actionsport!', subcategories: ['klettern', 'seilrutsche', 'parkour', 'extremsport', 'bungee', 'motocross'] },
    ja: { name: 'アクションスポーツ!', subcategories: ['ロッククライミング', 'ジップライン', 'パルクール', 'エクストリームスポーツ', 'バンジー', 'モトクロス'] },
    hi: { name: 'एक्शन स्पोर्ट्स!', subcategories: ['चट्टान चढ़ाई', 'जिप लाइन', 'पार्कौर', 'एक्सट्रीम स्पोर्ट्स', 'बंजी', 'मोटोक्रॉस'] },
    it: { name: 'Sport d\'Azione!', subcategories: ['arrampicata', 'zip line', 'parkour', 'sport estremi', 'bungee', 'motocross'] },
  },

  // Water Sports & Activities
  watersports: {
    en: { name: 'Water Sports', subcategories: ['surfing', 'kayaking', 'paddleboarding', 'swimming'] },
    es: { name: 'Deportes Acuáticos', subcategories: ['surf', 'kayak', 'paddleboard', 'natación'] },
    zh: { name: '水上运动', subcategories: ['冲浪', '皮划艇', '桨板', '游泳'] },
    fr: { name: 'Sports Nautiques', subcategories: ['surf', 'kayak', 'paddle', 'natation'] },
    ar: { name: 'الرياضات المائية', subcategories: ['ركوب الأمواج', 'التجديف', 'التجديف الواقف', 'السباحة'] },
    pt: { name: 'Esportes Aquáticos', subcategories: ['surf', 'caiaque', 'stand up paddle', 'natação'] },
    de: { name: 'Wassersport', subcategories: ['surfen', 'kajak', 'paddleboard', 'schwimmen'] },
    ja: { name: 'ウォータースポーツ', subcategories: ['サーフィン', 'カヤック', 'パドルボード', '水泳'] },
    hi: { name: 'जल क्रीड़ा', subcategories: ['सर्फिंग', 'कयाकिंग', 'पैडलबोर्डिंग', 'तैराकी'] },
    it: { name: 'Sport Acquatici', subcategories: ['surf', 'kayak', 'paddleboard', 'nuoto'] },
  },

  fishing: {
    en: { name: 'Fishing', subcategories: ['fishing', 'charters', 'fly fishing', 'pier fishing'] },
    es: { name: 'Pesca', subcategories: ['pesca', 'charters', 'pesca con mosca', 'pesca en muelle'] },
    zh: { name: '钓鱼', subcategories: ['钓鱼', '包船', '飞钓', '码头钓鱼'] },
    fr: { name: 'Pêche', subcategories: ['pêche', 'charters', 'pêche à la mouche', 'pêche sur jetée'] },
    ar: { name: 'صيد السمك', subcategories: ['صيد السمك', 'رحلات الصيد', 'صيد بالذباب', 'صيد الرصيف'] },
    pt: { name: 'Pesca', subcategories: ['pesca', 'charters', 'pesca com mosca', 'pesca no cais'] },
    de: { name: 'Angeln', subcategories: ['angeln', 'charters', 'fliegenfischen', 'mole angeln'] },
    ja: { name: '釣り', subcategories: ['釣り', 'チャーター', 'フライフィッシング', '桟橋釣り'] },
    hi: { name: 'मछली पकड़ना', subcategories: ['मछली पकड़ना', 'चार्टर', 'फ्लाई फिशिंग', 'घाट पर मछली पकड़ना'] },
    it: { name: 'Pesca', subcategories: ['pesca', 'charter', 'pesca a mosca', 'pesca sul molo'] },
  },

  boating: {
    en: { name: 'Boating & Sailing', subcategories: ['boating', 'sailing', 'yacht', 'marinas'] },
    es: { name: 'Navegación y Vela', subcategories: ['navegación', 'vela', 'yate', 'marinas'] },
    zh: { name: '划船与航海', subcategories: ['划船', '航海', '游艇', '码头'] },
    fr: { name: 'Navigation et Voile', subcategories: ['navigation', 'voile', 'yacht', 'marinas'] },
    ar: { name: 'الإبحار والشراع', subcategories: ['الإبحار', 'الشراع', 'يخت', 'مراسي'] },
    pt: { name: 'Navegação e Vela', subcategories: ['navegação', 'vela', 'iate', 'marinas'] },
    de: { name: 'Bootsfahren und Segeln', subcategories: ['boot fahren', 'segeln', 'yacht', 'yachthäfen'] },
    ja: { name: 'ボートとセーリング', subcategories: ['ボート', 'セーリング', 'ヨット', 'マリーナ'] },
    hi: { name: 'नौकायन और सेलिंग', subcategories: ['नौकायन', 'सेलिंग', 'नौका', 'मरीना'] },
    it: { name: 'Navigazione e Vela', subcategories: ['navigazione', 'vela', 'yacht', 'marine'] },
  },

  // Sports & Fitness
  sports: {
    en: { name: 'Sports & Recreation', subcategories: ['sports', 'games', 'recreation', 'athletics'] },
    es: { name: 'Deportes y Recreación', subcategories: ['deportes', 'juegos', 'recreación', 'atletismo'] },
    zh: { name: '体育与娱乐', subcategories: ['体育', '游戏', '娱乐', '田径'] },
    fr: { name: 'Sports et Loisirs', subcategories: ['sports', 'jeux', 'loisirs', 'athlétisme'] },
    ar: { name: 'الرياضة والترفيه', subcategories: ['رياضة', 'ألعاب', 'ترفيه', 'ألعاب قوى'] },
    pt: { name: 'Esportes e Recreação', subcategories: ['esportes', 'jogos', 'recreação', 'atletismo'] },
    de: { name: 'Sport und Freizeit', subcategories: ['sport', 'spiele', 'freizeit', 'leichtathletik'] },
    ja: { name: 'スポーツとレクリエーション', subcategories: ['スポーツ', 'ゲーム', 'レクリエーション', '陸上競技'] },
    hi: { name: 'खेल और मनोरंजन', subcategories: ['खेल', 'गेम्स', 'मनोरंजन', 'एथलेटिक्स'] },
    it: { name: 'Sport e Ricreazione', subcategories: ['sport', 'giochi', 'ricreazione', 'atletica'] },
  },

  fitness: {
    en: { name: 'Fitness & Wellness', subcategories: ['fitness', 'yoga', 'gyms', 'wellness'] },
    es: { name: 'Fitness y Bienestar', subcategories: ['fitness', 'yoga', 'gimnasios', 'bienestar'] },
    zh: { name: '健身与健康', subcategories: ['健身', '瑜伽', '健身房', '健康'] },
    fr: { name: 'Fitness et Bien-être', subcategories: ['fitness', 'yoga', 'salles de sport', 'bien-être'] },
    ar: { name: 'اللياقة والعافية', subcategories: ['لياقة', 'يوغا', 'صالة رياضية', 'عافية'] },
    pt: { name: 'Fitness e Bem-estar', subcategories: ['fitness', 'yoga', 'academias', 'bem-estar'] },
    de: { name: 'Fitness und Wellness', subcategories: ['fitness', 'yoga', 'fitnessstudios', 'wellness'] },
    ja: { name: 'フィットネスとウェルネス', subcategories: ['フィットネス', 'ヨガ', 'ジム', 'ウェルネス'] },
    hi: { name: 'फिटनेस और स्वास्थ्य', subcategories: ['फिटनेस', 'योग', 'जिम', 'स्वास्थ्य'] },
    it: { name: 'Fitness e Benessere', subcategories: ['fitness', 'yoga', 'palestre', 'benessere'] },
  },

  // Arts & Culture
  museums: {
    en: { name: 'Museums & Galleries', subcategories: ['museums', 'galleries', 'exhibitions', 'art'] },
    es: { name: 'Museos y Galerías', subcategories: ['museos', 'galerías', 'exposiciones', 'arte'] },
    zh: { name: '博物馆与画廊', subcategories: ['博物馆', '画廊', '展览', '艺术'] },
    fr: { name: 'Musées et Galeries', subcategories: ['musées', 'galeries', 'expositions', 'art'] },
    ar: { name: 'المتاحف والمعارض', subcategories: ['متاحف', 'معارض فنية', 'معارض', 'فن'] },
    pt: { name: 'Museus e Galerias', subcategories: ['museus', 'galerias', 'exposições', 'arte'] },
    de: { name: 'Museen und Galerien', subcategories: ['museen', 'galerien', 'ausstellungen', 'kunst'] },
    ja: { name: '美術館とギャラリー', subcategories: ['美術館', 'ギャラリー', '展示会', 'アート'] },
    hi: { name: 'संग्रहालय और गैलरी', subcategories: ['संग्रहालय', 'गैलरी', 'प्रदर्शनी', 'कला'] },
    it: { name: 'Musei e Gallerie', subcategories: ['musei', 'gallerie', 'mostre', 'arte'] },
  },

  movies: {
    en: { name: 'Movies & Cinema', subcategories: ['movies', 'cinema', 'film', 'theaters'] },
    es: { name: 'Cine y Películas', subcategories: ['películas', 'cine', 'film', 'teatros'] },
    zh: { name: '电影与影院', subcategories: ['电影', '影院', '胶片', '影院'] },
    fr: { name: 'Cinéma et Films', subcategories: ['films', 'cinéma', 'film', 'salles'] },
    ar: { name: 'الأفلام والسينما', subcategories: ['أفلام', 'سينما', 'فيلم', 'مسارح'] },
    pt: { name: 'Cinema e Filmes', subcategories: ['filmes', 'cinema', 'filme', 'teatros'] },
    de: { name: 'Filme und Kino', subcategories: ['filme', 'kino', 'film', 'kinos'] },
    ja: { name: '映画とシネマ', subcategories: ['映画', 'シネマ', 'フィルム', '劇場'] },
    hi: { name: 'फिल्में और सिनेमा', subcategories: ['फिल्में', 'सिनेमा', 'फिल्म', 'थिएटर'] },
    it: { name: 'Film e Cinema', subcategories: ['film', 'cinema', 'pellicola', 'sale'] },
  },

  classes: {
    en: { name: 'Classes & Workshops', subcategories: ['classes', 'workshops', 'seminars', 'learning'] },
    es: { name: 'Clases y Talleres', subcategories: ['clases', 'talleres', 'seminarios', 'aprendizaje'] },
    zh: { name: '课程与工作坊', subcategories: ['课程', '工作坊', '研讨会', '学习'] },
    fr: { name: 'Cours et Ateliers', subcategories: ['cours', 'ateliers', 'séminaires', 'apprentissage'] },
    ar: { name: 'فصول وورش عمل', subcategories: ['فصول', 'ورش عمل', 'ندوات', 'تعلم'] },
    pt: { name: 'Aulas e Workshops', subcategories: ['aulas', 'workshops', 'seminários', 'aprendizado'] },
    de: { name: 'Kurse und Workshops', subcategories: ['kurse', 'workshops', 'seminare', 'lernen'] },
    ja: { name: 'クラスとワークショップ', subcategories: ['クラス', 'ワークショップ', 'セミナー', '学習'] },
    hi: { name: 'कक्षाएं और कार्यशालाएं', subcategories: ['कक्षाएं', 'कार्यशालाएं', 'सेमिनार', 'सीखना'] },
    it: { name: 'Corsi e Workshop', subcategories: ['corsi', 'workshop', 'seminari', 'apprendimento'] },
  },

  // Community & Social
  volunteering: {
    en: { name: 'Volunteering', subcategories: ['volunteering', 'community service', 'charity'] },
    es: { name: 'Voluntariado', subcategories: ['voluntariado', 'servicio comunitario', 'caridad'] },
    zh: { name: '志愿服务', subcategories: ['志愿服务', '社区服务', '慈善'] },
    fr: { name: 'Bénévolat', subcategories: ['bénévolat', 'service communautaire', 'charité'] },
    ar: { name: 'العمل التطوعي', subcategories: ['العمل التطوعي', 'خدمة المجتمع', 'الخيرية'] },
    pt: { name: 'Voluntariado', subcategories: ['voluntariado', 'serviço comunitário', 'caridade'] },
    de: { name: 'Ehrenamt', subcategories: ['ehrenamt', 'gemeindedienst', 'wohltätigkeit'] },
    ja: { name: 'ボランティア', subcategories: ['ボランティア', 'コミュニティサービス', 'チャリティ'] },
    hi: { name: 'स्वयंसेवा', subcategories: ['स्वयंसेवा', 'सामुदायिक सेवा', 'दान'] },
    it: { name: 'Volontariato', subcategories: ['volontariato', 'servizio comunitario', 'beneficenza'] },
  },

  meetups: {
    en: { name: 'Meetups & Social Groups', subcategories: ['meetups', 'networking', 'social groups'] },
    es: { name: 'Reuniones y Grupos Sociales', subcategories: ['reuniones', 'networking', 'grupos sociales'] },
    zh: { name: '聚会与社交团体', subcategories: ['聚会', '社交', '社交团体'] },
    fr: { name: 'Rencontres et Groupes Sociaux', subcategories: ['rencontres', 'réseautage', 'groupes sociaux'] },
    ar: { name: 'اللقاءات والمجموعات الاجتماعية', subcategories: ['لقاءات', 'شبكات', 'مجموعات اجتماعية'] },
    pt: { name: 'Encontros e Grupos Sociais', subcategories: ['encontros', 'networking', 'grupos sociais'] },
    de: { name: 'Treffen und Soziale Gruppen', subcategories: ['treffen', 'networking', 'soziale gruppen'] },
    ja: { name: 'ミートアップと社交グループ', subcategories: ['ミートアップ', 'ネットワーキング', '社交グループ'] },
    hi: { name: 'मीटअप और सामाजिक समूह', subcategories: ['मीटअप', 'नेटवर्किंग', 'सामाजिक समूह'] },
    it: { name: 'Incontri e Gruppi Sociali', subcategories: ['incontri', 'networking', 'gruppi sociali'] },
  },

  farmers_markets: {
    en: { name: 'Farmers Markets', subcategories: ['farmers markets', 'local markets', 'produce'] },
    es: { name: 'Mercados de Agricultores', subcategories: ['mercados de agricultores', 'mercados locales', 'productos'] },
    zh: { name: '农贸市场', subcategories: ['农贸市场', '本地市场', '农产品'] },
    fr: { name: 'Marchés Fermiers', subcategories: ['marchés fermiers', 'marchés locaux', 'produits'] },
    ar: { name: 'أسواق المزارعين', subcategories: ['أسواق المزارعين', 'أسواق محلية', 'منتجات'] },
    pt: { name: 'Feiras de Produtores', subcategories: ['feiras de produtores', 'mercados locais', 'produtos'] },
    de: { name: 'Bauernmärkte', subcategories: ['bauernmärkte', 'lokale märkte', 'produkte'] },
    ja: { name: 'ファーマーズマーケット', subcategories: ['ファーマーズマーケット', '地元市場', '農産物'] },
    hi: { name: 'किसान बाजार', subcategories: ['किसान बाजार', 'स्थानीय बाजार', 'उत्पाद'] },
    it: { name: 'Mercati degli Agricoltori', subcategories: ['mercati agricoltori', 'mercati locali', 'prodotti'] },
  },

  // Entertainment & Fun
  gaming: {
    en: { name: 'Gaming & Arcades', subcategories: ['gaming', 'arcades', 'board games', 'esports'] },
    es: { name: 'Juegos y Arcades', subcategories: ['juegos', 'arcades', 'juegos de mesa', 'esports'] },
    zh: { name: '游戏与街机', subcategories: ['游戏', '街机', '桌游', '电竞'] },
    fr: { name: 'Jeux et Arcades', subcategories: ['jeux', 'arcades', 'jeux de société', 'esport'] },
    ar: { name: 'الألعاب والأروقة', subcategories: ['ألعاب', 'أروقة', 'ألعاب الطاولة', 'الرياضات الإلكترونية'] },
    pt: { name: 'Jogos e Fliperamas', subcategories: ['jogos', 'fliperamas', 'jogos de tabuleiro', 'esports'] },
    de: { name: 'Gaming und Spielhallen', subcategories: ['gaming', 'spielhallen', 'brettspiele', 'esports'] },
    ja: { name: 'ゲームとアーケード', subcategories: ['ゲーム', 'アーケード', 'ボードゲーム', 'eスポーツ'] },
    hi: { name: 'गेमिंग और आर्केड', subcategories: ['गेमिंग', 'आर्केड', 'बोर्ड गेम्स', 'ईस्पोर्ट्स'] },
    it: { name: 'Gaming e Sale Giochi', subcategories: ['gaming', 'sale giochi', 'giochi da tavolo', 'esport'] },
  },

  live_music: {
    en: { name: 'Live Music Venues', subcategories: ['live music', 'jazz', 'music venues', 'bands'] },
    es: { name: 'Lugares de Música en Vivo', subcategories: ['música en vivo', 'jazz', 'lugares de música', 'bandas'] },
    zh: { name: '现场音乐场所', subcategories: ['现场音乐', '爵士', '音乐场所', '乐队'] },
    fr: { name: 'Lieux de Musique Live', subcategories: ['musique live', 'jazz', 'salles de concert', 'groupes'] },
    ar: { name: 'أماكن الموسيقى الحية', subcategories: ['موسيقى حية', 'جاز', 'أماكن الموسيقى', 'فرق'] },
    pt: { name: 'Locais de Música Ao Vivo', subcategories: ['música ao vivo', 'jazz', 'casas de show', 'bandas'] },
    de: { name: 'Live-Musik-Locations', subcategories: ['live-musik', 'jazz', 'musiklocations', 'bands'] },
    ja: { name: 'ライブミュージック会場', subcategories: ['ライブミュージック', 'ジャズ', '音楽会場', 'バンド'] },
    hi: { name: 'लाइव संगीत स्थल', subcategories: ['लाइव संगीत', 'जैज़', 'संगीत स्थल', 'बैंड'] },
    it: { name: 'Locali di Musica Live', subcategories: ['musica live', 'jazz', 'locali musicali', 'band'] },
  },

  comedy: {
    en: { name: 'Comedy Shows', subcategories: ['comedy', 'stand up', 'improv', 'comedy clubs'] },
    es: { name: 'Shows de Comedia', subcategories: ['comedia', 'stand up', 'improv', 'clubes de comedia'] },
    zh: { name: '喜剧表演', subcategories: ['喜剧', '单口喜剧', '即兴表演', '喜剧俱乐部'] },
    fr: { name: 'Spectacles de Comédie', subcategories: ['comédie', 'stand-up', 'impro', 'clubs de comédie'] },
    ar: { name: 'عروض كوميدية', subcategories: ['كوميديا', 'ستاند أب', 'ارتجال', 'نوادي كوميديا'] },
    pt: { name: 'Shows de Comédia', subcategories: ['comédia', 'stand up', 'improv', 'clubes de comédia'] },
    de: { name: 'Comedy-Shows', subcategories: ['comedy', 'stand-up', 'impro', 'comedy-clubs'] },
    ja: { name: 'コメディショー', subcategories: ['コメディ', 'スタンダップ', '即興', 'コメディクラブ'] },
    hi: { name: 'कॉमेडी शो', subcategories: ['कॉमेडी', 'स्टैंड अप', 'इम्प्रोव', 'कॉमेडी क्लब'] },
    it: { name: 'Spettacoli di Comicità', subcategories: ['commedia', 'stand-up', 'improvvisazione', 'club comici'] },
  },

  // Shopping & Local
  shopping: {
    en: { name: 'Shopping & Boutiques', subcategories: ['shopping', 'boutiques', 'retail', 'markets'] },
    es: { name: 'Compras y Boutiques', subcategories: ['compras', 'boutiques', 'minorista', 'mercados'] },
    zh: { name: '购物与精品店', subcategories: ['购物', '精品店', '零售', '市场'] },
    fr: { name: 'Shopping et Boutiques', subcategories: ['shopping', 'boutiques', 'commerce de détail', 'marchés'] },
    ar: { name: 'التسوق والبوتيكات', subcategories: ['تسوق', 'بوتيكات', 'تجزئة', 'أسواق'] },
    pt: { name: 'Compras e Boutiques', subcategories: ['compras', 'boutiques', 'varejo', 'mercados'] },
    de: { name: 'Shopping und Boutiquen', subcategories: ['shopping', 'boutiquen', 'einzelhandel', 'märkte'] },
    ja: { name: 'ショッピングとブティック', subcategories: ['ショッピング', 'ブティック', '小売', '市場'] },
    hi: { name: 'खरीदारी और बुटीक', subcategories: ['खरीदारी', 'बुटीक', 'खुदरा', 'बाजार'] },
    it: { name: 'Shopping e Boutique', subcategories: ['shopping', 'boutique', 'vendita al dettaglio', 'mercati'] },
  },

  local_favorites: {
    en: { name: 'Local Favorites', subcategories: ['local', 'hidden gems', 'favorites', 'unique'] },
    es: { name: 'Favoritos Locales', subcategories: ['local', 'gemas ocultas', 'favoritos', 'únicos'] },
    zh: { name: '当地最爱', subcategories: ['当地', '隐藏宝石', '最爱', '独特'] },
    fr: { name: 'Favoris Locaux', subcategories: ['local', 'pépites cachées', 'favoris', 'unique'] },
    ar: { name: 'المفضلات المحلية', subcategories: ['محلي', 'جواهر مخفية', 'المفضلات', 'فريد'] },
    pt: { name: 'Favoritos Locais', subcategories: ['local', 'joias escondidas', 'favoritos', 'únicos'] },
    de: { name: 'Lokale Favoriten', subcategories: ['lokal', 'versteckte juwelen', 'favoriten', 'einzigartig'] },
    ja: { name: '地元のお気に入り', subcategories: ['地元', '隠れた名所', 'お気に入り', 'ユニーク'] },
    hi: { name: 'स्थानीय पसंदीदा', subcategories: ['स्थानीय', 'छुपे हुए रत्न', 'पसंदीदा', 'अद्वितीय'] },
    it: { name: 'Favoriti Locali', subcategories: ['locale', 'gemme nascoste', 'preferiti', 'unico'] },
  },

  // Special Interests
  wine_tasting: {
    en: { name: 'Wine & Breweries', subcategories: ['wine', 'breweries', 'tastings', 'vineyards'] },
    es: { name: 'Vino y Cervecerías', subcategories: ['vino', 'cervecerías', 'degustaciones', 'viñedos'] },
    zh: { name: '葡萄酒与啤酒厂', subcategories: ['葡萄酒', '啤酒厂', '品酒', '葡萄园'] },
    fr: { name: 'Vin et Brasseries', subcategories: ['vin', 'brasseries', 'dégustations', 'vignobles'] },
    ar: { name: 'النبيذ والمصانع', subcategories: ['نبيذ', 'مصانع الجعة', 'تذوقات', 'كروم'] },
    pt: { name: 'Vinho e Cervejarias', subcategories: ['vinho', 'cervejarias', 'degustações', 'vinhedos'] },
    de: { name: 'Wein und Brauereien', subcategories: ['wein', 'brauereien', 'verkostungen', 'weinberge'] },
    ja: { name: 'ワインと醸造所', subcategories: ['ワイン', '醸造所', 'テイスティング', 'ワイナリー'] },
    hi: { name: 'वाइन और शराब की भठ्ठी', subcategories: ['वाइन', 'ब्रूअरी', 'स्वाद', 'अंगूर के बाग'] },
    it: { name: 'Vino e Birrifici', subcategories: ['vino', 'birrifici', 'degustazioni', 'vigneti'] },
  },

  tours: {
    en: { name: 'Tours & Sightseeing', subcategories: ['tours', 'sightseeing', 'attractions', 'landmarks'] },
    es: { name: 'Tours y Turismo', subcategories: ['tours', 'turismo', 'atracciones', 'monumentos'] },
    zh: { name: '旅游与观光', subcategories: ['旅游', '观光', '景点', '地标'] },
    fr: { name: 'Tours et Visites', subcategories: ['tours', 'visites', 'attractions', 'monuments'] },
    ar: { name: 'جولات ومشاهدة المعالم', subcategories: ['جولات', 'مشاهدة المعالم', 'مناطق الجذب', 'معالم'] },
    pt: { name: 'Tours e Turismo', subcategories: ['tours', 'turismo', 'atrações', 'marcos'] },
    de: { name: 'Touren und Sightseeing', subcategories: ['touren', 'sightseeing', 'attraktionen', 'wahrzeichen'] },
    ja: { name: 'ツアーと観光', subcategories: ['ツアー', '観光', 'アトラクション', 'ランドマーク'] },
    hi: { name: 'यात्रा और पर्यटन', subcategories: ['यात्रा', 'पर्यटन', 'आकर्षण', 'स्थलचिह्न'] },
    it: { name: 'Tour e Visite Turistiche', subcategories: ['tour', 'visite turistiche', 'attrazioni', 'monumenti'] },
  },

  free_activities: {
    en: { name: 'Free Activities', subcategories: ['free', 'no cost', 'budget friendly'] },
    es: { name: 'Actividades Gratuitas', subcategories: ['gratis', 'sin costo', 'económico'] },
    zh: { name: '免费活动', subcategories: ['免费', '无成本', '预算友好'] },
    fr: { name: 'Activités Gratuites', subcategories: ['gratuit', 'sans frais', 'économique'] },
    ar: { name: 'أنشطة مجانية', subcategories: ['مجاني', 'بدون تكلفة', 'صديق الميزانية'] },
    pt: { name: 'Atividades Gratuitas', subcategories: ['grátis', 'sem custo', 'acessível'] },
    de: { name: 'Kostenlose Aktivitäten', subcategories: ['kostenlos', 'keine kosten', 'budgetfreundlich'] },
    ja: { name: '無料アクティビティ', subcategories: ['無料', 'コストなし', '予算にやさしい'] },
    hi: { name: 'मुफ्त गतिविधियां', subcategories: ['मुफ्त', 'कोई लागत नहीं', 'बजट अनुकूल'] },
    it: { name: 'Attività Gratuite', subcategories: ['gratis', 'senza costi', 'economico'] },
  },
};

/**
 * Get localized category name and subcategories
 * @param {string} categoryId - Category ID (e.g., 'dining', 'coffee')
 * @param {string} languageCode - ISO 639-1 language code (e.g., 'es', 'fr')
 * @returns {Object} Localized category data with name and subcategories
 */
function getLocalizedCategory(categoryId, languageCode = 'en') {
  const category = CATEGORY_TRANSLATIONS[categoryId];
  if (!category) {
    return null;
  }

  const localizedData = category[languageCode] || category.en;
  return {
    id: categoryId,
    name: localizedData.name,
    subcategories: localizedData.subcategories,
  };
}

/**
 * Get all category names for a language (for search matching)
 * @param {string} languageCode - ISO 639-1 language code
 * @returns {Array} Array of localized category names
 */
function getAllLocalizedCategoryNames(languageCode = 'en') {
  const names = [];
  Object.keys(CATEGORY_TRANSLATIONS).forEach((categoryId) => {
    const category = getLocalizedCategory(categoryId, languageCode);
    if (category) {
      names.push(category.name);
      names.push(...category.subcategories);
    }
  });
  return names;
}

module.exports = {
  CATEGORY_TRANSLATIONS,
  getLocalizedCategory,
  getAllLocalizedCategoryNames,
};
