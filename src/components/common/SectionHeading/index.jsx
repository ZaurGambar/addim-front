import styled from "styled-components";
import { scrollReveal } from "@/styles/common/mixins";

const SectionHeading = ({ eyebrow, title, lede, as = "h1" }) => {
  return (
    <Wrapper>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Title as={as}>{title}</Title>
      {lede && <Lede>{lede}</Lede>}
    </Wrapper>
  );
};

export default SectionHeading;

const Wrapper = styled.header`
  ${scrollReveal}
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-semibold);
  font-size: 13px;
  color: var(--accent);

  &::before {
    content: "";
    width: 22px;
    height: 3px;
    border-radius: 3px;
    background: var(--grad);
    box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 60%, transparent);
  }
`;

const Title = styled.h1`
  font-family: var(--font-bold);
  font-size: ${({ as }) => (as === "h1" || !as ? "30px" : "22px")};
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-wrap: balance;

  @media (max-width: 900px) {
    font-size: ${({ as }) => (as === "h1" || !as ? "25px" : "20px")};
  }
`;

const Lede = styled.p`
  font-size: 15px;
  color: var(--text-3);
  max-width: 70ch;
`;
