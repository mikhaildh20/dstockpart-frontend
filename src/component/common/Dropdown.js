import { forwardRef } from "react";
import Label from "./Label";
import PropTypes from "prop-types";

const DropDown = (
  {
    arrData,
    type = "choose",
    label = "",
    forInput,
    isRequired = false,
    isDisabled = false,
    errorMessage,
    showLabel = true,
    ...props
  },
  ref
) => {
  let placeholder = "";

  switch (type) {
    case "choose":
      placeholder = (
        <option value="" disabled>
          {"-- Choose " + label + " --"}
        </option>
      );
      break;
    case "all":
      placeholder = <option value="">-- All --</option>;
      break;
    default:
      break;
  }

  return (
    <div className="mb-3">
      {showLabel && (
        <Label
          required={isRequired}
          text={label}
          htmlFor={forInput}
          tooltip={label}
        />
      )}
      <select
        className="form-select rounded-2"
        id={forInput}
        name={forInput}
        ref={ref}
        disabled={isDisabled}
        style={{ fontSize: 13, height: 38 }}
        {...props}
      >
        {placeholder}
        {arrData &&
          arrData.length > 0 &&
          arrData.map((data) => {
            return (
              <option key={data.Value} value={data.Value}>
                {data.Text}
              </option>
            );
          })}
      </select>
      {errorMessage && (
        <span
          className="d-flex align-items-center gap-1 mt-1"
          style={{ fontSize: 12, color: "#a32d2d" }}
        >
          <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 12 }} />
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default forwardRef(DropDown);

DropDown.propTypes = {
  arrData: PropTypes.arrayOf(
    PropTypes.shape({
      Value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      Text: PropTypes.string.isRequired,
    })
  ).isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  forInput: PropTypes.string,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool,
  errorMessage: PropTypes.string,
  showLabel: PropTypes.bool,
};