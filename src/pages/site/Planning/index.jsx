import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckSquare, Layers, Scale, Users } from "lucide-react";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import ErrorText from "@/components/common/Skeleton/ErrorText";
import LensTags from "@/components/common/LensTags";
import { card, table } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { fmt } from "@/utils/helpers/format";
import { AI_TOPICS, CHECKLIST, CORE, RULE_LENS, SOL_LENS, SUB } from "@/utils/mock/planning";

// Tutorial: inklüziv və kompleks planlama ADDIM-in analiz → sintez → təklif → AI zəncirində
const STEPS = [
  { key: "core", title: "İki əsas anlayış (Core concepts)", icon: Scale },
  { key: "sub", title: "18 alt anlayış (Sub-concepts)", icon: Layers },
  { key: "inc", title: "Analiz: kim kənarda qalır (Equity analysis)", icon: Users },
  { key: "comp", title: "Analiz: problemlər birlikdə (Integrated analysis)", icon: Layers },
  { key: "synth", title: "Sintez: zəiflik və prioritet (Vulnerability & priority)", icon: Users },
  { key: "props", title: "Təkliflər (Proposals)", icon: CheckSquare },
  { key: "ai", title: "AI mövzuları (AI topics)", icon: BrainCircuit },
  { key: "check", title: "Planlayıcı çeklisti (Planner checklist)", icon: CheckSquare },
];
const STATUS = { ölçülür: "good", qismən: "warn", boşluq: "critical" };
const SOL_TITLE = { A: "Yer üstü keçid", B: "Məktəb yolu", C: "Kölgə", D: "Cib parkı", E: "Dayanacaq", F: "Piyada keçidi (dalan)", G: "Market, aptek", H: "Pandus, məhəccər", I: "Drenaj" };

const Planning = () => {
  const [params, setParams] = useSearchParams();
  const step = Math.min(STEPS.length - 1, Math.max(0, Number(params.get("addim") || 1) - 1));
  const go = (i) => setParams({ addim: String(i + 1) }, { replace: false });
  const L = useGet("planningLens", ENDPOINTS.PLANNING_LENS);
  const T = useGet("transitAccess", ENDPOINTS.TRANSIT_ACCESS);
  const Z = useGet("zoning", ENDPOINTS.ZONING);

  useEffect(() => {
    document.getElementById("tutorial")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const ready = L.data && T.data && Z.data;
  const S = STEPS[step];
  return (
    <Section>
      <Helmet>
        <title>İnklüziv (Inclusive) və kompleks (Comprehensive) planlama · ADDIM Bakı</title>
        <meta name="description" content="Tutorial: inklüziv və kompleks planlama anlayışları ADDIM-in analizində, sintezində, təkliflərində və AI modullarında." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="Tutorial · 8 addım"
          title="İnklüziv (Inclusive) və kompleks (Comprehensive) planlama"
          lede="ADDIM-in bütün işi iki sual üzərində qurulur: şəhərin imkanları hər kəsə çatırmı (inklüziv planlama, inclusive planning) və problemlər bir sistem kimi birlikdə həll olunurmu (kompleks planlama, comprehensive planning)? Bu tutorial hər iki anlayışın alt anlayışlarını, onların datamızla necə ölçüldüyünü və təkliflərə, AI-a necə keçdiyini addım-addım göstərir."
        />
        <Progress id="tutorial">
          {STEPS.map((s, i) => (
            <button key={s.key} type="button" className={i === step ? "on" : i < step ? "done" : ""} onClick={() => go(i)} aria-current={i === step ? "step" : undefined}>
              <i>{i + 1}</i>
              <span>{s.title}</span>
            </button>
          ))}
        </Progress>
        {(L.isError || T.isError || Z.isError) && <ErrorText />}
        <Panel>
          <h2>
            <S.icon size={22} /> Addım {step + 1}. {S.title}
          </h2>
          {S.key === "core" && <StepCore />}
          {S.key === "sub" && <StepSub />}
          {ready && S.key === "inc" && <StepInclusive L={L.data} T={T.data} />}
          {ready && S.key === "comp" && <StepComprehensive L={L.data} />}
          {ready && S.key === "synth" && <StepSynth L={L.data} T={T.data} />}
          {ready && S.key === "props" && <StepProposals L={L.data} Z={Z.data} />}
          {S.key === "ai" && <StepAi T={T.data} />}
          {S.key === "check" && <StepCheck />}
        </Panel>
        <Nav>
          <button type="button" disabled={step === 0} onClick={() => go(step - 1)}>
            <ArrowLeft size={16} /> Geri
          </button>
          <span>
            {step + 1} / {STEPS.length}
          </span>
          <button type="button" className="primary" disabled={step === STEPS.length - 1} onClick={() => go(step + 1)}>
            İrəli <ArrowRight size={16} />
          </button>
        </Nav>
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default Planning;

/* ---------- Addımlar ---------- */

const StepCore = () => (
  <>
    <Lead>İki anlayış bir-birini tamamlayır: inklüziv planlama “kim üçün?” sualına, kompleks planlama “necə, kimlə, hansı ardıcıllıqla?” sualına cavab verir. Biri olmadan digəri yarımçıqdır.</Lead>
    <Two>
      {Object.entries(CORE).map(([k, c]) => (
        <Core key={k} style={{ "--c": `var(${c.color})` }}>
          <b>{c.code}</b>
          <h3>
            {c.title} <small>({c.en})</small>
          </h3>
          <p>{c.def}</p>
          <q>{c.question}</q>
        </Core>
      ))}
    </Two>
    <Box>
      <h3>ADDIM-də necə işləyir</h3>
      <Flow>
        <li>
          <b>Analiz</b> hər göstəricini iki cür oxuyur: orta dəyər yox, kimin ən pis vəziyyətdə olduğu (İ); bir problem yox, problemlərin harada üst-üstə düşdüyü (K).
        </li>
        <li>
          <b>Sintez</b> ehtiyac balını sosial zəiflik indeksi ilə tamamlayır (İ) və zonaları kəskin sektor sayına görə qruplaşdırır (K).
        </li>
        <li>
          <b>Təkliflər</b>: hər həll və qayda hansı qrupu qoruduğunu (İ) və hansı sahələri birləşdirdiyini (K) göstərir.
        </li>
        <li>
          <b>AI</b> ədalət yönümlü optimallaşdırır, öz qərarlarını audit edir və sakinin səsini plana gətirir.
        </li>
      </Flow>
      <Small>Əsas istinadlar: BMT-Habitat “Yeni Şəhər Gündəliyi” (2016) və SDG 11 (“inklüziv, təhlükəsiz, dayanıqlı şəhərlər”); kompleks plan anlayışı şəhərsalma praktikasında torpaq istifadəsi, nəqliyyat, ətraf mühit və xidmətlərin vahid sənəddə planlanmasıdır.</Small>
    </Box>
  </>
);

const StepSub = () => {
  const counts = useMemo(() => SUB.reduce((a, s) => ((a[s.status] = (a[s.status] || 0) + 1), a), {}), []);
  return (
    <>
      <Lead>
        Hər alt anlayış üçün: nə deməkdir, biz onu necə ölçürük və saytda harada görmək olar. Vəziyyət dürüst göstərilir: {counts["ölçülür"]} alt anlayış datamızla ölçülür, {counts["qismən"]} qismən, {counts["boşluq"]} data boşluğudur.
      </Lead>
      <Two>
        {["I", "K"].map((c) => (
          <div key={c}>
            <ColHead style={{ "--c": `var(${CORE[c].color})` }}>
              {CORE[c].code} · {CORE[c].title} ({CORE[c].en})
            </ColHead>
            <SubList>
              {SUB.filter((s) => s.core === c).map((s) => (
                <li key={s.id} id={s.id}>
                  <header>
                    <code>{s.id.replace("I", "İ")}</code>
                    <b>
                      {s.title} <small>({s.en})</small>
                    </b>
                    <Status className={STATUS[s.status]}>{s.status}</Status>
                  </header>
                  <p>{s.def}</p>
                  <p className="m">
                    <b>Ölçü:</b> {s.measure}
                  </p>
                  {s.where && (
                    <Link to={s.where[0]} className="go">
                      Saytda: {s.where[1]} <ArrowRight size={12} />
                    </Link>
                  )}
                </li>
              ))}
            </SubList>
          </div>
        ))}
      </Two>
    </>
  );
};

const StepInclusive = ({ L, T }) => {
  const eq = L.equity.filter((e) => e.key !== "heat");
  const heat = L.equity.find((e) => e.key === "heat");
  return (
    <>
      <Lead>
        Orta dəyər bərabərsizliyi gizlədir. Ona görə hər xidmət üçün soruşuruq: ən pis təmin olunmuş 20% əhali ən yaxşı 20%-dən neçə dəfə uzaqdadır (Palma tipli nisbət, Palma ratio)? Gini əmsalı (Gini coefficient) isə ümumi bərabərsizliyi ölçür. <LensTags ids={["I1", "I3", "I8"]} />
      </Lead>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th>Xidmət</th>
              <th>Kim üçün vacib</th>
              <th>Ən yaxşı 20%</th>
              <th>Ən pis 20%</th>
              <th>Neçə dəfə</th>
              <th>Gini</th>
              <th>Həddən uzaq</th>
            </tr>
          </thead>
          <tbody>
            {eq.map((e) => (
              <tr key={e.key}>
                <td>
                  <b>{e.name}</b>
                </td>
                <td>{e.group}</td>
                <td>{fmt(e.best20)} m</td>
                <td>{fmt(e.worst20)} m</td>
                <td>
                  <Ratio style={{ "--w": `${Math.min(100, e.palma * 2.5)}%` }}>{e.palma}×</Ratio>
                </td>
                <td>{e.gini}</td>
                <td>
                  {e.over_pct}% <Small as="span">(&gt; {fmt(e.threshold)} m)</Small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <Insight>
        <b>Nə deyir:</b> ən qeyri-bərabər paylanan imkan metroya çatımlılıqdır (Gini {eq.find((e) => e.key === "metro").gini}). Ən pis 20% parka {eq.find((e) => e.key === "park").palma}, aptekə {eq.find((e) => e.key === "pharm").palma} dəfə uzaqdır. İstilik isə
        demək olar ki bərabərdir (Gini {heat.gini}): əhalinin {heat.over_pct}%-i 42°C-dən isti məhəllədə yaşayır. Deməli istilik universal, xidmətlər isə hədəfli həll tələb edir.
      </Insight>
      <H3>Qruplar üzrə: şəhər kim üçün işləyir</H3>
      <Groups>
        {L.groups.map((g) => (
          <li key={g.group}>
            <h4>{g.group}</h4>
            <Small>≈ {fmt(g.pop_est)} nəfər</Small>
            {g.items.map(([label, v]) => (
              <Bar key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${v}%` }} />
                </div>
                <b>{v}%</b>
              </Bar>
            ))}
          </li>
        ))}
      </Groups>
      <H3>Rayonlar arası uçurum</H3>
      <Gaps>
        {L.rayon_gaps.map((g) => (
          <li key={g.key}>
            <b>{g.name}</b>
            <span>
              {g.best}: {g.best_v}
              {g.unit} · {g.worst}: {g.worst_v}
              {g.unit}
            </span>
            <em>{g.ratio}×</em>
          </li>
        ))}
      </Gaps>
      <Small>
        Məhdudiyyət: {L.method.limits}. Dayanacaq məsafəsi piyada şəbəkəsi ilə ({fmt(T.summary.stops_n)} dayanacaq), qalanları düz xəttlə hesablanıb.
      </Small>
    </>
  );
};

const SECTOR_COLOR = { move: "--accent", env: "--good", risk: "--warn", svc: "--serious" };
const StepComprehensive = ({ L }) => {
  const hist = L.sector_hist;
  const max = Math.max(...Object.values(hist).map((h) => h.pop));
  const multi = (hist["3"]?.pop || 0) + (hist["4"]?.pop || 0);
  const multiZ = (hist["3"]?.zones || 0) + (hist["4"]?.zones || 0);
  return (
    <>
      <Lead>
        Səkkiz problem qatı dörd sektora bölünür (sektorlararası inteqrasiya, cross-sector integration). Bir zonada bir neçə sektor eyni anda kəskindirsə, bir qurumun ayrıca layihəsi işləməz: birgə paket lazımdır. <LensTags ids={["K1", "K6", "K2"]} />
      </Lead>
      <Sectors>
        {Object.entries(L.sectors).map(([k, s]) => (
          <li key={k} style={{ "--c": `var(${SECTOR_COLOR[k]})` }}>
            <b>{s.name}</b>
            <span>{s.layers.map((l) => ZLAYER[l]).join(", ")}</span>
            <em>{s.agencies}</em>
          </li>
        ))}
      </Sectors>
      <H3>Zonada neçə sektor kəskindir</H3>
      <Hist>
        {Object.entries(hist).map(([n, h]) => (
          <li key={n}>
            <span>{n} sektor</span>
            <div>
              <i style={{ width: `${(100 * h.pop) / max}%` }} className={Number(n) >= 3 ? "hot" : ""} />
            </div>
            <b>
              {h.zones} zona · {fmt(h.pop)} insan
            </b>
          </li>
        ))}
      </Hist>
      <Insight>
        <b>Nə deyir:</b> {multiZ} zonada ({fmt(multi)} insan) 3–4 sektor eyni anda kəskindir. Bu zonalar üçün ayrı-ayrı layihə yox, inteqrasiya olunmuş paket lazımdır. Ən çox rast gəlinən cüt:{" "}
        {L.sectors[L.sector_pairs[0].a].name} + {L.sectors[L.sector_pairs[0].b].name} ({fmt(L.sector_pairs[0].pop)} insan).
      </Insight>
      <H3>Ən çox birlikdə lazım olan sektor cütləri</H3>
      <Gaps>
        {L.sector_pairs.map((p) => (
          <li key={p.a + p.b}>
            <b>
              {L.sectors[p.a].name} + {L.sectors[p.b].name}
            </b>
            <span>
              {L.sectors[p.a].agencies} · {L.sectors[p.b].agencies}
            </span>
            <em>{fmt(p.pop)}</em>
          </li>
        ))}
      </Gaps>
    </>
  );
};
const ZLAYER = { heat: "istilik", green_gap: "yaşıllıq", transit_gap: "nəqliyyat boşluğu", fragment: "şəbəkə qırıqlığı", car: "avtomobil", slope: "relyef", lowland: "alçaq sahil", service_gap: "xidmət" };

const StepSynth = ({ L, T }) => {
  const top = [...L.zones].sort((a, b) => a.pos_inc - b.pos_inc).slice(0, 15);
  const bySvi = [...L.zones].sort((a, b) => b.svi - a.svi).slice(0, 8);
  const all10 = T.scenarios.all.proposals.slice(0, 10);
  const far10 = T.scenarios.far.proposals.slice(0, 10);
  const hi = (P) => P.reduce((a, p) => a + (p.hi_svi || 0), 0);
  const gain = (P) => P.reduce((a, p) => a + p.gain, 0);
  return (
    <>
      <Lead>
        Sintez iki balı birləşdirir: <b>ehtiyac</b> (8 problemin ortası) və <b>sosial zəiflik indeksi (Social Vulnerability Index, SVI)</b>, yəni həmin yerdə yaşayanların dəyişikliyə nə qədər həssas olduğu. Prioritet = {L.method.priority}. <LensTags ids={["I1", "I3", "K2"]} />
      </Lead>
      <SviParts>
        {Object.values(L.svi_parts).map((p) => (
          <li key={p}>{p}</li>
        ))}
      </SviParts>
      <Two>
        <div>
          <H3>İnklüziv prioritet: ilk 15 zona</H3>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Zona</th>
                  <th>İnsan</th>
                  <th>Ehtiyac</th>
                  <th>SVI</th>
                  <th>Sektor</th>
                  <th>Əvvəl</th>
                </tr>
              </thead>
              <tbody>
                {top.map((z) => (
                  <tr key={z.rank}>
                    <td>{z.pos_inc}</td>
                    <td>
                      <b>{z.name}</b> <Small as="span">{z.rayon}</Small>
                    </td>
                    <td>{fmt(z.pop)}</td>
                    <td>{z.need}</td>
                    <td>{z.svi}</td>
                    <td>{z.sectors.length}</td>
                    <td className={z.pos_need > z.pos_inc ? "up" : z.pos_need < z.pos_inc ? "down" : ""}>{z.pos_need}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </div>
        <div>
          <H3>Ən həssas zonalar (SVI)</H3>
          <Gaps>
            {bySvi.map((z) => (
              <li key={z.rank}>
                <b>{z.name}</b>
                <span>
                  {z.rayon} · {fmt(z.pop)} insan{z.hi_school ? ` · ${z.hi_school} riskli məktəb` : ""}
                </span>
                <em>{z.svi}</em>
              </li>
            ))}
          </Gaps>
        </div>
      </Two>
      <Insight>
        <b>Səmərəlilik ədalətlə eyni deyil.</b> Dayanacaq alqoritmi yalnız “ən çox insan” üçün işləyəndə ilk 10 dayanacaq {fmt(gain(all10))} insana fayda verir, amma bunun yalnız <b>{fmt(hi(all10))}</b> nəfəri həssas (SVI ≥ 60) zonalardadır. Periferiya
        fokusunda ({fmt(gain(far10))} insan) həssas zonalara çatan fayda <b>{fmt(hi(far10))}</b> nəfərdir. Ehtiyac sıralamasına SVI əlavə edəndə ilk {L.shift.top_n}-yə {L.shift.entered.length ? L.shift.entered.join(", ") : "yeni zona"} daxil olur: prioritet siyahısı sabitdir, sıra isə
        həssas zonaların xeyrinə dəyişir.
      </Insight>
      <Small>
        Bütün zonalar üzrə tam siyahı: <Link to="/bolgeleme">Bölgələmə</Link>. Simulyator: <Link to="/dayanacaq">Dayanacağa 5 dəqiqə</Link>.
      </Small>
    </>
  );
};

const StepProposals = ({ L, Z }) => {
  const ids = SUB.map((s) => s.id);
  return (
    <>
      <Lead>Hər piyada həlli və hər qayda hansı alt anlayışa xidmət edir. Boş sütun = bu alt anlayış üçün hələ təklif yoxdur (növbəti iş).</Lead>
      <TableWrap>
        <table className="matrix">
          <thead>
            <tr>
              <th>Həll</th>
              {ids.map((id) => (
                <th key={id} title={`${SUB.find((s) => s.id === id).title} (${SUB.find((s) => s.id === id).en})`}>
                  {id.replace("I", "İ")}
                </th>
              ))}
              <th>İnsan</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SOL_LENS).map(([k, sub]) => (
              <tr key={k}>
                <td>
                  <b>{k}</b> {Z.solutions[k]?.title || SOL_TITLE[k]}
                </td>
                {ids.map((id) => (
                  <td key={id} className={sub.includes(id) ? (id[0] === "I" ? "i" : "k") : ""}>
                    {sub.includes(id) ? "●" : ""}
                  </td>
                ))}
                <td>{fmt(Z.solution_totals[k]?.pop)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <Insight>
        <b>Boşluqlar:</b> {SUB.filter((s) => !Object.values(SOL_LENS).flat().includes(s.id) && !Object.values(RULE_LENS).flat().includes(s.id))
          .map((s) => s.title)
          .join(", ") || "yoxdur"}{" "}
        üçün nə həll, nə qayda var. Gender həssas planlama yalnız piyada keçidi ilə əhatə olunub: gecə işıqlandırması və təhlükəsizlik sorğusu növbəti təklif olmalıdır.
      </Insight>
      <H3>Paketlər: blokda birlikdə lazım olan həllər</H3>
      <Small>Əhalinin {L.sol_multi_pct}%-i iki və daha çox həll tələb edən bloklarda yaşayır.</Small>
      <Gaps>
        {L.sol_pairs.slice(0, 6).map((p) => (
          <li key={p.a + p.b}>
            <b>
              {p.a} + {p.b}
            </b>
            <span>
              {Z.solutions[p.a]?.title} + {Z.solutions[p.b]?.title}
            </span>
            <em>{fmt(p.pop)}</em>
          </li>
        ))}
      </Gaps>
      <H3>10 qayda</H3>
      <Rules>
        {Object.entries(Z.rules).map(([n, t]) => (
          <li key={n}>
            <code>{n}</code>
            <span>{t}</span>
            <LensTags ids={RULE_LENS[n]} />
          </li>
        ))}
      </Rules>
    </>
  );
};

const StepAi = ({ T }) => (
  <>
    <Lead>
      İnklüziv və kompleks planlama üçün AI-ın 9 əsas mövzusu. Hər birində: nə edir, hansı alt anlayışa xidmət edir və konkret təklifimiz. Mövcud modullarla əlaqə (M1–M8): <Link to="/ai">AI modulları</Link>.
    </Lead>
    <Topics>
      {AI_TOPICS.map((t) => (
        <li key={t.title}>
          <header>
            <b>
              {t.title} <small>({t.en})</small>
            </b>
            <Status className={t.status === "işləyir" ? "good" : t.status === "qismən" ? "warn" : "muted"}>{t.status}</Status>
          </header>
          <p>{t.what}</p>
          <p className="s">
            <b>Təklif:</b> {t.suggestion}
          </p>
          <footer>
            <LensTags ids={t.sub} />
            <code>{t.modules.join(" · ")}</code>
          </footer>
        </li>
      ))}
    </Topics>
    {T && (
      <Insight>
        <b>Prinsip:</b> AI qərar vermir, təklif edir və öz təklifinin kimə çatdığını göstərir. Məsələn, dayanacaq alqoritmi hər ssenaridə həssas zonalara çatan faydanı ayrıca hesablayır; bu, ədalət auditinin ilk addımıdır.
      </Insight>
    )}
  </>
);

const StepCheck = () => {
  const [done, setDone] = useState({});
  const n = Object.values(done).filter(Boolean).length;
  return (
    <>
      <Lead>İstənilən küçə, dayanacaq və ya park layihəsini bu 10 sualla yoxlayın. Hər “yox” cavabı layihədə boşluqdur.</Lead>
      <Check>
        {CHECKLIST.map(([c, q], i) => (
          <li key={q}>
            <label>
              <input type="checkbox" checked={!!done[i]} onChange={(e) => setDone({ ...done, [i]: e.target.checked })} />
              <code className={c === "I" ? "i" : "k"}>{CORE[c].code}</code>
              <span>{q}</span>
            </label>
          </li>
        ))}
      </Check>
      <Score>
        {n} / {CHECKLIST.length} {n === CHECKLIST.length ? "· layihə inklüziv və kompleksdir" : n >= 7 ? "· yaxşıdır, boşluqları bağlayın" : "· layihə yenidən baxılmalıdır"}
      </Score>
      <Small>
        Davamı: <Link to="/dayanacaq">Dayanacaq simulyatoru</Link> · <Link to="/bolgeleme">Bölgələmə</Link> · <Link to="/qaydalar">Qaydalar</Link>
      </Small>
    </>
  );
};

/* ---------- Üslub ---------- */

const Section = styled.section`
  padding: 20px 0 56px;
`;
const Progress = styled.nav`
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
  margin-top: 20px;
  scroll-margin-top: 80px;
  button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--text-2);
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }
  i {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--line);
    font-style: normal;
    font-weight: 700;
    font-size: 11px;
  }
  .done i {
    background: color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .on {
    border-color: var(--accent);
    color: var(--text);
  }
  .on i {
    background: var(--accent);
    color: #fff;
  }
  @media (max-width: 980px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (max-width: 560px) {
    grid-template-columns: repeat(8, 34px);
    overflow-x: auto;
    span {
      display: none;
    }
  }
`;
const Panel = styled.section`
  ${card}
  margin-top: 14px;
  > h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-bold);
    font-size: 22px;
    margin-bottom: 8px;
    svg {
      color: var(--accent);
    }
  }
`;
const Lead = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-2);
  max-width: 90ch;
  margin-bottom: 14px;
`;
const H3 = styled.h3`
  font-family: var(--font-bold);
  font-size: 17px;
  margin: 22px 0 8px;
`;
const Small = styled.p`
  font-size: 12.5px;
  color: var(--text-3);
  margin-top: 8px;
  a {
    color: var(--accent);
  }
`;
const Two = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
const Core = styled.article`
  border: 1px solid var(--line);
  border-top: 4px solid var(--c);
  border-radius: 16px;
  padding: 16px;
  > b {
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--c);
    color: #fff;
    font-family: var(--font-bold);
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 19px;
    margin: 10px 0 6px;
  }
  small {
    font-size: 12px;
    color: var(--text-3);
    font-family: var(--font-regular, inherit);
  }
  p {
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-2);
  }
  q {
    display: block;
    margin-top: 10px;
    font-style: italic;
    color: var(--text);
  }
`;
const Box = styled.div`
  margin-top: 16px;
  border: 1px dashed var(--line);
  border-radius: 16px;
  padding: 16px;
  h3 {
    font-family: var(--font-bold);
    font-size: 16px;
    margin-bottom: 8px;
  }
`;
const Flow = styled.ol`
  display: grid;
  gap: 8px;
  padding-left: 18px;
  list-style: decimal;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-2);
`;
const ColHead = styled.h3`
  font-family: var(--font-bold);
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--c) 14%, transparent);
  color: var(--c);
  margin-bottom: 8px;
`;
const SubList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  li {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
    scroll-margin-top: 90px;
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  code {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--line);
  }
  header b {
    flex: 1;
    font-size: 14px;
  }
  header small {
    font-weight: 400;
    font-size: 12px;
    color: var(--text-3);
  }
  p {
    font-size: 13px;
    color: var(--text-2);
    margin-top: 6px;
    line-height: 1.5;
  }
  p.m {
    color: var(--text-3);
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--accent);
    margin-top: 6px;
  }
`;
const Status = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  &.good {
    background: color-mix(in srgb, var(--good) 18%, transparent);
    color: var(--good);
  }
  &.warn {
    background: color-mix(in srgb, var(--warn) 18%, transparent);
    color: var(--warn);
  }
  &.critical {
    background: color-mix(in srgb, var(--critical) 18%, transparent);
    color: var(--critical);
  }
  &.muted {
    background: var(--line);
    color: var(--text-3);
  }
`;
const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
  table {
    ${table}
  }
  td.up {
    color: var(--good);
  }
  td.down {
    color: var(--critical);
  }
  .matrix td,
  .matrix th {
    text-align: center;
    padding: 6px 4px;
  }
  .matrix td:first-child {
    text-align: left;
    white-space: nowrap;
  }
  .matrix td.i {
    color: var(--accent);
  }
  .matrix td.k {
    color: var(--good);
  }
`;
const Ratio = styled.span`
  display: inline-block;
  min-width: 60px;
  font-weight: 700;
  background: linear-gradient(to right, color-mix(in srgb, var(--critical) 30%, transparent) var(--w), transparent var(--w));
  padding: 2px 6px;
  border-radius: 6px;
`;
const Insight = styled.p`
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  font-size: 14px;
  line-height: 1.55;
`;
const Groups = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  li {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
  }
  h4 {
    font-family: var(--font-bold);
    font-size: 15px;
  }
`;
const Bar = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
  margin-top: 8px;
  font-size: 12.5px;
  div {
    height: 8px;
    background: var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  i {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  b {
    font-size: 12px;
  }
`;
const Gaps = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 8px 12px;
  }
  b {
    font-size: 14px;
  }
  span {
    grid-row: 2;
    font-size: 12.5px;
    color: var(--text-3);
  }
  em {
    grid-row: span 2;
    align-self: center;
    font-style: normal;
    font-family: var(--font-bold);
    font-size: 17px;
  }
`;
const Sectors = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  li {
    border: 1px solid var(--line);
    border-left: 4px solid var(--c);
    border-radius: 12px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  span {
    font-size: 13px;
    color: var(--text-2);
  }
  em {
    font-size: 12px;
    color: var(--text-3);
    font-style: normal;
  }
`;
const Hist = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  li {
    display: grid;
    grid-template-columns: 70px 1fr 200px;
    gap: 10px;
    align-items: center;
    font-size: 13px;
  }
  div {
    height: 14px;
    background: var(--line);
    border-radius: 7px;
    overflow: hidden;
  }
  i {
    display: block;
    height: 100%;
    background: var(--text-3);
  }
  i.hot {
    background: var(--critical);
  }
  @media (max-width: 560px) {
    li {
      grid-template-columns: 60px 1fr;
    }
    b {
      grid-column: 1 / -1;
    }
  }
`;
const SviParts = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  li {
    font-size: 12.5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--line);
  }
`;
const Rules = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  code {
    font-weight: 700;
    width: 24px;
  }
  span {
    flex: 1;
    min-width: 180px;
  }
`;
const Topics = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  li {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  header small {
    font-weight: 400;
    font-size: 12px;
    color: var(--text-3);
  }
  p {
    font-size: 13.5px;
    color: var(--text-2);
    line-height: 1.5;
  }
  p.s {
    color: var(--text);
  }
  footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  footer code {
    font-size: 11px;
    color: var(--text-3);
  }
`;
const Check = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
  }
  input {
    margin-top: 3px;
    accent-color: var(--accent);
  }
  code {
    font-weight: 700;
    font-size: 12px;
    padding: 1px 6px;
    border-radius: 6px;
    color: #fff;
  }
  code.i {
    background: var(--accent);
  }
  code.k {
    background: var(--good);
  }
`;
const Score = styled.p`
  margin-top: 12px;
  font-family: var(--font-bold);
  font-size: 18px;
`;
const Nav = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--text);
    cursor: pointer;
    font-size: 14px;
  }
  button.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  span {
    font-size: 13px;
    color: var(--text-3);
  }
`;
