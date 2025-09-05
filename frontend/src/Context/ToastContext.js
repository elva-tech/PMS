import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";

// Toast styles
const typeStyles = {
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  info: "bg-blue-500 text-white",
  warning: "bg-yellow-400 text-white",
};

const icons = {
  success: <CheckCircle className="w-6 h-6" />,
  error: <XCircle className="w-6 h-6" />,
  info: <Info className="w-6 h-6" />,
  warning: <AlertCircle className="w-6 h-6" />,
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

      <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50 max-w-full sm:max-w-sm md:max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start p-3 sm:p-4 rounded-md shadow-lg w-auto mx-2 sm:mx-0 sm:w-full ${
              typeStyles[toast.type]
            }`}
          >
            <div className="mr-2 sm:mr-3 mt-1 flex-shrink-0">
              {icons[toast.type]}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base truncate">
                {toast.title}
              </p>
              <p className="text-xs sm:text-sm break-words">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 sm:ml-3 flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
