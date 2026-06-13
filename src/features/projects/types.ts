// Domain types for project boundary polygons (parsed from projects.geojson).

export type ProjectStatus = "planned" | "active" | "done";

export interface ProjectProperties {
	id: string;
	name: string;
	type: string;
	status: ProjectStatus;
	order_no: number | null;
	area_declared_ha: number | null;
	area_test_ha: number | null;
	area_computed_ha: number | null;
	area_mismatch: boolean;
	created_at: string | null;
	source_kml_id: string;
}

export type Position = [number, number]; // [lng, lat]
export type Ring = Position[];

export interface PolygonGeometry {
	type: "Polygon";
	coordinates: Ring[]; // [outer, ...holes]
}
export interface MultiPolygonGeometry {
	type: "MultiPolygon";
	coordinates: Ring[][]; // [part][ring]
}

export interface ProjectFeature {
	type: "Feature";
	id: string;
	geometry: PolygonGeometry | MultiPolygonGeometry;
	properties: ProjectProperties;
}

export interface ProjectCollection {
	type: "FeatureCollection";
	features: ProjectFeature[];
}
