import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Info } from "lucide-react";
import Card from "@/components/common/Card";
import Tabs from "@/components/common/Tabs";
import Dropdown from "@/components/common/Dropdown";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import { MapLayers } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import { CountUp, growX } from "@/components/common/Motion";
import { RampLegend, SwatchLegend } from "@/components/common/Legend";
import MapLayout, { MapBox } from "@/components/site/common/MapLayout";
import { card, table } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { binColor, cssVar, fmt } from "@/utils/helpers/format";

// Bölgələmə: rayon -> planlama zonası -> məhəllə bloku. Təkliflər zona səviyyəsində.
const BOUNDS = [[40.18, 49.45], [40.62, 50.45]];
const NEED_BREAKS = [35, 42, 48, 54, 60, 66];
const P_BREAKS = [15, 30, 45, 60, 67, 80];
const LEVEL_COLOR = { yüksək: "--critical", orta: "--warn", aşağı: "--good" };

const Zoning = () => {
  const summary = useGet("zoning", ENDPOINTS.ZONING);
  const zones = useGet("zoningZones", ENDPOINTS.ZONING_ZONES);
  const S = summary.data;
  const [sel, setSel] = useState(null);
  const [rayon, setRayon] = useState("all");
  const [level, setLevel] = useState("all");
  const mapRef = useRef(null);

  const byRank = useMemo(() => new Map((S?.zones || []).map((z) => [z.rank, z])), [S]);
  const stats = useMemo(() => {
    if (!S) return null;
    const hi = S.zones.filter((z) => z.level === "yüksək");
    return {
      zones: S.zones.length,
      blocks: S.method.live_blocks,
      median: [...S.zones].sort((a, b) => a.pop - b.pop)[Math.floor(S.zones.length / 2)].pop,
      hi: hi.length,
      hiPop: hi.reduce((a, z) => a + z.pop, 0),
    };
  }, [S]);
  const list = useMemo(
    () => (S?.zones || []).filter((z) => (rayon === "all" || z.rayon === rayon) && (level === "all" || z.level === level)),
    [S, rayon, level]
  );
  const rayons = useMemo(() => [...new Set((S?.zones || []).map((z) => z.rayon))].sort((a, b) => a.localeCompare(b, "az")), [S]);
  const pick = (rank) => {
    setSel(rank);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <Section>
      <Helmet>
        <title>Bölgələmə · ADDIM Bakı</title>
        <meta name="description" content="Bakı məhəllə blokları və planlama zonaları: hər zonanın problemləri və ona uyğun qayda təklifləri." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="15 · Bölgələmə"
          title="Məhəllə səviyyəsində planlama zonaları"
          lede="Rayon qərar üçün çox böyükdür: bir rayonda 100–300 min insan və tamam fərqli məhəllələr var. Ona görə şəhəri kiçik zonalara böldük və təklifləri hər zona üçün ayrıca verdik."
        />
        <PageIntro
          art={<MapLayers />}
          answer="Əvvəl şəhəri küçələrlə məhəllə bloklarına böldük. Sonra problemləri oxşar olan qonşu blokları birləşdirib 5–15 min nəfərlik planlama zonaları qurduq."
          steps={["Xəritədə zonaya klikləyin: problemləri və təklif olunan qaydalar çıxacaq.", "“Bloklar” qatında hər məhəllə blokunu ayrıca görün.", "Aşağıdakı cədvəldə zonalar prioritetə görə sıralanıb: insan sayı × ehtiyac."]}
          idea="Zona həm qərar üçün kifayət qədər kiçikdir (15 dəqiqəlik piyada ərazi), həm də bir layihə üçün kifayət qədər böyükdür."
        />
        {(summary.isError || zones.isError) && <ErrorText />}
        {stats && (
          <Ladder>
            <div>
              <b>12</b>
              <span>rayon · orta hesabla 195 min insan</span>
            </div>
            <ArrowRight className="arr" size={20} />
            <div className="on">
              <b>
                <CountUp value={stats.zones} />
              </b>
              <span>planlama zonası · ortanca {fmt(stats.median)} insan</span>
            </div>
            <ArrowRight className="arr" size={20} />
            <div>
              <b>
                <CountUp value={stats.blocks} />
              </b>
              <span>məhəllə bloku (insan yaşayan)</span>
            </div>
            <div className="hot">
              <b>
                <CountUp value={stats.hi} />
              </b>
              <span>yüksək ehtiyaclı zona · {fmt(stats.hiPop)} insan</span>
            </div>
          </Ladder>
        )}
        <div ref={mapRef}>{S && zones.data && <ZoningMap S={S} zonesGeo={zones.data} sel={sel} setSel={setSel} byRank={byRank} />}</div>

        {S && (
          <>
            <H2>Zonalar prioritetə görə</H2>
            <Note>Sıra: insan sayı × ehtiyac balı. Sətrə klikləyin: zona xəritədə açılacaq.</Note>
            <Filters>
              <Dropdown id="z-rayon" label="Rayon" value={rayon} onChange={setRayon} options={[{ value: "all", label: "Bütün rayonlar" }, ...rayons.map((r) => ({ value: r, label: r }))]} />
              <Tabs
                tabs={[
                  { value: "all", label: "Hamısı" },
                  { value: "yüksək", label: "Yüksək" },
                  { value: "orta", label: "Orta" },
                  { value: "aşağı", label: "Aşağı" },
                ]}
                active={level}
                onChange={setLevel}
              />
            </Filters>
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Zona</th>
                    <th>Rayon</th>
                    <th>İnsan</th>
                    <th>Ehtiyac</th>
                    <th>Əsas problemlər</th>
                    <th>Qaydalar</th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, 60).map((z) => (
                    <tr key={z.rank} onClick={() => pick(z.rank)} className={sel === z.rank ? "sel" : ""}>
                      <td>{z.rank}</td>
                      <td>
                        <b>{z.name}</b>
                      </td>
                      <td>{z.rayon}</td>
                      <td>{fmt(z.pop)}</td>
                      <td>
                        <Level className={z.level}>{z.need}</Level>
                      </td>
                      <td>{z.problems.map(([k]) => S.layers[k].toLowerCase()).join(", ")}</td>
                      <td>
                        <RuleNums>
                          {z.recs.map((r) => (
                            <span key={r.rule} title={r.title}>
                              {r.rule}
                            </span>
                          ))}
                        </RuleNums>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            {list.length > 60 && <Note>İlk 60 zona göstərilir ({list.length}-dən). Filtrlə daraldın.</Note>}
            <Method>
              <Info size={18} />
              <div>
                <h3>Necə quruldu</h3>
                <p>
                  <b>Bloklar:</b> {S.method.unit}; böyük bloklar daxili küçələrlə bölündü. {fmt(S.method.blocks)} blok, {fmt(S.method.live_blocks)}-də ən az {S.method.live_min_pop} insan yaşayır.
                </p>
                <p>
                  <b>Problemlər:</b> hər blokda 8 göstərici; insan yaşayan bloklar arasında sıra faizi (0–100). Ehtiyac = 8-in ortası.
                </p>
                <p>
                  <b>Zonalar:</b> {S.method.algorithm}. Qonşu bloklar problem profili oxşardırsa bir zonada qalır; zona {fmt(S.method.zone_pop[0])}–{fmt(S.method.zone_pop[1])} insan.
                </p>
                <p>
                  <b>Mənbələr:</b> {Object.values(S.method.sources).join(" · ")}.
                </p>
                <p>
                  Qaydaların tam mətni: <Link to="/qaydalar">Qayda təklifləri</Link>.
                </p>
              </div>
            </Method>
          </>
        )}
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Zoning;

const ZoningMap = ({ S, zonesGeo, sel, setSel, byRank }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, maxZoom: 17, attribution: "© OpenStreetMap · WorldPop · Landsat · SRTM · opendata.az" });
  const dark = useColorScheme();
  const [view, setView] = useState("zones");
  const [layer, setLayer] = useState("need");
  const blocks = useGet("zoningBlocks", ENDPOINTS.ZONING_BLOCKS, undefined, { enabled: view === "blocks" });
  const layersOpt = [{ value: "need", label: "Ehtiyac (8-in ortası)" }, ...Object.entries(S.layers).map(([k, v]) => ({ value: k, label: v }))];
  const field = layer === "need" ? "need" : `p_${layer}`;
  const breaks = layer === "need" ? NEED_BREAKS : P_BREAKS;
  const zoneLayer = useRef(null);
  const flown = useRef(null);

  // zonalar
  useEffect(() => {
    if (!map) return undefined;
    const ink = cssVar("--text");
    const filled = view === "zones";
    const g = L.geoJSON(zonesGeo, {
      style: (f) => ({
        renderer,
        color: filled ? cssVar("--panel") : ink,
        weight: filled ? 1 : 1.6,
        opacity: filled ? 0.9 : 0.75,
        fillColor: binColor(f.properties[field], breaks),
        fillOpacity: filled ? 0.62 : 0,
      }),
      interactive: true,
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindTooltip(`<b>${p.name}</b><br>${fmt(p.pop)} insan · ehtiyac ${p.need}`, { sticky: true });
        l.on("click", () => setSel(p.rank));
      },
    }).addTo(map);
    zoneLayer.current = g;
    return () => map.removeLayer(g);
  }, [map, renderer, zonesGeo, view, field, breaks, dark, setSel]);

  // bloklar
  useEffect(() => {
    if (!map || view !== "blocks" || !blocks.data) return undefined;
    const g = L.geoJSON(blocks.data, {
      style: (f) => ({ renderer, stroke: true, color: cssVar("--panel"), weight: 0.4, fillColor: binColor(f.properties[field], breaks), fillOpacity: 0.68 }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindTooltip(`Məhəllə bloku · ${fmt(p.pop)} insan<br>${layer === "need" ? "Ehtiyac" : S.layers[layer]}: <b>${p[field]}</b>`, { sticky: true });
        l.on("click", () => setSel(p.zone_rank));
      },
    }).addTo(map);
    g.bringToBack();
    return () => map.removeLayer(g);
  }, [map, renderer, blocks.data, view, field, breaks, layer, S.layers, dark, setSel]);

  // seçilmiş zona: vurğu və uçuş
  useEffect(() => {
    if (!map || sel == null || !zoneLayer.current) return undefined;
    let hit = null;
    zoneLayer.current.eachLayer((l) => {
      if (l.feature.properties.rank === sel) hit = l;
    });
    if (!hit) return undefined;
    const out = L.geoJSON(hit.feature, { style: { renderer, color: cssVar("--accent"), weight: 4, fill: false }, interactive: false }).addTo(map);
    // yalnız yeni seçimdə uçur (qat dəyişəndə yox)
    if (flown.current !== sel) {
      flown.current = sel;
      map.flyToBounds(hit.getBounds(), { padding: [40, 40], maxZoom: 15, duration: 0.9 });
    }
    return () => map.removeLayer(out);
  }, [map, renderer, sel, view, field, dark]);

  const z = sel != null ? byRank.get(sel) : null;
  return (
    <MapWrap>
      <Controls>
        <Tabs
          tabs={[
            { value: "zones", label: "Zonalar" },
            { value: "blocks", label: "Məhəllə blokları" },
          ]}
          active={view}
          onChange={setView}
        />
        <Dropdown id="z-layer" label="Göstərici" value={layer} onChange={setLayer} options={layersOpt} />
      </Controls>
      <MapLayout
        map={<MapBox ref={ref} $h={640} role="region" aria-label="Planlama zonaları xəritəsi" />}
        side={
          <>
            <Card>
              <RampLegend title={layer === "need" ? "Ehtiyac balı (0–100)" : `${S.layers[layer]}: sıra faizi`} breaks={breaks} />
              {view === "blocks" && blocks.isLoading && <Small>Bloklar yüklənir…</Small>}
              <Small>{view === "zones" ? "Rəng: zonanın orta dəyəri (əhali ilə çəkili)." : "Rəng: hər blokun öz dəyəri. Xətlər: zona sərhədləri."}</Small>
            </Card>
            <Card title={z ? `#${z.rank} · ${z.name}` : "Zona"}>
              {!z && <Small>Xəritədə zonaya və ya bloka klikləyin.</Small>}
              {z && <ZoneCard z={z} S={S} />}
            </Card>
          </>
        }
      />
    </MapWrap>
  );
};

const ZoneCard = ({ z, S }) => (
  <ZBody>
    <Meta>
      <Level className={z.level}>{z.level} ehtiyac · {z.need}</Level>
      <span>
        {z.rayon} · {fmt(z.pop)} insan · {z.area_km2} km² · {z.blocks} blok
      </span>
    </Meta>
    <Bars>
      {Object.entries(S.layers).map(([k, v]) => {
        const p = z["p_" + k];
        return (
          <li key={k} className={p >= 67 ? "bad" : ""}>
            <span>{v}</span>
            <i>
              <em style={{ width: `${p}%`, background: `var(${p >= 67 ? "--critical" : p >= 45 ? "--warn" : "--good"})` }} />
            </i>
            <b>{p}</b>
          </li>
        );
      })}
    </Bars>
    <Facts>
      <span>Yay günü yer səthi: <b>{z.lst}°C</b></span>
      <span>Yaşıllıq: <b>{z.green_pct}%</b></span>
      <span>Dayanacağa orta: <b>{fmt(z.stop_m)} m</b></span>
      <span>500 m-də gündəlik xidmət: <b>{z.svc_500}</b></span>
    </Facts>
    <h4>Bu zona üçün təkliflər</h4>
    <Recs>
      {z.recs.map((r) => (
        <li key={r.rule}>
          <Num>{r.rule}</Num>
          <div>
            <b>{r.title}</b>
            <span>
              {r.for ? `${S.layers[r.for]}: ` : ""}
              {r.action}
            </span>
          </div>
        </li>
      ))}
    </Recs>
    <More to="/qaydalar">
      Qaydaların tam mətni <ArrowRight size={14} />
    </More>
  </ZBody>
);

/* ---------- stil ---------- */

const Section = styled.section`
  padding: 20px 0 56px;
`;

const Ladder = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr 1fr;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  > div {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
  }
  > div.on {
    border: 1px solid var(--accent);
    box-shadow: 0 8px 30px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  > div.hot b {
    background: none;
    color: var(--critical);
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
  .arr {
    color: var(--text-3);
  }
  @media (max-width: 980px) {
    grid-template-columns: 1fr 1fr;
    .arr {
      display: none;
    }
  }
`;

const MapWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  > label {
    min-width: 240px;
  }
`;

const Small = styled.p`
  font-size: 12.5px;
  color: var(--text-3);
  margin-top: 8px;
`;

const ZBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  h4 {
    font-family: var(--font-bold);
    font-size: 15px;
    margin-top: 4px;
  }
`;

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  span {
    font-size: 12.5px;
    color: var(--text-3);
  }
`;

const Level = styled.em`
  align-self: flex-start;
  font-style: normal;
  font-family: var(--font-semibold);
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 10px;
  --c: var(--text-3);
  &.yüksək {
    --c: var(--critical);
  }
  &.orta {
    --c: var(--warn);
  }
  &.aşağı {
    --c: var(--good);
  }
  color: var(--c);
  background: color-mix(in srgb, var(--c) 15%, transparent);
`;

const Bars = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 5px;
  li {
    display: grid;
    grid-template-columns: 1fr 70px 24px;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-2);
  }
  li.bad span {
    color: var(--text);
    font-family: var(--font-semibold);
  }
  i {
    height: 6px;
    border-radius: 99px;
    background: var(--bg-secondary);
    overflow: hidden;
  }
  em {
    display: block;
    height: 100%;
    border-radius: 99px;
    ${growX}
  }
  b {
    font-family: var(--font-semibold);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

const Facts = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  span {
    font-size: 12px;
    color: var(--text-3);
    padding: 6px 8px;
    border-radius: 10px;
    background: var(--bg-secondary);
  }
  b {
    color: var(--text);
    font-family: var(--font-semibold);
  }
`;

const Recs = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 8px;
  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  b {
    font-family: var(--font-semibold);
    font-size: 13.5px;
  }
  span {
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.45;
  }
`;

const Num = styled.i`
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-style: normal;
  font-family: var(--font-bold);
  font-size: 12.5px;
  color: var(--good);
  background: color-mix(in srgb, var(--good) 15%, transparent);
`;

const More = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-semibold);
  font-size: 13px;
  color: var(--accent);
`;

const H2 = styled.h2`
  font-family: var(--font-bold);
  font-size: 22px;
  margin: 40px 0 0;
`;

const Note = styled.p`
  font-size: 13px;
  color: var(--text-3);
  margin: 6px 0 12px;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 12px;
  > label {
    min-width: 200px;
  }
`;

const TableWrap = styled.div`
  ${card}
  padding: 0;
  overflow-x: auto;
  table {
    ${table}
  }
  tbody tr {
    cursor: pointer;
  }
  tbody tr:hover,
  tbody tr.sel {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
`;

const RuleNums = styled.span`
  display: inline-flex;
  gap: 4px;
  span {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-family: var(--font-bold);
    font-size: 11px;
    color: var(--good);
    background: color-mix(in srgb, var(--good) 15%, transparent);
  }
`;

const Method = styled.div`
  ${card}
  margin-top: 28px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  > svg {
    flex: none;
    color: var(--accent);
    margin-top: 2px;
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 16px;
    margin-bottom: 6px;
  }
  p {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-2);
    margin-top: 4px;
  }
  a {
    color: var(--accent);
  }
`;
