/**
 * Minimal 2GIS MapGL JS API helpers — just what the simple map needs.
 */

declare global {
	interface Window {
		mapgl: any;
	}
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const MAPGL_API_KEY = "75903a50-bc33-49ad-9ee3-288f7a81d90c";
export const MAPGL_SCRIPT_URL = "https://mapgl.2gis.com/api/js/v1";
/** Immersive 3D style (default schema map) */
export const MAPGL_STYLE_IMMERSIVE = "8780eed4-0428-4982-b615-aa6cf04d8f5f";
/** Satellite imagery style (sputnik) */
export const MAPGL_STYLE_SATELLITE = "c080bb6a-8134-4993-93a1-5b4d8c36a59b";

// ── Script loader (idempotent) ────────────────────────────────────────────────

let _scriptPromise: Promise<void> | null = null;

export function loadMapGlScript(): Promise<void> {
	if (window.mapgl) return Promise.resolve();
	if (_scriptPromise) return _scriptPromise;

	_scriptPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			`script[src="${MAPGL_SCRIPT_URL}"]`
		);
		if (existing) {
			existing.addEventListener("load", () => resolve());
			existing.addEventListener("error", reject);
			return;
		}
		const script = document.createElement("script");
		script.src = MAPGL_SCRIPT_URL;
		script.onload = () => resolve();
		script.onerror = (e) => {
			_scriptPromise = null;
			reject(e);
		};
		document.head.appendChild(script);
	});

	return _scriptPromise;
}

/** Safely destroy a 2GIS object (Polygon, Map, etc.). */
export function destroyMapGLObject(obj: any): void {
	try {
		obj?.destroy();
	} catch {
		/* noop */
	}
}
