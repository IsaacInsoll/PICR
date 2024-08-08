import { matchPath, Route, Routes } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';
import { ManageUsers } from './pages/ManageUsers';
import { PageNotFound } from './pages/PageNotFound';

//note: if adding public paths not starting with `/s/:uuid/*` then edit getUUID below as urqlClient.ts depends on it
export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path="/s/:uuid/:folderId/:fileId?" element={<ViewFolder />} />
      {loggedIn ? (
        <>
          <Route path="/admin/f/:folderId/:fileId?" element={<ViewFolder />} />
          <Route path="/admin/users/:userId?" element={<ManageUsers />} />
        </>
      ) : null}
      <Route path="*" element={loggedIn ? <PageNotFound /> : <LoginForm />} />
    </Routes>
  );
};

export const getUUID = () => {
  const match = matchPath({ path: '/s/:uuid/*' }, window.location.pathname);
  return match?.params.uuid;
};
