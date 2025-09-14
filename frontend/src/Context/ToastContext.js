import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

const typeStyles = {
  success: {
    bg: "bg-green-100",
    border: "border-green-400",
    text: "text-green-700",
  },
  error: {
    bg: "bg-red-100",
    border: "border-red-400",
    text: "text-red-700",
  },
  info: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-700",
  },
  warning: {
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-700",
  },
};

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
};

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto remove after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      <div className="fixed bottom-4 right-4 flex flex-col gap-4 z-50 max-w-full sm:max-w-sm md:max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between ${
              typeStyles[toast.type].bg
            } border ${
              typeStyles[toast.type].border
            } rounded-xl shadow-sm p-2 mx-2 sm:mx-0`}
          >
            <div className="flex gap-3 items-center flex-1">
              <div className="flex-shrink-0">{icons[toast.type]}</div>
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-semibold ${
                    typeStyles[toast.type].text
                  } text-sm sm:text-base truncate`}
                >
                  {toast.title}
                </span>
                <span
                  className={`text-sm ${
                    typeStyles[toast.type].text
                  } break-words`}
                >
                  {toast.message}
                </span>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
