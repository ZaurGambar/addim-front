import { X } from "lucide-react";
import { CloseButton, ModalBox, ModalTitle, Overlay } from "@/styles/common/Modal";

const BaseModal = ({ title, onClose, width, children }) => {
  return (
    <Overlay onClick={onClose}>
      <ModalBox role="dialog" aria-modal="true" aria-label={title} $width={width} onClick={(e) => e.stopPropagation()}>
        <CloseButton type="button" aria-label="Bağla" onClick={onClose}>
          <X size={18} />
        </CloseButton>
        {title && <ModalTitle>{title}</ModalTitle>}
        {children}
      </ModalBox>
    </Overlay>
  );
};

export default BaseModal;
