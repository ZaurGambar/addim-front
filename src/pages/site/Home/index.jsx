import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Skeleton from "react-loading-skeleton";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import Hero from "@/components/site/Home/Hero";
import QuickLinks from "@/components/site/Home/QuickLinks";
import KeyFindings from "@/components/site/Home/KeyFindings";
import Story from "@/components/site/Home/Story";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { useModal } from "@/contexts/ModalContext";

const Home = () => {
  const { openModal } = useModal();
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS);
  const synth = useGet("bakuSynthSummary", ENDPOINTS.BAKU_SYNTH_SUMMARY);
  const summary = useGet("summary", ENDPOINTS.SUMMARY);
  const loading = analysis.isLoading || synth.isLoading || summary.isLoading;
  const error = analysis.isError || synth.isError || summary.isError;

  return (
    <Section>
      <Helmet>
        <title>ADDIM Bakı · AI piyada platforması</title>
        <meta name="description" content="Bakı üçün süni intellekt əsaslı piyada platforması: 9 mövzuda analiz, sintez, SWOT, 29 anlayış və pilot zonalar." />
      </Helmet>
      <Container>
        {error && <ErrorText />}
        {loading && <Skeleton height={360} borderRadius={26} baseColor="var(--bg-secondary)" highlightColor="var(--panel-2)" />}
        {!loading && !error && (
          <>
            <Hero city={analysis.data.city} synth={synth.data} onHelp={() => openModal("HelpModal")} />
            <Block>
              <SectionHeading
                as="h2"
                eyebrow="Hekayə"
                title="Bir piyadanın yolu: problemdən pilota"
                lede="Aşağı skroll edin: xətt piyadanın yoludur. Hər addım bir mərhələdir və öz səhifəsinə aparır."
              />
              <Story summary={summary.data} city={analysis.data.city} synth={synth.data} />
            </Block>
            <Block>
              <SectionHeading as="h2" eyebrow="Əsas nəticələr" title="Data nə deyir" />
              <KeyFindings analysis={analysis.data} synth={synth.data} />
            </Block>
          </>
        )}
        <Block>
          <SectionHeading as="h2" eyebrow="Bölmələr" title="Platformanı kəşf edin" />
          <QuickLinks />
        </Block>
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Home;

const Section = styled.section`
  padding-bottom: 56px;
`;

const Block = styled.div`
  margin-top: 40px;
`;
