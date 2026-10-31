import styled, { css } from "styled-components";

const Button = ({ children, variant = "primary", size = "md", full = false, ...props }) => {
  return (
    <StyledButton $variant={variant} $size={size} $full={full} {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;

const variants = {
  primary: css`
    background: var(--primary);
    color: #fff;
    &:hover:not(:disabled) {
      background: var(--primary-hover);
    }
  `,
  secondary: css`
    background: var(--bg-secondary);
    color: var(--text);
    &:hover:not(:disabled) {
      background: var(--panel-2);
    }
  `,
  outline: css`
    background: transparent;
    color: var(--primary);
    border: 1px solid var(--primary);
    &:hover:not(:disabled) {
      background: var(--primary-soft);
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--primary);
    &:hover:not(:disabled) {
      background: var(--bg-secondary);
    }
  `,
  dark: css`
    background: var(--text);
    color: var(--bg);
  `,
  danger: css`
    background: var(--critical);
    color: #fff;
  `,
  success: css`
    background: var(--good);
    color: #fff;
  `,
};

const sizes = {
  sm: css`
    padding: 6px 12px;
    font-size: 13px;
  `,
  md: css`
    padding: 10px 18px;
    font-size: 15px;
  `,
  lg: css`
    padding: 14px 22px;
    font-size: 16px;
  `,
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius);
  font-family: var(--font-semibold);
  border: 1px solid transparent;
  transition: background 0.15s ease;
  width: ${({ $full }) => ($full ? "100%" : "auto")};
  ${({ $variant }) => variants[$variant] || variants.primary}
  ${({ $size }) => sizes[$size] || sizes.md}

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
