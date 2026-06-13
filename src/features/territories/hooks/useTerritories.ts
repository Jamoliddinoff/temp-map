import { useCallback, useState } from "react";
import { TERRITORIES_SEED, defaultTerritoryName } from "../territoriesData";
import type { TerritoryMetric, TerritoryRecord } from "../types";

// Only user metrics are persisted; names/descriptions always come from the
// seed file, so translations/edits there apply immediately.
const STORAGE_KEY = "territories-metrics-v1";

type MetricStore = Record<string, TerritoryMetric[]>;

function genId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `m_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

// Stable seed records (metric ids generated once at module load).
const SEED_RECORDS: Record<string, TerritoryRecord> = Object.fromEntries(
	TERRITORIES_SEED.map((s) => [
		s.id,
		{
			id: s.id,
			name: s.name ?? defaultTerritoryName(s.id),
			description: s.description,
			metrics: (s.metrics ?? []).map((m) => ({ id: genId(), ...m }))
		}
	])
);

function baseRecord(id: string): TerritoryRecord {
	return SEED_RECORDS[id] ?? { id, name: defaultTerritoryName(id), metrics: [] };
}

function loadOverrides(): MetricStore {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? (JSON.parse(saved) as MetricStore) : {};
	} catch {
		return {};
	}
}

function persist(store: MetricStore) {
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
 * Frontend-only territory store: names/descriptions from territoriesData.ts,
 * user-added metrics persisted to localStorage. No backend involved.
 */
export function useTerritories(): TerritoriesApi {
	const [overrides, setOverrides] = useState<MetricStore>(loadOverrides);

	const getTerritory = useCallback(
		(id: string): TerritoryRecord => {
			const base = baseRecord(id);
			return overrides[id] ? { ...base, metrics: overrides[id] } : base;
		},
		[overrides]
	);

	const setMetrics = useCallback((id: string, fn: (current: TerritoryMetric[]) => TerritoryMetric[]) => {
		setOverrides((prev) => {
			const current = prev[id] ?? baseRecord(id).metrics;
			const next = { ...prev, [id]: fn(current) };
			persist(next);
			return next;
		});
	}, []);

	const addMetric = useCallback(
		(id: string, metric: { name: string; value: string }) => {
			const m: TerritoryMetric = { id: genId(), name: metric.name.trim(), value: metric.value.trim() };
			setMetrics(id, (current) => [...current, m]);
		},
		[setMetrics]
	);

	const removeMetric = useCallback(
		(id: string, metricId: string) => {
			setMetrics(id, (current) => current.filter((m) => m.id !== metricId));
		},
		[setMetrics]
	);

	return { getTerritory, addMetric, removeMetric };
}
