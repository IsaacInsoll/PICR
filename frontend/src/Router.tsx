import { Route, Routes } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';

export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path="/" element={<h1>PICR Server</h1>} />
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/admin/f/:folderId"
        element={loggedIn ? <ViewFolder rootFolderId="1" /> : <LoginForm />}
      />
      <Route path="/shared/:hash" element={<h1>Shared Path </h1>} />
    </Routes>
  );
};
