import styled from "styled-components";

const Loading = () => (
  <Wrapper role="status" aria-live="polite">
    <Dot />
    <span>Yüklənir…</span>
  </Wrapper>
);

export default Loading;

const Wrapper = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
`;

const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse 1s ease-in-out infinite;
  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
