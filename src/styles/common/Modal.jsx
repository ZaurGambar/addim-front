import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  @media (max-width: 900px) {
    align-items: flex-end;
    padding: 0;
  }
`;

export const ModalBox = styled.div`
  width: 100%;
  max-width: ${({ $width }) => $width || "520px"};
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  color: var(--text);
  border-radius: var(--radius-modal);
  padding: 22px;
  position: relative;

  @media (max-width: 900px) {
    max-width: 100%;
    max-height: 92dvh;
    border-radius: 26px 26px 0 0;
    padding: 18px 16px calc(18px + env(safe-area-inset-bottom, 0px));
    &::before {
      content: "";
      display: block;
      width: 40px;
      height: 5px;
      border-radius: 3px;
      background: var(--line);
      margin: -6px auto 12px;
    }
  }
`;

export const ModalTitle = styled.h3`
  font-family: var(--font-bold);
  font-size: 19px;
  margin-bottom: 12px;
  padding-right: 32px;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--text-2);
  background: var(--bg-secondary);

  &:hover {
    color: var(--text);
  }
`;
