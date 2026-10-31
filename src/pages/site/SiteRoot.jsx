import { Outlet, useLocation } from "react-router-dom";
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
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const title = NAV_ITEMS.find((n) => n.path === pathname)?.label || "";

  const onlyBack = matches(pagesWithOnlyBack, pathname);
  const webHeaderMobileBack = matches(pagesWithHeaderWebBackMobile, pathname);
  const headerAndTab = matches(pagesWithHeaderAndTab, pathname);

  let top = <Header />;
  if (onlyBack) top = <BackButtonHeader title={title} />;
  else if (webHeaderMobileBack && isMobile) top = <BackButtonHeader title={title} />;

  return (
    <>
      {top}
      <SafeArea />
      <main>
        <Outlet />
      </main>
      <Footer />
      {headerAndTab && <MobileTab />}
    </>
  );
};

export default SiteRoot;
