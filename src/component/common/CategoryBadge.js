"use client";

import PropTypes from "prop-types";

/**
 * Generates a consistent Bootstrap color variant based on text
 * @param {string} text
 * @returns {{ bg: string, text: string, border: string }}
 */
const getColorForText = (text) => {
    const colorPairs = [
        { bg: "primary", text: "white", border: "primary" },
        { bg: "success", text: "white", border: "success" },
        { bg: "danger", text: "white", border: "danger" },
        { bg: "warning", text: "dark", border: "warning" },
        { bg: "info", text: "dark", border: "info" },
        { bg: "secondary", text: "white", border: "secondary" },
        { bg: "dark", text: "white", border: "dark" },

        // subtle modern look
        { bg: "primary-subtle", text: "primary", border: "primary" },
        { bg: "success-subtle", text: "success", border: "success" },
        { bg: "danger-subtle", text: "danger", border: "danger" },
        { bg: "warning-subtle", text: "warning", border: "warning" },
        { bg: "info-subtle", text: "info", border: "info" }
    ];

    if (!text) return colorPairs[0];

    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 33) ^ text.charCodeAt(i);
    }

    const index = Math.abs(hash) % colorPairs.length;
    return colorPairs[index];
};

/**
 * CategoryBadge Component
 */
export default function CategoryBadge({
    text,
    variant = "solid",
    className = ""
    }) {
    if (!text) return null;

    const color = getColorForText(text);

    const baseClasses = "badge";

    const variantClasses =
        variant === "outline"
        ? `bg-${color.bg} bg-opacity-10 text-${color.text} border border-${color.border}`
        : `bg-${color.bg} text-${color.text}`;

    const badgeClass = `${baseClasses} ${variantClasses} ${className}`.trim();

    return (
        <span
        className={badgeClass}
        style={{
            fontSize: "0.875rem",
            fontWeight: "500",
            padding: "0.35rem 0.65rem",
            borderRadius: "0.5rem",
            display: "inline-block",
            maxWidth: "220px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
        }}
        title={text}
        >
        {text}
        </span>
    );
}

CategoryBadge.propTypes = {
    text: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(["solid", "outline"]),
    className: PropTypes.string
};

CategoryBadge.defaultProps = {
    variant: "solid",
    className: ""
};
