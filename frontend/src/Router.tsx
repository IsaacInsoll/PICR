import { matchPath, Route, Routes } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';

//note: if adding public paths not starting with `/s/:uuid/*` then edit getUUID below as urqlClient.ts depends on it
export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path="/" element={<h1>PICR Server</h1>} />
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/admin/f/:folderId/:fileId?"
        element={loggedIn ? <ViewFolder /> : <LoginForm />}
      />
      <Route path="/s/:uuid/:folderId/:fileId?" element={<ViewFolder />} />
    </Routes>
  );
};

export const getUUID = () => {
  const match = matchPath({ path: '/s/:uuid/*' }, window.location.pathname);
  return match?.params.uuid;
};
