import { lazy, Suspense } from "react";
import ScrollToTop from "@/components/common/ScrollToTop";
import SiteRoot from "@/pages/site/SiteRoot";
import Loading from "@/pages/common/Loading";
import Error from "@/pages/common/Error";

const Home = lazy(() => import("@/pages/site/Home"));
const Analysis = lazy(() => import("@/pages/site/Analysis"));
const Synthesis = lazy(() => import("@/pages/site/Synthesis"));
const Swot = lazy(() => import("@/pages/site/Swot"));
const CentralMap = lazy(() => import("@/pages/site/CentralMap"));
const Models = lazy(() => import("@/pages/site/Models"));
const Concepts = lazy(() => import("@/pages/site/Concepts"));
const AiModules = lazy(() => import("@/pages/site/AiModules"));
const Pilot = lazy(() => import("@/pages/site/Pilot"));
const Zoning = lazy(() => import("@/pages/site/Zoning"));
const TwoGis = lazy(() => import("@/pages/site/TwoGis"));
const Policy = lazy(() => import("@/pages/site/Policy"));
const Methodology = lazy(() => import("@/pages/site/Methodology"));

const page = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

export const ROUTES = [
  {
    path: "/",
    element: (
      <ScrollToTop>
        <SiteRoot />
      </ScrollToTop>
    ),
    children: [
      { path: "", element: page(Home) },
      { path: "analiz", element: page(Analysis) },
      { path: "sintez", element: page(Synthesis) },
      { path: "swot", element: page(Swot) },
      { path: "xerite", element: page(CentralMap) },
      { path: "modeller", element: page(Models) },
      { path: "anlayislar", element: page(Concepts) },
      { path: "ai", element: page(AiModules) },
      { path: "pilot", element: page(Pilot) },
      { path: "bolgeleme", element: page(Zoning) },
      { path: "2gis", element: page(TwoGis) },
      { path: "qaydalar", element: page(Policy) },
      { path: "metodologiya", element: page(Methodology) },
    ],
  },
  { path: "*", element: <Error /> },
];
