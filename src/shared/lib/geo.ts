import type { Position, Ring, ProjectFeature, ProjectCollection } from "../../features/projects/types";

export type Bounds = { minLng: number; minLat: number; maxLng: number; maxLat: number };

/** All drawable parts of a feature, each part = [outerRing, ...holes]. */
export function featureParts(feature: ProjectFeature): Ring[][] {
	return feature.geometry.type === "Polygon"
		? [feature.geometry.coordinates]
		: feature.geometry.coordinates;
}

export function ringBounds(ring: Ring): Bounds {
	let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
	for (const [lng, lat] of ring) {
		if (lng < minLng) minLng = lng;
		if (lat < minLat) minLat = lat;
		if (lng > maxLng) maxLng = lng;
		if (lat > maxLat) maxLat = lat;
	}
	return { minLng, minLat, maxLng, maxLat };
}

export function featureBounds(feature: ProjectFeature): Bounds {
	const b: Bounds = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
	for (const part of featureParts(feature)) {
		const rb = ringBounds(part[0]);
		b.minLng = Math.min(b.minLng, rb.minLng);
		b.minLat = Math.min(b.minLat, rb.minLat);
		b.maxLng = Math.max(b.maxLng, rb.maxLng);
		b.maxLat = Math.max(b.maxLat, rb.maxLat);
	}
	return b;
}

export function collectionBounds(fc: ProjectCollection): Bounds | null {
	if (!fc.features.length) return null;
	const b: Bounds = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
	for (const f of fc.features) {
		const fb = featureBounds(f);
		b.minLng = Math.min(b.minLng, fb.minLng);
		b.minLat = Math.min(b.minLat, fb.minLat);
		b.maxLng = Math.max(b.maxLng, fb.maxLng);
		b.maxLat = Math.max(b.maxLat, fb.maxLat);
	}
	return b;
}

/** bbox center [lng, lat] — good enough for label/flyTo placement. */
export function featureCenter(feature: ProjectFeature): Position {
	const b = featureBounds(feature);
	return [(b.minLng + b.maxLng) / 2, (b.minLat + b.maxLat) / 2];
}

export function boundsCenter(b: Bounds): Position {
	return [(b.minLng + b.maxLng) / 2, (b.minLat + b.maxLat) / 2];
}
