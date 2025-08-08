import { Typography } from '@mui/material';
import FileManager from '../components/FileManager';

export default function HomePage() {
  return (
    <div>
      <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
        欢迎使用壁纸生成器
      </Typography>
      <Typography variant="body1">
        请从左侧导航栏选择一个功能开始。
      </Typography>
      <FileManager />
    </div>
  );
}
