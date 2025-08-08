import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from './context/SnackbarContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import SettingsPage from './pages/SettingsPage';
import GeneratorPage from './pages/GeneratorPage';
import "./App.css"; // Assuming you have a CSS file for global styles

function App() {
  return (
    <SnackbarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="market" element={<MarketPage />} />
            <Route path="market/:apiName" element={<GeneratorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;
