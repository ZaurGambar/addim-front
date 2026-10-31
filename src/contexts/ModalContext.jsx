import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ModalContext = createContext(null);
const RegistryContext = createContext({});

export const ModalProvider = ({ registry = {}, children }) => {
  const [modals, setModals] = useState([]);
  const counter = useRef(0);

  const openModal = useCallback((name, props = {}) => {
    counter.current += 1;
    const id = `${name}-${counter.current}`;
    setModals((prev) => [...prev, { id, name, props }]);
    return id;
  }, []);

  const closeModal = useCallback((idOrName) => {
    setModals((prev) => {
      const byId = prev.filter((m) => m.id !== idOrName);
      if (byId.length !== prev.length) return byId;
      const idx = prev.map((m) => m.name).lastIndexOf(idOrName);
      return idx === -1 ? prev : prev.filter((_, i) => i !== idx);
    });
  }, []);

  const closeAll = useCallback(() => setModals([]), []);
  const isOpen = useCallback((name) => modals.some((m) => m.name === name), [modals]);
  const updateModalProps = useCallback(
    (id, props) => setModals((prev) => prev.map((m) => (m.id === id ? { ...m, props: { ...m.props, ...props } } : m))),
    [],
  );

  const value = useMemo(
    () => ({ modals, openModal, closeModal, closeAll, isOpen, updateModalProps }),
    [modals, openModal, closeModal, closeAll, isOpen, updateModalProps],
  );

  return (
    <RegistryContext.Provider value={registry}>
      <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
    </RegistryContext.Provider>
  );
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal ModalProvider daxilində istifadə olunmalıdır");
  return ctx;
};

export const useModalRegistry = () => useContext(RegistryContext);
