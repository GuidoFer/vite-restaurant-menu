import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import AdminDashboard from './pages/AdminDashboard'; // 1. Importar el nuevo panel
import NotFound from './pages/NotFound';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta para clientes */}
                <Route path="/menu/:sheetId/:restaurantSlug" element={<MenuPage />} />
                
                {/* 2. Ruta para el dueño (Admin) */}
                <Route path="/admin/:sheetId" element={<AdminDashboard />} />
                
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;