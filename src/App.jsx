import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { ROUTES } from "@/routes/routes";
import { ModalProvider } from "@/contexts/ModalContext";
import ModalRoot from "@/components/common/ModalRoot";
import ConfirmModal from "@/components/common/Modals/ConfirmModal";
import HelpModal from "@/components/common/Modals/HelpModal";
import DataSourcesModal from "@/components/common/Modals/DataSourcesModal";
import ReportModal from "@/components/common/Modals/ReportModal";
import ZoneModal from "@/components/common/Modals/ZoneModal";
import "./App.css";

// Bir dəfə yaradılır, hər render-də yox
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const router = createBrowserRouter(ROUTES);

const MODAL_REGISTRY = {
  ConfirmModal,
  HelpModal,
  DataSourcesModal,
  ReportModal,
  ZoneModal,
};

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ModalProvider registry={MODAL_REGISTRY}>
          <RouterProvider router={router} />
          <ModalRoot />
        </ModalProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
