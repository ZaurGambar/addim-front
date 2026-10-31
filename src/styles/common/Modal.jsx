import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(10, 20, 25, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  @media (max-width: 768px) {
    align-items: flex-end;
    padding: 0;
  }
`;

export const ModalBox = styled.div`
  width: 100%;
  max-width: ${({ $width }) => $width || "520px"};
  max-height: 88vh;
  overflow-y: auto;
  background: var(--panel);
  color: var(--text);
  border-radius: var(--radius-modal);
  padding: 28px;
  position: relative;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: var(--radius-modal) var(--radius-modal) 0 0;
    padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0px));
  }
`;

export const ModalTitle = styled.h3`
  font-family: var(--font-bold);
  font-size: 20px;
  margin-bottom: 12px;
  padding-right: 32px;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
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
