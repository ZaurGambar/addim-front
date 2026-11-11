import styled from "styled-components";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, ArrowRight, Bus, Car, Database, FlaskConical, Footprints, Gauge, Landmark, Store, Trees, Waves } from "lucide-react";
import { card, hoverLift } from "@/styles/common/mixins";
import Container from "@/styles/common/Container";
import PageIntro from "@/components/common/PageIntro";
import LensStrip from "@/components/common/LensStrip";
import LensTags from "@/components/common/LensTags";
import { RULE_LENS } from "@/utils/mock/planning";
import { Checklist } from "@/components/common/Illustrations";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import { CountUp } from "@/components/common/Motion";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { fmt } from "@/utils/helpers/format";

// qaydaların ardıcıl nömrəsi (qruplar boyu)
const START = [];
// Sistemin tapdığı 8 problemə qarşı qayda təklifləri. Hüquqi yoxlama tələb olunur.
const GROUPS = [
  {
    key: "fast",
    title: "Tez nəticə verir",
    lede: "Pilotlarla birbaşa bağlıdır. Az pul, qısa müddət.",
    rules: [
      {
        icon: Footprints,
        title: "Piyada keçidi standartı",
        layers: ["Şəbəkə qırıqlığı", "Avtomobil hökmranlığı"],
        what: "Şəhər küçəsində yer səthindəki keçidlər arası məsafə həddi (mərkəzdə 200–300 m). Yeni yeraltı keçid yalnız yanında zebra da olarsa tikilir. Hər keçiddə pandus və ya lift.",
        why: "Yaşlı, uşaqlı və əlil arabalı insan pilləkənlə enə bilmir və yolu qaçaraq keçir.",
      },
      {
        icon: Gauge,
        title: "Məhəllədə və məktəb yanında 30 km/saat",
        layers: ["Avtomobil hökmranlığı"],
        what: "Yaşayış küçələrində və məktəb ətrafında sürət həddi 30 km/saat. Kamera və yolun özü (dar zolaq, hündür keçid) sürəti azaldır.",
        why: "Piyada ölümlərini ən sürətlə azaldan addımdır.",
      },
      {
        icon: FlaskConical,
        title: "Pilot (sınaq) rejimi",
        layers: ["Bütün 8 problem"],
        what: "Müvəqqəti zebra, kölgə və oturacaq 6–12 ay üçün sadə icazə ilə qurulur. Nəticə ölçülür: yaxşıdırsa daimi olur, deyilsə geri götürülür.",
        why: "Bu, bizim pilotların hüquqi əsasıdır: əvvəl sınayırıq, sonra tikirik.",
        link: ["/pilot", "Pilot yerlərə baxın"],
      },
    ],
  },
  {
    key: "mid",
    title: "Şəhəri yavaş-yavaş dəyişir",
    lede: "Yeni tikinti və küçə layihələri üçün qaydalar.",
    rules: [
      {
        icon: Trees,
        title: "Kölgə və yaşıllıq norması",
        layers: ["İstilik stressi", "Yaşıllıq çatışmazlığı"],
        what: "Küçənin hər km-i üçün minimum ağac sayı. Avtobus dayanacağında kölgə məcburi. Yeni binalarda açıq rəngli, sərin dam.",
        why: (c) => `Yay günü insanların yaşadığı yerdə yer səthi orta hesabla ${c.lst_popw}°C olur.`,
      },
      {
        icon: Car,
        title: "Parkinq qaydaları",
        layers: ["Avtomobil hökmranlığı"],
        what: "Səkidə parkinqə kamera ilə nəzarət. Mərkəzdə pullu parkinq. Yeni binalarda minimum parkinq tələbi əvəzinə maksimum hədd.",
        why: "Səki maşınla dolanda piyada yola çıxır.",
      },
      {
        icon: Bus,
        title: "Nəqliyyat əlçatanlığı standartı",
        layers: ["Nəqliyyat boşluğu"],
        what: "Hər evdən dayanacağa ən çox 500 m. Əsas xətlərdə avtobus zolağı.",
        why: (c) => `${fmt(c.pop_no_metro)} insan metrosu olmayan rayonlarda yaşayır. Onlar üçün avtobus yeganə yoldur.`,
      },
      {
        icon: Store,
        title: "“15 dəqiqəlik məhəllə” tələbi",
        layers: ["Xidmət çatışmazlığı", "Şəbəkə qırıqlığı"],
        what: "Böyük tikinti layihəsi icazə üçün piyada əlçatanlıq analizi təqdim edir: məktəb, mağaza, dayanacaq nə qədər uzaqdır. Dalan küçə limiti.",
        why: "Yeni məhəllə qurulanda problem sonradan yox, əvvəldən həll olunur.",
      },
      {
        icon: Waves,
        title: "Sahil və alçaq ərazilər",
        layers: ["Alçaq sahil riski"],
        what: "Su basma riski olan yerlərdə tikinti şərtləri: binanın minimum hündürlüyü, drenaj.",
        why: "Bakının bir hissəsi dəniz səviyyəsindən aşağıdadır.",
      },
    ],
  },
  {
    key: "system",
    title: "Sistemi daimi edir",
    lede: "Qərarlar məlumatla verilir və hər il yenilənir.",
    rules: [
      {
        icon: Landmark,
        title: "Büdcə ehtiyaca görə",
        layers: ["Sintez balı"],
        what: "Küçə layihələrinin büdcəsi məlumat indeksinə görə paylanır: “insan sayı × bal”. İlk pul ən çətin yerlərə gedir.",
        why: (c, s) => `Problem ocaqlarında ${fmt(s.hot_pop)} insan yaşayır.`,
        link: ["/sintez", "Problem ocaqlarına baxın"],
      },
      {
        icon: Database,
        title: "Açıq məlumat və “əvvəl/sonra” ölçmə",
        layers: ["Bütün 8 problem"],
        what: "Hər küçə layihəsindən əvvəl və sonra piyada sayı, qəza və temperatur ölçülüb dərc olunur. Keçid, dayanacaq və sərnişin məlumatları açıq yayımlanır.",
        why: "Sistem bu məlumatla hər il yenilənir və hansı qaydanın işlədiyini göstərir.",
        link: ["/metodologiya", "Ölçmə qaydası"],
      },
    ],
  },
];

GROUPS.reduce((acc, g) => (START.push(acc), acc + g.rules.length), 0);

const Policy = () => {
  const analysis = useGet("bakuAnalysis", ENDPOINTS.BAKU_ANALYSIS);
  const synth = useGet("bakuSynthSummary", ENDPOINTS.BAKU_SYNTH_SUMMARY);
  const c = analysis.data?.city;
  const s = synth.data;
  const ready = c && s;

  return (
    <Section>
      <Helmet>
        <title>Qayda təklifləri · SmartUrban Bakı</title>
        <meta name="description" content="Sistemin tapdığı 8 problemə qarşı 10 qayda təklifi: piyada keçidi, sürət, kölgə, parkinq, nəqliyyat, büdcə və açıq məlumat." />
      </Helmet>
      <Container>
        <SectionHeading eyebrow="13 · Pilotdan qaydaya" title="Hansı qaydalar sistemi gücləndirər" lede="Sistem problemi tapır, pilot həlli sınayır. Həllin bütün şəhərə yayılması üçün qayda lazımdır." />
        <PageIntro
          art={<Checklist />}
          answer="Burada 10 qayda təklifi var. Hər biri xəritədə tapdığımız bir problemi həll edir."
          steps={["Əvvəl tez nəticə verən 3 qaydaya baxın.", "Hər kartda: nə dəyişir və niyə lazımdır.", "Rəngli etiket qaydanın hansı problemə aid olduğunu göstərir."]}
          idea="Qısası: ölçürük → sınayırıq → işləyəni qayda edirik."
        />
        <LensStrip page="/qaydalar" step={6} />
        <ZoneLink to="/bolgeleme">
          <b>Hər zona üçün ayrıca təkliflər</b>
          <span>Rayon qərar üçün çox böyükdür. Şəhəri 237 planlama zonasına böldük: hər zonanın öz problemləri və ona uyğun qaydaları var.</span>
          <ArrowRight size={18} />
        </ZoneLink>

        {ready && (
          <Stats>
            <div>
              <b>
                <CountUp value={s.hot_pop} />
              </b>
              <span>insan problem ocaqlarında yaşayır</span>
            </div>
            <div>
              <b>
                <CountUp value={c.pop_no_metro} />
              </b>
              <span>insan metrosu olmayan rayonlarda</span>
            </div>
            <div>
              <b>
                <CountUp value={c.lst_popw} decimals={1} suffix="°C" />
              </b>
              <span>yay günü evlərin yanında yer səthi</span>
            </div>
          </Stats>
        )}

        {GROUPS.map((g, gi) => (
          <Group key={g.key}>
            <GroupHead>
              <h2>{g.title}</h2>
              <p>{g.lede}</p>
            </GroupHead>
            <Grid>
              {g.rules.map((r, ri) => {
                const why = typeof r.why === "function" ? (ready ? r.why(c, s) : "") : r.why;
                return (
                  <Rule key={r.title} className={g.key}>
                    <Top>
                      <Num>{START[gi] + ri + 1}</Num>
                      <r.icon size={22} />
                    </Top>
                    <h3>{r.title}</h3>
                    <Tags>
                      {r.layers.map((l) => (
                        <span key={l}>{l}</span>
                      ))}
                    </Tags>
                    <dl>
                      <dt>Nə dəyişir</dt>
                      <dd>{r.what}</dd>
                      {why && (
                        <>
                          <dt>Niyə lazımdır</dt>
                          <dd>{why}</dd>
                        </>
                      )}
                    </dl>
                    <LensRow>
                      <LensTags ids={RULE_LENS[START[gi] + ri + 1]} />
                    </LensRow>
                    {r.link && (
                      <More to={r.link[0]}>
                        {r.link[1]} <ArrowRight size={15} />
                      </More>
                    )}
                  </Rule>
                );
              })}
            </Grid>
          </Group>
        ))}

        <Warn>
          <AlertTriangle size={18} />
          <p>
            Bunlar komandanın təklifləridir, hüquqi mətn deyil. Qəbul etməzdən əvvəl hüquqşünas mövcud qanunlarla (“Yol hərəkəti haqqında” Qanun, Şəhərsalma və Tikinti
            Məcəlləsi) müqayisə etməlidir. Rəqəmlər (200–300 m, 500 m, 30 km/saat) beynəlxalq təcrübədən götürülmüş ilkin dəyərlərdir.
          </p>
        </Warn>
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Policy;

const Section = styled.section`
  padding: 20px 0 56px;
`;

const ZoneLink = styled(Link)`
  ${card}
  ${hoverLift}
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  b {
    font-family: var(--font-bold);
    font-size: 16px;
    color: var(--accent);
  }
  span {
    grid-column: 1;
    font-size: 13.5px;
    color: var(--text-2);
  }
  svg {
    grid-row: 1 / span 2;
    grid-column: 2;
    color: var(--accent);
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
  > div {
    ${card}
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  b {
    font-family: var(--font-bold);
    font-size: 30px;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  span {
    font-size: 14px;
    color: var(--text-2);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Group = styled.section`
  margin-top: 40px;
`;

const GroupHead = styled.div`
  margin-bottom: 14px;
  h2 {
    font-family: var(--font-bold);
    font-size: 22px;
  }
  p {
    font-size: 14px;
    color: var(--text-3);
    margin-top: 4px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const Rule = styled.article`
  ${card}
  ${hoverLift}
  --tone: var(--accent);
  &.fast {
    --tone: var(--good);
  }
  &.system {
    --tone: var(--warn);
  }
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 3px solid var(--tone);

  h3 {
    font-family: var(--font-bold);
    font-size: 17px;
    letter-spacing: -0.01em;
  }
  dl {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  dt {
    font-family: var(--font-semibold);
    font-size: 12px;
    color: var(--tone);
    margin-top: 6px;
  }
  dd {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-2);
  }
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  svg {
    color: var(--tone);
  }
`;

const Num = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--font-bold);
  font-size: 14px;
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 15%, transparent);
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  span {
    font-family: var(--font-semibold);
    font-size: 11.5px;
    padding: 3px 9px;
    border-radius: 10px;
    color: var(--text-2);
    background: var(--bg-secondary);
    border: 1px solid var(--line);
  }
`;

const More = styled(Link)`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-semibold);
  font-size: 13.5px;
  color: var(--accent);
`;

const Warn = styled.div`
  ${card}
  margin-top: 36px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent);
  background: color-mix(in srgb, var(--warn) 8%, var(--panel));
  svg {
    flex: none;
    color: var(--warn);
    margin-top: 2px;
  }
  p {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-2);
  }
`;

const LensRow = styled.div`
  margin-top: 10px;
`;
