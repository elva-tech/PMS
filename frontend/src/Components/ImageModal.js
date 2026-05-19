import React from "react";
import { X } from "lucide-react";

const ImageModal = ({ imageUrl, altText, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X size={24} />
        </button>
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

export default ImageModal;
