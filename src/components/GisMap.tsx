import { useCallback, useEffect, useRef, useState } from "react";
import {
	MAPGL_API_KEY,
	MAPGL_STYLE_SATELLITE,
	loadMapGlScript,
	destroyMapGLObject
} from "../utils/mapgl";
import { UZ_COORDINATES } from "../constants/uzbekistanBoundary";

// Tashkent center [lng, lat]
const UZ_CENTER: [number, number] = [69.279, 41.319];

/**
 * Simple full-screen 2GIS map in satellite (sputnik) mode.
 * Everything outside Uzbekistan is masked by a world polygon whose holes
 * are the UZ region rings, so only the country stays visible.
 */
export default function GisMap() {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<any>(null);

	const [is3D, setIs3D] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let destroyed = false;
		const maskRef = { current: null as any };

		const createMap = () => {
			if (destroyed || mapRef.current || !containerRef.current || !window.mapgl) return;
			const { offsetWidth, offsetHeight } = containerRef.current;
			if (offsetWidth === 0 || offsetHeight === 0) return;

			const map = new window.mapgl.Map(containerRef.current, {
				center: UZ_CENTER,
				zoom: 5.5,
				pitch: 0,
				rotation: 0,
				key: MAPGL_API_KEY,
				style: MAPGL_STYLE_SATELLITE,
				zoomControl: "bottomRight"
			});
			mapRef.current = map;

			// Hide the spinner once the map finishes its first render.
			const finishLoading = () => {
				if (!destroyed) setIsLoading(false);
			};
			try {
				map.once?.("idle", finishLoading);
			} catch {
				/* noop */
			}
			// Fallback in case the "idle" event never fires
			setTimeout(finishLoading, 5000);

			// Double rAF ensures browser finishes layout/paint before resize()
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					try {
						map.resize?.();
					} catch {
						/* noop */
					}
				});
			});

			// Uzbekistan border mask — world polygon with UZ regions as holes
			try {
				const worldRing: [number, number][] = [
					[-180, -90],
					[180, -90],
					[180, 90],
					[-180, 90],
					[-180, -90]
				];
				const holes = UZ_COORDINATES.map((poly) => poly[0] as [number, number][]);
				maskRef.current = new window.mapgl.Polygon(map, {
					id: "uzbekistan-mask",
					coordinates: [worldRing, ...holes],
					color: "rgba(0,0,0,0.2)",
					strokeColor: "rgba(0,0,0,0)",
					strokeWidth: 0.3
				});
			} catch (e) {
				console.warn("2GIS UzbekistanMask error:", e);
			}
		};

		loadMapGlScript()
			.then(createMap)
			.catch((err) => console.error("2GIS load error:", err));

		// rAF-deduplicated ResizeObserver: at most 1 resize() per paint cycle
		let raf = 0;
		const ro = new ResizeObserver(() => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				try {
					mapRef.current?.resize?.();
				} catch {
					/* noop */
				}
			});
		});
		if (containerRef.current) ro.observe(containerRef.current);

		return () => {
			destroyed = true;
			ro.disconnect();
			cancelAnimationFrame(raf);
			destroyMapGLObject(maskRef.current);
			destroyMapGLObject(mapRef.current);
			mapRef.current = null;
		};
	}, []);

	// 3D on/off: tilt the camera (pitch). Reset rotation when going flat.
	const handle3DToggle = useCallback(() => {
		const map = mapRef.current;
		if (!map) return;
		setIs3D((prev) => {
			const next = !prev;
			map.setPitch(next ? 45 : 0);
			if (!next) map.setRotation(0);
			return next;
		});
	}, []);

	// Satellite (sputnik) on/off: swap the base style.

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				width: "100vw",
				height: "100vh",
				background: "#0b0f14"
			}}
		>
			<div ref={containerRef} style={{ width: "100%", height: "100%" }} />

			{/* Loading spinner — shown until the map's first render */}
			{isLoading && (
				<div style={S.spinnerOverlay}>
					<div style={S.spinner} />
					<style>{"@keyframes krt-spin{to{transform:rotate(360deg)}}"}</style>
				</div>
			)}

			{/* Control buttons (top-left) */}
			<div style={S.controls}>
				<button
					type="button"
					title={is3D ? "Переключить в 2D" : "Переключить в 3D"}
					onClick={handle3DToggle}
					style={{ ...S.ctrlBtn, ...(is3D ? S.ctrlBtnActive : null) }}
				>
					{is3D ? "2D" : "3D"}
				</button>
			</div>
		</div>
	);
}

const S = {
	controls: {
		position: "absolute",
		top: 12,
		left: 12,
		zIndex: 1000,
		display: "flex",
		flexDirection: "column",
		gap: 6
	} as React.CSSProperties,

	ctrlBtn: {
		minWidth: 64,
		height: 34,
		padding: "0 12px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: "rgba(255,255,255,0.97)",
		border: "none",
		borderRadius: 8,
		boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
		cursor: "pointer",
		color: "#374151",
		fontSize: 13,
		fontWeight: 600,
		backdropFilter: "blur(6px)",
		transition: "background 0.15s, color 0.15s"
	} as React.CSSProperties,

	ctrlBtnActive: {
		background: "#2563eb",
		color: "#fff"
	} as React.CSSProperties,

	spinnerOverlay: {
		position: "absolute",
		inset: 0,
		zIndex: 1100,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: "#0b0f14"
	} as React.CSSProperties,

	spinner: {
		width: 44,
		height: 44,
		borderRadius: "50%",
		border: "4px solid rgba(255,255,255,0.2)",
		borderTopColor: "#2563eb",
		animation: "krt-spin 0.8s linear infinite"
	} as React.CSSProperties
};
