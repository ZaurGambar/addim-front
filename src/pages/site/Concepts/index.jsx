import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import CardGridSkeleton from "@/components/common/Skeleton/CardGridSkeleton";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import BarList from "@/components/common/BarList";
import Findings from "@/components/site/Concepts/Findings";
import Heatmap from "@/components/site/Concepts/Heatmap";
import ConceptTable from "@/components/site/Concepts/ConceptTable";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { CONCEPT_LABELS } from "@/utils/mock/concepts";

const Concepts = () => {
  const navigate = useNavigate();
  const concepts = useGet("concepts", ENDPOINTS.CONCEPTS);
  const summary = useGet("summary", ENDPOINTS.SUMMARY);
  const loading = concepts.isLoading || summary.isLoading;
  const error = concepts.isError || summary.isError;
  const C = concepts.data;

  // Mərkəzi xəritə ?c= parametrindən göstəricini oxuyur
  const onMap = (k) => navigate(`/xerite?c=${k}`);

  return (
    <Section>
      <Helmet>
        <title>29 anlayış · ADDIM Bakı</title>
        <meta name="description" content="İnsanyönümlü şəhərsalmanın 29 anlayışı Bakının datası ilə ölçülüb və çarpaz korrelasiya edilib." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="08 · Nəzəriyyə × data"
          title="29 anlayış Bakının datası ilə"
          lede="Hər anlayış ölçülə bilən göstəriciyə çevrilib, 808 hücrədə hesablanıb və çarpaz müqayisə olunub. Ölçmək üçün data olmayanlar açıq şəkildə “data yoxdur” kimi qeyd olunub."
        />
        {error && <ErrorText />}
        {loading && <CardGridSkeleton count={6} />}
        {C && summary.data && (
          <>
            <Findings concepts={C} summary={summary.data} />
            <Two>
              <div>
                <H2>Korrelasiya xəritəsi</H2>
                <Note>Spearman ρ, n = 808 hücrə. Mavi: birlikdə artır, qırmızı: əks istiqamətdə. Nöqtəli xanalarda göstəricilər eyni xam datanı paylaşır.</Note>
                <Heatmap concepts={C} />
              </div>
              <div>
                <H2>Metro stansiyalarında</H2>
                <Note>17 stansiyanın sərnişin sayı ilə ətrafdakı göstəricilərin korrelasiyası. n kiçikdir, istiqamət kimi oxuyun.</Note>
                <BarList diverging max={1} items={Object.entries(C.station_corr).map(([k, v]) => ({ key: k, label: CONCEPT_LABELS[k], value: v ?? 0 }))} />
              </div>
            </Two>
            <H2>Anlayışlar kataloqu</H2>
            <Note>Bakı: tədqiqat ərazisi üzrə orta göstərici (0–100).</Note>
            <ConceptTable concepts={C} summary={summary.data} onMap={onMap} />
          </>
        )}
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Concepts;

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
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 32px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;
