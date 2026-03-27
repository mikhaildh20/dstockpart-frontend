import PropTypes from "prop-types";

export default function Badge({
  status = "Aktif",
  size = "sm",
  customMap = {},
  className = "",
}) {
  const defaultStyleMap = {
    Procceed: "bg-warning-subtle text-warning",
    Approve: "bg-success-subtle text-success",
    Rejected: "bg-danger-subtle text-danger",
    Draft: "bg-info-subtle text-info",
    Active: "bg-success-subtle text-success",
    Inactive: "bg-secondary-subtle text-secondary",
    Complete: "bg-primary-subtle text-primary",
    Cancel: "bg-danger-subtle text-danger",
  };

  const styleMap = { ...defaultStyleMap, ...customMap };
  const badgeClass = styleMap[status] || "bg-secondary-subtle text-secondary";
  const sizeClasses = {
    xs: "px-1 py-0",
    sm: "px-2 py-1",
    md: "px-2 py-1",
    lg: "px-3 py-2",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <span
      className={`badge ${badgeClass} ${sizeClass} ${className}`}
      style={{ borderRadius: "0.6rem", fontWeight: 500 }}
    >
      {status}
    </span>
  );
}

Badge.propTypes = {
  status: PropTypes.string,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg"]),
  customMap: PropTypes.objectOf(PropTypes.string),
  className: PropTypes.string,
};
