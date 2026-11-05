"use client";

import {
  ALLERGEN_LABELS,
  CATEGORY_LABELS,
  DIETARY_LABELS,
  MENU,
  type Allergen,
  type DietaryTag,
  type MenuCategory,
} from "@/domain/catalog";
import { EMPTY_FILTER, searchMenu, type MenuFilter } from "@/domain/tools";
import { rub } from "@/components/site-header";
import { useAgent } from "@/store/agent-store";
import { useRestaurant } from "@/store/restaurant-store";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Array<MenuCategory | "ALL">;
const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];
const DIETS = Object.keys(DIETARY_LABELS) as DietaryTag[];

export function MenuBoard() {
  const filter = useRestaurant((state) => state.filter);
  const highlighted = useRestaurant((state) => state.highlightedDishIds);
  const cartIds = useRestaurant((state) => state.cartIds);
  const setFilter = useRestaurant((state) => state.setFilter);
  const toggleCart = useRestaurant((state) => state.toggleCart);
  const send = useAgent((state) => state.send);
  const dishes = searchMenu(filter);

  function update(next: MenuFilter) {
    setFilter(next, []);
  }

  return (
    <section id="menu" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-saffron">Уголь и сырое</p>
          <h2 className="font-[family-name:var(--font-display)] text-5xl">Меню зала</h2>
        </div>
        <p className="measure text-sm text-muted">
          Кицунэ сужает витрину: найденные блюда отмечаются красной полосой слева.
        </p>
      </div>

      <div className="glass mb-6 flex flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => update({ ...filter, category })}
              className={`border px-3 py-1 text-sm ${filter.category === category ? "border-saffron text-saffron" : "border-[var(--border-ember)] text-muted"}`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          Острота до {filter.maxSpice}
          <input
            aria-label="Максимальная острота"
            type="range"
            min={0}
            max={5}
            value={filter.maxSpice}
            onChange={(event) => update({ ...filter, maxSpice: Number(event.target.value) })}
          />
        </label>
        <div className="flex flex-wrap gap-3 text-sm">
          {ALLERGENS.map((allergen) => (
            <label key={allergen} className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={filter.excludedAllergens.includes(allergen)}
                onChange={() => {
                  const excludedAllergens = filter.excludedAllergens.includes(allergen)
                    ? filter.excludedAllergens.filter((item) => item !== allergen)
                    : [...filter.excludedAllergens, allergen];
                  update({ ...filter, excludedAllergens });
                }}
              />
              без: {ALLERGEN_LABELS[allergen]}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {DIETS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={filter.dietaryTags.includes(tag)}
                onChange={() => {
                  const dietaryTags = filter.dietaryTags.includes(tag)
                    ? filter.dietaryTags.filter((item) => item !== tag)
                    : [...filter.dietaryTags, tag];
                  update({ ...filter, dietaryTags });
                }}
              />
              {DIETARY_LABELS[tag]}
            </label>
          ))}
          <label className="ml-auto flex items-center gap-2 text-muted">
            до
            <input
              aria-label="Максимальная цена"
              inputMode="numeric"
              value={filter.maxPrice ?? ""}
              placeholder="цена"
              className="w-24 border border-[var(--border-ember)] bg-transparent px-2 py-1 text-ivory"
              onChange={(event) => {
                const value = event.target.value.trim();
                update({ ...filter, maxPrice: value ? Number(value) : null });
              }}
            />
            ₽
          </label>
          <button type="button" className="text-saffron" onClick={() => update(EMPTY_FILTER)}>
            Сбросить
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {dishes.map((dish) => {
          const picked = highlighted.includes(dish.id);
          return (
            <article
              key={dish.id}
              className={picked ? "glass menu-found overflow-hidden" : "glass overflow-hidden"}
            >
              <img src={dish.image} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl leading-none">{dish.nameRu}</h3>
                  <span className="tabular text-saffron">{rub(dish.price)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{dish.nameAsian}</p>
                <p className="mt-2 text-sm text-ivory/90">{dish.description}</p>
                <p className="mt-1 text-xs text-muted">Состав: {dish.ingredients.join(", ")}</p>
                <p className="mt-2 text-xs text-muted">
                  {dish.weightGrams} г · {dish.kcal} ккал · острота {dish.spiceLevel}/5 · умами {dish.umamiIndex}/10
                </p>
                <p className="mt-1 text-xs text-muted">
                  Аллергены: {dish.allergens.map((item) => ALLERGEN_LABELS[item]).join(", ") || "нет"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="border border-jade px-3 py-1 text-sm text-jade" onClick={() => toggleCart(dish.id)}>
                    {cartIds.includes(dish.id) ? "В предзаказе" : "В предзаказ"}
                  </button>
                  <button
                    type="button"
                    className="border border-saffron px-3 py-1 text-sm text-saffron"
                    onClick={() =>
                      void send({
                        source: "sommelier",
                        text: `Подбери пейринг к блюду «${dish.nameRu}» (id: ${dish.id}). Острота ${dish.spiceLevel}, умами ${dish.umamiIndex}. Аллергены: ${dish.allergens.join(", ") || "нет"}. Дай алкогольный и безалкогольный вариант через get_sommelier_pairing.`,
                      })
                    }
                  >
                    Спросить AI-сомелье
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {dishes.length === 0 ? <p className="mt-6 text-muted">По этим фильтрам кухня молчит.</p> : null}
      <p className="mt-4 text-xs text-muted">В карте меню {MENU.length} позиций. Показано {dishes.length}.</p>
    </section>
  );
}
