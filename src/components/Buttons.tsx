import React from "react";
import "./styles/Buttons.css";

type DefaultButtonProps = {
  label: string;
  onClick?: () => void;
};

export const DefaultButton: React.FC<DefaultButtonProps> = ({
  label,
  onClick,
}) => {
  return (
    <button className="default-button" onClick={onClick}>
      {label}
    </button>
  );
};
