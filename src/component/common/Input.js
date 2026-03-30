import PropTypes from "prop-types";
import Label from "./Label";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  name,
  id,
  disabled = false,
  required = false,
  className = "",
  error = "",
  helperText = "",
  size = "md",
  readOnly = false,
  autoComplete = "off",
  maxLength,
}) {
  const sizeStyles = {
    sm: { height: 32, fontSize: 12 },
    md: { height: 38, fontSize: 13 },
    lg: { height: 44, fontSize: 14 },
  };

  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <Label
          htmlFor={id || name}
          text={label}
          tooltip={label}
          required={required}
        />
      )}

      <input
        type={type}
        className={`form-control rounded-2 ${error ? "is-invalid" : ""}`}
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        autoComplete={autoComplete}
        maxLength={maxLength}
        style={sizeStyle}
      />

      {helperText && !error && (
        <div className="form-text" style={{ fontSize: 12 }}>
          {helperText}
        </div>
      )}

      {error && (
        <span
          className="d-flex align-items-center gap-1 mt-1"
          style={{ fontSize: 12, color: "#a32d2d" }}
        >
          <i
            className="bi bi-exclamation-circle-fill"
            style={{ fontSize: 12 }}
          />
          {error}
        </span>
      )}
    </div>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  readOnly: PropTypes.bool,
  autoComplete: PropTypes.string,
  maxLength: PropTypes.number,
};