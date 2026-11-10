import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import styled from "styled-components";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Dropdown from "@/components/common/Dropdown";
import { RampLegend } from "@/components/common/Legend";
import MapLayout, { InfoList, MapBox } from "@/components/site/common/MapLayout";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { CONCEPT_LABELS } from "@/utils/mock/concepts";
import { cssVar, fmt, GAP_RAMP, prefersReducedMotion, RAMP, scoreBin } from "@/utils/helpers/format";

const BOUNDS = [[40.355, 49.8], [40.425, 49.905]];
const gapBin = (g) => (g < 15 ? 0 : g < 30 ? 1 : g < 45 ? 2 : 3);
const clamp = (v) => Math.max(0, Math.min(1, v));

const LAYERS = [
  ["barriers", "Keçidsiz magistral, 350 m-dən uzun", "--critical", false],
  ["underpasses", "Yeraltı keçidlər (qırmızı: top 15)", "--accent", true],
  ["metro", "Metro (qırıq xətt: tikilir)", "--primary", true],
  ["exits", "Metro çıxışları", "--primary", false],
  ["buslines", "BakuBus marşrutları", "--primary", false],
  ["busstops", "BakuBus dayanacaqları", "--primary", false],
  ["bike", "Velosiped zolaqları və parkinq", "--good", false],
  ["pedestrian", "Piyada küçələri", "--accent", true],
  ["parks", "Parklar", "--park", true],
  ["crossings", "Zebra keçidlər", "--text-2", false],
  ["schools", "Məktəb, bağça, xəstəxana", "--warn", false],
];

// Seul ssenarisi: peykdə zebrası olmayan top-15 namizədin hücrəsinə +2 zebra, yeraltı cəriməsi azalır
const seoulBoost = (cells, underpasses) => {
  const cands = underpasses.features.filter((f) => f.properties.candidate && f.properties.sat !== "zebra_nearby");
  const out = new Map();
  cells.features.forEach((f, i) => {
    const ring = f.geometry.coordinates[0];
    const [x0, y0] = ring[0];
    const [x1, y1] = ring[2];
    const hits = cands.filter((c) => {
      const [x, y] = c.geometry.coordinates;
      return x >= x0 && x < x1 && y >= y0 && y < y1;
    }).length;
    if (!hits) return;
    const p = f.properties;
    const cross = 20 * clamp((p.cross + 2 * hits) / 8) - 20 * clamp(p.cross / 8);
    const under = 10 * clamp(p.under / 2) - 10 * clamp(Math.max(0, p.under - hits) / 2);
    out.set(i, Math.round(Math.max(0, Math.min(100, p.score + cross + under))));
  });
  return { boost: out, cands };
};

const WalkMap = ({ d, focus }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, minZoom: 12 });
  const dark = useColorScheme();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(() => {
    const c = params.get("c");
    return c && (c === "gap" || CONCEPT_LABELS[c]) ? c : "score";
  });
  const [on, setOn] = useState(() => Object.fromEntries(LAYERS.map(([k, , , def]) => [k, def])));
  const [seoul, setSeoul] = useState(false);
  const [cell, setCell] = useState(null);
  const groups = useRef({});

  const { boost, cands } = useMemo(() => seoulBoost(d.walk, d.underpasses), [d.walk, d.underpasses]);
  const scoreOf = (i, p) => (seoul && boost.has(i) ? boost.get(i) : p.score);
  const mean = useMemo(() => {
    const fs = d.walk.features;
    return fs.reduce((t, f, i) => t + (seoul && boost.has(i) ? boost.get(i) : f.properties.score), 0) / fs.length;
  }, [d.walk, seoul, boost]);

  // Baza qatları (bir dəfə)
  useEffect(() => {
    if (!map) return undefined;
    const base = [
      L.geoJSON(d.roads, { style: (f) => { const major = ["motorway", "trunk", "primary"].includes(f.properties.cls); return { renderer, color: cssVar(major ? "--road-major" : "--road"), weight: major ? 2.4 : f.properties.cls === "secondary" ? 1.6 : 1, opacity: 0.9, interactive: false }; } }),
      L.geoJSON(d.coast, { style: () => ({ renderer, color: cssVar("--coast"), weight: 3, interactive: false }) }),
      L.geoJSON(d.oldcity, { style: () => ({ renderer, color: cssVar("--accent"), weight: 1.5, dashArray: "4 3", fillOpacity: 0, interactive: false }) }),
    ];
    const ride = Object.fromEntries(d.summary.stations.map((s) => [s.name, s.ride_2026]));
    const busMax = Math.max(1, ...d.busLines.features.map((f) => f.properties.daily || 0));
    const satTxt = { no_zebra: "Peyk: yerüstü zebra yoxdur", zebra_nearby: "Peyk: yaxınlıqda zebra var", unclear: "Peyk: aydın deyil" };
    groups.current = {
      parks: L.geoJSON(d.parks, { style: () => ({ renderer, color: cssVar("--park"), fillColor: cssVar("--park"), fillOpacity: 0.75, weight: 0.5, interactive: false }) }),
      pedestrian: L.geoJSON(d.pedestrian, {
        style: (f) => { const p = f.properties; const bad = p.check === "likely_outdated"; const unsure = p.check === "uncertain" || (p.stale && !p.check); const col = cssVar(bad ? "--text-3" : "--accent"); return { renderer, color: col, weight: p.kind === "footway" ? 2.5 : 3.5, opacity: bad || unsure ? 0.65 : 0.95, dashArray: bad || unsure ? "3 4" : null, fillColor: col, fillOpacity: bad ? 0.15 : 0.35 }; },
        onEachFeature: (f, l) => l.bindTooltip(`${f.properties.name || "Adsız piyada sahəsi"} · OSM: ${f.properties.updated || "?"}`, { sticky: true }),
      }),
      barriers: L.geoJSON(d.barriers, { style: () => ({ renderer, color: cssVar("--critical"), weight: 4, opacity: 0.8 }), onEachFeature: (f, l) => l.bindTooltip(`${f.properties.name || "Adsız magistral"} · ${fmt(f.properties.len_m)} m keçidsiz`, { sticky: true }) }),
      crossings: L.geoJSON(d.crossings, { pointToLayer: (f, ll) => L.circleMarker(ll, { renderer, radius: 1.8, stroke: false, fillColor: cssVar(f.properties.signals ? "--good" : "--text-2"), fillOpacity: 0.85, interactive: false }) }),
      schools: L.geoJSON(d.schools, { pointToLayer: (f, ll) => L.circleMarker(ll, { renderer, radius: 3, color: cssVar("--panel"), weight: 1, fillColor: cssVar("--warn"), fillOpacity: 1 }).bindTooltip(f.properties.name || "") }),
      buslines: L.geoJSON(d.busLines, { style: (f) => ({ renderer, color: cssVar("--primary"), opacity: f.properties.daily ? 0.35 + (0.5 * f.properties.daily) / busMax : 0.25, weight: f.properties.daily ? 1 + (4 * f.properties.daily) / busMax : 1 }), onEachFeature: (f, l) => l.bindTooltip(`Marşrut ${f.properties.route}${f.properties.daily ? ` · gündə ${fmt(f.properties.daily)}` : ""}`, { sticky: true }) }),
      busstops: L.geoJSON(d.busStops, { pointToLayer: (f, ll) => L.circleMarker(ll, { renderer, radius: 2.5, color: cssVar("--panel"), weight: 0.8, fillColor: cssVar("--primary"), fillOpacity: 1 }).bindTooltip(f.properties.name) }),
      exits: L.geoJSON(d.exits, { pointToLayer: (f, ll) => L.circleMarker(ll, { renderer, radius: 3.5, color: cssVar("--primary"), weight: 1.5, fillColor: cssVar("--primary"), fillOpacity: 1 }).bindTooltip(`${f.properties.station}: ${f.properties.exit}`) }),
      bike: L.layerGroup([
        L.geoJSON(d.bikeLanes, { style: () => ({ renderer, color: cssVar("--good"), weight: 3, opacity: 0.9 }) }),
        L.geoJSON(d.bikeParking, { pointToLayer: (f, ll) => L.circleMarker(ll, { renderer, radius: 2, stroke: false, fillColor: cssVar("--good"), fillOpacity: 0.9, interactive: false }) }),
      ]),
      underpasses: L.geoJSON(d.underpasses, {
        pointToLayer: (f, ll) => {
          const p = f.properties;
          const near = p.sat === "zebra_nearby";
          return L.circleMarker(ll, { renderer, radius: p.candidate ? 7 : 4, color: cssVar(near ? "--accent" : "--panel"), weight: 2, fillColor: p.candidate ? cssVar(near ? "--panel" : "--accent") : cssVar("--text-3"), fillOpacity: 1 })
            .bindPopup(`<strong>${p.candidate ? `#${p.rank} yerüstü keçid namizədi` : "Yeraltı keçid"}</strong><br>${p.road || `${p.metro} yaxınlığı`}<br>Prioritet: <b>${p.priority}</b>/100<br>400 m-də məktəb/xəstəxana: <b>${p.poi_400m}</b>${p.sat ? `<br><b>${satTxt[p.sat]}</b>` : ""}${p.flood != null ? `<br>Leysanda su basma riski: <b>${p.flood_cls}</b> (${p.flood}/100)` : ""}`);
        },
      }),
      metro: L.geoJSON(d.metro, {
        pointToLayer: (f, ll) => {
          const live = f.properties.status === "işləyir";
          const r = ride[f.properties.name];
          return L.circleMarker(ll, { renderer, radius: 6, color: cssVar("--primary"), weight: 2.5, fillColor: cssVar(live ? "--panel" : "--primary-soft"), fillOpacity: 1, dashArray: live ? null : "2 2" })
            .bindTooltip(`Ⓜ ${f.properties.name}${r ? ` · gündə ${fmt(r)} sərnişin` : ""}`, { direction: "top", offset: [0, -6] });
        },
      }),
    };
    base.forEach((l) => l.addTo(map));
    return () => {
      base.forEach((l) => map.removeLayer(l));
      Object.values(groups.current).forEach((l) => map.removeLayer(l));
    };
  }, [map, renderer, d, dark]);

  // Qatların açılıb-bağlanması (sıra saxlanılır)
  useEffect(() => {
    if (!map || !groups.current.metro) return;
    LAYERS.map(([k]) => k).reverse().forEach((k) => {
      const g = groups.current[k];
      if (on[k] && !map.hasLayer(g)) g.addTo(map);
      if (!on[k] && map.hasLayer(g)) map.removeLayer(g);
    });
    ["pedestrian", "barriers", "crossings", "schools", "busstops", "underpasses", "exits", "metro"].forEach((k) => on[k] && groups.current[k].bringToFront?.());
  }, [map, on, dark, d]);

  // Hücrələr
  useEffect(() => {
    if (!map) return undefined;
    const color = (i, p) => {
      if (mode === "gap") {
        const g = Math.max(0, p.demand - scoreOf(i, p));
        return g < 5 ? null : cssVar(GAP_RAMP[gapBin(g)]);
      }
      if (mode === "score") return cssVar(RAMP[scoreBin(scoreOf(i, p))]);
      const v = p[`c_${mode}`];
      return v == null ? null : cssVar(RAMP[scoreBin(v)]);
    };
    const layer = L.geoJSON(d.walk, {
      style: (f) => {
        const i = d.walk.features.indexOf(f);
        const c = color(i, f.properties);
        return { renderer, stroke: false, fillColor: c || "transparent", fillOpacity: c ? 0.72 : 0 };
      },
      onEachFeature: (f, l) => l.on("click", () => setCell({ i: d.walk.features.indexOf(f), p: f.properties })),
    });
    layer.addTo(map);
    layer.bringToBack();
    return () => map.removeLayer(layer);
    // scoreOf seoul və boost-dan asılıdır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, renderer, d.walk, mode, seoul, boost, dark]);

  useEffect(() => {
    if (map && focus) {
      map.flyTo([focus.lat, focus.lon], 16, { duration: prefersReducedMotion() ? 0 : 0.8 });
      if (focus.html) L.popup().setLatLng([focus.lat, focus.lon]).setContent(focus.html).openOn(map);
    }
  }, [map, focus]);

  const toggleSeoul = () => {
    const next = !seoul;
    setSeoul(next);
    if (next && map) {
      setOn((o) => ({ ...o, underpasses: true }));
      map.flyToBounds(L.latLngBounds(cands.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]])).pad(0.2), { duration: prefersReducedMotion() ? 0 : 0.8 });
    }
  };

  const touched = [...boost.entries()];
  const localBefore = touched.reduce((t, [i]) => t + d.walk.features[i].properties.score, 0) / (touched.length || 1);
  const localAfter = touched.reduce((t, [, s]) => t + s, 0) / (touched.length || 1);
  const modeOptions = [
    { value: "score", label: "Piyada indeksi" },
    { value: "gap", label: "Boşluq: tələb − indeks" },
    { group: "29 anlayış", options: Object.keys(CONCEPT_LABELS).filter((k) => k !== "score" && k !== "demand").map((k) => ({ value: k, label: CONCEPT_LABELS[k] })) },
  ];

  return (
    <MapLayout
      map={<MapBox ref={ref} $h={620} $bg="var(--land)" role="region" aria-label="Bakı mərkəzinin interaktiv xəritəsi" />}
      side={
        <>
          <Card>
            <Dropdown id="walk-mode" label="Hücrələri rənglə" value={mode} onChange={setMode} options={modeOptions} />
            <div style={{ marginTop: 12 }}>
              {mode === "gap" ? (
                <GapLegend />
              ) : (
                <RampLegend title={mode === "score" ? "Piyada indeksi, 0–100" : `${CONCEPT_LABELS[mode]}, 0–100`} labels={["0", "20", "30", "40", "50", "60", "70+"]} />
              )}
            </div>
          </Card>
          <Card title="Qatlar">
            <Layers>
              {LAYERS.map(([k, label, color]) => (
                <label key={k}>
                  <input type="checkbox" checked={on[k]} onChange={(e) => setOn((o) => ({ ...o, [k]: e.target.checked }))} />
                  <i style={{ background: cssVar(color) }} />
                  {label}
                </label>
              ))}
            </Layers>
          </Card>
          <Card title="Ssenari: Seul modeli">
            <Small>Peykdə zebrası olmayan 10 prioritet yeraltı keçidin yanında yerüstü zebra açılır, indeks yenidən hesablanır.</Small>
            <Button full variant={seoul ? "danger" : "primary"} onClick={toggleSeoul} aria-pressed={seoul}>
              {seoul ? "Ssenarini ləğv et" : "Ssenarini tətbiq et"}
            </Button>
            <Delta>
              Orta indeks: <b>{mean.toFixed(1)}</b>
              {seoul && (
                <>
                  <br />
                  Toxunulan {touched.length} hücrədə: <b>{localBefore.toFixed(0)} → {localAfter.toFixed(0)}</b>
                </>
              )}
            </Delta>
          </Card>
          <Card title="Seçilmiş hücrə">
            {!cell ? (
              <Small>Xəritədə hücrəyə klikləyin.</Small>
            ) : (
              <InfoList>
                <dt>Piyada indeksi</dt>
                <dd>{scoreOf(cell.i, cell.p)}</dd>
                <dt>Tələb</dt>
                <dd>{cell.p.demand}</dd>
                <dt>Zebra / yeraltı</dt>
                <dd>{cell.p.cross} / {cell.p.under}</dd>
                <dt>Avtobus dayanacağı</dt>
                <dd>{cell.p.bus}</dd>
                <dt>Magistral, m</dt>
                <dd>{fmt(cell.p.major_m)}</dd>
                <dt>Metroya, m</dt>
                <dd>{fmt(cell.p.metro_m)}</dd>
                <dt>Parka, m</dt>
                <dd>{fmt(cell.p.park_m)}</dd>
                {Object.keys(CONCEPT_LABELS).filter((k) => cell.p[`c_${k}`] !== undefined).map((k) => (
                  <Pair key={k} a={CONCEPT_LABELS[k]} b={cell.p[`c_${k}`] ?? "–"} />
                ))}
              </InfoList>
            )}
          </Card>
        </>
      }
    />
  );
};

const Pair = ({ a, b }) => (
  <>
    <dt>{a}</dt>
    <dd>{b}</dd>
  </>
);

const GapLegend = () => (
  <div>
    <h4 style={{ fontSize: 13, marginBottom: 8 }}>Boşluq (tələb − indeks)</h4>
    <div style={{ display: "flex", height: 10, borderRadius: 3, overflow: "hidden" }}>
      {GAP_RAMP.map((v) => (
        <i key={v} style={{ flex: 1, background: cssVar(v) }} />
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontFamily: "var(--font-semibold)", color: "var(--text-3)", marginTop: 4 }}>
      <span>5</span>
      <span>15</span>
      <span>30</span>
      <span>45+</span>
    </div>
  </div>
);

export default WalkMap;

const Layers = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
  }
  input {
    accent-color: var(--primary);
  }
  i {
    width: 14px;
    height: 10px;
    border-radius: 2px;
    flex: none;
  }
`;

const Small = styled.p`
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 10px;
`;

const Delta = styled.p`
  margin-top: 10px;
  font-family: var(--font-semibold);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  color: var(--text-2);
  b {
    font-family: var(--font-bold);
    font-size: 20px;
    letter-spacing: -0.02em;
    color: var(--accent);
  }
`;
