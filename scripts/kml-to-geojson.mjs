// KML -> GeoJSON converter + geometry validator/fixer (dependency-free, Node 18+ ESM)
//
// Usage:
//   node scripts/kml-to-geojson.mjs <input.kml> [output.geojson]
//
// Defaults:
//   input  = public/data/projects.kml
//   output = public/data/projects.geojson
//   report = public/data/validation-report.json  (always written next to output)
//
// What it does:
//   1. Parses KML Placemarks (name, description attributes, MultiGeometry/Polygon).
//   2. Validates geometry: unclosed rings, self-intersection, wrong winding,
//      duplicate features (by id and by geometry), overlapping polygons.
//   3. FIXES: closes rings, enforces RFC 7946 winding (exterior CCW, holes CW),
//      drops exact duplicate features, normalizes attributes (comma -> dot decimals).
//   4. Computes geodesic area (m2 / ha) per feature.
//   5. Writes a clean RFC 7946 GeoJSON FeatureCollection + a JSON validation report.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const inputPath = process.argv[2] ?? 'public/data/projects.kml';
const outputPath = process.argv[3] ?? 'public/data/projects.geojson';
const reportPath = join(dirname(outputPath), 'validation-report.json');

// ---------------------------------------------------------------------------
// KML parsing (regex-based; the source KML has a flat, regular structure)
// ---------------------------------------------------------------------------

function parseKML(xml) {
  const placemarks = [];
  const pmRe = /<Placemark\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/Placemark>/g;
  let m;
  while ((m = pmRe.exec(xml))) {
    const [, kmlId, body] = m;
    const name = (body.match(/<name>([\s\S]*?)<\/name>/) ?? [])[1]?.trim() ?? null;
    const description = (body.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ?? [])[1] ?? '';
    const attrs = parseDescriptionAttrs(description);

    // Collect every <Polygon> -> outer ring + inner rings (holes).
    const polygons = [];
    const polyRe = /<Polygon\b[\s\S]*?<\/Polygon>/g;
    let pm;
    while ((pm = polyRe.exec(body))) {
      const poly = pm[0];
      const outer = parseRing((poly.match(/<outerBoundaryIs>\s*<LinearRing>\s*<coordinates>([\s\S]*?)<\/coordinates>/) ?? [])[1]);
      const holes = [];
      const holeRe = /<innerBoundaryIs>\s*<LinearRing>\s*<coordinates>([\s\S]*?)<\/coordinates>/g;
      let hm;
      while ((hm = holeRe.exec(poly))) holes.push(parseRing(hm[1]));
      if (outer.length) polygons.push([outer, ...holes]);
    }
    placemarks.push({ kmlId, name, attrs, polygons });
  }
  return placemarks;
}

function parseRing(text) {
  if (!text) return [];
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const [lng, lat] = t.split(',').map(Number);
      return [lng, lat]; // drop altitude
    })
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
}

// Extract the 4 known fields from the description HTML table.
function parseDescriptionAttrs(html) {
  const cell = (label) => {
    const re = new RegExp(`<td>\\s*${label}\\s*<\\/td>\\s*<td>([\\s\\S]*?)<\\/td>`, 'i');
    const v = (html.match(re) ?? [])[1];
    return v == null ? null : v.replace(/<[^>]+>/g, '').trim();
  };
  return {
    tartibRaqam: cell("Tartib raqam"),
    committeeId: cell("ID raqam \\(Qo'mita\\)"),
    yerMaydoni: cell('Yer maydoni'),
    maydonTest: cell('Maydon test'),
  };
}

const num = (v) => (v == null || v === '' ? null : Number(String(v).replace(/\s/g, '').replace(',', '.')));

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const EARTH_R = 6378137; // m
const rad = (d) => (d * Math.PI) / 180;

function ringClosed(ring) {
  if (ring.length < 4) return false;
  const a = ring[0];
  const b = ring[ring.length - 1];
  return a[0] === b[0] && a[1] === b[1];
}
function closeRing(ring) {
  if (!ringClosed(ring)) return [...ring, [...ring[0]]];
  return ring;
}

// Signed planar area (shoelace) on lng/lat: >0 == CCW.
function signedArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}
const isCCW = (ring) => signedArea(ring) > 0;

// Geodesic ring area in m^2 (absolute), spherical excess approximation.
function geodesicArea(ring) {
  let total = 0;
  const n = ring.length;
  if (n < 4) return 0;
  for (let i = 0; i < n - 1; i++) {
    const [lo1, la1] = ring[i];
    const [lo2, la2] = ring[i + 1];
    total += rad(lo2 - lo1) * (2 + Math.sin(rad(la1)) + Math.sin(rad(la2)));
  }
  return Math.abs((total * EARTH_R * EARTH_R) / 2);
}

// Segment intersection (proper crossing), used for self-intersection + overlap.
function ccw(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function segmentsCross(p1, p2, p3, p4) {
  const d1 = ccw(p3, p4, p1);
  const d2 = ccw(p3, p4, p2);
  const d3 = ccw(p1, p2, p3);
  const d4 = ccw(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Detect self-intersection among non-adjacent edges of a single ring.
function selfIntersects(ring) {
  const n = ring.length - 1; // last == first
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i || Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === n - 1) continue; // adjacent through the closing point
      if (segmentsCross(ring[i], ring[i + 1], ring[j], ring[j + 1])) return true;
    }
  }
  return false;
}

function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const hit = yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}
function bbox(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}
const bboxOverlap = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

// Two outer rings overlap if their edges cross or one contains a vertex of the other.
function ringsOverlap(r1, r2) {
  if (!bboxOverlap(bbox(r1), bbox(r2))) return false;
  for (let i = 0; i < r1.length - 1; i++)
    for (let j = 0; j < r2.length - 1; j++)
      if (segmentsCross(r1[i], r1[i + 1], r2[j], r2[j + 1])) return true;
  if (pointInRing(r1[0], r2) || pointInRing(r2[0], r1)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

const xml = readFileSync(inputPath, 'utf8');
const placemarks = parseKML(xml);

const report = {
  source: inputPath,
  parsedAt: null, // set by caller if desired; avoided here for determinism
  totalPlacemarks: placemarks.length,
  issues: { unclosed: [], selfIntersecting: [], rewound: [], duplicateIds: [], duplicateGeometry: [], overlaps: [], attributeMismatch: [] },
  features: [],
};

const seenIds = new Map();
const geomSignatures = new Map();
const features = [];

for (const pm of placemarks) {
  const id = pm.attrs.committeeId || pm.name || pm.kmlId;

  // duplicate id
  if (seenIds.has(id)) report.issues.duplicateIds.push({ id, kmlIds: [seenIds.get(id), pm.kmlId] });
  else seenIds.set(id, pm.kmlId);

  const fixedPolys = [];
  for (const poly of pm.polygons) {
    const rings = poly.map((ring, idx) => {
      let r = closeRing(ring);
      if (!ringClosed(ring)) report.issues.unclosed.push({ id, ring: idx });
      if (selfIntersects(r)) report.issues.selfIntersecting.push({ id, ring: idx });
      // RFC 7946: exterior CCW, holes CW
      const wantCCW = idx === 0;
      if (isCCW(r) !== wantCCW) {
        r = [...r].reverse();
        report.issues.rewound.push({ id, ring: idx, to: wantCCW ? 'CCW' : 'CW' });
      }
      return r;
    });
    fixedPolys.push(rings);
  }

  // geometry duplicate signature (rounded outer ring of first polygon)
  const sig = fixedPolys.length
    ? JSON.stringify(fixedPolys[0][0].map(([x, y]) => [x.toFixed(7), y.toFixed(7)]))
    : '';
  if (sig && geomSignatures.has(sig)) {
    report.issues.duplicateGeometry.push({ id, sameAs: geomSignatures.get(sig) });
    continue; // drop exact geometric duplicate
  }
  if (sig) geomSignatures.set(sig, id);

  // attributes
  const yer = num(pm.attrs.yerMaydoni);
  const test = num(pm.attrs.maydonTest);
  if (yer != null && test != null && Math.abs(yer - test) > 0.05) {
    report.issues.attributeMismatch.push({ id, yerMaydoni: yer, maydonTest: test });
  }

  // computed area (sum outer - holes) in m2/ha
  let area = 0;
  for (const rings of fixedPolys) {
    area += geodesicArea(rings[0]);
    for (let h = 1; h < rings.length; h++) area -= geodesicArea(rings[h]);
  }

  const geometry =
    fixedPolys.length === 1
      ? { type: 'Polygon', coordinates: fixedPolys[0] }
      : { type: 'MultiPolygon', coordinates: fixedPolys };

  features.push({
    type: 'Feature',
    id,
    geometry,
    properties: {
      id,                                   // MQ-XXXX (committee id)
      name: pm.name ?? id,                  // display name
      type: 'project',                      // single source layer -> one type for now
      status: 'active',                     // default; refine when statuses are known
      order_no: num(pm.attrs.tartibRaqam),  // Tartib raqam
      area_declared_ha: yer,                // Yer maydoni
      area_test_ha: test,                   // Maydon test
      area_computed_ha: +(area / 10000).toFixed(2),
      area_mismatch: yer != null && test != null && Math.abs(yer - test) > 0.05,
      created_at: null,                     // not present in source
      source_kml_id: pm.kmlId,
    },
  });
}

// pairwise overlap among final features (outer rings of all polygons)
const outerRingsOf = (f) =>
  f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map((p) => p[0]);
for (let i = 0; i < features.length; i++) {
  for (let j = i + 1; j < features.length; j++) {
    const ri = outerRingsOf(features[i]);
    const rj = outerRingsOf(features[j]);
    let hit = false;
    for (const a of ri) for (const b of rj) if (ringsOverlap(a, b)) { hit = true; break; }
    if (hit) report.issues.overlaps.push({ a: features[i].id, b: features[j].id });
  }
}

report.features = features.map((f) => ({ id: f.id, type: f.geometry.type, area_computed_ha: f.properties.area_computed_ha }));
report.summary = {
  output_features: features.length,
  unclosed: report.issues.unclosed.length,
  self_intersecting: report.issues.selfIntersecting.length,
  rewound: report.issues.rewound.length,
  duplicate_ids: report.issues.duplicateIds.length,
  duplicate_geometry: report.issues.duplicateGeometry.length,
  overlaps: report.issues.overlaps.length,
  attribute_mismatch: report.issues.attributeMismatch.length,
};

const fc = { type: 'FeatureCollection', features };
writeFileSync(outputPath, JSON.stringify(fc, null, 2));
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('--- KML -> GeoJSON ---');
console.log('input :', inputPath);
console.log('output:', outputPath, `(${features.length} features)`);
console.log('report:', reportPath);
console.log('summary:', report.summary);
