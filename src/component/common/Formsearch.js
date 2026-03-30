"use client";

import { useState, useCallback } from "react";
import Filter from "./Filter";
import PropTypes from "prop-types";

export default function Formsearch({
  onAdd,
  onSearch,
  onFilter,
  onExport,
  searchPlaceholder = "Search...",
  showAddButton = true,
  showSearchBar = true,
  showFilterButton = true,
  showExportButton = true,
  addButtonText = "Add",
  filterContent = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(() => {
    if (onSearch) onSearch(searchQuery);
  }, [onSearch, searchQuery]);

  const handleAdd = useCallback(() => {
    if (onAdd) onAdd();
  }, [onAdd]);

  const handleFilterApply = useCallback(() => {
    if (onFilter) onFilter();
  }, [onFilter]);

  const handleExport = useCallback(() => {
    if (onExport) onExport();
  }, [onExport]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  return (
    <div className="pt-1 pb-3">
      <div className="row g-2 align-items-center">

        {/* Add button */}
        {showAddButton && (
          <div className="col-12 col-md-auto">
            <button
              className="btn d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto"
              onClick={handleAdd}
              style={{
                height: 38,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                background: "#185fa5",
                color: "#fff",
                border: "none",
                padding: "0 16px",
                transition: "filter 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.93)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              <i className="bi bi-plus-lg" style={{ fontSize: 15 }} />
              <span>{addButtonText}</span>
            </button>
          </div>
        )}

        {/* Search bar */}
        {showSearchBar && (
          <div className="col-12 col-md">
            <div
              className="d-flex rounded-2 overflow-hidden"
              style={{ border: "1px solid #dee2e6", height: 38 }}
            >
              <input
                type="text"
                className="form-control border-0 shadow-none"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                style={{ fontSize: 13, height: "100%" }}
              />
              <button
                className="btn border-0 d-flex align-items-center justify-content-center flex-shrink-0"
                onClick={handleSearch}
                style={{
                  width: 38,
                  background: "#185fa5",
                  color: "#fff",
                  borderRadius: 0,
                  transition: "filter 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.93)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              >
                <i className="bi bi-search" style={{ fontSize: 13 }} />
              </button>
            </div>
          </div>
        )}

        {/* Filter + Export */}
        {(showFilterButton || showExportButton) && (
          <div className="col-12 col-md-auto">
            <div className="d-flex gap-2">
              {showFilterButton && (
                <div className="btn-group">
                  <Filter onClick={handleFilterApply}>{filterContent}</Filter>
                </div>
              )}
              {showExportButton && (
                <button
                  className="btn d-flex align-items-center justify-content-center gap-2 flex-fill flex-md-grow-0"
                  onClick={handleExport}
                  style={{
                    height: 38,
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 8,
                    padding: "0 16px",
                    background: "#faeeda",
                    color: "#854f0b",
                    border: "1px solid #fac775",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fac775")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#faeeda")}
                >
                  <i className="bi bi-box-arrow-up" style={{ fontSize: 14 }} />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .w-md-auto { width: auto !important; }
          .flex-md-grow-0 { flex-grow: 0 !important; }
        }
      `}</style>
    </div>
  );
}

Formsearch.propTypes = {
  onAdd: PropTypes.func,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func,
  onExport: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  showAddButton: PropTypes.bool,
  showSearchBar: PropTypes.bool,
  showFilterButton: PropTypes.bool,
  showExportButton: PropTypes.bool,
  addButtonText: PropTypes.string,
  filterContent: PropTypes.node,
};