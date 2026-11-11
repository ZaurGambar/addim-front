import styled from "styled-components";
import { glass } from "@/styles/common/mixins";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import LensStrip from "@/components/common/LensStrip";
import LensTags from "@/components/common/LensTags";
import { AI_TOPICS } from "@/utils/mock/planning";
import { Link } from "react-router-dom";
import { Brain } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import Architecture from "@/components/site/AiModules/Architecture";
import ModuleCards from "@/components/site/AiModules/ModuleCards";

const AiModules = () => (
  <Section>
    <Helmet>
      <title>AI modulları · SmartUrban Bakı</title>
      <meta name="description" content="SmartUrban-ın 8 AI modulu: piyada axını proqnozu, adaptiv keçid, səki auditi, istilik, ssenari simulyatoru, müraciət analizi, sel xəbərdarlığı və investisiya prioriteti." />
    </Helmet>
    <Container>
      <SectionHeading
        eyebrow="09 · Arxitektura"
        title="Əl ilə görülən işi AI modulları ilə əvəz edirik"
        lede="İndi piyada axını əl ilə sayılır, svetofor rejimi sabitdir, şikayətlər bir-bir oxunur, planlama intuisiyaya əsaslanır. SmartUrban bunların hər birini bir data platforması üzərində işləyən AI modulu ilə əvəz edir."
      />
      <PageIntro
        art={<Brain />}
        answer="Bu gün çox iş əl ilə görülür: piyadalar əl ilə sayılır, şikayətlər bir-bir oxunur. Süni intellekt (AI) bu işləri daha sürətli və dəqiq görə bilər."
        steps={["Sxemdə data haradan gəlir və hara gedir.", "Hər kart bir işi göstərir: indi necə edilir, AI necə edəcək.", "Qərarı yenə insan verir, AI yalnız kömək edir."]}
      />
      <LensStrip page="/ai" step={7} />
      <Architecture />
      <ModuleCards />
      <TopicsH>İnklüziv (Inclusive) və kompleks (Comprehensive) planlama üçün AI mövzuları</TopicsH>
      <Topics>
        {AI_TOPICS.map((t) => (
          <li key={t.title}>
            <b>
              {t.title} ({t.en})
            </b>
            <small>
              {t.modules.join(" · ")} · {t.status}
            </small>
            <p>{t.suggestion}</p>
            <LensTags ids={t.sub} />
          </li>
        ))}
      </Topics>
      <TopicsLink to="/planlama?addim=7">Tutorialda ətraflı →</TopicsLink>
      <Callout>
        <b>Niyə “tam avtomat” yox?</b> İctimai yolda svetoforu və ya yolun bağlanmasını yalnız AI-yə vermək təhlükəsizlik və hüquqi risk yaradır. Modelimizdə AI işin böyük hissəsini görür: ölçür, proqnozlaşdırır, təklif edir. Son qərarı operator verir və hər qərar jurnala yazılır.
      </Callout>
    </Container>
    <PageMobilSafeArea />
  </Section>
);

export default AiModules;

const Section = styled.section`
  padding: 20px 0 56px;
`;

const Callout = styled.p`
  margin-top: 20px;
  ${glass}
  background: linear-gradient(to right, var(--accent-soft), transparent 70%), var(--panel);
  border-radius: 20px;
  padding: 16px 18px;
  font-size: 15px;
  max-width: 80ch;
  b {
    font-family: var(--font-semibold);
  }
`;

const TopicsH = styled.h2`
  font-family: var(--font-bold);
  font-size: 22px;
  margin-top: 32px;
`;
const Topics = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
  margin-top: 12px;
  li {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: var(--panel);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  small {
    font-size: 11.5px;
    color: var(--text-3);
  }
  p {
    font-size: 13.5px;
    color: var(--text-2);
    line-height: 1.5;
  }
`;
const TopicsLink = styled(Link)`
  display: inline-block;
  margin-top: 10px;
  font-size: 14px;
  color: var(--accent);
`;
