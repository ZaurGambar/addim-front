import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import styled, { keyframes } from "styled-components";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useInView } from "@/components/common/Motion";
import { glass } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { PILOTS } from "@/utils/mock/pilot";
import { GAP_RAMP, RAMP, cssVar, fmt, quantileBreaks } from "@/utils/helpers/format";

// Ana səhifənin tutorial xəritəsi: addım-addım tur. Hər addım xəritəni bir yerə aparır və bir şeyi sadə dillə izah edir.
const CITY = [[40.18, 49.45], [40.62, 50.45]];
const CENTER = [[40.355, 49.8], [40.425, 49.905]];
const AUTOPLAY_MS = 9000;
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
  const coast = useGet("coast", ENDPOINTS.COAST, undefined, opts);
  const all = [rayons, grid, synthGeo, synth, analysis, metro, barriers, underpasses, coast];
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
            metro: metro.data, barriers: barriers.data, underpasses: underpasses.data, coast: coast.data,
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
  const pilotStations = useMemo(
    () => PILOTS.map((p) => ({ p, f: d.metro.features.find((m) => m.properties.name === p.station) })).filter((x) => x.f),
    [d.metro]
  );

  const steps = useMemo(
    () => [
      {
        title: "Bu, Bakıdır",
        text: `Bakı 12 rayondan ibarətdir. Burada ${fmt(C.pop)} insan yaşayır. Turda şəhəri addım-addım gəzəcəyik.`,
        view: CITY,
        legend: null,
      },
      {
        title: "İnsanlar harada yaşayır?",
        text: "Hər kvadrat 1 km × 1 km-dir. Rəng tündləşdikcə orada daha çox insan yaşayır. Ən sıx yerlər mərkəz və onun ətrafıdır.",
        view: CITY,
        legend: ["az insan", "çox insan", RAMP],
      },
      {
        title: "Harada istidir?",
        text: "Yay günü yerin səthi belə qızır. Qırmızı yerlər ən istidir: ağacı az olan kənar qəsəbələr. Mərkəzdəki parklar havanı sərinləşdirir.",
        view: CITY,
        legend: ["sərin", "isti", GAP_RAMP],
      },
      {
        title: "Metro hər yerdə yoxdur",
        text: `Mavi dairələr metroya 10 dəqiqəlik piyada yoludur (800 m). ${C.no_metro_rayons.length} rayonda metro ümumiyyətlə yoxdur. Orada ${fmt(C.pop_no_metro)} insan yaşayır.`,
        view: [[40.3, 49.7], [40.5, 50.05]],
        legend: null,
      },
      {
        title: "Mərkəzdə yolu keçmək çətindir",
        text: "Qırmızı xətlər uzun məsafədə keçidi olmayan geniş yollardır. Narıncı nöqtələr yeraltı keçidlərdir: yolu keçmək üçün pilləkənlə aşağı enmək lazımdır.",
        view: CENTER,
        legend: null,
      },
      {
        title: "Problemlər harada toplanır?",
        text: `8 problemi bir xəritəyə yığdıq: isti, yaşıllıq azlığı, uzaq avtobus və s. Qırmızı kvadratlarda problemlər çoxdur, göy kvadratlarda azdır. Qırmızı yerlərdə ${fmt(d.synth.hot_pop)} insan yaşayır.`,
        view: CITY,
        legend: null,
      },
      {
        title: `Ən çətin yer: ${top.place}`,
        text: `Burada ${fmt(top.pop)} insan yaşayır. Əsas problemlər: ${top.top_layers.map((l) => l[0].toLowerCase()).join(", ")}. Kömək ilk növbədə bura lazımdır.`,
        center: [top.lat, top.lon],
        zoom: 13,
        legend: null,
      },
      {
        title: "Həlli burada sınayırıq",
        text: `${pilotStations.length} sınaq yeri seçdik: ${pilotStations.map((x) => x.p.station).join(", ")}. Yeraltı keçidin yanına adi zebra, kölgə və oturacaq. Nəticə yaxşı olsa, şəhərə yayılacaq.`,
        view: CENTER,
        legend: null,
      },
    ],
    [C, d.synth, top, pilotStations]
  );
  const S = steps[step];
  const last = steps.length - 1;

  // daimi qatlar: sahil və rayon sərhədləri
  useEffect(() => {
    if (!map) return undefined;
    const base = [
      L.geoJSON(d.rayons, { style: () => ({ renderer, color: cssVar("--text-3"), weight: 1, fillColor: cssVar("--land"), fillOpacity: 0.6 }), interactive: false }),
      L.geoJSON(d.coast, { style: () => ({ renderer, color: cssVar("--coast"), weight: 2, interactive: false }) }),
    ];
    base.forEach((l) => l.addTo(map));
    return () => base.forEach((l) => map.removeLayer(l));
  }, [map, renderer, d.rayons, d.coast, dark]);

  // addımın qatları: hər addım+tema üçün bir dəfə qurulur və keşdə saxlanır
  const cache = useRef(new Map());
  const build = useCallback(
    (i) => {
      const layers = [];
      const red = cssVar("--critical");
      const blue = cssVar("--accent");
      const grey = cssVar("--text-3");
      const popCols = RAMP.map((v) => cssVar(v));
      const lstCols = GAP_RAMP.map((v) => cssVar(v));
      const pick = (v, breaks, cols) => {
        let k = 0;
        while (k < breaks.length && v > breaks[k]) k++;
        return cols[Math.min(k, cols.length - 1)];
      };
      const cell = (fill, op) => ({ renderer, stroke: false, fillColor: fill || "#000", fillOpacity: fill ? op : 0 });
      const pin = (hot) => L.divIcon({ className: "", html: `<span class="tour-pin${hot ? " hot" : ""}"></span>`, iconSize: [24, 24], iconAnchor: [12, 12] });

      if (i === 0) {
        layers.push(
          L.geoJSON(d.rayons, {
            style: () => ({ renderer, color: blue, weight: 2, fill: false }),
            interactive: false,
            onEachFeature: (f, l) => l.bindTooltip(f.properties.rayon, { permanent: true, direction: "center", className: "tour-label" }),
          })
        );
      }
      if (i === 1) layers.push(L.geoJSON(d.grid, { style: (f) => cell(f.properties.pop > 0 ? pick(f.properties.pop, popBreaks, popCols) : null, 0.8), interactive: false }));
      if (i === 2) layers.push(L.geoJSON(d.grid, { style: (f) => cell(f.properties.lst == null ? null : pick(f.properties.lst, lstBreaks, lstCols), 0.75), interactive: false }));
      if (i === 3) {
        d.metro.features
          .filter((f) => f.properties.status === "işləyir")
          .forEach((f) => {
            const [lon, lat] = f.geometry.coordinates;
            layers.push(L.circle([lat, lon], { renderer, radius: 800, color: blue, weight: 1, fillColor: blue, fillOpacity: 0.18, interactive: false }));
            layers.push(L.circleMarker([lat, lon], { renderer, radius: 3.5, stroke: false, fillColor: blue, fillOpacity: 1 }).bindTooltip(f.properties.name));
          });
      }
      if (i === 4) {
        layers.push(L.geoJSON(d.barriers, { style: () => ({ renderer, color: red, weight: 4, opacity: 0.85 }), interactive: false }));
        const solid = cssVar("--solid");
        const warn = cssVar("--warn");
        layers.push(L.geoJSON(d.underpasses, { pointToLayer: (f, ll) => L.circleMarker(ll, { renderer, radius: 5, color: solid, weight: 1.5, fillColor: warn, fillOpacity: 1 }), interactive: false }));
      }
      if (i === 5 || i === 6) {
        layers.push(
          L.geoJSON(d.synthGeo, {
            style: (f) => {
              const g = f.properties.gi_cls;
              return cell(g >= 2 ? red : g <= -2 ? blue : grey, g >= 2 || g <= -2 ? 0.75 : 0.12);
            },
            interactive: false,
          })
        );
      }
      if (i === 6) layers.push(L.marker([top.lat, top.lon], { icon: pin(true), interactive: false }));
      if (i === 7) {
        layers.push(L.geoJSON(d.barriers, { style: () => ({ renderer, color: red, weight: 3, opacity: 0.4 }), interactive: false }));
        pilotStations.forEach(({ p, f }) => {
          const [lon, lat] = f.geometry.coordinates;
          layers.push(L.marker([lat, lon], { icon: pin(false) }).bindTooltip(`${p.title}: ${p.station}`, { permanent: true, direction: "top", offset: [0, -12], className: "tour-label" }));
        });
      }
      return layers;
    },
    [renderer, d, popBreaks, lstBreaks, top, pilotStations]
  );

  // kamera əvvəl uçur (yalnız yüngül fon ilə), ağır qat uçuş bitəndən sonra çəkilir
  useEffect(() => {
    if (!map) return undefined;
    const key = `${step}-${dark}`;
    let layers = cache.current.get(key);
    if (!layers) {
      layers = build(step);
      cache.current.set(key, layers);
    }
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      layers.forEach((l) => l.addTo(map));
    };
    const animate = !still();
    map.stop();
    if (animate) map.once("moveend", show);
    if (S.center) map.flyTo(S.center, S.zoom, { animate, duration: 1.4, easeLinearity: 0.2 });
    else map.flyToBounds(S.view, { animate, duration: 1.4, easeLinearity: 0.2, padding: [16, 16] });
    const fallback = setTimeout(show, animate ? 1700 : 0);
    return () => {
      clearTimeout(fallback);
      map.off("moveend", show);
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [map, step, S, dark, build]);

  const go = useCallback((n) => setStep(Math.max(0, Math.min(last, n))), [last]);

  // avtomatik oynatma
  const timer = useRef(null);
  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setTimeout(() => (step < last ? setStep(step + 1) : setPlaying(false)), AUTOPLAY_MS);
    return () => clearTimeout(timer.current);
  }, [playing, step, last]);

  const onKey = (e) => {
    if (e.key === "ArrowRight") go(step + 1);
    if (e.key === "ArrowLeft") go(step - 1);
  };

  return (
    <Frame tabIndex={0} onKeyDown={onKey} aria-label="Bakı turu, addım-addım xəritə">
      <MapEl ref={ref} />
      <Caption key={step} aria-live="polite">
        <Count>
          Addım {step + 1} / {steps.length}
        </Count>
        <h3>{S.title}</h3>
        <p>{S.text}</p>
        {S.legend && (
          <Legend>
            <span>{S.legend[0]}</span>
            <i style={{ background: `linear-gradient(90deg, ${S.legend[2].map((v) => `var(${v})`).join(", ")})` }} />
            <span>{S.legend[1]}</span>
          </Legend>
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
            <Btn type="button" $primary onClick={() => go(0)}>
              <RotateCcw size={16} /> Yenidən
            </Btn>
          )}
          <Btn type="button" onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Dayandır" : "Avtomatik oynat"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </Btn>
        </Controls>
        {playing && <Progress key={`p${step}`} style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />}
      </Caption>
    </Frame>
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
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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
