import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import { Models as ModelsArt } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import CityCards from "@/components/site/Models/CityCards";
import GapTable from "@/components/site/Models/GapTable";
import RiskList from "@/components/site/Models/RiskList";

const Models = () => (
  <Section>
    <Helmet>
      <title>Şəhər modelləri · ADDIM Bakı</title>
      <meta name="description" content="Seul, Amsterdam, Barselona, Paris, Kopenhagen və Sinqapur modelləri Bakı ilə müqayisədə: çatışmazlıqlar, risklər və həllər." />
    </Helmet>
    <Container>
      <SectionHeading
        eyebrow="05 · Benchmark"
        title="Altı şəhər, altı model"
        lede="Hər şəhərdən bir əsas yanaşma götürülür və Bakının şərtləri ilə yoxlanılır: relyef, Xəzri küləyi, yay istisi, geniş sovet prospektləri və avtomobilə bağlılıq."
      />
      <PageIntro
        art={<ModelsArt />}
        answer="Dünyanın 6 şəhəri piyadalar üçün nə edib? Hər birindən bir yaxşı fikir götürdük və yoxladıq: bu, Bakıda işləyərmi?"
        steps={["Hər kartda şəhərin gördüyü əsas iş var.", "Cədvəldə: bu, Bakıda var, yarımçıqdır, yoxsa yoxdur.", "Sonda: köçürəndə nə səhv gedə bilər."]}
      />
      <CityCards />
      <SectionHeading as="h2" eyebrow="06 · Boşluq analizi" title="Bakıda nə var, nə çatışmır" lede="Status komandanın açıq mənbələrə əsaslanan ilkin qiymətləndirməsidir." />
      <GapTable />
      <Spacer />
      <SectionHeading as="h2" eyebrow="07 · Köçürmə riskləri" title="Bakıya birbaşa köçürsək nə pozular" />
      <RiskList />
    </Container>
    <PageMobilSafeArea />
  </Section>
);

export default Models;

const Section = styled.section`
  padding: 20px 0 56px;
  header {
    margin-top: 0;
  }
  & > div > header:not(:first-child) {
    margin-top: 48px;
  }
`;

const Spacer = styled.div`
  height: 8px;
`;
