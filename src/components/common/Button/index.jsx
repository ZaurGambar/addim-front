import styled, { css } from "styled-components";

const Button = ({ children, variant = "primary", size = "md", full = false, ...props }) => {
  return (
    <StyledButton $variant={variant} $size={size} $full={full} {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;

// UCH CRM düymələri: hap forması, accent qradiyenti, şüşə ikinci dərəcəli
const variants = {
  primary: css`
    background: var(--grad);
    color: #fff;
    box-shadow: 0 6px 22px color-mix(in srgb, var(--accent) 40%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    &:hover:not(:disabled) {
      filter: brightness(1.08);
    }
  `,
  secondary: css`
    background: var(--bg-secondary);
    color: var(--text);
    border-color: var(--line);
    &:hover:not(:disabled) {
      background: var(--panel-2);
    }
  `,
  outline: css`
    background: transparent;
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 50%, transparent);
    &:hover:not(:disabled) {
      background: var(--accent-soft);
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--text-3);
    &:hover:not(:disabled) {
      background: var(--bg-secondary);
      color: var(--text);
    }
  `,
  dark: css`
    background: var(--text);
    color: var(--bg);
  `,
  danger: css`
    background: color-mix(in srgb, var(--critical) 14%, transparent);
    color: var(--critical);
  `,
  success: css`
    background: color-mix(in srgb, var(--good) 14%, transparent);
    color: var(--good);
  `,
};

const sizes = {
  sm: css`
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    border-radius: 15px;
  `,
  md: css`
    height: 38px;
    padding: 0 16px;
    font-size: 13px;
    border-radius: 19px;
  `,
  lg: css`
    height: 46px;
    padding: 0 22px;
    font-size: 15px;
    border-radius: 23px;
  `,
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-family: var(--font-semibold);
  white-space: nowrap;
  border: 1px solid transparent;
  transition: transform 0.08s, background 0.15s, filter 0.15s;
  width: ${({ $full }) => ($full ? "100%" : "auto")};
  ${({ $variant }) => variants[$variant] || variants.primary}
  ${({ $size }) => sizes[$size] || sizes.md}

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  svg {
    flex: none;
  }
`;
