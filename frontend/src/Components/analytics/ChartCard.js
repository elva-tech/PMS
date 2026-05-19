import React from "react";
import { ResponsiveContainer } from "recharts";
import { AnalyticsEmptyState } from "./AnalyticsStates";

const ChartCard = ({ title, subtitle, data, children, minHeight = 280 }) => {
  const hasData =
    Array.isArray(data) &&
    data.some((item) => {
      if (!item || typeof item !== "object") return false;
      return Object.values(item).some(
        (value) => typeof value === "number" && Number.isFinite(value) && value > 0
      );
    });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle ? <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {hasData ? (
        <div style={{ width: "100%", height: minHeight }}>
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      ) : (
        <AnalyticsEmptyState
          title="No data available"
          description="This chart will appear when records are available."
        />
      )}
    </div>
  );
};

export default ChartCard;
