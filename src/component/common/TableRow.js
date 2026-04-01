"use client";

import Icon from "./Icon";
import Badge from "./Badge";
import DOMPurify from "isomorphic-dompurify";
import PropTypes from "prop-types";
import { useCallback } from "react";

export default function TableRow({
  row,
  columns,
  enableCheckbox,
  isSelected,
  isRowSelectable,
  onSelectRow,
  onToggle,
  onCancel,
  onDelete,
  onDetail,
  onEdit,
  onApprove,
  onReject,
  onSent,
  onUpload,
  onFinal,
  onPrint,
  onReset,
  config,
  rowClassName,
}) {
  const renderAction = useCallback(
    (actions, id, status) =>
      actions.map((action) => {
        switch (action) {
          case "Toggle": {
            if (status === "Active") {
              return (
                <Icon
                  key={`${id}-${action}`}
                  name="toggle-on"
                  type="Bold"
                  cssClass="btn px-1 py-0"
                  style={{ color: "#185fa5" }}
                  title="Disable"
                  onClick={() => onToggle(id)}
                />
              );
            } else if (status === "Inactive") {
              return (
                <Icon
                  key={`${id}-${action}`}
                  name="toggle-off"
                  type="Bold"
                  cssClass="btn px-1 py-0 text-secondary"
                  title="Enable"
                  onClick={() => onToggle(id)}
                />
              );
            }
            return null;
          }

          case "Detail":
            return (
              <Icon
                key={`${id}-${action}`}
                name="eye"
                title="See Detail"
                cssClass="btn px-1 py-0"
                style={{ color: "#185fa5" }}
                onClick={() => onDetail(id)}
              />
            );

          case "Cancel":
            return (
              <Icon
                key={`${id}-${action}`}
                name="file-earmark-x"
                type="Bold"
                cssClass="btn px-1 py-0"
                style={{ color: "#a32d2d" }}
                title="Cancel"
                onClick={() => onCancel(id)}
              />
            );

          case "Edit":
            return (
              <Icon
                key={`${id}-${action}`}
                name="pencil-square"
                title="Edit"
                cssClass="btn px-1 py-0"
                style={{ color: "#854f0b" }}
                onClick={() => onEdit(id)}
              />
            );

          case "Delete":
            return (
              <Icon
                key={`${id}-${action}`}
                name="trash"
                title="Delete"
                cssClass="btn px-1 py-0"
                style={{ color: "#a32d2d" }}
                onClick={() => onDelete(id)}
              />
            );

          case "Approve":
            return (
              <Icon
                key={`${id}-${action}`}
                name="check"
                type="Bold"
                cssClass="btn px-1 py-0"
                style={{ color: "#3b6d11" }}
                title="Approve Request"
                onClick={() => onApprove(id)}
              />
            );

          case "Reject":
            return (
              <Icon
                key={`${id}-${action}`}
                name="x"
                type="Bold"
                cssClass="btn px-1 py-0"
                style={{ color: "#a32d2d" }}
                title="Reject Request"
                onClick={() => onReject(id)}
              />
            );

          case "Print":
            return (
              <Icon
                key={`${id}-${action}`}
                name="printer"
                title="Print"
                cssClass="btn px-1 py-0 text-secondary"
                onClick={() => onPrint(id)}
              />
            );

          case "Sent":
            return (
              <Icon
                key={`${id}-${action}`}
                name="send"
                title="Sent"
                cssClass="btn px-1 py-0"
                style={{ color: "#185fa5" }}
                onClick={() => onSent(id)}
              />
            );

          case "Upload":
            return (
              <Icon
                key={`${id}-${action}`}
                name="cloud-upload"
                type="Bold"
                cssClass="btn px-1 py-0"
                style={{ color: "#185fa5" }}
                title="Upload File"
                onClick={() => onUpload(id)}
              />
            );

          case "Final":
            return (
              <Icon
                key={`${id}-${action}`}
                name="hammer"
                type="Bold"
                cssClass="btn px-1 py-0"
                style={{ color: "#185fa5" }}
                title="Finalize"
                onClick={() => onFinal(id)}
              />
            );

          case "Reset":
            return (
              <Icon
                key={`${id}-${action}`}
                name="arrow-clockwise"
                type="Bold"
                cssClass="btn px-1 py-0"
                style={{ color: "#854f0b" }}
                title="Reset"
                onClick={() => onReset(id)}
              />
            );

          default: {
            try {
              if (typeof action === "object") {
                return (
                  <Icon
                    key={row.id + "Custom" + action.IconName}
                    name={action.IconName}
                    type="Bold"
                    cssClass="btn px-1 py-0"
                    style={{ color: "#185fa5" }}
                    title={action.Title}
                    onClick={action.Function}
                  />
                );
              }
              return null;
            } catch {
              return null;
            }
          }
        }
      }),
    [
      row.id,
      row.Status,
      onApprove,
      onCancel,
      onDelete,
      onDetail,
      onEdit,
      onFinal,
      onPrint,
      onReject,
      onReset,
      onSent,
      onToggle,
      onUpload,
    ]
  );

  const canSelect = isRowSelectable ? isRowSelectable(row) : true;
  const customRowClass = rowClassName ? rowClassName(row) : "";

  return (
    <tr
      className={`align-middle ${customRowClass}`}
      style={{
        transition: "background-color 0.12s",
        cursor: canSelect && enableCheckbox ? "pointer" : "default",
        backgroundColor: isSelected ? "#e6f1fb" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#f5f5f4";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {columns.map((col, index) => {
        let cell;
        const isWrap = config?.isWrap?.[col] || false;

        if (enableCheckbox && col === "Check") {
          cell = canSelect ? (
            <input
              type="checkbox"
              className="form-check-input"
              checked={isSelected}
              onChange={() => onSelectRow(row.id)}
              style={{ cursor: "pointer", width: 16, height: 16 }}
            />
          ) : (
            <span className="text-secondary" style={{ fontSize: 13 }} />
          );
        } else if (col === "Status") {
          cell = <Badge status={row[col]} />;
        } else if (col === "Action") {
          cell = (
            <div className="d-flex justify-content-center align-items-center gap-1">
              {Array.isArray(row[col]) ? (
                renderAction(row[col], row.id, row.Status)
              ) : (
                <div className="px-2" style={{ fontSize: 13, color: "#6c757d" }}>
                  {row[col] ?? "-"}
                </div>
              )}
            </div>
          );
        } else if (typeof row[col] === "string") {
          cell = (
            <div
              className="px-2"
              style={{
                whiteSpace: isWrap ? "normal" : "nowrap",
                fontSize: 13,
                color: "#1a1a1a",
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(row[col]),
              }}
            />
          );
        } else {
          cell = (
            <div className="px-2" style={{ fontSize: 13, color: "#1a1a1a" }}>
              {row[col]}
            </div>
          );
        }

        return (
          <td
            key={col + "-" + index}
            className="py-2"
            style={{
              textAlign: row.Alignment ? row.Alignment[index] : "center",
              verticalAlign: "middle",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            {cell}
          </td>
        );
      })}
    </tr>
  );
}

TableRow.propTypes = {
  row: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  enableCheckbox: PropTypes.bool,
  isSelected: PropTypes.bool,
  isRowSelectable: PropTypes.func,
  onSelectRow: PropTypes.func,
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
  onReset: PropTypes.func,
  config: PropTypes.object,
  rowClassName: PropTypes.func,
};
