import { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, CardMedia, CircularProgress, Box, CardActionArea, Button } from '@mui/material';
import { getAllApis, ApiSource, clearApiCache } from '../services/market';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function MarketPage() {
  const [apiSources, setApiSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApis = async () => {
    setLoading(true);
    const apis = await getAllApis();
    setApiSources(apis);
    setLoading(false);
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleRefresh = () => {
    clearApiCache();
    fetchApis();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          图片源市场
        </Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          刷新
        </Button>
      </Box>
      <Grid container spacing={3}>
        {apiSources.map((source) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={source.name}>
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
    </div>
  );
}
