import PropTypes from "prop-types";

export default function Label({
  text,
  htmlFor,
  required = false,
  tooltip = "",
  className = "",
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`form-label fw-semibold mb-2 ${className}`}
      title={tooltip}
      style={{
        fontSize: "0.875rem",
        color: "#495057",
        letterSpacing: "0.2px",
        display: "block",
      }}
    >
      {text}
      {required && (
        <span 
          className="text-danger ms-1"
          style={{
            fontSize: "1rem",
            fontWeight: "600",
          }}
        >
          *
        </span>
      )}
    </label>
  );
}

Label.propTypes = {
  text: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  className: PropTypes.string,
};