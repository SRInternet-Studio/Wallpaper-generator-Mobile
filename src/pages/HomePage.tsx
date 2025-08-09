import { useState, useEffect, useCallback } from 'react';
import { Typography, Box, CircularProgress, useMediaQuery, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { readDir, remove, stat, rename } from '@tauri-apps/plugin-fs';
import { join, dirname, extname } from '@tauri-apps/api/path';
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

  const handleRename = async (oldPath: string, newName: string) => {
    try {
      const dir = await dirname(oldPath);
      const ext = await extname(oldPath);
      const newPath = await join(dir, `${newName}.${ext}`);
      
      await rename(oldPath, newPath);

      setImages(prevImages =>
        prevImages.map(p => (p === oldPath ? newPath : p))
      );
    } catch (error) {
      console.error("Failed to rename image:", error);
      throw error; // Re-throw to be caught by the calling component
    }
  };

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

      // Get stats for each file to sort by modification time
      const filesWithStats = await Promise.all(imageEntries.map(async (entry) => {
        const path = await join(wallpapersDir, entry.name);
        const stats = await stat(path);
        return { path, mtime: stats.mtime };
      }));

      // Sort by modification time, newest first
      filesWithStats.sort((a, b) => {
        const timeA = a.mtime?.getTime() ?? 0;
        const timeB = b.mtime?.getTime() ?? 0;
        return timeB - timeA;
      });

      const sortedImagePaths = filesWithStats.map(file => file.path);

      setImages(sortedImagePaths);
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
        <ImageGrid images={images} cols={cols} onDelete={handleDelete} onRename={handleRename} />
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          这里还没有图片，快去“图片源市场”生成一些吧！
        </Typography>
      )}
    </div>
  );
}
