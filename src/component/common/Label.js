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
      className={`form-label fw-medium mb-1 d-block ${className}`}
      title={tooltip}
      style={{ fontSize: 13 }}
    >
      {text}
      {required && (
        <span className="ms-1" style={{ color: "#a32d2d", fontSize: 13 }}>
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