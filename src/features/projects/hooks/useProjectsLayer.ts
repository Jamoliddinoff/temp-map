import { useEffect, useRef } from "react";
import { destroyMapGLObject } from "../../../utils/mapgl";
import { featureCenter, featureParts } from "../../../shared/lib/geo";
import { LABEL_MIN_ZOOM, MISMATCH_STROKE, SELECTED_STYLE, statusStyle } from "../projectsConfig";
import type { ProjectCollection, ProjectFeature } from "../types";

// 2GIS MapGL JS API is untyped; `any` is unavoidable for the map/object handles.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapglObject = any;

interface Options {
	selectedId: string | null;
	onSelect: (feature: ProjectFeature) => void;
}

/**
 * Draws each project polygon (color by status, mismatch highlighted) plus an
 * MQ label, wires click->select, and keeps a separate highlight layer for the
 * currently selected feature.
 */
export function useProjectsLayer(map: MapglObject | null, data: ProjectCollection | null, opts: Options) {
	const onSelectRef = useRef(opts.onSelect);
	useEffect(() => {
		onSelectRef.current = opts.onSelect;
	});

	// Base polygons + labels
	useEffect(() => {
		if (!map || !data || !window.mapgl) return;
		const objects: MapglObject[] = [];

		for (const feature of data.features) {
			const style = statusStyle(feature.properties.status);
			const stroke = feature.properties.area_mismatch ? MISMATCH_STROKE : style.stroke;
			for (const part of featureParts(feature)) {
				try {
					const poly = new window.mapgl.Polygon(map, {
						coordinates: part,
						color: style.fill,
						strokeColor: stroke,
						strokeWidth: 2,
						zIndex: 1,
						interactive: true
					});
					poly.on?.("click", () => onSelectRef.current(feature));
					objects.push(poly);
				} catch (e) {
					console.warn("Projects polygon error:", e);
				}
			}
			try {
				objects.push(
					new window.mapgl.Label(map, {
						coordinates: featureCenter(feature),
						text: feature.properties.name,
						color: "#1E3A8A",
						fontSize: 12,
						haloColor: "#ffffff",
						haloRadius: 1.5,
						minZoom: LABEL_MIN_ZOOM,
						zIndex: 3
					})
				);
			} catch {
				/* labels are optional */
			}
		}

		return () => objects.forEach(destroyMapGLObject);
	}, [map, data]);

	// Highlight layer for the selected feature (drawn on top)
	useEffect(() => {
		if (!map || !data || !window.mapgl) return;
		const feature = data.features.find((f) => f.properties.id === opts.selectedId);
		if (!feature) return;
		const highlights: MapglObject[] = [];
		for (const part of featureParts(feature)) {
			try {
				highlights.push(
					new window.mapgl.Polygon(map, {
						coordinates: part,
						color: SELECTED_STYLE.fill,
						strokeColor: SELECTED_STYLE.stroke,
						strokeWidth: SELECTED_STYLE.strokeWidth,
						zIndex: 5,
						interactive: false
					})
				);
			} catch {
				/* noop */
			}
		}
		return () => highlights.forEach(destroyMapGLObject);
	}, [map, data, opts.selectedId]);
}
