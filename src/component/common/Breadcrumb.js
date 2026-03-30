"use client";

import PropTypes from "prop-types";
import { useRouter } from "next/navigation";

export default function Breadcrumb({ title, items }) {
  const router = useRouter();

  return (
    <div className="mb-3">
      <h5 className="fw-medium mb-1" style={{ fontSize: 18 }}>
        {title}
      </h5>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li
                key={item.label}
                className={`breadcrumb-item ${isLast ? "active" : ""}`}
                style={{ fontSize: 13 }}
                aria-current={isLast ? "page" : undefined}
              >
                {item.href ? (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ fontSize: 13, color: "#185fa5" }}
                    onClick={() => router.push(item.href)}
                  >
                    {item.label}
                  </button>
                ) : (
                  item.label
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

Breadcrumb.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ).isRequired,
};