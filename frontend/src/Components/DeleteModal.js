import { X, Trash2 } from "lucide-react";

export default function DeleteModal({
  onConfirm,
  onCancel,
  title = "Delete",
  message = "Are you sure you want to delete?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon: CustomIcon,
  iconColor = "text-red-500",
  iconBgColor = "bg-red-100",
  confirmButtonColor = "bg-red-500 hover:bg-red-600",
  isLoading = false,
  plotNumber,
}) {
  const displayMessage = plotNumber
    ? `Are you sure you want to delete Plot ${plotNumber}?`
    : message;

  const IconComponent = CustomIcon || Trash2;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`${iconBgColor} p-3 rounded-full`}>
            <IconComponent className={`w-8 h-8 ${iconColor}`} />
          </div>
        </div>

        {/* Title & Message */}
        <h2 className="text-lg font-semibold text-center text-gray-800">
          {title}
        </h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          {displayMessage}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-lg text-white ${confirmButtonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
