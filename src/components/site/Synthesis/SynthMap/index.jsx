import { useEffect, useState } from "react";
import L from "leaflet";
import Card from "@/components/common/Card";
import Dropdown from "@/components/common/Dropdown";
import { RampLegend, SwatchLegend } from "@/components/common/Legend";
import MapLayout, { InfoList, MapBox } from "@/components/site/common/MapLayout";
import { useColorScheme, useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { cssVar, divColor, fmt, prefersReducedMotion, RAMP, scoreBin } from "@/utils/helpers/format";
import { overlap4Pop, typeInfo } from "@/utils/helpers/synth";

const BOUNDS = [[40.2, 49.5], [40.6, 50.4]];

const overlapColor = (o) => (o <= 1 ? cssVar("--panel-2") : o === 2 ? cssVar("--g1") : o === 3 ? cssVar("--g2") : o === 4 ? cssVar("--g3") : cssVar("--g4"));
const giColor = (g) => (g >= 3 ? divColor(-1) : g === 2 ? divColor(-0.7) : g === 1 ? divColor(-0.4) : g <= -3 ? divColor(1) : g === -2 ? divColor(0.7) : g === -1 ? divColor(0.4) : cssVar("--d-mid"));

const SynthMap = ({ synth, summary, rayons, focus }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, maxZoom: 15, attribution: "© OpenStreetMap · WorldPop · Landsat · SRTM" });
  const dark = useColorScheme();
  const [mode, setMode] = useState("overlap");
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!map) return undefined;
    const style = (p) => {
      if (mode === "overlap") return overlapColor(p.overlap);
      if (mode === "gi") return giColor(p.gi_cls);
      if (mode === "type") return cssVar(`--t${p.type}`);
      const v = mode === "need" ? (p.need - 20) * 2 : p[mode];
      return cssVar(RAMP[scoreBin(Math.max(0, Math.min(100, v)))]);
    };
    const outline = L.geoJSON(rayons, { style: () => ({ renderer, color: cssVar("--text-3"), weight: 1, fill: false, opacity: 0.6 }), interactive: false });
    const cells = L.geoJSON(synth, {
      style: (f) => ({ renderer, stroke: false, fillColor: style(f.properties), fillOpacity: 0.85 }),
      onEachFeature: (f, l) => l.on("click", () => setInfo(f.properties)),
    });
    outline.addTo(map);
    cells.addTo(map);
    return () => {
      map.removeLayer(outline);
      map.removeLayer(cells);
    };
  }, [map, renderer, synth, rayons, mode, dark]);

  useEffect(() => {
    if (map && focus) map.flyTo([focus.lat, focus.lon], 13, { duration: prefersReducedMotion() ? 0 : 0.8 });
  }, [map, focus]);

  const options = [
    { value: "overlap", label: "Üst-üstə düşən problem sayı" },
    { value: "gi", label: "Qaynar nöqtələr (Getis-Ord Gi*)" },
    { value: "type", label: "Məhəllə tipləri" },
    { value: "need", label: "Ehtiyac indeksi" },
    { group: "Problem qatları", options: Object.entries(summary.layers).map(([k, v]) => ({ value: `p_${k}`, label: v })) },
  ];

  let legend;
  if (mode === "overlap") {
    legend = (
      <>
        <SwatchLegend
          title="Ən pis üçdə birlikdə olan qat sayı"
          items={[["0–1", overlapColor(1)], ["2", overlapColor(2)], ["3", overlapColor(3)], ["4", overlapColor(4)], ["5 və çox", overlapColor(5)]].map(([label, color]) => ({ label, color }))}
        />
        <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-3)" }}>{fmt(overlap4Pop(summary))} nəfər 4 və daha çox problemin üst-üstə düşdüyü hücrələrdə yaşayır.</p>
      </>
    );
  } else if (mode === "gi") {
    legend = (
      <SwatchLegend
        title="Getis-Ord Gi* (ehtiyac indeksi üzrə)"
        items={[[3, "Qaynar nöqtə, 99%"], [2, "Qaynar nöqtə, 95%"], [1, "Qaynar nöqtə, 90%"], [0, "Əhəmiyyətsiz"], [-1, "Soyuq nöqtə, 90%"], [-2, "Soyuq nöqtə, 95%"], [-3, "Soyuq nöqtə, 99%"]].map(([g, label]) => ({ label, color: giColor(g) }))}
      />
    );
  } else if (mode === "type") {
    legend = <SwatchLegend title={`Məhəllə tipləri (k-means, k = ${summary.k})`} items={summary.types.map((t, i) => ({ label: `${typeInfo(summary, i).name} · ${fmt(t.pop)}`, color: cssVar(`--t${i}`) }))} />;
  } else {
    legend = <RampLegend title={mode === "need" ? "Ehtiyac indeksi" : `${summary.layers[mode.slice(2)]} (faiz rank)`} labels={["aşağı", "yüksək"]} />;
  }

  return (
    <MapLayout
      map={<MapBox ref={ref} role="region" aria-label="Sintez xəritəsi" />}
      side={
        <>
          <Card>
            <Dropdown id="synth-mode" label="Göstər" value={mode} onChange={setMode} options={options} />
            <div style={{ marginTop: 14 }}>{legend}</div>
          </Card>
          <Card title={info ? `${info.place} · ${info.rayon || "–"}` : "Hücrə"}>
            {!info ? (
              <p style={{ fontSize: 13, color: "var(--text-2)" }}>Xəritədə hücrəyə klikləyin.</p>
            ) : (
              <InfoList>
                <dt>Əhali</dt>
                <dd>{fmt(info.pop)}</dd>
                <dt>Tip</dt>
                <dd>{typeInfo(summary, info.type).name}</dd>
                <dt>Üst-üstə problem</dt>
                <dd>{info.overlap} / 8</dd>
                <dt>Ehtiyac indeksi</dt>
                <dd>{info.need}</dd>
                <dt>Gi* z</dt>
                <dd>{info.gi}</dd>
                <dt>Dayanacağa</dt>
                <dd>{fmt(info.transit_m)} m</dd>
                <dt>Dalan küçə</dt>
                <dd>{info.deadend ?? "–"}%</dd>
                <dt>Səth temp.</dt>
                <dd>{info.lst} °C</dd>
                {Object.entries(summary.layers).map(([k, v]) => (
                  <InfoPair key={k} a={v} b={info[`p_${k}`]} />
                ))}
              </InfoList>
            )}
          </Card>
        </>
      }
    />
  );
};

const InfoPair = ({ a, b }) => (
  <>
    <dt>{a}</dt>
    <dd>{b}</dd>
  </>
);

export default SynthMap;
