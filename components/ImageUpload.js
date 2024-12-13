import { useRef } from 'react';
import { Camera } from 'lucide-react';

export default function ImageUpload({ onImageSelect, previewUrl }) {
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Upload your photo
      </label>
      <div className="relative">
        {!previewUrl ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-2 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Camera className="w-10 h-10 text-gray-400" />
            <span className="text-sm text-gray-500">Tap to take a selfie</span>
          </button>
        ) : (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
