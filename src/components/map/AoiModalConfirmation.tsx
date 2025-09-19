import { X, MapPin, Calendar, Tag } from "lucide-react";

interface AoiConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
  onDeleteFromMap: () => void;
  aoiData: {
    name: string;
    area: string;
    coordinates: string;
    type: string;
    created_at: Date;
  };
}

const AoiConfirmationModal = ({
  isOpen,
  onClose,
  onAddToCart,
  onDeleteFromMap,
  aoiData,
}: AoiConfirmationModalProps) => {
  if (!isOpen) return null;

  const handleAddToCart = () => {
    onAddToCart();
    onClose();
  };

  const handleDeleteFromMap = () => {
    onDeleteFromMap();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            AOI Created Successfully
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Your Area of Interest has been created. What would you like to do
              with it?
            </p>

            {/* AOI Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Name:
                  </span>
                  <span className="text-sm text-gray-900 ml-2">
                    {aoiData.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Type:
                  </span>
                  <span className="text-sm text-gray-900 ml-2">
                    {aoiData.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Area:
                  </span>
                  <span className="text-sm text-gray-900 ml-2 font-semibold">
                    {aoiData.area}
                  </span>
                </div>
              </div>

              <details className="mt-3">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  View Coordinates
                </summary>
                <div className="mt-2 p-2 bg-white rounded border text-xs font-mono text-gray-600 max-h-20 overflow-y-auto">
                  {aoiData.coordinates}
                </div>
              </details>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAddToCart}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add to Cart
            </button>

            <button
              onClick={handleDeleteFromMap}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete from Map
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Keep on Map (No Cart)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AoiConfirmationModal;
