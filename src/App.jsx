// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      {/* El :slug captura el nombre del restaurante de la URL (ej: /demo-restaurant).
        Cualquier otra URL que no coincida (path="*") va a la página NotFound.
      */}
      <Routes>
        <Route path="/:slug" element={<MenuPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;