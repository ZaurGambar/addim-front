import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Baby, Bus, Droplets, Footprints, Info, Link2, Mountain, School, ShoppingBasket, Sun, Trees, Users } from "lucide-react";
import Card from "@/components/common/Card";
import Tabs from "@/components/common/Tabs";
import Dropdown from "@/components/common/Dropdown";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import LensStrip from "@/components/common/LensStrip";
import LensTags from "@/components/common/LensTags";
import { SOL_LENS } from "@/utils/mock/planning";
import { MapLayers } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import { CountUp, growX } from "@/components/common/Motion";
import { RampLegend, SwatchLegend } from "@/components/common/Legend";
import MapLayout, { MapBox } from "@/components/site/common/MapLayout";
import { card, table } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import BudgetCalculator from "@/components/site/Zoning/BudgetCalculator";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { binColor, cssVar, fmt } from "@/utils/helpers/format";

// Bölgələmə: rayon -> planlama zonası -> məhəllə bloku. Təkliflər zona səviyyəsində.
const BOUNDS = [[40.18, 49.45], [40.62, 50.45]];
const NEED_BREAKS = [35, 42, 48, 54, 60, 66];
const P_BREAKS = [15, 30, 45, 60, 67, 80];
// İnsan miqyasında piyada həlləri: blok -> zona proqramı -> şəhər qaydası
const SOL = {
  A: { icon: Footprints, color: "--critical", what: "Yeraltı keçid və uzun magistral əvəzinə hər 200–300 m-də zebra və svetofor." },
  B: { icon: School, color: "--warn", what: "Məktəbə gedən yolda 30 km/saat, səki səviyyəsində keçid, dərs vaxtı nəzarət." },
  C: { icon: Sun, color: "--serious", what: "Səki boyu ağac sırası, dayanacaqda örtük, açıq rəngli səki." },
  D: { icon: Trees, color: "--good", what: "Boş həyət və ya küncdə kiçik park: kölgə, oturacaq, içməli su." },
  E: { icon: Bus, color: "--accent", what: "Evdən 300 m-də dayanacaq və ona kölgəli, işıqlı piyada yolu." },
  F: { icon: Link2, color: "--t3", what: "Dalanlar və həyətlər arasında açıq, işıqlı piyada keçidi." },
  G: { icon: ShoppingBasket, color: "--t2", what: "Birinci mərtəbədə market və aptek, həftəlik açıq bazar." },
  H: { icon: Mountain, color: "--g2", what: "Pilləkən yanında pandus və məhəccər, hər 50 m-də oturacaq." },
  I: { icon: Droplets, color: "--s6", what: "Yağışda səkidə su yığılmasın: drenaj, hündür keçidlər." },
};
const why = (k, p, C) =>
  ({
    A: `Yanındakı magistralda ${fmt(p.major_m)} m boyunca OSM-də ${p.cross_n} yer üstü keçid var${p.under_n ? `, ${p.under_n} yeraltı keçid` : ""}.`,
    B: `Ən yaxın məktəb ${fmt(p.school_m)} m-dədir, yolda magistral var.`,
    C: `Yay günü yer səthi ${p.lst}°C (şəhər ortası ${C.lst_city}°C), yaşıllıq ${p.green_pct}%.`,
    D: `Ən yaxın park ${fmt(p.park_m)} m-dədir.`,
    E: `Ən yaxın dayanacaq ${fmt(p.stop_m)} m-dədir: piyada ~${Math.max(1, Math.round(p.stop_m / 75))} dəqiqə.`,
    F: `Küçələrin ${p.deadend_pct}%-i dalandır: piyada dolama yolla gedir.`,
    G: `Ən yaxın market ${fmt(p.shop_m)} m, aptek ${fmt(p.pharm_m)} m.`,
    H: `Orta yamac ${p.slope}°: yaşlı və uşaq arabalı insan üçün çətindir.`,
    I: `Yer dəniz səviyyəsindən ${Math.abs(p.elev)} m aşağıdadır.`,
  })[k];
const firstSol = (p) => (p.sol || "").split(",").filter(Boolean)[0];

const Zoning = () => {
  const summary = useGet("zoning", ENDPOINTS.ZONING);
  const zones = useGet("zoningZones", ENDPOINTS.ZONING_ZONES);
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS);
  const city = analysis.data?.city;
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
          title="Hər məhəllə bloku üçün piyada həlli"
          lede="Rayon qərar üçün çox böyükdür: bir rayonda 100–300 min insan və tamam fərqli məhəllələr var. Şəhəri insan miqyasına, məhəllə bloklarına qədər böldük. Hər blok öz piyada problemlərinə uyğun həll alır; həllər zonada proqrama, şəhərdə qaydaya birləşir."
        />
        <PageIntro
          art={<MapLayers />}
          answer="Əvvəl şəhəri küçələrlə məhəllə bloklarına böldük. Sonra problemləri oxşar olan qonşu blokları birləşdirib 5–15 min nəfərlik planlama zonaları qurduq."
          steps={["Zonaya klikləyin, sonra “Bu zonanın bloklarına baxın”.", "Bloka klikləyin: orada neçə insan yaşayır, piyadaya nə mane olur və nə etmək lazımdır.", "Aşağıda: 9 piyada həlli və onların zona proqramı, şəhər qaydası."]}
          idea="Blok insan miqyasıdır (keçid, kölgə, oturacaq). Zona 15 dəqiqəlik məhəllədir (proqram). Şəhər qayda və büdcə verir."
        />
        <LensStrip page="/bolgeleme" step={6} />
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
        <div ref={mapRef}>{S && zones.data && <ZoningMap S={S} zonesGeo={zones.data} sel={sel} setSel={setSel} byRank={byRank} city={city} />}</div>

        {S && (
          <>
            <H2>Piyada həlləri: blokdan şəhərə</H2>
            <Note>Hər həll üç miqyasda işləyir: məhəllə blokunda konkret iş, zonada proqram, şəhərdə qayda. Rəqəmlər: neçə blokda lazımdır və orada neçə insan yaşayır.</Note>
            <Scales>
              <span>
                <b>Blok</b> insan miqyası: keçid, kölgə, oturacaq
              </span>
              <ArrowRight size={16} />
              <span>
                <b>Zona</b> 15 dəqiqəlik məhəllə: proqram
              </span>
              <ArrowRight size={16} />
              <span>
                <b>Şəhər</b> qayda və büdcə
              </span>
            </Scales>
            <Catalog>
              {Object.entries(S.solutions).map(([k, v]) => {
                const X = SOL[k];
                const t = S.solution_totals[k];
                return (
                  <li key={k} style={{ "--c": `var(${X.color})` }}>
                    <X.icon size={22} />
                    <h3>{v.title}</h3>
                    <p>{X.what}</p>
                    <LensTags ids={SOL_LENS[k]} />
                    <dl>
                      <dt>Blok</dt>
                      <dd>
                        {fmt(t.blocks)} blokda lazımdır · {fmt(t.pop)} insan
                      </dd>
                      <dt>Zona</dt>
                      <dd>{v.program}</dd>
                      <dt>Şəhər</dt>
                      <dd>
                        <Link to="/qaydalar">
                          Qayda {v.rule}: {S.rules[v.rule]}
                        </Link>
                      </dd>
                    </dl>
                  </li>
                );
              })}
            </Catalog>
            <BudgetCalculator solutions={S.solutions} />

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
                    <th>Zona proqramı</th>
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
                      <td>{z.program.slice(0, 2).map(([k]) => S.solutions[k].program).join("; ")}</td>
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

const ZoningMap = ({ S, zonesGeo, sel, setSel, byRank, city }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, maxZoom: 17, attribution: "© OpenStreetMap · WorldPop · Landsat · SRTM · opendata.az" });
  const dark = useColorScheme();
  const [view, setView] = useState("zones");
  const [layer, setLayer] = useState("need");
  const [block, setBlock] = useState(null);
  const blocks = useGet("zoningBlocks", ENDPOINTS.ZONING_BLOCKS, undefined, { enabled: view === "blocks" });
  const layersOpt = [
    { value: "sol", label: "Bloklar: əsas piyada həlli" },
    { value: "need", label: "Ehtiyac (8-in ortası)" },
    ...Object.entries(S.layers).map(([k, v]) => ({ value: k, label: v })),
  ];
  const solView = layer === "sol";
  const field = layer === "need" || solView ? "need" : `p_${layer}`;
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
        l.on("click", () => {
          setBlock(null);
          setSel(p.rank);
        });
      },
    }).addTo(map);
    zoneLayer.current = g;
    return () => map.removeLayer(g);
  }, [map, renderer, zonesGeo, view, field, breaks, dark, setSel]);

  // bloklar
  useEffect(() => {
    if (!map || view !== "blocks" || !blocks.data) return undefined;
    const g = L.geoJSON(blocks.data, {
      style: (f) => {
        const k = firstSol(f.properties);
        const fill = solView ? (k ? cssVar(SOL[k].color) : cssVar("--text-3")) : binColor(f.properties[field], breaks);
        return { renderer, stroke: true, color: cssVar("--panel"), weight: 0.4, fillColor: fill, fillOpacity: solView && !k ? 0.15 : 0.68 };
      },
      onEachFeature: (f, l) => {
        const p = f.properties;
        const k = firstSol(p);
        const head = solView ? (k ? S.solutions[k].title : "ciddi problem yoxdur") : `${layer === "need" ? "Ehtiyac" : S.layers[layer]}: <b>${p[field]}</b>`;
        l.bindTooltip(`Məhəllə bloku · ${fmt(p.pop)} insan<br>${head}`, { sticky: true });
        l.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setBlock(p);
          setSel(p.zone_rank);
        });
      },
    }).addTo(map);
    g.bringToBack();
    return () => map.removeLayer(g);
  }, [map, renderer, blocks.data, view, field, breaks, layer, solView, S.layers, S.solutions, dark, setSel]);

  // seçilmiş blok: kontur
  useEffect(() => {
    if (!map || !block || view !== "blocks" || !blocks.data) return undefined;
    const f = blocks.data.features.find((x) => x.properties.bid === block.bid);
    if (!f) return undefined;
    const g = L.geoJSON(f, { style: { renderer, color: cssVar("--text"), weight: 3, fill: false }, interactive: false }).addTo(map);
    return () => map.removeLayer(g);
  }, [map, renderer, block, view, blocks.data, dark]);

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
              {solView && view === "blocks" ? (
                <SwatchLegend title="Blokun əsas piyada həlli" items={Object.entries(S.solutions).map(([k, v]) => ({ color: cssVar(SOL[k].color), label: v.title }))} />
              ) : (
                <RampLegend title={layer === "need" || solView ? "Ehtiyac balı (0–100)" : `${S.layers[layer]}: sıra faizi`} breaks={breaks} />
              )}
              {solView && view === "zones" && <Small>Həllər blok səviyyəsindədir: “Məhəllə blokları” qatını açın.</Small>}
              {view === "blocks" && blocks.isLoading && <Small>Bloklar yüklənir…</Small>}
              <Small>{view === "zones" ? "Rəng: zonanın orta dəyəri (əhali ilə çəkili)." : "Rəng: hər blokun öz dəyəri. Xətlər: zona sərhədləri."}</Small>
            </Card>
            {block && view === "blocks" && (
              <Card title="Məhəllə bloku">
                <BlockCard p={block} S={S} z={z} city={city} onZone={() => setBlock(null)} />
              </Card>
            )}
            {!(block && view === "blocks") && (
              <Card title={z ? `#${z.rank} · ${z.name}` : "Zona"}>
                {!z && <Small>Xəritədə zonaya və ya bloka klikləyin.</Small>}
                {z && (
                  <ZoneCard
                    z={z}
                    S={S}
                    onBlocks={
                      view === "zones"
                        ? () => {
                            setView("blocks");
                            setLayer("sol");
                          }
                        : null
                    }
                  />
                )}
              </Card>
            )}
          </>
        }
      />
    </MapWrap>
  );
};

const ZoneCard = ({ z, S, onBlocks }) => (
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
    <h4>Zona proqramı</h4>
    <Recs>
      {z.program.map(([k, n, pp]) => {
        const X = SOL[k];
        return (
          <li key={k}>
            <SolIcon style={{ "--c": `var(${X.color})` }}>
              <X.icon size={14} />
            </SolIcon>
            <div>
              <b>{S.solutions[k].program}</b>
              <span>
                {n} blokda · {fmt(pp)} insan · Qayda {S.solutions[k].rule}
              </span>
            </div>
          </li>
        );
      })}
      {z.level === "yüksək" && (
        <li>
          <Num>3</Num>
          <div>
            <b>Pilot (sınaq) rejimi</b>
            <span>Yüksək ehtiyac: ilk sınaq bu zonada</span>
          </div>
        </li>
      )}
    </Recs>
    {onBlocks && (
      <BlocksBtn type="button" onClick={onBlocks}>
        Bu zonanın bloklarına baxın <ArrowRight size={14} />
      </BlocksBtn>
    )}
    <More to="/qaydalar">
      Qaydaların tam mətni <ArrowRight size={14} />
    </More>
  </ZBody>
);

const BlockCard = ({ p, S, z, city, onZone }) => {
  const sols = (p.sol || "").split(",").filter(Boolean);
  const kids = city ? Math.round((p.pop * city.child_pct_city) / 100) : null;
  const old = city ? Math.round((p.pop * city.old_pct_city) / 100) : null;
  return (
    <ZBody>
      <Human>
        <span>
          <Users size={15} /> <b>{fmt(p.pop)}</b> insan
        </span>
        {kids != null && (
          <span>
            <Baby size={15} /> ~<b>{fmt(kids)}</b> uşaq, ~<b>{fmt(old)}</b> yaşlı
          </span>
        )}
      </Human>
      <Meta>
        <span>
          {p.rayon} · {z ? `zona #${z.rank} ${z.name}` : ""} · {Math.round(p.area_km2 * 100) / 100} km²
        </span>
      </Meta>
      <h4>Bu blok üçün piyada həlləri</h4>
      {sols.length === 0 && <Small>Bu blokda ciddi piyada problemi tapılmadı.</Small>}
      <Sols>
        {sols.map((k, i) => {
          const X = SOL[k];
          return (
            <li key={k} style={{ "--c": `var(${X.color})` }}>
              <SolIcon>
                <X.icon size={16} />
              </SolIcon>
              <div>
                <b>
                  {i + 1}. {S.solutions[k].title}
                </b>
                <span className="why">{why(k, p, S)}</span>
                <span>{X.what}</span>
                <small>
                  Zona: {S.solutions[k].program} · Şəhər: Qayda {S.solutions[k].rule}
                </small>
              </div>
            </li>
          );
        })}
      </Sols>
      <Facts>
        <span>
          Məktəb: <b>{fmt(p.school_m)} m</b>
        </span>
        <span>
          Bağça: <b>{fmt(p.kinder_m)} m</b>
        </span>
        <span>
          Market: <b>{fmt(p.shop_m)} m</b>
        </span>
        <span>
          Park: <b>{fmt(p.park_m)} m</b>
        </span>
      </Facts>
      {z && (
        <BlocksBtn type="button" onClick={onZone}>
          Zona proqramına baxın <ArrowRight size={14} />
        </BlocksBtn>
      )}
    </ZBody>
  );
};

/* ---------- stil ---------- */

const Scales = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  color: var(--text-3);
  span {
    ${card}
    padding: 10px 14px;
    font-size: 13px;
    color: var(--text-2);
  }
  b {
    font-family: var(--font-bold);
    color: var(--accent);
    margin-right: 6px;
  }
`;

const Catalog = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  li {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 3px solid var(--c);
  }
  li > svg {
    color: var(--c);
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 16px;
  }
  p {
    font-size: 13.5px;
    color: var(--text-2);
    line-height: 1.5;
  }
  dl {
    display: grid;
    grid-template-columns: 52px 1fr;
    gap: 4px 8px;
    margin-top: auto;
    font-size: 12.5px;
  }
  dt {
    font-family: var(--font-semibold);
    color: var(--c);
  }
  dd {
    color: var(--text-2);
  }
  a {
    color: var(--accent);
  }
`;

const Human = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 12px;
    background: var(--bg-secondary);
    font-size: 13px;
    color: var(--text-2);
  }
  svg {
    color: var(--accent);
  }
  b {
    font-family: var(--font-bold);
    color: var(--text);
  }
`;

const Sols = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 10px;
  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--c) 8%, var(--bg-secondary));
    border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
  }
  div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  b {
    font-family: var(--font-semibold);
    font-size: 14px;
  }
  span {
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.45;
  }
  .why {
    color: var(--text);
  }
  small {
    font-size: 11.5px;
    color: var(--text-3);
  }
`;

const SolIcon = styled.i`
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 16%, transparent);
`;

const BlocksBtn = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 17px;
  font-family: var(--font-semibold);
  font-size: 13px;
  color: #fff;
  background: var(--grad);
`;

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
