import { useMemo, useState } from "react";
import type { ProjectFeature } from "../types";

interface Props {
	features: ProjectFeature[];
	onPick: (feature: ProjectFeature) => void;
}

/** Search projects by MQ id / name; picking one flies the map to it. */
export default function ProjectSearch({ features, onPick }: Props) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);

	const matches = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return features.filter((f) => f.properties.name.toLowerCase().includes(q)).slice(0, 8);
	}, [features, query]);

	return (
		<div style={S.wrap}>
			<input
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => setTimeout(() => setOpen(false), 150)}
				placeholder="MQ рақами бўйича қидириш…"
				aria-label="Лойиҳани қидириш"
				style={S.input}
			/>
			{open && matches.length > 0 && (
				<ul style={S.list}>
					{matches.map((f) => (
						<li key={f.properties.id}>
							<button
								type="button"
								style={S.item}
								onMouseDown={() => {
									onPick(f);
									setQuery(f.properties.name);
									setOpen(false);
								}}
							>
								<span style={S.itemName}>{f.properties.name}</span>
								<span style={S.itemMeta}>{f.properties.area_test_ha ?? "—"} Га</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

const S = {
	wrap: { position: "absolute", top: 12, left: 86, zIndex: 1000, width: 220 } as React.CSSProperties,
	input: {
		width: "100%",
		height: 34,
		padding: "0 12px",
		border: "none",
		borderRadius: 8,
		background: "rgba(255,255,255,0.97)",
		boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
		fontSize: 13,
		color: "#374151",
		outline: "none"
	} as React.CSSProperties,
	list: {
		listStyle: "none",
		margin: "6px 0 0",
		padding: 4,
		background: "#fff",
		borderRadius: 8,
		boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
		maxHeight: 280,
		overflowY: "auto"
	} as React.CSSProperties,
	item: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
		padding: "8px 10px",
		border: "none",
		background: "transparent",
		cursor: "pointer",
		borderRadius: 6,
		fontSize: 13
	} as React.CSSProperties,
	itemName: { fontWeight: 600, color: "#111827" } as React.CSSProperties,
	itemMeta: { color: "#6B7280", fontSize: 12 } as React.CSSProperties
};
