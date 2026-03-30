import PropTypes from "prop-types";
import Icon from "./Icon";

const VARIANTS = {
  // Primary — biru sidebar (#185fa5)
  primary: {
    background: "#185fa5",
    color: "#fff",
    border: "none",
  },
  // Secondary — light/outline
  secondary: {
    background: "transparent",
    color: "#6b6b6b",
    border: "1px solid #e0e0e0",
  },
  // Warning/Login — amber style (same as sidebar login btn)
  warning: {
    background: "#faeeda",
    color: "#854f0b",
    border: "1px solid #fac775",
  },
  // Danger — merah subtle
  danger: {
    background: "#fff5f5",
    color: "#a32d2d",
    border: "0.5px solid #f5c6c6",
  },
  // Light — abu-abu (same as sidebar toggle/logout btn)
  light: {
    background: "#f5f5f4",
    color: "#1a1a1a",
    border: "1px solid #e0e0e0",
  },
  // Dark
  dark: {
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
  },
};

export default function Button({
  classType = "secondary",
  iconName,
  label = "",
  title = "",
  type = "button",
  isDisabled = false,
  cssIcon = "",
  iconOnly = false,
  ...rest
}) {
  const variant = VARIANTS[classType] ?? VARIANTS.secondary;

  // icon-only: circle button (same as sidebar collapsed footer btn)
  if (iconOnly) {
    return (
      <button
        type={type}
        title={title}
        disabled={isDisabled}
        className="btn d-flex align-items-center justify-content-center border-0"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          padding: 0,
          ...variant,
          opacity: isDisabled ? 0.5 : 1,
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) e.currentTarget.style.filter = "brightness(0.93)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "none";
        }}
        {...rest}
      >
        {iconName && <Icon name={iconName} cssClass={cssIcon} />}
      </button>
    );
  }

  return (
    <button
      type={type}
      title={title}
      disabled={isDisabled}
      className="btn d-flex align-items-center justify-content-center gap-2"
      style={{
        height: 38,
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 8,
        padding: "0 16px",
        ...variant,
        opacity: isDisabled ? 0.5 : 1,
        transition: "background 0.12s, filter 0.12s",
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.filter = "brightness(0.93)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "none";
      }}
      {...rest}
    >
      {iconName && (
        <Icon
          name={iconName}
          cssClass={cssIcon}
          style={{ fontSize: 15, flexShrink: 0 }}
        />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}

Button.propTypes = {
  classType: PropTypes.oneOf([
    "primary",
    "secondary",
    "warning",
    "danger",
    "light",
    "dark",
  ]),
  iconName: PropTypes.string,
  label: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  isDisabled: PropTypes.bool,
  cssIcon: PropTypes.string,
  iconOnly: PropTypes.bool,
};