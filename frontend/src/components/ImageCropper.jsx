import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

export const ImageCropper = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    aspect: 1,
    x: 10,
    y: 10
  });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef(null);

  const getCroppedImg = useCallback(() => {
    if (!imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (crop.x / 100) * image.width * scaleX,
      y: (crop.y / 100) * image.height * scaleY,
      width: (crop.width / 100) * image.width * scaleX,
      height: (crop.height / 100) * image.height * scaleY
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.save();
    
    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

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

    ctx.restore();

    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageUrl);
    onClose();
  }, [crop, rotation, onCropComplete, onClose]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>تعديل الصورة</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-full p-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleZoomOut}
              className="rounded-full"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleZoomIn}
              className="rounded-full"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleRotate}
              className="rounded-full"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Image Cropper */}
          <div className="max-h-[400px] overflow-hidden rounded-lg border-2 border-dashed border-gray-300">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    maxHeight: '350px',
                    transition: 'transform 0.2s'
                  }}
                />
              </ReactCrop>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={getCroppedImg}
              className="flex-1 bg-[#3d2b1f] text-white hover:bg-[#5d4033] rounded-full"
            >
              <Check className="w-4 h-4 ml-2" />
              اعتماد
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
