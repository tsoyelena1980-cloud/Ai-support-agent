import { RESTAURANT } from "@/domain/catalog";

export type ScopeDecision =
  | { action: "answer"; topic: "booking" | "menu" | "composition" | "visit" | "greeting" }
  | { action: "handoff"; reason: "off_topic" | "complaint" | "inappropriate" };

const INAPPROPRIATE =
  /(игнорируй\s+(все\s+)?инструкц|system prompt|jailbreak|ты теперь|забудь правила|наркот|суицид|как убить|порно|секс|интимн)/i;

const COMPLAINT =
  /(доставк|курьер|возврат|верните деньги|промокод|жалоб|претенз|отравил|испорчен|остыл|не довез|мой заказ|статус заказа|номер заказа|где заказ|соедини(те)? с (менеджер|человек|оператор)|позови (менеджер|человек)|живой (менеджер|оператор))/i;

const OFF_TOPIC =
  /(напиши (код|скрипт|программ|реферат|сочинен|стих)|python|javascript|домашн\w* задан|политик|президент|крипт|биткоин|инвестиц|погод|футбол|новост|юрист|адвокат|ваканси|зарплат|увол|диагноз|антибиотик|как похудеть)/i;

const BOOKING =
  /(?<![а-яё])(брон\w*|заброн\w*|резерв\w*|стол(?!б|иц)|посадк\w*|гост(ь|я|ей|ю|е|ям|ями)?(?![а-яё])|татами|террас\w*|теппан\w*|омакасе|хостес|на двоих|на троих)/i;

const MENU =
  /(меню|блюд\w*|подобра\w*|посовету\w*|рекоменд\w*|острот\w*|аллерг\w*|веган\w*|халяль|кето|рамен|сашими|вагю|хамачи|димсам\w*|сяолун\w*|бао|лакс\w*|тофу|десерт\w*|треск\w*|краб\w*|кунжут|мисо|пейринг|саке|сётю|напит\w*|вино|коктейл|предзаказ|(?<![а-яё])чай(?![а-яё]))/i;

const COMPOSITION = /(состав|ингредиент|из чего|что вход|калор|содержит)/i;

const VISIT = /(адрес|как добрать|где вы|часы работ|до скольки|режим работ|дресс|парковк|телефон)/i;

const GREETING = /^(привет|здравствуй(те)?|добрый (день|вечер)|доброе утро|хай|hello|hi)[!.?\s]*$/i;

export function managerRedirectText(): string {
  return `Я отвечаю на бронирование, подбор блюд и их состав. Этот вопрос передаю менеджеру зала — ${RESTAURANT.managerName}, ${RESTAURANT.managerPhone}. На связи ${RESTAURANT.hours}.`;
}

export function classifyGuestMessage(text: string): ScopeDecision {
  const trimmed = text.trim();
  if (!trimmed) return { action: "answer", topic: "greeting" };
  if (INAPPROPRIATE.test(trimmed)) return { action: "handoff", reason: "inappropriate" };
  if (COMPLAINT.test(trimmed)) return { action: "handoff", reason: "complaint" };
  if (BOOKING.test(trimmed)) return { action: "answer", topic: "booking" };
  if (COMPOSITION.test(trimmed)) return { action: "answer", topic: "composition" };
  if (MENU.test(trimmed)) return { action: "answer", topic: "menu" };
  if (VISIT.test(trimmed)) return { action: "answer", topic: "visit" };
  if (GREETING.test(trimmed)) return { action: "answer", topic: "greeting" };
  if (OFF_TOPIC.test(trimmed) || trimmed.length > 80) return { action: "handoff", reason: "off_topic" };
  return { action: "answer", topic: "greeting" };
}
