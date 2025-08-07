import { AppBar, Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery, Theme, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

const navItems = [
  { text: '主页', path: '/', icon: <HomeIcon /> },
  { text: '图片源市场', path: '/market', icon: <StorefrontIcon /> },
  { text: '设置', path: '/settings', icon: <SettingsIcon /> },
];

export default function Layout() {
  const isWideScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
  const location = useLocation();

  const SideNav = () => (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  const BottomNav = () => (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.drawer + 1 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={location.pathname}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.text}
            label={item.text}
            value={item.path}
            icon={item.icon}
            component={Link}
            to={item.path}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ mt: 5, mb: 1 }}>
            壁纸生成器 NEXT
          </Typography>
        </Toolbar>
      </AppBar>
      
      {isWideScreen && <SideNav />}
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, pb: isWideScreen ? 3 : 8 }}>
        <Toolbar />
        <Outlet />
      </Box>

      {!isWideScreen && <BottomNav />}
    </Box>
  );
}
