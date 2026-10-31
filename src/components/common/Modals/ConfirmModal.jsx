import styled from "styled-components";
import Button from "@/components/common/Button";
import BaseModal from "./BaseModal";

const ConfirmModal = ({ title = "Əminsiniz?", text, confirmText = "Bəli", cancelText = "Ləğv et", onConfirm, onClose }) => {
  return (
    <BaseModal title={title} onClose={onClose} width="420px">
      {text && <Text>{text}</Text>}
      <Actions>
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          onClick={() => {
            onConfirm?.();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </Actions>
    </BaseModal>
  );
};

export default ConfirmModal;

const Text = styled.p`
  color: var(--text-2);
  margin-bottom: 20px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;
