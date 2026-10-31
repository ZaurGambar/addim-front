import { useEffect } from "react";
import { useModal, useModalRegistry } from "@/contexts/ModalContext";

const ModalRoot = () => {
  const { modals, closeModal } = useModal();
  const registry = useModalRegistry();

  useEffect(() => {
    if (!modals.length) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeModal(modals[modals.length - 1].id);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [modals, closeModal]);

  return modals.map(({ id, name, props }) => {
    const Component = registry[name];
    if (!Component) return null;
    return <Component key={id} {...props} onClose={() => closeModal(id)} />;
  });
};

export default ModalRoot;
