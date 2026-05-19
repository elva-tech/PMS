import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Path-style breadcrumbs: each segment with `to` is a button link; the last (or items without `to`) is plain text.
 * @param {{ label: string, to?: string }[]} items
 */
const BreadcrumbNav = ({
  items = [],
  className = "",
  linkClassName = "text-blue-700 hover:text-blue-900 font-medium",
  currentClassName = "text-gray-900 font-semibold",
  separatorClassName = "text-gray-300",
}) => {
  const navigate = useNavigate();
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`${className}`}>
      <ol className="inline-flex flex-wrap items-center gap-1 rounded-full border border-gray-200/90 bg-gray-50/90 px-3 py-1.5 shadow-sm">
        {items.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center min-w-0 text-sm">
            {i > 0 ? (
              <ChevronRight
                className={`${separatorClassName} mx-0.5 shrink-0`}
                size={16}
                strokeWidth={2}
                aria-hidden
              />
            ) : null}
            {crumb.to ? (
              <button
                type="button"
                onClick={() => navigate(crumb.to)}
                className={`truncate max-w-[12rem] sm:max-w-[16rem] text-left rounded-md px-1.5 py-0.5 transition hover:bg-white/80 ${linkClassName}`}
              >
                {crumb.label}
              </button>
            ) : (
              <span
                className={`truncate max-w-[12rem] sm:max-w-[16rem] rounded-md px-1.5 py-0.5 ${currentClassName}`}
              >
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default BreadcrumbNav;
