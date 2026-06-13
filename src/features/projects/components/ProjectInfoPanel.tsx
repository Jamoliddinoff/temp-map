import { statusStyle } from "../projectsConfig";
import type { ProjectFeature } from "../types";

interface Props {
	feature: ProjectFeature;
	onClose: () => void;
}

const fmt = (v: number | null, unit = " га") => (v == null ? "—" : `${v}${unit}`);

/** Popup card for a selected project polygon. */
export default function ProjectInfoPanel({ feature, onClose }: Props) {
	const p = feature.properties;
	const s = statusStyle(p.status);

	return (
		<div style={S.panel}>
			<div style={S.header}>
				<span style={S.title}>{p.name}</span>
				<span style={{ ...S.badge, background: s.stroke }}>{s.label}</span>
				<button type="button" onClick={onClose} style={S.close} title="Закрыть" aria-label="Закрыть">
					×
				</button>
			</div>

			<div style={S.rows}>
				<Row label="№ п/п" value={p.order_no == null ? "—" : String(p.order_no)} />
				<Row label="Тип" value={feature.geometry.type === "MultiPolygon" ? "Мультиполигон" : "Полигон"} />
				<Row label="Площадь (факт)" value={fmt(p.area_test_ha)} />
				<Row label="Площадь (проект)" value={fmt(p.area_declared_ha)} />
				<Row label="Площадь (расчёт)" value={fmt(p.area_computed_ha)} />
				<Row
					label="Расхождение"
					value={p.area_mismatch ? "⚠ есть" : "нет"}
					valueColor={p.area_mismatch ? "#B91C1C" : "#15803D"}
				/>
			</div>
		</div>
	);
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
	return (
		<div style={S.row}>
			<span style={S.rowLabel}>{label}</span>
			<span style={{ ...S.rowValue, color: valueColor ?? "#111827" }}>{value}</span>
		</div>
	);
}

const S = {
	panel: {
		position: "absolute",
		top: 12,
		right: 12,
		zIndex: 1000,
		width: 260,
		background: "rgba(255,255,255,0.98)",
		borderRadius: 10,
		boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
		overflow: "hidden",
		fontSize: 13
	} as React.CSSProperties,
	header: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		padding: "10px 12px",
		background: "#F3F6FB",
		borderBottom: "1px solid #E5E7EB"
	} as React.CSSProperties,
	title: { fontWeight: 700, color: "#0F172A", fontSize: 14 } as React.CSSProperties,
	badge: {
		color: "#fff",
		fontSize: 11,
		fontWeight: 600,
		padding: "2px 8px",
		borderRadius: 999
	} as React.CSSProperties,
	close: {
		marginLeft: "auto",
		border: "none",
		background: "transparent",
		fontSize: 20,
		lineHeight: 1,
		cursor: "pointer",
		color: "#6B7280"
	} as React.CSSProperties,
	rows: { padding: "8px 12px 12px" } as React.CSSProperties,
	row: {
		display: "flex",
		justifyContent: "space-between",
		gap: 12,
		padding: "4px 0",
		borderBottom: "1px dashed #EEF1F4"
	} as React.CSSProperties,
	rowLabel: { color: "#6B7280" } as React.CSSProperties,
	rowValue: { fontWeight: 600 } as React.CSSProperties
};
