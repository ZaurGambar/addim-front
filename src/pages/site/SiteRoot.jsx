import { Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";
import Header from "@/layouts/site/Header";
import Footer from "@/layouts/site/Footer";
import BackButtonHeader from "@/layouts/site/BackButtonHeader";
import MobileTab from "@/layouts/site/MobileTab";
import SafeArea from "@/components/common/SafeArea";
import { NAV_ITEMS, pagesWithHeaderAndTab, pagesWithHeaderWebBackMobile, pagesWithOnlyBack } from "@/utils/constants/ContractConstants";
import { useMediaQuery } from "react-responsive";

// "/blog/:id" kimi pattern-ləri regex-ə çevirir
const toRegex = (pattern) => new RegExp("^" + pattern.replace(/:[^/]+/g, "[^/]+").replace(/\/$/, "") + "/?$");
const matches = (list, pathname) => list.some((p) => toRegex(p === "/" ? "" : p).test(pathname === "/" ? "" : pathname));

const SiteRoot = () => {
  const { pathname } = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 900 });
  const title = NAV_ITEMS.find((n) => n.path === pathname)?.label || "";

  const onlyBack = matches(pagesWithOnlyBack, pathname);
  const webHeaderMobileBack = matches(pagesWithHeaderWebBackMobile, pathname);
  const headerAndTab = matches(pagesWithHeaderAndTab, pathname);

  // Masaüstündə həmişə yan panel; mobildə səhifəyə görə üst panel və ya geri düyməsi
  let top = <Header />;
  if (isMobile && (onlyBack || webHeaderMobileBack)) top = <BackButtonHeader title={title} />;

  return (
    <>
      {top}
      <Shell>
        <SafeArea />
        <main key={pathname}>
          <Outlet />
        </main>
        <Footer />
      </Shell>
      {headerAndTab && <MobileTab />}
    </>
  );
};

const Shell = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-left: calc(var(--side) + 24px);

  main {
    animation: fadein 0.26s ease;
  }
  @keyframes fadein {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    main {
      animation: none;
    }
  }
  @media (max-width: 900px) {
    padding-left: 0;
  }
`;

export default SiteRoot;
