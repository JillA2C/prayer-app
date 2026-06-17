import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import EntryGate from './pages/EntryGate';  
import MyStatus from './pages/MyStatus';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Comments from './pages/admin/Comments';

function RequireAuth({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" />;
}

export default function App() {
  const entered = localStorage.getItem('entered') === 'true';
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={entered ? <Home /> : <EntryGate />} />
        <Route path="/my-status" element={<MyStatus />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/comments" element={<RequireAuth><Comments /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}