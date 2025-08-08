import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Button, Paper, Box, CircularProgress, Grid, Dialog, DialogTitle,
  DialogContent, List, ListItem, ListItemIcon, ListItemText, IconButton, DialogActions, ListItemButton
} from '@mui/material';
import { downloadDir, tempDir, join, basename } from '@tauri-apps/api/path';
import { readDir, remove, stat, DirEntry, readFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import FolderIcon from '@mui/icons-material/Folder';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import { useSnackbar } from '../context/SnackbarContext';

interface EnhancedDirEntry extends DirEntry {
  size?: number;
  fullPath: string;
}

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const isImage = (fileName: string) => /\.(jpe?g|png|gif|webp)$/i.test(fileName);

// Recursive function to calculate directory size
async function calculateDirectorySize(path: string): Promise<number> {
  try {
    const entries = await readDir(path);
    let totalSize = 0;
    for (const entry of entries) {
      const fullPath = await join(path, entry.name);
      if (entry.isDirectory) {
        totalSize += await calculateDirectorySize(fullPath);
      } else if (entry.isFile) {
        const fileStat = await stat(fullPath);
        totalSize += fileStat.size;
      }
    }
    return totalSize;
  } catch (error) {
    console.error(`Could not read directory ${path}:`, error);
    return 0;
  }
}

export default function FileManager() {
  const [cachePath, setCachePath] = useState('');
  const [downloadPath, setDownloadPath] = useState('');
  const [cacheSize, setCacheSize] = useState(0);
  const [downloadSize, setDownloadSize] = useState(0);
  const [loading, setLoading] = useState<'cache' | 'download' | 'clearCache' | 'clearDownload' | 'share' | null>(null);
  const { showSnackbar } = useSnackbar();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogPath, setDialogPath] = useState('');
  const [dialogEntries, setDialogEntries] = useState<EnhancedDirEntry[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImagePath, setPreviewImagePath] = useState<string | null>(null);

  const refreshSizes = useCallback(async () => {
    setLoading('cache');
    const temp = await tempDir();
    setCacheSize(await calculateDirectorySize(temp));
    setLoading(null);

    setLoading('download');
    const down = await downloadDir();
    setDownloadSize(await calculateDirectorySize(down));
    setLoading(null);
  }, []);

  useEffect(() => {
    const loadPaths = async () => {
      setCachePath(await tempDir());
      setDownloadPath(await downloadDir());
    };
    loadPaths();
    refreshSizes();
  }, [refreshSizes]);

  const loadDirectoryEntries = async (path: string) => {
    setDialogLoading(true);
    try {
      const entries = await readDir(path);
      const enhancedEntries: EnhancedDirEntry[] = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = await join(path, entry.name);
          const fileStat = entry.isFile ? await stat(fullPath) : undefined;
          return { ...entry, size: fileStat?.size, fullPath };
        })
      );
      setDialogEntries(enhancedEntries);
    } catch (error) {
      showSnackbar(`无法读取目录: ${error}`);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleViewFiles = (path: string, title: string) => {
    setDialogPath(path);
    setDialogTitle(title);
    setDialogOpen(true);
    loadDirectoryEntries(path);
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      await remove(filePath, { recursive: true });
      showSnackbar('文件已删除');
      loadDirectoryEntries(dialogPath); // Refresh list
      refreshSizes(); // Refresh total size
    } catch (error) {
      showSnackbar(`删除失败: ${error}`);
    }
  };

  const handleClearDirectory = async (path: string, type: 'cache' | 'download') => {
    setLoading(type === 'cache' ? 'clearCache' : 'clearDownload');
    try {
      const entries = await readDir(path);
      for (const entry of entries) {
        const fullPath = await join(path, entry.name);
        await remove(fullPath, { recursive: true });
      }
      showSnackbar(`${type === 'cache' ? '缓存' : '下载'}目录已清空`);
      await refreshSizes();
    } catch (error) {
      showSnackbar(`清空失败: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const handlePreviewImage = async (filePath: string) => {
    try {
      const contents = await readFile(filePath);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(contents)));
      const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      setPreviewImageUrl(`data:${mimeType};base64,${base64}`);
      setPreviewImagePath(filePath);
    } catch (error) {
      showSnackbar(`无法预览图片: ${error}`);
    }
  };

  const handleShareFromPreview = async () => {
    if (previewImagePath) {
      setLoading('share');
      try {
        const title = await basename(previewImagePath);
        const mimeType = previewImagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        invoke("plugin:sharesheet|share_file", {
          file: previewImagePath,
          options: {
            mimeType,
            title,
          },
        });
        showSnackbar('已调用分享菜单');
      } catch (error: any) {
        showSnackbar(error.message || '分享失败');
      } finally {
        setLoading(null);
      }
    }
  };

  const closePreview = () => {
    setPreviewImageUrl(null);
    setPreviewImagePath(null);
  };

  return (
    <>
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>文件管理</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6">缓存目录</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', minHeight: '4.5em' }}>{cachePath}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                大小: {loading === 'cache' ? <CircularProgress size={16} /> : formatBytes(cacheSize)}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => handleViewFiles(cachePath, '缓存文件')} sx={{ mr: 1 }}>查看文件</Button>
                <Button variant="contained" color="error" onClick={() => handleClearDirectory(cachePath, 'cache')} disabled={loading === 'clearCache'}>
                  {loading === 'clearCache' ? <CircularProgress size={24} /> : '清空'}
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6">下载目录</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', minHeight: '4.5em' }}>{downloadPath}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                大小: {loading === 'download' ? <CircularProgress size={16} /> : formatBytes(downloadSize)}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => handleViewFiles(downloadPath, '下载文件')} sx={{ mr: 1 }}>查看文件</Button>
                <Button variant="contained" color="error" onClick={() => handleClearDirectory(downloadPath, 'download')} disabled={loading === 'clearDownload'}>
                  {loading === 'clearDownload' ? <CircularProgress size={24} /> : '清空'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        <Button variant="text" onClick={refreshSizes} sx={{ mt: 2 }}>刷新大小</Button>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {dialogLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <List>
              {dialogEntries.map((entry) => {
                const isImg = entry.isFile && isImage(entry.name);
                return (
                  <ListItem key={entry.name} disablePadding>
                    <ListItemButton onClick={isImg ? () => handlePreviewImage(entry.fullPath) : undefined}>
                      <ListItemIcon>
                        {entry.isDirectory ? <FolderIcon /> : isImg ? <ImageIcon /> : <FileIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={entry.name}
                        secondary={entry.isFile && entry.size !== undefined ? formatBytes(entry.size) : null}
                      />
                      {entry.isFile && (
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteFile(entry.fullPath)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!previewImageUrl} onClose={closePreview} maxWidth="lg">
        <DialogContent>
          <img src={previewImageUrl || ''} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShareFromPreview} disabled={loading === 'share'} startIcon={loading === 'share' ? <CircularProgress size={16} /> : <ShareIcon />}>
            分享
          </Button>
          <Button onClick={closePreview}>关闭</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
