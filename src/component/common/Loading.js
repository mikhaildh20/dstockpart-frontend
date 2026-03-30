import PropTypes from "prop-types";
import { BarLoader } from "react-spinners";

export default function Loading({
  loading = false,
  color = "#185fa5",
  size = 60,
  message = "",
}) {
  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(5px)",
      }}
    >
      <BarLoader color={color} size={size} />
      {message && (
        <p className="fw-medium mb-0 mt-3" style={{ fontSize: 13, color: "#6b6b6b" }}>
          {message}
        </p>
      )}
    </div>
  );
}

Loading.propTypes = {
  loading: PropTypes.bool,
  color: PropTypes.string,
  size: PropTypes.number,
  message: PropTypes.string,
};