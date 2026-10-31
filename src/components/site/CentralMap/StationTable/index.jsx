import { Wrap } from "@/components/site/Synthesis/RayonNeed";
import { fmt } from "@/utils/helpers/format";

const StationTable = ({ stations }) => (
  <Wrap>
    <table>
      <thead>
        <tr>
          <th>Stansiya</th>
          <th>Sərnişin/gün</th>
          <th>Çıxış</th>
          <th>Zebra</th>
          <th>Yeraltı</th>
          <th>Magistral, m</th>
        </tr>
      </thead>
      <tbody>
        {stations.map((s) => (
          <tr key={s.name}>
            <td>{s.name}</td>
            <td className="n">{s.ride_2026 ? fmt(s.ride_2026) : "–"}</td>
            <td className="n">{s.exits ?? "–"}</td>
            <td className="n">{s.cross_400m}</td>
            <td className="n">{s.under_400m}</td>
            <td className="n">{fmt(s.major_m_400m)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Wrap>
);

export default StationTable;
