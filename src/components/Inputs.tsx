import React, { useState } from "react";
import "./styles/Inputs.css";

type DefaultInputProps = {
  label: string;
  value: string;
  setValue?: (v: string) => void;
};

const DefaultInput: React.FC<DefaultInputProps> = ({
  label,
  value,
  setValue,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (setValue !== undefined) setValue(event.target.value);
  };

  return (
    <div className="default-input">
      <label className="default-input-label">{label}</label>
      <input
        type="text"
        className="default-input-field"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default DefaultInput;