import styled from "styled-components";
import { card, pill, tone } from "@/styles/common/mixins";
import { BAKU_META } from "@/utils/mock/baku";
import { fmt, fmtN } from "@/utils/helpers/format";

const buildThemes = (R, C) => {
  const r = (n) => R.find((x) => x.rayon === n) || {};
  return [
    { t: "Demoqrafiya", src: "WorldPop 2020 · DSK 2026", m: ["density", "disabled_per1000", "g:pop"],
      var: `Mərkəz çox sıxdır: Nəsimidə ${fmt(r("Nəsimi").density)}, Yasamalda ${fmt(r("Yasamal").density)} nəfər/km². Bu, piyada şəhəri üçün kifayət qədər kritik kütlədir.`,
      yox: `Yaş strukturu rayonlar üzrə açıq data kimi yoxdur. WorldPop bütün rayonlara eyni payı verir: uşaqlar ${C.child_pct_city}%, 65+ ${C.old_pct_city}%.`,
      dq: `Əhalinin üçdə biri periferiyadadır: Sabunçu (${fmt(r("Sabunçu").pop)}), Binəqədi (${fmt(r("Binəqədi").pop)}). Əlillik ən yüksək Suraxanıda (${r("Suraxanı").disabled_per1000}/1000) və Xəzərdədir (${r("Xəzər").disabled_per1000}/1000). Bu rayonlar həm də ən zəif nəqliyyatlı rayonlardır.` },
    { t: "Sosial-iqtisadi", src: "OSM · WorldPop", m: ["poi_km2", "office_per1000", "mix_index"],
      var: `Mərkəzi rayonlarda qarışıq istifadə yüksəkdir: Nəsimi, Yasamal, Nərimanov və Nizamidə indeks ${r("Nəsimi").mix_index}-dir.`,
      yox: "Rayonlar üzrə gəlir, əmək haqqı və mənzil qiyməti açıq data kimi yoxdur. DSK bunları yalnız “Bakı şəhəri – cəmi” üzrə verir.",
      dq: `Ofislər Nərimanovda (${r("Nərimanov").office_per1000}/1000), turizm Səbaildə (${r("Səbail").tourism_beds} mehmanxana) toplanıb. Obyekt sıxlığı Nəsimidə ${fmtN(r("Nəsimi").poi_km2)}/km², Qaradağda ${fmtN(r("Qaradağ").poi_km2)}/km².` },
    { t: "Topoqrafiya", src: "SRTM 30 m", m: ["elev_mean", "steep_pct", "g:slope"],
      var: `Nərimanov və Nizami düzənlikdir: orta meyl ${r("Nərimanov").slope_mean}% və ${r("Nizami").slope_mean}%. Piyada və velosiped üçün ən uyğun relyef buradadır.`,
      yox: `Səbailin ${r("Səbail").steep_pct}%-i dikdir (meyl > 15%). Amfiteatr relyefi yuxarı məhəllələri sahildən ayırır.`,
      dq: `Hündürlük ${r("Pirallahı").elev_min} m-dən (sahil, dəniz səviyyəsindən aşağı) ${r("Qaradağ").elev_max} m-ə qədər dəyişir. Universal dizayn üçün yamaclar əsas maneədir.` },
    { t: "Küçə şəbəkəsi", src: "OSM, 77 min yol", m: ["intersections_km2", "deadend_pct", "major_share"],
      var: `Mərkəzdə şəbəkə sıx və bağlıdır: Nəsimidə ${r("Nəsimi").intersections_km2} kəsişmə/km², dalan küçə cəmi ${r("Nəsimi").deadend_pct}%.`,
      yox: `Qəsəbələrdə şəbəkə qırıqdır: dalan küçə payı Sabunçuda ${r("Sabunçu").deadend_pct}%, Səbaildə ${r("Səbail").deadend_pct}%, Binəqədidə ${r("Binəqədi").deadend_pct}%.`,
      dq: `Magistral payı Səbaildə ${r("Səbail").major_share}%, Yasamalda ${r("Yasamal").major_share}%. Mərkəz avtomobil tranziti ilə bölünüb, piyada indeksinin aşağı olmasının əsas səbəbi budur.` },
    { t: "Nəqliyyat", src: "BakuBus · Metro · WorldPop", m: ["transit500_pct", "metro_ride", "bus_stops_km2"],
      var: `Əhalinin ${C.transit500_pct}%-i dayanacağa və ya metroya 500 m məsafədə yaşayır (SDG 11.2.1). Metro gündə ${fmt(C.metro_ride_total)} sərnişin daşıyır.`,
      yox: `${C.no_metro_rayons.length} rayonda metro yoxdur: ${C.no_metro_rayons.join(", ")}. Orada ${fmt(C.pop_no_metro)} nəfər yaşayır.`,
      dq: `Əlçatanlıq Pirallahıda ${r("Pirallahı").transit500_pct}%, Qaradağda ${r("Qaradağ").transit500_pct}%-dir. Ən yüklü metro Nizami rayonundadır (${fmt(r("Nizami").metro_ride)}/gün), piyada indeksi isə orada ${r("Nizami").walk_score}-dir.` },
    { t: "İqlim və yaşıllıq", src: "Landsat 8, 30.08.2025", m: ["lst_mean", "green_pct", "g:lst"],
      var: `Mərkəz periferiyadan sərindir: Xətaidə ${r("Xətai").lst_mean}°C, Nəsimidə ${r("Nəsimi").lst_mean}°C. Suvarılan parklar və kölgə işləyir: “tərs istilik adası”.`,
      yox: `Əhaliyə görə orta yaşıl örtük cəmi ${C.green_pct_popw}%-dir. Səth temperaturu ${C.lst_popw}°C-yə çatır.`,
      dq: `Ən isti rayon Qaradağdır (${r("Qaradağ").lst_mean}°C, 90-cı persentil ${r("Qaradağ").lst_p90}°C), sonra Pirallahı (${r("Pirallahı").lst_mean}°C).` },
    { t: "Risk", src: "SRTM · ədəbiyyat", m: ["below_m20_pct", "steep_pct"],
      var: "Mərkəzi Nərimanov, Nizami və Yasamal həm alçaq sahil zonasından, həm də dik yamaclardan kənardadır.",
      yox: "Daşqın, sürüşmə və seysmik risk xəritələri açıq data kimi yoxdur.",
      dq: `Pirallahının ${r("Pirallahı").below_m20_pct}%-i, Səbailin ${r("Səbail").below_m20_pct}%-i, Xətainin ${r("Xətai").below_m20_pct}%-i −20 m-dən aşağıdadır. Bayıl yamacları sürüşmə riski daşıyır.` },
    { t: "Tarixi-mədəni", src: "OSM", m: ["heritage", "culture"],
      var: `İrs Səbaildə toplanıb: ${r("Səbail").heritage} tarixi və ${r("Səbail").culture} mədəniyyət obyekti, UNESCO İçərişəhər.`,
      yox: `Periferiyada mədəni infrastruktur zəifdir: Qaradağda ${r("Qaradağ").culture}, Pirallahıda ${r("Pirallahı").culture} obyekt.`,
      dq: "Abşeron qalaları (Mərdəkan, Ramana, Nardaran) bir marşrutla birləşmir. Lynch-in “nişanə” anlayışı baxımından istifadə olunmamış imkandır." },
  ];
};

const ThemeCards = ({ analysis, onMetric }) => {
  const themes = buildThemes(analysis.rayons, analysis.city);
  return (
    <Grid>
      {themes.map((t) => (
        <Theme key={t.t}>
          <header>
            <h3>{t.t}</h3>
            <span>{t.src}</span>
          </header>
          <ul>
            <li className="var">
              <b>Var</b>
              <span>{t.var}</span>
            </li>
            <li className="yox">
              <b>Yoxdur</b>
              <span>{t.yox}</span>
            </li>
            <li className="dq">
              <b>Diqqət</b>
              <span>{t.dq}</span>
            </li>
          </ul>
          <Btns>
            {t.m.map((k) => (
              <button key={k} type="button" onClick={() => onMetric(k)}>
                {BAKU_META[k].label}
              </button>
            ))}
          </Btns>
        </Theme>
      ))}
    </Grid>
  );
};

export default ThemeCards;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Theme = styled.article`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 10px;

  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 19px;
  }
  header span {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 11.5px;
    color: var(--text-3);
    text-align: right;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: var(--text-2);
  }
  li {
    display: grid;
    grid-template-columns: 84px 1fr;
    align-items: start;
    gap: 8px;
  }
  li b {
    ${pill}
    justify-content: center;
  }
  li.var b {
    ${tone("var(--good)")}
  }
  li.yox b {
    ${tone("var(--critical)")}
  }
  li.dq b {
    ${tone("var(--accent)")}
  }
`;

const Btns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;

  button {
    height: 30px;
    padding: 0 12px;
    border-radius: 15px;
    font-family: var(--font-semibold);
    font-size: 12px;
    color: var(--text);
    background: var(--bg-secondary);
    border: 1px solid var(--line);
    transition: background 0.15s;
  }
  button:hover {
    background: var(--panel-2);
  }
`;
