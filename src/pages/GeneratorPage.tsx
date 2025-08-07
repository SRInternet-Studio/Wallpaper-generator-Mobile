import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, CircularProgress, TextField, Slider, Switch, FormControl, InputLabel, Select, MenuItem, Button, Paper, FormControlLabel, ImageList, ImageListItem, IconButton, ImageListItemBar } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { getApiByName, ApiSource, generateImages, shareImage, downloadImage } from '../services/market';

export default function GeneratorPage() {
  const { apiName } = useParams<{ apiName: string }>();
  const [apiSource, setApiSource] = useState<ApiSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  useEffect(() => {
    async function fetchApiDetails() {
      if (!apiName) return;
      setLoading(true);
      const api = await getApiByName(apiName);
      setApiSource(api);

      // Initialize form state with default values from the API config
      if (api?.content?.parameters) {
        const initialFormState: Record<string, any> = {};
        for (const param of api.content.parameters) {
          const key = param.name; // Keep the original name from the config
          if ((param.type === 'enum' || param.type === 'list') && Array.isArray(param.value)) {
            initialFormState[key] = param.value[0];
          } else {
            initialFormState[key] = param.value;
          }
        }
        setFormState(initialFormState);
      }

      setLoading(false);
    }
    fetchApiDetails();
  }, [apiName]);

  const handleFormChange = (name: string, value: any) => {
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleGenerateClick = async () => {
    if (!apiSource) return;
    setIsGenerating(true);
    setGeneratedImages([]);
    const imageUrls = await generateImages(apiSource, formState);
    setGeneratedImages(imageUrls);
    setIsGenerating(false);
  };

  const renderParameter = (param: any) => {
    console.log('Rendering parameter:', param);
    const { type, name, friendly_name, value, min_value, max_value, friendly_value } = param;

    switch (type) {
      case 'integer':
        return (
          <Box key={name} sx={{ mb: 2 }}>
            <Typography gutterBottom>{friendly_name}</Typography>
            <Slider
              value={formState[name] || value}
              onChange={(_, newValue) => handleFormChange(name, newValue)}
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
            key={name}
            control={
              <Switch
                checked={formState[name] || false}
                onChange={(e) => handleFormChange(name, e.target.checked)}
                name={name}
              />
            }
            label={friendly_name}
            sx={{ mb: 1 }}
          />
        );
      case 'enum':
        return (
          <FormControl fullWidth key={name} sx={{ mb: 2 }}>
            <InputLabel>{friendly_name}</InputLabel>
            <Select
              value={formState[name] || value[0]}
              label={friendly_name}
              onChange={(e) => handleFormChange(name, e.target.value)}
            >
              {(friendly_value || value).map((option: string, index: number) => (
                <MenuItem key={value[index]} value={value[index]}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'string':
        return (
          <TextField
            key={name}
            fullWidth
            label={friendly_name}
            value={formState[name] || value}
            onChange={(e) => handleFormChange(name, e.target.value)}
            sx={{ mb: 2 }}
          />
        );
      case 'list':
        return (
          <TextField
            key={name}
            fullWidth
            label={friendly_name}
            value={formState[name] || value.join(param.split_str || '|')}
            onChange={(e) => handleFormChange(name, e.target.value)}
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
        {apiSource.content.parameters?.filter((p: any) => p.enable !== false).map(renderParameter)}
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
          <ImageList variant="masonry" cols={3} gap={8}>
            {generatedImages.map((img) => (
              <ImageListItem key={img}>
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                />
                <ImageListItemBar
                  title=" " 
                  actionIcon={(
                    <>
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        aria-label={`share ${img}`}
                        onClick={() => shareImage(img)}
                      >
                        <ShareIcon />
                      </IconButton>
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        aria-label={`download ${img}`}
                        onClick={() => downloadImage(img)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </>
                  )}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}
    </Paper>
  );
}
