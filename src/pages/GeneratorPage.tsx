import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, CircularProgress, TextField, Slider, Switch, FormControl, InputLabel, Select, MenuItem, Button, Paper, FormControlLabel, ImageList, ImageListItem, IconButton, useMediaQuery, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Snackbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getApiByName, ApiSource, generateImages, shareImage, downloadImage } from '../services/market';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

export default function GeneratorPage() {
  const { apiName } = useParams<{ apiName: string }>();
  const [apiSource, setApiSource] = useState<ApiSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionMenuImage, setActionMenuImage] = useState<string | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));

  const maxCols = isXl ? 5 : isLg ? 4 : isMd ? 3 : isSm ? 2 : 1;
  const cols = generatedImages.length > 0 ? Math.min(maxCols, generatedImages.length) : maxCols;

  useEffect(() => {
    async function fetchApiDetails() {
      if (!apiName) return;
      setLoading(true);
      const api = await getApiByName(apiName);
      setApiSource(api);

      // Initialize form state with default values from the API config, using index as key
      if (api?.content?.parameters) {
        const initialFormState: Record<number, any> = {};
        api.content.parameters.forEach((param: any, index: number) => {
          if ((param.type === 'enum' || param.type === 'list') && Array.isArray(param.value)) {
            initialFormState[index] = param.value[0];
          } else {
            initialFormState[index] = param.value;
          }
        });
        setFormState(initialFormState);
      }

      setLoading(false);
    }
    fetchApiDetails();
  }, [apiName]);

  const handleFormChange = (index: number, value: any) => {
    setFormState(prevState => ({
      ...prevState,
      [index]: value,
    }));
  };

  const handleGenerateClick = async () => {
    if (!apiSource) return;
    setIsGenerating(true);
    setGeneratedImages([]);
    await generateImages(apiSource, formState, (newImage) => {
      setGeneratedImages(prevImages => [...prevImages, newImage]);
    });
    setIsGenerating(false);
  };

  const handleImageClick = (img: string) => {
    setSelectedImage(img);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

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

  const handleCopyLinkAction = () => {
    if (actionMenuImage && actionMenuImage.startsWith('http')) {
      writeText(actionMenuImage);
      setSnackbar({ open: true, message: '链接已复制' });
    }
    handleActionMenuClose();
  };

  const handleDownloadAction = () => {
    if (actionMenuImage) {
      const mimeType = actionMenuImage.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      setFileName(`wallpaper.${extension}`);
      setDownloadDialogOpen(true);
    }
    handleActionMenuClose();
  };

  const handleConfirmDownload = () => {
    if (actionMenuImage && fileName) {
      downloadImage(actionMenuImage, fileName);
    }
    setDownloadDialogOpen(false);
    setFileName('');
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

  const handleClick = (img: string) => {
    if (!longPressTriggered.current) {
      handleImageClick(img);
    }
  };

  const renderParameter = (param: any, index: number) => {
    console.log('Rendering parameter:', param);
    const { type, name, friendly_name, value, min_value, max_value, friendly_value } = param;

    switch (type) {
      case 'integer':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography gutterBottom>{friendly_name}</Typography>
            <Slider
              value={formState[index] || value}
              onChange={(_, newValue) => handleFormChange(index, newValue)}
              aria-labelledby="input-slider"
              valueLabelDisplay="auto"
              min={min_value}
              max={max_value}
            />
          </Box>
        );
      case 'boolean':
        return (
          <FormControlLabel
            key={index}
            control={
              <Switch
                checked={formState[index] || false}
                onChange={(e) => handleFormChange(index, e.target.checked)}
                name={name}
              />
            }
            label={friendly_name}
            sx={{ mb: 1 }}
          />
        );
      case 'enum':
        // Add a defensive check to ensure value is a non-empty array
        if (!Array.isArray(value) || value.length === 0) {
          return null;
        }
        return (
          <FormControl fullWidth key={index} sx={{ mb: 2 }}>
            <InputLabel>{friendly_name}</InputLabel>
            <Select
              value={formState[index] || value[0]}
              label={friendly_name}
              onChange={(e) => handleFormChange(index, e.target.value)}
            >
              {(friendly_value || value).map((option: string, i: number) => (
                // Use a more reliable key and ensure value exists
                <MenuItem key={`${name}-${i}-${value[i]}`} value={value[i]}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'string':
        return (
          <TextField
            key={index}
            fullWidth
            label={friendly_name}
            value={formState[index] || value}
            onChange={(e) => handleFormChange(index, e.target.value)}
            sx={{ mb: 2 }}
          />
        );
      case 'list':
        return (
          <TextField
            key={index}
            fullWidth
            label={friendly_name}
            value={formState[index] || value.join(param.split_str || '|')}
            onChange={(e) => handleFormChange(index, e.target.value)}
            helperText={`用 "${param.split_str || '|'}" 分隔`}
            sx={{ mb: 2 }}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!apiSource) {
    return <Typography variant="h5">未找到图片源: {apiName}</Typography>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {apiSource.content.friendly_name}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {apiSource.content.intro}
      </Typography>
      <Box component="form" noValidate autoComplete="off" sx={{ mt: 3 }}>
        {apiSource.content.parameters?.filter((p: any) => p.enable !== false).map((p: any, i: number) => renderParameter(p, i))}
        <Button
          variant="contained"
          size="large"
          sx={{ mt: 2 }}
          onClick={handleGenerateClick}
          disabled={isGenerating}
        >
          {isGenerating ? <CircularProgress size={24} /> : '生成'}
        </Button>
      </Box>

      {generatedImages.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            生成结果
          </Typography>
          <ImageList variant="masonry" cols={cols} gap={8}>
            {generatedImages.map((img) => (
              <ImageListItem
                key={img}
                onClick={() => handleClick(img)}
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
      )}

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
            {actionMenuImage && actionMenuImage.startsWith('http') && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleCopyLinkAction}>
                  <ListItemIcon>
                    <LinkIcon />
                  </ListItemIcon>
                  <ListItemText primary="复制链接" />
                </ListItemButton>
              </ListItem>
            )}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />

      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)}>
        <DialogTitle>保存图片</DialogTitle>
        <DialogContent>
          <DialogContentText>
            请输入要保存的文件名：
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="文件名"
            type="text"
            fullWidth
            variant="standard"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>取消</Button>
          <Button onClick={handleConfirmDownload}>保存</Button>
        </DialogActions>
      </Dialog>

      {selectedImage && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300, // Higher than other elements
          }}
        >
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box onClick={(e) => e.stopPropagation()} sx={{ width: '90vw', height: '90vh', borderRadius: '8px', overflow: 'hidden' }}>
            <TransformWrapper>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: '100%', height: '100%' }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={selectedImage} alt="enlarged" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </TransformComponent>
            </TransformWrapper>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
