import React from "react";

export const AnalyticsSkeleton = ({ cards = 4 }) => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-4 h-24">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border p-4 h-72" />
      <div className="bg-white rounded-lg border p-4 h-72" />
    </div>
  </div>
);

export const AnalyticsErrorState = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-700">
    <p className="font-medium mb-2">Unable to load analytics.</p>
    <p className="text-sm">{message || "Please try again."}</p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        Retry
      </button>
    ) : null}
  </div>
);

export const AnalyticsEmptyState = ({ title, description }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
    <p className="text-gray-800 font-semibold">{title}</p>
    <p className="text-gray-500 text-sm mt-1">{description}</p>
  </div>
);
