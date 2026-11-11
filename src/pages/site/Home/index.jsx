import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Skeleton from "react-loading-skeleton";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import Hero from "@/components/site/Home/Hero";
import MvpFocus from "@/components/site/Home/MvpFocus";
import QuickLinks from "@/components/site/Home/QuickLinks";
import KeyFindings from "@/components/site/Home/KeyFindings";
import Story from "@/components/site/Home/Story";
import TourMap from "@/components/site/Home/TourMap";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { useModal } from "@/contexts/ModalContext";

const Home = () => {
  const { openModal } = useModal();
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS);
  const synth = useGet("bakuSynthSummary", ENDPOINTS.BAKU_SYNTH_SUMMARY);
  const summary = useGet("summary", ENDPOINTS.SUMMARY);
  const inc = useGet("inclusiveAccess", ENDPOINTS.INCLUSIVE_ACCESS);
  const loading = analysis.isLoading || synth.isLoading || summary.isLoading || inc.isLoading;
  const error = analysis.isError || synth.isError || summary.isError || inc.isError;

  return (
    <Section>
      <Helmet>
        <title>SmartUrban Bakı · Hər kəs üçün 10 dəqiqə</title>
        <meta name="description" content="İnklüziv əlçatanlıq platforması: yaşlı, əlil arabası və uşaq arabası üçün Bakının 10 dəqiqəlik məhəlləsi; SmartFlow marşrutlarının əlçatanlıq yoxlaması." />
      </Helmet>
      <Container>
        {error && <ErrorText />}
        {loading && <Skeleton height={360} borderRadius={26} baseColor="var(--bg-secondary)" highlightColor="var(--panel-2)" />}
        {!loading && !error && (
          <>
            <Hero inc={inc.data} onHelp={() => openModal("HelpModal")} />
            <Block>
              <SectionHeading
                as="h2"
                eyebrow="MVP · Hər kəs üçün 10 dəqiqə · SmartFlow inteqrasiyası"
                title="Problem → həll → hədəf"
                lede="Məqsəd: yaşlı, əlil arabası istifadəçisi və uşaq arabalı valideyn də gündəlik xidmətlərə orta piyada qədər asan çatsın. Rəqəmlər SmartUrban modelinin hesablamasıdır."
              />
              <MvpFocus inc={inc.data} />
            </Block>
            <Divider>
              <span>Platformanın təməli: bütün Bakının piyada analizi</span>
            </Divider>
            <Block>
              <SectionHeading
                as="h2"
                eyebrow="Tur"
                title="Xəritədə 8 addımda Bakı"
                lede="“İrəli” düyməsini basın. Xəritə özü lazım olan yerə gedəcək və hər addımda bir şeyi sadə dillə izah edəcək."
              />
              <TourMap />
            </Block>
            <Block>
              <SectionHeading
                as="h2"
                eyebrow="Hekayə"
                title="5 addımda: problemdən həllə"
                lede="Aşağı sürüşdürün. Soldakı xətt piyadanın yoludur. Hər addım bir mərhələdir və öz səhifəsinə aparır."
              />
              <Story summary={summary.data} city={analysis.data.city} synth={synth.data} />
            </Block>
            <Block>
              <SectionHeading as="h2" eyebrow="Əsas nəticələr" title="Rəqəmlər nə deyir" />
              <KeyFindings analysis={analysis.data} synth={synth.data} />
            </Block>
          </>
        )}
        <Block>
          <SectionHeading as="h2" eyebrow="Bölmələr" title="Daha ətraflı baxın" />
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

const Divider = styled.div`
  margin-top: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-3);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--line);
  }
`;

const Block = styled.div`
  margin-top: 40px;
`;
