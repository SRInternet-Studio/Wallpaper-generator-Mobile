import { useState, useRef } from 'react';
import {
  ImageList, ImageListItem, Box, Typography, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Button
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { invoke } from '@tauri-apps/api/core';
import { shareImage, downloadImage } from '../services/market';
import { useSnackbar } from '../context/SnackbarContext';
import { LocalImage } from '../pages/HomePage'; // Import the interface

type ImageSource = string | LocalImage;

interface ImageGridProps {
  images: ImageSource[];
  cols: number;
  onDelete?: (filePath: string) => void;
  onRename?: (oldPath: string, newName: string) => Promise<void>;
}

export default function ImageGrid({ images, cols, onDelete, onRename }: ImageGridProps) {
  const { showSnackbar } = useSnackbar();
  const [actionMenuImage, setActionMenuImage] = useState<ImageSource | null>(null);
  const [loadingAction, setLoadingAction] = useState<'share' | 'download' | 'copy' | 'delete' | 'rename' | null>(null);
  const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  if (images.length === 0) {
    return null;
  }

  const handleImageLongPress = (img: ImageSource) => {
    setActionMenuImage(img);
  };

  const handleActionMenuClose = () => {
    setActionMenuImage(null);
  };

  const handleRenameDialogOpen = () => {
    if (actionMenuImage) {
      const path = typeof actionMenuImage === 'string' ? actionMenuImage : actionMenuImage.path;
      const currentName = path.split(/[/\\]/).pop()?.split('.').slice(0, -1).join('.') || '';
      setNewImageName(currentName);
      setRenameDialogOpen(true);
      handleActionMenuClose();
    }
  };

  const handleRenameDialogClose = () => {
    setRenameDialogOpen(false);
    setNewImageName('');
  };

  const handleRenameAction = async () => {
    if (!actionMenuImage || !onRename || !newImageName.trim()) return;
    const path = typeof actionMenuImage === 'string' ? actionMenuImage : actionMenuImage.path;
    setLoadingAction('rename');
    try {
      await onRename(path, newImageName.trim());
      showSnackbar('重命名成功');
    } catch (error: any) {
      showSnackbar(error.message || '重命名失败');
    } finally {
      setLoadingAction(null);
      handleRenameDialogClose();
    }
  };

  const handleShareAction = async () => {
    if (!actionMenuImage) return;
    setLoadingAction('share');
    try {
      const isLocal = typeof actionMenuImage !== 'string';
      const path = isLocal ? actionMenuImage.path : actionMenuImage;

      if (isLocal) {
        // It's a local file, share directly
        const mimeType = path.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const title = path.split(/[/\\]/).pop() || 'image';
        await invoke("plugin:sharesheet|share_file", {
          file: path,
          options: { mimeType, title },
        });
      } else {
        // It's a remote URL, use the service to download and then share
        await shareImage(path);
      }
      showSnackbar('已调用分享菜单');
    } catch (error: any) {
      showSnackbar(error.message || '分享失败');
    } finally {
      setLoadingAction(null);
      handleActionMenuClose();
    }
  };

  const handleDeleteAction = async () => {
    if (!actionMenuImage || !onDelete) return;
    const path = typeof actionMenuImage === 'string' ? actionMenuImage : actionMenuImage.path;
    setLoadingAction('delete');
    try {
      // The actual file deletion is handled by the parent component via the callback
      onDelete(path);
      showSnackbar('图片已删除');
    } catch (error: any) {
      showSnackbar(error.message || '删除失败');
    } finally {
      setLoadingAction(null);
      handleActionMenuClose();
    }
  };

  const handleDownloadAction = async () => {
    if (!actionMenuImage || typeof actionMenuImage !== 'string') return;
    setLoadingAction('download');
    try {
      const fileName = await downloadImage(actionMenuImage);
      showSnackbar(`${fileName} 已保存。`);
    } catch (error: any) {
      showSnackbar(error.message || '下载失败');
    } finally {
      setLoadingAction(null);
      handleActionMenuClose();
    }
  };

  const handleCopyLinkAction = async () => {
    if (!actionMenuImage || typeof actionMenuImage !== 'string') return;
    setLoadingAction('copy');
    try {
      await writeText(actionMenuImage);
      showSnackbar('链接已复制');
    } catch (error: any) {
      showSnackbar(error.message || '复制失败');
    } finally {
      setLoadingAction(null);
      handleActionMenuClose();
    }
  };

  const handleTouchStart = (img: ImageSource) => {
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
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          提示：长按图片可进行分享或下载。
        </Typography>
        <ImageList variant="masonry" cols={cols} gap={8}>
          {images.map((image) => {
            const src = typeof image === 'string' ? image : image.src;
            const key = typeof image === 'string' ? image : image.path;
            return (
              <ImageListItem
                key={key}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleImageLongPress(image);
                }}
                onTouchStart={() => handleTouchStart(image)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd} // Cancel long press if finger moves
                sx={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', boxShadow: 4, border: '1px solid rgba(0, 0, 0, 0.1)' }}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                />
              </ImageListItem>
            );
          })}
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
            {actionMenuImage && typeof actionMenuImage === 'string' && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleCopyLinkAction}
                    disabled={!!loadingAction || actionMenuImage.startsWith('data:')}
                  >
                    <ListItemIcon>
                      {loadingAction === 'copy' ? <CircularProgress size={24} /> : <LinkIcon />}
                    </ListItemIcon>
                    <ListItemText primary="复制链接" />
                  </ListItemButton>
                </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleShareAction} disabled={!!loadingAction}>
                <ListItemIcon>
                  {loadingAction === 'share' ? <CircularProgress size={24} /> : <ShareIcon />}
                </ListItemIcon>
                <ListItemText primary="分享" />
              </ListItemButton>
            </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleDownloadAction} disabled={!!loadingAction}>
                    <ListItemIcon>
                      {loadingAction === 'download' ? <CircularProgress size={24} /> : <DownloadIcon />}
                    </ListItemIcon>
                    <ListItemText primary="下载" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
            {actionMenuImage && typeof actionMenuImage !== 'string' && onDelete && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleDeleteAction} disabled={!!loadingAction}>
                  <ListItemIcon>
                    {loadingAction === 'delete' ? <CircularProgress size={24} /> : <DeleteIcon />}
                  </ListItemIcon>
                  <ListItemText primary="删除" />
                </ListItemButton>
              </ListItem>
            )}
            {actionMenuImage && typeof actionMenuImage !== 'string' && onRename && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleRenameDialogOpen} disabled={!!loadingAction}>
                  <ListItemIcon>
                    {loadingAction === 'rename' ? <CircularProgress size={24} /> : <DriveFileRenameOutlineIcon />}
                  </ListItemIcon>
                  <ListItemText primary="重命名" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      <Dialog open={isRenameDialogOpen} onClose={handleRenameDialogClose}>
        <DialogTitle>重命名图片</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="新文件名 (不含扩展名)"
            type="text"
            fullWidth
            variant="standard"
            value={newImageName}
            onChange={(e) => setNewImageName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameAction()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameDialogClose}>取消</Button>
          <Button onClick={handleRenameAction} disabled={loadingAction === 'rename'}>
            {loadingAction === 'rename' ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
