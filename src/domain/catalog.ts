export type MenuCategory = "RAW_CRUDO" | "DIM_SUM_BAO" | "ROBATA_WOK" | "RAMEN_LAKSA" | "DESSERTS";

export type Allergen = "peanuts" | "shellfish" | "soy" | "sesame" | "lactose" | "egg" | "gluten";

export type DietaryTag = "vegan" | "gluten_free" | "halal" | "keto" | "high_umami";

export type SpiceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MenuItem {
  id: string;
  nameRu: string;
  nameAsian: string;
  category: MenuCategory;
  description: string;
  ingredients: string[];
  price: number;
  weightGrams: number;
  kcal: number;
  spiceLevel: SpiceLevel;
  umamiIndex: number;
  allergens: Allergen[];
  dietaryTags: DietaryTag[];
  recommendedPairingIds: string[];
  image: string;
  imageGrad: string;
}

export type BeverageCategory = "SAKE_SOJU" | "SIGNATURE_COCKTAIL" | "ARTISAN_TEA" | "ZERO_PROOF";

export interface Beverage {
  id: string;
  nameRu: string;
  category: BeverageCategory;
  alcohol: boolean;
  acidity: number;
  spiceTolerance: number;
  umami: number;
  price: number;
  note: string;
}

export type DiningZone =
  | "Main Hall"
  | "Teppanyaki Counter"
  | "Chef's Omakase Table"
  | "VIP Tatami Room"
  | "Summer Bamboo Terrace";

export interface DiningTable {
  id: string;
  zone: DiningZone;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Reservation {
  code: string;
  guestName: string;
  guestPhone: string;
  date: string;
  time: string;
  guestsCount: number;
  tableId: string;
  zone: DiningZone;
  specialRequests?: string;
  preOrderDishIds: string[];
  createdAt: number;
}

export interface DeliveryOrder {
  id: string;
  status: string;
  etaMinutes: number;
  items: string[];
  courier: string;
  promoCode?: string;
  refundTicket?: string;
}

export const CATEGORY_LABELS: Record<MenuCategory | "ALL", string> = {
  ALL: "Всё меню",
  RAW_CRUDO: "Сырое и крудо",
  DIM_SUM_BAO: "Димсамы и бао",
  ROBATA_WOK: "Робата и вок",
  RAMEN_LAKSA: "Рамен и лакса",
  DESSERTS: "Десерты",
};

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  peanuts: "арахис",
  shellfish: "моллюски и ракообразные",
  soy: "соя",
  sesame: "кунжут",
  lactose: "лактоза",
  egg: "яйцо",
  gluten: "глютен",
};

export const DIETARY_LABELS: Record<DietaryTag, string> = {
  vegan: "веган",
  gluten_free: "без глютена",
  halal: "халяль",
  keto: "кето",
  high_umami: "высокий умами",
};

export const ZONE_LABELS: Record<DiningZone, string> = {
  "Main Hall": "Главный зал",
  "Teppanyaki Counter": "Стойка теппаньяки",
  "Chef's Omakase Table": "Стол шефа, омакасе",
  "VIP Tatami Room": "Татами VIP",
  "Summer Bamboo Terrace": "Бамбуковая терраса",
};

export const MENU: MenuItem[] = [
  {
    id: "dish-hamachi-01",
    nameRu: "Сашими из дикого хамачи с трюфельным понзу и юдзу-косё",
    nameAsian: "ハマチのトリュフポン酢",
    category: "RAW_CRUDO",
    description: "Холодный срез дикого хамачи, понзу, настоянный на чёрном трюфеле, и зелёная паста юдзу-косё.",
    ingredients: ["хамачи", "понзу", "чёрный трюфель", "юдзу-косё", "соевый соус"],
    price: 1890,
    weightGrams: 90,
    kcal: 210,
    spiceLevel: 1,
    umamiIndex: 9,
    allergens: ["soy"],
    dietaryTags: ["gluten_free", "high_umami"],
    recommendedPairingIds: ["bev-junmai", "bev-yuzu-soda"],
    image: "/dishes/hamachi.jpg",
    imageGrad: "linear-gradient(145deg, #1c2836 0%, #8d5a44 55%, #e7d7c1 100%)",
  },
  {
    id: "dish-wagyu-02",
    nameRu: "Тартар из японского вагю A5 с копчёным желтком и чипсами из корня лотоса",
    nameAsian: "和牛タルタル",
    category: "RAW_CRUDO",
    description: "Рубленая мраморная говядина, тёплый копчёный желток и хруст лотоса.",
    ingredients: ["говядина вагю A5", "копчёный яичный желток", "корень лотоса", "соевый соус"],
    price: 3400,
    weightGrams: 110,
    kcal: 390,
    spiceLevel: 0,
    umamiIndex: 10,
    allergens: ["egg", "soy"],
    dietaryTags: ["high_umami", "keto"],
    recommendedPairingIds: ["bev-junmai", "bev-hojicha"],
    image: "/dishes/wagyu.jpg",
    imageGrad: "linear-gradient(145deg, #2a1214 0%, #8a2e24 48%, #e6b089 100%)",
  },
  {
    id: "dish-dimsum-03",
    nameRu: "Чёрные сяолунбао с камчатским крабом, чернилами каракатицы и имбирным бульоном",
    nameAsian: "蟹の小籠包",
    category: "DIM_SUM_BAO",
    description: "Тонкое тесто цвета туши, внутри сладкий краб и горячий имбирный бульон.",
    ingredients: ["камчатский краб", "чернила каракатицы", "пшеничное тесто", "имбирь", "бульон"],
    price: 1640,
    weightGrams: 140,
    kcal: 320,
    spiceLevel: 1,
    umamiIndex: 9,
    allergens: ["shellfish", "gluten", "soy"],
    dietaryTags: ["high_umami"],
    recommendedPairingIds: ["bev-umeshu", "bev-jasmine"],
    image: "/dishes/dimsum.jpg",
    imageGrad: "linear-gradient(145deg, #10141c 0%, #243044 50%, #d7c4a3 100%)",
  },
  {
    id: "dish-bao-04",
    nameRu: "Паровые бао с глазированной грудинкой тясю, кимчи и дроблёным арахисом",
    nameAsian: "チャーシューバオ",
    category: "DIM_SUM_BAO",
    description: "Мягкая булочка, лакированная свинина, кимчи и арахисовая крошка.",
    ingredients: ["свиная грудинка", "кимчи", "арахис", "кунжут", "пшеничная булочка", "соевый соус"],
    price: 890,
    weightGrams: 160,
    kcal: 480,
    spiceLevel: 3,
    umamiIndex: 8,
    allergens: ["peanuts", "gluten", "soy", "sesame"],
    dietaryTags: [],
    recommendedPairingIds: ["bev-shochu", "bev-ember-sour"],
    image: "/dishes/bao.jpg",
    imageGrad: "linear-gradient(145deg, #3a1d12 0%, #c4552a 55%, #f2d2a2 100%)",
  },
  {
    id: "dish-cod-05",
    nameRu: "Чёрная угольная треска в 72-часовом маринаде сайкё-мисо на робате",
    nameAsian: "銀鱈の西京焼き",
    category: "ROBATA_WOK",
    description: "Плотная треска, белое мисо Киото и уголь биночётан. Снаружи карамель, внутри масло.",
    ingredients: ["треска", "сайкё-мисо", "сахар", "саке для маринада"],
    price: 2900,
    weightGrams: 170,
    kcal: 410,
    spiceLevel: 0,
    umamiIndex: 10,
    allergens: ["soy"],
    dietaryTags: ["gluten_free", "high_umami"],
    recommendedPairingIds: ["bev-junmai", "bev-hojicha"],
    image: "/dishes/cod.jpg",
    imageGrad: "linear-gradient(145deg, #1a1814 0%, #6d5434 42%, #f0e2c4 100%)",
  },
  {
    id: "dish-crab-06",
    nameRu: "Вок с мягкопанцирным крабом в сингапурском соусе из чёрного и сычуаньского перца",
    nameAsian: "ソフトシェルクラブ",
    category: "ROBATA_WOK",
    description: "Хрустящий панцирь, сладкий краб и онемение сычуаньского перца.",
    ingredients: ["мягкопанцирный краб", "чёрный перец", "сычуаньский перец", "яйцо", "соевый соус"],
    price: 3200,
    weightGrams: 220,
    kcal: 540,
    spiceLevel: 4,
    umamiIndex: 9,
    allergens: ["shellfish", "soy", "egg"],
    dietaryTags: ["high_umami"],
    recommendedPairingIds: ["bev-ember-sour", "bev-calamansi"],
    image: "/dishes/crab.jpg",
    imageGrad: "linear-gradient(145deg, #2b120c 0%, #a33b24 50%, #efc07a 100%)",
  },
  {
    id: "dish-tofu-07",
    nameRu: "Хрустящий шёлковый тофу на углях с соусом из чёрных бобов, шиитаке и зелёного чили",
    nameAsian: "炭火豆腐",
    category: "ROBATA_WOK",
    description: "Корочка от угля, кремовая сердцевина, соус доучи и зелёный чили.",
    ingredients: ["шёлковый тофу", "чёрные бобы", "шиитаке", "зелёный чили", "кунжут"],
    price: 980,
    weightGrams: 180,
    kcal: 260,
    spiceLevel: 2,
    umamiIndex: 8,
    allergens: ["soy", "sesame"],
    dietaryTags: ["vegan", "halal"],
    recommendedPairingIds: ["bev-jasmine", "bev-calamansi"],
    image: "/dishes/tofu.jpg",
    imageGrad: "linear-gradient(145deg, #14241c 0%, #2a9d8f 48%, #d9e7d2 100%)",
  },
  {
    id: "dish-ramen-08",
    nameRu: "Тонкоцу рамен 18-часового томления с чёрным чесночным маслом майю и яйцом аджитама",
    nameAsian: "豚骨ラーメン",
    category: "RAMEN_LAKSA",
    description: "Плотный свиной бульон, майю, нити нибокко и яйцо, маринованное в сое.",
    ingredients: ["свиной бульон тонкоцу", "пшеничная лапша", "яйцо аджитама", "чесночное масло майю", "кунжут", "соевый соус"],
    price: 1450,
    weightGrams: 450,
    kcal: 820,
    spiceLevel: 2,
    umamiIndex: 10,
    allergens: ["egg", "gluten", "soy", "sesame"],
    dietaryTags: ["high_umami"],
    recommendedPairingIds: ["bev-shochu", "bev-hojicha"],
    image: "/dishes/ramen.jpg",
    imageGrad: "linear-gradient(145deg, #1c120c 0%, #7a4a28 46%, #f3e1c5 100%)",
  },
  {
    id: "dish-laksa-09",
    nameRu: "Малайзийская огненная карри-лакса с тигровыми креветками, кокосовым молоком и лемонграссом",
    nameAsian: "カレーラクサ",
    category: "RAMEN_LAKSA",
    description: "Красная паста, кокос, креветки и лемонграсс. Самая острая чаша в зале.",
    ingredients: ["тигровые креветки", "кокосовое молоко", "лемонграсс", "карри-паста", "арахис", "рисовая лапша"],
    price: 1680,
    weightGrams: 430,
    kcal: 760,
    spiceLevel: 5,
    umamiIndex: 9,
    allergens: ["shellfish", "peanuts"],
    dietaryTags: ["high_umami"],
    recommendedPairingIds: ["bev-calamansi", "bev-ember-sour"],
    image: "/dishes/laksa.jpg",
    imageGrad: "linear-gradient(145deg, #3b0d12 0%, #e63946 42%, #f4a261 100%)",
  },
  {
    id: "dish-mousse-10",
    nameRu: "Деконструкция чёрного кунжута: мусс гома, гель юдзу-каламанси и золотой лист",
    nameAsian: "黒胡麻ムース",
    category: "DESSERTS",
    description: "Холодный кунжутный мусс, кислый гель и съедобное золото.",
    ingredients: ["чёрный кунжут", "сливки", "юдзу", "каламанси", "съедобное золото"],
    price: 920,
    weightGrams: 95,
    kcal: 340,
    spiceLevel: 0,
    umamiIndex: 6,
    allergens: ["sesame", "lactose"],
    dietaryTags: [],
    recommendedPairingIds: ["bev-jasmine", "bev-umeshu"],
    image: "/dishes/mousse.jpg",
    imageGrad: "linear-gradient(145deg, #16141a 0%, #3d3a46 40%, #e7d7a8 100%)",
  },
];

export const BEVERAGES: Beverage[] = [
  {
    id: "bev-junmai",
    nameRu: "Дзюнмай дайгиндзё «Кицунэ», Ниигата",
    category: "SAKE_SOJU",
    alcohol: true,
    acidity: 6,
    spiceTolerance: 2,
    umami: 8,
    price: 890,
    note: "Рис без помола напоказ: дыня, коджи и тихая сладость к рыбе и мисо.",
  },
  {
    id: "bev-shochu",
    nameRu: "Кокуто сётю с обжаренным ячменём",
    category: "SAKE_SOJU",
    alcohol: true,
    acidity: 3,
    spiceTolerance: 4,
    umami: 5,
    price: 640,
    note: "Тростниковый сахар Амами держит жир бао и тонкоцу.",
  },
  {
    id: "bev-umeshu",
    nameRu: "Сливовое умесю 7 лет на дубе",
    category: "SAKE_SOJU",
    alcohol: true,
    acidity: 7,
    spiceTolerance: 2,
    umami: 4,
    price: 590,
    note: "Кислота сливы режет сладкий краб и кунжутный мусс.",
  },
  {
    id: "bev-ember-sour",
    nameRu: "Ember Sour: виски, юдзу, белок и угольный биттер",
    category: "SIGNATURE_COCKTAIL",
    alcohol: true,
    acidity: 8,
    spiceTolerance: 5,
    umami: 3,
    price: 780,
    note: "Кислота и дым гасят сычуаньский перец.",
  },
  {
    id: "bev-hojicha",
    nameRu: "Ходзитя с обжаренным рисом и цедрой",
    category: "ARTISAN_TEA",
    alcohol: false,
    acidity: 2,
    spiceTolerance: 2,
    umami: 6,
    price: 420,
    note: "Ореховый чай к вагю, треске и рамену.",
  },
  {
    id: "bev-jasmine",
    nameRu: "Ферментированный жасминовый чай с мёдом гречихи",
    category: "ARTISAN_TEA",
    alcohol: false,
    acidity: 4,
    spiceTolerance: 3,
    umami: 3,
    price: 390,
    note: "Цветочный чай к димсамам, тофу и десерту.",
  },
  {
    id: "bev-yuzu-soda",
    nameRu: "Юдзу-сода с солью из водорослей",
    category: "ZERO_PROOF",
    alcohol: false,
    acidity: 8,
    spiceTolerance: 3,
    umami: 4,
    price: 450,
    note: "Соль и цитрус поднимают хамачи.",
  },
  {
    id: "bev-calamansi",
    nameRu: "Безалкогольный эликсир каламанси, лемонграсс и кокосовая вода",
    category: "ZERO_PROOF",
    alcohol: false,
    acidity: 9,
    spiceTolerance: 5,
    umami: 2,
    price: 460,
    note: "Гасит огонь лаксы и перца, не спорит с кокосом.",
  },
];

export const TABLES: DiningTable[] = [
  { id: "MH-01", zone: "Main Hall", seats: 2, x: 78, y: 118, w: 74, h: 48 },
  { id: "MH-02", zone: "Main Hall", seats: 4, x: 176, y: 108, w: 92, h: 64 },
  { id: "MH-03", zone: "Main Hall", seats: 4, x: 92, y: 196, w: 92, h: 64 },
  { id: "MH-04", zone: "Main Hall", seats: 6, x: 210, y: 198, w: 116, h: 70 },
  { id: "TEP-01", zone: "Teppanyaki Counter", seats: 2, x: 430, y: 92, w: 78, h: 42 },
  { id: "TEP-02", zone: "Teppanyaki Counter", seats: 2, x: 522, y: 92, w: 78, h: 42 },
  { id: "TEP-03", zone: "Teppanyaki Counter", seats: 4, x: 614, y: 86, w: 108, h: 52 },
  { id: "OMA-01", zone: "Chef's Omakase Table", seats: 8, x: 470, y: 188, w: 250, h: 72 },
  { id: "VIP-01", zone: "VIP Tatami Room", seats: 6, x: 455, y: 330, w: 130, h: 86 },
  { id: "VIP-02", zone: "VIP Tatami Room", seats: 4, x: 610, y: 342, w: 112, h: 70 },
  { id: "TER-01", zone: "Summer Bamboo Terrace", seats: 4, x: 78, y: 360, w: 110, h: 64 },
  { id: "TER-02", zone: "Summer Bamboo Terrace", seats: 6, x: 214, y: 368, w: 132, h: 72 },
];

export const SEED_ORDERS: DeliveryOrder[] = [
  {
    id: "KE-1042",
    status: "На кухне",
    etaMinutes: 35,
    items: ["Тонкоцу рамен", "Бао с тясю"],
    courier: "Марина",
  },
  {
    id: "KE-2088",
    status: "В пути",
    etaMinutes: 12,
    items: ["Карри-лакса"],
    courier: "Илья",
  },
  {
    id: "KE-3310",
    status: "Доставлен",
    etaMinutes: 0,
    items: ["Угольная треска"],
    courier: "Олег",
  },
];

export const RESTAURANT = {
  name: "KITSUNE & EMBER",
  city: "Москва",
  address: "Большой Козихинский переулок, 10",
  phone: "+7 495 120-19-08",
  hours: "Ежедневно 12:00–23:00",
  lastSeating: "22:30",
  dressCode: "Smart casual. К спортивным костюмам и пляжной обуви не сажаем.",
  parking: "Шесть мест во дворе, въезд с Ермолаевского. После 18:00 лучше предупредить хостес.",
  delivery: "Доставка внутри Садового кольца. Номер заказа выглядит как KE-1042.",
  managerName: "Анна Лебедева",
  managerPhone: "+7 495 120-19-11",
};
