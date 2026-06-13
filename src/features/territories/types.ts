// Territory analytics data — stored entirely on the frontend (no backend).

export interface TerritoryMetric {
	id: string;
	name: string; // e.g. "Площадь застройки"
	value: string; // e.g. "15 Га"
}

export interface TerritoryRecord {
	id: string; // territory code, e.g. "MQ-0007"
	name: string; // e.g. "Территория №7"
	description?: string;
	metrics: TerritoryMetric[];
}

/** Seed entry — only the fields you want to predefine; metrics optional. */
export interface TerritorySeed {
	id: string;
	name?: string;
	description?: string;
	metrics?: Omit<TerritoryMetric, "id">[];
}
