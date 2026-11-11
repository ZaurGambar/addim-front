import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import { Helmet } from "react-helmet-async";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import LensStrip from "@/components/common/LensStrip";
import { Steps } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import CardGridSkeleton from "@/components/common/Skeleton/CardGridSkeleton";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import PilotCards from "@/components/site/Pilot/PilotCards";
import SatelliteTable from "@/components/site/Pilot/SatelliteTable";
import FieldCheckForm from "@/components/site/Pilot/FieldCheckForm";
import Timeline from "@/components/site/Pilot/Timeline";
import SchoolSafety from "@/components/site/Pilot/SchoolSafety";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";

const BIZ = [
  ["Kim ödəyir", "Dövlət müştəriləri (B2G): Bakı Nəqliyyat Agentliyi, Bakı Şəhər İcra Hakimiyyəti, Şəhərsalma və Arxitektura Komitəsi. İllik SaaS lisenziyası."],
  ["İkinci gəlir", "Developerlərə və əmlak platformalarına “piyada balı” API-si, Walk Score kimi."],
  ["Uğurun ölçüsü", "Keçiddə gözləmə vaxtı, piyada qəzaları, kölgə örtüyünün faizi, pilot zonalarda indeksin artımı."],
];

const Pilot = () => {
  const underpasses = useGet("central-underpasses", ENDPOINTS.UNDERPASSES);
  const business = useGet("business", ENDPOINTS.BUSINESS);
  const schools = useGet("schoolsSafety", ENDPOINTS.SCHOOLS_SAFETY);
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS);
  const loading = underpasses.isLoading || business.isLoading;
  const error = underpasses.isError || business.isError;

  const points = underpasses.data
    ? [
        ...underpasses.data.features.filter((f) => f.properties.candidate).sort((a, b) => a.properties.rank - b.properties.rank)
          .map((f) => ({ value: `U${String(f.properties.rank).padStart(2, "0")}`, label: `#${f.properties.rank} yeraltı keçid · ${f.properties.road || f.properties.metro}` })),
        { value: "P-genclik", label: "Pilot: Gənclik" },
        { value: "P-20yanvar", label: "Pilot: 20 Yanvar" },
        { value: "P-insaatcilar", label: "Pilot: İnşaatçılar pr." },
      ]
    : [];

  return (
    <Section>
      <Helmet>
        <title>Pilot · ADDIM Bakı</title>
        <meta name="description" content="Data ilə seçilmiş 3 pilot zona, yeraltı keçid namizədlərinin peyk yoxlaması və sahə yoxlaması forması." />
      </Helmet>
      <Container>
        <SectionHeading eyebrow="10 · Data əsaslı seçim" title="Üç pilot zona" lede="Zonaları biz seçməmişik, model seçib: tələbin yüksək, rahatlığın aşağı olduğu yerlər." />
        <PageIntro
          art={<Steps />}
          answer="Fikri əvvəlcə kiçik bir yerdə sınayırıq. Model 3 yer seçib: insanı çox, piyada üçün rahatlığı az olan yerlər."
          steps={["Hər kartda bir pilot yer və orada nə ediləcəyi var.", "Peyk şəkli ilə 15 yer yoxlanıb: zebra var, yoxsa yox.", "Formanı doldurun: siz də yerdə yoxlaya bilərsiniz."]}
        />
        <LensStrip page="/pilot" step={8} />
        {error && <ErrorText />}
        {loading && <CardGridSkeleton count={3} />}
        {!loading && !error && (
          <>
            <PilotCards business={business.data} />
            <H2>Top-15 namizədin peyk yoxlaması</H2>
            <Note>Esri peyk görüntüsündə (z19) baxılıb, çəkiliş tarixi məlum deyil. Yekun qərar sahə yoxlamasından sonra verilir.</Note>
            <SatelliteTable underpasses={underpasses.data} />
            {schools.data && analysis.data?.city?.school_safety && (
              <>
                <H2>Təhlükəsiz məktəb yolu</H2>
                <Note>Hər məktəb və bağçanın ətrafında uşağın keçməli olduğu yol mühiti. “Təhlükəsiz məktəb yolu” həlli və 30 km/saat qaydası ilk növbədə bu məktəblərdən başlamalıdır.</Note>
                <SchoolSafety schools={schools.data} summary={analysis.data.city.school_safety} />
              </>
            )}
            <H2>Sahə yoxlaması</H2>
            <Note>Komanda telefondan doldurur. Hər nöqtədə 15 dəqiqə keçən piyadaları sayın və keçidin şəklini çəkin. Cavablar Netlify Forms panelində toplanır.</Note>
            <FieldCheckForm points={points} />
          </>
        )}
        <H2>Yol xəritəsi</H2>
        <Timeline />
        <Biz>
          {BIZ.map(([h, p]) => (
            <div key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </Biz>
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Pilot;

const Section = styled.section`
  padding: 20px 0 56px;
`;

const H2 = styled.h2`
  font-family: var(--font-bold);
  font-size: 22px;
  margin: 36px 0 0;
`;

const Note = styled.p`
  font-size: 13px;
  color: var(--text-3);
  margin: 6px 0 12px;
  max-width: 80ch;
`;

const Biz = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
  > div {
    ${card}
  }

  h3 {
    font-family: var(--font-bold);
    font-size: 17px;
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
