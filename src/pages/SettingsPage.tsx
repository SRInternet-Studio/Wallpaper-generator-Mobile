import { useEffect, useState } from 'react';
import { Typography, Button, Paper, Box, TextField, CircularProgress } from '@mui/material';
import { getSetting, setSetting } from '../services/settings';
import { open } from '@tauri-apps/plugin-dialog';
import { downloadDir } from '@tauri-apps/api/path';

export default function SettingsPage() {
  const [downloadPath, setDownloadPath] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      let path = await getSetting<string>('download_path');
      if (!path) {
        path = await downloadDir();
      }
      setDownloadPath(path);
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSelectDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: await downloadDir(),
    });

    if (typeof selected === 'string') {
      setDownloadPath(selected);
    }
  };

  const handleSaveSettings = async () => {
    await setSetting('download_path', downloadPath);
    alert('设置已保存！');
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        设置
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          图片下载路径
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={downloadPath}
            InputProps={{
              readOnly: true,
            }}
          />
          <Button variant="outlined" onClick={handleSelectDirectory}>
            选择文件夹
          </Button>
        </Box>
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={handleSaveSettings}
        >
          保存设置
        </Button>
      </Box>
    </Paper>
  );
}
