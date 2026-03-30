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
      <tr>
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
              className="text-center align-middle py-2 px-3 bg-white fw-medium"
              style={{
                whiteSpace: "nowrap",
                width: width,
                fontSize: 11,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: "#b0b0b0",
                borderBottom: "1px solid #e0e0e0",
              }}
              title={col === "Check" ? "Pilih Semua" : col}
            >
              {enableCheckbox && col === "Check" ? (
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  style={{ cursor: "pointer", width: 16, height: 16 }}
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