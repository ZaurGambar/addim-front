import { useState } from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import MapSkeleton from "@/components/common/Skeleton/MapSkeleton";
import CardGridSkeleton from "@/components/common/Skeleton/CardGridSkeleton";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import Button from "@/components/common/Button";
import BakuMap from "@/components/site/Analysis/BakuMap";
import ThemeCards from "@/components/site/Analysis/ThemeCards";
import RayonTable from "@/components/site/Analysis/RayonTable";
import DataGaps from "@/components/site/Analysis/DataGaps";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { useModal } from "@/contexts/ModalContext";
import { prefersReducedMotion } from "@/utils/helpers/format";

const Analysis = () => {
  const { openModal } = useModal();
  const [metric, setMetric] = useState("density");
  const rayons = useGet("bakuRayons", ENDPOINTS.BAKU_RAYONS);
  const grid = useGet("bakuGrid", ENDPOINTS.BAKU_GRID);
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS);
  const loading = rayons.isLoading || grid.isLoading || analysis.isLoading;
  const error = rayons.isError || grid.isError || analysis.isError;

  const pickMetric = (k) => {
    setMetric(k);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <Section>
      <Helmet>
        <title>Bakı analizi · ADDIM Bakı</title>
        <meta name="description" content="Bakının 12 rayonu üzrə 9 mövzuda tematik analiz: demoqrafiya, nəqliyyat, iqlim, topoqrafiya, küçə şəbəkəsi və risk." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="01 · Bütün Bakı · 12 rayon · 2018 km² quru"
          title="Bakı: tematik analiz"
          lede="Doqquz mövzu üzrə şəhəri oxuyuruq: demoqrafiya, sosial-iqtisadi vəziyyət, topoqrafiya, küçə şəbəkəsi, nəqliyyat, iqlim, risk və tarixi-mədəni irs. Hər mövzuda göstərilir: nə var, nə yoxdur və nə diqqət çəkir."
        />
        {error && <ErrorText />}
        {loading && <MapSkeleton />}
        {!loading && !error && (
          <>
            <BakuMap rayons={rayons.data} grid={grid.data} metric={metric} onMetricChange={setMetric} />
            <ThemeCards analysis={analysis.data} onMetric={pickMetric} />
            <SubHead>
              <h2>Rayonların müqayisəsi</h2>
              <Button variant="ghost" size="sm" onClick={() => openModal("ReportModal", { context: "Bakı analizi" })}>
                Data xətası bildir
              </Button>
            </SubHead>
            <Note>Mavi zolaq dəyərin sütundakı ən böyük dəyərə nisbətidir. Sütun başlığına klikləsəniz cədvəl sıralanır.</Note>
            <RayonTable rayons={analysis.data.rayons} />
            <DataGaps />
          </>
        )}
        {loading && <CardGridSkeleton />}
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Analysis;

const Section = styled.section`
  padding: 20px 0 56px;
`;

const SubHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
  h2 {
    font-family: var(--font-bold);
    font-size: 22px;
  }
`;

const Note = styled.p`
  font-size: 13px;
  color: var(--text-3);
  margin: 6px 0 12px;
`;
