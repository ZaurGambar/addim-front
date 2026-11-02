import styled from "styled-components";
import { Lightbulb } from "lucide-react";
import { useInView } from "@/components/common/Motion";
import { Art } from "@/components/common/Illustrations";
import { card } from "@/styles/common/mixins";

// Hər səhifənin başında sadə izah: "Bu səhifə nə göstərir?" + animasiyalı şəkil + 3 addım
const PageIntro = ({ art, question = "Bu səhifə nə göstərir?", answer, steps = [], idea }) => {
  const [ref, inView] = useInView({ threshold: 0.25 });
  return (
    <Box ref={ref} $on={inView}>
      <Art $on={inView}>{art}</Art>
      <Text>
        <h2>{question}</h2>
        <p>{answer}</p>
        <Steps>
          {steps.map((s, i) => (
            <Step key={i} $on={inView} style={{ transitionDelay: `${0.15 + i * 0.18}s` }}>
              <i>{i + 1}</i>
              <span>{s}</span>
            </Step>
          ))}
        </Steps>
        {idea && (
          <Idea $on={inView}>
            <Lightbulb size={16} />
            <span>{idea}</span>
          </Idea>
        )}
      </Text>
    </Box>
  );
};

export default PageIntro;

const Box = styled.section`
  ${card}
  display: grid;
  grid-template-columns: minmax(200px, 300px) minmax(0, 1fr);
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: -80px -60px auto auto;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: var(--accent);
    filter: blur(80px);
    opacity: 0.16;
    pointer-events: none;
  }
  > * {
    position: relative;
    z-index: 1;
  }
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;

  h2 {
    font-family: var(--font-bold);
    font-size: 20px;
    letter-spacing: -0.02em;
  }
  p {
    font-size: 15.5px;
    line-height: 1.55;
    color: var(--text-2);
    max-width: 68ch;
  }
`;

const Steps = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 4px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Step = styled.li`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 16px;
  background: var(--bg-secondary);
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--text);
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  translate: ${({ $on }) => ($on ? "0 0" : "0 12px")};
  transition: opacity 0.6s cubic-bezier(0.2, 0.7, 0.2, 1), translate 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);

  i {
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-style: normal;
    font-family: var(--font-bold);
    font-size: 12px;
    color: #fff;
    background: var(--grad);
  }
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    translate: none;
    transition: none;
  }
`;

const Idea = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 13.5px;
  color: var(--text);
  background: color-mix(in srgb, var(--warn) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--warn) 30%, transparent);
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  transition: opacity 0.6s 0.8s;

  svg {
    flex: none;
    color: var(--warn);
    margin-top: 1px;
  }
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transition: none;
  }
`;
