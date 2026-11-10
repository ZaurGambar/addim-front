import { useMemo, useState } from "react";
import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import Button from "@/components/common/Button";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";
import { fmt } from "@/utils/helpers/format";

// Vahid xərc: bir məhəllə blokunda bir həllin tipik dəyəri, AZN (2026).
// Ekspert təxminidir, rəsmi smeta deyil: istifadəçi dəyişə bilər.
export const UNIT_COST = {
  A: [45000, "zebra, svetofor, iki tərəfdə pandus, sığınacaq adası"],
  B: [30000, "səki səviyyəsində keçid, sürət azaldıcı, nişanlar, 30 km/saat"],
  C: [60000, "≈ 300 m səki: 30 ağac, damcı suvarma, açıq rəngli örtük"],
  D: [90000, "≈ 500 m² cib parkı: kölgə, oturacaq, içməli su"],
  E: [15000, "örtüklü dayanacaq və ona işıqlı piyada yolu"],
  F: [35000, "≈ 100 m işıqlı piyada keçidi (dalanları birləşdirir)"],
  G: [10000, "birinci mərtəbədə xidmət üçün icarə dəstəyi, açıq bazar"],
  H: [70000, "pandus, məhəccər, hər 50 m-də oturacaq"],
  I: [40000, "≈ 100 m drenaj, suyu keçirən örtük"],
};
// Hər həllin azaltdığı problem qatları (8 qatdan)
const FIXES = { A: ["fragment", "car"], B: ["car"], C: ["heat", "green_gap"], D: ["green_gap"], E: ["transit_gap"], F: ["fragment"], G: ["service_gap"], H: ["slope"], I: ["lowland"] };
const LAYERS = ["heat", "green_gap", "transit_gap", "fragment", "car", "slope", "lowland", "service_gap"];
const EFFECT = 0.5; // həll öz qatının balını 50% azaldır (fərziyyə)
const BUDGETS = [1e6, 5e6, 10e6, 25e6, 50e6];

const run = (blocks, budget, costs, active) => {
  // Hər (blok, həll) cütü: fayda = insan × ehtiyac, sıra = fayda / xərc
  const items = [];
  blocks.forEach((f, bi) => {
    const p = f.properties;
    (p.sol || "").split(",").filter((k) => k && active[k]).forEach((k) => items.push({ bi, k, cost: costs[k], score: (p.pop * p.need) / costs[k] }));
  });
  items.sort((a, b) => b.score - a.score);
  let left = budget;
  const chosen = new Map();
  const byKind = {};
  for (const it of items) {
    if (it.cost > left) continue;
    left -= it.cost;
    if (!chosen.has(it.bi)) chosen.set(it.bi, new Set());
    chosen.get(it.bi).add(it.k);
    byKind[it.k] = (byKind[it.k] || 0) + 1;
  }
  let pop = 0;
  let needBefore = 0;
  let needAfter = 0;
  chosen.forEach((ks, bi) => {
    const p = blocks[bi].properties;
    const fixed = new Set([...ks].flatMap((k) => FIXES[k]));
    const before = LAYERS.reduce((t, l) => t + (p[`p_${l}`] ?? 0), 0) / LAYERS.length;
    const after = LAYERS.reduce((t, l) => t + (p[`p_${l}`] ?? 0) * (fixed.has(l) ? 1 - EFFECT : 1), 0) / LAYERS.length;
    pop += p.pop;
    needBefore += p.need * p.pop;
    needAfter += (before ? p.need * (after / before) : p.need) * p.pop;
  });
  const spent = budget - left;
  return {
    blocks: chosen.size, pop, spent, perPerson: pop ? spent / pop : 0,
    needBefore: pop ? needBefore / pop : 0, needAfter: pop ? needAfter / pop : 0, byKind,
    total: items.length,
  };
};

const BudgetCalculator = ({ solutions }) => {
  const [open, setOpen] = useState(false);
  const blocks = useGet("zoningBlocks", ENDPOINTS.ZONING_BLOCKS, undefined, { enabled: open });
  const [budget, setBudget] = useState(10e6);
  const [costs, setCosts] = useState(() => Object.fromEntries(Object.entries(UNIT_COST).map(([k, v]) => [k, v[0]])));
  const [active, setActive] = useState(() => Object.fromEntries(Object.keys(UNIT_COST).map((k) => [k, true])));
  const res = useMemo(() => (blocks.data ? run(blocks.data.features, budget, costs, active) : null), [blocks.data, budget, costs, active]);

  return (
    <Box>
      <Head>
        <div>
          <h3>Büdcə kalkulyatoru</h3>
          <p>Büdcəni seçin: sistem pulu ən çox insana və ən çətin məhəllələrə təsir edən həllərə paylayır (insan × ehtiyac / xərc).</p>
        </div>
        {!open && <Button onClick={() => setOpen(true)}>Kalkulyatoru aç</Button>}
      </Head>
      {open && (
        <>
          <Budgets role="radiogroup" aria-label="Büdcə">
            {BUDGETS.map((b) => (
              <button key={b} type="button" role="radio" aria-checked={budget === b} className={budget === b ? "on" : ""} onClick={() => setBudget(b)}>
                {fmt(b / 1e6)} mln ₼
              </button>
            ))}
          </Budgets>
          {blocks.isLoading && <p className="muted">Bloklar yüklənir…</p>}
          {res && (
            <Result>
              <div>
                <b>{fmt(res.blocks)}</b>
                <span>məhəllə bloku</span>
              </div>
              <div>
                <b>{fmt(res.pop)}</b>
                <span>insan faydalanır</span>
              </div>
              <div>
                <b>{fmt(Math.round(res.perPerson))} ₼</b>
                <span>nəfər başına</span>
              </div>
              <div>
                <b>
                  {res.needBefore.toFixed(1)} → {res.needAfter.toFixed(1)}
                </b>
                <span>orta ehtiyac balı (təxmini)</span>
              </div>
            </Result>
          )}
          <Costs>
            <thead>
              <tr>
                <th />
                <th>Həll</th>
                <th>Vahid xərc, ₼ (blok üçün)</th>
                <th>Nə daxildir</th>
                <th>Seçilən</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(UNIT_COST).map(([k, [, inc]]) => (
                <tr key={k}>
                  <td>
                    <input type="checkbox" aria-label={`${solutions[k]?.title} daxil et`} checked={active[k]} onChange={(e) => setActive((a) => ({ ...a, [k]: e.target.checked }))} />
                  </td>
                  <td>{solutions[k]?.title}</td>
                  <td>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      aria-label={`${solutions[k]?.title} vahid xərci`}
                      value={costs[k]}
                      onChange={(e) => setCosts((c) => ({ ...c, [k]: Math.max(1000, Number(e.target.value) || 1000) }))}
                    />
                  </td>
                  <td className="muted">{inc}</td>
                  <td className="n">{res ? fmt(res.byKind[k] || 0) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </Costs>
          <p className="muted">
            Fərziyyələr: vahid xərclər ekspert təxminidir (2026, AZN), rəsmi smeta deyil, dəyişə bilərsiniz. Hər həll öz problem qatını 50% azaldır. Ehtiyac balının azalması model təxminidir, pilotdan sonra real ölçmə ilə yoxlanılmalıdır.
          </p>
        </>
      )}
    </Box>
  );
};

export default BudgetCalculator;

const Box = styled.section`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
  .muted {
    font-size: 12px;
    color: var(--text-3);
  }
`;

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  h3 {
    font-family: var(--font-bold);
    font-size: 19px;
  }
  p {
    font-size: 14px;
    color: var(--text-2);
    max-width: 70ch;
  }
`;

const Budgets = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  button {
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 7px 12px;
    border-radius: 10px;
    border: 1px solid var(--line);
    color: var(--text-2);
  }
  button.on {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-soft);
  }
`;

const Result = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  div {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 12px;
    display: flex;
    flex-direction: column;
  }
  b {
    font-family: var(--font-mono);
    font-size: 22px;
    font-weight: 500;
  }
  span {
    font-size: 12px;
    color: var(--text-2);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Costs = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line-soft);
  }
  th {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-3);
    font-weight: 500;
  }
  input[type="number"] {
    width: 110px;
    font-family: var(--font-mono);
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 5px 8px;
  }
  td.n {
    font-family: var(--font-mono);
    text-align: right;
  }
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
  }
`;
