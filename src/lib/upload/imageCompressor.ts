/**
 * Client-side Canvas Image Compressor
 * Automatically resizes high-resolution architecture diagrams and screenshots
 * to optimize bandwidth and speed up AI vision processing.
 */

export interface CompressOptions {
  maxDimension?: number;   // Max width or height in pixels (default 2048)
  quality?: number;        // WebP/JPEG quality from 0.1 to 1.0 (default 0.85)
  mimeType?: string;       // Target mime type (default 'image/webp')
}

export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  wasCompressed: boolean;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const { maxDimension = 2048, quality = 0.85, mimeType = 'image/webp' } = options;

  // If not an image or SVG, return as-is
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savedPercentage: 0,
      wasCompressed: false,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Check if resizing is needed
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          savedPercentage: 0,
          wasCompressed: false,
        });
        return;
      }

      // Fill white background for transparent images converted to jpeg
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Determine supported output format
      const targetMime = canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`)
        ? mimeType
        : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't reduce size, keep original
            resolve({
              file,
              originalSize: file.size,
              compressedSize: file.size,
              savedPercentage: 0,
              wasCompressed: false,
            });
            return;
          }

          const extension = targetMime === 'image/webp' ? '.webp' : '.jpg';
          const newName = file.name.replace(/\.[^/.]+$/, '') + extension;
          const compressedFile = new File([blob], newName, {
            type: targetMime,
            lastModified: Date.now(),
          });

          const savedPercentage = Math.round(((file.size - blob.size) / file.size) * 100);

          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: blob.size,
            savedPercentage,
            wasCompressed: true,
          });
        },
        targetMime,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn('[ImageCompressor] Error reading image file:', err);
      resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        savedPercentage: 0,
        wasCompressed: false,
      });
    };

    img.src = objectUrl;
  });
}
