import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import Architecture from "@/components/site/AiModules/Architecture";
import ModuleCards from "@/components/site/AiModules/ModuleCards";

const AiModules = () => (
  <Section>
    <Helmet>
      <title>AI modulları · ADDIM Bakı</title>
      <meta name="description" content="ADDIM-in 8 AI modulu: piyada axını proqnozu, adaptiv keçid, səki auditi, istilik, ssenari simulyatoru, müraciət analizi, sel xəbərdarlığı və investisiya prioriteti." />
    </Helmet>
    <Container>
      <SectionHeading
        eyebrow="09 · Arxitektura"
        title="Əl ilə görülən işi AI modulları ilə əvəz edirik"
        lede="İndi piyada axını əl ilə sayılır, svetofor rejimi sabitdir, şikayətlər bir-bir oxunur, planlama intuisiyaya əsaslanır. ADDIM bunların hər birini bir data platforması üzərində işləyən AI modulu ilə əvəz edir."
      />
      <Architecture />
      <ModuleCards />
      <Callout>
        <b>Niyə “tam avtomat” yox?</b> İctimai yolda svetoforu və ya yolun bağlanmasını yalnız AI-yə vermək təhlükəsizlik və hüquqi risk yaradır. Modelimizdə AI işin böyük hissəsini görür: ölçür, proqnozlaşdırır, təklif edir. Son qərarı operator verir və hər qərar jurnala yazılır.
      </Callout>
    </Container>
    <PageMobilSafeArea />
  </Section>
);

export default AiModules;

const Section = styled.section`
  padding: 40px 0 56px;
`;

const Callout = styled.p`
  margin-top: 20px;
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 14px 16px;
  font-size: 15px;
  max-width: 80ch;
  b {
    font-family: var(--font-semibold);
  }
`;
