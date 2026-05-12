export interface AffinityCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  subcategories?: string[];
  translations?: Record<string, { name: string; description: string }>;
}

// Country code to language mapping for geo-based display
export const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // English
  US: 'en', CA: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en',
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CL: 'es', CO: 'es', PE: 'es', VE: 'es', EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  // French
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', CD: 'fr', MG: 'fr', ML: 'fr', NE: 'fr', TD: 'fr', GN: 'fr', RW: 'fr', BJ: 'fr', BI: 'fr', TG: 'fr', CF: 'fr', CG: 'fr', GA: 'fr', GQ: 'fr', DJ: 'fr', KM: 'fr', SC: 'fr',
  // Portuguese
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', GW: 'pt', TL: 'pt', ST: 'pt', CV: 'pt',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', SG: 'zh',
  // Hindi
  IN: 'hi',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', DZ: 'ar', SD: 'ar', IQ: 'ar', MA: 'ar', YE: 'ar', SY: 'ar', TN: 'ar', JO: 'ar', LY: 'ar', LB: 'ar', PS: 'ar', OM: 'ar', KW: 'ar', MR: 'ar', QA: 'ar', BH: 'ar',
  // Russian
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru', TJ: 'ru', UZ: 'ru', AM: 'ru', AZ: 'ru', GE: 'ru', MD: 'ru',
  // Bengali
  BD: 'bn',
  // Urdu
  PK: 'ur',
};

export const AFFINITY_CATEGORIES: AffinityCategory[] = [
  // Events & Entertainment
  {
    id: 'events',
    name: 'Events & Concerts',
    emoji: '🎭',
    description: 'Live performances, concerts, shows',
    subcategories: ['concerts', 'theater', 'comedy', 'performances'],
    translations: {
      es: { name: 'Eventos y Conciertos', description: 'Actuaciones en vivo, conciertos, espectáculos' },
      fr: { name: 'Événements et Concerts', description: 'Spectacles en direct, concerts, shows' },
      pt: { name: 'Eventos e Shows', description: 'Apresentações ao vivo, shows, espetáculos' },
      zh: { name: '活动与音乐会', description: '现场表演、音乐会、演出' },
    },
  },
  {
    id: 'nightlife',
    name: 'Nightlife & Clubs',
    emoji: '🌃',
    description: 'Bars, nightclubs, lounges, live music',
    subcategories: ['nightclubs', 'bars', 'lounges', 'dance_clubs'],
    translations: {
      es: { name: 'Vida Nocturna y Clubes', description: 'Bares, discotecas, lounges, música en vivo' },
      fr: { name: 'Vie Nocturne et Clubs', description: 'Bars, boîtes de nuit, salons, musique live' },
      pt: { name: 'Vida Noturna e Clubes', description: 'Bares, casas noturnas, lounges, música ao vivo' },
      zh: { name: '夜生活与俱乐部', description: '酒吧、夜总会、休息室、现场音乐' },
    },
  },
  {
    id: 'festivals',
    name: 'Festivals & Fairs',
    emoji: '🎪',
    description: 'Street fairs, festivals, outdoor events',
    subcategories: ['festivals', 'fairs', 'street_fairs', 'carnivals'],
    translations: {
      es: { name: 'Festivales y Ferias', description: 'Ferias callejeras, festivales, eventos al aire libre' },
      fr: { name: 'Festivals et Foires', description: 'Foires de rue, festivals, événements en plein air' },
      pt: { name: 'Festivais e Feiras', description: 'Feiras de rua, festivais, eventos ao ar livre' },
      zh: { name: '节日与集市', description: '街头集市、节日、户外活动' },
    },
  },

  // Food & Dining
  {
    id: 'dining',
    name: 'Restaurants & Dining',
    emoji: '🍽️',
    description: 'Fine dining, casual restaurants, eateries',
    subcategories: ['restaurants', 'fine_dining', 'casual_dining'],
    translations: {
      es: { name: 'Restaurantes y Comida', description: 'Alta cocina, restaurantes casuales, comedores' },
      fr: { name: 'Restaurants et Gastronomie', description: 'Haute cuisine, restaurants décontractés, restaurants' },
      pt: { name: 'Restaurantes e Gastronomia', description: 'Culinária refinada, restaurantes casuais, restaurantes' },
      zh: { name: '餐厅与美食', description: '高级餐饮、休闲餐厅、餐馆' },
      hi: { name: 'रेस्तरां और भोजन', description: 'उत्कृष्ट भोजन, आरामदायक रेस्तरां, भोजनालय' },
      ar: { name: 'المطاعم والطعام', description: 'الطعام الفاخر، المطاعم غير الرسمية، المطاعم' },
      bn: { name: 'রেস্তোরাঁ এবং খাবার', description: 'সূক্ষ্ম খাবার, নৈমিত্তিক রেস্তোরাঁ, খাবারের দোকান' },
      ru: { name: 'Рестораны и Питание', description: 'Изысканная кухня, повседневные рестораны, столовые' },
      ur: { name: 'ریستوراں اور کھانا', description: 'عمدہ کھانا، آرام دہ ریستوراں، کھانے کی جگہیں' },
    },
  },
  {
    id: 'coffee',
    name: 'Coffee & Cafes',
    emoji: '☕',
    description: 'Coffee shops, cafes, tea houses',
    subcategories: ['coffee', 'cafes', 'tea', 'bakery'],
    translations: {
      es: { name: 'Café y Cafeterías', description: 'Cafeterías, cafés, casas de té' },
      fr: { name: 'Café et Cafés', description: 'Cafés, salons de thé, boulangeries' },
      pt: { name: 'Café e Cafeterias', description: 'Cafeterias, cafés, casas de chá' },
      zh: { name: '咖啡与咖啡馆', description: '咖啡店、咖啡馆、茶馆' },
      hi: { name: 'कॉफी और कैफे', description: 'कॉफी की दुकानें, कैफे, चाय घर' },
      ar: { name: 'القهوة والمقاهي', description: 'محلات القهوة، المقاهي، بيوت الشاي' },
      bn: { name: 'কফি এবং ক্যাফে', description: 'কফি শপ, ক্যাফে, চা ঘর' },
      ru: { name: 'Кофе и Кафе', description: 'Кофейни, кафе, чайные' },
      ur: { name: 'کافی اور کیفے', description: 'کافی شاپس، کیفے، چائے خانے' },
    },
  },
  {
    id: 'food_trucks',
    name: 'Food Trucks & Street Food',
    emoji: '🚚',
    description: 'Food trucks, pop-ups, street vendors',
    subcategories: ['food_trucks', 'street_food', 'pop_ups'],
    translations: {
      es: { name: 'Food Trucks y Comida Callejera', description: 'Camiones de comida, pop-ups, vendedores ambulantes' },
      fr: { name: 'Food Trucks et Street Food', description: 'Camions restaurants, pop-ups, vendeurs de rue' },
      pt: { name: 'Food Trucks e Comida de Rua', description: 'Food trucks, pop-ups, vendedores ambulantes' },
      zh: { name: '餐车与街头美食', description: '餐车、快闪店、街头小贩' },
      hi: { name: 'फूड ट्रक और स्ट्रीट फूड', description: 'खाना ट्रक, पॉप-अप, स्ट्रीट विक्रेता' },
      ar: { name: 'شاحنات الطعام والطعام في الشارع', description: 'شاحنات الطعام، منبثقة، الباعة المتجولون' },
      bn: { name: 'ফুড ট্রাক এবং স্ট্রিট ফুড', description: 'ফুড ট্রাক, পপ-আপ, রাস্তার বিক্রেতা' },
      ru: { name: 'Фудтраки и Уличная Еда', description: 'Фудтраки, поп-апы, уличные продавцы' },
      ur: { name: 'فوڈ ٹرک اور سٹریٹ فوڈ', description: 'کھانے کی گاڑیاں، پاپ اپس، سٹریٹ وینڈرز' },
    },
  },
  {
    id: 'happy_hour',
    name: 'Happy Hour & Specials',
    emoji: '🍻',
    description: 'Drink specials, happy hours, deals',
    subcategories: ['happy_hour', 'drink_specials', 'bar_deals'],
    translations: {
      es: { name: 'Happy Hour y Ofertas', description: 'Ofertas de bebidas, happy hours, promociones' },
      fr: { name: 'Happy Hour et Promotions', description: 'Promotions de boissons, happy hours, offres' },
      pt: { name: 'Happy Hour e Promoções', description: 'Promoções de bebidas, happy hours, ofertas' },
      zh: { name: '欢乐时光与特惠', description: '饮品特价、欢乐时光、优惠' },
      hi: { name: 'हैप्पी आवर और विशेष', description: 'पेय विशेष, हैप्पी आवर, सौदे' },
      ar: { name: 'ساعة السعادة والعروض', description: 'عروض المشروبات، ساعة السعادة، صفقات' },
      bn: { name: 'হ্যাপি আওয়ার এবং বিশেষ', description: 'পানীয় বিশেষ, হ্যাপি আওয়ার, চুক্তি' },
      ru: { name: 'Счастливые Часы и Спецпредложения', description: 'Спецпредложения на напитки, счастливые часы, акции' },
      ur: { name: 'ہیپی آور اور خصوصی', description: 'مشروبات کی خصوصی پیشکشیں، ہیپی آور، ڈیلز' },
    },
  },

  // Outdoor & Nature
  {
    id: 'hiking',
    name: 'Hiking & Trails',
    emoji: '🥾',
    description: 'Hiking trails, nature walks, trekking',
    subcategories: ['hiking', 'trails', 'nature_walks', 'trekking'],
    translations: {
      es: { name: 'Senderismo y Senderos', description: 'Rutas de senderismo, caminatas naturales, trekking' },
      fr: { name: 'Randonnée et Sentiers', description: 'Sentiers de randonnée, promenades nature, trekking' },
      pt: { name: 'Caminhadas e Trilhas', description: 'Trilhas, caminhadas na natureza, trekking' },
      zh: { name: '徒步与步道', description: '徒步小径、自然漫步、徒步旅行' },
      hi: { name: 'हाइकिंग और ट्रेल्स', description: 'हाइकिंग ट्रेल्स, प्रकृति चलना, ट्रेकिंग' },
      ar: { name: 'المشي لمسافات طويلة والممرات', description: 'مسارات المشي، المشي في الطبيعة، الرحلات' },
      bn: { name: 'হাইকিং এবং ট্রেইল', description: 'হাইকিং ট্রেইল, প্রকৃতি হাঁটা, ট্রেকিং' },
      ru: { name: 'Пешие Прогулки и Тропы', description: 'Пешеходные тропы, прогулки на природе, треккинг' },
      ur: { name: 'ہائیکنگ اور ٹریلز', description: 'ہائیکنگ ٹریلز، فطرت کی سیر، ٹریکنگ' },
    },
  },
  {
    id: 'parks',
    name: 'Parks & Gardens',
    emoji: '🌳',
    description: 'Public parks, botanical gardens, green spaces',
    subcategories: ['parks', 'gardens', 'green_spaces', 'botanical'],
    translations: {
      es: { name: 'Parques y Jardines', description: 'Parques públicos, jardines botánicos, espacios verdes' },
      fr: { name: 'Parcs et Jardins', description: 'Parcs publics, jardins botaniques, espaces verts' },
      pt: { name: 'Parques e Jardins', description: 'Parques públicos, jardins botânicos, espaços verdes' },
      zh: { name: '公园与花园', description: '公共公园、植物园、绿地' },
      hi: { name: 'पार्क और बगीचे', description: 'सार्वजनिक पार्क, वनस्पति उद्यान, हरित क्षेत्र' },
      ar: { name: 'الحدائق والمتنزهات', description: 'الحدائق العامة، الحدائق النباتية، المساحات الخضراء' },
      bn: { name: 'পার্ক এবং বাগান', description: 'পাবলিক পার্ক, উদ্ভিদ উদ্যান, সবুজ স্থান' },
      ru: { name: 'Парки и Сады', description: 'Общественные парки, ботанические сады, зеленые зоны' },
      ur: { name: 'پارکس اور باغات', description: 'عوامی پارکس، نباتاتی باغات، سبز جگہیں' },
    },
  },
  {
    id: 'beaches',
    name: 'Beaches & Waterfront',
    emoji: '🏖️',
    description: 'Beaches, waterfronts, coastal areas',
    subcategories: ['beaches', 'waterfront', 'coastal', 'lakefront'],
    translations: {
      es: { name: 'Playas y Frente Marítimo', description: 'Playas, frentes marítimos, áreas costeras' },
      fr: { name: 'Plages et Front de Mer', description: 'Plages, fronts de mer, zones côtières' },
      pt: { name: 'Praias e Orla Marítima', description: 'Praias, orlas marítimas, áreas costeiras' },
      zh: { name: '海滩与海滨', description: '海滩、海滨、沿海地区' },
      hi: { name: 'समुद्र तट और तटवर्ती', description: 'समुद्र तट, तटवर्ती क्षेत्र, तटीय क्षेत्र' },
      ar: { name: 'الشواطئ والواجهة البحرية', description: 'الشواطئ، الواجهات البحرية، المناطق الساحلية' },
      bn: { name: 'সৈকত এবং জলতট', description: 'সৈকত, জলতট, উপকূলীয় এলাকা' },
      ru: { name: 'Пляжи и Набережные', description: 'Пляжи, набережные, прибрежные районы' },
      ur: { name: 'ساحل اور واٹر فرنٹ', description: 'ساحل، واٹر فرنٹ، ساحلی علاقے' },
    },
  },
  {
    id: 'geocaching',
    name: 'Geocaching',
    emoji: '🗺️',
    description: 'Geocaching adventures, treasure hunts, outdoor exploring',
    subcategories: ['geocaching', 'treasure_hunt', 'caching', 'outdoor_adventure'],
    translations: {
      es: { name: 'Geocaching', description: 'Aventuras de geocaching, búsquedas del tesoro, exploración al aire libre' },
      fr: { name: 'Géocaching', description: 'Aventures de géocaching, chasses au trésor, exploration en plein air' },
      pt: { name: 'Geocaching', description: 'Aventuras de geocaching, caças ao tesouro, exploração ao ar livre' },
      zh: { name: '地理寻宝', description: '地理寻宝探险、寻宝、户外探索' },
      hi: { name: 'जियोकैचिंग', description: 'जियोकैचिंग रोमांच, खजाने की खोज, बाहरी अन्वेषण' },
      ar: { name: 'البحث عن الكنوز الجغرافية', description: 'مغامرات البحث الجغرافي، البحث عن الكنوز، الاستكشاف الخارجي' },
      bn: { name: 'জিওক্যাচিং', description: 'জিওক্যাচিং অভিযান, ট্রেজার হান্ট, বহিরঙ্গন অন্বেষণ' },
      ru: { name: 'Геокэшинг', description: 'Приключения геокэшинга, поиски сокровищ, исследование природы' },
      ur: { name: 'جیوکیچنگ', description: 'جیوکیچنگ مہمات، خزانے کی تلاش، بیرونی تلاش' },
    },
  },
  {
    id: 'disc_golf',
    name: 'Disc Golf',
    emoji: '🥏',
    description: 'Disc golf courses, frisbee golf, outdoor sports',
    subcategories: ['disc_golf', 'frisbee_golf', 'disc_sports'],
    translations: {
      es: { name: 'Disc Golf', description: 'Campos de disc golf, frisbee golf, deportes al aire libre' },
      fr: { name: 'Disc Golf', description: 'Parcours de disc golf, frisbee golf, sports de plein air' },
      pt: { name: 'Disc Golf', description: 'Campos de disc golf, frisbee golf, esportes ao ar livre' },
      zh: { name: '飞盘高尔夫', description: '飞盘高尔夫球场、飞盘高尔夫、户外运动' },
      hi: { name: 'डिस्क गोल्फ', description: 'डिस्क गोल्फ कोर्स, फ्रिसबी गोल्फ, बाहरी खेल' },
      ar: { name: 'غولف القرص', description: 'ملاعب غولف القرص، غولف الفريسبي، الرياضات الخارجية' },
      bn: { name: 'ডিস্ক গল্ফ', description: 'ডিস্ক গল্ফ কোর্স, ফ্রিসবি গল্ফ, বহিরঙ্গন খেলা' },
      ru: { name: 'Диск-гольф', description: 'Поля для диск-гольфа, фрисби-гольф, активный отдых' },
      ur: { name: 'ڈسک گالف', description: 'ڈسک گالف کورسز، فریسبی گالف، بیرونی کھیل' },
    },
  },
  {
    id: 'skate_parks',
    name: 'Skate Parks',
    emoji: '🛹',
    description: 'Skateparks, BMX, roller skating, skating spots',
    subcategories: ['skate_parks', 'skateboarding', 'bmx', 'roller_skating'],
    translations: {
      es: { name: 'Parques de Skate', description: 'Skateparks, BMX, patinaje sobre ruedas, lugares de patinaje' },
      fr: { name: 'Skateparks', description: 'Skateparks, BMX, roller, lieux de skate' },
      pt: { name: 'Pistas de Skate', description: 'Skateparks, BMX, patinação, locais de skate' },
      zh: { name: '滑板公园', description: '滑板公园、BMX、滚轴溜冰、滑板场地' },
      hi: { name: 'स्केट पार्क', description: 'स्केटपार्क, बीएमएक्स, रोलर स्केटिंग, स्केटिंग स्थान' },
      ar: { name: 'حدائق التزلج', description: 'حدائق التزلج، BMX، التزلج على الجليد، أماكن التزلج' },
      bn: { name: 'স্কেট পার্ক', description: 'স্কেটপার্ক, BMX, রোলার স্কেটিং, স্কেটিং স্থান' },
      ru: { name: 'Скейт-парки', description: 'Скейт-парки, BMX, роликовые коньки, места для катания' },
      ur: { name: 'سکیٹ پارکس', description: 'سکیٹ پارکس، BMX، رولر سکیٹنگ، سکیٹنگ کی جگہیں' },
    },
  },
  {
    id: 'action_sports',
    name: 'Action Sports!',
    emoji: '🤘',
    description: 'Rock climbing, zip lines, parkour, BMX, extreme sports, adrenaline rushes',
    subcategories: ['rock_climbing', 'zip_line', 'parkour', 'extreme_sports', 'bungee', 'motocross'],
    translations: {
      es: { name: 'Deportes de Acción', description: 'Escalada en roca, tirolinas, parkour, BMX, deportes extremos, adrenalina' },
      fr: { name: 'Sports Extrêmes', description: 'Escalade, tyroliennes, parkour, BMX, sports extrêmes, montées d\'adrénaline' },
      pt: { name: 'Esportes Radicais', description: 'Escalada, tirolesas, parkour, BMX, esportes extremos, adrenalina' },
      zh: { name: '极限运动', description: '攀岩、滑索、跑酷、BMX、极限运动、肾上腺素激增' },
      hi: { name: 'एक्शन स्पोर्ट्स', description: 'रॉक क्लाइंबिंग, जिप लाइन, पार्कौर, बीएमएक्स, चरम खेल, एड्रेनालाईन' },
      ar: { name: 'الرياضات الحركية', description: 'تسلق الصخور، الحبال المعلقة، باركور، BMX، الرياضات المتطرفة، الأدرينالين' },
      bn: { name: 'অ্যাকশন স্পোর্টস', description: 'রক ক্লাইম্বিং, জিপ লাইন, পার্কোর, BMX, চরম খেলা, অ্যাড্রিনালিন' },
      ru: { name: 'Экстремальные Виды Спорта', description: 'Скалолазание, зиплайны, паркур, BMX, экстремальный спорт, адреналин' },
      ur: { name: 'ایکشن اسپورٹس', description: 'راک کلائمبنگ، زپ لائنز، پارکور، BMX، انتہائی کھیل، ایڈرینالین' },
    },
  },

  // Water Sports & Activities
  {
    id: 'watersports',
    name: 'Water Sports',
    emoji: '🏄',
    description: 'Surfing, kayaking, paddleboarding, water activities',
    subcategories: ['surfing', 'kayaking', 'paddleboarding', 'swimming'],
    translations: {
      es: { name: 'Deportes Acuáticos', description: 'Surf, kayak, paddleboard, actividades acuáticas' },
      fr: { name: 'Sports Nautiques', description: 'Surf, kayak, paddle, activités nautiques' },
      pt: { name: 'Esportes Aquáticos', description: 'Surf, caiaque, stand up paddle, atividades aquáticas' },
      zh: { name: '水上运动', description: '冲浪、皮划艇、桨板冲浪、水上活动' },
      hi: { name: 'जल खेल', description: 'सर्फिंग, कयाकिंग, पैडलबोर्डिंग, जल गतिविधियां' },
      ar: { name: 'الرياضات المائية', description: 'ركوب الأمواج، التجديف، التزلج على الماء، الأنشطة المائية' },
      bn: { name: 'জল ক্রীড়া', description: 'সার্ফিং, কায়াকিং, প্যাডেলবোর্ডিং, জল কার্যক্রম' },
      ru: { name: 'Водные Виды Спорта', description: 'Сёрфинг, каякинг, гребля, водные активности' },
      ur: { name: 'آبی کھیل', description: 'سرفنگ، کیاکنگ، پیڈل بورڈنگ، پانی کی سرگرمیاں' },
    },
  },
  {
    id: 'fishing',
    name: 'Fishing',
    emoji: '🎣',
    description: 'Fishing spots, charters, angling',
    subcategories: ['fishing', 'charters', 'fly_fishing', 'pier_fishing'],
    translations: {
      es: { name: 'Pesca', description: 'Lugares de pesca, charters, pesca con caña' },
      fr: { name: 'Pêche', description: 'Lieux de pêche, charters, pêche à la ligne' },
      pt: { name: 'Pesca', description: 'Locais de pesca, charters, pesca esportiva' },
      zh: { name: '钓鱼', description: '钓鱼地点、包船、垂钓' },
      hi: { name: 'मछली पकड़ना', description: 'मछली पकड़ने की जगह, चार्टर, मछली पकड़ना' },
      ar: { name: 'صيد السمك', description: 'أماكن صيد الأسماك، السفن المستأجرة، الصيد بالصنارة' },
      bn: { name: 'মাছ ধরা', description: 'মাছ ধরার জায়গা, চার্টার, মাছ ধরা' },
      ru: { name: 'Рыбалка', description: 'Места для рыбалки, чартеры, удочка' },
      ur: { name: 'ماہی گیری', description: 'ماہی گیری کی جگہیں، چارٹرز، ماہی گیری' },
    },
  },
  {
    id: 'boating',
    name: 'Boating & Sailing',
    emoji: '⛵',
    description: 'Boating, sailing, yacht clubs, marinas',
    subcategories: ['boating', 'sailing', 'yacht', 'marinas'],
    translations: {
      es: { name: 'Navegación y Vela', description: 'Navegación, vela, clubes náuticos, marinas' },
      fr: { name: 'Navigation et Voile', description: 'Bateau, voile, clubs nautiques, marinas' },
      pt: { name: 'Navegação e Vela', description: 'Barcos, vela, clubes náuticos, marinas' },
      zh: { name: '划船与帆船', description: '划船、帆船、游艇俱乐部、码头' },
      hi: { name: 'नौका विहार और नौकायन', description: 'नौकायन, पाल, नौका क्लब, मरीना' },
      ar: { name: 'القوارب والإبحار', description: 'القوارب، الإبحار، نوادي اليخوت، المراسي' },
      bn: { name: 'নৌকা বিহার এবং পালতোলা', description: 'নৌকা, পালতোলা, ইয়ট ক্লাব, মেরিনা' },
      ru: { name: 'Катание на Лодках и Парусный Спорт', description: 'Лодки, парусный спорт, яхт-клубы, марины' },
      ur: { name: 'کشتی رانی اور بادبانی', description: 'کشتی رانی، بادبانی، یاٹ کلبس، مرینا' },
    },
  },

  // Sports & Fitness
  {
    id: 'sports',
    name: 'Sports & Recreation',
    emoji: '⚽',
    description: 'Sports games, recreational activities',
    subcategories: ['sports', 'games', 'recreation', 'athletics'],
    translations: {
      es: { name: 'Deportes y Recreación', description: 'Juegos deportivos, actividades recreativas' },
      fr: { name: 'Sports et Loisirs', description: 'Jeux sportifs, activités récréatives' },
      pt: { name: 'Esportes e Recreação', description: 'Jogos esportivos, atividades recreativas' },
      zh: { name: '体育与娱乐', description: '体育比赛、休闲活动' },
      hi: { name: 'खेल और मनोरंजन', description: 'खेल खेल, मनोरंजक गतिविधियां' },
      ar: { name: 'الرياضة والترفيه', description: 'الألعاب الرياضية، الأنشطة الترفيهية' },
      bn: { name: 'খেলাধুলা এবং বিনোদন', description: 'খেলাধুলা খেলা, বিনোদনমূলক কার্যক্রম' },
      ru: { name: 'Спорт и Отдых', description: 'Спортивные игры, развлекательные мероприятия' },
      ur: { name: 'کھیل اور تفریح', description: 'کھیلوں کے کھیل، تفریحی سرگرمیاں' },
    },
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    emoji: '🏃',
    description: 'Gyms, yoga, fitness classes, wellness',
    subcategories: ['fitness', 'yoga', 'gyms', 'wellness'],
    translations: {
      es: { name: 'Fitness y Bienestar', description: 'Gimnasios, yoga, clases de fitness, bienestar' },
      fr: { name: 'Fitness et Bien-être', description: 'Salles de sport, yoga, cours de fitness, bien-être' },
      pt: { name: 'Fitness e Bem-estar', description: 'Academias, yoga, aulas de fitness, bem-estar' },
      zh: { name: '健身与健康', description: '健身房、瑜伽、健身课程、健康' },
      hi: { name: 'फिटनेस और कल्याण', description: 'जिम, योग, फिटनेस कक्षाएं, कल्याण' },
      ar: { name: 'اللياقة البدنية والصحة', description: 'الصالات الرياضية، اليوغا، دروس اللياقة، الصحة' },
      bn: { name: 'ফিটনেস এবং সুস্থতা', description: 'জিম, যোগব্যায়াম, ফিটনেস ক্লাস, সুস্থতা' },
      ru: { name: 'Фитнес и Здоровье', description: 'Тренажёрные залы, йога, фитнес-классы, здоровье' },
      ur: { name: 'فٹنس اور تندرستی', description: 'جم، یوگا، فٹنس کلاسیں، تندرستی' },
    },
  },

  // Arts & Culture
  {
    id: 'museums',
    name: 'Museums & Galleries',
    emoji: '🎨',
    description: 'Art museums, galleries, exhibitions',
    subcategories: ['museums', 'galleries', 'exhibitions', 'art'],
    translations: {
      es: { name: 'Museos y Galerías', description: 'Museos de arte, galerías, exposiciones' },
      fr: { name: 'Musées et Galeries', description: 'Musées d\'art, galeries, expositions' },
      pt: { name: 'Museus e Galerias', description: 'Museus de arte, galerias, exposições' },
      zh: { name: '博物馆与画廊', description: '艺术博物馆、画廊、展览' },
      hi: { name: 'संग्रहालय और दीर्घाएँ', description: 'कला संग्रहालय, दीर्घाएं, प्रदर्शनियां' },
      ar: { name: 'المتاحف والمعارض', description: 'متاحف الفن، المعارض، المعارض' },
      bn: { name: 'জাদুঘর এবং গ্যালারি', description: 'শিল্প জাদুঘর, গ্যালারি, প্রদর্শনী' },
      ru: { name: 'Музеи и Галереи', description: 'Художественные музеи, галереи, выставки' },
      ur: { name: 'عجائب گھر اور گیلریاں', description: 'آرٹ عجائب گھر، گیلریاں، نمائشیں' },
    },
  },
  {
    id: 'movies',
    name: 'Movies & Cinema',
    emoji: '🎬',
    description: 'Movie theaters, film screenings, cinema',
    subcategories: ['movies', 'cinema', 'film', 'theaters'],
    translations: {
      es: { name: 'Películas y Cine', description: 'Cines, proyecciones de películas, cine' },
      fr: { name: 'Cinéma', description: 'Cinémas, projections de films, cinéma' },
      pt: { name: 'Filmes e Cinema', description: 'Cinemas, exibições de filmes, cinema' },
      zh: { name: '电影与影院', description: '电影院、电影放映、影院' },
      hi: { name: 'फिल्में और सिनेमा', description: 'मूवी थिएटर, फिल्म स्क्रीनिंग, सिनेमा' },
      ar: { name: 'الأفلام والسينما', description: 'دور السينما، عروض الأفلام، السينما' },
      bn: { name: 'সিনেমা এবং চলচ্চিত্র', description: 'সিনেমা হল, ফিল্ম স্ক্রীনিং, সিনেমা' },
      ru: { name: 'Кино и Кинотеатры', description: 'Кинотеатры, показы фильмов, кино' },
      ur: { name: 'فلمیں اور سینما', description: 'مووی تھیٹرز، فلم سکریننگ، سینما' },
    },
  },
  {
    id: 'classes',
    name: 'Classes & Workshops',
    emoji: '🎓',
    description: 'Educational classes, workshops, seminars',
    subcategories: ['classes', 'workshops', 'seminars', 'learning'],
    translations: {
      es: { name: 'Clases y Talleres', description: 'Clases educativas, talleres, seminarios' },
      fr: { name: 'Cours et Ateliers', description: 'Cours éducatifs, ateliers, séminaires' },
      pt: { name: 'Aulas e Oficinas', description: 'Aulas educacionais, oficinas, seminários' },
      zh: { name: '课程与研讨会', description: '教育课程、研讨会、讲座' },
      hi: { name: 'कक्षाएं और कार्यशालाएं', description: 'शैक्षिक कक्षाएं, कार्यशालाएं, सेमिनार' },
      ar: { name: 'الفصول والورش', description: 'الدروس التعليمية، ورش العمل، الندوات' },
      bn: { name: 'ক্লাস এবং ওয়ার্কশপ', description: 'শিক্ষামূলক ক্লাস, ওয়ার্কশপ, সেমিনার' },
      ru: { name: 'Классы и Мастер-классы', description: 'Образовательные классы, мастер-классы, семинары' },
      ur: { name: 'کلاسیں اور ورکشاپس', description: 'تعلیمی کلاسیں، ورکشاپس، سیمینارز' },
    },
  },

  // Community & Social
  {
    id: 'volunteering',
    name: 'Volunteering',
    emoji: '🤝',
    description: 'Volunteer opportunities, community service',
    subcategories: ['volunteering', 'community_service', 'charity'],
    translations: {
      es: { name: 'Voluntariado', description: 'Oportunidades de voluntariado, servicio comunitario' },
      fr: { name: 'Bénévolat', description: 'Opportunités de bénévolat, service communautaire' },
      pt: { name: 'Voluntariado', description: 'Oportunidades de voluntariado, serviço comunitário' },
      zh: { name: '志愿服务', description: '志愿者机会、社区服务' },
      hi: { name: 'स्वयंसेवा', description: 'स्वयंसेवक अवसर, सामुदायिक सेवा' },
      ar: { name: 'التطوع', description: 'فرص التطوع، الخدمة المجتمعية' },
      bn: { name: 'স্বেচ্ছাসেবা', description: 'স্বেচ্ছাসেবক সুযোগ, সম্প্রদায় সেবা' },
      ru: { name: 'Волонтёрство', description: 'Волонтёрские возможности, общественная служба' },
      ur: { name: 'رضاکارانہ خدمت', description: 'رضاکارانہ مواقع، کمیونٹی سروس' },
    },
  },
  {
    id: 'meetups',
    name: 'Meetups & Social Groups',
    emoji: '👥',
    description: 'Social gatherings, networking, meetup groups',
    subcategories: ['meetups', 'networking', 'social_groups'],
    translations: {
      es: { name: 'Encuentros y Grupos Sociales', description: 'Reuniones sociales, networking, grupos de encuentros' },
      fr: { name: 'Rencontres et Groupes Sociaux', description: 'Rassemblements sociaux, réseautage, groupes de rencontre' },
      pt: { name: 'Encontros e Grupos Sociais', description: 'Reuniões sociais, networking, grupos de encontro' },
      zh: { name: '聚会与社交小组', description: '社交聚会、社交网络、聚会小组' },
      hi: { name: 'मीटअप और सामाजिक समूह', description: 'सामाजिक सभाएं, नेटवर्किंग, मीटअप समूह' },
      ar: { name: 'اللقاءات والمجموعات الاجتماعية', description: 'التجمعات الاجتماعية، التواصل، مجموعات اللقاء' },
      bn: { name: 'মিটআপ এবং সামাজিক গ্রুপ', description: 'সামাজিক সমাবেশ, নেটওয়ার্কিং, মিটআপ গ্রুপ' },
      ru: { name: 'Встречи и Социальные Группы', description: 'Социальные собрания, нетворкинг, встречи' },
      ur: { name: 'ملاقاتیں اور سماجی گروپس', description: 'سماجی اجتماعات، نیٹ ورکنگ، ملاقات گروپس' },
    },
  },
  {
    id: 'farmers_markets',
    name: 'Farmers Markets',
    emoji: '🥕',
    description: 'Local farmers markets, fresh produce',
    subcategories: ['farmers_markets', 'local_markets', 'produce'],
    translations: {
      es: { name: 'Mercados de Agricultores', description: 'Mercados locales de agricultores, productos frescos' },
      fr: { name: 'Marchés Fermiers', description: 'Marchés fermiers locaux, produits frais' },
      pt: { name: 'Feiras de Agricultores', description: 'Feiras locais de agricultores, produtos frescos' },
      zh: { name: '农贸市场', description: '当地农贸市场、新鲜农产品' },
      hi: { name: 'किसान बाजार', description: 'स्थानीय किसान बाजार, ताजा उपज' },
      ar: { name: 'أسواق المزارعين', description: 'أسواق المزارعين المحلية، المنتجات الطازجة' },
      bn: { name: 'কৃষক বাজার', description: 'স্থানীয় কৃষক বাজার, তাজা উৎপাদন' },
      ru: { name: 'Фермерские Рынки', description: 'Местные фермерские рынки, свежие продукты' },
      ur: { name: 'کسانوں کی منڈیاں', description: 'مقامی کسانوں کی منڈیاں، تازہ پیداوار' },
    },
  },

  // Entertainment & Fun
  {
    id: 'gaming',
    name: 'Gaming & Arcades',
    emoji: '🎮',
    description: 'Arcade games, board game cafes, gaming',
    subcategories: ['gaming', 'arcades', 'board_games', 'esports'],
    translations: {
      es: { name: 'Juegos y Arcades', description: 'Juegos arcade, cafés de juegos de mesa, gaming' },
      fr: { name: 'Jeux et Arcades', description: 'Jeux d\'arcade, cafés de jeux de société, gaming' },
      pt: { name: 'Jogos e Arcades', description: 'Jogos de arcade, cafés de jogos de tabuleiro, gaming' },
      zh: { name: '游戏与街机', description: '街机游戏、桌游咖啡馆、游戏' },
      hi: { name: 'गेमिंग और आर्केड', description: 'आर्केड गेम, बोर्ड गेम कैफे, गेमिंग' },
      ar: { name: 'الألعاب والأركيد', description: 'ألعاب الأركيد، مقاهي ألعاب الطاولة، الألعاب' },
      bn: { name: 'গেমিং এবং আর্কেড', description: 'আর্কেড গেম, বোর্ড গেম ক্যাফে, গেমিং' },
      ru: { name: 'Игры и Аркады', description: 'Аркадные игры, кафе настольных игр, игры' },
      ur: { name: 'گیمنگ اور آرکیڈز', description: 'آرکیڈ گیمز، بورڈ گیم کیفے، گیمنگ' },
    },
  },
  {
    id: 'live_music',
    name: 'Live Music Venues',
    emoji: '🎵',
    description: 'Live music, jazz clubs, music venues',
    subcategories: ['live_music', 'jazz', 'music_venues', 'bands'],
    translations: {
      es: { name: 'Lugares de Música en Vivo', description: 'Música en vivo, clubes de jazz, lugares de música' },
      fr: { name: 'Lieux de Musique Live', description: 'Musique live, clubs de jazz, lieux musicaux' },
      pt: { name: 'Locais de Música ao Vivo', description: 'Música ao vivo, clubes de jazz, locais de música' },
      zh: { name: '现场音乐场所', description: '现场音乐、爵士俱乐部、音乐场所' },
      hi: { name: 'लाइव म्यूजिक स्थल', description: 'लाइव संगीत, जैज क्लब, संगीत स्थल' },
      ar: { name: 'أماكن الموسيقى الحية', description: 'الموسيقى الحية، نوادي الجاز، أماكن الموسيقى' },
      bn: { name: 'লাইভ মিউজিক ভেন্যু', description: 'লাইভ মিউজিক, জ্যাজ ক্লাব, মিউজিক ভেন্যু' },
      ru: { name: 'Места Живой Музыки', description: 'Живая музыка, джаз-клубы, музыкальные площадки' },
      ur: { name: 'لائیو میوزک جگہیں', description: 'لائیو موسیقی، جاز کلبس، موسیقی کی جگہیں' },
    },
  },
  {
    id: 'comedy',
    name: 'Comedy Shows',
    emoji: '😂',
    description: 'Stand-up comedy, improv, comedy clubs',
    subcategories: ['comedy', 'stand_up', 'improv', 'comedy_clubs'],
    translations: {
      es: { name: 'Shows de Comedia', description: 'Stand-up comedy, improv, clubes de comedia' },
      fr: { name: 'Spectacles de Comédie', description: 'Stand-up, impro, clubs de comédie' },
      pt: { name: 'Shows de Comédia', description: 'Stand-up comedy, improv, clubes de comédia' },
      zh: { name: '喜剧表演', description: '单口喜剧、即兴表演、喜剧俱乐部' },
      hi: { name: 'कॉमेडी शो', description: 'स्टैंड-अप कॉमेडी, इम्प्रोव, कॉमेडी क्लब' },
      ar: { name: 'عروض الكوميديا', description: 'كوميديا الوقوف، الارتجال، نوادي الكوميديا' },
      bn: { name: 'কমেডি শো', description: 'স্ট্যান্ড-আপ কমেডি, ইমপ্রভ, কমেডি ক্লাব' },
      ru: { name: 'Комедийные Шоу', description: 'Стенд-ап, импровизация, комедийные клубы' },
      ur: { name: 'کامیڈی شوز', description: 'اسٹینڈ اپ کامیڈی، امپرووائزیشن، کامیڈی کلبس' },
    },
  },

  // Shopping & Local
  {
    id: 'shopping',
    name: 'Shopping & Boutiques',
    emoji: '🛍️',
    description: 'Shopping districts, boutiques, local shops',
    subcategories: ['shopping', 'boutiques', 'retail', 'markets'],
    translations: {
      es: { name: 'Compras y Boutiques', description: 'Distritos comerciales, boutiques, tiendas locales' },
      fr: { name: 'Shopping et Boutiques', description: 'Quartiers commerçants, boutiques, magasins locaux' },
      pt: { name: 'Compras e Butiques', description: 'Distritos comerciais, butiques, lojas locais' },
      zh: { name: '购物与精品店', description: '购物区、精品店、当地商店' },
      hi: { name: 'शॉपिंग और बुटीक', description: 'शॉपिंग जिले, बुटीक, स्थानीय दुकानें' },
      ar: { name: 'التسوق والبوتيكات', description: 'أحياء التسوق، البوتيكات، المتاجر المحلية' },
      bn: { name: 'শপিং এবং বুটিক', description: 'শপিং জেলা, বুটিক, স্থানীয় দোকান' },
      ru: { name: 'Шопинг и Бутики', description: 'Торговые районы, бутики, местные магазины' },
      ur: { name: 'شاپنگ اور بوٹیکس', description: 'شاپنگ اضلاع، بوٹیکس، مقامی دکانیں' },
    },
  },
  {
    id: 'local_favorites',
    name: 'Local Favorites',
    emoji: '⭐',
    description: 'Hidden gems, local favorites, unique spots',
    subcategories: ['local', 'hidden_gems', 'favorites', 'unique'],
    translations: {
      es: { name: 'Favoritos Locales', description: 'Joyas ocultas, favoritos locales, lugares únicos' },
      fr: { name: 'Favoris Locaux', description: 'Perles cachées, favoris locaux, lieux uniques' },
      pt: { name: 'Favoritos Locais', description: 'Jóias escondidas, favoritos locais, lugares únicos' },
      zh: { name: '当地最爱', description: '隐藏宝石、当地最爱、独特景点' },
      hi: { name: 'स्थानीय पसंदीदा', description: 'छिपे हुए रत्न, स्थानीय पसंदीदा, अनोखे स्थान' },
      ar: { name: 'المفضلات المحلية', description: 'الجواهر المخفية، المفضلات المحلية، الأماكن الفريدة' },
      bn: { name: 'স্থানীয় প্রিয়', description: 'লুকানো রত্ন, স্থানীয় প্রিয়, অনন্য স্থান' },
      ru: { name: 'Местные Фавориты', description: 'Скрытые жемчужины, местные фавориты, уникальные места' },
      ur: { name: 'مقامی پسندیدہ', description: 'پوشیدہ جواہرات، مقامی پسندیدہ، منفرد جگہیں' },
    },
  },

  // Special Interests
  {
    id: 'wine_tasting',
    name: 'Wine & Breweries',
    emoji: '🍷',
    description: 'Wineries, breweries, tastings, tours',
    subcategories: ['wine', 'breweries', 'tastings', 'vineyards'],
    translations: {
      es: { name: 'Vino y Cervecerías', description: 'Bodegas, cervecerías, degustaciones, tours' },
      fr: { name: 'Vin et Brasseries', description: 'Caves, brasseries, dégustations, visites' },
      pt: { name: 'Vinho e Cervejarias', description: 'Vinícolas, cervejarias, degustações, tours' },
      zh: { name: '葡萄酒与啤酒厂', description: '酒庄、啤酒厂、品酒、旅游' },
      hi: { name: 'वाइन और ब्रुअरीज', description: 'वाइनरी, ब्रुअरीज, चखना, टूर' },
      ar: { name: 'النبيذ ومصانع الجعة', description: 'مصانع النبيذ، مصانع الجعة، التذوق، الجولات' },
      bn: { name: 'ওয়াইন এবং ব্রিউয়ারি', description: 'ওয়াইনারি, ব্রিউয়ারি, স্বাদ গ্রহণ, ট্যুর' },
      ru: { name: 'Вино и Пивоварни', description: 'Винодельни, пивоварни, дегустации, туры' },
      ur: { name: 'شراب اور بریوری', description: 'وائنری، بریوری، چکھنا، ٹورز' },
    },
  },
  {
    id: 'tours',
    name: 'Tours & Sightseeing',
    emoji: '🗺️',
    description: 'Guided tours, sightseeing, attractions',
    subcategories: ['tours', 'sightseeing', 'attractions', 'landmarks'],
    translations: {
      es: { name: 'Tours y Turismo', description: 'Tours guiados, turismo, atracciones' },
      fr: { name: 'Visites et Tourisme', description: 'Visites guidées, tourisme, attractions' },
      pt: { name: 'Tours e Turismo', description: 'Tours guiados, turismo, atrações' },
      zh: { name: '旅游与观光', description: '导游旅游、观光、景点' },
      hi: { name: 'टूर और दर्शनीय स्थल', description: 'गाइडेड टूर, दर्शनीय स्थल, आकर्षण' },
      ar: { name: 'الجولات والمعالم السياحية', description: 'الجولات المرشدة، المعالم السياحية، المعالم' },
      bn: { name: 'ট্যুর এবং দর্শনীয় স্থান', description: 'গাইডেড ট্যুর, দর্শনীয় স্থান, আকর্ষণ' },
      ru: { name: 'Туры и Достопримечательности', description: 'Экскурсии, осмотр достопримечательностей, attractions' },
      ur: { name: 'ٹورز اور سیاحت', description: 'گائیڈڈ ٹورز، سیاحت، دلچسپ مقامات' },
    },
  },
  {
    id: 'free_activities',
    name: 'Free Activities',
    emoji: '🎁',
    description: 'Free events, activities, no-cost fun',
    subcategories: ['free', 'no_cost', 'budget_friendly'],
    translations: {
      es: { name: 'Actividades Gratuitas', description: 'Eventos gratuitos, actividades, diversión sin costo' },
      fr: { name: 'Activités Gratuites', description: 'Événements gratuits, activités, divertissement gratuit' },
      pt: { name: 'Atividades Gratuitas', description: 'Eventos gratuitos, atividades, diversão sem custo' },
      zh: { name: '免费活动', description: '免费活动、活动、无成本娱乐' },
      hi: { name: 'निःशुल्क गतिविधियाँ', description: 'निःशुल्क घटनाएँ, गतिविधियाँ, बिना लागत का मनोरंजन' },
      ar: { name: 'أنشطة مجانية', description: 'أحداث مجانية، أنشطة، متعة بدون تكلفة' },
      bn: { name: 'বিনামূল্যে কার্যক্রম', description: 'বিনামূল্যে ইভেন্ট, কার্যক্রম, বিনা খরচে মজা' },
      ru: { name: 'Бесплатные Мероприятия', description: 'Бесплатные события, мероприятия, развлечения без затрат' },
      ur: { name: 'مفت سرگرمیاں', description: 'مفت ایونٹس، سرگرمیاں، بغیر لاگت تفریح' },
    },
  },
];

// Default affinity score for new users (0.5 = neutral)
export const DEFAULT_AFFINITY_SCORE = 0.5;

// Helper to get affinity category by ID
export function getAffinityCategory(id: string): AffinityCategory | undefined {
  return AFFINITY_CATEGORIES.find((cat) => cat.id === id);
}

// Helper to initialize default affinities
export function getDefaultAffinities(): Record<string, number> {
  const affinities: Record<string, number> = {};
  AFFINITY_CATEGORIES.forEach((category) => {
    affinities[category.id] = DEFAULT_AFFINITY_SCORE;
  });
  return affinities;
}

// Helper to get translated affinity categories based on language code
export function getTranslatedCategories(languageCode: string): AffinityCategory[] {
  // If English or no translations available, return original
  if (languageCode === 'en') {
    return AFFINITY_CATEGORIES;
  }

  // Return categories with translated names/descriptions
  return AFFINITY_CATEGORIES.map((category) => {
    const translation = category.translations?.[languageCode];
    if (translation) {
      return {
        ...category,
        name: translation.name,
        description: translation.description,
      };
    }
    // Fallback to English if no translation
    return category;
  });
}

// Helper to map country code to language code for geo-based display
export function getLanguageFromCountryCode(countryCode: string): string {
  return COUNTRY_TO_LANGUAGE[countryCode] || 'en';
}
