import lookupData from "./uzbekistan-geojson.json";

// MultiPolygon coordinates: [polygon][ring][point][lng, lat]
export const UZ_COORDINATES: [number, number][][][] = lookupData[0].geojson
	.coordinates as [number, number][][][];
