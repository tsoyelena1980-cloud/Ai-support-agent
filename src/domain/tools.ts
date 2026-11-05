import {
  ALLERGEN_LABELS,
  BEVERAGES,
  DIETARY_LABELS,
  MENU,
  RESTAURANT,
  SEED_ORDERS,
  TABLES,
  type Allergen,
  type BeverageCategory,
  type DeliveryOrder,
  type DietaryTag,
  type DiningZone,
  type MenuCategory,
  type Reservation,
} from "@/domain/catalog";

export const SEATING_MINUTES = 90;
export const RESERVATIONS_STORAGE_KEY = "kitsune_reservations_v1";
export const ORDERS_STORAGE_KEY = "kitsune_orders_v1";

export interface MenuFilter {
  category: MenuCategory | "ALL";
  maxSpice: number;
  dietaryTags: DietaryTag[];
  excludedAllergens: Allergen[];
  maxPrice: number | null;
  query: string;
}

export const EMPTY_FILTER: MenuFilter = {
  category: "ALL",
  maxSpice: 5,
  dietaryTags: [],
  excludedAllergens: [],
  maxPrice: null,
  query: "",
};

export interface DomainSnapshot {
  reservations: Reservation[];
  orders: DeliveryOrder[];
  now?: Date;
}

export interface ToolSuccess {
  ok: true;
  data: Record<string, unknown>;
  reservations?: Reservation[];
  orders?: DeliveryOrder[];
  highlightDishIds?: string[];
  filter?: MenuFilter;
  focusZone?: DiningZone | "ANY";
  suggestedTableIds?: string[];
  reservedTableId?: string;
}

export interface ToolFailure {
  ok: false;
  error: string;
}

export type ToolOutcome = ToolSuccess | ToolFailure;

const CATEGORIES = new Set(["ALL", "RAW_CRUDO", "DIM_SUM_BAO", "ROBATA_WOK", "RAMEN_LAKSA", "DESSERTS"]);
const DIETARY = new Set(Object.keys(DIETARY_LABELS));
const ALLERGENS = new Set(Object.keys(ALLERGEN_LABELS));
const ZONES = new Set<DiningZone>([
  "Main Hall",
  "Teppanyaki Counter",
  "Chef's Omakase Table",
  "VIP Tatami Room",
  "Summer Bamboo Terrace",
]);

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === "object" ? (args as Record<string, unknown>) : {};
}

function moscowClock(now: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${pick("year")}-${pick("month")}-${pick("day")}`,
    minutes: Number(pick("hour")) * 60 + Number(pick("minute")),
  };
}

export function minutesFromClock(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function validateVisit(date: string, time: string, guests: number, now: Date): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Дата нужна в формате YYYY-MM-DD.";
  const minutes = minutesFromClock(time);
  if (minutes === null) return "Время нужно в формате HH:MM.";
  if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
    return "Количество гостей должно быть целым числом от 1 до 12.";
  }
  if (minutes < 12 * 60 || minutes > 22 * 60 + 30) {
    return "Посадка возможна с 12:00 до 22:30.";
  }
  const clock = moscowClock(now);
  if (date < clock.date || (date === clock.date && minutes < clock.minutes)) {
    return "Это время уже прошло по Москве.";
  }
  return null;
}

function overlaps(left: string, right: string): boolean {
  const a = minutesFromClock(left);
  const b = minutesFromClock(right);
  if (a === null || b === null) return false;
  return Math.abs(a - b) < SEATING_MINUTES;
}

export function tableIsFree(tableId: string, date: string, time: string, reservations: Reservation[]): boolean {
  return !reservations.some(
    (item) => item.tableId === tableId && item.date === date && overlaps(item.time, time),
  );
}

export function searchMenu(filter: MenuFilter) {
  return MENU.filter((dish) => {
    if (filter.category !== "ALL" && dish.category !== filter.category) return false;
    if (dish.spiceLevel > filter.maxSpice) return false;
    if (filter.maxPrice !== null && dish.price > filter.maxPrice) return false;
    if (filter.dietaryTags.some((tag) => !dish.dietaryTags.includes(tag))) return false;
    if (dish.allergens.some((allergen) => filter.excludedAllergens.includes(allergen))) return false;
    const query = filter.query?.trim().toLowerCase() ?? "";
    if (query) {
      const haystack = [dish.nameRu, dish.description, ...dish.ingredients].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function publicDish(dish: (typeof MENU)[number]) {
  return {
    id: dish.id,
    name: dish.nameRu,
    category: dish.category,
    description: dish.description,
    ingredients: dish.ingredients,
    kcal: dish.kcal,
    price_rub: dish.price,
    spice_level: dish.spiceLevel,
    umami_index: dish.umamiIndex,
    allergens: dish.allergens,
    dietary_tags: dish.dietaryTags,
    weight_grams: dish.weightGrams,
  };
}

function listedStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function searchMenuTool(args: Record<string, unknown>): ToolOutcome {
  const category = args.category === undefined ? "ALL" : String(args.category);
  if (!CATEGORIES.has(category)) {
    return { ok: false, error: "Нужна категория: ALL, RAW_CRUDO, DIM_SUM_BAO, ROBATA_WOK, RAMEN_LAKSA или DESSERTS." };
  }
  const maxSpice = args.max_spice_level === undefined ? 5 : Number(args.max_spice_level);
  if (!Number.isInteger(maxSpice) || maxSpice < 0 || maxSpice > 5) {
    return { ok: false, error: "max_spice_level должен быть целым числом от 0 до 5." };
  }
  const dietaryTags = listedStrings(args.dietary_tags);
  if (dietaryTags.some((tag) => !DIETARY.has(tag))) {
    return { ok: false, error: "Неизвестный dietary tag." };
  }
  const excludedAllergens = listedStrings(args.excluded_allergens);
  if (excludedAllergens.some((allergen) => !ALLERGENS.has(allergen))) {
    return { ok: false, error: "Неизвестный аллерген." };
  }
  const maxPrice = args.max_price === undefined ? null : Number(args.max_price);
  if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
    return { ok: false, error: "max_price должен быть неотрицательным числом." };
  }
  const query = String(args.query ?? "").trim().toLowerCase();
  const filter: MenuFilter = {
    category: category as MenuFilter["category"],
    maxSpice,
    dietaryTags: dietaryTags as DietaryTag[],
    excludedAllergens: excludedAllergens as Allergen[],
    maxPrice,
    query,
  };
  const dishes = searchMenu(filter);
  return {
    ok: true,
    data: { count: dishes.length, dishes: dishes.map(publicDish) },
    highlightDishIds: dishes.map((dish) => dish.id),
    filter,
  };
}

function pairingTool(args: Record<string, unknown>): ToolOutcome {
  const dishIds = Array.isArray(args.dish_ids) ? args.dish_ids.map(String) : [];
  if (dishIds.length === 0) return { ok: false, error: "Передайте хотя бы один dish_id." };
  if (typeof args.alcohol_free !== "boolean") return { ok: false, error: "alcohol_free должен быть true или false." };
  const dishes = dishIds.map((id) => MENU.find((item) => item.id === id)).filter((item) => item !== undefined);
  if (dishes.length === 0) return { ok: false, error: "Ни один dish_id не найден в меню." };
  const category = String(args.beverage_category ?? "ANY") as BeverageCategory | "ANY";
  const avgUmami = dishes.reduce((sum, dish) => sum + dish.umamiIndex, 0) / dishes.length;
  const maxSpice = Math.max(...dishes.map((dish) => dish.spiceLevel));
  const preferred = new Set(dishes.flatMap((dish) => dish.recommendedPairingIds));

  const ranked = BEVERAGES.filter((drink) => {
    if (args.alcohol_free && drink.alcohol) return false;
    if (category !== "ANY" && drink.category !== category) return false;
    return true;
  })
    .map((drink) => {
      const spicePenalty = Math.max(0, maxSpice - drink.spiceTolerance) * 2;
      const score = 10 - Math.abs(avgUmami - drink.umami) - spicePenalty + (preferred.has(drink.id) ? 3 : 0);
      return { drink, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return {
    ok: true,
    data: {
      dishes: dishes.map((dish) => ({ id: dish.id, name: dish.nameRu, spice_level: dish.spiceLevel })),
      pairings: ranked.map(({ drink, score }) => ({
        id: drink.id,
        name: drink.nameRu,
        category: drink.category,
        alcohol: drink.alcohol,
        price_rub: drink.price,
        note: drink.note,
        score: Math.round(score * 10) / 10,
      })),
    },
  };
}

function checkTables(args: Record<string, unknown>, snapshot: DomainSnapshot): ToolOutcome {
  const date = String(args.date ?? "");
  const time = String(args.time ?? "");
  const guests = Number(args.guests_count);
  const zoneRaw = args.zone_preference === undefined ? "ANY" : String(args.zone_preference);
  const visitError = validateVisit(date, time, guests, snapshot.now ?? new Date());
  if (visitError) return { ok: false, error: visitError };
  if (zoneRaw !== "ANY" && !ZONES.has(zoneRaw as DiningZone)) {
    return { ok: false, error: "Неизвестная зона посадки." };
  }
  const zone = zoneRaw as DiningZone | "ANY";
  const available = TABLES.filter((table) => {
    if (zone !== "ANY" && table.zone !== zone) return false;
    if (table.seats < guests) return false;
    return tableIsFree(table.id, date, time, snapshot.reservations);
  }).sort((a, b) => a.seats - b.seats || a.id.localeCompare(b.id));

  return {
    ok: true,
    data: {
      date,
      time,
      guests_count: guests,
      zone_preference: zone,
      available_tables: available.map((table) => ({
        table_id: table.id,
        zone: table.zone,
        seats: table.seats,
      })),
    },
    focusZone: zone,
    suggestedTableIds: available.map((table) => table.id),
  };
}

function reservationCode(random: () => number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) suffix += alphabet[Math.floor(random() * alphabet.length)];
  return `KE-${suffix}`;
}

function createReservation(args: Record<string, unknown>, snapshot: DomainSnapshot, random: () => number): ToolOutcome {
  const guestName = String(args.guest_name ?? "").trim();
  const guestPhone = String(args.guest_phone ?? "").trim();
  const date = String(args.date ?? "");
  const time = String(args.time ?? "");
  const guests = Number(args.guests_count);
  const tableId = String(args.table_id ?? "");
  const visitError = validateVisit(date, time, guests, snapshot.now ?? new Date());
  if (visitError) return { ok: false, error: visitError };
  if (guestName.length < 2) return { ok: false, error: "Нужно имя гостя." };
  const digits = guestPhone.replace(/\D/g, "");
  if (digits.length < 10) return { ok: false, error: "Телефон должен содержать не меньше 10 цифр." };
  const table = TABLES.find((item) => item.id === tableId);
  if (!table) return { ok: false, error: `Стол ${tableId} не найден.` };
  if (table.seats < guests) return { ok: false, error: `У стола ${tableId} только ${table.seats} мест.` };
  if (!tableIsFree(table.id, date, time, snapshot.reservations)) {
    return { ok: false, error: `Стол ${tableId} уже занят в это окно. Выберите другой.` };
  }
  const requestedIds = Array.isArray(args.pre_order_dish_ids) ? args.pre_order_dish_ids.map(String) : [];
  const preOrderDishIds = requestedIds.filter((id) => MENU.some((dish) => dish.id === id));
  const reservation: Reservation = {
    code: reservationCode(random),
    guestName,
    guestPhone,
    date,
    time,
    guestsCount: guests,
    tableId: table.id,
    zone: table.zone,
    specialRequests: args.special_requests ? String(args.special_requests) : undefined,
    preOrderDishIds,
    createdAt: Date.now(),
  };
  return {
    ok: true,
    data: {
      status: "confirmed",
      reservation_code: reservation.code,
      guest_name: reservation.guestName,
      guest_phone: reservation.guestPhone,
      date,
      time,
      guests_count: guests,
      table_id: table.id,
      zone: table.zone,
      pre_order_dish_ids: preOrderDishIds,
      ticket: `Посадочный талон ${reservation.code}. Стол ${table.id}, ${table.zone}.`,
    },
    reservations: [...snapshot.reservations, reservation],
    focusZone: table.zone,
    reservedTableId: table.id,
  };
}

function handoffToManager(args: Record<string, unknown>): ToolOutcome {
  const topic = String(args.topic ?? "").trim();
  return {
    ok: true,
    data: {
      status: "escalated",
      topic: topic || "вне зоны консьержа",
      manager_name: RESTAURANT.managerName,
      manager_phone: RESTAURANT.managerPhone,
      hours: RESTAURANT.hours,
      message: `Передала вопрос менеджеру зала ${RESTAURANT.managerName}: ${RESTAURANT.managerPhone}. На связи ${RESTAURANT.hours}. Я остаюсь на бронировании, подборе блюд и составе.`,
    },
  };
}

function trackOrder(args: Record<string, unknown>, snapshot: DomainSnapshot): ToolOutcome {
  const orderId = String(args.order_id ?? "").trim().toUpperCase();
  const issue = String(args.issue_type ?? "");
  const action = args.resolution_action === undefined ? "NONE" : String(args.resolution_action);
  if (!/^KE-\d{4}$/.test(orderId)) return { ok: false, error: "Номер заказа нужен в формате KE-XXXX." };
  const issues = new Set(["STATUS_CHECK", "LATE_DELIVERY", "WRONG_TEMPERATURE", "MISSING_ITEM", "SPICE_MISMATCH"]);
  const actions = new Set(["NONE", "ISSUE_PROMO_CODE", "REDISPATCH_COURIER", "FULL_REFUND_REQUEST"]);
  if (!issues.has(issue)) return { ok: false, error: "Неизвестный тип обращения." };
  if (!actions.has(action)) return { ok: false, error: "Неизвестное действие." };
  const current = snapshot.orders.find((order) => order.id === orderId);
  if (!current) return { ok: false, error: `Заказ ${orderId} не найден.` };

  const next: DeliveryOrder = { ...current };
  let promo: string | undefined;
  if (action === "ISSUE_PROMO_CODE") {
    promo = `EMBER-${orderId.slice(-4)}`;
    next.promoCode = promo;
  } else if (action === "REDISPATCH_COURIER") {
    next.status = "Курьер выехал повторно";
    next.etaMinutes = 25;
  } else if (action === "FULL_REFUND_REQUEST") {
    next.refundTicket = `RF-${orderId}`;
    next.status = "Заявка на возврат принята";
  }

  return {
    ok: true,
    data: {
      order_id: orderId,
      issue_type: issue,
      resolution_action: action,
      status: next.status,
      eta_minutes: next.etaMinutes,
      items: next.items,
      courier: next.courier,
      promo_code: promo ?? next.promoCode ?? null,
      refund_ticket: next.refundTicket ?? null,
    },
    orders: snapshot.orders.map((order) => (order.id === orderId ? next : order)),
  };
}

export function executeTool(
  name: string,
  args: unknown,
  snapshot: DomainSnapshot,
  random: () => number = Math.random,
): ToolOutcome {
  const record = asRecord(args);
  switch (name) {
    case "search_pan_asian_menu":
      return searchMenuTool(record);
    case "get_sommelier_pairing":
      return pairingTool(record);
    case "check_table_availability":
      return checkTables(record, snapshot);
    case "create_reservation":
      return createReservation(record, snapshot, random);
    case "handoff_to_manager":
      return handoffToManager(record);
    case "track_or_resolve_order_issue":
      return trackOrder(record, snapshot);
    default:
      return { ok: false, error: `Инструмент ${name} не подключён.` };
  }
}

export function initialOrders(): DeliveryOrder[] {
  return SEED_ORDERS.map((order) => ({ ...order }));
}

export const FUNCTION_DECLARATIONS = [
  {
    name: "search_pan_asian_menu",
    description:
      "Поиск и фильтрация блюд из меню ресторана KITSUNE & EMBER по категории, уровню остроты, диетическим тегам, исключенным аллергенам и максимальной цене.",
    parameters: {
      type: "OBJECT",
      properties: {
        category: {
          type: "STRING",
          enum: ["ALL", "RAW_CRUDO", "DIM_SUM_BAO", "ROBATA_WOK", "RAMEN_LAKSA", "DESSERTS"],
          description: "Категория блюд паназиатского меню.",
        },
        max_spice_level: {
          type: "INTEGER",
          description: "Максимально допустимый уровень остроты по шкале от 0 (совсем не остро) до 5 (экстремально остро).",
        },
        dietary_tags: {
          type: "ARRAY",
          items: { type: "STRING", enum: ["vegan", "gluten_free", "halal", "keto", "high_umami"] },
          description: "Обязательные диетические свойства блюда.",
        },
        excluded_allergens: {
          type: "ARRAY",
          items: { type: "STRING", enum: ["peanuts", "shellfish", "soy", "sesame", "lactose", "egg", "gluten"] },
          description: "Список аллергенов, которые должны полностью отсутствовать в составе.",
        },
        max_price: { type: "NUMBER", description: "Максимальная стоимость одного блюда в рублях." },
        query: {
          type: "STRING",
          description: "Фрагмент названия или ингредиента, если гость спрашивает конкретное блюдо или его состав.",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "get_sommelier_pairing",
    description:
      "Подбор идеального напитка (саке, авторский коктейль, ферментированный чай или безалкогольный эликсир) к списку выбранных блюд с учетом баланса умами, кислотности и остроты.",
    parameters: {
      type: "OBJECT",
      properties: {
        dish_ids: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Массив идентификаторов блюд.",
        },
        beverage_category: {
          type: "STRING",
          enum: ["ANY", "SAKE_SOJU", "SIGNATURE_COCKTAIL", "ARTISAN_TEA", "ZERO_PROOF"],
          description: "Предпочтительная категория напитка.",
        },
        alcohol_free: { type: "BOOLEAN", description: "Флаг строго безалкогольного подбора." },
      },
      required: ["dish_ids", "alcohol_free"],
    },
  },
  {
    name: "check_table_availability",
    description:
      "Проверяет наличие свободных столов в выбранной зоне ресторана на указанную дату, время и количество гостей, а также подсвечивает зону на интерактивной карте лендинга.",
    parameters: {
      type: "OBJECT",
      properties: {
        date: { type: "STRING", description: "Дата визита в формате YYYY-MM-DD." },
        time: { type: "STRING", description: "Время визита в формате HH:MM." },
        guests_count: { type: "INTEGER", description: "Количество гостей (от 1 до 12)." },
        zone_preference: {
          type: "STRING",
          enum: ["ANY", "Main Hall", "Teppanyaki Counter", "Chef's Omakase Table", "VIP Tatami Room", "Summer Bamboo Terrace"],
          description: "Предпочтительная зона посадки в ресторане.",
        },
      },
      required: ["date", "time", "guests_count"],
    },
  },
  {
    name: "create_reservation",
    description: "Создает подтвержденную бронь стола в ресторане KITSUNE & EMBER и генерирует цифровой посадочный талон с кодом бронирования.",
    parameters: {
      type: "OBJECT",
      properties: {
        guest_name: { type: "STRING", description: "Имя гостя." },
        guest_phone: { type: "STRING", description: "Контактный телефон гостя." },
        date: { type: "STRING", description: "Дата бронирования YYYY-MM-DD." },
        time: { type: "STRING", description: "Время бронирования HH:MM." },
        guests_count: { type: "INTEGER", description: "Число гостей." },
        table_id: { type: "STRING", description: "Идентификатор конкретного стола, например TEP-02." },
        special_requests: { type: "STRING", description: "Особые пожелания." },
        pre_order_dish_ids: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Опциональный список ID блюд для предварительного заказа.",
        },
      },
      required: ["guest_name", "guest_phone", "date", "time", "guests_count", "table_id"],
    },
  },
  {
    name: "handoff_to_manager",
    description:
      "Передаёт вопрос живому менеджеру зала, если он не про бронирование, подбор блюд или состав позиций меню. Вызывай вместо ответа по существу.",
    parameters: {
      type: "OBJECT",
      properties: {
        topic: { type: "STRING", description: "Короткая тема вопроса гостя, без пересказа оскорблений и посторонних просьб." },
      },
      required: ["topic"],
    },
  },
];
