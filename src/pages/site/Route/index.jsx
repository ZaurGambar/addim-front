import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Accessibility, AlertTriangle, Baby, CheckCircle2, Footprints, Megaphone, PersonStanding, Search, UserRound } from "lucide-react";
import Card from "@/components/common/Card";
import Container from "@/styles/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import PageIntro from "@/components/common/PageIntro";
import LensStrip from "@/components/common/LensStrip";
import { Steps as StepsArt } from "@/components/common/Illustrations";
import PageMobilSafeArea from "@/components/common/PageMobilSafeArea";
import MapLayout, { MapBox } from "@/components/site/common/MapLayout";
import { card } from "@/styles/common/mixins";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { useLeafletMap } from "@/utils/hooks/useLeafletMap";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { cssVar, fmt } from "@/utils/helpers/format";
import { SF_PROFILE, deviceId, planJourney, searchPlaces, sendReport } from "@/utils/api/smartflow";

// SmartFlow marşrutu + SmartUrban əlçatanlıq yoxlaması: hər variant profilin sürəti və maneələrlə yenidən qiymətləndirilir
const BOUNDS = [[40.33, 49.75], [40.47, 49.98]];
const KX = 111320 * Math.cos((40.4 * Math.PI) / 180);
const KY = 111320;
const PROFILES = [
  { id: "adult", label: "Orta piyada", icon: PersonStanding, speed: 80, strict: false },
  { id: "elderly", label: "Yaşlı", icon: UserRound, speed: 60, strict: false },
  { id: "wheel", label: "Əlil arabası", icon: Accessibility, speed: 60, strict: true },
  { id: "stroller", label: "Uşaq arabası", icon: Baby, speed: 65, strict: true },
];
const MODE_COLOR = { walk: "--text-2", bus: "--accent", metro: "--critical", bike: "--good", car: "--warn", via: "--text-3" };
const REPORT_TYPES = [
  { id: "ramp", label: "Pandus yoxdur / bordür hündürdür", sf: "other" },
  { id: "lift", label: "Lift işləmir / yoxdur", sf: "other" },
  { id: "sidewalk", label: "Səki dar, səkidə maşın", sf: "other" },
  { id: "stairs", label: "Yalnız pilləkən (yeraltı keçid)", sf: "unsafe-crossing" },
  { id: "crossing", label: "Təhlükəli keçid", sf: "unsafe-crossing" },
  { id: "stop", label: "Əlçatan dayanacaq lazımdır", sf: "need-stop" },
  { id: "rest", label: "Oturacaq, kölgə yoxdur", sf: "other" },
];

const legLines = (l) => {
  if (l.segments?.length) return l.segments.map((s) => s.geometry).filter((g) => g?.length > 1);
  if (l.geometry?.length > 1) return [l.geometry];
  return (l.steps || []).map((s) => s.geometry).filter((g) => g?.length > 1);
};
// nöqtədən xəttə məsafə, m (yerli müstəvi)
const distToLine = (p, line) => {
  let best = Infinity;
  const px = p[0] * KX;
  const py = p[1] * KY;
  for (let i = 1; i < line.length; i++) {
    const ax = line[i - 1][0] * KX;
    const ay = line[i - 1][1] * KY;
    const bx = line[i][0] * KX;
    const by = line[i][1] * KY;
    const dx = bx - ax;
    const dy = by - ay;
    const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return best;
};

// Variantın əlçatanlıq yoxlaması
const audit = (o, prof, B) => {
  const walkLines = o.legs.filter((l) => l.mode === "walk").flatMap(legLines);
  const under = B ? B.underpasses.filter((u) => walkLines.some((ln) => distToLine(u, ln) <= B.radius_m)) : [];
  const steep = B ? B.steep.filter((s) => walkLines.some((ln) => distToLine(s, ln) <= 20)) : [];
  const metro = o.legs.some((l) => l.mode === "metro");
  const bike = o.legs.some((l) => l.mode === "bike");
  const walkM = o.walkM ?? o.legs.filter((l) => l.mode === "walk").reduce((a, l) => a + (l.distanceM || 0), 0);
  const extra = (walkM * (1 / prof.speed - 1 / 80));
  const issues = [];
  if (under.length) issues.push({ sev: prof.strict ? 2 : prof.id === "elderly" ? 1 : 0, text: `${under.length} yeraltı keçid yolda (pilləkən)` });
  if (steep.length) issues.push({ sev: prof.strict ? 2 : prof.id === "elderly" ? 1 : 0, text: `${steep.length} dik hissə (> 8%, max ${Math.max(...steep.map((s) => s[2]))}%)` });
  if (metro && prof.strict) issues.push({ sev: 1, text: "Metro: stansiyada lift olub-olmadığı məlum deyil" });
  if (bike && prof.id !== "adult") issues.push({ sev: 2, text: "Velosiped hissəsi bu profil üçün uyğun deyil" });
  if (walkM > prof.speed * 10 && prof.id !== "adult") issues.push({ sev: 1, text: `${fmt(Math.round(walkM))} m piyada: bu profil üçün 10 dəqiqədən çox` });
  const sev = issues.reduce((a, i) => Math.max(a, i.sev), 0);
  return { under, steep, issues, sev, minutes: o.minutes + Math.max(0, extra), walkM };
};

const PlaceInput = ({ label, value, onPick }) => {
  const [q, setQ] = useState(value?.name || "");
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2 || q === value?.name) return undefined;
    const t = setTimeout(() => {
      searchPlaces(q.trim())
        .then((r) => {
          setList(r.slice(0, 6));
          setOpen(true);
        })
        .catch(() => setList([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q, value]);
  return (
    <Field>
      <span>{label}</span>
      <div>
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => list.length && setOpen(true)} placeholder="Yer, metro, küçə…" aria-label={label} />
      </div>
      {open && list.length > 0 && (
        <ul role="listbox">
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(p);
                  setQ(p.name);
                  setOpen(false);
                }}
              >
                <b>{p.name}</b>
                <small>{p.subtitle}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
};

const RoutePage = () => {
  const [from, setFrom] = useState({ id: "p-28may", name: "28 May metrosu", lon: 49.8486, lat: 40.3797 });
  const [to, setTo] = useState({ id: "p13", name: "Gənclik metrosu", lon: 49.85142, lat: 40.40041 });
  const [profile, setProfile] = useState("wheel");
  const [state, setState] = useState({ loading: false, error: null, data: null, key: null });
  const [sel, setSel] = useState(0);
  const [report, setReport] = useState(null);
  const B = useGet("barriersAccess", ENDPOINTS.BARRIERS_ACCESS).data;

  const plan = () => {
    setState({ loading: true, error: null, data: null, key: null });
    setSel(0);
    planJourney({
      from: { lon: from.lon, lat: from.lat, name: from.name },
      to: { lon: to.lon, lat: to.lat, name: to.name },
      via: [],
      profile: SF_PROFILE[profile],
      service: "apar",
      modes: profile === "adult" ? [] : ["bus", "metro", "walk"],
    })
      .then((d) => setState({ loading: false, error: null, data: d, key: profile }))
      .catch((e) => setState({ loading: false, error: e.message, data: null, key: null }));
  };

  const options = useMemo(() => {
    if (!state.data) return [];
    const p = PROFILES.find((x) => x.id === state.key);
    return state.data.options.map((o) => ({ o, a: audit(o, p, B) })).sort((x, y) => x.a.sev - y.a.sev || x.a.minutes - y.a.minutes);
  }, [state, B]);
  const cur = options[sel];

  return (
    <Section>
      <Helmet>
        <title>Hər kəs üçün marşrut · SmartUrban Bakı</title>
        <meta name="description" content="SmartFlow marşrutları SmartUrban əlçatanlıq yoxlaması ilə: yaşlı, əlil arabası və uşaq arabası üçün maneələr və real vaxt." />
      </Helmet>
      <Container>
        <SectionHeading
          eyebrow="SmartFlow × SmartUrban"
          title="Hər kəs üçün marşrut"
          lede="SmartFlow ən yaşıl, ən sürətli və ən ucuz yolu tapır. SmartUrban isə hər variantı sizin profilinizlə yoxlayır: yolda pilləkənli yeraltı keçid, dik yamac, liftsiz metro varmı, sizin sürətinizlə yol neçə dəqiqə çəkir. Maneəni görən sakin onu bir kliklə AYNA-nın panelinə göndərir."
        />
        <PageIntro
          art={<StepsArt />}
          answer="Haradan və hara getdiyinizi yazın, profilinizi seçin. Variantlar maneəsizdən maneəliyə sıralanır."
          steps={["Başlanğıc və təyinat seçin, profili seçin.", "Variant kartında: real vaxt və yoldakı maneələr.", "Maneəni bildirin: SmartFlow vasitəsilə AYNA-ya düşür, SmartUrban prioritet xəritəsini yeniləyir."]}
          idea="Eyni yol orta piyada üçün 9 dəqiqə, əlil arabası üçün keçilməz ola bilər. Marşrut tətbiqləri bunu adətən göstərmir."
        />
        <LensStrip page="/marsrut" step={3} />
        <Form>
          <PlaceInput label="Haradan" value={from} onPick={setFrom} />
          <PlaceInput label="Hara" value={to} onPick={setTo} />
          <Profiles role="radiogroup" aria-label="Profil">
            {PROFILES.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={profile === p.id} className={profile === p.id ? "on" : ""} onClick={() => setProfile(p.id)}>
                <p.icon size={18} />
                {p.label}
              </button>
            ))}
          </Profiles>
          <Go type="button" onClick={plan} disabled={state.loading}>
            {state.loading ? "Axtarılır…" : "Yol tap"}
          </Go>
        </Form>
        {state.error && <Err>SmartFlow cavab vermədi: {state.error}</Err>}
        {state.data && (
          <MapLayout
            map={<RouteMap option={cur?.o} audit={cur?.a} from={state.data.from || from} to={state.data.to || to} />}
            side={
              <>
                {options.map(({ o, a }, i) => (
                  <Opt key={o.id} type="button" className={`${i === sel ? "on" : ""} s${a.sev}`} onClick={() => setSel(i)}>
                    <header>
                      {a.sev === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      <b>{o.title}</b>
                      <em>{Math.round(a.minutes)} dəq</em>
                    </header>
                    <small>
                      SmartFlow: {Math.round(o.minutes)} dəq (orta piyada) · {PROFILES.find((p) => p.id === state.key)?.label}: {Math.round(a.minutes)} dəq · piyada {fmt(Math.round(a.walkM))} m
                    </small>
                    {a.issues.length ? (
                      <ul>
                        {a.issues.map((x) => (
                          <li key={x.text} className={`s${x.sev}`}>
                            {x.text}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ok">Maneə tapılmadı (məlum data üzrə)</p>
                    )}
                  </Opt>
                ))}
                <Card>
                  <Small>
                    <Footprints size={13} /> Yoxlama: SmartFlow-un piyada hissələri {B ? B.underpasses.length : "…"} yeraltı keçid və {B ? fmt(B.steep.length) : "…"} dik (&gt; 8%) şəbəkə nöqtəsi ilə müqayisə olunur. Pandus və lift datası yoxdur: bildirişlər bu boşluğu doldurur.
                  </Small>
                  <ReportBtn type="button" onClick={() => setReport({ point: state.data.to || to })}>
                    <Megaphone size={16} /> Maneəni bildir
                  </ReportBtn>
                </Card>
              </>
            }
          />
        )}
        {report && <ReportBox point={report.point} profile={state.key || profile} onClose={() => setReport(null)} />}
        <Note>
          Marşrut mühərriki: SmartFlow (AYNA açıq datası, Bakı Metropoliteni, OSM). Əlçatanlıq yoxlaması və profillər: SmartUrban. Şəhər miqyasında nəticələr: <Link to="/planlama?addim=3">İnklüziv planlama</Link>.
        </Note>
      </Container>
      <PageMobilSafeArea />
    </Section>
  );
};

export default RoutePage;

const RouteMap = ({ option, audit: a, from, to }) => {
  const { ref, map, renderer } = useLeafletMap({ bounds: BOUNDS, maxZoom: 18, attribution: "© OpenStreetMap · SmartFlow" });
  const fitted = useRef(null);
  useEffect(() => {
    if (!map || !option) return undefined;
    const g = L.featureGroup();
    option.legs.forEach((l) =>
      legLines(l).forEach((ln) =>
        L.polyline(
          ln.map(([x, y]) => [y, x]),
          { renderer, color: cssVar(MODE_COLOR[l.mode] || "--accent"), weight: l.mode === "walk" ? 4 : 6, dashArray: l.mode === "walk" ? "6 6" : null, opacity: 0.9 }
        ).addTo(g)
      )
    );
    (a?.under || []).forEach(([x, y]) => L.circleMarker([y, x], { renderer, radius: 9, color: "#fff", weight: 2, fillColor: cssVar("--critical"), fillOpacity: 1 }).bindTooltip("Yeraltı keçid: pilləkən").addTo(g));
    (a?.steep || []).forEach(([x, y, gr]) => L.circleMarker([y, x], { renderer, radius: 5, stroke: false, fillColor: cssVar("--warn"), fillOpacity: 0.95 }).bindTooltip(`Dik hissə: ${gr}%`).addTo(g));
    [from, to].forEach((p, i) => L.circleMarker([p.lat, p.lon], { renderer, radius: 8, color: "#fff", weight: 2, fillColor: cssVar(i ? "--good" : "--text"), fillOpacity: 1 }).bindTooltip(p.name || "").addTo(g));
    g.addTo(map);
    if (fitted.current !== option.id) {
      fitted.current = option.id;
      map.fitBounds(g.getBounds(), { padding: [30, 30], maxZoom: 16 });
    }
    return () => map.removeLayer(g);
  }, [map, renderer, option, a, from, to]);
  return <MapBox ref={ref} $h={560} role="region" aria-label="Marşrut xəritəsi" />;
};

const ReportBox = ({ point, profile, onClose }) => {
  const [type, setType] = useState(null);
  const [text, setText] = useState("");
  const [st, setSt] = useState(null);
  const send = () => {
    const t = REPORT_TYPES.find((x) => x.id === type);
    setSt("sending");
    sendReport({ deviceId: deviceId(), lon: point.lon, lat: point.lat, type: t.sf, text: `[Əlçatanlıq · ${PROFILES.find((p) => p.id === profile)?.label}] ${t.label}${text.trim() ? `: ${text.trim()}` : ""}`.slice(0, 500) })
      .then(() => setSt("ok"))
      .catch((e) => setSt(`err:${e.message}`));
  };
  return (
    <Report>
      <h3>Burada nə maneədir?</h3>
      <p>
        Bildiriş SmartFlow vasitəsilə AYNA-nın monitorinq panelinə düşür (nöqtə: {point.name || `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`}). Şəxsi məlumat göndərilmir.
      </p>
      <div className="grid" role="radiogroup" aria-label="Maneə növü">
        {REPORT_TYPES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={type === t.id} className={type === t.id ? "on" : ""} onClick={() => setType(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <textarea rows={2} maxLength={300} placeholder="Qısa izah (məcburi deyil)" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row">
        <button type="button" className="send" disabled={!type || st === "sending" || st === "ok"} onClick={send}>
          {st === "sending" ? "Göndərilir…" : st === "ok" ? "Göndərildi" : "Göndər"}
        </button>
        <button type="button" onClick={onClose}>
          Bağla
        </button>
      </div>
      {st?.startsWith("err:") && <Err>Göndərilmədi: {st.slice(4)}</Err>}
    </Report>
  );
};

const Section = styled.section`
  padding: 20px 0 56px;
`;
const Form = styled.div`
  ${card}
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
  align-items: end;
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;
const Field = styled.label`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--text-3);
  > div {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 0 12px;
    background: var(--bg-secondary);
  }
  input {
    flex: 1;
    height: 42px;
    border: 0;
    background: transparent;
    color: var(--text);
    font-size: 15px;
    outline: none;
  }
  ul {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    margin-top: 4px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  li button {
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    background: none;
    border: 0;
    color: var(--text);
    cursor: pointer;
  }
  li button:hover {
    background: var(--bg-secondary);
  }
  small {
    color: var(--text-3);
  }
`;
const Profiles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--text-2);
    cursor: pointer;
    font-size: 14px;
  }
  .on {
    border-color: var(--accent);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
`;
const Go = styled.button`
  height: 44px;
  border-radius: 12px;
  border: 0;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
  }
`;
const Opt = styled.button`
  ${card}
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--text);
  border-left: 4px solid var(--good);
  &.s1 {
    border-left-color: var(--warn);
  }
  &.s2 {
    border-left-color: var(--critical);
  }
  &.on {
    outline: 2px solid var(--accent);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  header b {
    flex: 1;
  }
  header em {
    font-style: normal;
    font-family: var(--font-bold);
    font-size: 18px;
  }
  small {
    font-size: 12px;
    color: var(--text-3);
  }
  ul {
    padding-left: 16px;
    font-size: 13px;
  }
  li.s2 {
    color: var(--critical);
  }
  li.s1 {
    color: var(--warn);
  }
  .ok {
    font-size: 13px;
    color: var(--good);
  }
`;
const Small = styled.p`
  font-size: 12.5px;
  color: var(--text-3);
  line-height: 1.5;
`;
const ReportBtn = styled.button`
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid var(--accent);
  background: none;
  color: var(--accent);
  cursor: pointer;
`;
const Report = styled.div`
  ${card}
  margin-top: 14px;
  display: grid;
  gap: 10px;
  max-width: 640px;
  h3 {
    font-family: var(--font-bold);
  }
  p {
    font-size: 13px;
    color: var(--text-2);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .grid button {
    min-height: 44px;
    text-align: left;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--text);
    cursor: pointer;
  }
  .grid .on {
    border-color: var(--accent);
    color: var(--accent);
  }
  textarea {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--bg-secondary);
    color: var(--text);
    padding: 8px;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .row button {
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--text);
    cursor: pointer;
  }
  .row .send {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
`;
const Err = styled.p`
  color: var(--critical);
  font-size: 13px;
  margin-top: 8px;
`;
const Note = styled.p`
  font-size: 12.5px;
  color: var(--text-3);
  margin-top: 16px;
  a {
    color: var(--accent);
  }
`;
