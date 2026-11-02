import styled from "styled-components";
import Button from "@/components/common/Button";
import { fmt } from "@/utils/helpers/format";
import BaseModal from "./BaseModal";

const ZoneModal = ({ zone, onShowOnMap, onClose }) => {
  return (
    <BaseModal title={`#${zone.rank} ${zone.place}`} onClose={onClose}>
      <Body>
      <Grid>
        <div>
          <b>{fmt(zone.pop)}</b>əhali
        </div>
        <div>
          <b>{zone.cells}</b>hücrə (km²)
        </div>
        <div>
          <b>{zone.need}</b>ehtiyac indeksi
        </div>
        <div>
          <b>{zone.overlap_mean}</b>orta problem sayı
        </div>
      </Grid>
      <h4>Rayonlar</h4>
      <p>{zone.rayons.map((r) => r[0]).join(", ")}</p>
      <h4>Əsas problemlər (0–100)</h4>
      <ul>
        {zone.top_layers.map(([name, v]) => (
          <li key={name}>
            <span>{name}</span>
            <Bar>
              <i style={{ width: `${v}%` }} />
            </Bar>
            <em>{v}</em>
          </li>
        ))}
      </ul>
      </Body>
      {onShowOnMap && (
        <Button
          full
          onClick={() => {
            onShowOnMap(zone);
            onClose();
          }}
        >
          Xəritədə göstər
        </Button>
      )}
    </BaseModal>
  );
};

export default ZoneModal;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
  div {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: var(--text-3);
    background: var(--bg-secondary);
    border-radius: var(--radius);
    padding: 10px 12px;
  }
  b {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 20px;
    color: var(--text);
  }
`;

const Bar = styled.span`
  height: 8px;
  background: var(--panel-2);
  border-radius: 99px;
  position: relative;
  i {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--g3);
    border-radius: 99px;
  }
`;

const Body = styled.div`
  margin-bottom: 18px;
  h4 {
    font-size: 13px;
    font-family: var(--font-semibold);
    margin: 14px 0 6px;
  }
  p {
    color: var(--text-2);
    font-size: 14px;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) 1fr 32px;
    gap: 10px;
    align-items: center;
    font-size: 13px;
  }
  em {
    font-style: normal;
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
`;
