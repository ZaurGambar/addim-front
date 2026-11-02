import styled from "styled-components";
import { card } from "@/styles/common/mixins";

const SOURCES = ["OSM / GeoJSON xəritə", "BakıKart, metro turniketi", "Edge kamera (anonim say)", "BakuBus küçə görüntüləri", "Peyk: istilik, ağac örtüyü", "Hava proqnozu, yağış", "Vətəndaş müraciətləri"];
const MODS = ["M1 Axın proqnozu", "M2 Adaptiv keçid", "M3 Səki auditi (CV)", "M4 İstilik və kölgə", "M5 Ssenari simulyatoru", "M6 Müraciət NLP (AZ)", "M7 Sel xəbərdarlığı", "M8 İnvestisiya prioriteti"];

const Architecture = () => (
  <Box role="img" aria-label="ADDIM arxitekturası: data mənbələri, platforma, AI modulları, insan təsdiqi və nəticələr">
    <svg viewBox="0 0 1000 380">
      <text className="hdr" x="20" y="22">DATA MƏNBƏLƏRİ</text>
      <text className="hdr" x="268" y="22">PLATFORMA</text>
      <text className="hdr" x="490" y="22">AI MODULLARI</text>
      <text className="hdr" x="740" y="22">İNSAN · NƏTİCƏ</text>
      {SOURCES.map((t, i) => (
        <g key={t}>
          <rect className="box" x="20" y={38 + i * 42} width="200" height="34" rx="6" />
          <text className="lbl" x="32" y={60 + i * 42}>{t}</text>
          <path className="edge" d={`M220 ${55 + i * 42} C245 ${55 + i * 42} 245 ${150 + i * 13} 268 ${150 + i * 13}`} />
        </g>
      ))}
      <rect className="core" x="268" y="110" width="176" height="150" rx="8" />
      {["Şəhər data gölü", "PostGIS + GeoJSON API", "Rəqəmsal əkiz", "Etibarlılıq balı", "Alqoritm reyestri"].map((t, i) => (
        <text key={t} className={i ? "lbl" : "lbl b"} x="282" y={140 + i * 22}>{t}</text>
      ))}
      {MODS.map((t, i) => (
        <g key={t}>
          <rect className="box" x="490" y={38 + i * 36} width="210" height="30" rx="6" />
          <text className="lbl" x="502" y={58 + i * 36}>{t}</text>
          <path className="edge" d={`M444 185 C470 185 470 ${53 + i * 36} 490 ${53 + i * 36}`} />
        </g>
      ))}
      <rect className="human" x="740" y="120" width="120" height="130" rx="8" />
      {["Operator", "AI təklif edir,", "insan təsdiq edir", "Audit jurnalı"].map((t, i) => (
        <text key={t} className={i ? "lbl" : "lbl b"} x="752" y={150 + i * 21}>{t}</text>
      ))}
      <path className="edge" d="M700 53 C720 53 720 150 740 150" />
      <path className="edge" d="M700 197 L740 197" />
      <path className="edge" d="M700 305 C720 305 720 230 740 230" />
      {[["BNA paneli", "svetoforlar", 60], ["Planlama", "paneli", 158], ["Vətəndaş", "tətbiqi", 256]].map(([a, b, y]) => (
        <g key={a}>
          <rect className="box" x="880" y={y} width="104" height="54" rx="6" />
          <text className="lbl" x="890" y={y + 22}>{a}</text>
          <text className="lbl" x="890" y={y + 42}>{b}</text>
        </g>
      ))}
      <path className="edge" d="M860 160 C870 160 870 87 880 87" />
      <path className="edge" d="M860 185 L880 185" />
      <path className="edge" d="M860 215 C870 215 870 283 880 283" />
      <text className="hdr" x="268" y="290">ƏKS ƏLAQƏ: nəticələr</text>
      <text className="hdr" x="268" y="306">modelləri yenidən öyrədir</text>
      <path className="edge" d="M932 320 C932 360 356 360 356 312" strokeDasharray="4 4" />
    </svg>
  </Box>
);

export default Architecture;

const Box = styled.div`
  overflow-x: auto;
  ${card}

  svg {
    min-width: 860px;
    width: 100%;
    height: auto;
  }
  .lbl {
    font-size: 13px;
    fill: var(--text);
  }
  .b {
    font-family: var(--font-semibold);
  }
  .hdr {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    fill: var(--text-3);
  }
  .box {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .core {
    fill: var(--primary-soft);
    stroke: var(--primary);
  }
  .human {
    fill: color-mix(in srgb, var(--serious) 15%, transparent);
    stroke: var(--serious);
  }
  .edge {
    stroke: var(--text-3);
    stroke-width: 1.2;
    fill: none;
  }
`;
