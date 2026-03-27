import PropTypes from "prop-types";

export default function TableHeader({
  columns,
  enableCheckbox,
  isAllSelected,
  onSelectAll,
  config,
}) {
  return (
    <thead className="position-sticky top-0" style={{ zIndex: 10 }}>
      <tr className="border-bottom border-2">
        {columns.map((col, i) => {
          let width = "auto";

          if (config?.widths?.[col]) {
            width = config.widths[col];
          } else if (col === "Check") {
            width = "3%";
          }

          return (
            <th
              key={col + "-" + i}
              className="text-center align-middle py-3 px-3 bg-white text-uppercase fw-semibold text-secondary"
              style={{
                whiteSpace: "nowrap",
                width: width,
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                borderBottom: "2px solid #dee2e6",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
              title={col === "Check" ? "Pilih Semua" : col}
            >
              {enableCheckbox && col === "Check" ? (
                <input
                  type="checkbox"
                  className="form-check-input shadow-sm"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  style={{ 
                    cursor: "pointer",
                    width: "18px",
                    height: "18px"
                  }}
                />
              ) : (
                col
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

TableHeader.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  enableCheckbox: PropTypes.bool,
  isAllSelected: PropTypes.bool,
  onSelectAll: PropTypes.func,
  config: PropTypes.object,
};