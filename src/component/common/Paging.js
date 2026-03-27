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
        classType="success rounded-circle shadow-sm"
        isDisabled={pageCurrent === 1}
        onClick={() => navigation(pageCurrent - 1)}
        style={{ 
          width: 36, 
          height: 36, 
          padding: 0,
          transition: "all 0.2s ease",
        }}
        cssIcon="text-white"
        iconName="chevron-left"
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
            className="mx-2 text-muted fw-bold"
            style={{ 
              fontSize: "1.1rem",
              userSelect: "none"
            }}
          >
            ···
          </span>
        );
      }

      buttons.push(
        <button
          key={page}
          className={`btn btn-sm mx-1 ${
            page === pageCurrent 
              ? "btn-success shadow-sm text-white" // Tambahin text-white di sini
              : "btn-light text-secondary"
          }`}
          onClick={() => navigation(page)}
          style={{
            minWidth: "36px",
            height: "36px",
            fontWeight: page === pageCurrent ? "600" : "500",
            borderRadius: "0.5rem",
            transition: "all 0.2s ease",
            border: page === pageCurrent ? "none" : "1px solid #e9ecef",
            color: page === pageCurrent ? "#ffffff" : "#6c757d", // Explicitly set warna text
          }}
          onMouseEnter={(e) => {
            if (page !== pageCurrent) {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (page !== pageCurrent) {
              e.currentTarget.style.backgroundColor = "";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
            }
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
        classType="btn btn-success rounded-circle shadow-sm"
        isDisabled={pageCurrent === totalPage}
        onClick={() => navigation(pageCurrent + 1)}
        style={{ 
          width: 36, 
          height: 36, 
          padding: 0,
          transition: "all 0.2s ease",
        }}
        cssIcon="text-white"
        iconName="chevron-right"
      />
    );

    return buttons;
  }, [pageCurrent, totalPage, navigation]);

  return (
    <div className="py-3 px-2">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-1">
          {pageButtons}
        </div>
        
        <div 
          className="text-secondary d-flex align-items-center gap-1"
          style={{
            fontSize: "0.875rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "0.5rem",
            border: "1px solid #e9ecef",
          }}
        >
          <span>Showing</span>
          <span 
            className="fw-semibold text-success px-1"
            style={{
              fontSize: "0.9375rem",
            }}
          >
            {startData}–{endData}
          </span>
          <span>of</span>
          <span 
            className="fw-semibold text-success px-1"
            style={{
              fontSize: "0.9375rem",
            }}
          >
            {totalData}
          </span>
        </div>
      </div>

      <style jsx>{`
        .btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25) !important;
        }

        .btn-success:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15) !important;
        }
      `}</style>
    </div>
  );
}

Paging.propTypes = {
  pageSize: PropTypes.number.isRequired,
  pageCurrent: PropTypes.number.isRequired,
  totalData: PropTypes.number.isRequired,
  navigation: PropTypes.func.isRequired,
};