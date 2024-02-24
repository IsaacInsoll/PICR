import { Route, Routes } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';
import { ReactNode } from 'react';
export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path="/" element={<h1>PICR Server</h1>} />
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/admin"
        element={loggedIn ? <ViewFolder /> : <LoginForm />}
      />
      <Route path="/shared/:hash" element={<h1>Shared Path </h1>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const NotFound = (): ReactNode => {
  return (
    <>
      <h1>404</h1>
      <h3>Not Found</h3>
    </>
  );
};
