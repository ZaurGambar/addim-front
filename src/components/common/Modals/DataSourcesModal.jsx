import styled from "styled-components";
import BaseModal from "./BaseModal";

const SOURCES = [
  ["OpenStreetMap", "Yollar, keçidlər, obyektlər, rayon sərhədləri", "ODbL"],
  ["opendata.az · Bakı Metropoliteni", "Metro sərnişin sayı, çıxışlar, BakuBus dayanacaqları və marşrut yükü", "Açıq lisenziya"],
  ["opendata.az · Yerüstü Nəqliyyat Agentliyi", "Velosiped zolaqları, parkinqlər, avtobus trayektoriyaları", "Açıq lisenziya"],
  ["opendata.az · DSK", "Rayonlar üzrə əlilliyi olan şəxslər, 2026", "Açıq lisenziya"],
  ["WorldPop", "Əhali və yaş strukturu, 100 m, 2020", "CC BY 4.0"],
  ["Landsat 8 · Planetary Computer", "Yer səthinin temperaturu və NDVI, 30.08.2025", "Açıq"],
  ["SRTM · AWS Terrain Tiles", "Hündürlük və meyl", "Açıq"],
];

const DataSourcesModal = ({ onClose }) => {
  return (
    <BaseModal title="Data mənbələri" onClose={onClose} width="640px">
      <Table>
        <tbody>
          {SOURCES.map(([s, d, l]) => (
            <tr key={s}>
              <td>
                <b>{s}</b>
                <span>{d}</span>
              </td>
              <td>{l}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Note>Peyk və 2GIS ekran görüntüləri lisenziya səbəbindən ictimai versiyaya daxil edilməyib. Yalnız onlardan çıxan nəticələr göstərilir.</Note>
    </BaseModal>
  );
};

export default DataSourcesModal;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  td {
    padding: 10px 0;
    border-bottom: 1px solid var(--line-soft);
    vertical-align: top;
    font-size: 14px;
  }
  td:first-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  td:first-child span {
    color: var(--text-2);
    font-size: 13px;
  }
  td:last-child {
    text-align: right;
    font-family: var(--font-semibold);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--text-3);
    white-space: nowrap;
    padding-left: 12px;
  }
`;

const Note = styled.p`
  margin-top: 14px;
  font-size: 13px;
  color: var(--text-3);
`;
