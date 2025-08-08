import { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, CardMedia, CircularProgress, Box, CardActionArea, Button, Divider, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getApiCategories, getApisByCategory, ApiSource, clearApiCache } from '../services/market';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';

let categorizedApiCache: Record<string, ApiSource[]> | null = null;

export default function MarketPage() {
  const [apiSources, setApiSources] = useState<Record<string, ApiSource[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchApis = async () => {
    setLoading(true);
    if (categorizedApiCache) {
      setApiSources(categorizedApiCache);
      setLoading(false);
      return;
    }
    const categories = await getApiCategories();
    const apisByCategory: Record<string, ApiSource[]> = {};
    for (const category of categories) {
      const apis = await getApisByCategory(category);
      if (apis.length > 0) {
        apisByCategory[category] = apis;
      }
    }
    categorizedApiCache = apisByCategory;
    setApiSources(apisByCategory);
    setLoading(false);
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleRefresh = () => {
    clearApiCache();
    categorizedApiCache = null;
    fetchApis();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredSources = selectedCategory === 'all'
    ? apiSources
    : { [selectedCategory]: apiSources[selectedCategory] };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          图片源市场
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>分类</InputLabel>
            <Select
              value={selectedCategory}
              label="分类"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="all">
                <em>全部</em>
              </MenuItem>
              {Object.keys(apiSources).map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
            刷新
          </Button>
        </Box>
      </Box>
      {Object.entries(filteredSources).map(([category, sources], index) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
            {category}
          </Typography>
          <Grid container spacing={3}>
            {sources.map((source) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={source.name}>
                <Card>
                  <CardActionArea component={Link} to={`/market/${source.name}`}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={source.content.icon || '/vite.svg'} // Use a placeholder if no icon
                      alt={source.content.friendly_name}
                      sx={{ objectFit: 'contain', paddingTop: '1em' }}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        {source.content.friendly_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {source.content.intro || '没有介绍。'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          {index < Object.keys(filteredSources).length - 1 && <Divider sx={{ my: 4 }} />}
        </Box>
      ))}
    </div>
  );
}
