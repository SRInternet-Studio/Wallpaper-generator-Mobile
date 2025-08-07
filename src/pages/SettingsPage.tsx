import { useEffect, useState } from 'react';
import { Typography, Button, Paper, Box, TextField, CircularProgress, Switch, FormControlLabel, IconButton, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getSetting, setSetting } from '../services/settings';
import { downloadDir } from '@tauri-apps/api/path';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { clearApiCache } from '../services/market';

export default function SettingsPage() {
  const [downloadPath, setDownloadPath] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [githubPat, setGithubPat] = useState('');
  const [useStaticIndex, setUseStaticIndex] = useState(true);
  const [githubApiUrl, setGithubApiUrl] = useState('');
  const [staticApiUrl, setStaticApiUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const path = await downloadDir();
      setDownloadPath(path);

      const pat = await getSetting<string>('github_pat');
      setGithubPat(pat || '');

      const staticIndex = await getSetting<boolean>('use_static_index');
      setUseStaticIndex(staticIndex === null ? true : staticIndex);

      const githubUrl = await getSetting<string>('github_api_url');
      setGithubApiUrl(githubUrl || 'https://api.github.com/repos/IntelliMarkets/Wallpaper_API_Index/contents/');

      const staticUrl = await getSetting<string>('static_api_url');
      setStaticApiUrl(staticUrl || 'https://acgapi.sr-studio.cn/');
      
      setLoading(false);
    }
    loadSettings();
  }, []);


  const handleSaveSettings = async () => {
    await setSetting('github_pat', githubPat);
    await setSetting('use_static_index', useStaticIndex);
    await setSetting('github_api_url', githubApiUrl);
    await setSetting('static_api_url', staticApiUrl);
    clearApiCache();
    setSnackbar({ open: true, message: '设置已保存！' });
  };

  const handleCopyPath = async () => {
    if (downloadPath) {
      await writeText(downloadPath);
      setSnackbar({ open: true, message: '路径已复制到剪贴板' });
    }
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
        <Typography variant="body1" color="text.secondary">
          所有图片将自动保存至应用的专属下载目录中，卸载应用时数据将被清除。
        </Typography>
        <Paper variant="outlined" sx={{ p: 1, mt: 1, display: 'flex', alignItems: 'center', backgroundColor: 'action.hover' }}>
          <Typography sx={{ wordBreak: 'break-all', flexGrow: 1 }}>{downloadPath}</Typography>
          <IconButton onClick={handleCopyPath} size="small">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          GitHub 个人访问令牌 (PAT)
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={githubPat}
          onChange={(e) => setGithubPat(e.target.value)}
          placeholder="ghp_..."
          helperText={
            <span>
              用于提高 API 请求速率限制。
              <a href="https://github.com/SRInternet-Studio/Wallpaper-generator-Mobile/blob/main/PAT_GUIDE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9', textDecoration: 'underline' }}>
                查看如何创建个人访问令牌 (PAT)
              </a>
            </span>
          }
        />
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          商店加载设置
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={useStaticIndex}
              onChange={(e) => setUseStaticIndex(e.target.checked)}
            />
          }
          label="使用静态索引加载商店"
        />
        <Typography variant="body2" color="text.secondary">
          从静态索引地址加载商店内容，可以提高加载速度并减少对 GitHub API 的依赖。
        </Typography>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          高级设置
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          label="GitHub API 地址"
          value={githubApiUrl}
          onChange={(e) => setGithubApiUrl(e.target.value)}
          sx={{ mb: 2 }}
          helperText="用于从 GitHub 加载商店内容的 API 地址。"
        />
        <TextField
          fullWidth
          variant="outlined"
          label="静态索引地址"
          value={staticApiUrl}
          onChange={(e) => setStaticApiUrl(e.target.value)}
          helperText="用于从静态网站加载商店内容的地址。"
        />
      </Box>
      <Button
        variant="contained"
        sx={{ mt: 3 }}
        onClick={handleSaveSettings}
      >
        保存设置
      </Button>
    </Paper>
  );
}
