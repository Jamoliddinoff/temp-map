import { MISMATCH_STROKE, STATUS_STYLE } from "../projectsConfig";
import type { ProjectStatus } from "../types";

interface Props {
	count: number;
	statuses: ProjectStatus[]; // statuses present in the data
}

/** Bottom-left legend: status colors + disputed-area marker + object count. */
export default function MapLegend({ count, statuses }: Props) {
	return (
		<div style={S.box}>
			<div style={S.title}>Проекты · {count}</div>
			{statuses.map((s) => (
				<Item key={s} color={STATUS_STYLE[s].stroke} fill={STATUS_STYLE[s].fill} label={STATUS_STYLE[s].label} />
			))}
			<Item color={MISMATCH_STROKE} fill="transparent" label="Расхождение площади" dashed />
		</div>
	);
}

function Item({ color, fill, label, dashed }: { color: string; fill: string; label: string; dashed?: boolean }) {
	return (
		<div style={S.row}>
			<span
				style={{
					...S.swatch,
					background: fill,
					border: `2px ${dashed ? "dashed" : "solid"} ${color}`
				}}
			/>
			<span>{label}</span>
		</div>
	);
}

const S = {
	box: {
		position: "absolute",
		left: 12,
		bottom: 12,
		zIndex: 1000,
		background: "rgba(255,255,255,0.97)",
		borderRadius: 10,
		boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
		padding: "10px 12px",
		fontSize: 12,
		color: "#374151",
		minWidth: 160
	} as React.CSSProperties,
	title: { fontWeight: 700, marginBottom: 6, color: "#0F172A" } as React.CSSProperties,
	row: { display: "flex", alignItems: "center", gap: 8, padding: "3px 0" } as React.CSSProperties,
	swatch: { width: 16, height: 16, borderRadius: 4, flex: "0 0 auto" } as React.CSSProperties
};
