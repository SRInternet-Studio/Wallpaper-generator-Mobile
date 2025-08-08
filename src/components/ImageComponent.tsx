import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Button,
  Snackbar,
  IconButton,
} from '@mui/material';
import { fetch } from '@tauri-apps/plugin-http';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import { shareImage, downloadImage } from '../services/market';

interface ImageComponentProps {
  src: string;
}

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

export default function ImageComponent({ src }: ImageComponentProps) {
  const [imageData, setImageData] = useState<string | null>(null); // Stores the full base64 data
  const [isDownloading, setIsDownloading] = useState(false); // Tracks the background download
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  useEffect(() => {
    const downloadImageData = async () => {
      if (!src) return;

      if (src.startsWith('data:image')) {
        setImageData(src);
        setIsDownloading(false);
        return;
      }

      if (src.startsWith('http')) {
        setIsDownloading(true);
        setError(null);
        try {
          const response = await fetch(src, { method: 'GET' });
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
          
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          const buffer = await response.arrayBuffer();
          const base64Data = bufferToBase64(buffer, mimeType);
          setImageData(base64Data);
        } catch (e: any) {
          console.error(`Failed to download image data from ${src}`, e);
          setError('图片数据下载失败');
        } finally {
          setIsDownloading(false);
        }
      }
    };

    downloadImageData();
  }, [src]);

  const handleAction = (action: () => void) => {
    if (!imageData) {
      const message = isDownloading ? '图片仍在后台下载中，请稍后重试' : '图片数据未能下载，无法执行操作';
      setSnackbar({ open: true, message });
      return;
    }
    action();
  };

  const handleShare = () => handleAction(() => {
    if (imageData) shareImage(imageData);
    setIsMenuOpen(false);
  });

  const handleDownload = () => handleAction(() => {
    if (imageData) {
      const mimeType = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      setFileName(`wallpaper.${extension}`);
      setIsDownloadDialogOpen(true);
    }
    setIsMenuOpen(false);
  });
  
  const handleConfirmDownload = () => {
    if (imageData && fileName) {
      downloadImage(imageData, fileName);
    }
    setIsDownloadDialogOpen(false);
    setFileName('');
  };

  const handleCopyLink = () => {
    if (src.startsWith('http')) {
      writeText(src);
      setSnackbar({ open: true, message: '链接已复制' });
    }
    setIsMenuOpen(false);
  };

  const handleTouchStart = () => {
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setIsMenuOpen(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = () => {
    if (!longPressTriggered.current) {
      setIsModalOpen(true);
    }
  };

  const renderContent = () => {
    return (
      <Box sx={{ position: 'relative', width: '100%', background: '#f0f0f0', paddingTop: '100%' /* 1:1 Aspect Ratio */ }}>
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => {
            setError('图片加载失败');
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: error ? 0.5 : 1,
          }}
        />
        {error && !isDownloading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', backdropFilter: 'blur(2px)' }}>
            {error}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        setIsMenuOpen(true);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      sx={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', boxShadow: 3, border: '1px solid rgba(0, 0, 0, 0.1)' }}
    >
      {renderContent()}

      <Drawer
        anchor="bottom"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sx={{ zIndex: 1400 }}
        slotProps={{ paper: { sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } } }}
      >
        <Box sx={{ width: 'auto', pb: 2, pt: 1 }} role="presentation">
          <Box sx={{ width: 40, height: 5, backgroundColor: 'grey.300', borderRadius: 3, mx: 'auto', my: 1 }} />
          <List>
            {src.startsWith('http') && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleCopyLink}>
                  <ListItemIcon><LinkIcon /></ListItemIcon>
                  <ListItemText primary="复制链接" />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={handleShare}>
                <ListItemIcon><ShareIcon /></ListItemIcon>
                <ListItemText primary="分享" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleDownload}>
                <ListItemIcon><DownloadIcon /></ListItemIcon>
                <ListItemText primary="下载" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Dialog open={isDownloadDialogOpen} onClose={() => setIsDownloadDialogOpen(false)}>
        <DialogTitle>保存图片</DialogTitle>
        <DialogContent>
          <DialogContentText>请输入要保存的文件名：</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="文件名"
            type="text"
            fullWidth
            variant="standard"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDownloadDialogOpen(false)}>取消</Button>
          <Button onClick={handleConfirmDownload}>保存</Button>
        </DialogActions>
      </Dialog>

      {isModalOpen && (
        <Box
          sx={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1300,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <IconButton
            onClick={() => setIsModalOpen(false)}
            sx={{
              position: 'absolute', top: 16, right: 16, color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box onClick={(e) => e.stopPropagation()} sx={{ width: '90vw', height: '90vh', borderRadius: '8px', overflow: 'hidden' }}>
            <TransformWrapper>
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={imageData || src} alt="enlarged" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </TransformComponent>
            </TransformWrapper>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
