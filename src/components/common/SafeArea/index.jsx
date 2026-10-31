import styled from "styled-components";

// Sabit header altında qalan boşluq
const SafeArea = () => <Space />;

export default SafeArea;

const Space = styled.div`
  height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
`;
