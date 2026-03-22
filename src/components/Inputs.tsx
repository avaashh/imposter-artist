import React from "react";
import "./styles/Inputs.css";

type DefaultInputProps = {
  label: string;
  value: string;
  setValue?: (v: string) => void;
  onCommit?: (v: string) => void;
  width?: string;
  style?: {};
  required?: boolean;
  readOnly?: boolean;
  type?: string;
};

const DefaultInput: React.FC<DefaultInputProps> = ({
  label,
  value,
  setValue,
  onCommit,
  width,
  style,
  required,
  readOnly,
  type,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (setValue !== undefined) setValue(event.target.value);
  };
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onCommit !== undefined) onCommit(event.target.value);
  };

  return (
    <div className="default-input" style={{ ...style, width: width }}>
      <label className="default-input-label">
        {label} {required && <span style={{ color: "red" }}> *</span>}
      </label>
      <input
        type={type ?? "text"}
        className="default-input-field"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={readOnly}
      />
    </div>
  );
};

type SelectorInputProps = DefaultInputProps & {
  options: string[];
};

export const SelectorInput: React.FC<SelectorInputProps> = ({
  label,
  options,
  value,
  setValue,
  onCommit,
  width,
  style,
  required,
  readOnly,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (setValue !== undefined) setValue(event.target.value);
    if (onCommit !== undefined) onCommit(event.target.value);
  };

  return (
    <div className="default-input" style={{ ...style, width: width }}>
      <label className="default-input-label">
        {label} {required && <span style={{ color: "red" }}> *</span>}
      </label>
      <select
        className="default-input-field"
        value={value}
        onChange={handleChange}
        disabled={readOnly}
      >
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DefaultInput;
