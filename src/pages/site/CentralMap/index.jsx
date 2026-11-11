import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import { WalkScore } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import MapSkeleton from "@/components/common/Skeleton/MapSkeleton";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import WalkMap from "@/components/site/CentralMap/WalkMap";
import StationBars from "@/components/site/CentralMap/StationBars";
import StationTable from "@/components/site/CentralMap/StationTable";
import RidershipScatter from "@/components/site/CentralMap/RidershipScatter";
import { useQueries } from "@tanstack/react-query";
import { getData } from "@/utils/api/requests";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { fmt, prefersReducedMotion } from "@/utils/helpers/format";

const KEYS = {
  walk: "WALK_INDEX", roads: "ROADS", coast: "COAST", parks: "PARKS", pedestrian: "PEDESTRIAN", oldcity: "OLD_CITY", barriers: "BARRIERS",
  underpasses: "UNDERPASSES", metro: "METRO", crossings: "CROSSINGS", schools: "SCHOOLS", busLines: "BUS_LINES", busStops: "BUS_STOPS",
  exits: "METRO_EXITS", bikeLanes: "BIKE_LANES", bikeParking: "BIKE_PARKING", summary: "SUMMARY",
};

const names = Object.keys(KEYS);
const QUERIES = names.map((k) => ({ queryKey: [`central-${k}`], queryFn: () => getData(ENDPOINTS[KEYS[k]]), staleTime: Infinity }));

// Komponentdən kənarda: stabil funksiya olduğu üçün nəticə yalnız data dəyişəndə yenilənir
const combine = (res) => {
  const isLoading = res.some((q) => q.isLoading);
  const isError = res.some((q) => q.isError);
  return { loading: isLoading, error: isError, d: isLoading || isError ? null : Object.fromEntries(names.map((k, i) => [k, res[i].data])) };
};

const CentralMap = () => {
  const [focus, setFocus] = useState(null);
  // combine nəticəsi data dəyişməyəndə eyni obyekti qaytarır, xəritə qatları hər render-də yenidən qurulmur
  const { loading, error, d } = useQueries({
    queries: QUERIES,
    combine,
  });

  const [params] = useSearchParams();
  const stationParam = params.get("s");

  const goStation = (s) => {
    setFocus({ lat: s.lat, lon: s.lon, html: `<strong>Ⓜ ${s.name}</strong>${s.ride_2026 ? `<br>Gündə <b>${fmt(s.ride_2026)}</b> sərnişin` : ""}<br>500 m indeks: <b>${s.score}</b>/100`, t: Date.now() });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  // /xerite?s=Gənclik: pilot kartlarından gələndə stansiyaya keç
  const paramFocus = useMemo(() => {
    const s = d && stationParam ? d.summary.stations.find((x) => x.name === stationParam) : null;
    return s ? { lat: s.lat, lon: s.lon, html: `<strong>Ⓜ ${s.name}</strong><br>500 m indeks: <b>${s.score}</b>/100` } : null;
  }, [d, stationParam]);

  return (
    <Section>
      <Helmet>
        <title>Mərkəzi xəritə · SmartUrban Bakı</title>
        <meta name="description" content="Bakı mərkəzində 250 m hücrələrdə piyada indeksi, yeraltı keçidlər, metro, BakuBus və Seul ssenarisi." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="04 · Mərkəzi zona · 250 m hücrələr"
          title="Piyada Rahatlığı İndeksi"
          lede="Metro çıxışına və parka məsafə, zebra keçidlərin sıxlığı, piyada küçələri və BakuBus dayanacaqları balı artırır. Magistral yollar və yeraltı keçidlər balı azaldır. Tələb metro stansiyalarının real sərnişin sayı ilə çəkilənir."
        />
        <PageIntro
          art={<WalkScore />}
          answer="Şəhər mərkəzində hər 250 metrlik sahəyə “piyada balı” verdik, 0-dan 100-ə qədər. Metro, park, zebra və piyada küçəsi yaxındırsa, bal yüksəkdir. Geniş maşın yolu və yeraltı keçid balı azaldır."
          steps={["Xəritədə rəngə baxın: tünd göy yaxşıdır, açıq rəng pisdir.", "Kvadrata klikləyin: niyə belə bal aldığını görün.", "Seul ssenarisini açın: dəyişiklikdən sonra bal necə artır."]}
        />
        {error && <ErrorText />}
        {loading && <MapSkeleton height={620} />}
        {d && (
          <>
            <WalkMap d={d} focus={focus || paramFocus} />
            <Two>
              <div>
                <H2>Metro stansiyalarının ətrafı</H2>
                <Note>500 m radiusda orta indeks. Kəsik xətt mərkəzin ortasıdır. Stansiyaya klikləyin.</Note>
                <StationBars stations={d.summary.stations.filter((s) => s.score != null)} mean={d.summary.mean_score} onSelect={goStation} />
              </div>
              <div>
                <H2>Stansiya kartları (400 m)</H2>
                <Note>Sərnişin: 2026 yanvar–sentyabr gündəlik orta (Bakı Metropoliteni).</Note>
                <StationTable stations={d.summary.stations.filter((s) => s.score != null)} />
              </div>
            </Two>
            <H2>Sərnişin sayı × piyada rahatlığı</H2>
            <Note>Hər nöqtə bir stansiyadır. Sağ-aşağı zona: çox insan, az rahatlıq.</Note>
            <RidershipScatter stations={d.summary.stations} onSelect={goStation} />
          </>
        )}
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default CentralMap;

const Section = styled.section`
  padding: 20px 0 56px;
`;

const H2 = styled.h2`
  font-family: var(--font-bold);
  font-size: 22px;
  margin-top: 36px;
`;

const Note = styled.p`
  font-size: 13px;
  color: var(--text-3);
  margin: 6px 0 12px;
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;
