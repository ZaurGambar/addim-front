import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import { Swot as SwotArt } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import CardGridSkeleton from "@/components/common/Skeleton/CardGridSkeleton";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import SwotGrid from "@/components/site/Swot/SwotGrid";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";

const Swot = () => {
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS);
  const synth = useGet("bakuSynthSummary", ENDPOINTS.BAKU_SYNTH_SUMMARY);
  const summary = useGet("summary", ENDPOINTS.SUMMARY);
  const loading = analysis.isLoading || synth.isLoading || summary.isLoading;
  const error = analysis.isError || synth.isError || summary.isError;

  return (
    <Section>
      <Helmet>
        <title>SWOT · ADDIM Bakı</title>
        <meta name="description" content="İnsanyönümlü Bakı üçün SWOT: güclü və zəif tərəflər, imkanlar və təhdidlər, real data ilə." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="03 · Analizin yekunu"
          title="SWOT: insanyönümlü Bakı"
          lede="Hər bənd analiz və sintezdən gəlir, rəqəmlər real datadandır. Güclü və zəif tərəflər şəhərin daxili vəziyyətini, imkanlar və təhdidlər xarici amilləri göstərir."
        />
        <PageIntro
          art={<SwotArt />}
          answer="Bütün analizi 4 qutuya yığdıq: Bakının güclü tərəfləri, zəif tərəfləri, istifadə edə biləcəyi imkanlar və qarşısındakı təhlükələr."
          steps={["S (yaşıl): güclü tərəflər.", "W (qırmızı): zəif tərəflər.", "O (göy): imkanlar. T (narıncı): təhlükələr."]}
        />
        {error && <ErrorText />}
        {loading && <CardGridSkeleton count={4} height={320} />}
        {!loading && !error && <SwotGrid analysis={analysis.data} synth={synth.data} summary={summary.data} />}
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Swot;

const Section = styled.section`
  padding: 20px 0 56px;
`;
