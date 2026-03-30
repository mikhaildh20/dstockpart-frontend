import PropTypes from "prop-types";
import Button from "./Button";
import { useMemo } from "react";

export default function Paging({
  pageSize,
  pageCurrent,
  totalData,
  navigation,
}) {
  const totalPage = Math.ceil(totalData / pageSize);
  const startData = (pageCurrent - 1) * pageSize + 1;
  const endData = Math.min(pageCurrent * pageSize, totalData);

  const pageButtons = useMemo(() => {
    let buttons = [];

    buttons.push(
      <Button
        key="prev"
        classType="light"
        isDisabled={pageCurrent === 1}
        onClick={() => navigation(pageCurrent - 1)}
        iconName="chevron-left"
        iconOnly
      />
    );

    const visiblePages = [1];
    if (pageCurrent > 2) visiblePages.push(pageCurrent - 1);
    if (pageCurrent !== 1 && pageCurrent !== totalPage)
      visiblePages.push(pageCurrent);
    if (pageCurrent < totalPage - 1) visiblePages.push(pageCurrent + 1);
    if (!visiblePages.includes(totalPage)) visiblePages.push(totalPage);

    const uniquePages = [...new Set(visiblePages)].sort((a, b) => a - b);
    let lastPage = 0;

    uniquePages.forEach((page) => {
      if (page - lastPage > 1) {
        buttons.push(
          <span
            key={`dots-${page}`}
            className="mx-1 text-secondary"
            style={{ fontSize: 13, userSelect: "none" }}
          >
            ···
          </span>
        );
      }

      const isActive = page === pageCurrent;
      buttons.push(
        <button
          key={page}
          className="btn"
          onClick={() => navigation(page)}
          style={{
            minWidth: 34,
            height: 34,
            fontSize: 13,
            fontWeight: isActive ? 500 : 400,
            borderRadius: 8,
            padding: "0 10px",
            border: isActive ? "none" : "1px solid #e0e0e0",
            background: isActive ? "#185fa5" : "transparent",
            color: isActive ? "#fff" : "#6b6b6b",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = "#f5f5f4";
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }}
        >
          {page}
        </button>
      );

      lastPage = page;
    });

    buttons.push(
      <Button
        key="next"
        classType="light"
        isDisabled={pageCurrent === totalPage}
        onClick={() => navigation(pageCurrent + 1)}
        iconName="chevron-right"
        iconOnly
      />
    );

    return buttons;
  }, [pageCurrent, totalPage, navigation]);

  return (
    <div className="py-3 px-2">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-1">{pageButtons}</div>

        <div
          className="d-flex align-items-center gap-1"
          style={{
            fontSize: 13,
            color: "#6b6b6b",
            background: "#f5f5f4",
            borderRadius: 8,
            padding: "6px 12px",
            border: "1px solid #e0e0e0",
          }}
        >
          <span>Showing</span>
          <span className="fw-medium px-1" style={{ color: "#185fa5" }}>
            {startData}–{endData}
          </span>
          <span>of</span>
          <span className="fw-medium px-1" style={{ color: "#185fa5" }}>
            {totalData}
          </span>
        </div>
      </div>
    </div>
  );
}

Paging.propTypes = {
  pageSize: PropTypes.number.isRequired,
  pageCurrent: PropTypes.number.isRequired,
  totalData: PropTypes.number.isRequired,
  navigation: PropTypes.func.isRequired,
};