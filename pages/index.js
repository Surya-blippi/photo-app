// pages/index.js
import { useState, useCallback } from 'react';
import Head from 'next/head';
import { Camera, Loader, RefreshCw, Download, Image } from 'lucide-react';

const ASPECT_RATIOS = [
  { id: 'square', label: '1:1 Square', width: 1024, height: 1024 },
  { id: 'portrait', label: '9:16 Portrait', width: 896, height: 1152 },
  { id: 'landscape', label: '16:9 Landscape', width: 1152, height: 896 }
];

const CHARACTER_PRESETS = [
  {
    id: 'superwoman',
    label: 'Superwoman',
    prompt: "A strong curvy woman in Superwoman's iconic blue suit with the red \"S\" insignia glowing faintly, looking directly at the camera, her cape faintly fluttering in the wind, sunlight streaming behind her."
  },
  {
    id: 'superman',
    label: 'Superman',
    prompt: "A strong man in Superman's iconic blue suit with the red \"S\" insignia glowing faintly, looking directly at the camera, his cape faintly fluttering in the wind, sunlight streaming behind him."
  }
];

export default function Home() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationStatus, setGenerationStatus] = useState('');
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTER_PRESETS[0]);
  const [downloading, setDownloading] = useState(false);

  const downloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-image-${index + 1}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download image');
    }
  };

  const downloadAllImages = async () => {
    try {
      setDownloading(true);
      setGenerationStatus('Downloading images...');
      for (let i = 0; i < results.length; i++) {
        await downloadImage(results[i], i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Download all error:', error);
      setError('Failed to download all images');
    } finally {
      setDownloading(false);
      setGenerationStatus('');
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResults([]);
      setError(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setGenerationStatus('Uploading image...');

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image }),
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      const { imageUrl } = uploadData;
      setGenerationStatus('Starting image generation...');
      
      const predictionResponse = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          main_face_image: imageUrl,
          prompt: selectedCharacter.prompt,
          negative_prompt: "bad quality, worst quality, text, signature, watermark, extra limbs",
          num_outputs: 4,
          width: selectedRatio.width,
          height: selectedRatio.height,
          start_step: 4,
          guidance_scale: 4,
          id_weight: 1,
          num_steps: 20
        }),
      });

      const predictionData = await predictionResponse.json();

      if (!predictionResponse.ok) {
        throw new Error(predictionData.error || 'Generation failed');
      }

      if (!Array.isArray(predictionData)) {
        throw new Error('Invalid response from generation API');
      }

      setResults(predictionData);
      setGenerationStatus('');

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An unexpected error occurred');
      setGenerationStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AI Photo Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          AI Photo Generator
        </h1>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload your photo
              </label>
              <div className="relative">
                {!previewUrl ? (
                  <div className="w-full space-y-4">
                    <button
                      type="button"
                      onClick={() => document.querySelector('#galleryInput').click()}
                      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Image className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Choose from Gallery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => document.querySelector('#cameraInput').click()}
                      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Take a Photo</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl('');
                        setSelectedImage(null);
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Hidden inputs */}
                <input
                  id="cameraInput"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <input
                  id="galleryInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Output Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedRatio(ratio)}
                    className={`p-2 text-sm rounded-lg border ${
                      selectedRatio.id === ratio.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Character Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Character Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CHARACTER_PRESETS.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => setSelectedCharacter(character)}
                    className={`p-2 text-sm rounded-lg border ${
                      selectedCharacter.id === character.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {character.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try again</span>
                </button>
              </div>
            )}

            {/* Generate Button */}
            <button
              type="submit"
              disabled={!selectedImage || loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2 ${
                !selectedImage || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } transition-colors`}
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              <span>
                {loading 
                  ? generationStatus || 'Processing...'
                  : 'Generate Photos'
                }
              </span>
            </button>
          </form>

          {/* Results Display */}
          {Array.isArray(results) && results.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Generated Photos</h2>
                <button
                  onClick={downloadAllImages}
                  disabled={downloading}
                  className={`text-sm flex items-center space-x-1 ${
                    downloading 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  {downloading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{downloading ? 'Downloading...' : 'Download All'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {results.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Generated ${index + 1}`}
                      className="w-full rounded-lg"
                      style={{
                        aspectRatio: `${selectedRatio.width}/${selectedRatio.height}`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-lg">
                      <button
                        onClick={() => downloadImage(url, index)}
                        className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {index + 1}/4
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                Hover over an image to download it individually
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}