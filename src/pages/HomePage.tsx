import { useState, useEffect, useCallback } from 'react';
import { Typography, Box, CircularProgress, useMediaQuery, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { readDir, remove } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { getWallpapersDir } from '../services/market';
import ImageGrid from '../components/ImageGrid';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function HomePage() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));

  const maxCols = isXl ? 5 : isLg ? 4 : isMd ? 3 : isSm ? 2 : 1;
  const cols = images.length > 0 ? Math.min(maxCols, images.length) : maxCols;

  const handleDelete = async (filePath: string) => {
    try {
      await remove(filePath);
      setImages(prevImages => prevImages.filter(p => p !== filePath));
    } catch (error) {
      console.error("Failed to delete image:", error);
      // Optionally show a snackbar message here
    }
  };

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const wallpapersDir = await getWallpapersDir();
      const entries = await readDir(wallpapersDir);
      const imageEntries = entries.filter(entry =>
        entry.isFile && /\.(jpe?g|png|gif|webp)$/i.test(entry.name)
      );

      const imagePaths = await Promise.all(
        imageEntries.map(entry => join(wallpapersDir, entry.name))
      );

      // Pass the file paths directly to the ImageGrid, which will handle conversion
      setImages(imagePaths.reverse()); // Show newest first
    } catch (error) {
      console.error("Failed to load images from wallpapers directory:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0, mt: 2 }}>
          我的壁纸
        </Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadImages} disabled={loading}>
          刷新
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : images.length > 0 ? (
        <ImageGrid images={images} cols={cols} onDelete={handleDelete} />
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          这里还没有图片，快去“图片源市场”生成一些吧！
        </Typography>
      )}
    </div>
  );
}
