import { useCallback, useState } from "react";
import { TERRITORIES_SEED, defaultTerritoryName } from "../territoriesData";
import type { TerritoryMetric, TerritoryRecord } from "../types";

const STORAGE_KEY = "territories-v1";

type Store = Record<string, TerritoryRecord>;

function genId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `m_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

/** Build the initial store from the seed file, then overlay anything saved locally. */
function buildInitial(): Store {
	const store: Store = {};
	for (const s of TERRITORIES_SEED) {
		store[s.id] = {
			id: s.id,
			name: s.name ?? defaultTerritoryName(s.id),
			description: s.description,
			metrics: (s.metrics ?? []).map((m) => ({ id: genId(), ...m }))
		};
	}
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) Object.assign(store, JSON.parse(saved) as Store);
	} catch {
		/* ignore corrupt storage */
	}
	return store;
}

function persist(store: Store) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
	} catch {
		/* storage may be unavailable */
	}
}

export interface TerritoriesApi {
	getTerritory: (id: string) => TerritoryRecord;
	addMetric: (id: string, metric: { name: string; value: string }) => void;
	removeMetric: (id: string, metricId: string) => void;
}

/**
 * Frontend-only territory store: seeded from territoriesData.ts, persisted to
 * localStorage so added metrics survive reloads. No backend involved.
 */
export function useTerritories(): TerritoriesApi {
	const [store, setStore] = useState<Store>(buildInitial);

	const getTerritory = useCallback(
		(id: string): TerritoryRecord =>
			store[id] ?? { id, name: defaultTerritoryName(id), metrics: [] },
		[store]
	);

	const update = useCallback((id: string, fn: (rec: TerritoryRecord) => TerritoryRecord) => {
		setStore((prev) => {
			const current = prev[id] ?? { id, name: defaultTerritoryName(id), metrics: [] };
			const next = { ...prev, [id]: fn(current) };
			persist(next);
			return next;
		});
	}, []);

	const addMetric = useCallback(
		(id: string, metric: { name: string; value: string }) => {
			const m: TerritoryMetric = { id: genId(), name: metric.name.trim(), value: metric.value.trim() };
			update(id, (rec) => ({ ...rec, metrics: [...rec.metrics, m] }));
		},
		[update]
	);

	const removeMetric = useCallback(
		(id: string, metricId: string) => {
			update(id, (rec) => ({ ...rec, metrics: rec.metrics.filter((m) => m.id !== metricId) }));
		},
		[update]
	);

	return { getTerritory, addMetric, removeMetric };
}
