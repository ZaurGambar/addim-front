import styled from "styled-components";
import { Link } from "react-router-dom";
import Container from "@/styles/common/Container";
import { useModal } from "@/contexts/ModalContext";
import { NAV_ITEMS } from "@/utils/constants/ContractConstants";

const Footer = () => {
  const { openModal } = useModal();
  return (
    <Wrapper>
      <Container>
        <Grid>
          <div>
            <Logo>
              ADDIM<span>.</span>
            </Logo>
            <p>Bakı üçün süni intellekt əsaslı piyada platforması. “İnsanyönümlü şəhərlər” hakatonu, 11–13 noyabr 2026.</p>
          </div>
          <Links>
            {NAV_ITEMS.map((n) => (
              <Link key={n.path} to={n.path}>
                {n.label}
              </Link>
            ))}
          </Links>
          <Actions>
            <button type="button" onClick={() => openModal("DataSourcesModal")}>
              Data mənbələri
            </button>
            <button type="button" onClick={() => openModal("ReportModal", { context: "Ümumi" })}>
              Data xətası bildir
            </button>
          </Actions>
        </Grid>
        <Small>Xəritə datası © OpenStreetMap iştirakçıları (ODbL) · opendata.az · WorldPop (CC BY 4.0) · Landsat · SRTM</Small>
      </Container>
    </Wrapper>
  );
};

export default Footer;

const Wrapper = styled.footer`
  margin-top: auto;
  padding: 32px 0 24px;
  font-size: 13.5px;
  color: var(--text-3);

  > div > * {
    background: var(--panel);
    backdrop-filter: var(--blur);
    -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--line);
    box-shadow: var(--shadow);
    border-radius: var(--r);
    padding: 20px;
  }
  > div > p {
    background: none;
    border: 0;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    padding: 0 20px;
  }
  @media (max-width: 900px) {
    padding-bottom: calc(var(--tab-h) + env(safe-area-inset-bottom, 0px) + 24px);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Logo = styled.div`
  font-family: var(--font-bold);
  font-size: 22px;
  color: var(--text);
  margin-bottom: 6px;
  span {
    color: var(--accent);
  }
`;

const Links = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  a {
    font-family: var(--font-semibold);
  }
  a:hover {
    color: var(--text);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  button {
    color: var(--accent);
    font-family: var(--font-semibold);
    font-size: 13px;
  }
`;

const Small = styled.p`
  margin-top: 24px;
  font-size: 12px;
  color: var(--text-3);
`;
