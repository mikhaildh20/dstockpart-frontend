import PropTypes from "prop-types";
import { useState, useEffect, useMemo } from "react";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

export default function Table({
  data,
  size = "Normal",
  enableCheckbox = false,
  initialSelectedIds = [],
  isRowSelectable = () => true,
  onSelectionChange = () => {},
  onToggle = () => {},
  onCancel = () => {},
  onDelete = () => {},
  onDetail = () => {},
  onEdit = () => {},
  onApprove = () => {},
  onReject = () => {},
  onSent = () => {},
  onUpload = () => {},
  onFinal = () => {},
  onPrint = () => {},
  onReset = () => {},
  config = {},
  rowClassName,
}) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);

  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [data, initialSelectedIds]);

  useEffect(() => {
    onSelectionChange(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];

    const cols = Object.keys(data[0]).filter(
      (v) => v !== "Key" && v !== "Count" && v !== "Alignment" && v !== "id"
    );

    if (enableCheckbox) {
      return ["Check", ...cols];
    }
    return cols;
  }, [data, enableCheckbox]);

  if (!data || data.length === 0) {
    return (
      <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
        No data.
      </p>
    );
  }

  const selectableItems = data.filter((item) => isRowSelectable(item));
  const isAllSelected =
    selectableItems.length > 0 && selectedIds.length === selectableItems.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(selectableItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div
      className="table-responsive rounded-2"
      style={{ border: "1px solid #e0e0e0" }}
    >
      <table
        style={{ whiteSpace: "nowrap", fontSize: 13 }}
        className={`table table-hover table-borderless m-0 ${
          size === "Small" ? "table-sm" : ""
        }`}
      >
        <TableHeader
          columns={columns}
          enableCheckbox={enableCheckbox}
          isAllSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          config={config}
        />
        <tbody>
          {data.map((row) => (
            <TableRow
              key={row.Key || row.id}
              row={row}
              columns={columns}
              enableCheckbox={enableCheckbox}
              isRowSelectable={isRowSelectable}
              isSelected={selectedIds.includes(row.id)}
              onSelectRow={handleSelectRow}
              onToggle={onToggle}
              onCancel={onCancel}
              onDelete={onDelete}
              onDetail={onDetail}
              onEdit={onEdit}
              onApprove={onApprove}
              onReject={onReject}
              onSent={onSent}
              onUpload={onUpload}
              onFinal={onFinal}
              onPrint={onPrint}
              onReset={onReset}
              config={config}
              rowClassName={rowClassName}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  size: PropTypes.oneOf(["Normal", "Small"]),
  enableCheckbox: PropTypes.bool,
  initialSelectedIds: PropTypes.array,
  isRowSelectable: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onToggle: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  onDetail: PropTypes.func,
  onEdit: PropTypes.func,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onSent: PropTypes.func,
  onUpload: PropTypes.func,
  onFinal: PropTypes.func,
  onPrint: PropTypes.func,
  config: PropTypes.object,
  rowClassName: PropTypes.func,
};