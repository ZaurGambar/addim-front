import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Container from "@/styles/common/Container";

const BackButtonHeader = ({ title, webVisible = true }) => {
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));
  return (
    <Bar $webVisible={webVisible}>
      <Container>
        <Inner>
          <Back type="button" aria-label="Geri" onClick={goBack}>
            <ChevronLeft size={22} />
          </Back>
          <Title>{title}</Title>
        </Inner>
      </Container>
    </Bar>
  );
};

export default BackButtonHeader;

const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--glass);
  backdrop-filter: saturate(1.6) blur(20px);
  -webkit-backdrop-filter: saturate(1.6) blur(20px);
  border-bottom: 1px solid var(--line-soft);
  padding-top: env(safe-area-inset-top, 0px);
  display: ${({ $webVisible }) => ($webVisible ? "block" : "none")};

  @media (max-width: 900px) {
    display: block;
  }
`;

const Inner = styled.div`
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Back = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--accent);
  &:hover {
    background: var(--bg-secondary);
  }
`;

const Title = styled.h2`
  font-family: var(--font-bold);
  font-size: 17px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
