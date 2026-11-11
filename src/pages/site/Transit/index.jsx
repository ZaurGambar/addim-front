import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BrainCircuit, Bus, Clock, HeartHandshake, Info, MapPin, Users, Wallet } from "lucide-react";
import Card from "@/components/common/Card";
import Tabs from "@/components/common/Tabs";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import LensStrip from "@/components/common/LensStrip";
import { MapLayers } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import { RampLegend } from "@/components/common/Legend";
import MapLayout, { MapBox } from "@/components/site/common/MapLayout";
import { card, table } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { binColor, cssVar, fmt } from "@/utils/helpers/format";

// Dayanacağa 5 dəqiqə: periferiya sakinləri üçün yeni avtobus dayanacaqlarının AI ilə yerləşdirilməsi
const BOUNDS = [[40.18, 49.45], [40.62, 50.45]];
const WALK_BREAKS = [200, 400, 600, 800, 1200, 2000];
const SCEN = {
  far: { label: "Periferiya: 10 dəqiqədən çox yeriyənlər", short: "10 dəq-dən uzaq yaşayanlar" },
  all: { label: "Bütün şəhər: 5 dəqiqədən uzaq hər kəs", short: "5 dəq-dən uzaq yaşayanlar" },
};

const Transit = () => {
  const T = useGet("transitAccess", ENDPOINTS.TRANSIT_ACCESS);
  const D = T.data;
  const [scen, setScen] = useState("far");
  const [k, setK] = useState(10);
  const sc = D?.scenarios[scen];
  const kMax = sc ? sc.proposals.length : 0;
  const kk = Math.min(k, kMax);
  const res = useMemo(() => {
    if (!sc) return null;
    const people = sc.curve[kk];
    const cost = kk * D.summary.stop_cost;
    const hi = sc.proposals.slice(0, kk).reduce((a, p) => a + (p.hi_svi || 0), 0);
    return { people, cost, perPerson: people ? cost / people : 0, hours: Math.round(sc.saved[kk] / 60), hi };
  }, [sc, kk, D]);

  return (
    <Section>
      <Helmet>
        <title>Dayanacağa 5 dəqiqə · ADDIM Bakı</title>
        <meta name="description" content="Periferiya sakinləri üçün: yeni avtobus dayanacaqlarının yeri piyada şəbəkəsi və əhali datası ilə optimallaşdırılır." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="Hər kəs üçün şəhər · MVP"
          title="Dayanacağa 5 dəqiqə"
          lede="Mərkəzdə avtobus hər küncdədir, qəsəbədə isə insan dayanacağa 1–3 km, 43°C istidə, çox vaxt səkisiz yolla yeriyir. ADDIM hər evdən ən yaxın dayanacağa real piyada məsafəsini ölçür və mövcud avtobus marşrutlarının üzərində yeni dayanacaqların ən faydalı yerini seçir: yeni marşrut, yeni avtobus lazım deyil."
        />
        <PageIntro
          art={<MapLayers />}
          answer="Xəritədə hər məhəllə bloku dayanacağa piyada məsafəsinə görə rənglənib. Sürgü ilə neçə yeni dayanacaq qoyulacağını seçin: alqoritm onları ən çox insana fayda verən yerlərə qoyur."
          steps={["Ssenarini seçin: periferiya və ya bütün şəhər.", "Sürgünü çəkin: neçə insan 5 dəqiqəlik məsafəyə düşür, xərc nə qədərdir.", "Nömrəli nöqtəyə klikləyin: hansı marşrut, hansı məhəllə, əvvəl neçə metr idi."]}
          idea="Bir örtüklü dayanacaq təxminən 15 min ₼-dir və bir neçə həftəyə qurulur. Bu, şəhərin ən ucuz və ən tez ədalət alətidir."
        />
        <LensStrip page="/dayanacaq" step={5} />
        {T.isError && <ErrorText />}
        {D && (
          <>
            <Pain>
              <li>
                <b>{D.summary.pct_5min}%</b>
                <span>Bakı sakinlərinin dayanacağa (avtobus, metro) 5 dəqiqəyə çatan payı</span>
              </li>
              <li className="bad">
                <b>{fmt(D.summary.far_pop)}</b>
                <span>insan dayanacağa 10 dəqiqədən çox yeriyir</span>
              </li>
              <li>
                <b>{fmt(D.summary.under_walk_m)} m</b>
                <span>5 dəqiqədən uzaq yaşayanların orta piyada yolu</span>
              </li>
              <li>
                <b>{D.summary.under_lst}°C</b>
                <span>həmin məhəllələrdə yay günü yer səthi</span>
              </li>
            </Pain>

            <Persona>
              <MapPin size={20} />
              <p>
                <b>Zabrat, Sabunçu</b> (nümunə persona, rəqəmlər real). Səbinə xala hər səhər nəvəsini məktəbə apardıqdan sonra işə gedir. Ən yaxın dayanacaq evindən <b>{fmt(D.scenarios.far.proposals[0].walk_before_m)} m</b> uzaqdadır,
                halbuki <b>{D.scenarios.far.proposals[0].routes.join(", ")}</b> nömrəli avtobus elə evin yanından keçir, sadəcə orada dayanmır. Alqoritmin birinci təklifi məhz budur: bu nöqtədə bir dayanacaq{" "}
                <b>{fmt(D.scenarios.far.proposals[0].gain)} nəfəri</b> 5 dəqiqəlik məsafəyə gətirir və gündə <b>{fmt(Math.round(D.scenarios.far.proposals[0].min_saved_day / 60))} saat</b> piyada yolu qənaət edir.
              </p>
            </Persona>

            <H2>Simulyator: neçə yeni dayanacaq?</H2>
            <Controls>
              <Tabs tabs={Object.entries(SCEN).map(([v, s]) => ({ value: v, label: s.label }))} active={scen} onChange={setScen} />
              <Slider>
                <span>
                  Yeni dayanacaq: <b>{kk}</b>
                </span>
                <input type="range" min={0} max={kMax} value={kk} onChange={(e) => setK(Number(e.target.value))} aria-label="Yeni dayanacaq sayı" />
              </Slider>
            </Controls>
            {res && (
              <Kpis>
                <li>
                  <Users size={18} />
                  <b>+{fmt(res.people)}</b>
                  <span>insan 5 dəqiqəlik məsafəyə düşür</span>
                </li>
                <li>
                  <Wallet size={18} />
                  <b>{fmt(res.cost)} ₼</b>
                  <span>xərc · nəfərə {res.perPerson ? res.perPerson.toFixed(1) : "–"} ₼</span>
                </li>
                <li>
                  <Clock size={18} />
                  <b>{fmt(res.hours)} saat</b>
                  <span>gündə qənaət olunan piyada vaxtı (gediş-dönüş)</span>
                </li>
                <li>
                  <HeartHandshake size={18} />
                  <b>{fmt(res.hi)}</b>
                  <span>
                    onlardan həssas zonalarda (Social Vulnerability Index, SVI ≥ 60) ·{" "}
                    <Link to="/planlama?addim=5" style={{ color: "var(--accent)" }}>
                      inklüziv baxış (inclusive lens)
                    </Link>
                  </span>
                </li>
              </Kpis>
            )}
            <Note>
              Ssenari müqayisəsi: “bütün şəhər” daha çox insana çatır, amma faydanın demək olar ki hamısı yaxşı təmin olunmuş zonalara gedir. İlk 10 dayanacaqda “periferiya” ssenarisi həssas zonalara 57 dəfə çox fayda çatdırır (6 092 və 107 nəfər). Bu, səmərəlilik ilə ədalət arasındakı
              seçimdir.
            </Note>
            {sc && <Curve curve={sc.curve} k={kk} cost={D.summary.stop_cost} />}
            <TransitMap D={D} proposals={sc ? sc.proposals.slice(0, kk) : []} />

            <H2>Təkliflər: hara dayanacaq qoymaq lazımdır</H2>
            <Note>Sıra alqoritmin seçim sırasıdır: hər növbəti dayanacaq əvvəlkilərin əhatə etmədiyi ən çox insanı götürür.</Note>
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Məhəllə</th>
                    <th>Rayon</th>
                    <th>Marşrut</th>
                    <th>Əvvəl, m</th>
                    <th>+ İnsan</th>
                    <th>Qənaət, saat/gün</th>
                  </tr>
                </thead>
                <tbody>
                  {sc?.proposals.slice(0, Math.max(kk, 10)).map((p) => (
                    <tr key={p.k} className={p.k <= kk ? "" : "off"}>
                      <td>{p.k}</td>
                      <td>
                        <b>{p.zone}</b>
                      </td>
                      <td>{p.rayon}</td>
                      <td>{p.routes.join(", ")}</td>
                      <td>{fmt(p.walk_before_m)}</td>
                      <td>{fmt(p.gain)}</td>
                      <td>{fmt(Math.round(p.min_saved_day / 60))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>

            <H2>Dayanacaq kifayət etməyən məhəllələr</H2>
            <Note>Bu məhəllələrin yanından avtobus marşrutu ümumiyyətlə keçmir: burada yeni marşrut və ya metroya mikroavtobus (feeder) lazımdır.</Note>
            <Routes>
              {D.new_route_zones.slice(0, 10).map((z) => (
                <li key={z.zone + z.rayon}>
                  <Bus size={16} />
                  <b>{z.zone}</b>
                  <span>{z.rayon}</span>
                  <em>
                    {fmt(z.pop)} insan · orta {fmt(z.walk_m)} m
                  </em>
                </li>
              ))}
            </Routes>

            <H2>Rayonlar: dayanacağa 5 dəqiqə</H2>
            <Bars>
              {D.by_rayon.map((r) => (
                <li key={r.rayon}>
                  <span>{r.rayon}</span>
                  <div>
                    <i style={{ width: `${r.pct_10min}%` }} className="ten" />
                    <i style={{ width: `${r.pct_5min}%` }} />
                  </div>
                  <b>{r.pct_5min}%</b>
                </li>
              ))}
            </Bars>
            <Note>Tünd: 5 dəqiqə (400 m). Açıq: 10 dəqiqə (800 m). Qaradağ, Pirallahı və Xəzərdə sakinlərin 85%-dən çoxu dayanacağa 5 dəqiqədən uzaqdadır.</Note>

            <Method>
              <BrainCircuit size={18} />
              <div>
                <h3>Alqoritm necə işləyir</h3>
                <p>
                  <b>Məsafə:</b> {D.method.network}. Mənbə: {D.method.stops} ({fmt(D.summary.stops_n)} nöqtə). Piyada sürəti {D.method.walk_speed_m_min} m/dəq: 5 dəqiqə = {D.method.walk5_m} m.
                </p>
                <p>
                  <b>Optimallaşdırma:</b> {D.method.algorithm}. Namizədlər {D.summary.routes_n} mövcud avtobus marşrutunun üzərində hər {D.method.cand_step_m} m-dən bir ({fmt(D.summary.candidates_n)} nöqtə), mövcud dayanacaqdan ən az 300 m uzaqda.
                </p>
                <p>
                  <b>Əhali:</b> {D.method.pop}. <b>Xərc:</b> {D.method.cost_note}, {fmt(D.summary.stop_cost)} ₼.
                </p>
                <p>
                  <Info size={13} /> Məhdudiyyətlər: OSM-də səki olmayan yollar da piyada yolu sayılır (real məsafə daha çətindir); avtobusun hər nöqtədə dayana bilməsi yol təhlükəsizliyi ilə yoxlanmalıdır; marşrut tezliyi nəzərə alınmayıb. Ətraflı:{" "}
                  <Link to="/metodologiya">Metodologiya</Link>.
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

export default Transit;

// Azalan fayda əyrisi: hər yeni dayanacaq əvvəlkindən az insan gətirir
const Curve = ({ curve, k, cost }) => {
  const W = 1100;
  const H = 150;
  const n = curve.length - 1;
  const max = curve[n] || 1;
  const x = (i) => (i / n) * W;
  const y = (v) => H - (v / max) * (H - 12);
  const d = curve.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <CurveBox>
      <svg viewBox={`0 0 ${W} ${H + 20}`} role="img" aria-label="Dayanacaq sayına görə əhatə olunan insan">
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <line x1={x(k)} x2={x(k)} y1={0} y2={H} stroke="var(--text-3)" strokeDasharray="4 4" />
        <circle cx={x(k)} cy={y(curve[k])} r="5" fill="var(--accent)" />
        <text x={0} y={H + 16} fontSize="11" fill="var(--text-3)">
          0
        </text>
        <text x={W} y={H + 16} fontSize="11" fill="var(--text-3)" textAnchor="end">
          {n} dayanacaq · {fmt(n * cost)} ₼
        </text>
      </svg>
      <small>İlk dayanacaqlar ən çox fayda verir: əyri tez qalxır, sonra yastılaşır. Büdcəni ilk onluğa yönəltmək ən səmərəlidir.</small>
    </CurveBox>
  );
};

const TransitMap = ({ D, proposals }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, maxZoom: 17, attribution: "© OpenStreetMap · opendata.az (BakuBus) · WorldPop" });
  const dark = useColorScheme();
  const blocks = useGet("zoningBlocks", ENDPOINTS.ZONING_BLOCKS);
  const walk = useGet("transitBlocks", ENDPOINTS.TRANSIT_BLOCKS);
  const stops = useGet("transitStops", ENDPOINTS.TRANSIT_STOPS);
  const [showStops, setShowStops] = useState(true);
  const [pick, setPick] = useState(null);
  const covered = useMemo(() => new Set(proposals.flatMap((p) => p.cover)), [proposals]);

  useEffect(() => {
    if (!map || !blocks.data || !walk.data) return undefined;
    const g = L.geoJSON(blocks.data, {
      style: (f) => {
        const bid = f.properties.bid;
        const w = covered.has(bid) ? 350 : walk.data[bid];
        return { renderer, stroke: covered.has(bid), color: cssVar("--accent"), weight: 1.2, fillColor: binColor(w, WALK_BREAKS), fillOpacity: 0.7 };
      },
      onEachFeature: (f, l) => {
        const p = f.properties;
        const w = walk.data[p.bid];
        l.bindTooltip(`${fmt(p.pop)} insan · dayanacağa ${fmt(w)} m (~${Math.max(1, Math.round(w / 80))} dəq)${covered.has(p.bid) ? "<br><b>yeni dayanacaqla ≤ 5 dəq</b>" : ""}`, { sticky: true });
      },
    }).addTo(map);
    g.bringToBack();
    return () => map.removeLayer(g);
  }, [map, renderer, blocks.data, walk.data, covered, dark]);

  useEffect(() => {
    if (!map || !stops.data || !showStops) return undefined;
    const g = L.geoJSON(stops.data, {
      pointToLayer: (f, ll) => L.circleMarker(ll, { renderer, radius: 1.6, stroke: false, fillColor: cssVar("--text-2"), fillOpacity: 0.7, interactive: false }),
    }).addTo(map);
    return () => map.removeLayer(g);
  }, [map, renderer, stops.data, showStops, dark]);

  useEffect(() => {
    if (!map) return undefined;
    const g = L.layerGroup(
      proposals.map((p) =>
        L.marker([p.lat, p.lon], {
          icon: L.divIcon({ className: "", html: `<span class="tr-pin">${p.k}</span>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
          title: `${p.k}. ${p.zone}`,
        }).on("click", () => setPick(p))
      )
    ).addTo(map);
    return () => map.removeLayer(g);
  }, [map, proposals]);

  useEffect(() => {
    if (!map || !pick) return;
    map.flyTo([pick.lat, pick.lon], 15, { duration: 0.8 });
  }, [map, pick]);

  return (
    <MapLayout
      map={<MapBox ref={ref} $h={620} role="region" aria-label="Dayanacağa piyada məsafəsi xəritəsi" />}
      side={
        <>
          <Card>
            <RampLegend title="Dayanacağa piyada yolu, m" breaks={WALK_BREAKS} />
            <Small>Mavi kontur: yeni dayanacaqla 5 dəqiqəyə düşən bloklar. Nömrə: alqoritmin təklifi.</Small>
            <Check>
              <input type="checkbox" checked={showStops} onChange={(e) => setShowStops(e.target.checked)} /> Mövcud dayanacaqlar ({fmt(D.summary.stops_n)})
            </Check>
            {(blocks.isLoading || walk.isLoading) && <Small>Bloklar yüklənir…</Small>}
          </Card>
          {pick && (
            <Card title={`Təklif ${pick.k}: ${pick.zone}`}>
              <Dl>
                <dt>Rayon</dt>
                <dd>{pick.rayon}</dd>
                <dt>Marşrut</dt>
                <dd>{pick.routes.join(", ")}</dd>
                <dt>Əvvəl</dt>
                <dd>{fmt(pick.walk_before_m)} m piyada</dd>
                <dt>Sonra</dt>
                <dd>≤ 400 m (5 dəq)</dd>
                <dt>Fayda</dt>
                <dd>
                  +{fmt(pick.gain)} insan · {fmt(Math.round(pick.min_saved_day / 60))} saat/gün
                </dd>
              </Dl>
            </Card>
          )}
        </>
      }
    />
  );
};

const Section = styled.section`
  padding: 20px 0 56px;
  .tr-pin {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font: 700 11px/1 var(--font-bold, sans-serif);
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
    cursor: pointer;
  }
`;
const Pain = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 20px;
  li {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  b {
    font-family: var(--font-bold);
    font-size: 28px;
  }
  li.bad b {
    color: var(--critical);
  }
  span {
    font-size: 13px;
    color: var(--text-2);
  }
`;
const Persona = styled.div`
  ${card}
  margin-top: 16px;
  display: flex;
  gap: 12px;
  border-left: 4px solid var(--accent);
  > svg {
    flex: none;
    color: var(--accent);
    margin-top: 2px;
  }
  p {
    font-size: 15px;
    line-height: 1.6;
  }
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
const Small = styled.p`
  font-size: 12.5px;
  color: var(--text-3);
  margin-top: 8px;
`;
const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin: 12px 0;
`;
const Slider = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 260px;
  flex: 1;
  font-size: 14px;
  input {
    width: 100%;
    accent-color: var(--accent);
  }
`;
const Kpis = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  li {
    ${card}
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 8px;
    align-items: center;
  }
  svg {
    color: var(--accent);
  }
  b {
    font-family: var(--font-bold);
    font-size: 22px;
  }
  span {
    grid-column: 1 / -1;
    font-size: 12.5px;
    color: var(--text-2);
  }
`;
const CurveBox = styled.div`
  ${card}
  margin: 12px 0;
  svg {
    width: 100%;
    height: auto;
  }
  small {
    font-size: 12.5px;
    color: var(--text-3);
  }
`;
const TableWrap = styled.div`
  ${card}
  padding: 0;
  overflow-x: auto;
  table {
    ${table}
  }
  tr.off {
    opacity: 0.45;
  }
`;
const Routes = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px;
  li {
    ${card}
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 8px;
    padding: 12px 14px;
  }
  svg {
    color: var(--critical);
    grid-row: span 3;
  }
  span,
  em {
    font-size: 12.5px;
    color: var(--text-2);
    font-style: normal;
  }
`;
const Bars = styled.ul`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  li {
    display: grid;
    grid-template-columns: 90px 1fr 52px;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
  div {
    position: relative;
    height: 12px;
    background: var(--line);
    border-radius: 6px;
    overflow: hidden;
  }
  i {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--accent);
  }
  i.ten {
    opacity: 0.3;
  }
  b {
    text-align: right;
  }
`;
const Check = styled.label`
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  margin-top: 10px;
`;
const Dl = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  font-size: 13px;
  dt {
    color: var(--text-3);
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
