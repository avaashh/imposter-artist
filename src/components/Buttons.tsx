import React from "react";
import "./styles/Buttons.css";

type DefaultButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: {};
  className?: string;
};

export const DefaultButton: React.FC<DefaultButtonProps> = ({
  label,
  onClick,
  disabled,
  style,
  className,
}) => {
  return (
    <button
      className={`default-button ${disabled ? "disabled" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {label}
    </button>
  );
};
