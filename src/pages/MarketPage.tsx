import { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, CardMedia, CircularProgress, Box, CardActionArea } from '@mui/material';
import { getAllApis, ApiSource } from '../services/market';
import { Link } from 'react-router-dom';

export default function MarketPage() {
  const [apiSources, setApiSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApis() {
      setLoading(true);
      const apis = await getAllApis();
      setApiSources(apis);
      setLoading(false);
    }
    fetchApis();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        图片源市场
      </Typography>
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
