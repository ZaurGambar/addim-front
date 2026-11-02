import { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";

// Hərəkət hissələri. Hamısı "hərəkəti azalt" ayarına hörmət edir.
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Element ekrana girəndə bir dəfə true olur
export const useInView = ({ threshold = 0.2, rootMargin = "0px 0px -8% 0px" } = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => reduced() || typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (inView || !ref.current) return undefined;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [inView, threshold, rootMargin]);
  return [ref, inView];
};

// Ekrana girəndə yumşaq görünmə; delay ilə ardıcıllıq (stagger)
export const Reveal = ({ as, delay = 0, y = 18, children, ...props }) => {
  const [ref, inView] = useInView();
  return (
    <RevealBox ref={ref} as={as} $in={inView} $delay={delay} $y={y} {...props}>
      {children}
    </RevealBox>
  );
};

const RevealBox = styled.div`
  opacity: ${({ $in }) => ($in ? 1 : 0)};
  transform: ${({ $in, $y }) => ($in ? "none" : `translateY(${$y}px)`)};
  transition: opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) ${({ $delay }) => $delay}ms,
    transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) ${({ $delay }) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`;

// Rəqəm ekrana girəndə 0-dan dəyərə qədər artır
export const CountUp = ({ value, decimals = 0, duration = 1400, prefix = "", suffix = "" }) => {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [still] = useState(reduced);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (still || !inView || value == null) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(value * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [still, inView, value, duration]);
  const text =
    value == null
      ? "–"
      : Number(still ? value : shown).toLocaleString("az-Latn-AZ", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};

// Zolaq ekrana girəndə soldan dolur
const grow = keyframes`
  from { transform: scaleX(0); }
`;
export const growX = css`
  transform-origin: left center;
  animation: ${grow} 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
