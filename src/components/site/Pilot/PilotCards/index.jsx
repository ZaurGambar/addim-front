import styled from "styled-components";
import { card, glow } from "@/styles/common/mixins";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import { PILOTS } from "@/utils/mock/pilot";

const PilotCards = ({ business }) => (
  <Grid>
    {PILOTS.map((p) => {
      const b = business?.[p.biz];
      return (
        <Card key={p.title}>
          <span className="where">{p.where}</span>
          <h3>{p.title}</h3>
          <p>{p.text}</p>
          {b && (
            <p className="biz">
              Yerli biznes (2GIS, görünən): <b>~{b.gis_cafe}</b> kafe və restoran, <b>~{b.gis_shop}</b> mağaza.
              {b.osm_food != null && ` OSM-də 500 m-də: ${b.osm_food} və ${b.osm_shop}.`} {b.note}
            </p>
          )}
          <Button as={Link} to={`/xerite?s=${encodeURIComponent(p.station)}`} variant="outline" size="sm">
            Xəritədə göstər
          </Button>
        </Card>
      );
    })}
  </Grid>
);

export default PilotCards;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.article`
  ${card}
  ${glow}
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;

  .where {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--text-3);
  }
  h3 {
    font-family: var(--font-bold);
    font-size: 19px;
  }
  p {
    font-size: 14px;
    color: var(--text-2);
  }
  .biz {
    font-size: 13px;
    border-top: 1px solid var(--line-soft);
    padding-top: 8px;
  }
  .biz b {
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    color: var(--text);
  }
  a {
    margin-top: auto;
  }
`;
