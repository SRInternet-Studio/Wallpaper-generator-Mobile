import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { SnackbarProvider } from './context/SnackbarContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import SettingsPage from './pages/SettingsPage';
import GeneratorPage from './pages/GeneratorPage';
import "./App.css"; // Assuming you have a CSS file for global styles

function App() {
  useEffect(() => {
    // When the App component mounts, it means the frontend is ready.
    console.log('Frontend is ready, closing splashscreen.');
    invoke('set_complete', { task: 'frontend' });
  }, []); // Empty dependency array ensures this runs only once.

  return (
    <BrowserRouter>
      <SnackbarProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="market" element={<MarketPage />} />
            <Route path="market/:apiName" element={<GeneratorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </SnackbarProvider>
    </BrowserRouter>
  );
}

export default App;
