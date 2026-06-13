import type { TerritorySeed } from "./types";

/**
 * Frontend-only territory dataset. Add or edit entries here — anything not
 * listed gets a sensible default (name derived from the MQ code, no metrics),
 * so the map keeps working without an entry for every polygon.
 *
 * Shape per the agreed structure:
 *   { id, name, metrics: [{ name, value }] }
 */
export const TERRITORIES_SEED: TerritorySeed[] = [
	{
		id: "MQ-0007",
		name: "Территория №7",
		description: "Многофункциональная зона застройки, северо-восточный сектор.",
		metrics: [
			{ name: "Площадь застройки", value: "15 Га" },
			{ name: "Этажность", value: "до 16 этажей" },
			{ name: "Назначение", value: "Жилое / коммерческое" }
		]
	},
	{
		id: "MQ-0005",
		name: "Территория №5",
		description: "Крупный планировочный участок восточного направления.",
		metrics: [
			{ name: "Плотность застройки", value: "32 %" },
			{ name: "Зелёные зоны", value: "48 Га" }
		]
	},
	{
		id: "MQ-0001",
		name: "Территория №1",
		description: "Базовый участок генерального плана."
	}
];

/** Default human name for a territory code, e.g. "MQ-0007" -> "Территория №7". */
export function defaultTerritoryName(id: string): string {
	const n = Number(id.replace(/\D/g, ""));
	return Number.isFinite(n) && n > 0 ? `Территория №${n}` : id;
}
