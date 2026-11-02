import { useState } from "react";
import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import { Copy } from "lucide-react";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import Button from "@/components/common/Button";
import { Wrap } from "@/components/site/Synthesis/RayonNeed";
import { useModal } from "@/contexts/ModalContext";
import { PITCH } from "@/utils/mock/pilot";

const INDEX_ROWS = [
  ["Metroya yaxınlıq", "+25", "ən yaxın metro çıxışına: 0 m-də tam bal, 1200 m-də sıfır"],
  ["Parka yaxınlıq", "+20", "0 m-də tam bal, 600 m-də sıfır"],
  ["Zebra keçid sıxlığı", "+20", "hücrədə 8 və daha çox keçid"],
  ["Piyada küçəsi uzunluğu", "+20", "hücrədə 300 m və daha çox"],
  ["BakuBus dayanacaqları", "+15", "hücrədə 4 və daha çox"],
  ["Magistral yol", "−25", "hücrədə 600 m və daha çox motorway, trunk, primary"],
  ["Yeraltı keçid", "−10", "hücrədə 2 və daha çox"],
  ["Baza", "+10", "nəticə 0–100 aralığında saxlanılır"],
];

const QA = [
  ["Data haradandır?", "OpenStreetMap, opendata.az (metro, BakuBus, velosiped, DSK 2024 əhalisi), WorldPop, Landsat və SRTM. Hamısı açıq və yoxlanıla biləndir."],
  ["Bu, sadəcə xəritə deyilmi?", "Xəritə interfeysdir. Dəyər qərar mexanizmindədir: hansı keçid, hansı küçə, hansı ardıcıllıqla, hər qərarın təsiri əvvəlcədən hesablanır."],
  ["Niyə məhz Bakı?", "İqlim, relyef və sovet şəhərsalması Avropa modellərini birbaşa köçürməyə imkan vermir. Biz uyğunlaşdırma qatını qururuq."],
  ["Necə böyüyəcək?", "Model şəhərdən asılı deyil. Gəncə, Sumqayıt və region şəhərləri üçün eyni metod yalnız data ilə işləyir."],
];

const Methodology = () => {
  const { openModal } = useModal();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PITCH);
      setCopied(true);
      toast.success("Mətn kopyalandı");
    } catch {
      toast.error("Kopyalanmadı. Mətni əl ilə seçin.");
    }
  };

  return (
    <Section>
      <Helmet>
        <title>Metodologiya · ADDIM Bakı</title>
        <meta name="description" content="ADDIM piyada indeksinin metodologiyası, data mənbələri və hakaton müraciət mətni." />
      </Helmet>
      <Container>
        <SectionHeading eyebrow="12 · Metodologiya" title="İndeks necə hesablanır" lede="Qaydaya əsaslanan ilkin model. Pilotda çəkilər real piyada sayı ilə öyrədiləcək." />
        <Wrap>
          <table>
            <thead>
              <tr>
                <th>Komponent</th>
                <th>Bal</th>
                <th>Ölçü</th>
              </tr>
            </thead>
            <tbody>
              {INDEX_ROWS.map(([a, b, c]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td className="n">{b}</td>
                  <td>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Wrap>
        <Note>
          Tələb balı məktəb, bağça və xəstəxanaları, dayanacaqları və metroya yaxınlığı nəzərə alır; metro təsiri sərnişin sayı ilə çəkilənir. Boşluq = tələb − indeks. Sintez: 8 problem qatı, faiz rankı, Getis-Ord Gi* (8 qonşu), k-means (k = 4–7, silhouette ilə seçilir).
        </Note>
        <Button variant="outline" onClick={() => openModal("DataSourcesModal")}>
          Data mənbələri
        </Button>

        <SectionHeading as="h2" eyebrow="11 · Qeydiyyat forması · son tarix 08.11.2026" title="Müraciət mətni" />
        <Pitch>
          <pre>{PITCH}</pre>
          <Button onClick={copy}>
            <Copy size={16} />
            {copied ? "Kopyalandı" : "Mətni kopyala"}
          </Button>
        </Pitch>
        <QaGrid>
          {QA.map(([q, a]) => (
            <div key={q}>
              <h3>Münsif soruşacaq: {q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </QaGrid>
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Methodology;

const Section = styled.section`
  padding: 20px 0 56px;
  header + div {
    margin-top: 0;
  }
  h2 {
    margin-top: 40px;
  }
`;

const Note = styled.p`
  font-size: 13px;
  color: var(--text-3);
  margin: 14px 0 16px;
  max-width: 80ch;
`;

const Pitch = styled.div`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
  max-width: 820px;

  pre {
    white-space: pre-wrap;
    font-family: var(--font);
    font-size: 15px;
    line-height: 1.6;
  }
`;

const QaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
  > div {
    ${card}
  }

  h3 {
    font-family: var(--font-bold);
    font-size: 15px;
    margin-bottom: 6px;
  }
  p {
    font-size: 14px;
    color: var(--text-2);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
