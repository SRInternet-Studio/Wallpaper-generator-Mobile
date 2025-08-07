import { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress, ImageList, ImageListItem, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getLocalImages } from '../services/market';

export default function HomePage() {
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));

  const maxCols = isXl ? 5 : isLg ? 4 : isMd ? 3 : isSm ? 2 : 1;
  const cols = localImages.length > 0 ? Math.min(maxCols, localImages.length) : maxCols;

  useEffect(() => {
    async function loadLocalImages() {
      setLoading(true);
      const images = await getLocalImages();
      setLocalImages(images);
      setLoading(false);
    }
    loadLocalImages();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        我下载的图片
      </Typography>
      {localImages.length > 0 ? (
        <ImageList variant="masonry" cols={cols} gap={8}>
          {localImages.map((img, index) => (
            <ImageListItem key={index} sx={{ borderRadius: '8px', overflow: 'hidden', boxShadow: 3 }}>
              <img
                src={img}
                alt={`local-image-${index}`}
                loading="lazy"
              />
            </ImageListItem>
          ))}
        </ImageList>
      ) : (
        <Typography variant="body1" color="text.secondary">
          你还没有下载任何图片。快去图片源市场看看吧！
        </Typography>
      )}
    </div>
  );
}
