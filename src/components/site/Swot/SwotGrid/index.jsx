import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import { fmt } from "@/utils/helpers/format";
import { overlap4Pop } from "@/utils/helpers/synth";

const buildSwot = (A, S, summary) => {
  const R = A.rayons;
  const C = A.city;
  const r = (n) => R.find((x) => x.rayon === n) || {};
  const nm = C.no_metro_rayons;
  return [
    { c: "s", h: "Güclü tərəflər", l: "S", items: [
      <>Nəqliyyat əhatəsi: əhalinin <b>{C.transit500_pct}%</b>-i dayanacağa 500 m məsafədədir. Metro gündə <b>{fmt(C.metro_ride_total)}</b> sərnişin daşıyır.</>,
      <>Sıx və qarışıq mərkəz: Nəsimidə <b>{fmt(r("Nəsimi").density)}</b> nəfər/km², <b>{r("Nəsimi").intersections_km2}</b> kəsişmə/km², dalan küçə cəmi <b>{r("Nəsimi").deadend_pct}%</b>.</>,
      <>Mərkəz sərindir: səth temperaturu periferiyaya görə <b>{(r("Qaradağ").lst_mean - r("Nəsimi").lst_mean).toFixed(1)}°C</b> aşağıdır.</>,
      <>Güclü irs və nişanələr: Səbaildə <b>{r("Səbail").heritage}</b> tarixi obyekt, UNESCO İçərişəhər, Dənizkənarı bulvar.</>,
      <>Açıq data ekosistemi (opendata.az: metro, BakuBus, velosiped) və 2025–2028 AI Strategiyası.</>,
    ] },
    { c: "w", h: "Zəif tərəflər", l: "W", items: [
      <><b>{nm.length}</b> rayonda metro yoxdur ({nm.join(", ")}), orada <b>{fmt(C.pop_no_metro)}</b> nəfər yaşayır.</>,
      <>Periferiyada əlçatanlıq aşağıdır: Pirallahıda <b>{r("Pirallahı").transit500_pct}%</b>, Qaradağda <b>{r("Qaradağ").transit500_pct}%</b>.</>,
      <>Qəsəbələrdə şəbəkə qırıqdır: dalan küçə payı <b>{r("Sabunçu").deadend_pct}%</b> (Sabunçu), <b>{r("Suraxanı").deadend_pct}%</b> (Suraxanı).</>,
      <>Mərkəzdə magistral hökmrandır: Səbaildə yolların <b>{r("Səbail").major_share}%</b>-i magistraldır. Mərkəzi zonada piyada indeksi orta hesabla <b>{summary.mean_score}</b>/100-dür.</>,
      <>Yaşıl örtük azdır (<b>{C.green_pct_popw}%</b>). Səbailin <b>{r("Səbail").steep_pct}%</b>-i dik yamacdır.</>,
      <>Sintez: <b>{fmt(S.hot_pop)}</b> nəfər qaynar nöqtələrdə, <b>{fmt(overlap4Pop(S))}</b> nəfər 4+ problemin üst-üstə düşdüyü hücrələrdə yaşayır.</>,
    ] },
    { c: "o", h: "İmkanlar", l: "O", items: [
      <>2026 “Şəhərsalma və Memarlıq İli” və Milli AI Strategiyası siyasi dəstək yaradır.</>,
      <>Metro genişlənir: <b>{summary.metro_building}</b> stansiya tikilir. Hər birinin ətrafında piyada yönümlü TOD planlamaq olar.</>,
      <>Mərkəzin sərinlik modelini (suvarılan yaşıllıq, kölgə) isti periferiyaya köçürmək olar.</>,
      <>Sahil xətti: Xəzər, Pirallahı və Abşeron çimərlikləri bulvar modelinin davamı ola bilər.</>,
      <>Düz relyefli Nərimanov və Nizami (meyl <b>{r("Nərimanov").slope_mean}%</b>) velosiped pilotu üçün ən uyğundur.</>,
      <>Prioritet zona Keşlə tikilməkdə olan metro stansiyalarının yanındadır: stansiya açılmamış TOD planlamaq fürsəti.</>,
    ] },
    { c: "t", h: "Təhdidlər", l: "T", items: [
      <>Seysmik risk: Bakı yüksək seysmik zonadadır, açıq məkan datası yoxdur.</>,
      <>Alçaq sahil: Pirallahının <b>{r("Pirallahı").below_m20_pct}%</b>-i, Səbailin <b>{r("Səbail").below_m20_pct}%</b>-i Xəzər səviyyəsinə yaxındır.</>,
      <>İstilik artır: yay günü səth temperaturu Qaradağda <b>{r("Qaradağ").lst_p90}°C</b>-yə çatır (90-cı persentil).</>,
      <>Avtomobil asılılığı piyadalaşdırmaya qarşı ictimai müqavimət yarada bilər.</>,
      <>Data boşluqları (binalar, gəlir, qəza, yaş) yanlış qərar riskini artırır.</>,
    ] },
  ];
};

const SwotGrid = ({ analysis, synth, summary }) => (
  <Grid>
    {buildSwot(analysis, synth, summary).map((q) => (
      <Quad key={q.c} $c={q.c}>
        <h3>
          {q.h}
          <span>{q.l}</span>
        </h3>
        <ul>
          {q.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </Quad>
    ))}
  </Grid>
);

export default SwotGrid;

const COLORS = { s: "var(--good)", w: "var(--critical)", o: "var(--primary)", t: "var(--serious)" };

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Quad = styled.div`
  ${card}
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: -80px auto auto -60px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: ${({ $c }) => COLORS[$c]};
    filter: blur(70px);
    opacity: 0.18;
    pointer-events: none;
  }
  > * {
    position: relative;
  }

  h3 {
    font-family: var(--font-bold);
    font-size: 22px;
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 12px;
  }
  h3 span {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--text-3);
  }
  ul {
    list-style: disc;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: var(--text-2);
  }
  b {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    color: var(--text);
  }
`;
