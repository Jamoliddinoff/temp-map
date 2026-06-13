import type { ProjectStatus } from "./types";

// Served from public/data/projects.geojson
export const PROJECTS_DATA_URL = "/data/projects.geojson";

// Show MQ labels only from this zoom up (avoids label clutter at country view).
export const LABEL_MIN_ZOOM = 12;
// Zoom applied when framing the whole projects extent.
export const PROJECTS_FIT_ZOOM = 10.3;

export interface StatusStyle {
	label: string;
	fill: string; // rgba fill for polygon
	stroke: string; // outline color
}

export const STATUS_STYLE: Record<ProjectStatus, StatusStyle> = {
	planned: { label: "Планируется", fill: "rgba(251,191,36,0.30)", stroke: "#B45309" },
	active: { label: "В работе", fill: "rgba(59,130,246,0.32)", stroke: "#1D4ED8" },
	done: { label: "Завершён", fill: "rgba(34,197,94,0.32)", stroke: "#15803D" }
};

export const SELECTED_STYLE = { fill: "rgba(59,130,246,0.55)", stroke: "#1E3A8A", strokeWidth: 4 };
export const MISMATCH_STROKE = "#EF4444"; // dashed-style highlight for disputed areas

export function statusStyle(status: ProjectStatus): StatusStyle {
	return STATUS_STYLE[status] ?? STATUS_STYLE.active;
}
