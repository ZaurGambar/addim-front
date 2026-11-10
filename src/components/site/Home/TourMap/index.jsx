import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { ChevronLeft, ChevronRight, Compass, Construction, Flame, Footprints, Gauge, Map as MapIcon, MousePointerClick, Pause, Play, RotateCcw, Loader2, Route, Scale, Search, Thermometer, TrainFront, Users, X } from "lucide-react";
import { useInView } from "@/components/common/Motion";
import { glass } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { SERVICES, countPlaces, geocode, walkRoute } from "@/utils/api/twogis";
import { PILOTS } from "@/utils/mock/pilot";
import { GAP_RAMP, RAMP, cssVar, fmt, quantileBreaks } from "@/utils/helpers/format";

// Ana səhifənin tutorial xəritəsi: addım-addım tur. Hər addım xəritəni bir yerə aparır və bir şeyi sadə dillə izah edir.
const CITY = [[40.18, 49.45], [40.62, 50.45]];
const CENTER = [[40.355, 49.8], [40.425, 49.905]];
const AUTOPLAY_MS = 9000;
const QUESTION_MS = 1800;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TourMap = () => {
  const [box, near] = useInView({ threshold: 0, rootMargin: "400px 0px" });
  const opts = { enabled: near };
  const rayons = useGet("bakuRayons", ENDPOINTS.BAKU_RAYONS, undefined, opts);
  const grid = useGet("bakuGrid", ENDPOINTS.BAKU_GRID, undefined, opts);
  const synthGeo = useGet("bakuSynth", ENDPOINTS.BAKU_SYNTH, undefined, opts);
  const synth = useGet("bakuSynthSummary", ENDPOINTS.BAKU_SYNTH_SUMMARY, undefined, opts);
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS, undefined, opts);
  const metro = useGet("metro", ENDPOINTS.METRO, undefined, opts);
  const barriers = useGet("barriers", ENDPOINTS.BARRIERS, undefined, opts);
  const underpasses = useGet("central-underpasses", ENDPOINTS.UNDERPASSES, undefined, opts);
  const all = [rayons, grid, synthGeo, synth, analysis, metro, barriers, underpasses];
  const ready = all.every((q) => q.data);
  const failed = all.some((q) => q.isError);

  return (
    <Wrap ref={box} id="tur">
      {failed && <Msg>Xəritə yüklənmədi. Səhifəni yeniləyin.</Msg>}
      {!failed && !ready && <Msg>Xəritə yüklənir…</Msg>}
      {ready && (
        <Tour
          d={{
            rayons: rayons.data, grid: grid.data, synthGeo: synthGeo.data, synth: synth.data, city: analysis.data.city,
            metro: metro.data, barriers: barriers.data, underpasses: underpasses.data,
          }}
        />
      )}
    </Wrap>
  );
};

export default TourMap;

const Tour = ({ d }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: CITY, minZoom: 9, maxZoom: 16, attribution: "© OpenStreetMap · DSK · Landsat · opendata.az" });
  const dark = useColorScheme();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const top = d.synth.zones[0];
  const C = d.city;

  const popBreaks = useMemo(() => quantileBreaks(d.grid.features.map((f) => (f.properties.pop > 0 ? f.properties.pop : null))), [d.grid]);
  const lstBreaks = useMemo(() => quantileBreaks(d.grid.features.map((f) => f.properties.lst), 4), [d.grid]);
  const needBreaks = useMemo(() => quantileBreaks(d.synthGeo.features.map((f) => f.properties.need)), [d.synthGeo]);
  const qKeys = useMemo(() => Object.keys(d.synth.layers), [d.synth]);
  const nCells = d.synthGeo.features.length;
  const pilotStations = useMemo(
    () => PILOTS.map((p) => ({ p, f: d.metro.features.find((m) => m.properties.name === p.station) })).filter((x) => x.f),
    [d.metro]
  );

  const steps = useMemo(
    () => [
      {
        title: "Bu, Bakıdır",
        text: `Altda şəhərin adi xəritəsidir: küçələr, məhəllələr, dəniz. Bakı 12 rayondan ibarətdir, burada ${fmt(C.pop)} insan yaşayır. Əvvəl şəhəri ölçəcəyik, sonra sistemin necə işlədiyini görəcəksiniz.`,
        view: CITY,
        kinds: ["rayons"],
      },
      {
        title: "İnsanlar harada yaşayır?",
        text: "Hər kvadrat 1 km × 1 km-dir. Rəng tündləşdikcə orada daha çox insan yaşayır. Ən sıx yerlər mərkəz və onun ətrafıdır.",
        view: CITY,
        kinds: ["pop"],
        legend: ["az insan", "çox insan", RAMP],
        flow: 0,
      },
      {
        title: "Harada istidir?",
        text: "Peykdən çəkilmiş yay şəkli: yerin səthi belə qızır. Qırmızı yerlər ən istidir: ağacı az olan kənar qəsəbələr. Parklar havanı sərinləşdirir.",
        view: CITY,
        kinds: ["heat"],
        legend: ["sərin", "isti", GAP_RAMP],
        flow: 0,
      },
      {
        title: "Metro hər yerdə yoxdur",
        text: `Mavi dairələr metroya 10 dəqiqəlik piyada yoludur (800 m). ${C.no_metro_rayons.length} rayonda metro ümumiyyətlə yoxdur. Orada ${fmt(C.pop_no_metro)} insan yaşayır.`,
        view: [[40.3, 49.7], [40.5, 50.05]],
        kinds: ["metro"],
        flow: 0,
      },
      {
        title: "Mərkəzdə yolu keçmək çətindir",
        text: "Qırmızı xətlər uzun məsafədə keçidi olmayan geniş yollardır. Narıncı nöqtələr yeraltı keçidlərdir: yolu keçmək üçün pilləkənlə aşağı enmək lazımdır.",
        view: CENTER,
        kinds: ["barriers"],
        flow: 0,
      },
      {
        title: "Sistem işə düşür: hər yerə 8 sual",
        text: `İndi bütün ölçüləri sistem birləşdirir. Şəhəri ${nCells} kvadrata bölür və hər kvadrata eyni 8 sualı verir. Hər sualda ən pis üçdə bir kvadrat qırmızı olur.`,
        view: CITY,
        cycle: qKeys.map((k) => ({ label: QUESTIONS[k], kinds: [`q:${k}`], legend: Q_LEGEND })),
        prefix: "Sual",
        flow: 1,
      },
      {
        title: "Hər yer bal alır",
        text: "Cavablar toplanır: hər kvadrat 0–100 bal alır. Çox insan yaşayan yerdə bal artır, çünki problem daha çox adama toxunur. Tünd rəng: kömək daha çox lazımdır.",
        view: CITY,
        kinds: ["need"],
        legend: ["az ehtiyac", "çox ehtiyac", RAMP],
        flow: 2,
      },
      {
        title: "Qonşulara baxır: problem ocaqları",
        text: `Tək pis kvadrat təsadüf ola bilər. Sistem hər kvadratın qonşularına da baxır. Ətrafı da pisdirsə, bu, problem ocağıdır (qırmızı). Qırmızı yerlərdə ${fmt(d.synth.hot_pop)} insan yaşayır.`,
        view: CITY,
        kinds: ["problems"],
        legend: PROBLEM_LEGEND,
        flow: 3,
      },
      {
        title: `Ən çətin yer: ${top.place}`,
        text: `Ocaqları "insan sayı × bal" ilə sıralayırıq. Birinci yer: ${top.place}. Burada ${fmt(top.pop)} insan yaşayır. Əsas problemlər: ${top.top_layers.map((l) => l[0].toLowerCase()).join(", ")}.`,
        center: [top.lat, top.lon],
        zoom: 13,
        kinds: ["problems", "top"],
        flow: 3,
      },
      {
        title: "Həlli burada sınayırıq",
        text: `${pilotStations.length} sınaq yeri seçdik: ${pilotStations.map((x) => x.p.station).join(", ")}. Yeraltı keçidin yanına adi zebra, kölgə və oturacaq. Sonra yenidən ölçürük: nəticə yaxşı olsa, həll şəhərə yayılacaq.`,
        view: CENTER,
        kinds: ["barriers", "pilots"],
        flow: 4,
      },
      {
        title: "Sınaq işləsə, qayda olur",
        text: "Həllin bütün şəhərə yayılması üçün qayda lazımdır. Hər qayda bir problemi həll edir. Xəritə qaydanın harada kömək edəcəyini göstərir.",
        view: CITY,
        cycle: RULES,
        cycleMs: RULE_MS,
        prefix: "Qayda",
        tone: "rule",
        link: ["/qaydalar", "Bütün qaydalar"],
        flow: 5,
      },
    ],
    [C, d.synth, top, pilotStations, nCells, qKeys]
  );
  const S = steps[step];
  const last = steps.length - 1;

  // daimi qat: rayon sərhədləri (şəhər xəritəsi altda görünür)
  useEffect(() => {
    if (!map) return undefined;
    const base = L.geoJSON(d.rayons, { style: () => ({ renderer, color: cssVar("--text-3"), weight: 1, opacity: 0.6, dashArray: "4 4", fill: false }), interactive: false });
    base.addTo(map);
    return () => map.removeLayer(base);
  }, [map, renderer, d.rayons, dark]);

  // ---- qat növləri: hər biri bir dəfə qurulur (tema ilə), canlıdır: üstünə gələndə işıqlanır və izah verir ----
  const cache = useRef(new Map());
  const [place, setPlace] = useState(null);
  const build = useCallback(
    (kind) => buildKind(kind, { renderer, d, popBreaks, lstBreaks, needBreaks, top, pilotStations, setPlace }),
    [renderer, d, popBreaks, lstBreaks, needBreaks, top, pilotStations]
  );

  // ---- rejim: tur və ya kəşf ----
  const [mode, setMode] = useState("tour");
  const [kind, setKind] = useState("problems");
  // "8 sual" addımı: suallar özü növbə ilə dəyişir (q = sual nömrəsi)
  const [q, setQ] = useState(0);
  const [qAuto, setQAuto] = useState(true);
  const item = S.cycle ? S.cycle[q % S.cycle.length] : null;
  // kəşf rejimində qaydalar: istifadəçi özü seçir
  const [rule, setRule] = useState(0);
  const kinds = mode === "tour" ? (item ? item.kinds : S.kinds) : kind === "rules" ? RULES[rule].kinds : [kind];
  const cycleMs = S.cycleMs || QUESTION_MS;
  const stepMs = S.cycle ? Math.max(AUTOPLAY_MS, cycleMs * S.cycle.length + 1200) : AUTOPLAY_MS;
  const kindsKey = kinds.join(",");

  useEffect(() => {
    if (mode !== "tour" || !S.cycle || !qAuto) return undefined;
    const t = setInterval(() => setQ((v) => (v + 1) % S.cycle.length), cycleMs);
    return () => clearInterval(t);
  }, [mode, S, qAuto, cycleMs]);

  // kamera: turda hər addımda uçur; kəşfə keçəndə bir dəfə bütün şəhərə qayıdır
  const lastMode = useRef(mode);
  const flying = useRef(false);
  useEffect(() => {
    if (!map) return undefined;
    const animate = !still();
    const opts = { animate, duration: 1.4, easeLinearity: 0.2 };
    let fly = false;
    if (mode === "tour") {
      fly = true;
      map.stop();
      if (S.center) map.flyTo(S.center, S.zoom, opts);
      else map.flyToBounds(S.view, { ...opts, padding: [16, 16] });
    } else if (lastMode.current !== "explore") {
      fly = true;
      map.stop();
      map.flyToBounds(CITY, { ...opts, padding: [16, 16] });
    }
    lastMode.current = mode;
    if (!fly || !animate) return undefined;
    flying.current = true;
    const done = () => (flying.current = false);
    map.once("moveend", done);
    const t = setTimeout(done, 1700);
    return () => {
      clearTimeout(t);
      map.off("moveend", done);
      flying.current = false;
    };
  }, [map, mode, S]);

  // qatlar: uçuş bitəndən sonra çəkilir (uçuş zamanı ağır qat kadrları ləngidir)
  useEffect(() => {
    if (!map) return undefined;
    const layers = kindsKey.split(",").flatMap((k) => {
      const key = `${k}-${dark}`;
      if (!cache.current.has(key)) cache.current.set(key, build(k));
      return cache.current.get(key);
    });
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      layers.forEach((l) => l.addTo(map));
    };
    let fallback;
    if (flying.current) {
      map.once("moveend", show);
      fallback = setTimeout(show, 1700);
    } else show();
    return () => {
      clearTimeout(fallback);
      map.off("moveend", show);
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [map, kindsKey, dark, build]);

  // ---- "Bu yer haqqında": xəritəyə klik ----
  const index = useMemo(
    () =>
      d.grid.features.map((f) => {
        const xs = f.geometry.coordinates[0].map((p) => p[0]);
        const ys = f.geometry.coordinates[0].map((p) => p[1]);
        return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), f.properties];
      }),
    [d.grid]
  );
  const synthById = useMemo(() => new Map(d.synthGeo.features.map((f) => [f.properties.id, f.properties])), [d.synthGeo]);
  const stations = useMemo(() => d.metro.features.filter((f) => f.properties.status === "işləyir"), [d.metro]);
  const clickPin = useRef(null);
  const routeLine = useRef(null);
  const clearMarks = useCallback(() => {
    [clickPin, routeLine].forEach((r) => {
      if (r.current) map?.removeLayer(r.current);
      r.current = null;
    });
  }, [map]);
  // bir nöqtəni yoxlayır: klik və ya axtarış nəticəsi
  const inspect = useCallback(
    (latlng, label) => {
      if (!map) return;
      const { lat, lng } = latlng;
      const hit = index.find(([x0, x1, y0, y1]) => lng >= x0 && lng <= x1 && lat >= y0 && lat <= y1);
      let near = null;
      stations.forEach((f) => {
        const [lon, la] = f.geometry.coordinates;
        const dist = map.distance([lat, lng], [la, lon]);
        if (!near || dist < near.dist) near = { name: f.properties.name, dist, at: [la, lon] };
      });
      const cellP = hit ? hit[4] : null;
      setPlace({ cell: cellP, synth: cellP ? synthById.get(cellP.id) : null, near, at: [lat, lng], label });
      clearMarks();
      clickPin.current = L.circleMarker(latlng, { radius: 7, color: "#fff", weight: 3, fillColor: cssVar("--accent"), fillOpacity: 1, interactive: false }).addTo(map);
    },
    [map, index, synthById, stations, clearMarks]
  );
  useEffect(() => {
    if (!map) return undefined;
    const onClick = (e) => inspect(e.latlng);
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      clearMarks();
    };
  }, [map, inspect, clearMarks]);

  // 2GIS: metroya real piyada yolu və yaxınlıqdakı xidmətlər (yalnız şəhər içində klikdə)
  const [live, setLive] = useState(null);
  const placeAt = place?.at ? place.at.join(",") : "";
  useEffect(() => {
    if (!map || !place?.at || !place.cell?.pop) return undefined;
    let alive = true;
    const at = place.at;
    const near = place.near;
    const want = { key: placeAt, route: null, services: null, failed: false };
    const routeP = near && near.dist < 4000 ? walkRoute(at, near.at).catch(() => null) : Promise.resolve(null);
    const servP = Promise.all(SERVICES.map(([q]) => countPlaces(q, at, 500).catch(() => null)));
    Promise.all([routeP, servP]).then(([route, counts]) => {
      if (!alive) return;
      if (route?.line?.length > 1) {
        if (routeLine.current) map.removeLayer(routeLine.current);
        routeLine.current = L.polyline(route.line, { color: cssVar("--accent"), weight: 5, opacity: 0.9, dashArray: "1 9", lineCap: "round", interactive: false }).addTo(map);
      }
      setLive({ ...want, route, services: counts.every((c) => c == null) ? null : counts, failed: !route && counts.every((c) => c == null) });
    });
    return () => {
      alive = false;
    };
  }, [map, place, placeAt]);

  // 2GIS axtarışı: ünvan və ya yer adı
  const [query, setQuery] = useState("");
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const runSearch = (e) => {
    e.preventDefault();
    const t = query.trim();
    if (t.length < 2) return;
    setSearching(true);
    geocode(t)
      .then((r) => setFound(r))
      .catch(() => setFound([]))
      .finally(() => setSearching(false));
  };
  const pick = (r) => {
    setFound(null);
    setQuery(r.name);
    // kəşfə keçid kameranı şəhərə qaytarmasın: axtarılan yerə uçuruq
    lastMode.current = "explore";
    if (mode === "tour") setMode("explore");
    setPlaying(false);
    map?.stop();
    map?.flyTo([r.lat, r.lon], 15, { animate: !still(), duration: 1.2 });
    inspect(L.latLng(r.lat, r.lon), r.name);
  };

  const closePlace = () => {
    setPlace(null);
    setLive(null);
    clearMarks();
  };

  const go = useCallback(
    (n) => {
      setStep(Math.max(0, Math.min(last, n)));
      setQ(0);
      setQAuto(true);
    },
    [last]
  );

  // avtomatik oynatma
  const timer = useRef(null);
  useEffect(() => {
    if (!playing || mode !== "tour") return undefined;
    // "8 sual" addımında bütün suallar göstərilənə qədər gözləyir
    timer.current = setTimeout(() => (step < last ? go(step + 1) : setPlaying(false)), stepMs);
    return () => clearTimeout(timer.current);
  }, [playing, step, last, mode, stepMs, go]);

  const onKey = (e) => {
    if (mode !== "tour") return;
    if (e.key === "ArrowRight") go(step + 1);
    if (e.key === "ArrowLeft") go(step - 1);
  };
  const K = EXPLORE.find((x) => x.key === kind);

  return (
    <Frame tabIndex={0} onKeyDown={onKey} aria-label="Bakı turu, interaktiv xəritə">
      <MapEl ref={ref} />
      <TopBar>
        <Seg role="tablist" aria-label="Rejim">
          <button type="button" className={mode === "tour" ? "on" : ""} onClick={() => setMode("tour")}>
            <Route size={15} /> Tur
          </button>
          <button
            type="button"
            className={mode === "explore" ? "on" : ""}
            onClick={() => {
              setMode("explore");
              setPlaying(false);
            }}
          >
            <Compass size={15} /> Kəşf et
          </button>
        </Seg>
        <SearchBox onSubmit={runSearch} role="search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFound(null);
            }}
            placeholder="Ünvan və ya yer axtarın"
            aria-label="Ünvan və ya yer axtarın (2GIS)"
          />
          {searching && <Loader2 size={15} className="spin" />}
          {found && (
            <ul>
              {found.length === 0 && <li className="none">Heç nə tapılmadı</li>}
              {found.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => pick(r)}>
                    <b>{r.name}</b>
                    {r.address && r.address !== r.name && <span>{r.address}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SearchBox>
        {mode === "explore" && (
          <Chips>
            {EXPLORE.map((x) => (
              <button key={x.key} type="button" className={kind === x.key ? "on" : ""} onClick={() => setKind(x.key)}>
                <x.icon size={14} /> {x.label}
              </button>
            ))}
          </Chips>
        )}
      </TopBar>

      {place && (
        <PlaceCard>
          <CloseBtn type="button" onClick={closePlace} aria-label="Bağla">
            <X size={16} />
          </CloseBtn>
          <PlaceBody place={place} city={C} layers={d.synth.layers} live={live?.key === placeAt ? live : place.at && place.cell?.pop ? { loading: true } : null} />
        </PlaceCard>
      )}

      {mode === "tour" ? (
        <Caption key={`t${step}`} aria-live="polite" $hide={!!place}>
          <Count>
            Addım {step + 1} / {steps.length}
          </Count>
          {S.flow != null && <Flow at={S.flow} />}
          <h3>{S.title}</h3>
          <p>{S.text}</p>
          {S.cycle && (
            <Questions
              items={S.cycle}
              prefix={S.prefix}
              tone={S.tone}
              at={q % S.cycle.length}
              onPick={(i) => {
                setQ(i);
                setQAuto(false);
              }}
            />
          )}
          {item?.legend && <LegendBar legend={item.legend} />}
          {S.link && (
            <TourLink to={S.link[0]}>
              {S.link[1]} <ChevronRight size={15} />
            </TourLink>
          )}
          {S.legend && <LegendBar legend={S.legend} />}
          {!S.cycle && (
            <Hint>
              <MousePointerClick size={14} /> Xəritədə istənilən yerə klikləyin: o yer haqqında məlumat açılacaq.
            </Hint>
          )}
          <Controls>
            <Btn type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Geri">
              <ChevronLeft size={18} />
            </Btn>
            <Dots>
              {steps.map((s, i) => (
                <button key={s.title} type="button" aria-label={`Addım ${i + 1}: ${s.title}`} className={i === step ? "on" : i < step ? "done" : ""} onClick={() => go(i)} />
              ))}
            </Dots>
            {step < last ? (
              <Btn type="button" $primary onClick={() => go(step + 1)}>
                İrəli <ChevronRight size={18} />
              </Btn>
            ) : (
              <Btn type="button" $primary onClick={() => setMode("explore")}>
                <Compass size={16} /> Özün kəşf et
              </Btn>
            )}
            <Btn type="button" onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Dayandır" : "Avtomatik oynat"}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </Btn>
          </Controls>
          {playing && <Progress key={`p${step}`} style={{ animationDuration: `${stepMs}ms` }} />}
        </Caption>
      ) : (
        <Caption key={`e${kind}`} aria-live="polite" $hide={!!place}>
          <Count>Kəşf et</Count>
          <h3>{K.label}</h3>
          <p>{K.text}</p>
          {kind === "rules" && (
            <>
              <Questions items={RULES} prefix="Qayda" tone="rule" at={rule} onPick={setRule} />
              {RULES[rule].legend && <LegendBar legend={RULES[rule].legend} />}
              <Controls>
                <Btn type="button" onClick={() => setRule((rule + RULES.length - 1) % RULES.length)} aria-label="Əvvəlki qayda">
                  <ChevronLeft size={18} />
                </Btn>
                <Btn type="button" $primary onClick={() => setRule((rule + 1) % RULES.length)}>
                  Növbəti qayda <ChevronRight size={18} />
                </Btn>
                <TourLink to="/qaydalar">
                  Bütün qaydalar <ChevronRight size={15} />
                </TourLink>
              </Controls>
            </>
          )}
          {K.legend && <LegendBar legend={K.legend} />}
          <Hint>
            <MousePointerClick size={14} /> Üstünə gəlin və ya klikləyin. Siçan təkəri ilə yaxınlaşdırmaq üçün əvvəl xəritəyə klikləyin.
          </Hint>
          <Controls>
            <Btn
              type="button"
              onClick={() => {
                setMode("tour");
                setStep(0);
              }}
            >
              <RotateCcw size={15} /> Turu yenidən başlat
            </Btn>
          </Controls>
        </Caption>
      )}
    </Frame>
  );
};

// Qat növünü qurur (komponentdən kənarda: React kompilyatoru üçün sadə, təmiz funksiya)
function buildKind(kind, { renderer, d, popBreaks, lstBreaks, needBreaks, top, pilotStations, setPlace }) {
  const red = cssVar("--critical");
  const blue = cssVar("--accent");
  const grey = cssVar("--text-3");
  const ink = cssVar("--text");
  const popCols = RAMP.map((v) => cssVar(v));
  const lstCols = GAP_RAMP.map((v) => cssVar(v));
  const pick = (v, breaks, cols) => {
    let k = 0;
    while (k < breaks.length && v > breaks[k]) k++;
    return cols[Math.min(k, cols.length - 1)];
  };
  const cell = (fill, op) => ({ renderer, stroke: false, fillColor: fill || "#000", fillOpacity: fill ? op : 0 });
  const tip = { sticky: true, className: "tour-tip", direction: "top", offset: [0, -8] };
  const pin = (hot) => L.divIcon({ className: "", html: `<span class="tour-pin${hot ? " hot" : ""}"></span>`, iconSize: [24, 24], iconAnchor: [12, 12] });
  const polys = (data, style, text) => {
    const g = L.geoJSON(data, {
      style,
      filter: (f) => style(f).fillOpacity > 0,
      onEachFeature: (f, l) => {
        // g hadisə anında oxunur (qurulma zamanı yox)
        l.on("mouseover", () => l.setStyle({ stroke: true, color: ink, weight: 2, opacity: 1 }));
        l.on("mouseout", () => g.resetStyle(l));
        const t = text(f.properties);
        if (t) l.bindTooltip(t, tip);
      },
    });
    return g;
  };

  if (kind === "rayons") {
    const g = L.geoJSON(d.rayons, {
      style: () => ({ renderer, color: blue, weight: 2, fillColor: blue, fillOpacity: 0.04 }),
      onEachFeature: (f, l) => {
        l.bindTooltip(f.properties.rayon, { permanent: true, direction: "center", className: "tour-label" });
        l.on("mouseover", () => l.setStyle({ fillOpacity: 0.2, weight: 3 }));
        l.on("mouseout", () => g.resetStyle(l));
      },
    });
    return [g];
  }
  if (kind.startsWith("q:")) {
    const k = kind.slice(2);
    const name = d.synth.layers[k];
    return [
      polys(
        d.synthGeo,
        (f) => (f.properties["p_" + k] >= 67 ? cell(red, 0.7) : cell(grey, 0.12)),
        (p) => `<b>${QUESTIONS[k] || name}</b><br>${p["p_" + k] >= 67 ? "Bəli: bu yer şəhərin ən pis üçdə birindədir" : "Xeyr, burada bu problem ciddi deyil"}`
      ),
    ];
  }
  if (kind === "need")
    return [
      polys(
        d.synthGeo,
        (f) => cell(pick(f.properties.need, needBreaks, popCols), 0.68),
        (p) => `<b>${p.place || p.rayon}</b><br>Bal: <b>${Math.round(p.need)}</b> / 100 · ${p.overlap} problem eyni yerdə`
      ),
    ];
  if (kind === "pop")
    return [polys(d.grid, (f) => cell(f.properties.pop > 0 ? pick(f.properties.pop, popBreaks, popCols) : null, 0.62), (p) => `Bu kvadratda təxminən <b>${fmt(p.pop)}</b> insan yaşayır`)];
  if (kind === "heat")
    return [polys(d.grid, (f) => cell(f.properties.lst == null ? null : pick(f.properties.lst, lstBreaks, lstCols), 0.6), (p) => (p.lst == null ? null : `Yay günü yer səthi: <b>${p.lst}°C</b>`))];
  if (kind === "metro") {
    const out = [];
    d.metro.features
      .filter((f) => f.properties.status === "işləyir")
      .forEach((f) => {
        const [lon, lat] = f.geometry.coordinates;
        const c = L.circle([lat, lon], { renderer, radius: 800, color: blue, weight: 1, fillColor: blue, fillOpacity: 0.16 });
        c.bindTooltip(`<b>${f.properties.name}</b><br>Bu dairənin içindən metroya 10 dəqiqəyə piyada çatmaq olar`, tip);
        c.on("mouseover", () => c.setStyle({ fillOpacity: 0.35, weight: 2 }));
        c.on("mouseout", () => c.setStyle({ fillOpacity: 0.16, weight: 1 }));
        out.push(c, L.circleMarker([lat, lon], { renderer, radius: 3.5, stroke: false, fillColor: blue, fillOpacity: 1, interactive: false }));
      });
    return out;
  }
  if (kind === "barriers") {
    const solid = cssVar("--solid");
    const warn = cssVar("--warn");
    const g = L.geoJSON(d.barriers, {
      style: () => ({ renderer, color: red, weight: 4, opacity: 0.85 }),
      onEachFeature: (f, l) => {
        l.bindTooltip(`<b>${f.properties.name || "Adsız geniş yol"}</b><br>${fmt(f.properties.len_m)} m boyunca piyada keçidi yoxdur`, tip);
        l.on("mouseover", () => l.setStyle({ weight: 8, opacity: 1 }));
        l.on("mouseout", () => g.resetStyle(l));
      },
    });
    const u = L.geoJSON(d.underpasses, {
      pointToLayer: (f, ll) =>
        L.circleMarker(ll, { renderer, radius: 5, color: solid, weight: 1.5, fillColor: warn, fillOpacity: 1 }).bindTooltip(
          "<b>Yeraltı keçid</b><br>Yolu keçmək üçün pilləkənlə aşağı enmək lazımdır",
          tip
        ),
    });
    return [g, u];
  }
  if (kind === "problems") {
    const layer = d.synth.layers;
    return [
      polys(
        d.synthGeo,
        (f) => {
          const g = f.properties.gi_cls;
          return cell(g >= 2 ? red : g <= -2 ? blue : grey, g >= 2 || g <= -2 ? 0.66 : 0.12);
        },
        (p) => {
          const probs = Object.keys(layer).filter((k) => p["p_" + k] >= 67).map((k) => layer[k].toLowerCase());
          const head = p.gi_cls >= 2 ? "Problemlər burada toplanıb" : p.gi_cls <= -2 ? "Burada vəziyyət yaxşıdır" : "Orta vəziyyət";
          return `<b>${p.place || p.rayon}: ${head}</b><br>${probs.length ? `Problemlər: ${probs.join(", ")}` : "Ciddi problem yoxdur"}`;
        }
      ),
    ];
  }
  if (kind === "top") return [L.marker([top.lat, top.lon], { icon: pin(true), interactive: false })];
  if (kind === "pilots")
    return pilotStations.map(({ p, f }) => {
      const [lon, lat] = f.geometry.coordinates;
      const m = L.marker([lat, lon], { icon: pin(false) }).bindTooltip(`${p.title}: ${p.station}`, { permanent: true, direction: "top", offset: [0, -12], className: "tour-label" });
      m.on("click", () => setPlace({ pilot: p }));
      return m;
    });
  return [];
}

// sadə dildə 8 sual (sintezin 8 qatı)
const QUESTIONS = {
  heat: "Burada çox istidirmi?",
  green_gap: "Ağac, park azdırmı?",
  transit_gap: "Avtobus, metro uzaqdırmı?",
  fragment: "Küçələr qırıqdır, dalan çoxdur?",
  car: "Böyük maşın yolu yaxındırmı?",
  slope: "Yol dikdirmi?",
  lowland: "Yer alçaqdır, su basa bilər?",
  service_gap: "Mağaza, xidmət uzaqdırmı?",
};
const Q_LEGEND = { swatches: [["--critical", "bəli, problem var"], ["--text-3", "xeyr"]] };
const FLOW = ["Ölçürük", "8 sual", "Bal", "Ocaq", "Sınaq", "Qayda"];

// Qayda təklifləri (/qaydalar səhifəsi ilə eyni sıra) və xəritədə harada kömək etdikləri
const RULE_MS = 3200;
const RULE_HELP = { swatches: [["--critical", "qayda burada kömək edər"], ["--text-3", "az lazımdır"]] };
const PROBLEM_LEGEND = { swatches: [["--accent", "yaxşı"], ["--text-3", "orta"], ["--critical", "problem çox"]] };
const RULES = [
  { label: "Piyada keçidi standartı", note: "Keçidlər arası məsafə həddi, yeraltı keçidin yanında zebra. Qırmızı xətlər: keçidsiz geniş yollar.", kinds: ["barriers"] },
  { label: "Məhəllədə 30 km/saat", note: "Böyük maşın yollarının yanındakı məhəllələrdə sürət azalır.", kinds: ["q:car"], legend: RULE_HELP },
  { label: "Pilot (sınaq) rejimi", note: "Müvəqqəti zebra, kölgə, oturacaq: 6–12 ay sadə icazə ilə.", kinds: ["barriers", "pilots"] },
  { label: "Kölgə və yaşıllıq norması", note: "Küçədə minimum ağac, dayanacaqda kölgə, sərin dam.", kinds: ["q:heat"], legend: RULE_HELP },
  { label: "Parkinq qaydaları", note: "Səkidə parkinqə nəzarət, mərkəzdə pullu parkinq.", kinds: ["q:car"], legend: RULE_HELP },
  { label: "Nəqliyyat standartı", note: "Hər evdən dayanacağa ən çox 500 m, avtobus zolağı.", kinds: ["q:transit_gap"], legend: RULE_HELP },
  { label: "“15 dəqiqəlik məhəllə”", note: "Yeni tikinti üçün piyada əlçatanlıq analizi: məktəb, mağaza, dayanacaq.", kinds: ["q:service_gap"], legend: RULE_HELP },
  { label: "Sahil və alçaq ərazilər", note: "Su basa bilən yerlərdə tikinti şərtləri.", kinds: ["q:lowland"], legend: RULE_HELP },
  { label: "Büdcə ehtiyaca görə", note: "İlk pul “insan sayı × bal” ilə ən çətin yerlərə gedir.", kinds: ["need"], legend: ["az ehtiyac", "çox ehtiyac", RAMP] },
  { label: "Açıq məlumat, əvvəl/sonra ölçmə", note: "Hər layihədən əvvəl və sonra ölçülür: sistem hər il yenilənir.", kinds: ["problems"], legend: PROBLEM_LEGEND },
];

const EXPLORE = [
  { key: "rayons", label: "Rayonlar", icon: MapIcon, text: "Bakının 12 rayonu. İstənilən yerə klikləyin: orada neçə insan yaşadığını və nə problem olduğunu görəcəksiniz." },
  { key: "pop", label: "Əhali", icon: Users, text: "Hər kvadrat 1 km × 1 km-dir. Tünd rəng: daha çox insan yaşayır.", legend: ["az insan", "çox insan", RAMP] },
  { key: "heat", label: "İstilik", icon: Thermometer, text: "Yay günü yer səthinin temperaturu. Qırmızı: ən isti yerlər.", legend: ["sərin", "isti", GAP_RAMP] },
  { key: "metro", label: "Metro", icon: TrainFront, text: "Dairənin içindən metroya 10 dəqiqəyə (800 m) piyada çatmaq olar. Dairədən kənarda metro uzaqdır." },
  { key: "barriers", label: "Maneələr", icon: Construction, text: "Qırmızı: uzun məsafədə keçidi olmayan geniş yollar. Narıncı nöqtə: yeraltı keçid." },
  { key: "need", label: "Bal", icon: Gauge, text: "Hər kvadratın balı (0–100): 8 sualın cavabı və orada yaşayan insan sayı. Tünd: kömək daha çox lazımdır.", legend: ["az ehtiyac", "çox ehtiyac", RAMP] },
  { key: "problems", label: "Problemlər", icon: Flame, text: "8 problem bir xəritədə. Qırmızı kvadratlarda problemlər toplanıb, göy kvadratlarda vəziyyət yaxşıdır.", legend: PROBLEM_LEGEND },
  { key: "pilots", label: "Pilotlar", icon: Footprints, text: "Həllin sınanacağı 3 yer. Nöqtəyə klikləyin: orada nə ediləcəyini oxuyun." },
  { key: "rules", label: "Qaydalar", icon: Scale, text: "10 qayda təklifi. Birini seçin: xəritə qaydanın harada kömək edəcəyini göstərəcək." },
];

// Sistemin axını: hansı mərhələdəyik
const Flow = ({ at }) => (
  <FlowRow aria-label={`Sistem: ${FLOW[at]} mərhələsi`}>
    {FLOW.map((t, i) => (
      <li key={t} className={i === at ? "on" : i < at ? "done" : ""}>
        <span>{i + 1}</span>
        {t}
      </li>
    ))}
  </FlowRow>
);

const Questions = ({ items, prefix, tone, at, onPick }) => (
  <QBox className={tone}>
    <strong key={at}>
      {prefix} {at + 1}/{items.length}: {items[at].label}
      {items[at].note && <em>{items[at].note}</em>}
    </strong>
    <div>
      {items.map((it, i) => (
        <button key={it.label} type="button" className={i === at ? "on" : i < at ? "done" : ""} onClick={() => onPick(i)} aria-label={it.label} />
      ))}
    </div>
  </QBox>
);

const LegendBar = ({ legend }) =>
  legend.swatches ? (
    <Legend>
      {legend.swatches.map(([v, t]) => (
        <span key={v} className="sw">
          <em style={{ background: `var(${v})` }} />
          {t}
        </span>
      ))}
    </Legend>
  ) : (
    <Legend>
      <span>{legend[0]}</span>
      <i style={{ background: `linear-gradient(90deg, ${legend[2].map((v) => `var(${v})`).join(", ")})` }} />
      <span>{legend[1]}</span>
    </Legend>
  );

const PlaceBody = ({ place, city, layers, live }) => {
  if (place.pilot) {
    const p = place.pilot;
    return (
      <>
        <small>Sınaq yeri · {p.where}</small>
        <h4>{p.title}</h4>
        <p>{p.text}</p>
      </>
    );
  }
  const c = place.cell;
  if (!c || (!c.pop && c.lst == null)) {
    return (
      <>
        <small>Bu yer haqqında</small>
        <h4>Burada məlumat yoxdur</h4>
        <p>Bu, dəniz və ya boş ərazidir. Şəhərin içində bir yerə klikləyin.</p>
      </>
    );
  }
  const s = place.synth;
  const probs = s ? Object.keys(layers).filter((k) => s["p_" + k] >= 67).map((k) => layers[k]) : [];
  const mins = place.near ? Math.round(place.near.dist / 75) : null;
  const hotter = c.lst != null ? Math.round((c.lst - city.lst_popw) * 10) / 10 : null;
  const verdict = !s ? null : s.gi_cls >= 2 ? ["bad", "Problemlər burada toplanıb"] : s.gi_cls <= -2 ? ["ok", "Burada vəziyyət yaxşıdır"] : ["mid", "Orta vəziyyət"];
  return (
    <>
      <small>Bu yer haqqında · {c.rayon}</small>
      <h4>{place.label || s?.place || c.rayon}</h4>
      {verdict && <Verdict className={verdict[0]}>{verdict[1]}</Verdict>}
      <Facts>
        <li>
          <Users size={15} />
          <span>
            Burada (1 km²) təxminən <b>{fmt(c.pop)}</b> insan yaşayır
          </span>
        </li>
        {c.lst != null && (
          <li>
            <Thermometer size={15} />
            <span>
              Yay günü yer səthi <b>{c.lst}°C</b>: şəhər ortasından {hotter >= 0 ? `${hotter}° isti` : `${-hotter}° sərin`}
            </span>
          </li>
        )}
        {place.near && (
          <li>
            <TrainFront size={15} />
            <span>
              Ən yaxın metro: <b>{place.near.name}</b>,{" "}
              {live?.route ? (
                <>
                  piyada yolu <b>{Math.round(live.route.duration / 60)} dəqiqə</b> ({fmt(live.route.distance)} m)
                </>
              ) : mins <= 30 ? (
                <>
                  piyada təxminən <b>{mins} dəqiqə</b>
                </>
              ) : (
                <>
                  <b>{(place.near.dist / 1000).toFixed(1)} km</b> uzaqda
                </>
              )}
            </span>
          </li>
        )}
        <li>
          <Flame size={15} />
          <span>{probs.length ? <>Problemlər: <b>{probs.join(", ").toLowerCase()}</b></> : s ? "Ciddi problem yoxdur" : "Burada az insan yaşayır, problemlər yoxlanmayıb"}</span>
        </li>
      </Facts>
      {live?.loading && (
        <LiveNote>
          <Loader2 size={14} className="spin" /> 2GIS-dən yaxınlıqdakı yerlər yüklənir…
        </LiveNote>
      )}
      {live?.services && (
        <>
          <SubHead>500 m-də (~7 dəq piyada) nə var</SubHead>
          <Services>
            {SERVICES.map(([q, label], i) => {
              const n = live.services[i];
              return (
                <li key={q} className={n === 0 ? "zero" : ""}>
                  <b>{n == null ? "?" : n > 99 ? "99+" : n}</b>
                  {label}
                </li>
              );
            })}
          </Services>
        </>
      )}
      {(live?.services || live?.route) && <LiveNote>Mənbə: 2GIS. Xəritədəki nöqtəli xətt metroya real piyada yoludur.</LiveNote>}
      {live?.failed && <LiveNote>2GIS məlumatı indi alınmadı.</LiveNote>}
    </>
  );
};

/* ---------- stil ---------- */

const Wrap = styled.div`
  scroll-margin-top: 80px;
  min-height: 560px;
  @media (max-width: 760px) {
    min-height: 640px;
  }
`;

const Msg = styled.p`
  ${glass}
  border-radius: var(--r);
  min-height: 560px;
  display: grid;
  place-items: center;
  color: var(--text-3);
`;

const Frame = styled.div`
  position: relative;
  height: 600px;
  border-radius: var(--r);
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  outline: none;
  isolation: isolate;

  &:focus-visible {
    box-shadow: 0 0 0 3px var(--accent-soft), var(--shadow);
  }
  .tour-label {
    background: var(--glass);
    border: 0;
    box-shadow: none;
    font-family: var(--font-semibold);
    font-size: 11px;
    color: var(--text);
    padding: 2px 6px;
    border-radius: 8px;
  }
  .tour-label::before {
    display: none;
  }
  .tour-tip {
    background: color-mix(in srgb, var(--solid) 96%, transparent);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    color: var(--text);
    font-family: var(--font);
    font-size: 12.5px;
    line-height: 1.45;
    padding: 7px 10px;
    max-width: 260px;
    white-space: normal;
  }
  .tour-tip b {
    font-family: var(--font-semibold);
  }
  .tour-tip::before {
    display: none;
  }
  .leaflet-interactive {
    cursor: pointer;
  }
  .tour-pin {
    display: block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent);
    border: 4px solid #fff;
    animation: ${keyframes`
      0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent); }
      100% { box-shadow: 0 0 0 22px transparent; }
    `} 1.6s ease-out infinite;
  }
  .tour-pin.hot {
    background: var(--critical);
    animation-name: ${keyframes`
      0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--critical) 60%, transparent); }
      100% { box-shadow: 0 0 0 30px transparent; }
    `};
  }
  @media (max-width: 760px) {
    height: 640px;
    /* alt xəritə düyməsi aşağıdakı kartın altında qalmasın */
    .leaflet-bottom.leaflet-right {
      bottom: auto;
      top: 100px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tour-pin {
      animation: none;
    }
  }
`;

const MapEl = styled.div`
  position: absolute;
  inset: 0;
  background: var(--sea);
`;

const capIn = keyframes`
  from {
    opacity: 0;
    translate: 0 12px;
  }
`;

const TopBar = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 600;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  pointer-events: none;
  > * {
    pointer-events: auto;
  }
`;

const Seg = styled.div`
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--solid) 94%, transparent);
  border: 1px solid var(--line);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    border-radius: 16px;
    font-family: var(--font-semibold);
    font-size: 13px;
    color: var(--text-3);
    transition: background 0.2s, color 0.2s;
  }
  button.on {
    color: #fff;
    background: var(--grad);
  }
`;

const Chips = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  max-width: 100%;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  button {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border-radius: 16px;
    font-family: var(--font-semibold);
    font-size: 12.5px;
    color: var(--text);
    background: color-mix(in srgb, var(--solid) 94%, transparent);
    border: 1px solid var(--line);
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  button:hover {
    border-color: var(--accent);
  }
  button.on {
    color: #fff;
    background: var(--accent);
    border-color: transparent;
  }
`;

const placeIn = keyframes`
  from {
    opacity: 0;
    translate: 12px 0;
  }
`;
const PlaceCard = styled.aside`
  position: absolute;
  top: 60px;
  right: 12px;
  z-index: 650;
  width: min(320px, calc(100% - 24px));
  max-height: calc(100% - 76px);
  overflow-y: auto;
  border-radius: 20px;
  padding: 16px;
  background: color-mix(in srgb, var(--solid) 96%, transparent);
  border: 1px solid var(--line);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: ${placeIn} 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both;

  small {
    font-family: var(--font-semibold);
    font-size: 12px;
    color: var(--accent);
    padding-right: 28px;
  }
  h4 {
    font-family: var(--font-bold);
    font-size: 18px;
    letter-spacing: -0.02em;
    padding-right: 28px;
  }
  p {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-2);
  }
  @media (max-width: 760px) {
    top: auto;
    bottom: 10px;
    left: 10px;
    right: 10px;
    width: auto;
    max-height: 60%;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--text-2);
  background: var(--bg-secondary);
  &:hover {
    color: var(--text);
  }
`;

const Verdict = styled.span`
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: 11px;
  font-family: var(--font-semibold);
  font-size: 12px;
  &.bad {
    color: var(--critical);
    background: color-mix(in srgb, var(--critical) 15%, transparent);
  }
  &.ok {
    color: var(--good);
    background: color-mix(in srgb, var(--good) 15%, transparent);
  }
  &.mid {
    color: var(--text-2);
    background: var(--bg-secondary);
  }
`;

const Facts = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;

  li {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    font-size: 13.5px;
    line-height: 1.45;
    color: var(--text-2);
  }
  svg {
    flex: none;
    margin-top: 2px;
    color: var(--accent);
  }
  b {
    font-family: var(--font-semibold);
    color: var(--text);
  }
`;

const SearchBox = styled.form`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 12px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--solid) 94%, transparent);
  border: 1px solid var(--line);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  flex: 0 1 260px;
  min-width: 0;
  color: var(--text-3);
  &:focus-within {
    border-color: var(--accent);
  }
  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--text);
    font-family: var(--font);
    font-size: 13.5px;
  }
  .spin {
    animation: ${keyframes`to { transform: rotate(360deg); }`} 0.9s linear infinite;
  }
  ul {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    min-width: 260px;
    padding: 6px;
    border-radius: 16px;
    background: var(--solid);
    border: 1px solid var(--line);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  li.none {
    padding: 8px 10px;
    font-size: 13px;
  }
  li button {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 8px 10px;
    border-radius: 10px;
  }
  li button:hover,
  li button:focus-visible {
    background: var(--bg-secondary);
  }
  li b {
    font-family: var(--font-semibold);
    font-size: 13.5px;
    color: var(--text);
  }
  li span {
    font-size: 12px;
    color: var(--text-3);
  }
  @media (max-width: 760px) {
    flex: 1 1 100%;
    order: 3;
  }
`;

const SubHead = styled.span`
  font-family: var(--font-semibold);
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
`;

const Services = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 6px;
  li {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 7px 9px;
    border-radius: 12px;
    background: var(--bg-secondary);
    font-size: 12px;
    color: var(--text-2);
  }
  b {
    font-family: var(--font-bold);
    font-size: 17px;
    color: var(--text);
  }
  li.zero b {
    color: var(--critical);
  }
`;

const LiveNote = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-3);
  .spin {
    animation: ${keyframes`to { transform: rotate(360deg); }`} 0.9s linear infinite;
  }
`;

const Hint = styled.div`
  display: flex;
  gap: 6px;
  align-items: flex-start;
  font-size: 12.5px;
  color: var(--text-3);
  svg {
    flex: none;
    margin-top: 1px;
    color: var(--accent);
  }
`;

const Caption = styled.div`
  ${glass}
  background: color-mix(in srgb, var(--solid) 94%, transparent);
  /* xəritənin üstündə bulanıqlıq hər kadrda yenidən hesablanır: söndürülüb */
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 500;
  width: min(420px, calc(100% - 32px));
  border-radius: 22px;
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: ${capIn} 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  overflow: hidden;

  h3 {
    font-family: var(--font-bold);
    font-size: 19px;
    letter-spacing: -0.02em;
  }
  p {
    font-size: 14.5px;
    line-height: 1.5;
    color: var(--text-2);
  }
  @media (max-width: 760px) {
    left: 10px;
    right: 10px;
    bottom: 10px;
    width: auto;
    display: ${({ $hide }) => ($hide ? "none" : "flex")};
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const FlowRow = styled.ol`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  li {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 9px 0 4px;
    border-radius: 12px;
    font-family: var(--font-semibold);
    font-size: 11.5px;
    color: var(--text-3);
    background: var(--bg-secondary);
    transition: background 0.3s, color 0.3s;
  }
  li span {
    width: 17px;
    height: 17px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 10px;
    background: var(--line);
    color: var(--text-2);
  }
  li.done {
    color: var(--accent);
  }
  li.done span {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    color: var(--accent);
  }
  li.on {
    color: #fff;
    background: var(--grad);
    box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent);
  }
  li.on span {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
  }
`;

const qIn = keyframes`
  from {
    opacity: 0;
    translate: 0 6px;
  }
`;
const QBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  --q: var(--critical);
  background: color-mix(in srgb, var(--q) 10%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, var(--q) 30%, transparent);
  strong {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-family: var(--font-bold);
    font-size: 15px;
    color: var(--text);
    animation: ${qIn} 0.35s ease-out both;
  }
  em {
    font-style: normal;
    font-family: var(--font);
    font-size: 13px;
    line-height: 1.45;
    color: var(--text-2);
  }
  &.rule {
    --q: var(--good);
  }
  div {
    display: flex;
    gap: 5px;
  }
  button {
    flex: 1;
    height: 6px;
    border-radius: 99px;
    background: var(--line);
    transition: background 0.3s;
  }
  button.done {
    background: color-mix(in srgb, var(--q) 45%, transparent);
  }
  button.on {
    background: var(--q);
  }
  @media (prefers-reduced-motion: reduce) {
    strong {
      animation: none;
    }
  }
`;

const TourLink = styled(Link)`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-semibold);
  font-size: 13.5px;
  color: var(--accent);
`;

const Count = styled.span`
  font-family: var(--font-semibold);
  font-size: 12px;
  color: var(--accent);
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-3);
  i {
    flex: 1;
    height: 8px;
    border-radius: 99px;
  }
  .sw {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .sw em {
    width: 12px;
    height: 12px;
    border-radius: 4px;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  min-width: 36px;
  padding: ${({ $primary }) => ($primary ? "0 14px" : "0")};
  border-radius: 18px;
  font-family: var(--font-semibold);
  font-size: 13px;
  color: ${({ $primary }) => ($primary ? "#fff" : "var(--text)")};
  background: ${({ $primary }) => ($primary ? "var(--grad)" : "var(--bg-secondary)")};
  border: 1px solid ${({ $primary }) => ($primary ? "transparent" : "var(--line)")};
  box-shadow: ${({ $primary }) => ($primary ? "0 6px 18px color-mix(in srgb, var(--accent) 35%, transparent)" : "none")};
  transition: transform 0.08s, filter 0.15s;

  &:active:not(:disabled) {
    transform: scale(0.96);
  }
  &:disabled {
    opacity: 0.4;
  }
`;

const Dots = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 5px;

  button {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background: var(--line);
    transition: width 0.3s, background 0.3s;
  }
  button.done {
    background: color-mix(in srgb, var(--accent) 50%, transparent);
  }
  button.on {
    width: 22px;
    background: var(--accent);
  }
`;

const bar = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;
const Progress = styled.i`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: var(--grad);
  transform-origin: left;
  animation: ${bar} linear both;
`;
