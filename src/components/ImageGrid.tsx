import { useState, useRef } from 'react';
import { ImageList, ImageListItem, Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { shareImage, downloadImage } from '../services/market';

interface ImageGridProps {
  images: string[];
  cols: number;
}

export default function ImageGrid({ images, cols }: ImageGridProps) {
  const [actionMenuImage, setActionMenuImage] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  if (images.length === 0) {
    return null;
  }

  const handleImageLongPress = (img: string) => {
    setActionMenuImage(img);
  };

  const handleActionMenuClose = () => {
    setActionMenuImage(null);
  };

  const handleShareAction = () => {
    if (actionMenuImage) {
      shareImage(actionMenuImage);
    }
    handleActionMenuClose();
  };

  const handleDownloadAction = () => {
    if (actionMenuImage) {
      downloadImage(actionMenuImage);
    }
    handleActionMenuClose();
  };

  const handleTouchStart = (img: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      handleImageLongPress(img);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          生成结果
        </Typography>
        <ImageList variant="masonry" cols={cols} gap={8}>
          {images.map((img) => (
            <ImageListItem
              key={img}
              onContextMenu={(e) => {
                e.preventDefault();
                handleImageLongPress(img);
              }}
              onTouchStart={() => handleTouchStart(img)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd} // Cancel long press if finger moves
              sx={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', boxShadow: 4, border: '1px solid rgba(0, 0, 0, 0.1)' }}
            >
              <img
                src={img}
                alt=""
                loading="lazy"
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
      <Drawer
        anchor="bottom"
        open={!!actionMenuImage}
        onClose={handleActionMenuClose}
        sx={{ zIndex: 1400 }} // Higher than the image modal
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
          },
        }}
      >
        <Box
          sx={{ width: 'auto', pb: 2, pt: 1 }}
          role="presentation"
        >
          <Box
            sx={{
              width: 40,
              height: 5,
              backgroundColor: 'grey.300',
              borderRadius: 3,
              mx: 'auto',
              my: 1,
            }}
          />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleShareAction}>
                <ListItemIcon>
                  <ShareIcon />
                </ListItemIcon>
                <ListItemText primary="分享" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleDownloadAction}>
                <ListItemIcon>
                  <DownloadIcon />
                </ListItemIcon>
                <ListItemText primary="下载" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
