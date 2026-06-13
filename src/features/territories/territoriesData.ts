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
		name: "Ҳудуд №7",
		description: "Кўп функцияли қурилиш зонаси, шимоли-шарқий сектор.",
		metrics: [
			{ name: "Қурилиш майдони", value: "15 Га" },
			{ name: "Қаватлилик", value: "16 қаватгача" },
			{ name: "Тайинланиши", value: "Турар-жой / тижорат" }
		]
	},
	{
		id: "MQ-0005",
		name: "Ҳудуд №5",
		description: "Шарқий йўналишдаги йирик режалаштириш участкаси.",
		metrics: [
			{ name: "Қурилиш зичлиги", value: "32 %" },
			{ name: "Яшил ҳудудлар", value: "48 Га" }
		]
	},
	{
		id: "MQ-0001",
		name: "Ҳудуд №1",
		description: "Бош режанинг асосий участкаси."
	}
];

/** Default human name for a territory code, e.g. "MQ-0007" -> "Ҳудуд №7". */
export function defaultTerritoryName(id: string): string {
	const n = Number(id.replace(/\D/g, ""));
	return Number.isFinite(n) && n > 0 ? `Ҳудуд №${n}` : id;
}
