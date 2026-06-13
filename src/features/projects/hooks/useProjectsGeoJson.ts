import { useEffect, useState } from "react";
import { PROJECTS_DATA_URL } from "../projectsConfig";
import type { ProjectCollection } from "../types";

interface State {
	data: ProjectCollection | null;
	loading: boolean;
	error: string | null;
}

/** Loads the cleaned project polygons from the static GeoJSON file. */
export function useProjectsGeoJson(): State {
	const [state, setState] = useState<State>({ data: null, loading: true, error: null });

	useEffect(() => {
		let alive = true;
		fetch(PROJECTS_DATA_URL)
			.then((r) => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				return r.json() as Promise<ProjectCollection>;
			})
			.then((data) => alive && setState({ data, loading: false, error: null }))
			.catch((e: unknown) =>
				alive && setState({ data: null, loading: false, error: String(e) })
			);
		return () => {
			alive = false;
		};
	}, []);

	return state;
}
