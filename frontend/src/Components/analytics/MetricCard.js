import React from "react";

const MetricCard = ({ title, value, helper }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl font-semibold text-gray-900 mt-1">{value}</h3>
      {helper ? <p className="text-xs text-gray-500 mt-1">{helper}</p> : null}
    </div>
  );
};

export default MetricCard;
