import { Route, Routes } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<h1>PICR Server</h1>} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/shared/:hash" element={<h1>Shared Path </h1>} />
    </Routes>
  );
};
