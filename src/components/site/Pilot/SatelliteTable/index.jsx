import styled from "styled-components";
import { Wrap } from "@/components/site/Synthesis/RayonNeed";

const LBL = { no_zebra: ["zebra yoxdur", "var(--critical)"], zebra_nearby: ["yaxında zebra var", "transparent"], unclear: ["aydın deyil", "var(--warn)"] };

const SatelliteTable = ({ underpasses }) => {
  const rows = underpasses.features.filter((f) => f.properties.candidate).sort((a, b) => a.properties.rank - b.properties.rank);
  return (
    <Wrap>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Yer</th>
            <th>Peyk nəticəsi</th>
            <th>Qeyd</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => {
            const p = f.properties;
            const [lon, lat] = f.geometry.coordinates;
            const [label, color] = LBL[p.sat] || ["–", "var(--line)"];
            return (
              <tr key={p.rank}>
                <td className="n">{p.rank}</td>
                <td>{p.road || `${p.metro} yaxınlığı`}</td>
                <td>
                  <Stat $c={color} $ring={p.sat === "zebra_nearby"}>{label}</Stat>
                </td>
                <td style={{ fontSize: 13, color: "var(--text-2)" }}>{p.sat_note}</td>
                <td>
                  <a href={`https://maps.google.com/?q=${lat},${lon}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontSize: 13, whiteSpace: "nowrap" }}>
                    xəritədə aç
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Wrap>
  );
};

export default SatelliteTable;

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  white-space: nowrap;
  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $c }) => $c};
    border: ${({ $ring }) => ($ring ? "2px solid var(--critical)" : "none")};
    box-sizing: border-box;
  }
`;
