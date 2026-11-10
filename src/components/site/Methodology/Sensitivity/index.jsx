import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import BarList from "@/components/common/BarList";
import { useGet } from "@/utils/hooks/useCustomQuery";
import { ENDPOINTS } from "@/utils/constants/Endpoints";

// Monte Carlo həssaslıq analizi: çəkilər dəyişəndə indeks və prioritet zonalar nə qədər sabitdir
const Sensitivity = () => {
  const q = useGet("sensitivity", ENDPOINTS.SENSITIVITY);
  if (!q.data) return null;
  const { walk: w, zones: z } = q.data;
  return (
    <Box>
      <h3>Çəkilər dəyişsə, nəticə dəyişərmi? (həssaslıq analizi)</h3>
      <p className="lead">
        Hər iki model {w.iterations} dəfə təsadüfi çəkilərlə yenidən hesablanıb. Nəticə: prioritetlər çəkilərin seçimindən asılı deyil, xəritə və siyahılar sabitdir.
      </p>
      <Grid>
        <div>
          <b>ρ = {w.spearman_median}</b>
          <span>
            Piyada indeksi: çəkilər {w.perturb} dəyişəndə əsas indekslə sıra korrelyasiyası (ən pis 5%: {w.spearman_p5})
          </span>
        </div>
        <div>
          <b>±{w.mean_abs_change_median}</b>
          <span>hücrə balının orta dəyişməsi (0–100 şkalasında)</span>
        </div>
        <div>
          <b>{z.top20_kept_median}%</b>
          <span>
            top-{z.top} zonanın yerində qalan payı (ən pis 5%: {z.top20_kept_p5}%)
          </span>
        </div>
        <div>
          <b>
            {z.stable_count} / {z.top}
          </b>
          <span>zona ≥ 80% ehtimalla top-{z.top}-də qalır</span>
        </div>
      </Grid>
      <h4>Top-{z.top} zonanın top-{z.top}-də qalma ehtimalı</h4>
      <BarList max={100} color="var(--primary)" items={z.top20.map((r) => ({ key: r.rank, label: `#${r.rank} ${r.name} (${r.rayon})`, value: r.top20_prob }))} />
      <p className="muted">
        Metod: piyada indeksində 7 komponentin çəkisi bərabər paylanma ilə {w.perturb} dəyişdirilir. Zonalarda 8 problem qatının çəkiləri {z.perturb} ilə seçilir, sıra əhali × ehtiyac ilə qurulur.
        {z.challengers?.length ? ` Top-${z.top}-ə ən çox girə bilən zonalar: ${z.challengers.map((c) => `${c.name} (${c.top20_prob}%)`).join(", ")}.` : ""}
      </p>
    </Box>
  );
};

export default Sensitivity;

const Box = styled.section`
  ${card}
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  h3 {
    font-family: var(--font-bold);
    font-size: 19px;
  }
  h4 {
    font-family: var(--font-semibold);
    font-size: 14px;
    margin-top: 6px;
  }
  .lead {
    font-size: 14px;
    color: var(--text-2);
    max-width: 75ch;
  }
  .muted {
    font-size: 12px;
    color: var(--text-3);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  div {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
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
