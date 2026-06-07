'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, Crop, X } from 'lucide-react';

/**
 * Creates an Image element from a source string.
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Avoid CORS issues
    image.src = url;
  });

/**
 * Generates the cropped image URL/base64 from the canvas.
 */
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas dimensions to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion of the image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return base64 string
  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!croppedAreaPixels || isCropping) return;
    try {
      setIsCropping(true);
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBase64);
    } catch (error) {
      console.error('Failed to crop image:', error);
      alert('Error cropping image. Please try again.');
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg glass-panel overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Crop className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold text-zinc-100">Crop Profile Photo (3:4)</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative flex-1 min-h-[350px] bg-zinc-900 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            classes={{
              containerClassName: 'bg-zinc-900',
              mediaClassName: 'max-w-none',
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6 border-t border-zinc-800 bg-zinc-950/90">
          {/* Zoom Slider */}
          <div className="flex items-center space-x-4">
            <ZoomOut className="w-4 h-4 text-zinc-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <ZoomIn className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400 w-8 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={isCropping}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCropSave}
              disabled={isCropping}
              className="px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-[0.98] transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isCropping ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                  <span>Cropping...</span>
                </>
              ) : (
                <span>Apply & Save</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
