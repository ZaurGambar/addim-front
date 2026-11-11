import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import { AlertTriangle } from "lucide-react";
import Card from "@/components/common/Card";
import Tabs from "@/components/common/Tabs";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import { DataGrid } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import { CountUp } from "@/components/common/Motion";
import { RampLegend, SwatchLegend } from "@/components/common/Legend";
import MapLayout, { InfoList, MapBox } from "@/components/site/common/MapLayout";
import { card, table } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { binColor, cssVar, fmt, quantileBreaks } from "@/utils/helpers/format";

// 2GIS-dən toplanmış xam data: OSM ilə yan-yana
const BOUNDS = [[40.18, 49.45], [40.62, 50.45]];

const VIEWS = [
  { value: "poi", label: "Obyektlər · 2GIS", legend: "Kvadratda obyekt sayı" },
  { value: "poi_osm", label: "Obyektlər · OSM", legend: "Kvadratda obyekt sayı (eyni şkala)" },
  { value: "ratio", label: "Fərq", legend: "2GIS OSM-dən neçə dəfə çox tapıb" },
  { value: "stops", label: "Dayanacaqlar · 2GIS", legend: "Kvadratda dayanacaq sayı" },
  { value: "near", label: "Dayanacağa məsafə", legend: "Kvadratın ortasından ən yaxın dayanacağa, m" },
];
const RATIO_BINS = [
  [1, "--g1", "OSM-də daha çox və ya bərabər"],
  [2, "--s2", "1–2 dəfə"],
  [5, "--s4", "2–5 dəfə"],
  [10, "--s6", "5–10 dəfə"],
  [Infinity, "--s7", "10 dəfədən çox"],
];
const ratioOf = (p) => (p.poi_osm ? p.poi / p.poi_osm : p.poi ? Infinity : 1);
const ratioColor = (r) => cssVar(RATIO_BINS.find(([max]) => r <= max)[1]);
const ratioText = (p) => (p.poi_osm ? `${(p.poi / p.poi_osm).toFixed(1)}×` : p.poi ? "OSM-də 0" : "–");

const TwoGis = () => {
  const data = useGet("twogisCells", ENDPOINTS.TWOGIS_CELLS);
  const grid = useGet("bakuGrid", ENDPOINTS.BAKU_GRID);
  const ready = data.data && grid.data;

  const sum = useMemo(() => {
    if (!data.data) return null;
    const p = data.data.features.map((f) => f.properties);
    const both = p.filter((x) => x.near != null && x.near_osm != null);
    return {
      cells: p.length,
      grid: data.data.meta.grid,
      pop: p.reduce((a, x) => a + x.pop, 0),
      poi: p.reduce((a, x) => a + x.poi, 0),
      poi_osm: p.reduce((a, x) => a + x.poi_osm, 0),
      stops: p.reduce((a, x) => a + x.stops, 0),
      stops_osm: p.reduce((a, x) => a + x.stops_osm, 0),
      near: both.length ? Math.round(both.reduce((a, x) => a + x.near, 0) / both.length) : null,
      near_osm: both.length ? Math.round(both.reduce((a, x) => a + x.near_osm, 0) / both.length) : null,
    };
  }, [data.data]);

  const rayons = useMemo(() => {
    if (!data.data) return [];
    const m = new Map();
    data.data.features.forEach(({ properties: p }) => {
      const r = m.get(p.rayon) || { rayon: p.rayon, cells: 0, pop: 0, poi: 0, poi_osm: 0, stops: 0, stops_osm: 0 };
      r.cells += 1;
      r.pop += p.pop;
      r.poi += p.poi;
      r.poi_osm += p.poi_osm;
      r.stops += p.stops;
      r.stops_osm += p.stops_osm;
      m.set(p.rayon, r);
    });
    return [...m.values()].sort((a, b) => b.poi / Math.max(b.poi_osm, 1) - a.poi / Math.max(a.poi_osm, 1));
  }, [data.data]);

  return (
    <Section>
      <Helmet>
        <title>2GIS datası · SmartUrban Bakı</title>
        <meta name="description" content="2GIS-dən toplanmış obyekt və dayanacaq datası xəritədə, OpenStreetMap ilə müqayisədə." />
      </Helmet>
      <Container>
        <SectionHeading eyebrow="14 · Yeni data mənbəyi" title="2GIS datası xəritədə" lede="OSM-də Bakı üçün data azdır. 2GIS-dən hər 1 km² kvadrat üçün obyekt və dayanacaq sayını topladıq və OSM ilə müqayisə etdik." />
        <PageIntro
          art={<DataGrid />}
          answer="Eyni kvadratda 2GIS OSM-dən neçə obyekt və dayanacaq çox tapır? Bu səhifə bunu göstərir."
          steps={["Yuxarıda düymələrlə qatı seçin: 2GIS, OSM və ya fərq.", "Kvadrata klikləyin: iki mənbənin rəqəmləri yan-yana çıxacaq.", "Boz kvadratlar hələ toplanmayıb."]}
          idea="Data tam toplananda sintezin 2 qatı (xidmət və nəqliyyat) 2GIS ilə yenidən hesablanacaq."
        />
        {(data.isError || grid.isError) && <ErrorText />}
        {sum && (
          <Stats>
            <div>
              <b>
                <CountUp value={sum.cells} /> / {fmt(sum.grid)}
              </b>
              <span>kvadrat toplanıb · {fmt(sum.pop)} insan yaşayır</span>
            </div>
            <div>
              <b>
                <CountUp value={sum.poi / Math.max(sum.poi_osm, 1)} decimals={1} suffix="×" />
              </b>
              <span>
                daha çox obyekt: 2GIS {fmt(sum.poi)}, OSM {fmt(sum.poi_osm)}
              </span>
            </div>
            <div>
              <b>
                <CountUp value={sum.stops} />
              </b>
              <span>dayanacaq 2GIS-də · OSM-də {fmt(sum.stops_osm)}</span>
            </div>
            <div>
              <b>
                <CountUp value={sum.near} suffix=" m" />
              </b>
              <span>orta hesabla ən yaxın dayanacaq · OSM ilə {fmt(sum.near_osm)} m</span>
            </div>
          </Stats>
        )}
        {ready && <TwoGisMap data={data.data} grid={grid.data} />}
        {rayons.length > 0 && (
          <>
            <H2>Rayonlar üzrə</H2>
            <Note>Yalnız toplanmış kvadratlar. Sıra: 2GIS OSM-dən neçə dəfə çox obyekt tapıb.</Note>
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Rayon</th>
                    <th>Kvadrat</th>
                    <th>Əhali</th>
                    <th>Obyekt · 2GIS</th>
                    <th>Obyekt · OSM</th>
                    <th>Fərq</th>
                    <th>Dayanacaq · 2GIS</th>
                    <th>Dayanacaq · OSM</th>
                  </tr>
                </thead>
                <tbody>
                  {rayons.map((r) => (
                    <tr key={r.rayon}>
                      <td>{r.rayon}</td>
                      <td>{r.cells}</td>
                      <td>{fmt(r.pop)}</td>
                      <td>{fmt(r.poi)}</td>
                      <td>{fmt(r.poi_osm)}</td>
                      <td>
                        <b>{r.poi_osm ? `${(r.poi / r.poi_osm).toFixed(1)}×` : "–"}</b>
                      </td>
                      <td>{fmt(r.stops)}</td>
                      <td>{fmt(r.stops_osm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </>
        )}
        <Warn>
          <AlertTriangle size={18} />
          <p>
            Toplama yarımçıqdır: 2GIS demo açarı ~1000 sorğudan sonra bloklandı. İlk olaraq insan yaşayan kvadratlar toplanıb. Obyekt sayı 2GIS-də bütün təşkilatlardır (bir binada bir neçə filial ola
            bilər). Dayanacağa məsafə düz xətlə ölçülüb. Mənbə: 2GIS Catalog API, {data.data?.meta.date}.
          </p>
        </Warn>
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default TwoGis;

const TwoGisMap = ({ data, grid }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, maxZoom: 16, attribution: "2GIS · © OpenStreetMap" });
  const dark = useColorScheme();
  const [view, setView] = useState("poi");
  const [info, setInfo] = useState(null);
  const V = VIEWS.find((v) => v.value === view);
  const have = useMemo(() => new Set(data.features.map((f) => f.properties.id)), [data]);

  const breaks = useMemo(() => {
    const p = data.features.map((f) => f.properties);
    if (view === "poi" || view === "poi_osm") return quantileBreaks(p.flatMap((x) => [x.poi, x.poi_osm]).filter((v) => v > 0));
    if (view === "stops") return quantileBreaks(p.map((x) => x.stops).filter((v) => v > 0));
    if (view === "near") return quantileBreaks(p.map((x) => x.near));
    return [];
  }, [data, view]);

  // toplanmamış kvadratlar (boz)
  useEffect(() => {
    if (!map) return undefined;
    const g = L.geoJSON(grid, {
      filter: (f) => !have.has(f.properties.id) && (f.properties.pop > 0 || f.properties.poi > 0),
      style: () => ({ renderer, stroke: false, fillColor: cssVar("--text-3"), fillOpacity: 0.12 }),
      interactive: false,
    }).addTo(map);
    return () => map.removeLayer(g);
  }, [map, renderer, grid, have, dark]);

  useEffect(() => {
    if (!map) return undefined;
    const value = (p) => (view === "ratio" ? null : p[view]);
    const ink = cssVar("--text");
    const g = L.geoJSON(data, {
      style: (f) => {
        const p = f.properties;
        if (view === "ratio") return { renderer, stroke: false, fillColor: ratioColor(ratioOf(p)), fillOpacity: p.poi || p.poi_osm ? 0.7 : 0.08 };
        const v = value(p);
        const empty = v == null || (view !== "near" && v === 0);
        return { renderer, stroke: false, fillColor: empty ? cssVar("--text-3") : binColor(v, breaks), fillOpacity: empty ? 0.1 : 0.7 };
      },
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindTooltip(`<b>${p.place || p.rayon}</b><br>Obyekt: 2GIS ${fmt(p.poi)} · OSM ${fmt(p.poi_osm)}`, { sticky: true });
        l.on("mouseover", () => l.setStyle({ stroke: true, color: ink, weight: 2 }));
        l.on("mouseout", () => g.resetStyle(l));
        l.on("click", () => setInfo(p));
      },
    }).addTo(map);
    return () => map.removeLayer(g);
  }, [map, renderer, data, view, breaks, dark]);

  return (
    <MapWrap>
      <Tabs tabs={VIEWS} active={view} onChange={setView} />
      <MapLayout
        map={<MapBox ref={ref} $h={600} role="region" aria-label="2GIS datası xəritədə" />}
        side={
          <>
            <Card>
              {view === "ratio" ? (
                <SwatchLegend title={V.legend} items={RATIO_BINS.map(([, c, label]) => ({ color: cssVar(c), label }))} />
              ) : (
                <RampLegend title={V.legend} breaks={breaks} />
              )}
              <Small>Boz: data hələ toplanmayıb və ya 0.</Small>
            </Card>
            <Card title={info ? `${info.place || info.rayon} · ${info.rayon}` : "Kvadrat"}>
              {!info && <Small>Xəritədə kvadrata klikləyin.</Small>}
              {info && (
                <InfoList>
                  <dt>Əhali</dt>
                  <dd>{fmt(info.pop)}</dd>
                  <dt>Obyekt · 2GIS</dt>
                  <dd>{fmt(info.poi)}</dd>
                  <dt>Obyekt · OSM</dt>
                  <dd>{fmt(info.poi_osm)}</dd>
                  <dt>Fərq</dt>
                  <dd>{ratioText(info)}</dd>
                  <dt>Dayanacaq · 2GIS</dt>
                  <dd>{fmt(info.stops)}</dd>
                  <dt>Dayanacaq · OSM</dt>
                  <dd>{fmt(info.stops_osm)}</dd>
                  <dt>Ən yaxın dayanacaq · 2GIS</dt>
                  <dd>{info.near == null ? "2 km-dən uzaq" : `${fmt(info.near)} m`}</dd>
                  <dt>Ən yaxın dayanacaq · OSM</dt>
                  <dd>{info.near_osm == null ? "–" : `${fmt(info.near_osm)} m`}</dd>
                </InfoList>
              )}
            </Card>
          </>
        }
      />
    </MapWrap>
  );
};

const Section = styled.section`
  padding: 20px 0 56px;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0;
  > div {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  b {
    font-family: var(--font-bold);
    font-size: 28px;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  span {
    font-size: 13.5px;
    color: var(--text-2);
  }
  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MapWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Small = styled.p`
  font-size: 12.5px;
  color: var(--text-3);
  margin-top: 8px;
`;

const H2 = styled.h2`
  font-family: var(--font-bold);
  font-size: 22px;
  margin: 36px 0 0;
`;

const Note = styled.p`
  font-size: 13px;
  color: var(--text-3);
  margin: 6px 0 12px;
`;

const TableWrap = styled.div`
  ${card}
  padding: 0;
  overflow-x: auto;
  table {
    ${table}
  }
`;

const Warn = styled.div`
  ${card}
  margin-top: 28px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent);
  background: color-mix(in srgb, var(--warn) 8%, var(--panel));
  svg {
    flex: none;
    color: var(--warn);
    margin-top: 2px;
  }
  p {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-2);
  }
`;
