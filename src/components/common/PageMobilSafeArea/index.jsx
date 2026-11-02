import styled from "styled-components";

// Mobil alt menyu altında qalan boşluq
const PageMobilSafeArea = () => <Space />;

export default PageMobilSafeArea;

const Space = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: block;
    height: calc(var(--tab-h) + env(safe-area-inset-bottom, 0px) + 24px);
  }
`;
