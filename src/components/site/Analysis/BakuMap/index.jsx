import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import styled from "styled-components";
import Card from "@/components/common/Card";
import Dropdown from "@/components/common/Dropdown";
import { RampLegend } from "@/components/common/Legend";
import MapLayout, { InfoList, MapBox } from "@/components/site/common/MapLayout";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { BAKU_META, BAKU_METRICS, BAKU_SOURCES } from "@/utils/mock/baku";
import { binColor, cssVar, fmt, fmtN, quantileBreaks } from "@/utils/helpers/format";

const BOUNDS = [[40.18, 49.45], [40.62, 50.45]];

const PS_COLOR = { park: "--good", square: "--accent", playground: "--warn", beach: "--serious" };
const PS_LABEL = { park: "Park və bağ", square: "Meydan, piyada sahəsi", playground: "Oyun meydançası", beach: "Çimərlik" };

const BakuMap = ({ rayons, grid, metric, onMetricChange, publicSpaces }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, maxZoom: 15, attribution: "© OpenStreetMap · WorldPop · Landsat · SRTM" });
  const dark = useColorScheme();
  const [info, setInfo] = useState(null);
  const meta = BAKU_META[metric];
  const isGrid = meta.level === "g";
  const key = isGrid ? metric.slice(2) : metric;

  const breaks = useMemo(() => {
    const feats = isGrid ? grid.features : rayons.features;
    return quantileBreaks(feats.map((f) => f.properties[key]));
  }, [isGrid, grid, rayons, key]);

  useEffect(() => {
    if (!map) return undefined;
    const layers = [];
    if (isGrid) {
      layers.push(
        L.geoJSON(grid, {
          style: (f) => ({ renderer, stroke: false, fillColor: binColor(f.properties[key], breaks), fillOpacity: f.properties[key] == null ? 0 : 0.64 }),
          onEachFeature: (f, l) => l.on("click", () => setInfo({ kind: "cell", p: f.properties })),
        }),
        L.geoJSON(rayons, { style: () => ({ renderer, color: cssVar("--text"), weight: 1.2, fill: false, opacity: 0.7 }), interactive: false }),
      );
    } else {
      layers.push(
        L.geoJSON(rayons, {
          style: (f) => ({ renderer, color: cssVar("--panel"), weight: 1.5, fillColor: binColor(f.properties[key], breaks), fillOpacity: f.properties[key] == null ? 0.05 : 0.7 }),
          onEachFeature: (f, l) => {
            l.bindTooltip(`${f.properties.rayon}: ${fmtN(f.properties[key])} ${meta.unit}`, { sticky: true });
            l.on("click", () => setInfo({ kind: "rayon", p: f.properties }));
          },
        }),
      );
    }
    // İctimai məkan mövzusunda real poliqonlar da göstərilir
    if (meta.theme === "İctimai məkan" && publicSpaces) {
      layers.push(
        L.geoJSON(publicSpaces, {
          style: (f) => ({ renderer, color: cssVar(PS_COLOR[f.properties.kind]), weight: 0.6, fillColor: cssVar(PS_COLOR[f.properties.kind]), fillOpacity: 0.85 }),
          onEachFeature: (f, l) => l.bindTooltip(`${f.properties.name || PS_LABEL[f.properties.kind]} · ${f.properties.ha} ha`, { sticky: true }),
        }),
      );
    }
    layers.forEach((l) => l.addTo(map));
    return () => layers.forEach((l) => map.removeLayer(l));
  }, [map, renderer, rayons, grid, isGrid, key, breaks, meta.unit, meta.theme, publicSpaces, dark]);

  const options = BAKU_METRICS.map(([theme, ms]) => ({ group: theme, options: ms.map(([value, label]) => ({ value, label })) }));

  return (
    <MapLayout
      map={<MapBox ref={ref} role="region" aria-label="Bakı rayonlarının tematik xəritəsi" />}
      side={
        <>
          <Card>
            <Dropdown id="baku-metric" label="Göstərici" value={metric} onChange={onMetricChange} options={options} />
            <LegendWrap>
              <RampLegend title={`${meta.label}, ${meta.unit}`} breaks={breaks} />
            </LegendWrap>
            <Src>
              Mənbə: {BAKU_SOURCES[key] || "WorldPop, OSM, Landsat, SRTM; 1 km hücrələr"}
              {isGrid ? "" : ". Siniflər kvantillərlə bölünüb (12 rayon)."}
            </Src>
          </Card>
          <Card title={info ? (info.kind === "rayon" ? `${info.p.rayon} rayonu` : `1 km hücrə · ${info.p.rayon || "–"}`) : "Rayon"}>
            {!info && <Hint>Xəritədə rayona və ya hücrəyə klikləyin.</Hint>}
            {info?.kind === "rayon" && <RayonInfo p={info.p} />}
            {info?.kind === "cell" && <CellInfo p={info.p} />}
          </Card>
        </>
      }
    />
  );
};

const RayonInfo = ({ p }) => {
  const rows = [
    ["Əhali", fmt(p.pop)], ["Sahə", `${p.area_km2} km²`], ["Sıxlıq", `${fmt(p.density)} /km²`], ["Metro stansiyası", p.metro_st],
    ["Metro sərnişini/gün", fmt(p.metro_ride)], ["Dayanacağa 500 m", `${p.transit500_pct}%`], ["Kəsişmə/km²", p.intersections_km2],
    ["Dalan küçə", `${p.deadend_pct}%`], ["Obyekt/km²", p.poi_km2], ["Səth temp.", `${p.lst_mean} °C`], ["Yaşıl örtük", `${p.green_pct}%`],
    ["Dik ərazi", `${p.steep_pct}%`], ["Alçaq sahil", `${p.below_m20_pct}%`], ["Əlillik/1000", p.disabled_per1000 ?? "–"], ["Piyada indeksi", p.walk_score ?? "ölçülməyib"],
  ];
  return (
    <InfoList>
      {rows.map(([a, b]) => (
        <Row key={a} a={a} b={b} />
      ))}
    </InfoList>
  );
};

const CellInfo = ({ p }) => (
  <InfoList>
    <Row a="Əhali" b={fmt(p.pop)} />
    <Row a="Obyektlər" b={p.poi} />
    <Row a="Kəsişmələr" b={p.inter} />
    <Row a="Dayanacaqlar" b={p.stops} />
    <Row a="Səth temp." b={`${p.lst ?? "–"} °C`} />
    <Row a="NDVI" b={p.ndvi ?? "–"} />
    <Row a="Hündürlük" b={`${p.elev ?? "–"} m`} />
    <Row a="Meyl" b={`${p.slope ?? "–"}%`} />
  </InfoList>
);

const Row = ({ a, b }) => (
  <>
    <dt>{a}</dt>
    <dd>{b}</dd>
  </>
);

export default BakuMap;

const LegendWrap = styled.div`
  margin-top: 14px;
`;

const Src = styled.p`
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-3);
`;

const Hint = styled.p`
  font-size: 13px;
  color: var(--text-2);
`;
