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
                  cssClass="btn px-1 py-0 text-success"
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
                  cssClass="btn px-1 py-0 text-muted"
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
                cssClass="text-info btn px-1 py-0"
                onClick={() => onDetail(id)}
              />
            );
          case "Cancel":
            return (
              <Icon
                key={`${id}-${action}`}
                name="file-earmark-x"
                type="Bold"
                cssClass="btn px-1 py-0 text-danger"
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
                cssClass="text-warning btn px-1 py-0"
                onClick={() => onEdit(id)}
              />
            );
          case "Delete":
            return (
              <Icon
                key={`${id}-${action}`}
                name="trash"
                title="Delete"
                cssClass="text-danger btn px-1 py-0"
                onClick={() => onDelete(id)}
              />
            );
          case "Approve":
            return (
              <Icon
                key={`${id}-${action}`}
                name="check"
                type="Bold"
                cssClass="btn px-1 py-0 text-success"
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
                cssClass="btn px-1 py-0 text-danger"
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
                cssClass="text-secondary btn px-1 py-0"
                onClick={() => onPrint(id)}
              />
            );
          case "Sent":
            return (
              <Icon
                key={`${id}-${action}`}
                name="send"
                title="Sent"
                cssClass="text-primary btn px-1 py-0"
                onClick={() => onSent(id)}
              />
            );
          case "Upload":
            return (
              <Icon
                key={`${id}-${action}`}
                name="cloud-upload"
                type="Bold"
                cssClass="btn px-1 py-0 text-primary"
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
                cssClass="btn px-1 py-0 text-primary"
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
                cssClass="btn px-1 py-0 text-warning"
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
                    cssClass="btn px-1 py-0 text-primary"
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
      className={`align-middle transition-all ${
        isSelected ? "table-active bg-light" : ""
      } ${customRowClass}`}
      style={{
        transition: "background-color 0.2s ease",
        cursor: canSelect && enableCheckbox ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {columns.map((col, index) => {
        let cell;
        const isWrap = config?.isWrap?.[col] || false;

        if (enableCheckbox && col === "Check") {
          if (canSelect) {
            cell = (
              <input
                type="checkbox"
                className="form-check-input shadow-sm"
                checked={isSelected}
                onChange={() => onSelectRow(row.id)}
                style={{ 
                  cursor: "pointer",
                  width: "18px",
                  height: "18px"
                }}
              />
            );
          } else {
            cell = <span className="text-muted small"></span>;
          }
        } else if (col === "Status") {
          cell = <Badge status={row[col]} />;
        } else if (col === "Action") {
          cell = (
            <div className="d-flex justify-content-center align-items-center gap-1">
              {renderAction(row[col], row.id, row.Status)}
            </div>
          );
        } else if (typeof row[col] === "string") {
          cell = (
            <div
              className="px-2"
              style={{ 
                whiteSpace: isWrap ? "normal" : "nowrap",
                fontSize: "0.875rem",
                color: "#495057"
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(row[col]),
              }}
            ></div>
          );
        } else {
          cell = (
            <div 
              className="px-2"
              style={{
                fontSize: "0.875rem",
                color: "#495057"
              }}
            >
              {row[col]}
            </div>
          );
        }

        return (
          <td
            key={col + "-" + index}
            className="py-3 border-bottom"
            style={{
              textAlign: row.Alignment ? row.Alignment[index] : "center",
              verticalAlign: "middle",
              borderColor: "#e9ecef",
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