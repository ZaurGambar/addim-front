import { useState } from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import LensStrip from "@/components/common/LensStrip";
import { InclusivePriority } from "@/components/site/Planning/LensBrief";
import { Hotspot } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import MapSkeleton from "@/components/common/Skeleton/MapSkeleton";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import SynthMap from "@/components/site/Synthesis/SynthMap";
import TypeCards from "@/components/site/Synthesis/TypeCards";
import PriorityZones from "@/components/site/Synthesis/PriorityZones";
import Combos from "@/components/site/Synthesis/Combos";
import RayonNeed from "@/components/site/Synthesis/RayonNeed";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { prefersReducedMotion } from "@/utils/helpers/format";

const Synthesis = () => {
  const [focus, setFocus] = useState(null);
  const synth = useGet("bakuSynth", ENDPOINTS.BAKU_SYNTH);
  const summary = useGet("bakuSynthSummary", ENDPOINTS.BAKU_SYNTH_SUMMARY);
  const rayons = useGet("bakuRayons", ENDPOINTS.BAKU_RAYONS);
  const loading = synth.isLoading || summary.isLoading || rayons.isLoading;
  const error = synth.isError || summary.isError || rayons.isError;
  const S = summary.data;

  const showOnMap = (z) => {
    setFocus({ lat: z.lat, lon: z.lon, t: Date.now() });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <Section>
      <Helmet>
        <title>Sintez · ADDIM Bakı</title>
        <meta name="description" content="Bakıda problemlərin üst-üstə düşdüyü zonalar: Getis-Ord Gi* qaynar nöqtələri, 4 məhəllə tipi və prioritet zonalar." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="02 · Sintez · 1 km hücrələr · məskunlaşmış ərazi"
          title="Problemlər harada üst-üstə düşür"
          lede="Səkkiz problem qatı (istilik, yaşıllıq, nəqliyyat boşluğu, şəbəkə qırıqlığı, avtomobil hökmranlığı, relyef, alçaq sahil, xidmət) üst-üstə qoyulub. Getis-Ord Gi* statistik qaynar nöqtələri, k-means isə məhəllə tiplərini göstərir. Yalnız məskunlaşmış hücrələr (≥ 300 nəfər/km²) daxildir. İstilik və yaşıllıq qatları Landsat 01.08.2026 şəklinə əsaslanır."
        />
        <PageIntro
          art={<Hotspot />}
          answer="Bir yerdə bir neçə problem birdən olanda həyat çətinləşir: isti olur, yaşıllıq olmur, avtobus uzaq olur, yolu keçmək çətin olur. Biz 8 problemi bir xəritəyə yığdıq və onların toplandığı yerləri tapdıq."
          steps={["Qırmızı yerlərdə problemlər toplanıb.", "Göy yerlərdə vəziyyət yaxşıdır.", "Siyahıda zonaya klikləyin: xəritədə onu görəcəksiniz."]}
          idea="Siyahıda 1-ci yerdə olan zona köməyin ilk lazım olduğu yerdir."
        />
        <LensStrip page="/sintez" step={5} />
        {error && <ErrorText />}
        {loading && <MapSkeleton />}
        {!loading && !error && (
          <>
            <SynthMap synth={synth.data} summary={S} rayons={rayons.data} focus={focus} />
            <H2>Məhəllə tipləri</H2>
            <Note>
              Dəyişənlər: sıxlıq, obyektlər, kəsişmələr, dalan küçə payı, səth temperaturu, NDVI, meyl, dayanacağa məsafə, magistral uzunluğu. k = 4–7 arasında ən yüksək silhouette ({S.silhouette[S.k]}) seçilib: mülayim ayrılma, tiplər arasında keçid zonaları var.
            </Note>
            <TypeCards summary={S} />
            <InclusivePriority />
            <Two>
              <div>
                <H2>Prioritet zonalar</H2>
                <Note>Bitişik qaynar nöqtələr birləşdirilib. Sıralama: əhali × ehtiyac. Zonaya klikləyin.</Note>
                <PriorityZones zones={S.zones} onShowOnMap={showOnMap} />
              </div>
              <div>
                <H2>Ən çox üst-üstə düşən problemlər</H2>
                <Note>Üç problemin eyni hücrədə ən pis üçdə birlikdə olduğu hallar, yaşayan əhali ilə.</Note>
                <Combos combos={S.top_combos} />
                <H2>Rayonlar üzrə</H2>
                <RayonNeed rayons={S.rayons} />
              </div>
            </Two>
          </>
        )}
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Synthesis;

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
  max-width: 80ch;
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;
