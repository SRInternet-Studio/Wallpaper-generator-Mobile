import { useState } from 'react';
import { Skeleton } from '@mui/material';

interface CachedImageProps {
  src: string;
  onImageLoad: (src: string, data: string) => void;
}

export default function CachedImage({ src, onImageLoad }: CachedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (src.startsWith('data:')) {
        setIsLoaded(true);
        onImageLoad(src, src); // Already base64
        return;
    }

    const img = event.currentTarget;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png'); // Or detect mime type
      onImageLoad(src, dataUrl);
    }
    setIsLoaded(true);
  };

  return (
    <>
      {!isLoaded && <Skeleton variant="rectangular" width="100%" height={150} />}
      <img
        src={src}
        onLoad={handleLoad}
        crossOrigin="anonymous"
        style={{ display: isLoaded ? 'block' : 'none', width: '100%' }}
        alt=""
        loading="lazy"
      />
    </>
  );
}
