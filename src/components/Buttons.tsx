import React from "react";
import "./styles/Buttons.css";

type DefaultButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: {};
};

export const DefaultButton: React.FC<DefaultButtonProps> = ({
  label,
  onClick,
  disabled,
  style,
}) => {
  return (
    <button
      className={`default-button ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {label}
    </button>
  );
};
