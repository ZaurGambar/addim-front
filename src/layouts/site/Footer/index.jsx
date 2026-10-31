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
  border-top: 1px solid var(--line);
  padding: 32px 0 24px;
  font-size: 14px;
  color: var(--text-2);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
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
  a:hover {
    color: var(--primary);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  button {
    color: var(--primary);
    font-size: 14px;
  }
`;

const Small = styled.p`
  margin-top: 24px;
  font-size: 12px;
  color: var(--text-3);
`;
